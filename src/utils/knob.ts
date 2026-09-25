// The theme knob: a three-position rotary selector. Auto points straight up,
// Light and Dark sit one detent either side. The radios inside the control
// are the truth; the knob is how a pointer turns them.
export const POSITIONS = ["light", "system", "dark"] as const;
export const STEP = 60;
const OVERTRAVEL = 24;

export type Position = (typeof POSITIONS)[number];
export type Point = { x: number; y: number };
// Who turned the knob: a pointer on the drawn knob, or its radios, which
// assistive technology already announces.
export type CommitSource = "pointer" | "radio";
type Drag = {
	id: number;
	centre: Point;
	start: Point;
	// Within this radius of the centre the bearing means nothing.
	dead: number;
	inside: boolean;
	bearing: number;
	raw: number;
	moved: number;
	// A press that moves less than this is a tap; fingers wobble more.
	slop: number;
	aim: Position;
};

export function isPosition(
	value: string | undefined | null,
): value is Position {
	return POSITIONS.some((position) => position === value);
}

// Degrees clockwise from twelve o'clock for each position.
export function detent(position: Position) {
	return (POSITIONS.indexOf(position) - 1) * STEP;
}

// Past an end stop the knob gives a little, and never more than 9°.
function give(overshoot: number) {
	return 9 * (1 - Math.exp(-overshoot / 18));
}

// The knob lags near each detent and hurries over the ridge between two, so
// a steady drag reads as a click. The curve is continuous across the ridge.
export function warpAngle(raw: number, stiction = 0.6) {
	const min = -STEP;
	const max = STEP;
	if (raw < min) return min - give(min - raw);
	if (raw > max) return max + give(raw - max);
	const nearest = Math.round(raw / STEP) * STEP;
	const offset = raw - nearest;
	return (
		nearest +
		offset -
		(STEP / (2 * Math.PI)) * stiction * Math.sin((2 * Math.PI * offset) / STEP)
	);
}

export function positionAt(angle: number): Position {
	const index = Math.round(angle / STEP) + 1;
	return (
		POSITIONS[Math.min(POSITIONS.length - 1, Math.max(0, index))] ?? "system"
	);
}

// Clockwise degrees from twelve o'clock to the point, seen from the centre.
export function bearing(centre: Point, point: Point) {
	return (Math.atan2(point.x - centre.x, centre.y - point.y) * 180) / Math.PI;
}

// The shortest signed turn between two bearings, so a drag across six
// o'clock never jumps a whole revolution.
export function turn(from: number, to: number) {
	return ((((to - from) % 360) + 540) % 360) - 180;
}

// A tap turns the knob one detent clockwise and swings back from Dark to
// Light, the way a selector with end stops has to.
export function nextPosition(position: Position): Position {
	return (
		POSITIONS[(POSITIONS.indexOf(position) + 1) % POSITIONS.length] ?? "system"
	);
}

// Exponential easing toward a target; it slows down and never overshoots.
export function approach(
	current: number,
	target: number,
	elapsed: number,
	tau = 180,
) {
	return target + (current - target) * Math.exp(-elapsed / tau);
}

// Spun metal throws its streak of light toward the eye, so the sheen turns
// with the pointer as it crosses the page, never more than `max` degrees.
export function sheenFor(
	pointer: Point,
	centre: Point,
	width: number,
	max = 12,
) {
	const x = (pointer.x - centre.x) / Math.max(1, width / 2);
	return Math.min(1, Math.max(-1, x)) * max || 0;
}

function centreOf(element: HTMLElement): Point {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function trackSheen(knob: HTMLElement) {
	const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
	const still = window.matchMedia("(prefers-reduced-motion: reduce)");
	let pointer: Point | null = null;
	let current = 0;
	let frame = 0;
	let last = 0;

	function step(time: number) {
		frame = 0;
		const target = pointer
			? sheenFor(pointer, centreOf(knob), window.innerWidth)
			: 0;
		const elapsed = Math.min(last ? time - last : 16, 64);
		last = time;
		current = approach(current, target, elapsed);
		if (Math.abs(current - target) < 0.05) {
			current = target;
			last = 0;
		} else {
			frame = window.requestAnimationFrame(step);
		}
		knob.style.setProperty("--sheen", `${current.toFixed(2)}deg`);
	}

	window.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !fine.matches || still.matches)
				return;
			pointer = { x: event.clientX, y: event.clientY };
			if (!frame) frame = window.requestAnimationFrame(step);
		},
		{ passive: true },
	);
	document.documentElement.addEventListener("pointerleave", () => {
		pointer = null;
		if (!frame) frame = window.requestAnimationFrame(step);
	});
}

function within(rect: DOMRect, point: Point) {
	return (
		point.x >= rect.left &&
		point.x <= rect.right &&
		point.y >= rect.top &&
		point.y <= rect.bottom
	);
}

// Wires one selector. Keyboard and labels change the radios natively; a drag
// turns the knob through the detents and commits on release; a tap advances
// one position. `interrupt` ends a running theme transition, so the knob stays
// usable while a change is still being revealed. Returns a setter for changes
// made elsewhere.
export function initKnob(
	control: HTMLElement,
	onCommit: (position: Position, origin: Point, source: CommitSource) => void,
	{ interrupt }: { interrupt?: () => boolean } = {},
) {
	const knob = control.querySelector<HTMLElement>("[data-knob]");
	const radios = Array.from(
		control.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
	);
	if (!knob || !radios.length) return null;

	const checked = (): Position => {
		const value = radios.find((input) => input.checked)?.value;
		return isPosition(value) ? value : "system";
	};
	const aim = (position: Position) => {
		const input = radios.find((radio) => radio.value === position);
		if (input && !input.checked) input.checked = true;
	};
	let committed = checked();
	let drag: Drag | null = null;

	const commit = (position: Position, source: CommitSource) => {
		aim(position);
		if (position === committed) return;
		committed = position;
		onCommit(position, centreOf(knob), source);
	};

	for (const input of radios) {
		input.addEventListener("change", () => {
			if (input.checked && isPosition(input.value))
				commit(input.value, "radio");
		});
	}

	const release = (event: PointerEvent, cancelled: boolean) => {
		if (!drag || event.pointerId !== drag.id) return;
		const { moved, slop, aim: aimed } = drag;
		drag = null;
		delete control.dataset.turning;
		// Without the inline angle the knob springs into the checked detent.
		knob.style.removeProperty("--knob-angle");
		if (cancelled) aim(committed);
		else commit(moved < slop ? nextPosition(committed) : aimed, "pointer");
	};

	const begin = (event: PointerEvent) => {
		// A secondary button, a second finger, or a control-click (the context
		// menu on macOS) never turns the knob.
		if (!event.isPrimary || event.button !== 0 || event.ctrlKey) return;
		event.preventDefault();
		try {
			knob.setPointerCapture?.(event.pointerId);
		} catch {
			// The pointer is already gone; the press still counts as a tap.
		}
		const rect = knob.getBoundingClientRect();
		const centre = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};
		const start = { x: event.clientX, y: event.clientY };
		const dead = Math.max(10, rect.width * 0.1);
		drag = {
			id: event.pointerId,
			centre,
			start,
			dead,
			inside: Math.hypot(start.x - centre.x, start.y - centre.y) <= dead,
			bearing: bearing(centre, start),
			raw: detent(committed),
			moved: 0,
			slop: event.pointerType === "mouse" ? 6 : 12,
			aim: committed,
		};
		control.dataset.turning = "";
	};

	knob.addEventListener("pointerdown", begin);

	knob.addEventListener("pointermove", (event) => {
		if (!drag || event.pointerId !== drag.id) return;
		const point = { x: event.clientX, y: event.clientY };
		drag.moved = Math.max(
			drag.moved,
			Math.hypot(point.x - drag.start.x, point.y - drag.start.y),
		);
		// Close to the centre the bearing swings wildly, so it is ignored there,
		// and a drag that passes through the centre picks up where it comes out
		// instead of spinning half a turn.
		if (
			Math.hypot(point.x - drag.centre.x, point.y - drag.centre.y) <= drag.dead
		) {
			drag.inside = true;
		} else {
			const next = bearing(drag.centre, point);
			// Travel past an end stop is held to a little, so the knob comes back
			// as soon as the hand does.
			if (!drag.inside)
				drag.raw = Math.min(
					STEP + OVERTRAVEL,
					Math.max(-STEP - OVERTRAVEL, drag.raw + turn(drag.bearing, next)),
				);
			drag.bearing = next;
			drag.inside = false;
		}
		const angle = warpAngle(drag.raw);
		knob.style.setProperty("--knob-angle", `${angle.toFixed(2)}deg`);
		const position = positionAt(angle);
		if (position === drag.aim) return;
		drag.aim = position;
		aim(position);
		window.navigator?.vibrate?.(8);
	});

	knob.addEventListener("pointerup", (event) => release(event, false));
	knob.addEventListener("pointercancel", (event) => release(event, true));
	// Anything that takes the pointer away, a context menu say, lets go too.
	knob.addEventListener("lostpointercapture", (event) => release(event, true));
	// A long press while turning must not open a menu over the knob.
	knob.addEventListener("contextmenu", (event) => {
		if (drag) event.preventDefault();
	});

	// While a theme change is revealed the page takes no pointer input, and
	// every press lands on the root. A press on the knob or on one of its
	// labels ends the reveal and does what it would have done.
	if (interrupt) {
		const labels = Array.from(control.querySelectorAll("label"));
		document.documentElement.addEventListener("pointerdown", (event) => {
			if (event.target !== document.documentElement) return;
			const point = { x: event.clientX, y: event.clientY };
			const rect = knob.getBoundingClientRect();
			const onKnob =
				Math.hypot(
					point.x - (rect.left + rect.width / 2),
					point.y - (rect.top + rect.height / 2),
				) <=
				rect.width / 2;
			const label = onKnob
				? undefined
				: labels.find((candidate) =>
						within(candidate.getBoundingClientRect(), point),
					);
			if ((!onKnob && !label) || !interrupt()) return;
			if (onKnob) begin(event);
			else label?.control?.click();
		});
	}

	trackSheen(knob);

	return {
		set(position: Position) {
			committed = position;
			aim(position);
		},
	};
}
