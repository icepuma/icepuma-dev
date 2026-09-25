import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type NavigationModule = typeof import("../src/utils/navigation");
type NavigationFactory = (
	window: object,
	document: object,
) => Pick<
	NavigationModule,
	"initBackToTop" | "initSectionNavigation" | "initHeaderState"
>;
type ClickOptions = Partial<{
	altKey: boolean;
	button: number;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}>;

const navigationSource = readFileSync(
	fileURLToPath(new URL("../src/utils/navigation.ts", import.meta.url)),
	"utf8",
).replaceAll("export ", "");
const createNavigation = new Function(
	"window",
	"document",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${navigationSource}\nreturn { initBackToTop, initSectionNavigation, initHeaderState };`,
	),
) as NavigationFactory;

function createLink() {
	const focusCalls: Array<{ preventScroll?: boolean } | undefined> = [];
	const element = Object.assign(new EventTarget(), {
		focus(options?: { preventScroll?: boolean }) {
			focusCalls.push(options);
		},
	});
	return { element, focusCalls };
}

function createFixture(reducedMotion = false) {
	const brand = createLink();
	const footer = createLink();
	const sectionIds = [
		"projects",
		"about",
		"stack",
		"calendar",
		"music",
		"social",
	];
	const sectionTops = Object.fromEntries(
		sectionIds.map((id, index) => [id, 160 + index * 220]),
	);
	const navLinks = sectionIds.map((id) => createNavLink(id));
	const sections = Object.fromEntries(
		sectionIds.map((id) => [id, createSection(id, sectionTops)]),
	);
	let headerBottom = 80;
	let scrollY = 0;
	let viewportHeight = 800;
	let scrollHeight = 2_000;
	let nextFrame = 1;
	const frames = new Map<number, (time: number) => void>();
	const historyCalls: Array<[unknown, string, string]> = [];
	const scrollCalls: Array<Record<string, unknown>> = [];
	const window = Object.assign(new EventTarget(), {
		history: {
			replaceState: (...args: [unknown, string, string]) =>
				historyCalls.push(args),
		},
		location: { pathname: "/", search: "?from=test", hash: "#calendar" },
		matchMedia: () => ({ matches: reducedMotion }),
		requestAnimationFrame(callback: (time: number) => void) {
			const id = nextFrame++;
			frames.set(id, callback);
			return id;
		},
		cancelAnimationFrame(id: number) {
			frames.delete(id);
		},
		scrollTo: (options: Record<string, unknown>) => scrollCalls.push(options),
	});
	Object.defineProperties(window, {
		innerHeight: { get: () => viewportHeight },
		scrollY: { get: () => scrollY },
	});
	const documentElementAttributes = new Map<string, string>();
	const document = {
		documentElement: {
			get scrollHeight() {
				return scrollHeight;
			},
			getAttribute: (name: string) =>
				documentElementAttributes.get(name) ?? null,
			removeAttribute: (name: string) => documentElementAttributes.delete(name),
			setAttribute: (name: string, value: string) =>
				documentElementAttributes.set(name, value),
		},
		querySelectorAll: (selector: string) =>
			selector === "[data-back-to-top]"
				? [brand.element, footer.element]
				: selector === ".nav-link"
					? navLinks.map(({ element }) => element)
					: [],
		querySelector: (selector: string) =>
			selector === ".brand"
				? brand.element
				: selector === ".site-header"
					? {
							getBoundingClientRect: () =>
								({ bottom: headerBottom }) as DOMRect,
						}
					: null,
		getElementById: (id: string) => sections[id] ?? null,
	};
	function flushFrame(time = 16) {
		const callbacks = [...frames.values()];
		frames.clear();
		for (const callback of callbacks) callback(time);
	}

	return {
		brand,
		document,
		footer,
		flushFrame,
		headerBottom: (value: number) => {
			headerBottom = value;
		},
		historyCalls,
		navLinks,
		scrollPosition: (value: number) => {
			scrollY = value;
		},
		scrollSize: (height: number, viewport = viewportHeight) => {
			scrollHeight = height;
			viewportHeight = viewport;
		},
		scrollCalls,
		sections,
		sectionTops,
		window,
	};
}

function createSection(id: string, tops: Record<string, number>) {
	const attributes = new Map<string, string>();
	return {
		getBoundingClientRect: () => ({ top: tops[id] }) as DOMRect,
		getAttribute: (name: string) => attributes.get(name) ?? null,
		removeAttribute: (name: string) => attributes.delete(name),
		setAttribute: (name: string, value: string) => attributes.set(name, value),
	};
}

function createNavLink(id: string) {
	const attributes = new Map<string, string>([["href", `#${id}`]]);
	const element = Object.assign(new EventTarget(), {
		get hash() {
			return `#${id}`;
		},
		getAttribute(name: string) {
			return attributes.get(name) ?? null;
		},
		removeAttribute(name: string) {
			attributes.delete(name);
		},
		setAttribute(name: string, value: string) {
			attributes.set(name, value);
		},
	});

	return { element, id };
}

function click(link: EventTarget, options: ClickOptions = {}) {
	const event = Object.assign(new Event("click", { cancelable: true }), {
		altKey: false,
		button: 0,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
		...options,
	});
	link.dispatchEvent(event);
	return event;
}

function init(fixture: ReturnType<typeof createFixture>) {
	createNavigation(fixture.window, fixture.document).initBackToTop();
}

function initSectionNavigation(fixture: ReturnType<typeof createFixture>) {
	createNavigation(fixture.window, fixture.document).initSectionNavigation();
}

function initHeaderState(fixture: ReturnType<typeof createFixture>) {
	createNavigation(fixture.window, fixture.document).initHeaderState();
}

test("scrolls on repeat clicks when the URL is already #top", () => {
	const fixture = createFixture();
	init(fixture);

	const first = click(fixture.brand.element);
	const second = click(fixture.brand.element);

	expect([first.defaultPrevented, second.defaultPrevented]).toEqual([
		true,
		true,
	]);
	expect(fixture.historyCalls).toEqual([
		[null, "", "/?from=test"],
		[null, "", "/?from=test"],
	]);
	expect(fixture.scrollCalls).toEqual([
		{ top: 0, left: 0, behavior: "smooth" },
		{ top: 0, left: 0, behavior: "smooth" },
	]);
	expect(fixture.brand.focusCalls).toEqual([
		{ preventScroll: true },
		{ preventScroll: true },
	]);
});

test("initializes both top controls and honors reduced motion", () => {
	const fixture = createFixture(true);
	init(fixture);

	expect(click(fixture.brand.element).defaultPrevented).toBe(true);
	expect(click(fixture.footer.element).defaultPrevented).toBe(true);
	expect(fixture.scrollCalls).toEqual([
		{ top: 0, left: 0, behavior: "instant" },
		{ top: 0, left: 0, behavior: "instant" },
	]);
	expect(fixture.brand.focusCalls).toEqual([
		{ preventScroll: true },
		{ preventScroll: true },
	]);
});

test("keeps modified and non-primary clicks native", () => {
	const fixture = createFixture();
	init(fixture);

	for (const options of [
		{ altKey: true },
		{ button: 1 },
		{ ctrlKey: true },
		{ metaKey: true },
		{ shiftKey: true },
	]) {
		expect(click(fixture.footer.element, options).defaultPrevented).toBe(false);
	}
	expect(fixture.historyCalls).toEqual([]);
	expect(fixture.scrollCalls).toEqual([]);
	expect(fixture.brand.focusCalls).toEqual([]);
});

test("marks the header as scrolled only after the page moves", () => {
	const fixture = createFixture();
	initHeaderState(fixture);
	fixture.flushFrame();

	expect(
		fixture.document.documentElement.getAttribute("data-scrolled"),
	).toBeNull();

	fixture.scrollPosition(40);
	fixture.window.dispatchEvent(new Event("scroll"));
	fixture.flushFrame(32);
	expect(fixture.document.documentElement.getAttribute("data-scrolled")).toBe(
		"",
	);

	fixture.scrollPosition(0);
	fixture.window.dispatchEvent(new Event("scroll"));
	fixture.flushFrame(48);
	expect(
		fixture.document.documentElement.getAttribute("data-scrolled"),
	).toBeNull();
});

test("selects the last section above the sticky header marker", () => {
	const fixture = createFixture();
	initSectionNavigation(fixture);
	fixture.flushFrame();

	expect(
		fixture.navLinks.map(({ element }) => element.getAttribute("aria-current")),
	).toEqual(["location", null, null, null, null, null]);

	fixture.sectionTops.projects = -100;
	fixture.sectionTops.about = 112;
	fixture.sectionTops.stack = 360;
	fixture.window.dispatchEvent(new Event("scroll"));
	fixture.flushFrame(32);

	expect(
		fixture.navLinks.map(({ element }) => element.getAttribute("aria-current")),
	).toEqual([null, "location", null, null, null, null]);
	expect(fixture.sections.about.getAttribute("data-current")).toBe("");
	expect(fixture.sections.projects.getAttribute("data-current")).toBeNull();
});

test("updates after resize without rewriting the URL", () => {
	const fixture = createFixture();
	initSectionNavigation(fixture);
	fixture.flushFrame();

	fixture.headerBottom(150);
	fixture.sectionTops.projects = -260;
	fixture.sectionTops.about = -40;
	fixture.sectionTops.stack = 190;
	fixture.window.dispatchEvent(new Event("resize"));
	fixture.window.dispatchEvent(new Event("scroll"));
	fixture.flushFrame(32);

	expect(
		fixture.navLinks.map(({ element }) => element.getAttribute("aria-current")),
	).toEqual([null, null, "location", null, null, null]);
	expect(fixture.historyCalls).toEqual([]);
	expect(fixture.window.location).toEqual({
		hash: "#calendar",
		pathname: "/",
		search: "?from=test",
	});
});

test("selects Social at the real document end", () => {
	const fixture = createFixture();
	initSectionNavigation(fixture);
	fixture.flushFrame();

	fixture.sectionTops.projects = -840;
	fixture.sectionTops.about = -580;
	fixture.sectionTops.stack = -320;
	fixture.sectionTops.calendar = -60;
	fixture.sectionTops.music = 180;
	fixture.sectionTops.social = 460;
	fixture.scrollPosition(1_200);
	fixture.scrollSize(2_000, 800);
	fixture.window.dispatchEvent(new Event("scroll"));
	fixture.flushFrame(32);

	expect(
		fixture.navLinks.map(({ element }) => element.getAttribute("aria-current")),
	).toEqual([null, null, null, null, null, "location"]);
	expect(fixture.sections.social.getAttribute("data-current")).toBe("");
	expect(fixture.sections.projects.getAttribute("data-current")).toBeNull();
});
