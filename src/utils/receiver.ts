import { clockDigits, DIGITS, SEGMENTS } from "@/utils/lcd";
import {
	msUntilNextMinute,
	scheduleMoment,
	type Weekday,
	weekFraction,
} from "@/utils/schedule";

function todayValue(row: HTMLElement | null) {
	const label = document.createElement("span");
	label.textContent = row?.dataset.focus ?? "";
	const source = row?.querySelector<HTMLAnchorElement>("a[href]");
	if (!source) {
		label.className = "live-off";
		return label;
	}
	const link = document.createElement("a");
	link.className = "live-today-link";
	link.href = source.href;
	// Read aloud as "Today: …", so it is not mistaken for the calendar link.
	const prefix = document.createElement("span");
	prefix.className = "sr-only";
	prefix.textContent = "Today: ";
	const arrow = source.querySelector(".external-arrow")?.cloneNode(true);
	link.append(prefix, label, ...(arrow ? [arrow] : []));
	return link;
}

function mark(element: Element, on: boolean, attribute = "data-today") {
	if (on) element.setAttribute(attribute, "");
	else element.removeAttribute(attribute);
}

// Today is Berlin's today: it marks the calendar row, the day and station on
// the tuning scale, and the hero readout, all from the calendar's own markup.
export function markToday(now: () => Date = () => new Date()): Weekday {
	const { weekday } = scheduleMoment(now());
	for (const element of document.querySelectorAll<HTMLElement>("[data-day]"))
		mark(element, element.dataset.day === weekday);
	for (const station of document.querySelectorAll<HTMLElement>("[data-days]"))
		mark(station, station.dataset.days?.split(" ").includes(weekday) ?? false);
	const row = document.querySelector<HTMLElement>(
		`.calendar-row[data-day="${weekday}"]`,
	);
	for (const term of document.querySelectorAll<HTMLElement>(".calendar-row dt"))
		term.removeAttribute("aria-current");
	row?.querySelector("dt")?.setAttribute("aria-current", "date");
	document
		.querySelector<HTMLElement>("[data-live-today]")
		?.replaceChildren(todayValue(row));
	return weekday;
}

// Lights the display's segments for an "hh:mm" reading; the unlit ones stay
// faintly visible, as on a real liquid-crystal display.
export function showDigits(display: Element | null, time: string) {
	if (!display) return;
	const digits = clockDigits(time);
	const cells = Array.from(display.querySelectorAll("[data-digit]"));
	cells.forEach((cell, index) => {
		const lit = DIGITS[digits[index] ?? ""] ?? [];
		for (const segment of SEGMENTS) {
			const path = cell.querySelector(`[data-segment="${segment}"]`);
			if (path) mark(path, lit.includes(segment), "data-lit");
		}
	});
}

// The clock changes once a minute, never every second, and moves the needle
// with it. It speaks only when read, never through a live region.
export function initReceiverClock(now: () => Date = () => new Date()) {
	const readout = document.querySelector<HTMLElement>("[data-live-readout]");
	const clock = document.querySelector<HTMLElement>("[data-live-clock]");
	if (!readout || !clock) return () => {};
	const zone = document.querySelector<HTMLElement>("[data-live-zone]");
	const scale = document.querySelector<HTMLElement>("[data-scale]");
	const display = document.querySelector<HTMLElement>("[data-lcd]");
	let timer = 0;
	let weekday = "";

	const render = () => {
		const moment = scheduleMoment(now());
		clock.textContent = moment.time;
		clock.setAttribute("datetime", moment.time);
		if (zone) zone.textContent = moment.zone;
		showDigits(display, moment.time);
		const fraction = weekFraction(moment.dayIndex, moment.hour, moment.minute);
		scale?.style.setProperty("--now", fraction.toFixed(5));
		scale?.setAttribute("data-now", "");
		if (moment.weekday !== weekday) weekday = markToday(now);
	};

	const tick = () => {
		render();
		window.clearTimeout(timer);
		timer = window.setTimeout(tick, msUntilNextMinute(now()));
	};

	tick();
	readout.removeAttribute("data-pending");

	const resume = () => {
		window.clearTimeout(timer);
		if (!document.hidden) tick();
	};
	document.addEventListener("visibilitychange", resume);
	return () => {
		window.clearTimeout(timer);
		document.removeEventListener("visibilitychange", resume);
	};
}

// Which of `count` equal slots a pointer at `x` falls in, across `left` to
// `left + width`, clamped to the ends.
export function slotAt(x: number, left: number, width: number, count: number) {
	const fraction = Math.min(1, Math.max(0, (x - left) / Math.max(1, width)));
	return {
		fraction,
		index: Math.min(count - 1, Math.floor(fraction * count)),
	};
}

// A mouse moving along the scale tunes a ghost needle across the week and
// lights the day and station under it. Touch leaves the scale alone.
export function initScaleTuning() {
	const scale = document.querySelector<HTMLElement>("[data-scale]");
	if (!scale) return;
	const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
	const days = Array.from(
		scale.querySelectorAll<HTMLElement>("[data-scale-day]"),
	);
	const stations = Array.from(
		scale.querySelectorAll<HTMLElement>("[data-days]"),
	);
	let tuned = "";

	function tune(day: string) {
		if (day === tuned) return;
		tuned = day;
		for (const element of [...days, ...stations]) {
			const match = day
				? element.dataset.day === day ||
					(element.dataset.days?.split(" ").includes(day) ?? false)
				: false;
			if (match) element.setAttribute("data-tuned", "");
			else element.removeAttribute("data-tuned");
		}
	}

	scale.addEventListener("pointermove", (event) => {
		if (event.pointerType !== "mouse" || !fine.matches || !days.length) return;
		const rect = scale.getBoundingClientRect();
		const slot = slotAt(event.clientX, rect.left, rect.width, days.length);
		scale.style.setProperty("--ghost", slot.fraction.toFixed(4));
		scale.setAttribute("data-ghost", "");
		tune(days[slot.index]?.dataset.day ?? "");
	});
	scale.addEventListener("pointerleave", () => {
		scale.removeAttribute("data-ghost");
		tune("");
	});
}
