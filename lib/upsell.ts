/**
 * Day-sheet suggestions: small, useful additions computed from what's already on the sheet and the house's free
 * ranges. Nothing here calls the API; every suggestion is checked against availability before it's shown.
 *
 * - desk:   a room/booth/studio booked but no desk that day → a flex seat around it ("Desk for the rest of the day")
 * - booth:  a gap of 30+ minutes between two bookings → a phone booth in the gap
 * - extra:  lunch for a room over midday, coffee for a morning room, parking for a desk day
 * - swap:   a bigger room free for the same span, when the guest list is close to the room's seats
 */
import type { Booking } from '@/lib/booking';
import { extrasFor, priceFor, spacesAt, type Catalogue, type Extra, type Space } from '@/lib/workspace';
import { dayStart, fits, localDay, minuteOfDay, type HouseRanges } from '@/lib/workspace-time';

export type Suggestion =
	| { key: string; type: 'add'; space: Space; start: number; minutes: number; price: number; title: string; note: string }
	| { key: string; type: 'extra'; booking: Booking; extra: Extra; quantity: number; price: number; title: string; note: string }
	| { key: string; type: 'swap'; booking: Booking; to: Space; delta: number; title: string; note: string };

const ROOMLIKE = new Set(['room', 'studio', 'event', 'office']);

function findExtra(cat: Catalogue, space: Space, re: RegExp): Extra | null {
	return extrasFor(cat, space).find((e) => re.test(e.slug) || re.test(e.title)) ?? null;
}

export function daySuggestions(bookings: Booking[], cat: Catalogue, ranges: HouseRanges, houseId: string | null, limit = 3): Suggestion[] {
	const out: Suggestion[] = [];
	const mine = bookings.filter((b) => b.space && b.house && (!houseId || b.house.id === houseId));
	if (!mine.length) return out;
	const tz = mine[0]!.house!.tz;
	const days = [...new Set(mine.map((b) => localDay(b.start, tz)))];

	for (const day of days) {
		const today = mine.filter((b) => localDay(b.start, tz) === day).sort((a, b) => a.start - b.start);
		const house = today[0]!.house!;
		const houseSpaces = spacesAt(cat, house.id);

		// 1. A desk around the meetings
		const hasDesk = today.some((b) => b.space!.kind === 'flex' || b.space!.kind === 'desk' || b.space!.kind === 'office');
		const flex = houseSpaces.find((s) => s.kind === 'flex');
		if (!hasDesk && flex) {
			const first = today[0]!.start;
			const last = Math.max(...today.map((b) => b.end));
			const ds = dayStart(day, tz);
			const from = ds + Math.floor((first - ds) / 60) * 60;
			const span = Math.max(flex.baseMin, Math.ceil((last - from) / flex.baseMin) * flex.baseMin);
			const tries = [
				[from, span],
				[from, flex.baseMin],
				[Math.max(from, last - flex.baseMin), flex.baseMin],
			] as const;
			const hit = tries.find(([s, m]) => m <= flex.maxMin && fits(ranges[flex.id], s, m, 1));
			if (hit)
				out.push({
					key: `desk:${day}`,
					type: 'add',
					space: flex,
					start: hit[0],
					minutes: hit[1],
					price: priceFor(flex, hit[1]),
					title: hit[1] >= 480 ? 'A desk for the rest of the day' : 'A desk around your meetings',
					note: `Flex floor at ${house.short}, between calls`,
				});
		}

		// 2. Lunch, coffee
		for (const b of today) {
			if (!b.space || !ROOMLIKE.has(b.space.kind)) continue;
			const people = Math.max(2, Math.min(b.space.seats, b.guests.length + 1));
			const startLocal = minuteOfDay(b.start, tz);
			const endLocal = startLocal + b.minutes;
			const has = (e: Extra) => b.extras.some((x) => x.extraId === e.id);
			const lunch = findExtra(cat, b.space, /lunch/i);
			if (lunch && !has(lunch) && startLocal < 14 * 60 && endLocal > 12 * 60) {
				out.push({ key: `lunch:${b.id}`, type: 'extra', booking: b, extra: lunch, quantity: people, price: lunch.price * people, title: `Lunch for ${people} in ${b.name}`, note: 'Delivered to the room at half twelve' });
				continue;
			}
			const coffee = findExtra(cat, b.space, /coffee/i);
			if (coffee && !has(coffee) && startLocal < 11 * 60) {
				out.push({ key: `coffee:${b.id}`, type: 'extra', booking: b, extra: coffee, quantity: people, price: coffee.price * people, title: `Coffee & pastries for ${people}`, note: `On the table in ${b.name} when you arrive` });
			}
		}

		// 3. A booth in a gap
		const booths = houseSpaces.filter((s) => s.kind === 'booth');
		for (let i = 0; i < today.length - 1 && booths.length; i++) {
			const gapStart = today[i]!.end;
			const gapEnd = today[i + 1]!.start;
			if (gapEnd - gapStart < 30) continue;
			const booth = booths.find((s) => fits(ranges[s.id], gapStart, 30));
			if (booth) {
				out.push({ key: `booth:${gapStart}`, type: 'add', space: booth, start: gapStart, minutes: 30, price: priceFor(booth, 30), title: 'A booth between meetings', note: `${booth.name} is free for that half hour` });
				break;
			}
		}

		// 4. A bigger room when it's tight
		for (const b of today) {
			if (!b.space || b.space.kind !== 'room') continue;
			if (b.guests.length + 1 < b.space.seats - 1) continue;
			const bigger = houseSpaces
				.filter((s) => s.kind === 'room' && s.seats > b.space!.seats && fits(ranges[s.id], b.start, b.minutes))
				.sort((x, y) => x.seats - y.seats)[0];
			if (bigger) {
				const delta = priceFor(bigger, b.minutes) - priceFor(b.space, b.minutes);
				out.push({ key: `swap:${b.id}`, type: 'swap', booking: b, to: bigger, delta, title: `${bigger.name} is free too`, note: `${bigger.seats - b.space.seats} more seats for the same time` });
			}
		}

		// 5. Parking for the day
		const anchor = today.find((b) => b.space && findExtra(cat, b.space, /parking/i));
		const parking = anchor?.space ? findExtra(cat, anchor.space, /parking/i) : null;
		if (anchor && parking && !today.some((b) => b.extras.some((x) => x.extraId === parking.id)))
			out.push({ key: `parking:${day}`, type: 'extra', booking: anchor, extra: parking, quantity: 1, price: parking.price, title: 'A parking space for the day', note: parking.description || `At ${house.short}` });
	}
	return out.slice(0, limit);
}
