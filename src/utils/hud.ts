import { decodeOnce } from "@/utils/decode";
import {
	msUntilNextMinute,
	scheduleMoment,
	type Weekday,
	weekAngle,
} from "@/utils/schedule";

type TiltPoint = { x: number; y: number };
type TiltRect = { left: number; top: number; width: number; height: number };
type TiltViewport = { width: number; height: number };

function todayValue(row: HTMLElement | null) {
	const label = document.createElement("span");
	label.className = "decode";
	label.textContent = row?.dataset.focus ?? "";
	const source = row?.querySelector<HTMLAnchorElement>("a[href]");
	if (!source) {
		label.classList.add("hud-off");
		return label;
	}
	const link = document.createElement("a");
	link.className = "hud-today-link";
	link.href = source.href;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	const note = document.createElement("span");
	note.className = "sr-only";
	note.textContent = " (opens in a new tab)";
	const arrow = source.querySelector(".external-arrow")?.cloneNode(true);
	link.append(label, ...(arrow ? [arrow] : []), note);
	return link;
}

// Today is Berlin's today: it marks the calendar row, the dial arc and label,
// the dial centre, and the hero readout, all from the calendar's own markup.
export function markToday(now: () => Date = () => new Date()): Weekday {
	const { weekday } = scheduleMoment(now());
	for (const element of document.querySelectorAll<HTMLElement>("[data-day]")) {
		if (element.dataset.day === weekday) element.setAttribute("data-today", "");
		else element.removeAttribute("data-today");
	}
	const row = document.querySelector<HTMLElement>(
		`.calendar-row[data-day="${weekday}"]`,
	);
	for (const term of document.querySelectorAll<HTMLElement>(".calendar-row dt"))
		term.removeAttribute("aria-current");
	row?.querySelector("dt")?.setAttribute("aria-current", "date");
	const centre = document.querySelector<HTMLElement>("[data-hud-dial-day]");
	if (centre) centre.textContent = weekday.toUpperCase();
	document
		.querySelector<HTMLElement>("[data-hud-today]")
		?.replaceChildren(todayValue(row));
	return weekday;
}

// The clock changes once a minute, never every second, and moves the dial's
// now tick with it. It speaks only when read, never through a live region.
export function initHudClock(now: () => Date = () => new Date()) {
	const readout = document.querySelector<HTMLElement>("[data-hud-readout]");
	const clock = document.querySelector<HTMLElement>("[data-hud-clock]");
	if (!readout || !clock) return () => {};
	const zone = document.querySelector<HTMLElement>("[data-hud-zone]");
	const dial = document.querySelector<HTMLElement>("[data-hud-dial]");
	let timer = 0;
	let weekday = "";

	function render() {
		const moment = scheduleMoment(now());
		clock.textContent = moment.time;
		clock.setAttribute("datetime", moment.time);
		if (zone) zone.textContent = moment.zone;
		const angle = weekAngle(moment.dayIndex, moment.hour, moment.minute);
		dial?.style.setProperty("--now", `${angle.toFixed(2)}deg`);
		dial?.setAttribute("data-now", "");
		if (moment.weekday !== weekday) weekday = markToday(now);
	}

	function tick() {
		render();
		window.clearTimeout(timer);
		timer = window.setTimeout(tick, msUntilNextMinute(now()));
	}

	tick();
	readout.hidden = false;
	// The live values resolve once, as part of the first load of a visit.
	if (document.documentElement.hasAttribute("data-boot")) {
		decodeOnce(clock);
		const focus = document.querySelector<HTMLElement>(
			"[data-hud-today] .decode",
		);
		if (focus) decodeOnce(focus);
	}

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

// Degrees of rotateY (x) and rotateX (y) that turn the dial toward the
// pointer, never more than `max` either way.
export function tiltFor(
	point: TiltPoint,
	rect: TiltRect,
	viewport: TiltViewport,
	max = 4,
) {
	const clamp = (value: number) => Math.min(1, Math.max(-1, value));
	const x = clamp(
		(point.x - (rect.left + rect.width / 2)) / Math.max(1, viewport.width / 2),
	);
	const y = clamp(
		(point.y - (rect.top + rect.height / 2)) / Math.max(1, viewport.height / 2),
	);
	return { x: x * max || 0, y: -y * max || 0 };
}

// Exponential easing toward a target; it slows down and never overshoots.
export function approach(
	current: number,
	target: number,
	elapsed: number,
	tau = 140,
) {
	return target + (current - target) * Math.exp(-elapsed / tau);
}

export function initDialTilt() {
	const dial = document.querySelector<HTMLElement>("[data-hud-dial]");
	if (!dial) return;
	const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const current = { x: 0, y: 0 };
	let target = { x: 0, y: 0 };
	let frame = 0;
	let last = 0;
	let visible = true;

	function step(time: number) {
		frame = 0;
		const elapsed = Math.min(last ? time - last : 16, 64);
		last = time;
		current.x = approach(current.x, target.x, elapsed);
		current.y = approach(current.y, target.y, elapsed);
		const settled =
			Math.abs(current.x - target.x) < 0.01 &&
			Math.abs(current.y - target.y) < 0.01;
		if (settled) {
			current.x = target.x;
			current.y = target.y;
			last = 0;
		} else {
			frame = window.requestAnimationFrame(step);
		}
		dial?.style.setProperty("--tilt-x", `${current.x.toFixed(2)}deg`);
		dial?.style.setProperty("--tilt-y", `${current.y.toFixed(2)}deg`);
	}

	function aim(next: TiltPoint) {
		target = next;
		if (!frame) frame = window.requestAnimationFrame(step);
	}

	const rest = () => aim({ x: 0, y: 0 });
	window.addEventListener(
		"pointermove",
		(event) => {
			if (
				event.pointerType !== "mouse" ||
				!pointer.matches ||
				reducedMotion.matches ||
				!visible
			)
				return;
			aim(
				tiltFor(
					{ x: event.clientX, y: event.clientY },
					dial.getBoundingClientRect(),
					{ width: window.innerWidth, height: window.innerHeight },
				),
			);
		},
		{ passive: true },
	);
	document.documentElement.addEventListener("pointerleave", rest);
	window.addEventListener("blur", rest);
	if (typeof window.IntersectionObserver === "function") {
		new window.IntersectionObserver(([entry]) => {
			visible = entry?.isIntersecting ?? true;
			if (!visible) rest();
		}).observe(dial);
	}
}
