import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type ThemeModule = typeof import("../src/utils/theme");
type FixtureOptions = Partial<{
	prefersDark: boolean;
	prefersReducedMotion: boolean;
	readBlocked: boolean;
	startViewTransition: (update: () => void) => {
		ready: Promise<void>;
		finished?: Promise<void>;
		skipTransition?: () => void;
	};
	storedTheme: string | null;
	writeBlocked: boolean;
}>;
type ThemeFactory = (
	window: object,
	document: object,
	event: typeof CustomEvent,
) => ThemeModule;
type Prepaint = (window: object, document: object) => void;

function source(path: string) {
	return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

const themeSource = source("../src/utils/theme.ts").replaceAll("export ", "");
const createThemeModule = new Function(
	"window",
	"document",
	"CustomEvent",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${themeSource}\nreturn { applyTheme, interruptThemeTransition, loadTheme, resolveTheme, revealBand, revealGeometry, revealRadius, setTheme, setThemeWithTransition, setupThemeListener };`,
	),
) as ThemeFactory;
const prepaintSource = source("../src/layouts/MinimalLayout.astro").match(
	/<script is:inline>\s*([\s\S]*?)\s*<\/script>/,
)?.[1];

if (!prepaintSource) throw new Error("Missing prepaint script.");

const applyPrepaint = new Function(
	"window",
	"document",
	prepaintSource,
) as Prepaint;

function createElement() {
	const attributes = new Map<string, string>();
	return {
		dataset: {} as Record<string, string | undefined>,
		style: { colorScheme: "" },
		getAttribute: (name: string) => attributes.get(name) ?? null,
		setAttribute: (name: string, value: string) => attributes.set(name, value),
	};
}

function createFixture(options: FixtureOptions = {}) {
	let savedTheme = options.storedTheme ?? null;
	const storage = {
		reads: 0,
		writes: 0,
		getItem() {
			this.reads += 1;
			if (options.readBlocked) throw new Error("Storage reads are blocked");
			return savedTheme;
		},
		setItem(_key: string, value: string) {
			this.writes += 1;
			if (options.writeBlocked) throw new Error("Storage writes are blocked");
			savedTheme = value;
		},
	};
	const media = Object.assign(new EventTarget(), {
		matches: options.prefersDark ?? false,
	});
	const reducedMotion = Object.assign(new EventTarget(), {
		matches: options.prefersReducedMotion ?? false,
	});
	const document = Object.assign(
		{ documentElement: createElement() },
		options.startViewTransition
			? { startViewTransition: options.startViewTransition }
			: {},
	);
	const window = Object.assign(new EventTarget(), {
		localStorage: storage,
		matchMedia: (query: string) =>
			query === "(prefers-reduced-motion: reduce)"
				? reducedMotion
				: query === "(prefers-color-scheme: dark)"
					? media
					: { matches: false },
	});
	return {
		document,
		storage,
		window,
		resetDocument: () => (document.documentElement = createElement()),
		setPrefersDark(matches: boolean) {
			media.matches = matches;
			media.dispatchEvent(new Event("change"));
		},
	};
}

function themeFor(fixture: ReturnType<typeof createFixture>) {
	return createThemeModule(fixture.window, fixture.document, CustomEvent);
}

function expectTheme(
	fixture: ReturnType<typeof createFixture>,
	choice: string,
	resolved: string,
) {
	const { document } = fixture;
	expect(document.documentElement.dataset.themeChoice).toBe(choice);
	expect(document.documentElement.getAttribute("data-theme")).toBe(resolved);
	expect(document.documentElement.style.colorScheme).toBe(resolved);
}

test("loads saved themes and falls back to system", () => {
	for (const [savedTheme, prefersDark, resolved] of [
		["light", true, "light"],
		["dark", false, "dark"],
		["system", true, "dark"],
	] as const) {
		const fixture = createFixture({ prefersDark, storedTheme: savedTheme });
		expect(themeFor(fixture).loadTheme()).toBe(savedTheme);
		expectTheme(fixture, savedTheme, resolved);
	}
	const fixture = createFixture({ storedTheme: "neon" });
	expect(themeFor(fixture).loadTheme()).toBe("system");
	expectTheme(fixture, "system", "light");
});

test("keeps the selected theme when storage reads or writes fail", () => {
	const blockedRead = createFixture({ readBlocked: true });
	const afterReadFailure = themeFor(blockedRead);
	expect(afterReadFailure.loadTheme()).toBe("system");
	afterReadFailure.setTheme("dark");
	expect(blockedRead.storage.reads).toBe(1);
	expect(blockedRead.storage.writes).toBe(0);
	blockedRead.resetDocument();
	expect(afterReadFailure.loadTheme()).toBe("dark");
	expectTheme(blockedRead, "dark", "dark");

	const blockedWrite = createFixture({ writeBlocked: true });
	const afterWriteFailure = themeFor(blockedWrite);
	afterWriteFailure.setTheme("light");
	expect(blockedWrite.storage.writes).toBe(1);
	expectTheme(blockedWrite, "light", "light");
	blockedWrite.resetDocument();
	expect(afterWriteFailure.loadTheme()).toBe("light");
	expectTheme(blockedWrite, "light", "light");
});

test("updates for OS color changes only in system mode", () => {
	const fixture = createFixture({ storedTheme: "system" });
	const theme = themeFor(fixture);
	const notifications: string[] = [];
	const stop = theme.setupThemeListener((selected) =>
		notifications.push(selected),
	);
	theme.loadTheme();
	fixture.setPrefersDark(true);
	expectTheme(fixture, "system", "dark");
	theme.setTheme("light");
	fixture.setPrefersDark(false);
	fixture.setPrefersDark(true);
	expectTheme(fixture, "light", "light");
	expect(notifications).toEqual(["system", "light"]);
	stop();
});

test("uses a view transition only when the palette changes", () => {
	const updates: Array<() => void> = [];
	const fixture = createFixture({
		prefersDark: true,
		startViewTransition(update) {
			updates.push(update);
			return { ready: Promise.resolve() };
		},
	});
	const theme = themeFor(fixture);
	theme.loadTheme();

	theme.setThemeWithTransition("dark");
	expect(updates).toHaveLength(0);
	expectTheme(fixture, "dark", "dark");

	theme.setThemeWithTransition("light");
	expect(updates).toHaveLength(1);
	expectTheme(fixture, "dark", "dark");
	updates[0]?.();
	expectTheme(fixture, "light", "light");
});

test("falls back without view transitions and crossfades with reduced motion", () => {
	const unsupported = createFixture();
	themeFor(unsupported).setThemeWithTransition("dark");
	expectTheme(unsupported, "dark", "dark");

	let transitions = 0;
	const reducedMotion = createFixture({
		prefersReducedMotion: true,
		startViewTransition(update) {
			transitions += 1;
			update();
			return { ready: Promise.resolve() };
		},
	});
	themeFor(reducedMotion).setThemeWithTransition("dark", { x: 10, y: 10 });
	expect(transitions).toBe(1);
	expect(
		reducedMotion.document.documentElement.dataset.themeReveal,
	).toBeUndefined();
	expectTheme(reducedMotion, "dark", "dark");

	const failedTransition = createFixture({
		startViewTransition() {
			throw new Error("Transition unavailable");
		},
	});
	themeFor(failedTransition).setThemeWithTransition("dark");
	expectTheme(failedTransition, "dark", "dark");
});

test("keeps the latest theme when a view transition is skipped", async () => {
	let rejectReady!: (reason?: unknown) => void;
	const ready = new Promise<void>((_resolve, reject) => {
		rejectReady = reject;
	});
	const updates: Array<() => void> = [];
	const fixture = createFixture({
		startViewTransition(update) {
			updates.push(update);
			return { ready };
		},
	});
	const theme = themeFor(fixture);

	theme.setThemeWithTransition("dark");
	rejectReady(new Error("Transition skipped"));
	await Promise.resolve();
	expectTheme(fixture, "dark", "dark");

	theme.setThemeWithTransition("light");
	theme.setThemeWithTransition("dark");
	updates[1]?.();
	expectTheme(fixture, "dark", "dark");
});

test("prepaint uses the saved choice and tolerates blocked storage", () => {
	for (const [options, choice, resolved] of [
		[{ prefersDark: true, storedTheme: "light" }, "light", "light"],
		[{ prefersDark: true, readBlocked: true }, "system", "dark"],
	] as const) {
		const fixture = createFixture(options);
		applyPrepaint(fixture.window, fixture.document);
		expectTheme(fixture, choice, resolved);
	}
});

function withReveal(fixture: ReturnType<typeof createFixture>) {
	const properties = new Map<string, string>();
	Object.assign(fixture.document.documentElement.style, {
		setProperty(name: string, value: string) {
			properties.set(name, value);
		},
	});
	Object.assign(fixture.window, { innerWidth: 1200, innerHeight: 800 });
	return { properties };
}

// A view transition the test drives: it hands over its update, and ends
// when told to.
function drivenTransitions() {
	const updates: Array<() => void> = [];
	const ends: Array<() => void> = [];
	return {
		updates,
		end: (index = ends.length - 1) => ends[index]?.(),
		startViewTransition(update: () => void) {
			updates.push(update);
			let resolve!: () => void;
			const finished = new Promise<void>((done) => {
				resolve = done;
			});
			ends.push(resolve);
			return { ready: Promise.resolve(), finished, skipTransition: resolve };
		},
	};
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test("spreads the new palette out from under the knob", async () => {
	const driven = drivenTransitions();
	const fixture = createFixture({
		startViewTransition: driven.startViewTransition,
	});
	const reveal = withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	theme.setThemeWithTransition("dark", { x: 900.4, y: 40, r: 55.6 });
	// Nothing changes before the old page is captured.
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		undefined,
		undefined,
	]);
	expect(reveal.properties.size).toBe(0);
	expectTheme(fixture, "system", "light");

	// Then the reveal, the hold on other transitions, and the palette land
	// together. The farthest corner is the bottom left, 1179px away; the ring
	// band has to pass it too.
	driven.updates[0]?.();
	expect(Object.fromEntries(reveal.properties)).toEqual({
		"--reveal-x": "900px",
		"--reveal-y": "40px",
		"--reveal-core": "56px",
		"--reveal-band": "160px",
		"--reveal-to": "1339px",
	});
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		"",
		"",
	]);
	expectTheme(fixture, "dark", "dark");

	// The finished transition lets go of the page.
	driven.end();
	await settle();
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		undefined,
		undefined,
	]);
});

test("a crossfade holds other transitions too, but reveals nothing", async () => {
	const driven = drivenTransitions();
	const fixture = createFixture({
		prefersReducedMotion: true,
		startViewTransition: driven.startViewTransition,
	});
	const reveal = withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	theme.setThemeWithTransition("dark", { x: 100, y: 100, r: 50 });
	driven.updates[0]?.();
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		undefined,
		"",
	]);
	expect(reveal.properties.size).toBe(0);
	driven.end();
	await settle();
	expect(root.dataset.themeChanging).toBeUndefined();
	expectTheme(fixture, "dark", "dark");
});

test("only the latest transition lets go of the page", async () => {
	const driven = drivenTransitions();
	const fixture = createFixture({
		startViewTransition: driven.startViewTransition,
	});
	withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	theme.setThemeWithTransition("dark", { x: 100, y: 100, r: 50 });
	driven.updates[0]?.();
	theme.setThemeWithTransition("light", { x: 100, y: 100, r: 50 });
	driven.updates[1]?.();
	// The first one ends while the second still runs.
	driven.end(0);
	await settle();
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		"",
		"",
	]);
	driven.end(1);
	await settle();
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		undefined,
		undefined,
	]);
	expectTheme(fixture, "light", "light");
});

test("a transition that ends before its update never holds the page", async () => {
	let finish!: () => void;
	let update!: () => void;
	const fixture = createFixture({
		startViewTransition(next) {
			update = next;
			return {
				ready: new Promise<void>(() => {}),
				finished: new Promise<void>((resolve) => {
					finish = resolve;
				}),
			};
		},
	});
	withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	theme.setThemeWithTransition("dark", { x: 100, y: 100, r: 50 });
	finish();
	await settle();
	update();
	expect([root.dataset.themeReveal, root.dataset.themeChanging]).toEqual([
		undefined,
		undefined,
	]);
	expectTheme(fixture, "dark", "dark");
});

test("a press on the knob can end a running reveal once", async () => {
	let skipped = 0;
	let finish!: () => void;
	const fixture = createFixture({
		startViewTransition(update) {
			update();
			return {
				ready: Promise.resolve(),
				finished: new Promise<void>((resolve) => {
					finish = resolve;
				}),
				skipTransition() {
					skipped += 1;
					finish();
				},
			};
		},
	});
	withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	expect(theme.interruptThemeTransition()).toBe(false);
	theme.setThemeWithTransition("dark", { x: 100, y: 100 });
	expect(theme.interruptThemeTransition()).toBe(true);
	expect(theme.interruptThemeTransition()).toBe(false);
	expect(skipped).toBe(1);
	await settle();
	expect(root.dataset.themeChanging).toBeUndefined();

	theme.setThemeWithTransition("light", { x: 100, y: 100 });
	finish();
	await settle();
	expect(theme.interruptThemeTransition()).toBe(false);
	expect(skipped).toBe(1);
});

test("keeps a plain crossfade without an origin and does nothing when nothing changes", async () => {
	const driven = drivenTransitions();
	const fixture = createFixture({
		startViewTransition: driven.startViewTransition,
	});
	const reveal = withReveal(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();

	theme.setThemeWithTransition("dark");
	driven.updates[0]?.();
	expect(fixture.document.documentElement.dataset.themeReveal).toBeUndefined();
	driven.end();
	await settle();
	theme.setThemeWithTransition("dark", { x: 10, y: 10 });
	await settle();
	expect([driven.updates.length, reveal.properties.size]).toEqual([1, 0]);
	expectTheme(fixture, "dark", "dark");
});

test("sizes the reveal to the screen and reaches every corner", () => {
	const { revealBand, revealGeometry, revealRadius } = themeFor(
		createFixture(),
	);
	expect([
		revealBand({ width: 1200, height: 800 }),
		revealBand({ width: 375, height: 812 }),
		revealBand({ width: 3000, height: 2000 }),
	]).toEqual([160, 80, 200]);
	expect(revealRadius({ x: 0, y: 0 }, { width: 300, height: 400 })).toBe(500);
	expect(revealRadius({ x: 150, y: 200 }, { width: 300, height: 400 })).toBe(
		250,
	);
	// Without a radius the reveal starts from a point.
	expect(
		revealGeometry({ x: 150, y: 200 }, { width: 300, height: 400 }),
	).toEqual({
		"--reveal-x": "150px",
		"--reveal-y": "200px",
		"--reveal-core": "0px",
		"--reveal-band": "80px",
		"--reveal-to": "330px",
	});
});
