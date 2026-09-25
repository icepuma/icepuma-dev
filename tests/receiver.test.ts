import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type ReceiverModule = typeof import("../src/utils/receiver");
type ReceiverFactory = (
	window: object,
	document: object,
) => Pick<
	ReceiverModule,
	"initReceiverClock" | "markToday" | "showDigits" | "slotAt"
>;

// receiver.ts imports schedule.ts and lcd.ts, so the three sources are
// joined into one scope with their imports and exports removed.
const receiverSource = ["schedule", "lcd", "receiver"]
	.map((name) =>
		readFileSync(
			fileURLToPath(new URL(`../src/utils/${name}.ts`, import.meta.url)),
			"utf8",
		),
	)
	.join("\n")
	.replace(/^import\b[\s\S]*?;[ \t]*$/gm, "")
	.replaceAll("export ", "");
const createReceiver = new Function(
	"window",
	"document",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${receiverSource}\nreturn { initReceiverClock, markToday, showDigits, slotAt };`,
	),
) as ReceiverFactory;

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

	querySelectorAll(selector: string) {
		return (this.lookup[selector] as unknown[] | undefined) ?? [];
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

function createDisplay() {
	const cells = Array.from({ length: 4 }, () => {
		const segments = Object.fromEntries(
			["a", "b", "c", "d", "e", "f", "g"].map((segment) => [
				`[data-segment="${segment}"]`,
				new FakeElement("path"),
			]),
		);
		return new FakeElement("g", {}, segments);
	});
	const display = new FakeElement("svg", {}, { "[data-digit]": cells });
	const lit = () =>
		cells.map((cell) =>
			["a", "b", "c", "d", "e", "f", "g"]
				.filter((segment) =>
					(
						cell.lookup[`[data-segment="${segment}"]`] as FakeElement
					).hasAttribute("data-lit"),
				)
				.join(""),
		);
	return { display, lit };
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
	const scaleDays = week.map(({ day }) => new FakeElement("span", { day }));
	const stations = ["Mon Tue", "Wed Thu", "Fri", "Sat Sun"].map(
		(days) => new FakeElement("span", { days }),
	);
	const { display, lit } = createDisplay();
	const parts = {
		"[data-live-clock]": new FakeElement("time"),
		"[data-live-readout]": (() => {
			const readout = new FakeElement("dl");
			readout.setAttribute("data-pending", "");
			return readout;
		})(),
		"[data-live-today]": new FakeElement("dd"),
		"[data-live-zone]": new FakeElement("span"),
		"[data-lcd]": display,
		"[data-scale]": new FakeElement("div"),
	};
	const document = Object.assign(new EventTarget(), {
		hidden: false,
		createElement: (tag: string) => new FakeElement(tag),
		querySelector(selector: string) {
			const row = selector.match(/^\.calendar-row\[data-day="(\w+)"\]$/);
			if (row)
				return rows.find((entry) => entry.dataset.day === row[1]) ?? null;
			return parts[selector as keyof typeof parts] ?? null;
		},
		querySelectorAll(selector: string) {
			if (selector === "[data-day]") return [...rows, ...scaleDays];
			if (selector === "[data-days]") return stations;
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
		setTimeout(callback: () => void, delay: number) {
			const id = nextTimer++;
			timers.set(id, { callback, delay });
			return id;
		},
	};
	let now = new Date("2026-09-23T12:00:00Z");
	return {
		document,
		lit,
		now: () => now,
		parts,
		receiver: createReceiver(window, document),
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
			[...rows, ...scaleDays, ...stations]
				.filter((element) => element.hasAttribute("data-today"))
				.map(
					(element) =>
						`${element.tag}:${element.dataset.day ?? element.dataset.days}`,
				),
	};
}

test("marks Berlin's today on the calendar, the scale, and the readout", () => {
	const fixture = createFixture();
	expect(fixture.receiver.markToday(fixture.now)).toBe("Wed");
	expect(fixture.todayMarks()).toEqual(["div:Wed", "span:Wed", "span:Wed Thu"]);
	const terms = fixture.rows.map(
		(row) =>
			(row.lookup.dt as FakeElement).attributes.get("aria-current") ?? null,
	);
	expect(terms).toEqual([null, null, "date", null, null, null, null]);

	const [link] = fixture.parts["[data-live-today]"].children as FakeElement[];
	expect([link?.tag, link?.href, link?.target, link?.rel]).toEqual([
		"a",
		"https://github.com/rawkode-academy/rawkode-academy",
		"_blank",
		"noopener noreferrer",
	]);
	const [label, arrow, note] = (link?.children ?? []) as FakeElement[];
	expect(label?.textContent).toBe("Rawkode Academy");
	expect(arrow).toEqual({ cloneOf: "svg" });
	expect(note?.textContent).toBe(" (opens in a new tab)");

	// Saturday early morning in Berlin is still Friday in UTC.
	fixture.setNow("2026-09-25T23:30:00Z");
	expect(fixture.receiver.markToday(fixture.now)).toBe("Sat");
	expect(fixture.todayMarks()).toEqual(["div:Sat", "span:Sat", "span:Sat Sun"]);
	const [off] = fixture.parts["[data-live-today]"].children as FakeElement[];
	expect([off?.tag, off?.className, off?.textContent]).toEqual([
		"span",
		"live-off",
		"Off",
	]);
});

test("lights the display's segments for a reading", () => {
	const { display, lit } = createDisplay();
	const { receiver } = createFixture();
	receiver.showDigits(display as unknown as Element, "14:32");
	expect(lit()).toEqual(["bc", "bcfg", "abcdg", "abdeg"]);
	receiver.showDigits(display as unknown as Element, "08:07");
	expect(lit()).toEqual(["abcdef", "abcdefg", "abcdef", "abc"]);
});

test("runs the clock once a minute, moves the needle, and rolls the day over", () => {
	const fixture = createFixture();
	fixture.setNow("2026-09-23T12:00:42Z");
	fixture.receiver.initReceiverClock(fixture.now);

	const { parts } = fixture;
	expect(parts["[data-live-readout]"].hasAttribute("data-pending")).toBe(false);
	expect(parts["[data-live-clock]"].textContent).toBe("14:00");
	expect(parts["[data-live-clock]"].attributes.get("datetime")).toBe("14:00");
	expect(parts["[data-live-zone]"].textContent).toBe("CEST");
	expect(fixture.lit()).toEqual(["bc", "bcfg", "abcdef", "abcdef"]);
	// Wednesday 14:00 is 62 hours into the 168-hour week.
	expect(parts["[data-scale]"].style.values.get("--now")).toBe(
		(62 / 168).toFixed(5),
	);
	expect(parts["[data-scale]"].hasAttribute("data-now")).toBe(true);
	expect([...fixture.timers.values()].map((timer) => timer.delay)).toEqual([
		18_000,
	]);
	expect(fixture.todayMarks()).toEqual(["div:Wed", "span:Wed", "span:Wed Thu"]);

	fixture.setNow("2026-09-23T22:00:00Z");
	fixture.runTimer();
	expect(parts["[data-live-clock]"].textContent).toBe("00:00");
	expect(fixture.todayMarks()).toEqual(["div:Thu", "span:Thu", "span:Wed Thu"]);
	expect(fixture.timers.size).toBe(1);

	fixture.document.hidden = true;
	fixture.document.dispatchEvent(new Event("visibilitychange"));
	expect(fixture.timers.size).toBe(0);
	fixture.document.hidden = false;
	fixture.setNow("2026-09-23T22:05:10Z");
	fixture.document.dispatchEvent(new Event("visibilitychange"));
	expect(parts["[data-live-clock]"].textContent).toBe("00:05");
	expect(fixture.timers.size).toBe(1);
});

test("divides the scale into one slot per day and clamps at the ends", () => {
	const { receiver } = createFixture();
	expect(receiver.slotAt(150, 100, 700, 7)).toEqual({
		fraction: 50 / 700,
		index: 0,
	});
	expect(receiver.slotAt(450, 100, 700, 7).index).toBe(3);
	expect(receiver.slotAt(0, 100, 700, 7)).toEqual({ fraction: 0, index: 0 });
	expect(receiver.slotAt(2000, 100, 700, 7)).toEqual({ fraction: 1, index: 6 });
});
