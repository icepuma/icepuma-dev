const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";
// Where a change starts, and the radius of the control there, which takes
// the new palette at once.
export type Origin = { x: number; y: number; r?: number };

let currentTheme: Theme = "system";
let storageAvailable = true;
let themeChange = 0;
let transitionChange = 0;

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

type Viewport = { width: number; height: number };

// How far the reveal travels from the knob to reach the farthest corner.
export function revealRadius(origin: Origin, viewport: Viewport) {
	return Math.ceil(
		Math.max(
			Math.hypot(origin.x, origin.y),
			Math.hypot(viewport.width - origin.x, origin.y),
			Math.hypot(origin.x, viewport.height - origin.y),
			Math.hypot(viewport.width - origin.x, viewport.height - origin.y),
		),
	);
}

// The band of rings that trails the reveal's edge, sized to the screen.
export function revealBand(viewport: Viewport) {
	const short = Math.min(viewport.width, viewport.height);
	return Math.round(Math.min(Math.max(short * 0.2, 80), 200));
}

// Everything CSS needs to draw the reveal: where it starts, the disc there
// that takes the new palette at once, the ring band, and how far the band's
// edge travels to pass the farthest corner.
export function revealGeometry(origin: Origin, viewport: Viewport) {
	const band = revealBand(viewport);
	return {
		"--reveal-x": `${Math.round(origin.x)}px`,
		"--reveal-y": `${Math.round(origin.y)}px`,
		"--reveal-core": `${Math.round(origin.r ?? 0)}px`,
		"--reveal-band": `${band}px`,
		"--reveal-to": `${revealRadius(origin, viewport) + band}px`,
	};
}

type Transition = { skipTransition?: () => void };
let activeTransition: Transition | undefined;

// While a view transition runs the page takes no pointer input. The knob
// calls this to end a reveal early when it is pressed again.
export function interruptThemeTransition() {
	const transition = activeTransition;
	if (!transition) return false;
	activeTransition = undefined;
	transition.skipTransition?.();
	return true;
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

	// From the knob the new palette spreads out from under it, trailing a band
	// of rings like the knob's own spun face; CSS runs it. Reduced motion and
	// forced colours keep a plain crossfade instead.
	const still =
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		window.matchMedia("(forced-colors: active)").matches;
	const root = document.documentElement;
	const reveal =
		origin && !still
			? revealGeometry(origin, {
					width: window.innerWidth,
					height: window.innerHeight,
				})
			: null;
	// setTheme advances themeChange, so transitions keep a counter of their
	// own: only the latest one lets go of the page.
	const owner = ++transitionChange;
	let transition: Transition | undefined;
	let done = false;
	const finish = () => {
		done = true;
		if (activeTransition === transition) activeTransition = undefined;
		if (owner !== transitionChange) return;
		delete root.dataset.themeChanging;
		delete root.dataset.themeReveal;
	};
	// The old page is captured. Everything the change touches lands in one
	// style pass: the hold on every other transition, the reveal, and the
	// palette itself.
	const update = () => {
		if (applied || change !== themeChange) return;
		if (!done && owner === transitionChange) {
			root.dataset.themeChanging = "";
			if (reveal) {
				for (const [name, value] of Object.entries(reveal))
					root.style.setProperty(name, value);
				root.dataset.themeReveal = "";
			}
		}
		apply();
	};
	try {
		const started = document.startViewTransition(update);
		activeTransition = transition = started;
		void started.ready.catch(update);
		void started.finished?.then(finish, finish);
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
