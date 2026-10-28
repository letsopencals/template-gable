'use client';

import Link from 'next/link';
import { memo, useMemo, useState } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { PlanIcon } from '@/components/ui/plan-icon';
import type { DaySheet as DaySheetState } from '@/hooks/use-day-sheet';
import { byDay, type Booking } from '@/lib/booking';
import { kindByKey } from '@/lib/site-config';
import { daySuggestions, type Suggestion } from '@/lib/upsell';
import { formatLength, type Catalogue } from '@/lib/workspace';
import { at, dayStart, localDay, relativeDay, todayIn, type HouseRanges } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

/**
 * The day sheet: everything held in the cart, drawn as the day it makes. Per day, a small timeline of every booking
 * on the opening hours (desk underneath, rooms and booths on top), then each booking with its extras and price, then
 * suggestions for the gaps, then the total and checkout. Used in the planner's right rail, the phone drawer and on
 * space pages.
 */
export function DaySheet({
	cat,
	sheet,
	ranges,
	houseId,
	checkoutHref = '/checkout',
	showCheckout = true,
	className,
}: {
	cat: Catalogue;
	sheet: DaySheetState;
	/** The planner's house availability, for suggestions (none without it) */
	ranges?: HouseRanges;
	houseId?: string | null;
	checkoutHref?: string;
	showCheckout?: boolean;
	className?: string;
}) {
	const tz = sheet.bookings[0]?.house?.tz ?? cat.houses[0]?.tz ?? 'Europe/Dublin';
	const days = useMemo(() => [...byDay(sheet.bookings, tz, localDay).entries()], [sheet.bookings, tz]);
	const suggestions = useMemo(() => (ranges ? daySuggestions(sheet.bookings, cat, ranges, houseId ?? null) : []), [sheet.bookings, cat, ranges, houseId]);
	const today = todayIn(tz);

	return (
		<div className={cn('title-block min-w-0 [grid-template-columns:minmax(0,1fr)]', className)}>
			<div className="flex items-stretch border-b border-ink">
				<div className="flex-1 px-3 py-2.5">
					<p className="font-display text-[1.0625rem] font-semibold leading-tight">Day sheet</p>
					<p className="text-[0.75rem] text-mute">{sheet.count ? `${sheet.count} ${sheet.count === 1 ? 'booking' : 'bookings'}, one checkout` : 'Nothing on it yet'}</p>
				</div>
				<HoldTimer seconds={sheet.timeRemaining} onExtend={sheet.extendCart} hidden={!sheet.count} />
			</div>

			{!sheet.count ? (
				<div className="drafting-grid px-4 py-8 text-center">
					<svg viewBox="0 0 120 64" className="mx-auto h-14 w-28 text-cobalt" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
						<path d="M4 54h112M4 50v8M116 50v8" />
						<rect x="14" y="20" width="40" height="22" strokeDasharray="3 3" />
						<rect x="62" y="10" width="20" height="32" strokeDasharray="3 3" />
						<rect x="88" y="26" width="18" height="16" strokeDasharray="3 3" />
					</svg>
					<p className="mt-3 text-[0.9375rem] font-medium">Plan the day in one go.</p>
					<p className="mx-auto mt-1 max-w-[17rem] text-[0.8125rem] text-mute">A desk for the day, a room for the 11 o’clock, a booth for the call after. They land here with one total.</p>
				</div>
			) : (
				<div className="flex flex-col">
					{days.map(([day, list]) => (
						<section key={day} aria-label={relativeDay(day, today)} className="border-b border-line-strong">
							<div className="flex items-baseline justify-between px-3 pb-1 pt-3">
								<h3 className="t-label text-ink">{relativeDay(day, today)}</h3>
								<span className="t-label text-mute">{list[0]?.house?.short}</span>
							</div>
							<DayGantt day={day} tz={list[0]?.house?.tz ?? tz} bookings={list} />
							<ol className="divide-y divide-line">
								{list.map((b) => (
									<SheetItem key={b.itemId ?? b.id} booking={b} tz={b.house?.tz ?? tz} sheet={sheet} />
								))}
							</ol>
						</section>
					))}

					{suggestions.length ? (
						<section aria-label="Suggestions" className="border-b border-line-strong bg-paper px-3 py-3">
							<h3 className="t-label mb-2 text-mute">Fits in your day</h3>
							<ul className="flex flex-col gap-2">
								{suggestions.map((s) => (
									<SuggestionRow key={s.key} s={s} sheet={sheet} tz={tz} />
								))}
							</ul>
						</section>
					) : null}

					<div className="px-3 py-3">
						<dl className="flex flex-col gap-1 text-[0.875rem]">
							{sheet.subtotal !== sheet.total ? (
								<div className="flex justify-between text-mute">
									<dt>Before discounts</dt>
									<dd>
										<Price amount={sheet.subtotal} />
									</dd>
								</div>
							) : null}
							{sheet.discounts.map((d) => (
								<div key={d.id} className="flex justify-between text-free">
									<dt>{d.title}</dt>
									<dd>
										−<Price amount={d.totalAmount} />
									</dd>
								</div>
							))}
							<div className="flex items-baseline justify-between border-t border-ink pt-2">
								<dt className="font-medium">Total</dt>
								<dd>
									<Price amount={sheet.total} className="text-[1.5rem] font-medium" />
								</dd>
							</div>
						</dl>
						{showCheckout ? (
							<Link href={checkoutHref} className={cn(buttonClasses('primary', 'lg', true), 'mt-3')}>
								Check out
							</Link>
						) : null}
						<p className="mt-2 text-center text-[0.75rem] text-mute">VAT included. Free cancellation up to an hour before.</p>
					</div>
				</div>
			)}
		</div>
	);
}

/** The day's bookings drawn on the opening hours: one thin row each, desks hatched in cobalt. */
const DayGantt = memo(function DayGantt({ day, tz, bookings }: { day: string; tz: string; bookings: Booking[] }) {
	const ds = dayStart(day, tz);
	const firstHour = Math.min(8, ...bookings.map((b) => Math.floor((b.start - ds) / 60)));
	const lastHour = Math.max(20, ...bookings.map((b) => Math.ceil((b.end - ds) / 60)));
	const a = ds + firstHour * 60;
	const span = (lastHour - firstHour) * 60;
	const pct = (m: number) => `${((m - a) / span) * 100}%`;
	return (
		<div className="px-3 pb-3 pt-1" aria-hidden>
			<div className="relative border-x border-line-strong" style={{ height: `${bookings.length * 10 + 4}px` }}>
				{Array.from({ length: lastHour - firstHour - 1 }, (_, i) => (
					<span key={i} className="absolute inset-y-0 w-px bg-line" style={{ left: pct(a + (i + 1) * 60) }} />
				))}
				{bookings.map((b, i) => (
					<span
						key={b.itemId ?? b.id}
						className={cn('hatch-sweep absolute h-[7px]', b.space?.kind === 'flex' || b.space?.kind === 'desk' ? 'hatch-cobalt border border-cobalt' : 'bg-cobalt')}
						style={{ top: `${2 + i * 10}px`, left: pct(b.start), width: `${(b.minutes / span) * 100}%` }}
					/>
				))}
			</div>
			<div className="t-num mt-1 flex justify-between text-[0.625rem] text-faint">
				<span>{String(firstHour).padStart(2, '0')}:00</span>
				<span>{String(lastHour).padStart(2, '0')}:00</span>
			</div>
		</div>
	);
});

function SheetItem({ booking: b, tz, sheet }: { booking: Booking; tz: string; sheet: DaySheetState }) {
	const removing = sheet.busy === `remove:${b.itemId}`;
	const kind = b.space ? kindByKey(b.space.kind) : null;
	return (
		<li className={cn('flex gap-3 px-3 py-3 transition-opacity', removing && 'opacity-40')}>
			{b.space ? <PlanIcon kind={b.space.kind} className="mt-0.5 h-7 w-7 shrink-0 text-cobalt" /> : null}
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="truncate font-medium leading-tight">{b.name}</p>
						<p className="text-[0.75rem] text-mute">
							{kind?.label}
							{b.space?.shared ? ` · ${b.seats} ${b.seats === 1 ? 'seat' : 'seats'}` : ''}
							{b.guests.length ? ` · ${b.guests.length + 1} people` : ''}
						</p>
					</div>
					{b.total !== null ? <Price amount={b.total} strike={b.listPrice ?? undefined} className="text-[0.875rem]" /> : null}
				</div>
				<p className="t-num mt-1 text-[0.8125rem]">
					{at(b.start, tz, 'HH:mm')}–{at(b.end, tz, 'HH:mm')} <span className="text-mute">· {formatLength(b.minutes)}</span>
				</p>
				{b.extras.length ? (
					<ul className="mt-1.5 flex flex-col gap-0.5">
						{b.extras.map((x) => (
							<li key={x.itemId ?? x.title} className="flex justify-between gap-2 text-[0.8125rem] text-mute">
								<span className="truncate">
									+ {x.title}
									{x.quantity > 1 ? ` × ${x.quantity}` : ''}
								</span>
								{x.total !== null ? <Price amount={x.total} /> : null}
							</li>
						))}
					</ul>
				) : null}
				{b.discountTitles.length ? <p className="mt-1 text-[0.75rem] text-free">{b.discountTitles.join(' · ')}</p> : null}
			</div>
			<button
				type="button"
				onClick={() => b.itemId && void sheet.remove(b.itemId)}
				disabled={removing}
				aria-label={`Remove ${b.name}`}
				className="grid grid-cols-[minmax(0,1fr)] h-7 w-7 shrink-0 place-items-center border border-transparent text-mute hover:border-line-strong hover:text-ink"
			>
				<svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
					<path d="M2 2l8 8M10 2 2 10" stroke="currentColor" strokeWidth="1.4" />
				</svg>
			</button>
		</li>
	);
}

function SuggestionRow({ s, sheet, tz }: { s: Suggestion; sheet: DaySheetState; tz: string }) {
	const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
	const run = async () => {
		setState('busy');
		const r =
			s.type === 'add'
				? await sheet.add({ space: s.space, start: s.start, minutes: s.minutes })
				: s.type === 'extra'
					? await sheet.setExtra(s.booking, s.extra, s.quantity)
					: await sheet.swap(s.booking, s.to);
		setState(r.ok ? 'idle' : 'error');
	};
	const price = s.type === 'swap' ? s.delta : s.price;
	return (
		<li className="flex items-center gap-3 border border-dashed border-ink/40 bg-sheet px-2.5 py-2">
			<div className="min-w-0 flex-1">
				<p className="text-[0.875rem] font-medium leading-tight">{s.title}</p>
				<p className="truncate text-[0.75rem] text-mute">
					{s.type === 'add' ? `${at(s.start, tz, 'HH:mm')}–${at(s.start + s.minutes, tz, 'HH:mm')} · ` : ''}
					{state === 'error' ? 'That’s just gone. Try another.' : s.note}
				</p>
			</div>
			<Button size="sm" variant="marigold" onClick={run} loading={state === 'busy'} aria-label={`${s.type === 'swap' ? 'Switch' : 'Add'}: ${s.title}`}>
				{s.type === 'swap' ? 'Switch' : 'Add'} {price > 0 ? <Price amount={price} className="text-[0.8125rem]" /> : null}
			</Button>
		</li>
	);
}

function HoldTimer({ seconds, onExtend, hidden }: { seconds: number | null; onExtend: () => Promise<void>; hidden?: boolean }) {
	if (hidden || seconds === null) return null;
	const low = seconds < 180;
	const mm = Math.floor(seconds / 60);
	const ss = String(seconds % 60).padStart(2, '0');
	return (
		<div className={cn('flex flex-col items-end justify-center border-l border-ink px-3', low && 'bg-marigold-soft')}>
			<span className="t-label text-mute">Held</span>
			<span className="t-num text-[0.9375rem]" aria-live={low ? 'polite' : 'off'}>
				{seconds > 0 ? `${mm}:${ss}` : 'Expired'}
			</span>
			{low ? (
				<button type="button" onClick={() => void onExtend()} className="text-[0.75rem] font-medium text-cobalt underline underline-offset-2">
					Keep it
				</button>
			) : null}
		</div>
	);
}
