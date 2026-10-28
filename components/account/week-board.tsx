'use client';

import { memo, useMemo } from 'react';
import moment from 'moment-timezone';
import type { Booking } from '@/lib/booking';
import { at, dayStart, localDay, todayIn } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

const START_H = 8;
const END_H = 20;
const HOUR_PX = 30;

/**
 * "Week plan": seven columns, Monday to Sunday, the opening hours down the side, every booking drawn to scale.
 * Desks are hatched in cobalt along the left of the day (the baseline), rooms, booths and studios are solid blocks on
 * the right. Tapping a block picks it in the list below.
 */
export const WeekBoard = memo(function WeekBoard({
	bookings,
	weekStart,
	tz,
	selectedId,
	onSelect,
}: {
	bookings: Booking[];
	/** Monday, YYYY-MM-DD */
	weekStart: string;
	tz: string;
	selectedId: string | null;
	onSelect: (id: string) => void;
}) {
	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => moment(weekStart).add(i, 'day').format('YYYY-MM-DD')), [weekStart]);
	const today = todayIn(tz);
	const height = (END_H - START_H) * HOUR_PX;
	return (
		<div className="no-scrollbar overflow-x-auto border border-ink bg-sheet">
			<div className="grid min-w-[640px] grid-cols-[3rem_repeat(7,minmax(0,1fr))]">
				<div className="border-b border-r border-line-strong" />
				{days.map((d) => (
					<div key={d} className={cn('border-b border-r border-line-strong px-2 py-2 last:border-r-0', d === today && 'bg-wash')}>
						<p className="t-label text-mute">{moment(d).format('ddd')}</p>
						<p className={cn('t-num text-[1.0625rem] leading-none', d === today && 'highlight')}>{moment(d).format('D')}</p>
					</div>
				))}
				<div className="relative border-r border-line-strong" style={{ height }}>
					{Array.from({ length: END_H - START_H + 1 }, (_, i) =>
						i % 2 === 0 ? (
							<span key={i} className="t-num absolute right-1.5 -translate-y-1/2 text-[0.625rem] text-faint" style={{ top: i * HOUR_PX }}>
								{String(START_H + i).padStart(2, '0')}
							</span>
						) : null,
					)}
				</div>
				{days.map((d) => {
					const ds = dayStart(d, tz);
					const list = bookings.filter((b) => localDay(b.start, b.house?.tz ?? tz) === d);
					return (
						<div key={d} className={cn('relative border-r border-line-strong last:border-r-0', d === today && 'bg-wash/40', moment(d).day() === 0 && 'hatch-light')} style={{ height }}>
							{Array.from({ length: END_H - START_H - 1 }, (_, i) => (
								<span key={i} className="absolute inset-x-0 h-px bg-line" style={{ top: (i + 1) * HOUR_PX }} aria-hidden />
							))}
							{list.map((b) => {
								const top = Math.max(0, ((b.start - ds) / 60 - START_H) * HOUR_PX);
								const h = Math.max(14, (b.minutes / 60) * HOUR_PX);
								const desk = b.space?.kind === 'flex' || b.space?.kind === 'desk' || b.space?.kind === 'office';
								const sel = b.id === selectedId;
								const cancelled = b.status === 'canceled' || b.status === 'cancelled';
								return (
									<button
										key={b.id}
										type="button"
										onClick={() => onSelect(b.id)}
										aria-label={`${b.name}, ${at(b.start, tz, 'ddd HH:mm')}–${at(b.end, tz, 'HH:mm')}`}
										className={cn(
											'absolute overflow-hidden border text-left transition-shadow',
											desk ? 'left-1 w-[34%] border-cobalt bg-sheet hatch-cobalt' : 'left-[40%] right-1 border-ink bg-cobalt text-white',
											sel && 'z-10 shadow-[0_0_0_3px_var(--color-marigold)]',
											cancelled && 'opacity-40 line-through',
										)}
										style={{ top, height: h }}
									>
										{!desk ? (
											<span className="block truncate px-1.5 pt-0.5 text-[0.6875rem] font-medium leading-tight">
												{b.name}
												<span className="t-num block font-normal opacity-80">{at(b.start, tz, 'HH:mm')}</span>
											</span>
										) : null}
									</button>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
});
