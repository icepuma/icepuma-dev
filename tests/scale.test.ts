import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bandPath, HOUR, scaleTicks, stations, WEEK } from "../src/utils/scale";

const schedule = readFileSync(
	fileURLToPath(
		new URL("../src/content/calendar/schedule.yaml", import.meta.url),
	),
	"utf8",
);
const week = schedule.split(/\n(?=- id:)/).map((entry) => ({
	day: entry.match(/^\s*day:\s*(\w+)/m)?.[1] ?? "",
	focus: entry.match(/^\s*focus:\s*"?([^"\n]+)"?/m)?.[1] ?? "",
	url: entry.match(/^\s*url:\s*(\S+)/m)?.[1],
}));

test("marks every hour of the week once, with a closing tick after Sunday", () => {
	const count = (path: string) => path.split("M").length - 1;
	const hours = scaleTicks(25, 31, (hour) => hour % 6 !== 0);
	const quarters = scaleTicks(
		21,
		31,
		(hour) => hour % 6 === 0 && hour % 24 !== 0,
	);
	const midnights = scaleTicks(12, 31, (hour) => hour % 24 === 0);
	expect([count(hours), count(quarters), count(midnights)]).toEqual([
		140, 21, 8,
	]);
	expect(midnights.startsWith("M0 12V31")).toBe(true);
	expect(midnights.endsWith(`M${WEEK} 12V31`)).toBe(true);
	expect(WEEK).toBe(168 * HOUR);
});

test("groups the schedule into stations of consecutive days", () => {
	expect(week).toHaveLength(7);
	const bands = stations(week);
	expect(
		bands.map(({ focus, off, days, column }) => ({ focus, off, days, column })),
	).toEqual([
		{
			focus: "intar.dev",
			off: false,
			days: ["Mon", "Tue"],
			column: "1 / 3",
		},
		{
			focus: "Rawkode Academy",
			off: false,
			days: ["Wed", "Thu"],
			column: "3 / 5",
		},
		{ focus: "Waddle", off: false, days: ["Fri"], column: "5 / 6" },
		{ focus: "Off", off: true, days: ["Sat", "Sun"], column: "6 / 8" },
	]);
	expect(bands.map(({ start, end }) => [start * 7, end * 7])).toEqual([
		[0, 2],
		[2, 4],
		[4, 5],
		[5, 7],
	]);
});

test("keeps a day off apart from a working day with the same name", () => {
	const bands = stations([
		{ day: "Mon", focus: "Off", url: "https://example.com" },
		{ day: "Tue", focus: "Off" },
	]);
	expect(bands.map(({ off, column }) => [off, column])).toEqual([
		[false, "1 / 2"],
		[true, "2 / 3"],
	]);
});

test("brackets each station an hour short of its ends", () => {
	const [first] = stations(week);
	if (!first) throw new Error("No stations.");
	expect(bandPath(first, 1, 5)).toBe(`M${HOUR} 5V1H${2 * 24 * HOUR - HOUR}V5`);
});
