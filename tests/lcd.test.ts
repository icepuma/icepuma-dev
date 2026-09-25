import { expect, test } from "bun:test";
import { clockDigits, DIGITS, SEGMENTS, segmentPath } from "../src/utils/lcd";

test("lights the usual segments for every digit", () => {
	expect(
		Object.fromEntries(
			Object.entries(DIGITS).map(([digit, lit]) => [digit, lit.length]),
		),
	).toEqual({
		"0": 6,
		"1": 2,
		"2": 5,
		"3": 5,
		"4": 4,
		"5": 5,
		"6": 6,
		"7": 3,
		"8": 7,
		"9": 6,
	});
	expect(DIGITS["8"]).toEqual(SEGMENTS);
	expect(DIGITS["1"]).toEqual(["b", "c"]);
	// Only 0, 1, and 7 leave the middle bar dark.
	expect(
		Object.entries(DIGITS)
			.filter(([, lit]) => !lit.includes("g"))
			.map(([digit]) => digit),
	).toEqual(["0", "1", "7"]);
});

test("reads four digits from a clock time", () => {
	expect(clockDigits("14:32")).toEqual(["1", "4", "3", "2"]);
	expect(clockDigits("9:05")).toEqual(["0", "9", "0", "5"]);
	expect(clockDigits("")).toEqual(["0", "0", "0", "0"]);
});

test("draws each segment as a closed hexagon inside its cell", () => {
	for (const segment of SEGMENTS) {
		const path = segmentPath(segment);
		expect(path.startsWith("M")).toBe(true);
		expect(path.endsWith("Z")).toBe(true);
		const points = Array.from(
			path.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g),
			(match) => [Number(match[1]), Number(match[2])] as const,
		);
		expect(points).toHaveLength(6);
		for (const [x, y] of points) {
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(12);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(22);
		}
	}
});
