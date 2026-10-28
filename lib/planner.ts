/**
 * The planner's query model and the ranking of results. Pure and client-safe.
 *
 * The planner is a search over one house on one day: what (a tab of kinds), how long (a length chip), for how many
 * (people), and optionally when (a start chip). Every space at the house that can seat the party is a result, ranked:
 * free at that start first, then free later that day, then full; inside each, the snuggest fit, then the price.
 */
import { kindByKey, type KindKey } from '@/lib/site-config';
import { lengthsFor, priceFor, type Space } from '@/lib/workspace';
import { spaceState, startsOn, stepFor, type HouseRanges, type SpaceState } from '@/lib/workspace-time';

export type TabKey = 'desks' | 'room' | 'booth' | 'studio' | 'event' | 'office';

export interface PlannerTab {
	key: TabKey;
	label: string;
	kinds: KindKey[];
}

export const TABS: PlannerTab[] = [
	{ key: 'desks', label: 'Desks', kinds: ['flex', 'desk'] },
	{ key: 'room', label: 'Meeting rooms', kinds: ['room'] },
	{ key: 'booth', label: 'Phone booths', kinds: ['booth'] },
	{ key: 'studio', label: 'Studios', kinds: ['studio'] },
	{ key: 'event', label: 'Event spaces', kinds: ['event'] },
	{ key: 'office', label: 'Day offices', kinds: ['office'] },
];

export function tabFor(kind: string | null | undefined): TabKey | null {
	if (!kind) return null;
	if (kind === 'flex' || kind === 'desk' || kind === 'desks') return 'desks';
	return (TABS.find((t) => t.key === kind)?.key as TabKey | undefined) ?? null;
}

export const tabByKey = (k: TabKey) => TABS.find((t) => t.key === k) ?? TABS[0]!;

/** Length chips for a tab (from site-config kinds), clipped to what its spaces allow. */
export function tabLengths(tab: PlannerTab, spaces: Space[]): number[] {
	const offered = kindByKey(tab.kinds[0]!).lengths;
	const own = spaces.filter((s) => tab.kinds.includes(s.kind));
	if (!own.length) return offered;
	const ok = offered.filter((m) => own.some((s) => lengthsFor(s, [m]).includes(m)));
	return ok.length ? ok : [Math.min(...own.map((s) => s.baseMin))];
}

export function defaultLength(tab: PlannerTab, lengths: number[]): number {
	const d = kindByKey(tab.kinds[0]!).defaultLengthMin;
	return lengths.includes(d) ? d : (lengths[0] ?? 60);
}

/** Can this space take the party at all (seats), and is the length allowed? */
export function canHost(space: Space, people: number, minutes: number): boolean {
	if (minutes > space.maxMin || minutes % space.baseMin !== 0) return false;
	if (space.kind === 'desk' || space.kind === 'booth') return true; // one per person; book several
	return space.seats >= people;
}

/** Seats to book on a shared floor for the party; 1 everywhere else. */
export const seatsFor = (space: Space, people: number) => (space.shared ? Math.max(1, people) : 1);

export interface Result {
	space: Space;
	state: SpaceState;
	price: number;
}

export function rankResults(spaces: Space[], ranges: HouseRanges, date: string, tz: string, start: number | null, minutes: number, people: number): Result[] {
	const rank = (r: Result) => (r.state.state === 'free' ? 0 : r.state.state === 'later' ? 1 : 2);
	return spaces
		.filter((s) => canHost(s, people, minutes))
		.map((space) => {
			const seats = seatsFor(space, people);
			return { space, state: spaceState(ranges[space.id], date, tz, start, minutes, seats, stepFor(space)), price: priceFor(space, minutes, seats) };
		})
		.sort(
			(a, b) =>
				rank(a) - rank(b) ||
				(a.state.state === 'later' && b.state.state === 'later' ? a.state.next - b.state.next : 0) ||
				Number(b.space.shared) - Number(a.space.shared) ||
				a.space.seats - b.space.seats ||
				a.price - b.price ||
				a.space.name.localeCompare(b.space.name, 'en', { numeric: true }),
		);
}

/** Every start (on the day) where at least one hostable space fits: the planner's start chips. */
export function unionStarts(spaces: Space[], ranges: HouseRanges, date: string, tz: string, minutes: number, people: number): number[] {
	const set = new Set<number>();
	for (const s of spaces) {
		if (!canHost(s, people, minutes)) continue;
		for (const t of startsOn(ranges[s.id], date, tz, minutes, seatsFor(s, people), stepFor(s))) set.add(t);
	}
	return [...set].sort((a, b) => a - b);
}
