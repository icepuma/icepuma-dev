// The weekly schedule is kept in Berlin time, whatever the visitor's zone.
export const SCHEDULE_TIME_ZONE = "Europe/Berlin";
export const WEEKDAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
export type ScheduleMoment = {
	weekday: Weekday;
	dayIndex: number;
	hour: number;
	minute: number;
	time: string;
	zone: string;
};

const scheduleFormats = new Map<string, Intl.DateTimeFormat>();

function scheduleFormat(timeZone: string) {
	let format = scheduleFormats.get(timeZone);
	if (!format) {
		// en-GB gives "CET"/"CEST"; en-US would print "GMT+2".
		format = new Intl.DateTimeFormat("en-GB", {
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
			timeZone,
			timeZoneName: "short",
		});
		scheduleFormats.set(timeZone, format);
	}
	return format;
}

function isWeekday(value: string | undefined): value is Weekday {
	return WEEKDAYS.some((day) => day === value);
}

export function scheduleMoment(
	date: Date,
	timeZone: string = SCHEDULE_TIME_ZONE,
): ScheduleMoment {
	const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
	for (const part of scheduleFormat(timeZone).formatToParts(date))
		parts[part.type] = part.value;
	const weekday = isWeekday(parts.weekday) ? parts.weekday : WEEKDAYS[0];
	const hour = parts.hour ?? "00";
	const minute = parts.minute ?? "00";
	return {
		weekday,
		dayIndex: WEEKDAYS.indexOf(weekday),
		hour: Number(hour),
		minute: Number(minute),
		time: `${hour}:${minute}`,
		zone: parts.timeZoneName ?? "",
	};
}

// How far through the week the moment is, from Monday 00:00 at the left end
// of the tuning scale (0) to the end of Sunday at the right (just under 1).
export function weekFraction(dayIndex: number, hour: number, minute: number) {
	const hours = dayIndex * 24 + hour + minute / 60;
	return (((hours / 168) % 1) + 1) % 1;
}

export function msUntilNextMinute(date: Date) {
	return 60_000 - (date.getTime() % 60_000);
}
