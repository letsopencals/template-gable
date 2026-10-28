import { Fragment } from 'react';
import { TitleBlock } from '@/components/ui/title-block';
import { PlanIcon } from '@/components/ui/plan-icon';
import { HouseSection } from '@/components/confirmation/house-section';
import type { Booking } from '@/lib/booking';
import { kindByKey } from '@/lib/site-config';
import { formatMoney } from '@/lib/money';
import { formatLength, type Catalogue, type Space } from '@/lib/workspace';
import { at, dayStart, localDay } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

export interface PrintoutReceipt {
	ref: string;
	paid: boolean;
	total: number;
	due: number;
	email: string | null;
	name: string | null;
}

/**
 * The confirmation artifact: the day sheet as a printed drawing sheet. A section through each house with the route to
 * every booked space, the day drawn to scale (hours across, a bar per booking with its dimension), and the title block
 * (ref, house, date, booked by, total, payment). Prints on one A4 page (print styles hide the site around it).
 */
export function DayPrintout({ cat, bookings, receipt, currency, className }: { cat: Catalogue; bookings: Booking[]; receipt: PrintoutReceipt; currency: string; className?: string }) {
	const first = bookings[0];
	const house = first?.house ?? null;
	const tz = house?.tz ?? 'Europe/Dublin';
	const days = [...new Set(bookings.map((b) => localDay(b.start, b.house?.tz ?? tz)))];
	const houses = [...new Map(bookings.filter((b) => b.house).map((b) => [b.house!.id, b.house!])).values()];
	return (
		<article className={cn('sheet-frame sheet-ticks print:border-0', className)} aria-label="Day sheet">
			<div className="flex items-stretch border-b border-ink text-[0.6875rem]">
				<span className="t-label flex items-center border-r border-ink px-3 py-2.5 font-semibold">DS-{receipt.ref || '—'}</span>
				<span className="t-label flex flex-1 items-center px-3 text-mute">Day sheet · {house?.title ?? 'Gable'}</span>
				<span className="t-label hidden items-center border-l border-ink px-3 text-mute sm:flex">Scale 1:100 · Not for construction</span>
			</div>
			<div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
					{houses.map((h) => (
						<figure key={h.id} className="drafting-grid border border-line bg-paper/50 p-3">
							<HouseSection cat={cat} house={h} marked={uniqueSpaces(bookings.filter((b) => b.house?.id === h.id))} />
							<figcaption className="t-label mt-2 flex justify-between text-mute">
								<span>Section A–A · {h.short}</span>
								<span>Route from the front door</span>
							</figcaption>
						</figure>
					))}
					{days.map((day) => {
						const list = bookings.filter((b) => localDay(b.start, b.house?.tz ?? tz) === day);
						return (
							<section key={day} aria-label={day}>
								<h3 className="t-label mb-2 border-b border-line-strong pb-1.5 text-ink">{at(dayStart(day, tz) + 720, tz, 'dddd D MMMM YYYY')}</h3>
								<DayScale list={list} tz={list[0]?.house?.tz ?? tz} day={day} />
								<ol className="mt-3 divide-y divide-line">
									{list.map((b) => (
										<li key={b.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
											<span className="t-num text-[0.875rem]">
												{at(b.start, b.house?.tz ?? tz, 'HH:mm')}
												<span className="block text-mute">{at(b.end, b.house?.tz ?? tz, 'HH:mm')}</span>
											</span>
											<div className="min-w-0">
												<p className="flex items-center gap-2 font-medium">
													{b.space ? <PlanIcon kind={b.space.kind} className="h-5 w-5 text-cobalt" /> : null}
													{b.name}
													{b.meetingTitle ? <span className="truncate font-normal text-mute">· {b.meetingTitle}</span> : null}
												</p>
												<p className="text-[0.8125rem] text-mute">
													{b.space ? kindByKey(b.space.kind).label : 'Booking'}
													{b.space?.level != null ? ` · Level ${b.space.level}` : ''} · {formatLength(b.minutes)}
													{b.space?.shared ? ` · ${b.seats} ${b.seats === 1 ? 'seat' : 'seats'}` : ''}
													{b.guests.length ? ` · ${b.guests.length + 1} people` : ''}
												</p>
												{b.extras.length ? <p className="text-[0.8125rem]">+ {b.extras.map((x) => `${x.title}${x.quantity > 1 ? ` × ${x.quantity}` : ''}`).join(' · ')}</p> : null}
											</div>
											{b.total != null ? <span className="t-num hidden text-[0.875rem] sm:block">{formatMoney(b.total, currency)}</span> : null}
										</li>
									))}
								</ol>
							</section>
						);
					})}
				</div>
				<div className="border-t border-ink lg:border-l lg:border-t-0">
					<TitleBlock
						className="border-0"
						heading="Gable"
						number={receipt.ref ? `#${receipt.ref}` : undefined}
						rows={[
							{ k: 'House', v: houses.map((h) => h.short).join(', ') || '—' },
							{ k: 'Date', v: days.length ? days.map((d) => at(dayStart(d, tz) + 720, tz, 'ddd D MMM')).join(', ') : '—' },
							{ k: 'Bookings', v: String(bookings.length) },
							{ k: 'Booked by', v: receipt.name ?? receipt.email ?? '—' },
							{ k: 'Total', v: <span className="t-num">{formatMoney(receipt.total, currency)}</span> },
							{ k: 'Payment', v: receipt.paid ? 'Paid' : receipt.total > 0 ? <span>{formatMoney(receipt.due, currency)} at the front desk</span> : 'Nothing to pay' },
							{ k: 'Drawn', v: <span className="t-num">{at(Math.floor(Date.now() / 60000), tz, 'DD.MM.YY HH:mm')}</span> },
						]}
					/>
				</div>
			</div>
		</article>
	);
}

function uniqueSpaces(list: Booking[]): Space[] {
	return [...new Map(list.filter((b) => b.space).map((b) => [b.space!.id, b.space!])).values()];
}

/** The day to scale: opening hours across, a bar per booking with its length dimensioned underneath. */
function DayScale({ list, tz, day }: { list: Booking[]; tz: string; day: string }) {
	const ds = dayStart(day, tz);
	const a = Math.min(8, ...list.map((b) => Math.floor((b.start - ds) / 60)));
	const z = Math.max(20, ...list.map((b) => Math.ceil((b.end - ds) / 60)));
	const span = (z - a) * 60;
	const pct = (m: number) => `${((m - ds - a * 60) / span) * 100}%`;
	return (
		<div className="relative pb-5" aria-hidden>
			<div className="relative border-x border-line-strong" style={{ height: `${list.length * 26 + 6}px` }}>
				{Array.from({ length: z - a + 1 }, (_, i) => (
					<Fragment key={i}>
						<span className="absolute inset-y-0 w-px bg-line" style={{ left: `${(i / (z - a)) * 100}%` }} />
						<span className="t-num absolute -bottom-5 -translate-x-1/2 text-[0.625rem] text-faint" style={{ left: `${(i / (z - a)) * 100}%` }}>
							{i % 2 === 0 ? String(a + i).padStart(2, '0') : ''}
						</span>
					</Fragment>
				))}
				{list.map((b, i) => (
					<div key={b.id} className="absolute flex flex-col" style={{ top: `${4 + i * 26}px`, left: pct(b.start), width: `${(b.minutes / span) * 100}%` }}>
						<span className={cn('hatch-sweep block h-2.5', b.space?.kind === 'flex' || b.space?.kind === 'desk' ? 'hatch-cobalt border border-cobalt' : 'bg-cobalt')} />
						<span className="relative mt-1 h-2 border-x border-ink">
							<span className="absolute inset-x-0 top-1/2 h-px bg-ink" />
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
