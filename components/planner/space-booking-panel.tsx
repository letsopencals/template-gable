'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DateStrip } from '@/components/planner/date-strip';
import { SpaceComposer } from '@/components/planner/space-composer';
import { DaySheetBar } from '@/components/day-sheet/day-sheet-bar';
import { Price } from '@/components/ui/price';
import { useHouseAvailability } from '@/hooks/use-house-availability';
import { useDaySheet } from '@/hooks/use-day-sheet';
import { kindByKey } from '@/lib/site-config';
import { houseOf, lengthsFor, spaceBySlug, spacesAt, type Catalogue } from '@/lib/workspace';
import { dayWindow, nextDays, openDays, todayIn } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

/**
 * Book one space from its own page (/spaces/[slug]): the day strip, then the composer (day bar, length, start,
 * seats, extras, invitees, "Add to day sheet"), and a line for what's already on the day sheet. On phones the day sheet
 * bar sits at the bottom of the screen.
 */
export function SpaceBookingPanel({ cat, spaceSlug, className }: { cat: Catalogue; spaceSlug: string; className?: string }) {
	const space = spaceBySlug(cat, spaceSlug);
	const house = space ? houseOf(cat, space) : null;
	const tz = house?.tz ?? 'Europe/Dublin';
	const today = useMemo(() => todayIn(tz), [tz]);
	const days = useMemo(() => nextDays(today, 14), [today]);
	const [date, setDate] = useState(today);
	const [start, setStart] = useState<number | null>(null);
	const lengths = useMemo(() => (space ? lengthsFor(space, kindByKey(space.kind).lengths) : [60]), [space]);
	const [minutes, setMinutes] = useState(() => (space ? (lengths.includes(kindByKey(space.kind).defaultLengthMin) ? kindByKey(space.kind).defaultLengthMin : lengths[0]!) : 60));
	const [seats, setSeats] = useState(1);
	const avail = useHouseAvailability(house?.id ?? null);
	const sheet = useDaySheet(cat);
	const houseSpaces = useMemo(() => (house ? spacesAt(cat, house.id) : []), [cat, house]);
	const window = useMemo(() => dayWindow(houseSpaces, avail.ranges, date, tz), [houseSpaces, avail.ranges, date, tz]);
	const open = useMemo(
		() => (space && Object.keys(avail.ranges).length ? openDays([space], avail.ranges, days, tz, () => minutes, seats) : null),
		[space, avail.ranges, days, tz, minutes, seats],
	);
	if (!space || !house) return null;
	return (
		<div className={cn('sheet-frame sheet-ticks flex flex-col gap-5 p-4 sm:p-5', className)}>
			<div className="flex items-baseline justify-between gap-3 border-b border-ink pb-3">
				<h2 className="font-display text-xl font-semibold">Book {space.name}</h2>
				<span className="t-label text-mute">{house.short}</span>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="t-label text-mute">Day</span>
				<DateStrip days={days} value={date} onChange={(d) => { setDate(d); setStart(null); }} open={open} today={today} />
			</div>
			{avail.loading ? (
				<div className="hatch-light h-64 border border-line" aria-label="Checking what’s free" />
			) : (
				<SpaceComposer
					cat={cat}
					space={space}
					house={house}
					ranges={avail.ranges[space.id]}
					date={date}
					window={window}
					start={start}
					onStart={setStart}
					minutes={minutes}
					onMinutes={(m) => { setMinutes(m); setStart(null); }}
					seats={seats}
					onSeats={setSeats}
					sheet={sheet}
				/>
			)}
			{sheet.count ? (
				<div className="flex items-center justify-between gap-3 border border-ink bg-wash/60 px-3 py-2.5 text-[0.875rem]">
					<span>
						On your day sheet: <strong className="font-medium">{sheet.count}</strong> · <Price amount={sheet.total} />
					</span>
					<span className="flex gap-3">
						<Link href={`/book?house=${house.slug}`} className="font-medium text-cobalt underline underline-offset-4">Plan more</Link>
						<Link href="/checkout" className="font-medium text-cobalt underline underline-offset-4">Check out</Link>
					</span>
				</div>
			) : null}
			<DaySheetBar cat={cat} sheet={sheet} ranges={avail.ranges} houseId={house.id} />
		</div>
	);
}
