'use client';

import { useMemo, useState } from 'react';
import moment from 'moment-timezone';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { Input } from '@/components/ui/field';
import { Price } from '@/components/ui/price';
import { DayBar } from '@/components/planner/day-bar';
import { TimeChips } from '@/components/planner/time-chips';
import { LengthChips } from '@/components/planner/length-chips';
import type { DaySheet } from '@/hooks/use-day-sheet';
import { kindByKey } from '@/lib/site-config';
import { extraPrice, extrasFor, formatLength, lengthsFor, priceFor, unitLabel, unitsFor, type Catalogue, type Extra, type House, type Space } from '@/lib/workspace';
import { at, seatsLeft, startsOn, stepFor, type Packed } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

const validEmail = (v: string) => /.+@.+\..+/.test(v.trim());

/**
 * Book one space on one day: its day bar, start chips, length chips, seats (flex floor), extras and invitees, with the
 * price and "Add to day sheet" at the bottom. The parent owns day/start/length/seats so the planner query and the
 * composer stay in step.
 */
export function SpaceComposer({
	cat,
	space,
	house,
	ranges,
	date,
	window,
	start,
	onStart,
	minutes,
	onMinutes,
	seats,
	onSeats,
	sheet,
	onAdded,
	party = 1,
	className,
}: {
	cat: Catalogue;
	space: Space;
	house: House;
	ranges: Packed[] | undefined;
	date: string;
	window: { open: number; close: number };
	start: number | null;
	onStart: (s: number | null) => void;
	minutes: number;
	onMinutes: (m: number) => void;
	seats: number;
	onSeats: (n: number) => void;
	sheet: DaySheet;
	onAdded?: () => void;
	/** People in the party (the planner's count), the default for per-person extras */
	party?: number;
	className?: string;
}) {
	const tz = house.tz;
	const lengths = useMemo(() => lengthsFor(space, kindByKey(space.kind).lengths), [space]);
	const len = lengths.includes(minutes) ? minutes : (lengths.find((m) => m >= minutes) ?? lengths[lengths.length - 1]!);
	const people = space.shared ? seats : 1;
	const starts = useMemo(() => startsOn(ranges, date, tz, len, people, stepFor(space)), [ranges, date, tz, len, people, space]);
	const chosen = start !== null && starts.includes(start) ? start : null;
	const left = chosen !== null ? seatsLeft(ranges, chosen, len) : space.capacity;

	const extras = useMemo(() => extrasFor(cat, space), [cat, space]);
	const [picked, setPicked] = useState<Record<string, number>>({});
	const [guests, setGuests] = useState<string[]>([]);
	const [guestDraft, setGuestDraft] = useState('');
	const [error, setError] = useState<string | null>(null);

	const partySize = space.shared ? people : Math.max(1, Math.min(space.seats, Math.max(party, guests.length + 1, space.seats > 2 ? 2 : 1)));
	const setQty = (e: Extra, q: number) => setPicked((p) => ({ ...p, [e.id]: Math.max(0, Math.min(e.maxQuantity, q)) }));
	const extrasTotal = extras.reduce((s, e) => s + (picked[e.id] ? extraPrice(e, picked[e.id]!, space, len) : 0), 0);
	const base = priceFor(space, len, people);
	const total = Math.round((base + extrasTotal) * 100) / 100;

	const addGuest = () => {
		const v = guestDraft.trim();
		if (!validEmail(v) || guests.includes(v) || guests.length >= space.maxGuests) return;
		setGuests((g) => [...g, v]);
		setGuestDraft('');
	};

	const adding = sheet.busy === `add:${space.id}`;
	const add = async () => {
		if (chosen === null) return;
		setError(null);
		const r = await sheet.add({
			space,
			start: chosen,
			minutes: len,
			seats: people,
			extras: extras.filter((e) => picked[e.id]).map((e) => ({ extra: e, quantity: picked[e.id]! })),
			guests,
		});
		if (r.ok) {
			setPicked({});
			setGuests([]);
			onAdded?.();
		} else setError(r.error ?? 'Couldn’t add that.');
	};

	return (
		<div className={cn('flex flex-col gap-6', className)}>
			<section aria-label="Times" className="flex flex-col gap-3">
				<div className="flex items-baseline justify-between gap-3">
					<h4 className="t-label text-mute">{moment(date).format('dddd D MMMM')}</h4>
					<span className="flex items-center gap-3 text-[0.75rem] text-mute">
						<span className="inline-flex items-center gap-1.5">
							<span className="inline-block h-3 w-4 border border-line-strong bg-sheet" /> free
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="hatch inline-block h-3 w-4 border border-line-strong" /> taken
						</span>
					</span>
				</div>
				<DayBar ranges={ranges} date={date} tz={tz} window={window} seats={people} selection={chosen !== null ? { start: chosen, minutes: len } : null} />
			</section>

			<section aria-label="Length" className="flex flex-col gap-2">
				<h4 className="t-label text-mute">How long</h4>
				<LengthChips lengths={lengths} value={len} onChange={onMinutes} />
			</section>

			<section aria-label="Start time" className="flex flex-col gap-2">
				<h4 className="t-label text-mute">Start</h4>
				<TimeChips starts={starts} value={chosen} onChange={onStart} tz={tz} />
			</section>

			{space.shared ? (
				<section aria-label="Seats" className="flex items-center justify-between gap-4 border-y border-line py-3">
					<div>
						<h4 className="font-medium">Seats</h4>
						<p className="text-[0.8125rem] text-mute">
							{chosen !== null ? `${left} of ${space.capacity} free for that time` : `Up to ${space.capacity} on the floor`}. Bringing the team? Add a seat each.
						</p>
					</div>
					<Stepper label="Seats" value={people} min={1} max={Math.max(1, Math.min(left || space.capacity, 20))} onChange={onSeats} />
				</section>
			) : null}

			{extras.length ? (
				<section aria-label="Extras" className="flex flex-col">
					<h4 className="t-label mb-2 text-mute">Make it work</h4>
					<ul className="divide-y divide-line border-y border-line">
						{extras.map((e) => {
							const q = picked[e.id] ?? 0;
							const perPerson = e.maxQuantity > 1;
							return (
								<li key={e.id} className="flex items-center gap-3 py-2.5">
									<div className="min-w-0 flex-1">
										<p className="text-[0.9375rem] font-medium leading-tight">{e.title}</p>
										<p className="text-[0.8125rem] text-mute">
											<Price amount={e.price} per={e.perUnit ? unitLabel(space) : perPerson ? 'person' : undefined} />
											{e.perUnit && q ? <> · {unitsFor(space, len)} × for {formatLength(len).toLowerCase()}</> : null}
										</p>
									</div>
									{perPerson ? (
										q ? (
											<Stepper size="sm" label={e.title} value={q} min={0} max={e.maxQuantity} onChange={(n) => setQty(e, n)} />
										) : (
											<Button size="sm" variant="outline" onClick={() => setQty(e, Math.min(e.maxQuantity, partySize))}>
												Add for {Math.min(e.maxQuantity, partySize)}
											</Button>
										)
									) : (
										<label className="flex cursor-pointer items-center gap-2 text-[0.875rem]">
											<input type="checkbox" className="h-4 w-4 accent-[var(--color-cobalt)]" checked={q > 0} onChange={(ev) => setQty(e, ev.target.checked ? 1 : 0)} />
											<span className="sr-only">Add {e.title}</span>
										</label>
									)}
								</li>
							);
						})}
					</ul>
				</section>
			) : null}

			{space.allowGuests ? (
				<section aria-label="Invite people" className="flex flex-col gap-2">
					<div className="flex items-baseline justify-between">
						<h4 className="t-label text-mute">Invite people</h4>
						<span className="t-num text-[0.75rem] text-faint">
							{guests.length + 1}/{space.seats}
						</span>
					</div>
					<p className="text-[0.8125rem] text-mute">They get the confirmation and a calendar invite, and reception has their names. You can add more later.</p>
					<div className="flex gap-2">
						<Input
							type="email"
							inputMode="email"
							placeholder="name@company.ie"
							value={guestDraft}
							onChange={(e) => setGuestDraft(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addGuest();
								}
							}}
							aria-label="Guest email"
						/>
						<Button size="md" variant="outline" onClick={addGuest} disabled={!validEmail(guestDraft) || guests.length >= space.maxGuests}>
							Add
						</Button>
					</div>
					{guests.length ? (
						<ul className="flex flex-wrap gap-1.5">
							{guests.map((g) => (
								<li key={g} className="inline-flex items-center gap-1 border border-line-strong bg-sheet py-0.5 pl-2 pr-0.5 text-[0.8125rem]">
									{g}
									<button type="button" aria-label={`Remove ${g}`} onClick={() => setGuests((x) => x.filter((y) => y !== g))} className="grid grid-cols-[minmax(0,1fr)] h-6 w-6 place-items-center hover:bg-paper-deep">
										×
									</button>
								</li>
							))}
						</ul>
					) : null}
				</section>
			) : null}

			<div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 -mx-1 flex flex-col gap-3 border-t border-ink bg-sheet px-1 pb-2 pt-4 lg:bottom-0">
				<div className="flex items-end justify-between gap-4">
					<div className="min-w-0">
						<p className="t-label text-mute">{space.name}</p>
						<p className="t-num text-[0.9375rem]">
							{chosen !== null ? (
								<>
									<span className="highlight">
										{at(chosen, tz, 'HH:mm')}–{at(chosen + len, tz, 'HH:mm')}
									</span>{' '}
									<span className="text-mute">· {at(chosen, tz, 'ddd D MMM')}</span>
								</>
							) : (
								<span className="text-mute">Pick a start time</span>
							)}
						</p>
					</div>
					<Price amount={total} className="text-[1.375rem] font-medium" />
				</div>
				{error ? (
					<p role="alert" className="border-l-2 border-alert bg-sheet px-3 py-2 text-[0.875rem] text-alert">
						{error}
					</p>
				) : null}
				<Button onClick={add} disabled={chosen === null} loading={adding} fullWidth size="lg">
					Add to day sheet
				</Button>
				<p className="text-center text-[0.75rem] text-mute">Held for you for 15 minutes while you plan the rest of the day.</p>
			</div>
		</div>
	);
}
