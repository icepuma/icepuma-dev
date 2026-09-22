import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const musicUrls = [
	"https://www.youtube.com/@tortugaroom",
	"https://www.youtube.com/@yoyakurecordstore",
	"https://www.youtube.com/@EPHIMERATulum",
	"https://www.youtube.com/@REANALOG",
	"https://www.youtube.com/@StilvorTalentTv",
	"https://www.youtube.com/@Twilight441",
	"https://www.youtube.com/@Latelier__de__Musique",
	"https://www.youtube.com/@EuropeanMetalChannelOfficial",
] as const;

function readFile(path: string) {
	return readFileSync(join(repoRoot, path), "utf8");
}

function htmlText(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function yamlValues(path: string, key: string) {
	const pattern = new RegExp(`^\\s*${key}:\\s*(?:"([^"]*)"|(.+))$`, "gm");
	return Array.from(readFile(path).matchAll(pattern), (match) =>
		(match[1] ?? match[2]).trim(),
	);
}

function projectEntries() {
	return readdirSync(join(repoRoot, "src/content/projects"))
		.filter((file) => file.endsWith(".md"))
		.map((file) => {
			const source = readFile(`src/content/projects/${file}`);
			const [, frontmatter, description] = source.split("---");
			const value = (key: string) =>
				frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();

			return {
				description: description.trim(),
				name: value("name"),
				order: Number(value("order")),
				url: value("url"),
			};
		})
		.sort((left, right) => left.order - right.order);
}

function matchingTags(page: string, tag: string, attribute: string) {
	return Array.from(
		page.matchAll(
			new RegExp(`<${tag}\\b(?=[^>]*\\b${attribute}\\b)[^>]*>`, "g"),
		),
	);
}

test("the built homepage keeps its public content available without JavaScript", () => {
	const pagePath = join(repoRoot, "dist/index.html");
	if (!existsSync(pagePath)) {
		throw new Error("Run bun run build before this content regression test.");
	}
	const page = readFileSync(pagePath, "utf8");
	const projects = projectEntries();
	const projectRows = Array.from(
		page.matchAll(/<a\b(?=[^>]*\bproject-row\b)[^>]*\bhref="([^"]+)"[^>]*>/g),
		(match) => match[1],
	);

	expect(projectRows).toEqual(projects.map((project) => project.url));
	for (const project of projects) {
		expect(page).toContain(`<h3>${htmlText(project.name)}</h3>`);
		expect(page).toContain(`<p>${htmlText(project.description)}</p>`);
	}

	const stackCategories = yamlValues(
		"src/content/stack/stack.yaml",
		"category",
	);
	const stackItems = Array.from(
		readFile("src/content/stack/stack.yaml").matchAll(/^ {4}- (.+)$/gm),
		(match) => match[1],
	);
	expect(matchingTags(page, "div", "stack-row")).toHaveLength(7);
	expect(stackCategories).toHaveLength(7);
	expect(stackItems).toHaveLength(21);
	for (const category of stackCategories)
		expect(page).toContain(htmlText(category));
	for (const item of stackItems) expect(page).toContain(htmlText(item));
	const stackLinks = Array.from(
		page.matchAll(/<a\b(?=[^>]*\bstack-link\b)[^>]*>([\s\S]*?)<\/a>/g),
	);
	expect(stackLinks).toHaveLength(stackItems.length);
	for (const [index, [link, contents]] of stackLinks.entries()) {
		expect(link).toMatch(/\bhref="https:\/\/[^"\s]+"/);
		expect(link).toContain('target="_blank"');
		expect(link).toContain('rel="noopener noreferrer"');
		expect(contents.trim().split("<")[0].trim()).toBe(
			htmlText(stackItems[index]),
		);
		expect(contents).toContain("(opens in a new tab)");
	}

	const calendarDays = yamlValues("src/content/calendar/schedule.yaml", "day");
	const calendarFocus = yamlValues(
		"src/content/calendar/schedule.yaml",
		"focus",
	);
	expect(matchingTags(page, "div", "calendar-row")).toHaveLength(7);
	expect(calendarDays).toHaveLength(7);
	expect(calendarFocus).toHaveLength(7);
	for (const day of calendarDays)
		expect(page).toContain(`<dt>${htmlText(day)}</dt>`);
	for (const focus of calendarFocus) expect(page).toContain(htmlText(focus));

	const socialUrls = yamlValues("src/content/socials/links.yaml", "url");
	expect(matchingTags(page, "a", "social-row")).toHaveLength(4);
	expect(socialUrls).toHaveLength(4);
	for (const url of socialUrls) expect(page).toContain(`href="${url}"`);

	expect(page).toContain(
		"Principal Engineer with 15+ years of experience shipping end-to-end. Specializing in high-reliability systems, platform engineering, and monolith-to-microservices migrations.",
	);
	const employerLink = page.match(
		/<a\b(?=[^>]*\bhref="https:\/\/dataciders\.com\/")[^>]*>([\s\S]*?)<\/a>/,
	);
	expect(employerLink?.[1]).toContain("Dataciders GmbH");
	expect(page).toMatch(/icepuma\.dev — \d{4}/);

	const musicLists = Array.from(
		page.matchAll(/<ul\b([^>]*\bmusic-list\b[^>]*)>([\s\S]*?)<\/ul>/g),
	);
	expect(musicLists).toHaveLength(1);
	const [[, musicListAttributes, musicListHtml]] = musicLists;
	expect(musicListAttributes).not.toMatch(/\bhidden\b/);
	const renderedMusicUrls = Array.from(
		musicListHtml.matchAll(
			/<a\b(?=[^>]*\bmusic-row\b)[^>]*\bhref="([^"]+)"[^>]*>/g,
		),
		(match) => match[1],
	);
	expect(renderedMusicUrls).toEqual(musicUrls);
	expect(musicListHtml).not.toContain("<button");
	expect(page).not.toContain("data-music-");
	expect(page).not.toMatch(/\b(?:menu|nav|row|section)-number\b/);

	const navigation = page.match(
		/<nav\b(?=[^>]*\bsection-nav\b)[^>]*>([\s\S]*?)<\/nav>/,
	);
	expect(navigation).not.toBeNull();
	expect(navigation?.[0]).not.toMatch(/\bhidden\b/);
	expect(page).not.toContain("explore-menu");
	expect(page).not.toContain("circuit-mark");
	const sectionUrls = Array.from(
		navigation?.[1].matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/g) ?? [],
		(match) => match[1],
	);
	expect(sectionUrls).toEqual([
		"#projects",
		"#about",
		"#stack",
		"#calendar",
		"#music",
		"#social",
	]);
	const topLinks = Array.from(
		page.matchAll(
			/<a\b(?=[^>]*\bdata-back-to-top\b)[^>]*\bhref="([^"]+)"[^>]*>/g,
		),
		(match) => match[1],
	);
	expect(topLinks).toEqual(["/", "/"]);
	expect(page).not.toMatch(/<header\b[^>]*\bid="top"/);
	const brand = page.match(/<a\b(?=[^>]*\bbrand\b)[^>]*>([\s\S]*?)<\/a>/);
	expect(brand?.[1]).not.toContain("<svg");
});

test("the HUD layer ships no live data and stays out of the accessibility tree", () => {
	const pagePath = join(repoRoot, "dist/index.html");
	if (!existsSync(pagePath)) {
		throw new Error("Run bun run build before this content regression test.");
	}
	const page = readFileSync(pagePath, "utf8");

	expect(page).toContain("viewport-fit=cover");
	expect(page).not.toMatch(/<canvas\b/);
	expect(page).not.toContain("refractive");
	expect(page).not.toContain("data-inspect-link");
	expect(page).not.toContain("decode-mask");

	// The clock and today's focus are filled in by the browser, in Berlin
	// time, so nothing live is baked into the build.
	expect(page).toMatch(
		/<dl\b(?=[^>]*\bdata-hud-readout\b)(?=[^>]*\bhidden\b)[^>]*>/,
	);
	expect(page).toMatch(/<time\b[^>]*\bdata-hud-clock\b[^>]*><\/time>/);
	expect(page).toMatch(/<dd\b[^>]*\bdata-hud-today\b[^>]*><\/dd>/);

	const schedule = "src/content/calendar/schedule.yaml";
	const days = yamlValues(schedule, "day");
	const focus = yamlValues(schedule, "focus");
	const rows = Array.from(
		page.matchAll(/<div\b(?=[^>]*\bcalendar-row\b)[^>]*>/g),
		([tag]) => [
			tag.match(/\bdata-day="([^"]*)"/)?.[1],
			tag.match(/\bdata-focus="([^"]*)"/)?.[1],
		],
	);
	expect(rows).toEqual(days.map((day, index) => [day, focus[index]]));

	const dial = page.match(
		/<div\b(?=[^>]*\bdata-hud-dial\b)[^>]*>([\s\S]*?)<span class="dial-centre"/,
	);
	expect(dial?.[0]).toContain('aria-hidden="true"');
	const arcs = Array.from(
		dial?.[1]?.matchAll(
			/<path\b(?=[^>]*\bdial-day\b)[^>]*\bdata-day="([^"]+)"/g,
		) ?? [],
		(match) => match[1],
	);
	expect(arcs).toEqual(days);
	const labels = Array.from(
		dial?.[1]?.matchAll(
			/<span\b[^>]*\bdata-day="[^"]+"[^>]*>([^<]*)<\/span>/g,
		) ?? [],
		(match) => match[1],
	);
	expect(labels).toEqual(days.map((day) => day.toUpperCase()));
	expect(dial?.[1]).not.toMatch(/>[^<]*\d[^<]*</);

	const subLabels = Array.from(
		page.matchAll(/<span\b(?=[^>]*\bsection-sub\b)[^>]*>([^<]*)<\/span>/g),
	);
	expect(subLabels.map((match) => match[1])).toEqual([
		"開発",
		"経歴",
		"使用技術",
		"週間予定",
		"音楽",
		"連絡先",
	]);
	for (const [tag] of subLabels) {
		expect(tag).toContain('lang="ja"');
		expect(tag).toContain('aria-hidden="true"');
	}
});
