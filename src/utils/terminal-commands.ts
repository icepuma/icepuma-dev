import moviesData from "../data/movies.json";

export interface Command {
	name: string;
	description: string;
	execute: (args: string[]) => string | HTMLElement;
}

interface MovieData {
	title: string;
	url: string;
}

export const argumentMap: Record<string, string[]> = {
	mode: ["dark", "light", "system"],
};

export const socialLinks = [
	{ name: "GitHub", url: "https://github.com/icepuma" },
	{ name: "Korora Tech", url: "https://github.com/korora-tech" },
	{ name: "Rawkode Academy", url: "https://github.com/RawkodeAcademy" },
	{ name: "Bluesky", url: "https://bsky.app/profile/icepuma.dev" },
	{ name: "LinkedIn", url: "https://www.linkedin.com/in/stefan-ruzitschka/" },
	{ name: "Letterboxd", url: "https://letterboxd.com/icepuma/" },
];

export const projects = [
	{
		name: "cidrrr",
		description: "CLI tool for converting CIDR blocks to IP lists.",
		url: "https://github.com/korora-tech/cidrrr",
		role: "Author",
		stack: ["Rust", "CLI"],
	},
	{
		name: "fbtoggl",
		description: "Interact with track.toggl.com via terminal.",
		url: "https://github.com/icepuma/fbtoggl",
		role: "Author",
		stack: ["Rust", "CLI"],
	},
	{
		name: "icepuma.dev",
		description: "My personal website with terminal interface.",
		url: "https://github.com/icepuma/icepuma-dev",
		role: "Author",
		stack: ["TypeScript", "Astro", "Tailwind CSS", "Bun"],
	},
	{
		name: "rawkode.studio",
		description: "A subproject within Rawkode Academy monorepository.",
		url: "https://github.com/RawkodeAcademy/RawkodeAcademy/tree/main/projects/rawkode.studio",
		role: "Maintainer",
		stack: ["TypeScript", "Astro", "Drizzle ORM", "Bun"],
	},
	{
		name: "temps",
		description: "Library for parsing human-readable time expressions.",
		url: "https://github.com/korora-tech/temps",
		role: "Author",
		stack: ["Rust", "chrono", "jiff"],
	},
];

export function createGridElement(
	columns: string[],
	gap = "0.25rem 1rem",
): HTMLDivElement {
	const container = document.createElement("div");
	container.style.display = "grid";
	container.style.gridTemplateColumns = columns.join(" ");
	container.style.gap = gap;
	return container;
}

export function createLinkElement(
	text: string,
	href: string,
	classes: string[] = [],
): HTMLAnchorElement {
	const link = document.createElement("a");
	link.textContent = text;
	link.href = href;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	if (classes.length) link.classList.add(...classes);
	return link;
}

export const commands: Record<string, Command> = {
	help: {
		name: "help",
		description: "Lists all available commands.",
		execute: () => {
			const container = createGridElement(["max-content", "1fr"]);
			container.classList.add("my-0");

			const sortedCommands = Object.values(commands).sort((a, b) =>
				a.name.localeCompare(b.name),
			);
			for (const cmd of sortedCommands) {
				const nameElement = document.createElement("strong");
				nameElement.textContent = cmd.name;
				container.appendChild(nameElement);

				const descriptionElement = document.createElement("span");
				descriptionElement.textContent = cmd.description;
				container.appendChild(descriptionElement);
			}

			return container;
		},
	},

	clear: {
		name: "clear",
		description: "Clears the terminal screen.",
		execute: () => {
			const outputElement = document.getElementById("output");
			const terminalWrapper = document.getElementById("terminal-wrapper");
			if (outputElement && terminalWrapper) {
				outputElement.innerHTML = "";
				terminalWrapper.scrollTop = terminalWrapper.scrollHeight;
			}
			return "";
		},
	},

	mode: {
		name: "mode",
		description: "Sets the terminal theme. Usage: mode <dark|light|system>",
		execute: (args) => {
			const newTheme = args[0]?.toLowerCase();
			if (newTheme && ["light", "dark", "system"].includes(newTheme)) {
				// Theme setting will be handled by the component
				window.dispatchEvent(
					new CustomEvent("theme-change", { detail: newTheme }),
				);
				return `Theme set to ${newTheme}`;
			}
			return "Invalid theme. Use: mode <dark|light|system>";
		},
	},

	links: {
		name: "links",
		description: "Displays links to my profiles.",
		execute: () => {
			const container = document.createElement("div");
			container.classList.add("mt-1");
			const grid = createGridElement(["max-content", "1fr"]);

			for (const link of socialLinks) {
				const nameSpan = document.createElement("span");
				nameSpan.textContent = link.name;
				nameSpan.classList.add(
					"font-semibold",
					"text-[var(--nord-neofetch-label)]",
					"whitespace-nowrap",
				);

				const urlAnchor = createLinkElement(link.url, link.url, [
					"text-[var(--nord-link)]",
					"underline",
					"inline-block",
					"break-all",
					"w-max",
				]);

				grid.appendChild(nameSpan);
				grid.appendChild(urlAnchor);
			}

			container.appendChild(grid);
			return container;
		},
	},

	bio: {
		name: "bio",
		description: "Displays a short biography.",
		execute: () => {
			const container = document.createElement("div");
			container.classList.add("mt-1");

			const bioText = `I'm a 38-year-old software developer based in Berlin, Germany.
I currently live on a small island with my wife and our 3-year-old black lab.

My interests include:
- 3D printing
- Sci-fi (especially Stargate SG-1 and Warhammer 40k)
- Open Source, with a particular fondness for Rust.

I also contribute to building <a href="https://rawkode.studio" target="_blank" rel="noopener noreferrer" class="text-[var(--nord-link)] underline">rawkode.studio</a> for the <a href="https://rawkode.academy" target="_blank" rel="noopener noreferrer" class="text-[var(--nord-link)] underline">Rawkode Academy</a>.`;

			const preElement = document.createElement("pre");
			preElement.classList.add("my-0", "whitespace-pre-wrap");
			preElement.innerHTML = bioText;

			container.appendChild(preElement);
			return container;
		},
	},

	projects: {
		name: "projects",
		description: "Lists all my projects.",
		execute: () => {
			const container = document.createElement("div");
			container.classList.add("mt-1");
			const grid = createGridElement([
				"max-content",
				"max-content",
				"max-content",
				"max-content",
			]);

			// Add column headers
			const headers = ["Project", "Description", "Role", "Stack"];
			for (const headerText of headers) {
				const header = document.createElement("div");
				header.textContent = headerText;
				header.classList.add(
					"font-bold",
					"text-[var(--nord-header)]",
					"whitespace-nowrap",
					"pb-1",
				);
				grid.appendChild(header);
			}

			// Add separator
			const separator = document.createElement("div");
			separator.style.gridColumn = "span 4";
			separator.style.borderBottom = "1px solid var(--nord-border)";
			separator.style.marginBottom = "0.5rem";
			grid.appendChild(separator);

			for (const project of projects) {
				const nameLink = createLinkElement(project.name, project.url, [
					"font-semibold",
					"text-[var(--nord-link)]",
					"underline",
					"whitespace-nowrap",
				]);

				const description = document.createElement("span");
				description.textContent = project.description;

				const role = document.createElement("span");
				role.textContent = project.role || "-";
				role.classList.add("whitespace-nowrap", "text-[var(--nord-accent)]");

				const stack = document.createElement("span");
				stack.textContent = project.stack ? project.stack.join(", ") : "-";
				stack.classList.add("text-[var(--nord-text-secondary)]", "text-sm");

				grid.appendChild(nameLink);
				grid.appendChild(description);
				grid.appendChild(role);
				grid.appendChild(stack);
			}

			container.appendChild(grid);
			return container;
		},
	},

	movies: {
		name: "movies",
		description: "Displays my watched movies from Letterboxd.",
		execute: () => {
			const container = document.createElement("div");
			container.classList.add("mt-1");

			// Header
			const headerLine = document.createElement("div");
			headerLine.classList.add("mb-3", "flex", "items-center", "gap-2");

			const summary = document.createElement("span");
			summary.innerHTML = `<strong>Movies watched:</strong> ${moviesData.length}`;
			summary.classList.add("text-[var(--nord-text-secondary)]");

			const spacer = document.createElement("span");
			spacer.textContent = "•";
			spacer.classList.add("text-[var(--nord-text-secondary)]");

			const anchor = createLinkElement(
				"View on Letterboxd",
				"https://letterboxd.com/icepuma/films/",
				["text-[var(--nord-link)]", "underline"],
			);

			headerLine.appendChild(summary);
			headerLine.appendChild(spacer);
			headerLine.appendChild(anchor);
			container.appendChild(headerLine);

			// Movies grid
			const moviesList = document.createElement("div");
			moviesList.style.display = "grid";
			moviesList.style.gridTemplateColumns = "repeat(2, 1fr)";
			moviesList.style.gap = "0.25rem 1rem";
			moviesList.style.gridAutoFlow = "column";

			const totalMovies = moviesData.length;
			const rowsOnMobile = Math.ceil(totalMovies / 2);
			const rowsOnDesktop = Math.ceil(totalMovies / 4);

			moviesList.style.gridTemplateRows = `repeat(${rowsOnMobile}, minmax(0, 1fr))`;
			moviesList.id = "movies-grid";

			// Add responsive style
			const style = document.createElement("style");
			style.textContent = `
				@media (min-width: 768px) {
					#movies-grid {
						grid-template-columns: repeat(4, 1fr) !important;
						grid-template-rows: repeat(${rowsOnDesktop}, minmax(0, 1fr)) !important;
					}
				}
			`;
			container.appendChild(style);

			// Add movies
			for (const movie of moviesData as MovieData[]) {
				const movieLine = document.createElement("div");
				movieLine.classList.add("text-sm", "truncate");

				const link = createLinkElement(movie.title, movie.url, [
					"text-[var(--nord-link)]",
					"hover:underline",
				]);

				movieLine.appendChild(link);
				moviesList.appendChild(movieLine);
			}

			container.appendChild(moviesList);
			return container;
		},
	},
};
