import moment from 'moment-timezone';
import type { Booking } from '@/lib/booking';
import { extrasFor, priceFor, spacesAt, type Catalogue, type Space } from '@/lib/workspace';
import { dayStart, todayIn } from '@/lib/workspace-time';

/**
 * Fixture bookings for /preview/* (screenshots and design review without placing real bookings). Built from the live
 * catalogue: the first house's flex floor, its largest room and a booth tomorrow, plus a room next week and a past desk.
 */
export function previewBookings(cat: Catalogue): Booking[] {
	const house = cat.houses.find((h) => h.spaceCount > 0);
	if (!house) return [];
	const at = spacesAt(cat, house.id);
	const flex = at.find((s) => s.kind === 'flex');
	const room = [...at.filter((s) => s.kind === 'room')].sort((a, b) => b.seats - a.seats)[1] ?? at.find((s) => s.kind === 'room');
	const booth = at.find((s) => s.kind === 'booth');
	const tz = house.tz;
	let day = moment(todayIn(tz)).add(1, 'day');
	if (day.isoWeekday() === 7) day = day.add(1, 'day');
	const d = (offset: number) => day.clone().add(offset, 'day').format('YYYY-MM-DD');
	let n = 4210;
	const make = (space: Space | undefined, date: string, h: number, minutes: number, extra: Partial<Booking> = {}): Booking | null => {
		if (!space) return null;
		const start = dayStart(date, tz) + h * 60;
		const seats = extra.seats ?? 1;
		const total = priceFor(space, minutes, seats);
		return {
			id: `preview-${n}`,
			itemId: null,
			ref: `G${n++}`,
			status: 'scheduled',
			space,
			house,
			name: space.name,
			start,
			end: start + minutes,
			minutes,
			seats,
			guests: [],
			extras: [],
			meetingTitle: null,
			answers: [],
			listPrice: total,
			total,
			discountTitles: [],
			cancelGapMin: space.cancelGapMin,
			rescheduleGapMin: space.rescheduleGapMin,
			allowCancel: true,
			allowReschedule: true,
			...extra,
		};
	};
	const coffee = room ? extrasFor(cat, room).find((e) => /coffee/i.test(e.slug)) : null;
	const video = room ? extrasFor(cat, room).find((e) => /video/i.test(e.slug)) : null;
	const list = [
		make(flex, d(0), 9, 480, { seats: 2 }),
		make(room, d(0), 10, 90, {
			guests: [{ id: 'g1', email: 'cian@tidelinestudio.ie' }, { id: 'g2', email: 'maeve@tidelinestudio.ie' }],
			meetingTitle: 'Q4 planning',
			extras: [coffee ? { itemId: null, extraId: coffee.id, title: coffee.title, quantity: 8, total: coffee.price * 8 } : null, video ? { itemId: null, extraId: video.id, title: video.title, quantity: 1, total: null } : null].filter(Boolean) as Booking['extras'],
		}),
		make(booth, d(0), 15, 30),
		make(room, d(6), 14, 60),
		make(flex, d(-8), 9, 240, { status: 'completed' }),
	].filter((b): b is Booking => !!b);
	return list;
}

export const PREVIEW_RECEIPT = { ref: 'G4210', paid: false, email: 'aoife.brennan@example.ie', name: 'Aoife Brennan' };
