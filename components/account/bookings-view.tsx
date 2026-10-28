'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment-timezone';
import { Button, ButtonLink } from '@/components/ui/button';
import { Tag } from '@/components/ui/chip';
import { PlanIcon } from '@/components/ui/plan-icon';
import { WeekBoard } from '@/components/account/week-board';
import { BookingActionDialog, type ActionKind } from '@/components/account/booking-actions';
import { rebookHref } from '@/components/confirmation/thank-you-view';
import { useAccountBookings } from '@/hooks/use-account-bookings';
import { canCancel, canReschedule, isUpcoming, type Booking } from '@/lib/booking';
import { kindByKey } from '@/lib/site-config';
import { formatLength, type Catalogue } from '@/lib/workspace';
import { at, localDay, nowMin, todayIn } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

const mondayOf = (date: string) => moment(date).isoWeekday(1).format('YYYY-MM-DD');

/**
 * /account — "Your week" board on top, then what's coming up (change time, stay longer, invite, cancel) and what's
 * past (book again). `fixtures` renders the preview without an API.
 */
export function BookingsView({ cat, fixtures, focus }: { cat: Catalogue; fixtures?: Booking[]; focus?: { id: string; action: string | null } | null }) {
	const { bookings, loading, error, refresh } = useAccountBookings(cat, fixtures);
	const tz = cat.houses[0]?.tz ?? 'Europe/Dublin';
	const today = todayIn(tz);
	const now = nowMin();
	const live = useMemo(() => bookings.filter((b) => !['canceled', 'cancelled'].includes(b.status)), [bookings]);
	const upcoming = useMemo(() => live.filter((b) => isUpcoming(b, now)), [live, now]);
	const past = useMemo(() => live.filter((b) => !isUpcoming(b, now)).sort((a, b) => b.start - a.start), [live, now]);

	const [week, setWeek] = useState(() => mondayOf(today));
	const [picked, setPicked] = useState(false);
	useEffect(() => {
		if (picked || !upcoming.length) return;
		setWeek(mondayOf(localDay(upcoming[0]!.start, tz)));
	}, [upcoming, tz, picked]);
	const [selected, setSelected] = useState<string | null>(null);
	const [action, setAction] = useState<{ booking: Booking; kind: ActionKind } | null>(null);
	// An email link: pick the booking, show its week, open the action it asked for.
	const focused = useRef(false);
	useEffect(() => {
		if (focused.current || !focus || !bookings.length) return;
		const b = bookings.find((x) => x.id === focus.id);
		if (!b) return;
		focused.current = true;
		setPicked(true);
		setWeek(mondayOf(localDay(b.start, tz)));
		setSelected(b.id);
		const a = focus.action === 'cancel' ? 'cancel' : focus.action === 'reschedule' ? 'reschedule' : null;
		if (a && isUpcoming(b)) setAction({ booking: b, kind: a });
	}, [focus, bookings, tz]);
	const weekCount = live.filter((b) => mondayOf(localDay(b.start, tz)) === week).length;

	const select = (id: string) => {
		setSelected(id);
		document.getElementById(`b-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	};

	return (
		<div className="flex flex-col gap-10">
			<section aria-label="Your week">
				<div className="mb-3 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="t-h2">Your week</h2>
						<p className="t-label mt-1 text-mute">
							{moment(week).format('D MMM')} – {moment(week).add(6, 'day').format('D MMM YYYY')} · {weekCount} {weekCount === 1 ? 'booking' : 'bookings'}
						</p>
					</div>
					<div className="flex gap-1.5">
						<Button size="sm" variant="outline" aria-label="Previous week" onClick={() => { setPicked(true); setWeek(moment(week).subtract(1, 'week').format('YYYY-MM-DD')); }}>
							←
						</Button>
						<Button size="sm" variant="outline" onClick={() => { setPicked(true); setWeek(mondayOf(today)); }}>
							This week
						</Button>
						<Button size="sm" variant="outline" aria-label="Next week" onClick={() => { setPicked(true); setWeek(moment(week).add(1, 'week').format('YYYY-MM-DD')); }}>
							→
						</Button>
					</div>
				</div>
				{loading ? <div className="hatch-light h-80 border border-line" aria-label="Loading" /> : <WeekBoard bookings={live} weekStart={week} tz={tz} selectedId={selected} onSelect={select} />}
				<p className="mt-2 flex flex-wrap gap-4 text-[0.75rem] text-mute">
					<span className="inline-flex items-center gap-1.5"><span className="hatch-cobalt inline-block h-3 w-4 border border-cobalt" /> desks and offices</span>
					<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-4 bg-cobalt" /> rooms, booths, studios</span>
				</p>
			</section>

			{error ? (
				<p className="border-l-2 border-alert bg-sheet px-4 py-3">
					We couldn’t load your bookings. <button type="button" className="font-medium text-cobalt underline" onClick={() => void refresh()}>Try again</button>
				</p>
			) : null}

			<section aria-label="Coming up">
				<div className="mb-3 flex items-end justify-between gap-3 border-b border-ink pb-2">
					<h2 className="font-display text-2xl font-semibold">Coming up</h2>
					<ButtonLink href="/book" size="sm">Plan another day</ButtonLink>
				</div>
				{!loading && !upcoming.length ? (
					<div className="drafting-grid border border-line-strong px-5 py-10 text-center">
						<p className="font-medium">Nothing booked yet.</p>
						<p className="mt-1 text-[0.9375rem] text-mute">A desk for tomorrow is two taps away.</p>
					</div>
				) : null}
				<ol className="flex flex-col gap-2">
					{upcoming.map((b) => (
						<Row key={b.id} b={b} tz={tz} selected={b.id === selected} onAction={(kind) => setAction({ booking: b, kind })} />
					))}
				</ol>
			</section>

			{past.length ? (
				<section aria-label="Past">
					<h2 className="mb-3 border-b border-ink pb-2 font-display text-2xl font-semibold">Before</h2>
					<ol className="divide-y divide-line border-y border-line">
						{past.slice(0, 12).map((b) => (
							<li key={b.id} className="flex flex-wrap items-center gap-3 py-2.5">
								<span className="t-num w-28 text-[0.8125rem] text-mute">{at(b.start, b.house?.tz ?? tz, 'ddd D MMM')}</span>
								<span className="min-w-0 flex-1 truncate">
									{b.name} <span className="text-mute">· {b.house?.short}</span>
								</span>
								<Link href={rebookHref(b, Math.max(1, Math.ceil((nowMin() - b.start) / 1440 / 7) * 7))} className="text-[0.875rem] font-medium text-cobalt underline underline-offset-4">
									Book again
								</Link>
							</li>
						))}
					</ol>
				</section>
			) : null}

			{action ? (
				<BookingActionDialog
					cat={cat}
					booking={action.booking}
					action={action.kind}
					preview={!!fixtures}
					onClose={() => setAction(null)}
					onDone={() => {
						if (action.kind !== 'invite') setAction(null);
						void refresh();
					}}
				/>
			) : null}
		</div>
	);
}

function Row({ b, tz, selected, onAction }: { b: Booking; tz: string; selected: boolean; onAction: (k: ActionKind) => void }) {
	const t = b.house?.tz ?? tz;
	const kind = b.space ? kindByKey(b.space.kind) : null;
	const resched = canReschedule(b);
	const cancel = canCancel(b);
	return (
		<li id={`b-${b.id}`} className={cn('grid gap-4 border bg-sheet p-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]', selected ? 'border-ink shadow-[0_0_0_3px_var(--color-marigold)]' : 'border-line-strong')}>
			<div className="flex items-baseline gap-2 sm:flex-col sm:gap-0 sm:border-r sm:border-line sm:pr-3">
				<span className="t-label text-mute">{at(b.start, t, 'ddd')}</span>
				<span className="t-num text-[1.75rem] leading-none">{at(b.start, t, 'D')}</span>
				<span className="t-label text-mute">{at(b.start, t, 'MMM')}</span>
			</div>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					{b.space ? <PlanIcon kind={b.space.kind} className="h-6 w-6 text-cobalt" /> : null}
					<h3 className="font-display text-xl font-semibold leading-none">{b.name}</h3>
					{b.status === 'pending' ? <Tag tone="marigold">Pending</Tag> : <Tag tone="free">Confirmed</Tag>}
				</div>
				<p className="t-num mt-1.5 text-[0.9375rem]">
					{at(b.start, t, 'HH:mm')}–{at(b.end, t, 'HH:mm')} <span className="text-mute">· {formatLength(b.minutes)}</span>
				</p>
				<p className="text-[0.875rem] text-mute">
					{kind?.label} · {b.house?.short}
					{b.space?.level != null ? ` · Level ${b.space.level}` : ''}
					{b.space?.shared ? ` · ${b.seats} ${b.seats === 1 ? 'seat' : 'seats'}` : ''}
					{b.guests.length ? ` · ${b.guests.length} invited` : ''}
					{b.ref ? ` · #${b.ref}` : ''}
				</p>
				{b.extras.length ? <p className="mt-1 text-[0.8125rem]">+ {b.extras.map((x) => `${x.title}${x.quantity > 1 ? ` × ${x.quantity}` : ''}`).join(' · ')}</p> : null}
				{b.meetingTitle ? <p className="mt-1 text-[0.8125rem]">Door screen: “{b.meetingTitle}”</p> : null}
			</div>
			<div className="flex flex-wrap items-start gap-1.5 sm:max-w-[15rem] sm:justify-end">
				<Button size="sm" variant="outline" disabled={!resched} onClick={() => onAction('reschedule')} title={resched ? undefined : 'Too close to the start to move'}>
					Change time
				</Button>
				<Button size="sm" variant="outline" onClick={() => onAction('extend')}>
					Stay longer
				</Button>
				{b.space?.allowGuests ? (
					<Button size="sm" variant="outline" onClick={() => onAction('invite')}>
						Invite
					</Button>
				) : null}
				<Button size="sm" variant="ghost" disabled={!cancel} onClick={() => onAction('cancel')} className="text-alert">
					Cancel
				</Button>
			</div>
		</li>
	);
}
