const THEME_KEY = "theme";
const THEME_EVENT = "theme-change";

export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

function isTheme(value: string | null): value is Theme {
	return value === "dark" || value === "light" || value === "system";
}

function getStoredTheme(): Theme {
	const storedTheme = localStorage.getItem(THEME_KEY);
	return isTheme(storedTheme) ? storedTheme : "system";
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
	const htmlElement = document.documentElement;
	const resolvedTheme = resolveTheme(theme);
	htmlElement.setAttribute("data-theme", resolvedTheme);
	htmlElement.dataset.themeChoice = theme;
	htmlElement.style.colorScheme = resolvedTheme;
}

export function setTheme(theme: Theme) {
	localStorage.setItem(THEME_KEY, theme);
	applyTheme(theme);
	window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
	return theme;
}

export function loadTheme(): Theme {
	const theme = getStoredTheme();
	applyTheme(theme);
	return theme;
}

export function setupThemeListener(callback: (theme: Theme) => void) {
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	const handleSystemThemeChange = () => {
		const currentTheme = getStoredTheme();
		if (currentTheme === "system") {
			applyTheme("system");
			callback("system");
		}
	};

	const handleThemeChange = (event: Event) => {
		const customEvent = event as CustomEvent<Theme>;
		callback(customEvent.detail);
	};

	mediaQuery.addEventListener("change", handleSystemThemeChange);
	window.addEventListener(THEME_EVENT, handleThemeChange);

	return () => {
		mediaQuery.removeEventListener("change", handleSystemThemeChange);
		window.removeEventListener(THEME_EVENT, handleThemeChange);
	};
}
