const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";
export type Origin = { x: number; y: number };

let currentTheme: Theme = "system";
let storageAvailable = true;
let themeChange = 0;
let scanChange = 0;
let activeBeam: HTMLElement | undefined;

function isTheme(value: string | undefined | null): value is Theme {
	return value === "dark" || value === "light" || value === "system";
}

function getStoredTheme(): Theme | null {
	if (!storageAvailable) return null;

	try {
		const storedTheme = window.localStorage.getItem(THEME_KEY);
		return isTheme(storedTheme) ? storedTheme : null;
	} catch {
		storageAvailable = false;
		return null;
	}
}

function getDocumentTheme(): Theme | null {
	const theme = document.documentElement.dataset.themeChoice;
	return isTheme(theme) ? theme : null;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
	if (theme === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	return theme;
}

export function applyTheme(theme: Theme) {
	currentTheme = theme;

	const htmlElement = document.documentElement;
	const resolvedTheme = resolveTheme(theme);
	htmlElement.setAttribute("data-theme", resolvedTheme);
	htmlElement.dataset.themeChoice = theme;
	htmlElement.style.colorScheme = resolvedTheme;
}

export function setTheme(theme: Theme) {
	themeChange += 1;
	applyTheme(theme);

	if (storageAvailable) {
		try {
			window.localStorage.setItem(THEME_KEY, theme);
		} catch {
			storageAvailable = false;
		}
	}

	window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
	return theme;
}

function getCurrentResolvedTheme(): ResolvedTheme {
	const theme = document.documentElement.getAttribute("data-theme");
	return theme === "dark" || theme === "light"
		? theme
		: resolveTheme(currentTheme);
}

const SCAN_DURATION = 900;
const SCAN_EASING = "cubic-bezier(0.37, 0, 0.63, 1)";
const SCAN_BEAM = 24;

// The scan's travel: the old palette's mask slides up by the viewport plus
// the raster band, and the beam rides the band's front edge down the page.
export function scanFrames(viewport: number, band: number) {
	const travel = viewport + band;
	return {
		mask: [`0 ${-travel}px`, "0 0px"],
		beam: [
			`translateY(${-SCAN_BEAM / 2}px)`,
			`translateY(${travel - SCAN_BEAM / 2}px)`,
		],
	};
}

export function scanBand(viewport: number) {
	return Math.round(Math.min(Math.max(viewport * 0.2, 120), 240));
}

function mountBeam(origin: Origin) {
	const beam = document.createElement("div");
	beam.className = "theme-scan";
	beam.setAttribute("aria-hidden", "true");
	beam.style.setProperty("--scan-x", `${Math.round(origin.x)}px`);
	document.body.append(beam);
	return beam;
}

function runScan(band: number) {
	const root = document.documentElement;
	if (typeof root.animate !== "function") return;
	const frames = scanFrames(window.innerHeight, band);
	// Hold the last frame: the transition is torn down a frame after the
	// animations end, and without a fill the old palette would flash back.
	const timing = {
		duration: SCAN_DURATION,
		easing: SCAN_EASING,
		fill: "forwards" as const,
	};
	root.animate(
		{
			maskPosition: frames.mask.map(
				(position) => `${position}, ${position}, 0 0`,
			),
		},
		{ ...timing, pseudoElement: "::view-transition-old(root)" },
	);
	root.animate(
		{ transform: frames.beam },
		{ ...timing, pseudoElement: "::view-transition-group(theme-scan)" },
	);
}

export function setThemeWithTransition(theme: Theme, origin?: Origin) {
	const change = ++themeChange;
	let applied = false;
	const apply = () => {
		if (applied || change !== themeChange) return;
		applied = true;
		setTheme(theme);
	};

	if (
		getCurrentResolvedTheme() === resolveTheme(theme) ||
		typeof document.startViewTransition !== "function"
	) {
		apply();
		return theme;
	}

	// From the theme button the new palette is written in by a scan line.
	// Reduced motion and forced colours keep a plain crossfade instead.
	const still =
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		window.matchMedia("(forced-colors: active)").matches;
	const root = document.documentElement;
	// setTheme advances themeChange, so the scan keeps a counter of its own.
	const scan = origin && !still ? ++scanChange : 0;
	const band = scan ? scanBand(window.innerHeight) : 0;
	let beam: HTMLElement | undefined;
	const finish = () => {
		beam?.remove();
		if (scan && scan === scanChange) delete root.dataset.themeScan;
	};
	try {
		if (scan) {
			activeBeam?.remove();
			root.style.setProperty("--scan-band", `${band}px`);
			root.dataset.themeScan = "";
		}
		const transition = document.startViewTransition(() => {
			apply();
			// The beam exists only in the new state, so it is never part of
			// the old snapshot it sweeps across.
			if (origin && scan) activeBeam = beam = mountBeam(origin);
		});
		void transition.ready
			.then(() => {
				if (scan && scan === scanChange) runScan(band);
			}, apply)
			.catch(() => {});
		void transition.finished?.then(finish, finish);
	} catch {
		finish();
		apply();
	}

	return theme;
}

export function loadTheme(): Theme {
	const theme = getStoredTheme() ?? getDocumentTheme() ?? currentTheme;
	applyTheme(theme);
	return theme;
}

export function setupThemeListener(callback: (theme: Theme) => void) {
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	const handleSystemThemeChange = () => {
		if (currentTheme !== "system") return;

		applyTheme(currentTheme);
		callback(currentTheme);
	};

	const handleThemeChange = (event: Event) => {
		const theme = (event as CustomEvent<Theme>).detail;
		if (isTheme(theme)) callback(theme);
	};

	mediaQuery.addEventListener("change", handleSystemThemeChange);
	window.addEventListener(THEME_EVENT, handleThemeChange);

	return () => {
		mediaQuery.removeEventListener("change", handleSystemThemeChange);
		window.removeEventListener(THEME_EVENT, handleThemeChange);
	};
}
