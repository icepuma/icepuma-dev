// Seven-segment geometry and digits for the receiver's clock display.
export const SEGMENTS = ["a", "b", "c", "d", "e", "f", "g"] as const;
export type Segment = (typeof SEGMENTS)[number];

// a is the top bar and the letters run clockwise; g is the middle bar.
export const DIGITS: Readonly<Record<string, readonly Segment[]>> = {
	"0": ["a", "b", "c", "d", "e", "f"],
	"1": ["b", "c"],
	"2": ["a", "b", "d", "e", "g"],
	"3": ["a", "b", "c", "d", "g"],
	"4": ["b", "c", "f", "g"],
	"5": ["a", "c", "d", "f", "g"],
	"6": ["a", "c", "d", "e", "f", "g"],
	"7": ["a", "b", "c"],
	"8": ["a", "b", "c", "d", "e", "f", "g"],
	"9": ["a", "b", "c", "d", "f", "g"],
};

// The four digits of an "hh:mm" reading.
export function clockDigits(time: string) {
	return Array.from(time.replace(/\D/g, "").padStart(4, "0").slice(-4));
}

function round(value: number) {
	return Math.round(value * 100) / 100;
}

function polygon(points: Array<[number, number]>) {
	return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`;
}

// One segment as a pointed bar inside a digit cell, with a hairline gap at
// each joint like a real display.
export function segmentPath(
	segment: Segment,
	width = 12,
	height = 22,
	thickness = 2.6,
	gap = 0.5,
) {
	const half = thickness / 2;
	const left = half;
	const right = width - half;
	const top = half;
	const middle = height / 2;
	const bottom = height - half;
	const bar = (y: number) =>
		polygon([
			[left + gap, y],
			[left + gap + half, y - half],
			[right - gap - half, y - half],
			[right - gap, y],
			[right - gap - half, y + half],
			[left + gap + half, y + half],
		]);
	const post = (x: number, from: number, to: number) =>
		polygon([
			[x, from + gap],
			[x + half, from + gap + half],
			[x + half, to - gap - half],
			[x, to - gap],
			[x - half, to - gap - half],
			[x - half, from + gap + half],
		]);
	const paths: Record<Segment, string> = {
		a: bar(top),
		b: post(right, top, middle),
		c: post(right, middle, bottom),
		d: bar(bottom),
		e: post(left, middle, bottom),
		f: post(left, top, middle),
		g: bar(middle),
	};
	return paths[segment];
}
