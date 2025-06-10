const THEME_KEY = "terminal-theme";

export type Theme = "dark" | "light" | "system";

export function applyTheme(theme: "dark" | "light") {
	const htmlElement = document.documentElement;
	if (theme === "dark") {
		htmlElement.classList.add("dark");
	} else {
		htmlElement.classList.remove("dark");
	}
}

export function setTheme(theme: Theme) {
	localStorage.setItem(THEME_KEY, theme);
	if (theme === "system") {
		const systemPrefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		applyTheme(systemPrefersDark ? "dark" : "light");
	} else {
		applyTheme(theme);
	}
	return theme;
}

export function loadTheme(): Theme {
	const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
	if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
		setTheme(savedTheme);
		return savedTheme;
	}
	setTheme("system");
	return "system";
}

export function setupThemeListener(callback: (theme: Theme) => void) {
	const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

	prefersDarkScheme.addEventListener("change", (e) => {
		const currentTheme = localStorage.getItem(THEME_KEY) as Theme;
		if (currentTheme === "system") {
			applyTheme(e.matches ? "dark" : "light");
		}
	});

	// Listen for custom theme change events
	window.addEventListener("theme-change", ((e: CustomEvent) => {
		const newTheme = e.detail as Theme;
		setTheme(newTheme);
		callback(newTheme);
	}) as EventListener);
}
