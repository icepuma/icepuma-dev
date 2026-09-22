// Build-time geometry for the week dial. Angles are degrees clockwise from
// the top of the dial, so 0 is twelve o'clock.
export type DialPoint = { x: number; y: number };
export type DialSegment = { start: number; end: number; mid: number };

function roundDial(value: number) {
	return Math.round(value * 100) / 100;
}

export function polar(
	cx: number,
	cy: number,
	radius: number,
	degrees: number,
): DialPoint {
	const radians = (degrees * Math.PI) / 180;
	return {
		x: roundDial(cx + radius * Math.sin(radians)),
		y: roundDial(cy - radius * Math.cos(radians)),
	};
}

export function arcPath(
	cx: number,
	cy: number,
	radius: number,
	start: number,
	end: number,
) {
	const from = polar(cx, cy, radius, start);
	const to = polar(cx, cy, radius, end);
	const largeArc = end - start > 180 ? 1 : 0;
	return `M${from.x} ${from.y}A${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

export function segments(count: number, gap: number): DialSegment[] {
	const step = 360 / count;
	return Array.from({ length: count }, (_, index) => ({
		start: roundDial(index * step + gap / 2),
		end: roundDial((index + 1) * step - gap / 2),
		mid: roundDial((index + 0.5) * step),
	}));
}

export function tickPath(
	cx: number,
	cy: number,
	radius: number,
	count: number,
	length: number,
	include: (index: number) => boolean = () => true,
) {
	let path = "";
	for (let index = 0; index < count; index += 1) {
		if (!include(index)) continue;
		const degrees = (index * 360) / count;
		const inner = polar(cx, cy, radius - length, degrees);
		const outer = polar(cx, cy, radius, degrees);
		path += `M${inner.x} ${inner.y}L${outer.x} ${outer.y}`;
	}
	return path;
}
