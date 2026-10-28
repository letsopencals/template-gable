'use client';

import { memo, useEffect, useRef } from 'react';
import { Chip, Tag } from '@/components/ui/chip';
import { Figure } from '@/components/ui/figure';
import { Price } from '@/components/ui/price';
import { Select } from '@/components/ui/field';
import { Stepper } from '@/components/ui/stepper';
import { PlanIcon } from '@/components/ui/plan-icon';
import { SheetStrip } from '@/components/ui/sheet';
import { DateStrip } from '@/components/planner/date-strip';
import { TimeChips } from '@/components/planner/time-chips';
import { LengthChips } from '@/components/planner/length-chips';
import { DayBar } from '@/components/planner/day-bar';
import { SpaceComposer } from '@/components/planner/space-composer';
import { DaySheet } from '@/components/day-sheet/day-sheet';
import { DaySheetBar } from '@/components/day-sheet/day-sheet-bar';
import { usePlanner, type PlannerParams } from '@/hooks/use-planner';
import { useDaySheet, type DaySheet as DaySheetState } from '@/hooks/use-day-sheet';
import { seatsFor, type Result } from '@/lib/planner';
import { kindByKey } from '@/lib/site-config';
import { formatLength, seatsLabel, unitLabel, type Catalogue, type House } from '@/lib/workspace';
import { at, type HouseAvailability, type Packed } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

/**
 * /book — the planner. A search over one house and one day: the query bar (house, what, day, length, people, start)
 * and the spaces that fit, ranked. Opening a result shows its own day and start times, the extras and invitees, and
 * "Add to day sheet". The day sheet sits on the right (a bar at the bottom on phones) with the total and checkout.
 */
export function Planner({
	cat,
	params,
	initialAvailability,
}: {
	cat: Catalogue;
	params: PlannerParams;
	initialAvailability?: { houseId: string; data: HouseAvailability } | null;
}) {
	const p = usePlanner(cat, params, initialAvailability);
	const sheet = useDaySheet(cat);
	const house = p.house;

	if (!house) {
		return (
			<div className="mx-auto max-w-[1360px] px-4 py-24 text-center sm:px-6 lg:px-10">
				<h1 className="t-h2">No houses to book yet</h1>
				<p className="t-lead mt-3">Once the store has locations with spaces in them, the planner shows them here.</p>
			</div>
		);
	}

	const freeCount = p.results.filter((r) => r.state.state === 'free').length;
	const kindLabel = p.tab.label.toLowerCase();

	return (
		<div className="mx-auto max-w-[1360px] px-4 pb-32 sm:px-6 lg:px-10 lg:pb-20">
			<SheetStrip number="GA-200" title={`Planner · ${house.short}`} note={house.neighbourhood} />
			<div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-10">
				<div className="min-w-0">
					<header className="mb-5 flex flex-col gap-2">
						<h1 className="t-h1">
							Plan your day at <span className="highlight">{house.short}</span>
						</h1>
						<p className="t-lead">Choose what you need, when and for how many. Everything you add is held while you plan the rest.</p>
					</header>

					<QueryBar p={p} />

					<section aria-live="polite" aria-label="Results" className="mt-8">
						<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-ink pb-2">
							<h2 className="font-display text-xl font-semibold">
								{p.results.length} {p.results.length === 1 ? kindLabel.replace(/s$/, '') : kindLabel} at {house.short}
							</h2>
							<p className="t-label text-mute">
								{p.availability.loading
									? 'Checking what’s free…'
									: p.start !== null
										? `${freeCount} free at ${at(p.start, p.tz, 'HH:mm')} for ${formatLength(p.minutes).toLowerCase()}`
										: `${freeCount} with free time ${p.date === p.today ? 'today' : 'that day'}`}
							</p>
						</div>
						{p.tooBig ? (
							<p className="hatch-light border border-line px-4 py-4 text-[0.9375rem]">
								Nothing here seats {p.people}. Try the {p.tabs.find((t) => t.key === 'event') ? 'event spaces' : 'biggest room'} or another house.
							</p>
						) : null}
						{p.availability.error ? (
							<p className="border-l-2 border-alert bg-sheet px-4 py-3 text-[0.9375rem]">
								We couldn’t load availability just now.{' '}
								<button type="button" className="font-medium text-cobalt underline" onClick={() => void p.availability.refresh()}>
									Try again
								</button>
							</p>
						) : null}
						<ol className="flex flex-col gap-3">
							{p.results.map((r) => (
								<ResultRow
									key={r.space.id}
									r={r}
									cat={cat}
									house={house}
									p={p}
									sheet={sheet}
									open={p.openId === r.space.id}
									loading={p.availability.loading}
								/>
							))}
						</ol>
					</section>
				</div>

				<aside className="hidden lg:block" aria-label="Day sheet">
					<div className="sticky top-[8.75rem]">
						<DaySheet cat={cat} sheet={sheet} ranges={p.ranges} houseId={house.id} />
					</div>
				</aside>
			</div>
			<DaySheetBar cat={cat} sheet={sheet} ranges={p.ranges} houseId={house.id} />
		</div>
	);
}

type P = ReturnType<typeof usePlanner>;

function QueryBar({ p }: { p: P }) {
	const peopleMatters = p.tab.key !== 'booth';
	return (
		<div className="sheet-frame sheet-ticks">
			<div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line-strong sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
				<label className="flex flex-col gap-1 bg-sheet px-4 py-3">
					<span className="t-label text-mute">House</span>
					<Select value={p.house!.id} onChange={(e) => p.setHouse(e.target.value)} aria-label="House">
						{p.houses
							.filter((h) => h.spaceCount > 0)
							.map((h) => (
								<option key={h.id} value={h.id}>
									{h.short} · {h.city ?? h.neighbourhood}
								</option>
							))}
					</Select>
				</label>
				<div className="flex flex-col gap-1 bg-sheet px-4 py-3">
					<span className="t-label text-mute">What</span>
					<div role="group" aria-label="What" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
						{p.tabs.map((t) => (
							<Chip key={t.key} selected={t.key === p.tab.key} onClick={() => p.setTab(t.key)} className="shrink-0">
								<PlanIcon kind={t.kinds[0]!} className="h-4 w-4" />
								{t.label}
							</Chip>
						))}
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-5 border-t border-line-strong px-4 py-4">
				<div className="flex flex-col gap-1.5">
					<span className="t-label text-mute">Day</span>
					<DateStrip days={p.days} value={p.date} onChange={p.setDate} open={p.open} today={p.today} />
				</div>
				<div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
					<div className="flex flex-col gap-1.5">
						<span className="t-label text-mute">How long</span>
						<LengthChips lengths={p.lengths} value={p.minutes} onChange={p.setMinutes} />
					</div>
					{peopleMatters ? (
						<div className="flex flex-col gap-1.5">
							<span className="t-label text-mute">{p.tab.key === 'desks' ? 'Seats' : 'People'}</span>
							<Stepper label="People" value={p.people} min={1} max={60} onChange={p.setPeople} />
						</div>
					) : null}
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="t-label text-mute">Start</span>
					{p.availability.loading ? (
						<div className="flex flex-wrap gap-1.5" aria-hidden>
							{Array.from({ length: 10 }, (_, i) => (
								<span key={i} className="hatch-light h-8 w-[3.75rem] border border-line" />
							))}
						</div>
					) : (
						<TimeChips starts={p.starts} value={p.start} onChange={p.setStart} tz={p.tz} anyLabel="Any time" />
					)}
				</div>
			</div>
		</div>
	);
}

const ResultRow = memo(function ResultRow({
	r,
	cat,
	house,
	p,
	sheet,
	open,
	loading,
}: {
	r: Result;
	cat: Catalogue;
	house: House;
	p: P;
	sheet: DaySheetState;
	open: boolean;
	loading: boolean;
}) {
	const { space, state } = r;
	const ref = useRef<HTMLLIElement>(null);
	const kind = kindByKey(space.kind);
	const ranges: Packed[] | undefined = p.ranges[space.id];
	const seats = seatsFor(space, p.people);
	useEffect(() => {
		if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [open]);
	const toggle = () => {
		p.setOpenId(open ? null : space.id);
		if (!open && state.state === 'later') p.setStart(state.next);
	};
	const status = loading ? (
		<Tag>checking</Tag>
	) : state.state === 'free' ? (
		<Tag tone="free">{space.shared ? `${state.seatsLeft} seats free` : p.start !== null ? `Free at ${at(p.start, p.tz, 'HH:mm')}` : 'Free that day'}</Tag>
	) : state.state === 'later' ? (
		<Tag tone="marigold">Next free {at(state.next, p.tz, 'HH:mm')}</Tag>
	) : (
		<Tag tone="busy">Full that day</Tag>
	);
	return (
		<li ref={ref} className={cn('border bg-sheet transition-colors', open ? 'border-ink' : 'border-line-strong hover:border-ink', state.state === 'full' && !open && 'opacity-70')}>
			<button type="button" onClick={toggle} aria-expanded={open} className="grid w-full grid-cols-[6.5rem_minmax(0,1fr)] gap-4 p-3 text-left sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:p-4">
				<Figure src={space.image} alt={`${space.name}, ${house.short}`} fallback="kind" kind={space.kind} className="aspect-[4/3] border border-line" />
				<div className="flex min-w-0 flex-col gap-1.5">
					<div className="flex flex-wrap items-center gap-2">
						<span className="t-label text-mute">{kind.label}</span>
						{space.level !== null ? <span className="t-label text-faint">Level {space.level}</span> : null}
					</div>
					<h3 className="font-display text-[1.375rem] font-semibold leading-none">{space.name}</h3>
					<p className="text-[0.875rem] text-mute">
						{seatsLabel(space)}
						{space.kit.length ? ` · ${space.kit.slice(0, 3).join(' · ')}` : ''}
					</p>
					<div className="mt-1 hidden sm:block">
						<DayBar ranges={ranges} date={p.date} tz={p.tz} window={p.window} seats={seats} labels={false} selection={p.start !== null && state.state === 'free' ? { start: p.start, minutes: p.minutes } : null} />
					</div>
					<div className="flex flex-wrap items-center gap-2 sm:hidden">
						{status}
						<Price amount={r.price} className="text-[0.9375rem]" />
					</div>
				</div>
				<div className="hidden flex-col items-end justify-between gap-3 sm:flex">
					{status}
					<div className="text-right">
						<Price amount={r.price} className="block text-[1.25rem] font-medium" />
						<span className="text-[0.75rem] text-mute">
							{formatLength(p.minutes).toLowerCase()}
							{space.shared && seats > 1 ? ` · ${seats} seats` : ''} · <Price amount={space.price} per={unitLabel(space)} />
						</span>
					</div>
					<span className={cn('t-label border px-2.5 py-1.5', open ? 'border-ink bg-ink text-paper' : 'border-ink text-ink')}>{open ? 'Close' : 'Choose'}</span>
				</div>
			</button>
			{open ? (
				<div className="grid grid-cols-[minmax(0,1fr)] gap-6 border-t border-ink p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
					<div className="flex flex-col gap-3">
						{space.copy ? <p className="text-[0.9375rem]">{space.copy}</p> : null}
						{space.kit.length ? (
							<ul className="flex flex-wrap gap-1.5">
								{space.kit.map((k) => (
									<li key={k}>
										<Tag>{k}</Tag>
									</li>
								))}
							</ul>
						) : null}
						<a href={`/spaces/${space.slug}`} className="text-[0.875rem] font-medium text-cobalt underline underline-offset-4">
							Photos, floor and the full data sheet →
						</a>
					</div>
					<SpaceComposer
						cat={cat}
						space={space}
						house={house}
						ranges={ranges}
						date={p.date}
						window={p.window}
						start={p.start}
						onStart={p.setStart}
						minutes={p.minutes}
						onMinutes={p.setMinutes}
						seats={seats}
						onSeats={p.setPeople}
						sheet={sheet}
						onAdded={() => p.setOpenId(null)}
						party={p.people}
					/>
				</div>
			) : null}
		</li>
	);
});
