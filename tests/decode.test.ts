import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { decodeFrame } from "../src/utils/decode";

type DecodeModule = typeof import("../src/utils/decode");
type DecodeFactory = (
	window: object,
	document: object,
) => Pick<DecodeModule, "decodeOnce">;
type FixtureOptions = Partial<{
	forcedColors: boolean;
	hidden: boolean;
	reducedMotion: boolean;
}>;

const decodeSource = readFileSync(
	fileURLToPath(new URL("../src/utils/decode.ts", import.meta.url)),
	"utf8",
).replaceAll("export ", "");
const createDecode = new Function(
	"window",
	"document",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${decodeSource}\nreturn { decodeOnce };`,
	),
) as DecodeFactory;

function sequence(...values: number[]) {
	let index = 0;
	return () => values[index++ % values.length] ?? 0;
}

function createFixture(options: FixtureOptions = {}) {
	const frames = new Map<number, (time: number) => void>();
	let nextFrame = 1;
	const masks: Array<{
		attributes: Map<string, string>;
		className: string;
		removed: boolean;
		textContent: string;
		remove(): void;
		setAttribute(name: string, value: string): void;
	}> = [];
	const hostAttributes = new Map<string, string>();
	const textWrites: string[] = [];
	const children: unknown[] = [];
	const host = {
		get textContent() {
			return "14:32";
		},
		set textContent(value: string) {
			textWrites.push(value);
		},
		append(node: unknown) {
			children.push(node);
		},
		hasAttribute: (name: string) => hostAttributes.has(name),
		removeAttribute: (name: string) => hostAttributes.delete(name),
		setAttribute: (name: string, value: string) =>
			hostAttributes.set(name, value),
	};
	const document = {
		hidden: options.hidden ?? false,
		createElement() {
			const mask = {
				attributes: new Map<string, string>(),
				className: "",
				removed: false,
				textContent: "",
				remove() {
					mask.removed = true;
				},
				setAttribute(name: string, value: string) {
					mask.attributes.set(name, value);
				},
			};
			masks.push(mask);
			return mask;
		},
	};
	const window = {
		matchMedia(query: string) {
			return {
				matches:
					(query === "(prefers-reduced-motion: reduce)" &&
						(options.reducedMotion ?? false)) ||
					(query === "(forced-colors: active)" &&
						(options.forcedColors ?? false)),
			};
		},
		requestAnimationFrame(callback: (time: number) => void) {
			const id = nextFrame++;
			frames.set(id, callback);
			return id;
		},
	};
	function step(time: number) {
		const callbacks = [...frames.values()];
		frames.clear();
		for (const callback of callbacks) callback(time);
	}
	const { decodeOnce } = createDecode(window, document);
	return {
		children,
		decode: () => decodeOnce(host as unknown as HTMLElement, 300),
		frames,
		hostAttributes,
		masks,
		step,
		textWrites,
	};
}

test("resolves left to right and keeps the line the same shape", () => {
	const random = sequence(0, 0.5, 0.99);
	expect(decodeFrame("Rawkode Academy", 1, random)).toBe("Rawkode Academy");
	for (const progress of [0, 0.2, 0.5, 0.8]) {
		const frame = decodeFrame("14:32 CEST · intar.dev", progress, random);
		expect(frame).toHaveLength(22);
		expect(frame).toMatch(/^[\x20-\x7e·]+$/);
		expect([frame[2], frame[5], frame[10], frame[11], frame[18]]).toEqual([
			":",
			" ",
			" ",
			"·",
			".",
		]);
	}
});

test("scrambles each character with a glyph of the same kind", () => {
	const frame = decodeFrame("Ab9", 0, sequence(0.3));
	expect(frame).toMatch(/^[A-Z][a-z][0-9]$/);
	expect(decodeFrame("Ab9", 0.34, sequence(0.3))[0]).toBe("A");
});

test("the resolved prefix only grows", () => {
	const text = "Rawkode Academy";
	let previous = 0;
	for (let step = 0; step <= 20; step += 1) {
		const frame = decodeFrame(text, step / 20, sequence(0.42));
		let resolved = 0;
		while (resolved < text.length && frame[resolved] === text[resolved])
			resolved += 1;
		expect(resolved).toBeGreaterThanOrEqual(previous);
		previous = resolved;
	}
	expect(previous).toBe(text.length);
});

test("draws the scramble on an aria-hidden mask and leaves the text alone", () => {
	const fixture = createFixture();
	expect(fixture.decode()).toBe(true);
	expect(fixture.masks).toHaveLength(1);
	const [mask] = fixture.masks;
	expect(mask?.className).toBe("decode-mask");
	expect(mask?.attributes.get("aria-hidden")).toBe("true");
	expect(fixture.children).toEqual([mask]);
	expect(fixture.hostAttributes.has("data-decoding")).toBe(true);

	fixture.step(0);
	fixture.step(120);
	expect(mask?.textContent).toHaveLength(5);
	expect(mask?.textContent[2]).toBe(":");
	expect(fixture.decode()).toBe(false);
	expect(fixture.frames.size).toBe(1);

	fixture.step(320);
	expect(mask?.removed).toBe(true);
	expect(fixture.hostAttributes.has("data-decoding")).toBe(false);
	expect(fixture.frames.size).toBe(0);
	expect(fixture.textWrites).toEqual([]);
});

test("stays still for reduced motion, forced colours, and hidden tabs", () => {
	for (const options of [
		{ reducedMotion: true },
		{ forcedColors: true },
		{ hidden: true },
	]) {
		const fixture = createFixture(options);
		expect(fixture.decode()).toBe(false);
		expect([fixture.masks.length, fixture.frames.size]).toEqual([0, 0]);
	}
});
