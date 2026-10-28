'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHouseAvailability } from '@/hooks/use-house-availability';
import { useNow } from '@/hooks/use-now';
import { StatusDot } from '@/components/ui/chip';
import { PlanIcon } from '@/components/ui/plan-icon';
import { openStatus, spanFor, localNow } from '@/lib/house-hours';
import { fits, seatsLeft, type Packed } from '@/lib/workspace-time';
import type { HoursRow } from '@/lib/house-hours';
import type { KindKey } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export interface FreeNowHouse {
	id: string;
	slug: string;
	short: string;
	neighbourhood: string;
	tz: string;
	hours: HoursRow[];
	spaces: { id: string; slug: string; name: string; kind: KindKey; capacity: number; shared: boolean; seats: number }[];
}

/**
 * "Free right now", live from every house: seats left on the open floor (a hatched seat bar), which rooms and booths
 * you could walk into for the next half hour, and a link straight into the planner. Outside opening hours the figures
 * are for the next opening. One availability request per house (cached on the server), nothing per space.
 */
export function FreeNowBoard({ houses }: { houses: FreeNowHouse[] }) {
	return (
		<div className="border border-ink bg-sheet">
			<div className="hidden grid-cols-12 border-b border-ink lg:grid">
				{['House', 'Open floor', 'Rooms you could walk into', ''].map((h, i) => (
					<div key={i} className={cn('t-label px-4 py-2.5 text-mute', i === 0 && 'col-span-3', i === 1 && 'col-span-3 border-l border-line-strong', i === 2 && 'col-span-4 border-l border-line-strong', i === 3 && 'col-span-2')}>
						{h}
					</div>
				))}
			</div>
			{houses.map((h, i) => (
				<FreeNowRow key={h.id} house={h} index={i} />
			))}
		</div>
	);
}

function FreeNowRow({ house, index }: { house: FreeNowHouse; index: number }) {
	const { ranges, loading } = useHouseAvailability(house.id);
	const now = useNow(60_000);

	const view = useMemo(() => {
		if (!now) return null;
		const nowMinute = Math.floor(now / 60000);
		const status = openStatus(house.hours, house.tz, new Date(now));
		// Outside hours, look at the next opening instead.
		let t = nowMinute;
		let label = 'Now';
		if (!status.open) {
			const { weekday, minutes } = localNow(house.tz, new Date(now));
			for (let i = 0; i <= 7; i++) {
				const span = spanFor(house.hours, (weekday + i) % 7);
				if (!span) continue;
				if (i === 0 && minutes >= span[0]) continue;
				t = nowMinute - minutes + i * 1440 + span[0];
				label = status.text.replace(/^Opens /, 'At ');
				break;
			}
		}
		const flex = house.spaces.filter((s) => s.kind === 'flex');
		const flexCap = flex.reduce((n, s) => n + s.capacity, 0);
		const flexFree = flex.reduce((n, s) => n + seatsLeft(ranges[s.id] as Packed[] | undefined, t, 60), 0);
		const rooms = house.spaces.filter((s) => s.kind === 'room' || s.kind === 'booth' || s.kind === 'studio' || s.kind === 'office');
		const freeRooms = rooms.filter((s) => fits(ranges[s.id] as Packed[] | undefined, t, 30));
		return { status, label, flexCap, flexFree, rooms, freeRooms };
	}, [now, ranges, house]);

	const pending = loading || !view;

	return (
		<div className="grid grid-cols-1 border-b border-line-strong last:border-b-0 lg:grid-cols-12">
			<div className="flex items-start gap-3 px-4 py-4 lg:col-span-3">
				<span className="t-label mt-1 text-faint">H-0{index + 1}</span>
				<div className="min-w-0">
					<Link href={`/houses/${house.slug}`} className="font-display text-[1.25rem] font-semibold leading-tight hover:text-cobalt">
						{house.short}
					</Link>
					<p className="mt-1 flex items-center gap-2 text-[0.8125rem] text-mute">
						{view ? <StatusDot free={view.status.open} /> : null}
						{view ? view.status.text : house.neighbourhood}
					</p>
				</div>
			</div>

			<div className="flex flex-col justify-center gap-2 border-line-strong px-4 pb-4 lg:col-span-3 lg:border-l lg:py-4">
				{pending ? (
					<Skeleton />
				) : view.flexCap ? (
					<>
						<div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
							<span>
								<span className="t-num text-xl font-medium">{view.flexFree}</span>
								<span className="text-mute"> of {view.flexCap} seats free</span>
							</span>
							<span className="t-label text-faint">{view.label}</span>
						</div>
						<SeatBar free={view.flexFree} total={view.flexCap} />
					</>
				) : (
					<span className="text-[0.8125rem] text-mute">No open floor</span>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-1.5 border-line-strong px-4 pb-4 lg:col-span-4 lg:border-l lg:py-4">
				{pending ? (
					<Skeleton />
				) : view.freeRooms.length ? (
					view.freeRooms.slice(0, 6).map((s) => (
						<Link
							key={s.id}
							href={`/spaces/${s.slug}`}
							className="inline-flex items-center gap-1.5 border border-line-strong px-2 py-1 text-[0.8125rem] hover:border-ink"
						>
							<PlanIcon kind={s.kind} className="h-4 w-4 text-cobalt" />
							{s.name}
							{s.seats > 1 ? <span className="t-num text-[0.6875rem] text-mute">{s.seats}</span> : null}
						</Link>
					))
				) : (
					<span className="text-[0.8125rem] text-mute">All rooms taken for the next half hour</span>
				)}
				{!pending && view.freeRooms.length > 6 ? <span className="t-label text-mute">+{view.freeRooms.length - 6}</span> : null}
			</div>

			<div className="flex items-center px-4 pb-4 lg:col-span-2 lg:justify-end lg:py-4">
				<Link href={`/book?house=${house.slug}`} className="t-label inline-flex items-center gap-2 border border-ink px-3 py-2 font-semibold hover:bg-ink hover:text-paper">
					Plan here →
				</Link>
			</div>
		</div>
	);
}

/** Seats as a ruled bar: free = open cells, taken = hatched. Capped at 40 cells; scales above that. */
function SeatBar({ free, total }: { free: number; total: number }) {
	const cells = Math.min(40, total);
	const freeCells = Math.round((free / Math.max(1, total)) * cells);
	return (
		<div className="flex h-3 border border-ink" aria-hidden>
			{Array.from({ length: cells }, (_, i) => (
				<span key={i} className={cn('flex-1 border-r border-line-strong last:border-r-0', i >= freeCells ? 'hatch hatch-sweep' : 'bg-free-wash')} />
			))}
		</div>
	);
}

function Skeleton() {
	return <span className="hatch-light block h-4 w-32 animate-pulse" aria-label="Loading" />;
}
