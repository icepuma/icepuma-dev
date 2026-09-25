// Build-time geometry for the tuning scale. The week runs left to right,
// Monday 00:00 to the end of Sunday, and every hour is six viewBox units.
export const HOUR = 6;
export const WEEK = 168 * HOUR;

export type ScaleDay = { day: string; focus: string; url?: string | undefined };
export type Station = {
	focus: string;
	off: boolean;
	days: string[];
	// Grid columns, one per day: the first is 1, the end line is exclusive.
	column: string;
	start: number;
	end: number;
};

// Vertical ticks hanging from the baseline, one per included hour, with the
// closing tick at the end of Sunday.
export function scaleTicks(
	top: number,
	bottom: number,
	include: (hour: number) => boolean = () => true,
) {
	let path = "";
	for (let hour = 0; hour <= 168; hour += 1) {
		if (include(hour)) path += `M${hour * HOUR} ${top}V${bottom}`;
	}
	return path;
}

// Consecutive days with the same focus share one station, the way a band of
// frequencies shares one name on a radio scale.
export function stations(days: ScaleDay[]): Station[] {
	const bands: Station[] = [];
	let first = 0;
	days.forEach(({ day, focus, url }, index) => {
		const off = !url;
		let band = bands.at(-1);
		if (!band || band.focus !== focus || band.off !== off) {
			first = index;
			band = {
				focus,
				off,
				days: [],
				column: "",
				start: index / days.length,
				end: 0,
			};
			bands.push(band);
		}
		band.days.push(day);
		band.column = `${first + 1} / ${index + 2}`;
		band.end = (index + 1) / days.length;
	});
	return bands;
}

// A bracket over each station, stopping an hour short of each end so that
// neighbouring stations never touch.
export function bandPath(band: Station, top: number, bottom: number) {
	const from = Math.round(band.start * WEEK + HOUR);
	const to = Math.round(band.end * WEEK - HOUR);
	return `M${from} ${bottom}V${top}H${to}V${bottom}`;
}
