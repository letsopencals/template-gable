import type { Booking } from '@/lib/booking';

/**
 * What the confirmation shows if the order can't be read back yet: the day sheet as it was checked out, saved to
 * sessionStorage right before submit. Only this browser tab sees it; the order from the API wins when it loads.
 */
export interface DaySnapshot {
	at: number;
	orderId: string | null;
	ref: string;
	bookings: Booking[];
	firstName: string | null;
	email: string | null;
	total: number;
	payAtHouse: boolean;
}

const KEY = 'gable:day-snapshot';

export function saveSnapshot(s: DaySnapshot) {
	try {
		sessionStorage.setItem(KEY, JSON.stringify(s));
	} catch {
		// storage full or blocked: the confirmation falls back to the order
	}
}

export function patchSnapshot(patch: Partial<DaySnapshot>) {
	const s = readSnapshot();
	if (s) saveSnapshot({ ...s, ...patch });
}

export function readSnapshot(): DaySnapshot | null {
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return null;
		const s = JSON.parse(raw) as DaySnapshot;
		return Date.now() - s.at < 6 * 3600e3 ? s : null;
	} catch {
		return null;
	}
}
