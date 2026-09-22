import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type HudModule = typeof import("../src/utils/hud");
type HudFactory = (
	window: object,
	document: object,
) => Pick<HudModule, "approach" | "initHudClock" | "markToday" | "tiltFor">;

// hud.ts imports schedule.ts and decode.ts, so the three sources are joined
// into one scope with their imports and exports removed.
const hudSource = ["schedule", "decode", "hud"]
	.map((name) =>
		readFileSync(
			fileURLToPath(new URL(`../src/utils/${name}.ts`, import.meta.url)),
			"utf8",
		),
	)
	.join("\n")
	.replace(/^import\b[\s\S]*?;[ \t]*$/gm, "")
	.replaceAll("export ", "");
const createHud = new Function(
	"window",
	"document",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${hudSource}\nreturn { approach, initHudClock, markToday, tiltFor };`,
	),
) as HudFactory;

const week = [
	{ day: "Mon", focus: "intar.dev", url: "https://github.com/intar-dev" },
	{ day: "Tue", focus: "intar.dev", url: "https://github.com/intar-dev" },
	{
		day: "Wed",
		focus: "Rawkode Academy",
		url: "https://github.com/rawkode-academy/rawkode-academy",
	},
	{
		day: "Thu",
		focus: "Rawkode Academy",
		url: "https://github.com/rawkode-academy/rawkode-academy",
	},
	{
		day: "Fri",
		focus: "Waddle",
		url: "https://github.com/waddle-social/waddle",
	},
	{ day: "Sat", focus: "Off", url: "" },
	{ day: "Sun", focus: "Off", url: "" },
];

class FakeElement {
	attributes = new Map<string, string>();
	children: unknown[] = [];
	classes = new Set<string>();
	dataset: Record<string, string | undefined>;
	hidden = false;
	href = "";
	rel = "";
	target = "";
	textContent = "";
	style = {
		values: new Map<string, string>(),
		setProperty(name: string, value: string) {
			this.values.set(name, value);
		},
	};
	classList = {
		add: (name: string) => {
			this.classes.add(name);
		},
	};

	constructor(
		readonly tag: string,
		dataset: Record<string, string> = {},
		readonly lookup: Record<string, unknown> = {},
	) {
		this.dataset = { ...dataset };
	}

	get className() {
		return [...this.classes].join(" ");
	}

	set className(value: string) {
		this.classes = new Set(value.split(" ").filter(Boolean));
	}

	append(...nodes: unknown[]) {
		this.children.push(...nodes);
	}

	cloneNode() {
		return { cloneOf: this.tag };
	}

	hasAttribute(name: string) {
		return this.attributes.has(name);
	}

	querySelector(selector: string) {
		return this.lookup[selector] ?? null;
	}

	removeAttribute(name: string) {
		this.attributes.delete(name);
	}

	replaceChildren(...nodes: unknown[]) {
		this.children = nodes;
	}

	setAttribute(name: string, value: string) {
		this.attributes.set(name, value);
	}
}

function createFixture() {
	const rows = week.map(({ day, focus, url }) => {
		const dt = new FakeElement("dt");
		const arrow = new FakeElement("svg");
		const link = url
			? Object.assign(new FakeElement("a", {}, { ".external-arrow": arrow }), {
					href: url,
				})
			: null;
		return new FakeElement("div", { day, focus }, { dt, "a[href]": link });
	});
	const arcs = week.map(({ day }) => new FakeElement("path", { day }));
	const parts = {
		"[data-hud-clock]": new FakeElement("time"),
		"[data-hud-dial]": new FakeElement("div"),
		"[data-hud-dial-day]": new FakeElement("span"),
		"[data-hud-readout]": Object.assign(new FakeElement("dl"), {
			hidden: true,
		}),
		"[data-hud-today]": new FakeElement("dd"),
		"[data-hud-zone]": new FakeElement("span"),
	};
	const document = Object.assign(new EventTarget(), {
		hidden: false,
		documentElement: { hasAttribute: () => false },
		createElement: (tag: string) => new FakeElement(tag),
		querySelector(selector: string) {
			const row = selector.match(/^\.calendar-row\[data-day="(\w+)"\]$/);
			if (row)
				return rows.find((entry) => entry.dataset.day === row[1]) ?? null;
			return parts[selector as keyof typeof parts] ?? null;
		},
		querySelectorAll(selector: string) {
			if (selector === "[data-day]") return [...rows, ...arcs];
			if (selector === ".calendar-row dt")
				return rows.map((row) => row.lookup.dt);
			return [];
		},
	});
	const timers = new Map<number, { callback: () => void; delay: number }>();
	let nextTimer = 1;
	const window = {
		clearTimeout(id: number) {
			timers.delete(id);
		},
		matchMedia: () => ({ matches: false }),
		requestAnimationFrame: () => 0,
		setTimeout(callback: () => void, delay: number) {
			const id = nextTimer++;
			timers.set(id, { callback, delay });
			return id;
		},
	};
	let now = new Date("2026-09-23T12:00:00Z");
	const hud = createHud(window, document);
	return {
		arcs,
		document,
		hud,
		now: () => now,
		parts,
		rows,
		runTimer() {
			const [entry] = timers.entries();
			if (!entry) throw new Error("No timer is scheduled.");
			timers.delete(entry[0]);
			entry[1].callback();
		},
		setNow(value: string) {
			now = new Date(value);
		},
		timers,
		todayMarks: () =>
			[...rows, ...arcs]
				.filter((element) => element.hasAttribute("data-today"))
				.map((element) => `${element.tag}:${element.dataset.day}`),
	};
}

test("marks Berlin's today on the calendar, the dial, and the readout", () => {
	const fixture = createFixture();
	expect(fixture.hud.markToday(fixture.now)).toBe("Wed");
	expect(fixture.todayMarks()).toEqual(["div:Wed", "path:Wed"]);
	const terms = fixture.rows.map(
		(row) =>
			(row.lookup.dt as FakeElement).attributes.get("aria-current") ?? null,
	);
	expect(terms).toEqual([null, null, "date", null, null, null, null]);
	expect(fixture.parts["[data-hud-dial-day]"].textContent).toBe("WED");

	const [link] = fixture.parts["[data-hud-today]"].children as FakeElement[];
	expect([link?.tag, link?.href, link?.target, link?.rel]).toEqual([
		"a",
		"https://github.com/rawkode-academy/rawkode-academy",
		"_blank",
		"noopener noreferrer",
	]);
	const [label, arrow, note] = (link?.children ?? []) as FakeElement[];
	expect([label?.className, label?.textContent]).toEqual([
		"decode",
		"Rawkode Academy",
	]);
	expect(arrow).toEqual({ cloneOf: "svg" });
	expect(note?.textContent).toBe(" (opens in a new tab)");

	// Saturday early morning in Berlin is still Friday in UTC.
	fixture.setNow("2026-09-25T23:30:00Z");
	expect(fixture.hud.markToday(fixture.now)).toBe("Sat");
	expect(fixture.todayMarks()).toEqual(["div:Sat", "path:Sat"]);
	const [off] = fixture.parts["[data-hud-today]"].children as FakeElement[];
	expect([off?.tag, off?.className, off?.textContent]).toEqual([
		"span",
		"decode hud-off",
		"Off",
	]);
});

test("runs the clock once a minute and rolls the day over", () => {
	const fixture = createFixture();
	fixture.setNow("2026-09-23T12:00:42Z");
	fixture.hud.initHudClock(fixture.now);

	const { parts } = fixture;
	expect(parts["[data-hud-readout]"].hidden).toBe(false);
	expect(parts["[data-hud-clock]"].textContent).toBe("14:00");
	expect(parts["[data-hud-clock]"].attributes.get("datetime")).toBe("14:00");
	expect(parts["[data-hud-zone]"].textContent).toBe("CEST");
	expect(parts["[data-hud-dial]"].style.values.get("--now")).toBe("132.86deg");
	expect(parts["[data-hud-dial]"].hasAttribute("data-now")).toBe(true);
	expect([...fixture.timers.values()].map((timer) => timer.delay)).toEqual([
		18_000,
	]);
	expect(fixture.todayMarks()).toEqual(["div:Wed", "path:Wed"]);

	fixture.setNow("2026-09-23T22:00:00Z");
	fixture.runTimer();
	expect(parts["[data-hud-clock]"].textContent).toBe("00:00");
	expect(parts["[data-hud-dial-day]"].textContent).toBe("THU");
	expect(fixture.todayMarks()).toEqual(["div:Thu", "path:Thu"]);
	expect(fixture.timers.size).toBe(1);

	fixture.document.hidden = true;
	fixture.document.dispatchEvent(new Event("visibilitychange"));
	expect(fixture.timers.size).toBe(0);
	fixture.document.hidden = false;
	fixture.setNow("2026-09-23T22:05:10Z");
	fixture.document.dispatchEvent(new Event("visibilitychange"));
	expect(parts["[data-hud-clock]"].textContent).toBe("00:05");
	expect(fixture.timers.size).toBe(1);
});

test("tilts toward the pointer within four degrees and eases without overshoot", () => {
	const { hud } = createFixture();
	const rect = { left: 900, top: 100, width: 300, height: 300 };
	const viewport = { width: 1440, height: 900 };
	expect(hud.tiltFor({ x: 1050, y: 250 }, rect, viewport)).toEqual({
		x: 0,
		y: 0,
	});
	expect(hud.tiltFor({ x: 5000, y: -5000 }, rect, viewport)).toEqual({
		x: 4,
		y: 4,
	});
	const left = hud.tiltFor({ x: 0, y: 700 }, rect, viewport);
	expect(left.x).toBeLessThan(0);
	expect(left.y).toBeLessThan(0);
	expect(Math.abs(left.x)).toBeLessThanOrEqual(4);

	let value = 0;
	for (const elapsed of [16, 16, 64, 200, 1000]) {
		const next = hud.approach(value, 4, elapsed);
		expect(next).toBeGreaterThan(value);
		expect(next).toBeLessThanOrEqual(4);
		value = next;
	}
	expect(hud.approach(4, 4, 16)).toBe(4);
});
