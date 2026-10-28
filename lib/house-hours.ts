/**
 * Opening hours from the site-config strings ("Mon–Fri" / "08:00–20:00") → open now / opens next.
 * Computed in the house's own timezone. Pure; safe on server and client.
 */
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface HoursRow {
	days: string;
	time: string;
}

function daysOf(spec: string): number[] {
	const parts = spec.toLowerCase().split(/\s*[–-]\s*/);
	const a = DAY_INDEX[parts[0]!.slice(0, 3)];
	const b = parts[1] ? DAY_INDEX[parts[1].slice(0, 3)] : a;
	if (a == null || b == null) return [];
	const out: number[] = [];
	for (let d = a; ; d = (d + 1) % 7) {
		out.push(d);
		if (d === b) break;
	}
	return out;
}

function minutesOf(hhmm: string) {
	const [h, m] = hhmm.split(':').map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

/** Opening span for a weekday (0 = Sunday), in minutes from midnight, or null when closed. */
export function spanFor(rows: HoursRow[], weekday: number): [number, number] | null {
	for (const r of rows) {
		if (daysOf(r.days).includes(weekday)) {
			const [o, c] = r.time.split(/\s*[–-]\s*/);
			if (o && c) return [minutesOf(o), minutesOf(c)];
		}
	}
	return null;
}

/** Weekday and minutes-past-midnight right now in `tz`. */
export function localNow(tz: string, now = new Date()): { weekday: number; minutes: number } {
	const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
	const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
	return { weekday: DAY_INDEX[get('weekday').toLowerCase().slice(0, 3)] ?? 0, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** "Open until 20:00" / "Opens 09:00 Saturday" / "Opens 08:00 tomorrow". */
export function openStatus(rows: HoursRow[], tz: string, now = new Date()): { open: boolean; text: string } {
	const { weekday, minutes } = localNow(tz, now);
	const today = spanFor(rows, weekday);
	if (today && minutes >= today[0] && minutes < today[1]) return { open: true, text: `Open until ${hhmm(today[1])}` };
	if (today && minutes < today[0]) return { open: false, text: `Opens ${hhmm(today[0])} today` };
	for (let i = 1; i <= 7; i++) {
		const d = (weekday + i) % 7;
		const s = spanFor(rows, d);
		if (s) return { open: false, text: `Opens ${hhmm(s[0])} ${i === 1 ? 'tomorrow' : DAY_NAMES[d]}` };
	}
	return { open: false, text: 'Closed' };
}
