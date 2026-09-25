import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	approach,
	bearing,
	detent,
	nextPosition,
	positionAt,
	sheenFor,
	turn,
	warpAngle,
} from "../src/utils/knob";

type KnobModule = typeof import("../src/utils/knob");
type KnobFactory = (
	window: object,
	document: object,
) => Pick<KnobModule, "initKnob">;

const knobSource = readFileSync(
	fileURLToPath(new URL("../src/utils/knob.ts", import.meta.url)),
	"utf8",
).replaceAll("export ", "");
const createKnob = new Function(
	"window",
	"document",
	new Bun.Transpiler({ loader: "ts" }).transformSync(
		`${knobSource}\nreturn { initKnob };`,
	),
) as KnobFactory;

test("puts Auto at twelve o'clock and a detent either side", () => {
	expect([detent("light"), detent("system"), detent("dark")]).toEqual([
		-60, 0, 60,
	]);
	expect(
		["light", "system", "dark"].map((position) =>
			nextPosition(position as never),
		),
	).toEqual(["system", "dark", "light"]);
});

test("holds still in each detent and hurries over the ridge between two", () => {
	for (const angle of [-60, 0, 60])
		expect(warpAngle(angle)).toBeCloseTo(angle, 6);
	// The curve meets itself on the ridge, so a drag never jumps.
	for (const ridge of [-30, 30]) {
		expect(warpAngle(ridge - 1e-9)).toBeCloseTo(ridge, 6);
		expect(warpAngle(ridge + 1e-9)).toBeCloseTo(ridge, 6);
	}
	let previous = Number.NEGATIVE_INFINITY;
	for (let raw = -120; raw <= 120; raw += 0.5) {
		const angle = warpAngle(raw);
		expect(angle).toBeGreaterThanOrEqual(previous);
		previous = angle;
	}
	const slope = (at: number) =>
		(warpAngle(at + 0.01) - warpAngle(at - 0.01)) / 0.02;
	expect(slope(0)).toBeLessThan(0.5);
	expect(slope(30)).toBeGreaterThan(1.5);
});

test("gives a little past each end stop and no more", () => {
	expect(warpAngle(70)).toBeGreaterThan(60);
	expect(warpAngle(1000)).toBeLessThanOrEqual(69);
	expect(warpAngle(-1000)).toBeGreaterThanOrEqual(-69);
});

test("reads the position the knob points at", () => {
	expect(
		[-100, -60, -31, -29, 0, 29, 31, 60, 100].map((angle) => positionAt(angle)),
	).toEqual([
		"light",
		"light",
		"light",
		"system",
		"system",
		"system",
		"dark",
		"dark",
		"dark",
	]);
});

test("measures bearings clockwise from twelve o'clock and turns the short way", () => {
	const centre = { x: 0, y: 0 };
	expect(
		[
			{ x: 0, y: -1 },
			{ x: 1, y: 0 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
		].map((point) => bearing(centre, point)),
	).toEqual([0, 90, 180, -90]);
	expect([turn(170, -170), turn(-170, 170), turn(10, 50)]).toEqual([
		20, -20, 40,
	]);
});

test("turns the sheen toward the pointer within twelve degrees", () => {
	const centre = { x: 500, y: 300 };
	expect(sheenFor({ x: 500, y: 0 }, centre, 1000)).toBe(0);
	expect(sheenFor({ x: 1000, y: 0 }, centre, 1000)).toBe(12);
	expect(sheenFor({ x: -4000, y: 0 }, centre, 1000)).toBe(-12);
	let value = 0;
	for (const elapsed of [16, 16, 64, 400]) {
		const next = approach(value, 12, elapsed);
		expect(next).toBeGreaterThan(value);
		expect(next).toBeLessThanOrEqual(12);
		value = next;
	}
});

type Radio = EventTarget & { value: string; checked: boolean };

// Checking one radio unchecks the others, as in a real group.
function radioGroup(values: string[], initial: string) {
	let selected = initial;
	return values.map((value) => {
		const radio = Object.defineProperties(new EventTarget(), {
			value: { value },
			checked: {
				get: () => selected === value,
				set: (next: boolean) => {
					if (next) selected = value;
					else if (selected === value) selected = "";
				},
			},
		}) as Radio;
		// Clicking a radio checks it and reports the change, as a browser does.
		return Object.assign(radio, {
			click() {
				selected = value;
				radio.dispatchEvent(new Event("change"));
			},
		});
	});
}

function createFixture(
	checked = "system",
	options: { interrupt?: () => boolean } = {},
) {
	const radios = radioGroup(["light", "system", "dark"], checked);
	// The printed positions sit outside the knob, which spans 100–200.
	const labels = [
		[56, 100],
		[128, 30],
		[200, 100],
	].map(([left = 0, top = 0], index) => ({
		control: radios[index],
		getBoundingClientRect: () => ({
			left,
			top,
			right: left + 44,
			bottom: top + 44,
		}),
	}));
	const styles = new Map<string, string>();
	const knob = Object.assign(new EventTarget(), {
		style: {
			setProperty: (name: string, value: string) => styles.set(name, value),
			removeProperty: (name: string) => styles.delete(name),
		},
		getBoundingClientRect: () => ({
			left: 100,
			top: 100,
			width: 100,
			height: 100,
		}),
		setPointerCapture() {},
	});
	const dataset: Record<string, string | undefined> = {};
	const control = {
		dataset,
		querySelector: (selector: string) =>
			selector === "[data-knob]" ? knob : null,
		querySelectorAll: (selector: string) =>
			selector === 'input[type="radio"]'
				? radios
				: selector === "label"
					? labels
					: [],
	};
	const vibrations: number[] = [];
	const window = Object.assign(new EventTarget(), {
		innerWidth: 1000,
		matchMedia: () => ({ matches: false }),
		requestAnimationFrame: () => 1,
		navigator: { vibrate: (ms: number) => vibrations.push(ms) },
	});
	const document = { documentElement: new EventTarget() };
	const commits: Array<[string, { x: number; y: number; r: number }]> = [];
	const sources: string[] = [];
	const handle = createKnob(window, document).initKnob(
		control as unknown as HTMLElement,
		(position, origin, source) => {
			commits.push([position, origin]);
			sources.push(source);
		},
		options,
	);
	type Extra = Partial<{
		button: number;
		ctrlKey: boolean;
		isPrimary: boolean;
		pointerId: number;
		pointerType: string;
	}>;
	const event = (type: string, x: number, y: number, extra: Extra = {}) =>
		Object.assign(new Event(type, { cancelable: true }), {
			button: 0,
			clientX: x,
			clientY: y,
			ctrlKey: false,
			isPrimary: true,
			pointerId: 1,
			pointerType: "mouse",
			...extra,
		});
	const pointer = (type: string, x: number, y: number, extra: Extra = {}) => {
		const fired = event(type, x, y, extra);
		knob.dispatchEvent(fired);
		return fired;
	};
	// While a view transition runs, every press lands on the root.
	const pressRoot = (x: number, y: number) => {
		const fired = event("pointerdown", x, y);
		document.documentElement.dispatchEvent(fired);
		return fired;
	};
	const clickRoot = (x: number, y: number) =>
		document.documentElement.dispatchEvent(event("click", x, y));
	return {
		checked: () => radios.find((radio) => radio.checked)?.value,
		clickRoot,
		document,
		commits,
		dataset,
		handle,
		pointer,
		pressRoot,
		radios,
		sources,
		styles,
		vibrations,
	};
}

test("turns through the detents with a drag and commits on release", () => {
	const fixture = createFixture();
	// The knob's centre is at (150, 150); start at twelve o'clock.
	const down = fixture.pointer("pointerdown", 150, 110);
	expect(down.defaultPrevented).toBe(true);
	expect(fixture.dataset.turning).toBe("");

	fixture.pointer("pointermove", 190, 150);
	expect(fixture.styles.get("--knob-angle")).toBe("66.63deg");
	expect(fixture.checked()).toBe("dark");
	expect(fixture.vibrations).toEqual([8]);
	expect(fixture.commits).toEqual([]);

	fixture.pointer("pointerup", 190, 150);
	expect(fixture.commits).toEqual([["dark", { x: 150, y: 150, r: 50 }]]);
	expect(fixture.styles.has("--knob-angle")).toBe(false);
	expect(fixture.dataset.turning).toBeUndefined();
});

test("a tap advances one detent and swings back from Dark to Light", () => {
	const fixture = createFixture("dark");
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointerup", 151, 111);
	expect(fixture.commits.map(([position]) => position)).toEqual(["light"]);
	expect(fixture.checked()).toBe("light");
});

test("a drag that settles back in its detent changes nothing", () => {
	const fixture = createFixture();
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointermove", 160, 111);
	expect(fixture.checked()).toBe("system");
	fixture.pointer("pointerup", 160, 111);
	expect(fixture.commits).toEqual([]);
});

test("a cancelled drag returns to the committed position", () => {
	const fixture = createFixture();
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointermove", 110, 150);
	expect(fixture.checked()).toBe("light");
	fixture.pointer("pointercancel", 110, 150);
	expect([fixture.checked(), fixture.commits.length]).toEqual(["system", 0]);
	expect(fixture.styles.has("--knob-angle")).toBe(false);
});

test("ignores other buttons, other pointers, and the knob's centre", () => {
	const fixture = createFixture();
	fixture.pointer("pointerdown", 150, 110, { button: 2 });
	expect(fixture.dataset.turning).toBeUndefined();

	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointermove", 190, 150, { pointerId: 2 });
	expect(fixture.styles.has("--knob-angle")).toBe(false);
	// Two pixels from the centre the bearing means nothing, so it is ignored.
	fixture.pointer("pointermove", 152, 150);
	expect(fixture.styles.get("--knob-angle")).toBe("0.00deg");
});

test("a drag through the centre picks up where it comes out", () => {
	const fixture = createFixture();
	// A swipe straight down through the middle, as when scrolling past.
	fixture.pointer("pointerdown", 150, 108);
	fixture.pointer("pointermove", 150, 145);
	fixture.pointer("pointermove", 150, 192);
	expect(fixture.styles.get("--knob-angle")).toBe("0.00deg");
	fixture.pointer("pointerup", 150, 192);
	expect(fixture.commits).toEqual([]);
});

test("comes back from an end stop as soon as the hand does", () => {
	const fixture = createFixture("dark");
	// Wind far past Dark, three quarters of a turn in small steps.
	fixture.pointer("pointerdown", 150, 110);
	for (const [x, y] of [
		[190, 150],
		[150, 190],
		[110, 150],
	])
		fixture.pointer("pointermove", x, y);
	const pinned = Number.parseFloat(fixture.styles.get("--knob-angle") ?? "");
	expect(pinned).toBeGreaterThan(60);
	expect(pinned).toBeLessThan(67);
	// A quarter turn back leaves the end stop at once.
	fixture.pointer("pointermove", 150, 190);
	const back = Number.parseFloat(fixture.styles.get("--knob-angle") ?? "");
	expect(back).toBeLessThan(60);
});

test("a control-click opens the menu instead of turning the knob", () => {
	const fixture = createFixture();
	const down = fixture.pointer("pointerdown", 150, 110, { ctrlKey: true });
	fixture.pointer("pointerup", 150, 110);
	expect([down.defaultPrevented, fixture.dataset.turning]).toEqual([
		false,
		undefined,
	]);
	expect(fixture.commits).toEqual([]);
});

test("losing the pointer lets go of the knob", () => {
	const fixture = createFixture();
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointermove", 190, 150);
	fixture.pointer("lostpointercapture", 190, 150);
	expect([fixture.checked(), fixture.dataset.turning]).toEqual([
		"system",
		undefined,
	]);
	// A capture lost after a normal release changes nothing.
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointerup", 150, 110);
	fixture.pointer("lostpointercapture", 150, 110);
	expect(fixture.commits.map(([position]) => position)).toEqual(["dark"]);
});

test("a finger may wobble a little and still tap", () => {
	const touch = createFixture();
	touch.pointer("pointerdown", 150, 110, { pointerType: "touch" });
	touch.pointer("pointermove", 154, 118, { pointerType: "touch" });
	touch.pointer("pointerup", 154, 118, { pointerType: "touch" });
	expect(touch.commits.map(([position]) => position)).toEqual(["dark"]);

	const mouse = createFixture();
	mouse.pointer("pointerdown", 150, 110);
	mouse.pointer("pointermove", 154, 118);
	mouse.pointer("pointerup", 154, 118);
	expect(mouse.commits).toEqual([]);
});

test("tells a turn of the drawn knob from a change of its radios", () => {
	const fixture = createFixture();
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointerup", 150, 110);
	fixture.radios[0]?.click();
	expect(fixture.commits.map(([position]) => position)).toEqual([
		"dark",
		"light",
	]);
	expect(fixture.sources).toEqual(["pointer", "radio"]);
});

test("a press during a reveal ends it and turns the knob", () => {
	let interrupts = 0;
	const fixture = createFixture("light", {
		interrupt: () => {
			interrupts += 1;
			return true;
		},
	});
	const down = fixture.pressRoot(150, 110);
	expect([down.defaultPrevented, fixture.dataset.turning]).toEqual([true, ""]);
	fixture.pointer("pointerup", 150, 110);
	expect(fixture.commits.map(([position]) => position)).toEqual(["system"]);

	// A printed position works the same way.
	fixture.pressRoot(222, 122);
	expect(fixture.commits.map(([position]) => position)).toEqual([
		"system",
		"dark",
	]);
	expect(interrupts).toBe(2);
});

test("with no reveal running, a press on the root changes nothing", () => {
	let interrupts = 0;
	const idle = createFixture("light", {
		interrupt: () => {
			interrupts += 1;
			return false;
		},
	});
	idle.pressRoot(150, 110);
	idle.pressRoot(400, 400);
	expect([idle.dataset.turning, interrupts]).toEqual([undefined, 2]);
	expect(idle.commits).toEqual([]);
});

test("a press away from the knob ends a reveal and its click goes through", () => {
	const fixture = createFixture("light", { interrupt: () => true });
	const clicked: string[] = [];
	const link = { click: () => clicked.push("link") };
	Object.assign(fixture.document, {
		elementFromPoint: () => ({ closest: () => link }),
	});
	fixture.pressRoot(400, 400);
	fixture.clickRoot(400, 400);
	// Only the click that follows a press is forwarded.
	fixture.clickRoot(400, 400);
	expect(clicked).toEqual(["link"]);
	expect([fixture.dataset.turning, fixture.commits]).toEqual([undefined, []]);
});

test("commits a radio changed from the keyboard or a label", () => {
	const fixture = createFixture();
	const [light] = fixture.radios;
	if (!light) throw new Error("No radios.");
	light.checked = true;
	light.dispatchEvent(new Event("change"));
	expect(fixture.commits).toEqual([["light", { x: 150, y: 150, r: 50 }]]);
});

test("follows a theme changed elsewhere without committing it again", () => {
	const fixture = createFixture();
	fixture.handle?.set("dark");
	expect([fixture.checked(), fixture.commits.length]).toEqual(["dark", 0]);
	fixture.pointer("pointerdown", 150, 110);
	fixture.pointer("pointerup", 150, 110);
	expect(fixture.commits.map(([position]) => position)).toEqual(["light"]);
});
