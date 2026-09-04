const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

let currentTheme: Theme = "system";
let storageAvailable = true;
let themeChange = 0;

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

export function setThemeWithTransition(theme: Theme) {
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

	try {
		const transition = document.startViewTransition(apply);
		void transition.ready.catch(apply).catch(() => {});
	} catch {
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
