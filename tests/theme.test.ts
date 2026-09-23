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
		`${themeSource}\nreturn { applyTheme, loadTheme, resolveTheme, scanBand, scanFrames, setTheme, setThemeWithTransition, setupThemeListener };`,
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
		reducedMotion.document.documentElement.dataset.themeScan,
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

type FakeBeam = {
	attributes: Map<string, string>;
	className: string;
	removed: boolean;
	styles: Map<string, string>;
};

function withScan(fixture: ReturnType<typeof createFixture>) {
	const animations: Array<{ keyframes: unknown; options: unknown }> = [];
	const beams: FakeBeam[] = [];
	const body: unknown[] = [];
	const properties = new Map<string, string>();
	const root = fixture.document.documentElement;
	Object.assign(root, {
		animate(keyframes: unknown, options: unknown) {
			animations.push({ keyframes, options });
		},
	});
	Object.assign(root.style, {
		setProperty(name: string, value: string) {
			properties.set(name, value);
		},
	});
	Object.assign(fixture.document, {
		body: {
			append(node: unknown) {
				body.push(node);
			},
		},
		createElement() {
			const beam = {
				attributes: new Map<string, string>(),
				className: "",
				removed: false,
				styles: new Map<string, string>(),
				remove() {
					beam.removed = true;
				},
				setAttribute(name: string, value: string) {
					beam.attributes.set(name, value);
				},
				style: {
					setProperty(name: string, value: string) {
						beam.styles.set(name, value);
					},
				},
			};
			beams.push(beam);
			return beam;
		},
	});
	Object.assign(fixture.window, { innerHeight: 800 });
	return { animations, beams, body, properties };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const scanTiming = { duration: 900, easing: "cubic-bezier(0.37, 0, 0.63, 1)" };

test("writes the new palette in with a scan line from the theme button", async () => {
	const updates: Array<() => void> = [];
	const fixture = createFixture({
		startViewTransition(update) {
			updates.push(update);
			return { ready: Promise.resolve(), finished: Promise.resolve() };
		},
	});
	const scan = withScan(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();
	const root = fixture.document.documentElement;

	theme.setThemeWithTransition("dark", { x: 900.4, y: 40 });
	expect(root.dataset.themeScan).toBe("");
	expect(scan.properties.get("--scan-band")).toBe("160px");
	// The beam is only created for the new state, after the old snapshot.
	expect(scan.beams).toHaveLength(0);
	updates[0]?.();
	const [beam] = scan.beams;
	expect(scan.body).toEqual([beam]);
	expect([beam?.className, beam?.attributes.get("aria-hidden")]).toEqual([
		"theme-scan",
		"true",
	]);
	expect(beam?.styles.get("--scan-x")).toBe("900px");
	await settle();

	expect(scan.animations).toEqual([
		{
			keyframes: {
				maskPosition: ["0 -960px, 0 -960px, 0 0", "0 0px, 0 0px, 0 0"],
			},
			options: { ...scanTiming, pseudoElement: "::view-transition-old(root)" },
		},
		{
			keyframes: { transform: ["translateY(-12px)", "translateY(948px)"] },
			options: {
				...scanTiming,
				pseudoElement: "::view-transition-group(theme-scan)",
			},
		},
	]);
	expect(beam?.removed).toBe(true);
	expect(root.dataset.themeScan).toBeUndefined();
	expectTheme(fixture, "dark", "dark");
});

test("keeps a plain crossfade without an origin and does nothing when nothing changes", async () => {
	const updates: Array<() => void> = [];
	const fixture = createFixture({
		startViewTransition(update) {
			updates.push(update);
			return { ready: Promise.resolve(), finished: Promise.resolve() };
		},
	});
	const scan = withScan(fixture);
	const theme = themeFor(fixture);
	theme.loadTheme();

	theme.setThemeWithTransition("dark");
	expect(fixture.document.documentElement.dataset.themeScan).toBeUndefined();
	updates[0]?.();
	await settle();
	theme.setThemeWithTransition("dark", { x: 10, y: 10 });
	await settle();
	expect([
		updates.length,
		scan.animations.length,
		scan.beams.length,
		scan.properties.size,
	]).toEqual([1, 0, 0, 0]);
	expectTheme(fixture, "dark", "dark");
});

test("sizes the scan band to the viewport and rides the beam on its edge", () => {
	const { scanBand, scanFrames } = themeFor(createFixture());
	expect([scanBand(800), scanBand(400), scanBand(2000)]).toEqual([
		160, 120, 240,
	]);
	expect(scanFrames(800, 160)).toEqual({
		mask: ["0 -960px", "0 0px"],
		beam: ["translateY(-12px)", "translateY(948px)"],
	});
});
