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
	for (const [name, palette] of palettes()) {
		for (const text of [
			"foreground",
			"muted-foreground",
			"primary",
			"accent",
		]) {
			for (const ground of ["background", "surface", "surface-hover"]) {
				const ratio = contrast(color(palette, text), color(palette, ground));
				if (ratio < 4.5)
					failures.push(`${name}: ${text} on ${ground} ${ratio.toFixed(2)}`);
			}
		}
		const onPrimary = contrast(
			color(palette, "primary-foreground"),
			color(palette, "primary"),
		);
		if (onPrimary < 4.5)
			failures.push(`${name}: primary-foreground ${onPrimary.toFixed(2)}`);
		for (const ground of ["background", "surface"]) {
			const ratio = contrast(color(palette, "ring"), color(palette, ground));
			if (ratio < 3)
				failures.push(`${name}: ring on ${ground} ${ratio.toFixed(2)}`);
		}
	}
	expect(failures).toEqual([]);
});

test("the registration grid stays a whisper", () => {
	for (const [name, palette] of palettes()) {
		const ratio = contrast(
			color(palette, "grid-mark"),
			color(palette, "background"),
		);
		expect({ name, faint: ratio <= 1.3 }).toEqual({ name, faint: true });
	}
});
