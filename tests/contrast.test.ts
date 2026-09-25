import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Tokens = Record<string, string>;

const tokensSource = readFileSync(
	fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url)),
	"utf8",
);

function tokenBlocks(source: string) {
	const blocks = new Map<string, Tokens>();
	for (const [, name = "", body = ""] of source.matchAll(
		/\/\* tokens:([a-z-]+) \*\/\s*[^{]+\{([^}]*)\}/g,
	)) {
		const tokens: Tokens = {};
		for (const [, key = "", value = ""] of body.matchAll(
			/--([a-z-]+):\s*([^;]+);/g,
		))
			tokens[key] = value.trim();
		blocks.set(name, tokens);
	}
	return blocks;
}

const blocks = tokenBlocks(tokensSource);

function block(name: string) {
	const tokens = blocks.get(name);
	if (!tokens) throw new Error(`Missing the tokens:${name} block.`);
	return tokens;
}

function color(palette: Tokens, token: string) {
	const value = palette[token];
	if (!value || !/^#[\da-f]{6}$/i.test(value))
		throw new Error(`--${token} must be a six-digit hex colour, got ${value}.`);
	return value;
}

function luminance(hex: string) {
	const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((offset) => {
		const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
		return channel <= 0.03928
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
	const [lighter = 0, darker = 0] = [
		luminance(foreground),
		luminance(background),
	].sort((left, right) => right - left);
	return (lighter + 0.05) / (darker + 0.05);
}

const palettes = () =>
	[
		["light", block("light")],
		["dark", block("dark")],
		["light-more", { ...block("light"), ...block("light-more") }],
		["dark-more", { ...block("dark"), ...block("dark-more") }],
	] as const;

test("both themes define the same tokens and the no-JS copies match", () => {
	expect(Object.keys(block("dark")).sort()).toEqual(
		Object.keys(block("light")).sort(),
	);
	expect(Object.keys(block("dark-more")).sort()).toEqual(
		Object.keys(block("light-more")).sort(),
	);
	expect(block("dark-system")).toEqual(block("dark"));
	expect(block("dark-more-system")).toEqual(block("dark-more"));
});

test("every text token meets AA on every ground", () => {
	const failures: string[] = [];
	const measure = (
		name: string,
		palette: Tokens,
		text: string,
		ground: string,
		minimum: number,
	) => {
		const ratio = contrast(color(palette, text), color(palette, ground));
		if (ratio < minimum)
			failures.push(`${name}: ${text} on ${ground} ${ratio.toFixed(2)}`);
	};
	for (const [name, palette] of palettes()) {
		for (const text of ["foreground", "muted-foreground", "primary"])
			for (const ground of ["background", "surface", "surface-hover"])
				measure(name, palette, text, ground, 4.5);
		measure(name, palette, "primary-foreground", "primary", 4.5);
		// The Today tag and a lit action key print on signal orange.
		measure(name, palette, "signal-foreground", "signal", 4.5);
		// The scale is printed on the receiver's black glass, and the clock is
		// read off the display.
		for (const text of ["window-foreground", "window-muted"])
			measure(name, palette, text, "window", 4.5);
		measure(name, palette, "lcd-ink", "lcd", 4.5);
		for (const ground of ["background", "surface"])
			measure(name, palette, "ring", ground, 3);
	}
	expect(failures).toEqual([]);
});

test("the needle, the indicator, and the lamps stand out as marks", () => {
	const failures: string[] = [];
	for (const [name, palette] of palettes()) {
		for (const [mark, ground] of [
			["signal", "window"],
			["signal", "surface"],
			["signal", "surface-hover"],
			["lamp", "surface"],
			["lamp", "background"],
		] as const) {
			const ratio = contrast(color(palette, mark), color(palette, ground));
			if (ratio < 3)
				failures.push(`${name}: ${mark} on ${ground} ${ratio.toFixed(2)}`);
		}
	}
	expect(failures).toEqual([]);
});
