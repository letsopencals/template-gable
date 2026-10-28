import moment from 'moment-timezone';
import type { CurrentAvailabilitySlot } from '@opencals/storefront-sdk';
import type { Space } from '@/lib/workspace';

/**
 * Availability maths for the planner, the space pages and "free now". Everything is computed in the browser from a
 * house's merged free ranges (one cached read per space for the whole horizon, see lib/availability-server.ts), so
 * changing day, start, length or people never calls the API.
 *
 * A free span is packed as `[start, length, taken, capacity]`: UTC epoch minutes, minutes, and on a shared flex floor
 * the peak number of seats already taken over the span (the API merges adjacent not-full pieces and reports the peak,
 * so "seats left" is conservative). Exclusive spaces have `taken = 0, capacity = 1`.
 */

export type Packed = [start: number, length: number, taken: number, capacity: number];
export type HouseRanges = Record<string, Packed[]>;

export interface HouseAvailability {
	ranges: HouseRanges;
	/** Spaces that couldn't be read this time (rate-limited); the client asks again shortly */
	failed: string[];
}

/** How far ahead the planner looks (days, today included). */
export const WINDOW_DAYS = 21;

// ── Time ─────────────────────────────────────────────────────────────────

export function nowMin(): number {
	return Math.floor(Date.now() / 60000);
}

export function todayIn(tz: string): string {
	return moment().tz(tz).format('YYYY-MM-DD');
}

export function nextDays(from: string, n: number): string[] {
	const start = moment(from, 'YYYY-MM-DD');
	return Array.from({ length: n }, (_, i) => start.clone().add(i, 'day').format('YYYY-MM-DD'));
}

/** UTC epoch minute of local midnight on `date` in `tz`. */
export function dayStart(date: string, tz: string): number {
	return moment.tz(date, 'YYYY-MM-DD', tz).valueOf() / 60000;
}

/** Format a UTC epoch minute in a timezone. */
export function at(min: number, tz: string, format: string): string {
	return moment.utc(min * 60000).tz(tz).format(format);
}

export function localDay(min: number, tz: string): string {
	return at(min, tz, 'YYYY-MM-DD');
}

/** Minutes after local midnight. */
export function minuteOfDay(min: number, tz: string): number {
	const m = moment.utc(min * 60000).tz(tz);
	return m.hours() * 60 + m.minutes();
}

export function relativeDay(date: string, today: string): string {
	if (date === today) return 'Today';
	if (date === moment(today).add(1, 'day').format('YYYY-MM-DD')) return 'Tomorrow';
	return moment(date).format('ddd D MMM');
}

const SLOT_FORMATS = ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm'];

export const isoToMin = (iso: string) => Math.round(Date.parse(iso) / 60000);

/** A merged availability range (UTC date + time strings) → a packed span. */
export function pack(s: Pick<CurrentAvailabilitySlot, 'fromDate' | 'fromTime' | 'toDate' | 'toTime' | 'attendees' | 'maxAttendees'>): Packed {
	const from = moment.utc(`${s.fromDate} ${s.fromTime}`, SLOT_FORMATS).valueOf() / 60000;
	const to = moment.utc(`${s.toDate} ${s.toTime}`, SLOT_FORMATS).valueOf() / 60000;
	const start = Math.ceil(from);
	const capacity = Math.max(1, Number(s.maxAttendees) || 1);
	return [start, Math.max(0, Math.floor(to) - start), Math.min(capacity, Math.max(0, Number(s.attendees) || 0)), capacity];
}

/**
 * Merge spans that touch (the API can split a range at a 1-second seam). Taken seats are the peak of the two, so the
 * result stays conservative.
 */
export function mergePacked(spans: Packed[]): Packed[] {
	const sorted = [...spans].sort((a, b) => a[0] - b[0]);
	const out: Packed[] = [];
	for (const s of sorted) {
		const last = out[out.length - 1];
		if (last && s[0] <= last[0] + last[1] + 1 && s[3] === last[3]) {
			const end = Math.max(last[0] + last[1], s[0] + s[1]);
			last[1] = end - last[0];
			last[2] = Math.max(last[2], s[2]);
		} else out.push([...s] as Packed);
	}
	return out;
}

/** The appointment slot for a booking on a space, in the API's UTC date/time shape. */
export function toSlot(space: Pick<Space, 'id' | 'houseId'>, startMin: number, minutes: number) {
	const from = moment.utc(startMin * 60000);
	const to = moment.utc((startMin + minutes) * 60000);
	return {
		productId: space.id,
		fromDate: from.format('YYYY-MM-DD'),
		fromTime: from.format('HH:mm:ss'),
		toDate: to.format('YYYY-MM-DD'),
		toTime: to.format('HH:mm:ss'),
		locationId: space.houseId,
		staffMemberId: null,
	};
}

// ── Fit ──────────────────────────────────────────────────────────────────

/** The span covering `[start, start + minutes]`, or null. */
function covering(ranges: Packed[] | undefined, start: number, minutes: number): Packed | null {
	for (const r of ranges ?? []) if (r[0] <= start && start + minutes <= r[0] + r[1]) return r;
	return null;
}

/** Seats still free for the whole of `[start, start + minutes]` (0 when it doesn't fit). */
export function seatsLeft(ranges: Packed[] | undefined, start: number, minutes: number): number {
	const r = covering(ranges, start, minutes);
	return r ? Math.max(0, r[3] - r[2]) : 0;
}

/** Does a booking for `seats` people fit at `start` for `minutes`? */
export function fits(ranges: Packed[] | undefined, start: number, minutes: number, seats = 1): boolean {
	return seatsLeft(ranges, start, minutes) >= Math.max(1, seats);
}

/** How long (minutes) the space stays free from `start` (0 when taken). */
export function freeRun(ranges: Packed[] | undefined, start: number): number {
	for (const [rs, len] of ranges ?? []) if (rs <= start && start < rs + len) return rs + len - start;
	return 0;
}

/** Start step for a space: rooms and booths every 30 min, longer bookings on the hour. */
export function stepFor(space: Pick<Space, 'baseMin'>): number {
	return space.baseMin >= 60 ? 60 : 30;
}

/** Starts on one local day where the booking fits (future only, on the space's step). */
export function startsOn(ranges: Packed[] | undefined, date: string, tz: string, minutes: number, seats = 1, step = 30): number[] {
	const ds = dayStart(date, tz);
	const de = ds + 1440;
	const now = nowMin();
	const out: number[] = [];
	for (const [rs, len, taken, cap] of ranges ?? []) {
		if (cap - taken < seats) continue;
		const re = rs + len;
		if (re <= ds || rs >= de) continue;
		const from = Math.max(rs, ds);
		let s = ds + Math.ceil((from - ds) / step) * step;
		for (; s + minutes <= re && s < de; s += step) if (s >= now) out.push(s);
	}
	return [...new Set(out)].sort((a, b) => a - b);
}

/** The soonest start (from `after`, default now) where the booking fits, within the window. */
export function nextFree(ranges: Packed[] | undefined, minutes: number, seats = 1, step = 30, after = nowMin()): number | null {
	for (const [rs, len, taken, cap] of ranges ?? []) {
		if (cap - taken < seats) continue;
		const from = Math.max(rs, after);
		const s = Math.ceil(from / step) * step;
		if (s + minutes <= rs + len) return s;
	}
	return null;
}

export type SpaceState =
	| { state: 'free'; seatsLeft: number }
	| { state: 'later'; next: number; seatsLeft: number }
	| { state: 'full' };

/**
 * Where a space stands for a query: free at `start`, free later that day (next start), or full that day.
 * `start = null` means "any time that day" (free when anything fits).
 */
export function spaceState(ranges: Packed[] | undefined, date: string, tz: string, start: number | null, minutes: number, seats: number, step: number): SpaceState {
	if (start !== null && fits(ranges, start, minutes, seats)) return { state: 'free', seatsLeft: seatsLeft(ranges, start, minutes) };
	const starts = startsOn(ranges, date, tz, minutes, seats, step);
	const next = start === null ? starts[0] : (starts.find((s) => s > start) ?? starts[0]);
	if (next === undefined) return { state: 'full' };
	if (start === null) return { state: 'free', seatsLeft: seatsLeft(ranges, next, minutes) };
	return { state: 'later', next, seatsLeft: seatsLeft(ranges, next, minutes) };
}

/** Is the space free right now (for at least its base unit)? */
export function freeNow(ranges: Packed[] | undefined, space: Pick<Space, 'baseMin'>): boolean {
	const now = nowMin();
	// a booking can start on the next half hour; "free now" = free from now for 30 minutes
	return fits(ranges, now, Math.min(30, space.baseMin));
}

/** Days in a list with at least one fitting start (the day strip greys out the rest). */
export function openDays(spaces: Space[], ranges: HouseRanges, days: string[], tz: string, minutes: (s: Space) => number, seats = 1): Set<string> {
	const out = new Set<string>();
	for (const d of days)
		if (spaces.some((s) => minutes(s) <= s.maxMin && startsOn(ranges[s.id], d, tz, minutes(s), s.shared ? seats : 1, stepFor(s)).length)) out.add(d);
	return out;
}

/** Local opening window of a house on a day (minutes from midnight), from the spans; 08:00–20:00 when unknown. */
export function dayWindow(spaces: Space[], ranges: HouseRanges, date: string, tz: string): { open: number; close: number } {
	const ds = dayStart(date, tz);
	let open = Infinity;
	let close = -Infinity;
	for (const s of spaces)
		for (const [rs, len] of ranges[s.id] ?? []) {
			const a = Math.max(rs, ds);
			const b = Math.min(rs + len, ds + 1440);
			if (b <= a) continue;
			open = Math.min(open, a - ds);
			close = Math.max(close, b - ds);
		}
	if (open === Infinity) return { open: 8 * 60, close: 20 * 60 };
	return { open: Math.min(8 * 60, Math.floor(open / 60) * 60), close: Math.max(18 * 60, Math.ceil(close / 60) * 60) };
}

/**
 * Busy blocks of a space on a local day, within the house's window, for the hatched day bar: the complement of the
 * free spans (and, on a shared floor, the spans with no seats left for `seats`).
 */
export function busyBlocks(ranges: Packed[] | undefined, date: string, tz: string, window: { open: number; close: number }, seats = 1): [number, number][] {
	const ds = dayStart(date, tz);
	const a = ds + window.open;
	const b = ds + window.close;
	const free = (ranges ?? [])
		.filter(([rs, len, taken, cap]) => rs < b && rs + len > a && cap - taken >= seats)
		.map(([rs, len]) => [Math.max(rs, a), Math.min(rs + len, b)] as [number, number])
		.sort((x, y) => x[0] - y[0]);
	const out: [number, number][] = [];
	let cursor = a;
	const now = nowMin();
	for (const [fs, fe] of free) {
		if (fs > cursor) out.push([cursor, fs]);
		cursor = Math.max(cursor, fe);
	}
	if (cursor < b) out.push([cursor, b]);
	// time already gone today reads as past, not busy
	return out.filter(([, e]) => e > now).map(([s, e]) => [Math.max(s, now), e] as [number, number]).filter(([s, e]) => e > s);
}
