import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type LightModule = typeof import("../src/utils/refractive-light");
type LightFactory = (
	window: object,
	document: object,
	createRefractiveRenderer: (canvas: unknown) => unknown,
) => Pick<LightModule, "initRefractiveLight">;
type FixtureOptions = Partial<{
	finePointer: boolean;
	forcedColors: boolean;
	nullRenderer: boolean;
	reducedMotion: boolean;
	reducedTransparency: boolean;
	theme: "light" | "dark";
}>;
type PointerOptions = Partial<{
	button: number;
	clientX: number;
	clientY: number;
	pointerType: string;
}>;

const controllerSource = readFileSync(
	fileURLToPath(new URL("../src/utils/refractive-light.ts", import.meta.url)),
	"utf8",
)
	.replace(/^import .*;\n/gm, "")
	.replace("export ", "");
const createLight = new Function(
	"window",
	"document",
	"createRefractiveRenderer",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${controllerSource}\nreturn { initRefractiveLight };`,
	),
) as LightFactory;

function media(matches: boolean) {
	return Object.assign(new EventTarget(), { matches });
}

function pointer(type: string, options: PointerOptions = {}) {
	return Object.assign(new Event(type, { cancelable: true }), {
		button: 0,
		clientX: 60,
		clientY: 30,
		pointerType: "mouse",
		...options,
	});
}

function createFixture(options: FixtureOptions = {}) {
	let attached = false;
	let anchorAttachments = 0;
	let contexts = 0;
	let disposals = 0;
	let nextFrame = 1;
	let now = 0;
	const surfaceClasses = new Set<string>();
	const draws: Array<{
		pointer: readonly [number, number];
		rippleAge: number;
		strength: number;
		time: number;
	}> = [];
	const resizes: Array<readonly [number, number, number]> = [];
	const frames = new Map<number, (time: number) => void>();
	const canvas = Object.assign(new EventTarget(), {
		className: "",
		remove() {
			attached = false;
		},
		setAttribute() {},
	});
	const surface = Object.assign(new EventTarget(), {
		append(node: unknown) {
			if (node === canvas) attached = true;
		},
		classList: {
			add(name: string) {
				surfaceClasses.add(name);
			},
			remove(name: string) {
				surfaceClasses.delete(name);
			},
		},
		getBoundingClientRect() {
			return { left: 166, top: 38, width: 44, height: 44 };
		},
	});
	const anchor = Object.assign(new EventTarget(), {
		append() {
			anchorAttachments += 1;
		},
		getBoundingClientRect() {
			return { left: 10, top: 20, width: 200, height: 80 };
		},
		querySelector(selector: string) {
			return selector === "[data-inspection-surface]" ? surface : null;
		},
	});
	const finePointer = media(options.finePointer ?? true);
	const reducedMotion = media(options.reducedMotion ?? false);
	const reducedTransparency = media(options.reducedTransparency ?? false);
	const forcedColors = media(options.forcedColors ?? false);
	const colorScheme = media(false);
	const document = Object.assign(new EventTarget(), {
		createElement() {
			return canvas;
		},
		documentElement: { dataset: { theme: options.theme ?? "dark" } },
		hidden: false,
		querySelectorAll() {
			return [anchor];
		},
	});
	const window = Object.assign(new EventTarget(), {
		devicePixelRatio: 2,
		getComputedStyle() {
			return { getPropertyValue: () => "#8bdcff" };
		},
		matchMedia(query: string) {
			if (query === "(hover: hover) and (pointer: fine)") return finePointer;
			if (query === "(prefers-reduced-motion: reduce)") return reducedMotion;
			if (query === "(prefers-reduced-transparency: reduce)")
				return reducedTransparency;
			if (query === "(forced-colors: active)") return forcedColors;
			return colorScheme;
		},
		performance: { now: () => now },
		requestAnimationFrame(callback: (time: number) => void) {
			const id = nextFrame++;
			frames.set(id, callback);
			return id;
		},
		cancelAnimationFrame(id: number) {
			frames.delete(id);
		},
	});
	const createRenderer = (_canvas: unknown) => {
		contexts += 1;
		if (options.nullRenderer) return null;
		return {
			dispose() {
				disposals += 1;
			},
			draw(frame: {
				pointer: readonly [number, number];
				rippleAge: number;
				strength: number;
				time: number;
			}) {
				draws.push({
					pointer: [frame.pointer[0], frame.pointer[1]],
					rippleAge: frame.rippleAge,
					strength: frame.strength,
					time: frame.time,
				});
			},
			resize(width: number, height: number, dpr: number) {
				resizes.push([width, height, dpr]);
			},
		};
	};

	function step(milliseconds = 16) {
		now += milliseconds;
		const callbacks = [...frames.values()];
		frames.clear();
		for (const callback of callbacks) callback(now);
	}

	function drain(limit = 80) {
		for (let index = 0; frames.size && index < limit; index += 1) step();
		return frames.size;
	}

	return {
		active: () => surfaceClasses.has("refractive-surface"),
		attached: () => attached,
		anchor,
		anchorAttachments: () => anchorAttachments,
		canvas,
		contexts: () => contexts,
		createRenderer,
		disposals: () => disposals,
		document,
		draws,
		drain,
		pending: () => frames.size,
		resizes,
		step,
		surface,
		window,
	};
}

function init(fixture: ReturnType<typeof createFixture>) {
	createLight(
		fixture.window,
		fixture.document,
		fixture.createRenderer,
	).initRefractiveLight();
}

function enter(
	fixture: ReturnType<typeof createFixture>,
	options: PointerOptions = {},
) {
	const event = pointer("pointerenter", options);
	fixture.anchor.dispatchEvent(event);
	return event;
}

test("creates WebGL lazily at the inspection endpoint", () => {
	const fixture = createFixture();
	init(fixture);
	expect(fixture.contexts()).toBe(0);

	const hover = enter(fixture);
	const move = pointer("pointermove");
	fixture.anchor.dispatchEvent(move);
	expect([hover.defaultPrevented, move.defaultPrevented]).toEqual([
		false,
		false,
	]);
	expect(fixture.contexts()).toBe(1);
	expect([
		fixture.active(),
		fixture.attached(),
		fixture.anchorAttachments(),
		fixture.pending(),
	]).toEqual([true, true, 0, 1]);
	expect(fixture.resizes).toEqual([[44, 44, 2]]);
	fixture.step();
	expect(fixture.draws.at(-1)?.pointer).toEqual([0.25, 0.125]);
	fixture.anchor.dispatchEvent(pointer("pointerleave"));
	expect(fixture.drain()).toBe(0);

	const fallback = createFixture({ nullRenderer: true });
	init(fallback);
	expect(enter(fallback).defaultPrevented).toBe(false);
	expect([
		fallback.contexts(),
		fallback.active(),
		fallback.attached(),
		fallback.anchorAttachments(),
		fallback.pending(),
	]).toEqual([1, false, false, 0, 0]);
});

test("does not create a context for coarse or reduced preferences", () => {
	for (const options of [
		{ finePointer: false },
		{ reducedMotion: true },
		{ reducedTransparency: true },
		{ forcedColors: true },
	]) {
		const fixture = createFixture(options);
		init(fixture);
		expect(enter(fixture).defaultPrevented).toBe(false);
		expect([fixture.contexts(), fixture.pending()]).toEqual([0, 0]);
	}
});

test("uses full strength in both themes", () => {
	const strengths: number[] = [];
	for (const theme of ["light", "dark"] as const) {
		const fixture = createFixture({ theme });
		init(fixture);
		enter(fixture);
		for (let index = 0; index < 44; index += 1) fixture.step();
		expect(fixture.pending()).toBe(0);
		expect(fixture.draws.every((frame) => frame.strength <= 1)).toBe(true);
		strengths.push(fixture.draws.at(-1)?.strength ?? 0);
		fixture.anchor.dispatchEvent(pointer("pointerleave"));
		expect(fixture.drain()).toBe(0);
	}
	expect(strengths[0]).toBeGreaterThan(0.99);
	expect(strengths[0]).toBe(strengths[1]);
});

test("runs through entry, settles, and resumes for pointer and press input", () => {
	const fixture = createFixture();
	init(fixture);
	enter(fixture);
	for (let index = 0; index < 43; index += 1) fixture.step();
	expect(fixture.pending()).toBe(1);
	fixture.step();
	expect(fixture.draws.at(-1)?.time).toBeGreaterThanOrEqual(0.7);
	expect(fixture.pending()).toBe(0);

	fixture.anchor.dispatchEvent(
		pointer("pointermove", { clientX: 190, clientY: 80 }),
	);
	expect(fixture.pending()).toBe(1);
	for (let index = 0; index < 45; index += 1) fixture.step();
	expect(fixture.pending()).toBe(0);

	fixture.draws.length = 0;
	const down = pointer("pointerdown", { clientX: 190, clientY: 80 });
	fixture.anchor.dispatchEvent(down);
	expect(down.defaultPrevented).toBe(false);
	for (let index = 0; index < 34; index += 1) fixture.step();
	expect(fixture.pending()).toBe(1);
	fixture.step();
	expect(fixture.draws.some((frame) => frame.rippleAge >= 0.55)).toBe(true);
	expect(fixture.pending()).toBe(0);

	fixture.anchor.dispatchEvent(pointer("pointerleave"));
	expect(fixture.drain()).toBe(0);
	const completedTime = fixture.draws.at(-1)?.time ?? 0;
	const next = enter(fixture);
	fixture.step();
	expect(next.defaultPrevented).toBe(false);
	expect(fixture.draws.at(-1)?.time).toBeLessThan(0.1);
	expect(fixture.draws.at(-1)?.time).toBeLessThan(completedTime);
	fixture.anchor.dispatchEvent(pointer("pointerleave"));
	expect(fixture.drain()).toBe(0);
});

test("recovers when a fading hover re-enters", () => {
	const fixture = createFixture();
	init(fixture);
	enter(fixture);
	fixture.step();

	const leave = pointer("pointerleave");
	fixture.anchor.dispatchEvent(leave);
	fixture.step();
	const reenter = enter(fixture);
	expect([leave.defaultPrevented, reenter.defaultPrevented]).toEqual([
		false,
		false,
	]);
	for (let index = 0; index < 45; index += 1) fixture.step();
	expect(fixture.contexts()).toBe(1);
	expect([fixture.active(), fixture.attached(), fixture.pending()]).toEqual([
		true,
		true,
		0,
	]);
	expect(fixture.draws.at(-1)?.strength).toBeGreaterThan(0.99);
	fixture.anchor.dispatchEvent(pointer("pointerleave"));
	expect(fixture.drain()).toBe(0);
});

test("clears for page loss and restores only after a new pointer event", () => {
	const fixture = createFixture();
	init(fixture);
	enter(fixture);
	fixture.step();

	const scroll = new Event("scroll", { cancelable: true });
	fixture.document.dispatchEvent(scroll);
	expect([
		scroll.defaultPrevented,
		fixture.attached(),
		fixture.pending(),
	]).toEqual([false, false, 0]);

	enter(fixture);
	fixture.step();
	fixture.document.hidden = true;
	const visibility = new Event("visibilitychange", { cancelable: true });
	fixture.document.dispatchEvent(visibility);
	expect([
		visibility.defaultPrevented,
		fixture.attached(),
		fixture.pending(),
	]).toEqual([false, false, 0]);
	fixture.document.hidden = false;

	enter(fixture);
	fixture.step();
	const themeChange = new Event("theme-change", { cancelable: true });
	fixture.window.dispatchEvent(themeChange);
	expect([
		themeChange.defaultPrevented,
		fixture.attached(),
		fixture.pending(),
	]).toEqual([false, false, 0]);

	enter(fixture);
	fixture.step();
	const loss = new Event("webglcontextlost", { cancelable: true });
	fixture.canvas.dispatchEvent(loss);
	expect([
		loss.defaultPrevented,
		fixture.attached(),
		fixture.disposals(),
		fixture.pending(),
	]).toEqual([true, false, 1, 0]);
	const restored = new Event("webglcontextrestored", { cancelable: true });
	fixture.canvas.dispatchEvent(restored);
	expect(restored.defaultPrevented).toBe(false);

	const next = enter(fixture);
	fixture.step();
	expect(next.defaultPrevented).toBe(false);
	expect([fixture.contexts(), fixture.attached(), fixture.pending()]).toEqual([
		2,
		true,
		1,
	]);
	const blur = new Event("blur", { cancelable: true });
	fixture.window.dispatchEvent(blur);
	expect([
		blur.defaultPrevented,
		fixture.attached(),
		fixture.pending(),
	]).toEqual([false, false, 0]);
});
