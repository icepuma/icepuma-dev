import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type ThemeModule = typeof import("../src/utils/theme");
type FixtureOptions = Partial<{
	prefersDark: boolean;
	prefersReducedMotion: boolean;
	readBlocked: boolean;
	startViewTransition: (update: () => void) => { ready: Promise<void> };
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
		`${themeSource}\nreturn { applyTheme, loadTheme, resolveTheme, setTheme, setThemeWithTransition, setupThemeListener };`,
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
			query === "(prefers-reduced-motion: reduce)" ? reducedMotion : media,
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

test("falls back without view transitions or with reduced motion", () => {
	const unsupported = createFixture();
	themeFor(unsupported).setThemeWithTransition("dark");
	expectTheme(unsupported, "dark", "dark");

	let transitions = 0;
	const reducedMotion = createFixture({
		prefersReducedMotion: true,
		startViewTransition() {
			transitions += 1;
			return { ready: Promise.resolve() };
		},
	});
	themeFor(reducedMotion).setThemeWithTransition("dark");
	expect(transitions).toBe(0);
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
