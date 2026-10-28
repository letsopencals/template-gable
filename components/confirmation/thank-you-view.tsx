'use client';

import Link from 'next/link';
import { Button, buttonClasses } from '@/components/ui/button';
import { SheetStrip } from '@/components/ui/sheet';
import { DayPrintout, type PrintoutReceipt } from '@/components/confirmation/day-printout';
import { InviteGuests } from '@/components/confirmation/invite-guests';
import { useSettings } from '@/contexts/settings-context';
import type { Booking } from '@/lib/booking';
import { downloadIcs } from '@/lib/ics';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';
import type { Catalogue } from '@/lib/workspace';
import { at, localDay } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';
import moment from 'moment-timezone';

/** Deep link to plan the same day again, a week later (or the same space). */
export function rebookHref(b: Booking, plusDays = 7): string {
	const tz = b.house?.tz ?? 'Europe/Dublin';
	const p = new URLSearchParams();
	if (b.house) p.set('house', b.house.slug);
	if (b.space) {
		p.set('kind', b.space.kind);
		p.set('space', b.space.slug);
	}
	p.set('date', moment(localDay(b.start, tz)).add(plusDays, 'day').format('YYYY-MM-DD'));
	p.set('start', at(b.start, tz, 'HH:mm'));
	p.set('length', String(b.minutes));
	if (b.space?.shared && b.seats > 1) p.set('people', String(b.seats));
	return `/book?${p}`;
}

/**
 * /thank-you — the day sheet, printed. Above it: who it's for, how it's paid, calendar/print/manage. Below it: how to
 * get in and get there for each house, invitations for rooms, and what to plan next.
 */
export function ThankYouView({ cat, bookings, receipt, preview }: { cat: Catalogue; bookings: Booking[]; receipt: PrintoutReceipt; preview?: boolean }) {
	const { currency } = useSettings();
	const houses = [...new Map(bookings.filter((b) => b.house).map((b) => [b.house!.id, b.house!])).values()];
	const rooms = bookings.filter((b) => b.space?.allowGuests);
	const first = bookings[0];
	const tz = first?.house?.tz ?? 'Europe/Dublin';
	const firstName = receipt.name?.split(' ')[0] ?? null;
	const payLine = receipt.total <= 0 ? 'There’s nothing to pay.' : receipt.paid ? `Paid ${formatMoney(receipt.total, currency)}, receipt in your inbox.` : `Pay ${formatMoney(receipt.due, currency)} at the front desk on the day, by card or phone.`;

	return (
		<div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-6 lg:px-10 print:max-w-none print:p-0">
			<SheetStrip number="GA-400" title="Confirmed" note={receipt.ref ? `Ref #${receipt.ref}` : undefined} className="print:hidden" />
			<header className="grid grid-cols-[minmax(0,1fr)] gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end print:hidden">
				<div>
					<h1 className="t-h1">
						You’re booked{firstName ? <>, <span className="highlight">{firstName}</span></> : null}.
					</h1>
					<p className="t-lead mt-3 max-w-2xl">
						{bookings.length === 1 ? 'Your booking is' : bookings.length === 2 ? 'Both bookings are' : `All ${bookings.length} bookings are`} confirmed{receipt.email ? <> and on the way to <strong className="font-medium text-ink">{receipt.email}</strong></> : null}. {payLine}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="primary" onClick={() => downloadIcs(bookings, siteConfig.name, `gable-${receipt.ref || 'day'}.ics`)} disabled={!bookings.length}>
						Add to calendar
					</Button>
					<Button variant="outline" onClick={() => window.print()}>
						Print day sheet
					</Button>
					<Link href={preview ? '/preview/account' : '/account'} className={buttonClasses('ghost', 'md')}>
						Change or cancel →
					</Link>
				</div>
			</header>

			{bookings.length ? (
				<DayPrintout cat={cat} bookings={bookings} receipt={receipt} currency={currency} />
			) : (
				<p className="hatch-light border border-line px-4 py-6">We couldn’t load the bookings on this order here. They’re in your confirmation email and on your bookings page.</p>
			)}

			<div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-px border border-line-strong bg-line-strong md:grid-cols-2 xl:grid-cols-3 print:hidden">
				{houses.map((h) => (
					<section key={h.id} aria-label={`Getting in at ${h.short}`} className="flex flex-col gap-3 bg-sheet p-5">
						<p className="t-label text-mute">Getting in · {h.short}</p>
						<p className="text-[0.9375rem]">{h.presentation?.arrival ?? `Reception is just inside the front door at ${h.title}.`}</p>
						{h.presentation?.wifi ? <p className="text-[0.875rem] text-mute">Wi-Fi: {h.presentation.wifi}</p> : null}
						{h.presentation?.hours?.length ? (
							<dl className="t-num grid grid-cols-[5rem_1fr] text-[0.8125rem]">
								{h.presentation.hours.map((r) => (
									<div key={r.days} className="contents">
										<dt className="text-mute">{r.days}</dt>
										<dd>{r.time}</dd>
									</div>
								))}
							</dl>
						) : null}
					</section>
				))}
				{houses.map((h) => (
					<section key={`${h.id}-there`} aria-label={`Getting to ${h.short}`} className="flex flex-col gap-3 bg-sheet p-5">
						<p className="t-label text-mute">Getting there</p>
						<p className="font-medium">{h.address}</p>
						<ul className="flex flex-col gap-1 text-[0.875rem] text-mute">
							{(h.presentation?.gettingThere ?? []).map((g) => (
								<li key={g}>— {g}</li>
							))}
						</ul>
						{h.lat != null && h.lng != null ? (
							<a className="mt-auto text-[0.875rem] font-medium text-cobalt underline underline-offset-4" href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lng}`} target="_blank" rel="noreferrer">
								Open in Maps →
							</a>
						) : null}
					</section>
				))}
				{rooms.length ? (
					<section aria-label="Invite people" className="flex flex-col gap-4 bg-sheet p-5">
						<p className="t-label text-mute">Invite people</p>
						{rooms.map((b) => (
							<div key={b.id} className="flex flex-col gap-2">
								<p className="font-medium">
									{b.name} <span className="t-num font-normal text-mute">· {at(b.start, b.house?.tz ?? tz, 'ddd HH:mm')}</span>
								</p>
								<InviteGuests booking={b} preview={preview} />
							</div>
						))}
					</section>
				) : null}
			</div>

			{first ? (
				<section aria-label="Plan next" className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 print:hidden">
					<Link href={rebookHref(first)} className={cn('group flex flex-col gap-2 border border-ink bg-cobalt p-6 text-white')}>
						<span className="t-label text-white/70">Same again</span>
						<span className="font-display text-2xl font-semibold leading-tight">Book {first.name} for next {at(first.start, tz, 'dddd')}</span>
						<span className="text-[0.9375rem] text-white/80">Same time, same length. Check it and add it to a new day sheet.</span>
					</Link>
					{first.house ? (
						<Link href={`/book?house=${first.house.slug}&kind=desks&date=${moment(localDay(first.start, tz)).add(1, 'day').format('YYYY-MM-DD')}`} className="group flex flex-col gap-2 border border-ink bg-marigold p-6 text-ink">
							<span className="t-label text-ink/70">The day after</span>
							<span className="font-display text-2xl font-semibold leading-tight">A desk at {first.house.short} tomorrow</span>
							<span className="text-[0.9375rem] text-ink/80">Flex seats from half a day. Your locker and monitor can come too.</span>
						</Link>
					) : null}
				</section>
			) : null}
		</div>
	);
}
