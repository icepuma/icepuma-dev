import { expect, test } from "bun:test";
import { arcPath, polar, segments, tickPath } from "../src/utils/dial";

test("measures angles clockwise from twelve o'clock", () => {
	expect(polar(200, 200, 100, 0)).toEqual({ x: 200, y: 100 });
	expect(polar(200, 200, 100, 90)).toEqual({ x: 300, y: 200 });
	expect(polar(200, 200, 100, 180)).toEqual({ x: 200, y: 300 });
});

test("splits the week into seven equal arcs with gaps from the top", () => {
	const days = segments(7, 3);
	expect(days).toHaveLength(7);
	expect(days[0]?.start).toBe(1.5);
	expect(days.at(-1)?.end).toBeCloseTo(358.5, 1);
	for (const [index, day] of days.entries()) {
		expect(day.end - day.start).toBeCloseTo(360 / 7 - 3, 1);
		expect(day.mid).toBeCloseTo((index + 0.5) * (360 / 7), 1);
	}
});

test("draws each arc on its circle, clockwise and short", () => {
	for (const day of segments(7, 3)) {
		const path = arcPath(200, 200, 160, day.start, day.end);
		const [x1, y1, rx, ry, rotation, largeArc, sweep, x2, y2] = Array.from(
			path.matchAll(/-?\d+(?:\.\d+)?/g),
			(match) => Number(match[0]),
		);
		expect([rx, ry, rotation, largeArc, sweep]).toEqual([160, 160, 0, 0, 1]);
		for (const [x, y] of [
			[x1, y1],
			[x2, y2],
		])
			expect(Math.hypot((x ?? 0) - 200, (y ?? 0) - 200)).toBeCloseTo(160, 1);
	}
});

test("marks every hour of the week exactly once", () => {
	const count = (path: string) => path.split("M").length - 1;
	const hours = tickPath(200, 200, 186, 168, 4, (index) => index % 6 !== 0);
	const quarters = tickPath(
		200,
		200,
		186,
		168,
		7,
		(index) => index % 6 === 0 && index % 24 !== 0,
	);
	const days = tickPath(200, 200, 186, 168, 12, (index) => index % 24 === 0);
	expect([count(hours), count(quarters), count(days)]).toEqual([140, 21, 7]);
	expect(days.startsWith("M200 26L200 14")).toBe(true);
});
