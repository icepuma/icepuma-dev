const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";
export type Origin = { x: number; y: number };

let currentTheme: Theme = "system";
let storageAvailable = true;
let themeChange = 0;
let revealChange = 0;

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

const REVEAL_DURATION = 820;
const REVEAL_EASING = "cubic-bezier(0.37, 0, 0.63, 1)";

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

// The reveal grows until its ring band has passed the farthest corner.
export function revealFrames(radius: number, band: number) {
	return ["0px", `${radius + band}px`];
}

// Starts the reveal on the new palette and hands back its animation, or
// null when the engine cannot animate the pseudo-element.
function runReveal(radius: number, band: number): Animation | null {
	const root = document.documentElement;
	if (typeof root.animate !== "function") return null;
	try {
		// Hold the last frame: the transition is torn down a frame after the
		// animation ends, and without a fill the old palette would flash back.
		return root.animate(
			{ "--reveal": revealFrames(radius, band) },
			{
				duration: REVEAL_DURATION,
				easing: REVEAL_EASING,
				fill: "forwards",
				pseudoElement: "::view-transition-new(root)",
			},
		);
	} catch {
		return null;
	}
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
	// of rings like the knob's own spun face. Reduced motion and forced
	// colours keep a plain crossfade instead.
	const still =
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		window.matchMedia("(forced-colors: active)").matches;
	const root = document.documentElement;
	// setTheme advances themeChange, so the reveal keeps a counter of its own.
	const reveal = origin && !still ? ++revealChange : 0;
	const viewport = { width: window.innerWidth, height: window.innerHeight };
	const band = reveal ? revealBand(viewport) : 0;
	const radius = reveal && origin ? revealRadius(origin, viewport) : 0;
	let transition: Transition | undefined;
	let animation: Animation | null = null;
	const current = () => reveal !== 0 && reveal === revealChange;
	const finish = () => {
		animation?.cancel();
		if (activeTransition === transition) activeTransition = undefined;
		if (current()) delete root.dataset.themeReveal;
	};
	try {
		if (reveal && origin) {
			root.style.setProperty("--reveal-x", `${Math.round(origin.x)}px`);
			root.style.setProperty("--reveal-y", `${Math.round(origin.y)}px`);
			root.style.setProperty("--reveal-band", `${band}px`);
			root.dataset.themeReveal = "";
		}
		const started = document.startViewTransition(apply);
		activeTransition = transition = started;
		void started.ready
			.then(() => {
				if (!current()) return;
				animation = runReveal(radius, band);
				// Without the animation the new palette would stay masked, so
				// fall back to the crossfade.
				if (!animation) delete root.dataset.themeReveal;
			}, apply)
			.catch(() => {});
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
