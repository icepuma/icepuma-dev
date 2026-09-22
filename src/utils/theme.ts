const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";
export type Origin = { x: number; y: number };

let currentTheme: Theme = "system";
let storageAvailable = true;
let themeChange = 0;
let irisChange = 0;

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

// The distance from the origin to the farthest viewport corner, so the iris
// always finishes with the whole page revealed.
export function irisRadius(
	x: number,
	y: number,
	width: number,
	height: number,
) {
	return Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
}

function openIris(origin: Origin) {
	const root = document.documentElement;
	if (typeof root.animate !== "function") return;
	const { x, y } = origin;
	const radius = irisRadius(x, y, window.innerWidth, window.innerHeight);
	root.animate(
		{
			clipPath: [
				`circle(0px at ${x}px ${y}px)`,
				`circle(${radius}px at ${x}px ${y}px)`,
			],
		},
		{
			duration: 600,
			easing: "cubic-bezier(0.65, 0, 0.35, 1)",
			pseudoElement: "::view-transition-new(root)",
		},
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
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		typeof document.startViewTransition !== "function"
	) {
		apply();
		return theme;
	}

	const root = document.documentElement;
	// setTheme advances themeChange, so the iris keeps a counter of its own.
	const iris = origin ? ++irisChange : 0;
	const closeIris = () => {
		if (iris && iris === irisChange) delete root.dataset.themeIris;
	};
	try {
		// While the iris runs, CSS drops the default crossfade.
		if (iris) root.dataset.themeIris = "";
		const transition = document.startViewTransition(apply);
		void transition.ready
			.then(() => {
				if (origin && iris === irisChange) openIris(origin);
			}, apply)
			.catch(() => {});
		void transition.finished?.then(closeIris, closeIris);
	} catch {
		closeIris();
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
