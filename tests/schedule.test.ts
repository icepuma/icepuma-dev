import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	msUntilNextMinute,
	scheduleMoment,
	WEEKDAYS,
	weekFraction,
} from "../src/utils/schedule";

test("reads the weekday and clock in Berlin, whatever the visitor's zone", () => {
	expect(scheduleMoment(new Date("2026-09-23T12:00:00Z"))).toEqual({
		weekday: "Wed",
		dayIndex: 2,
		hour: 14,
		minute: 0,
		time: "14:00",
		zone: "CEST",
	});
	// Late Sunday in UTC is already Monday in Berlin.
	expect(scheduleMoment(new Date("2026-09-27T22:30:00Z"))).toMatchObject({
		weekday: "Mon",
		dayIndex: 0,
		time: "00:30",
		zone: "CEST",
	});
	expect(scheduleMoment(new Date("2026-09-23T22:30:00Z"))).toMatchObject({
		weekday: "Thu",
		dayIndex: 3,
		hour: 0,
		minute: 30,
	});
});

test("follows both daylight saving changes", () => {
	expect(scheduleMoment(new Date("2026-03-29T00:59:00Z"))).toMatchObject({
		time: "01:59",
		zone: "CET",
	});
	expect(scheduleMoment(new Date("2026-03-29T01:00:00Z"))).toMatchObject({
		time: "03:00",
		zone: "CEST",
	});
	expect(scheduleMoment(new Date("2026-10-25T00:59:00Z"))).toMatchObject({
		time: "02:59",
		zone: "CEST",
	});
	expect(scheduleMoment(new Date("2026-10-25T01:00:00Z"))).toMatchObject({
		time: "02:00",
		zone: "CET",
	});
});

test("maps the week onto the length of the tuning scale", () => {
	expect(weekFraction(0, 0, 0)).toBe(0);
	expect(weekFraction(3, 12, 0)).toBeCloseTo(0.5);
	expect(weekFraction(4, 2, 30)).toBeCloseTo(98.5 / 168);
	expect(weekFraction(6, 23, 59)).toBeGreaterThan(0.9999);
	expect(weekFraction(6, 23, 59)).toBeLessThan(1);
});

test("waits until the next minute boundary", () => {
	expect(msUntilNextMinute(new Date("2026-09-23T10:15:42.500Z"))).toBe(17_500);
	expect(msUntilNextMinute(new Date("2026-09-23T10:15:00.000Z"))).toBe(60_000);
});

test("uses the same day order as the schedule", () => {
	const schedule = readFileSync(
		fileURLToPath(
			new URL("../src/content/calendar/schedule.yaml", import.meta.url),
		),
		"utf8",
	);
	const days = Array.from(
		schedule.matchAll(/^\s*day:\s*(\w+)/gm),
		(match) => match[1],
	);
	expect(days).toEqual([...WEEKDAYS]);
});
