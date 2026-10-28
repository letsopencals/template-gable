'use client';

import { memo } from 'react';
import { busyBlocks, dayStart, type Packed } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

/**
 * One space's day as a strip of the opening hours: hatched where it's taken (like a cut wall on a plan), white where
 * it's free, and the chosen span in marigold. Hour ticks underneath. Read-only: the start chips do the choosing.
 */
export const DayBar = memo(function DayBar({
	ranges,
	date,
	tz,
	window,
	seats = 1,
	selection,
	labels = true,
	className,
}: {
	ranges: Packed[] | undefined;
	date: string;
	tz: string;
	window: { open: number; close: number };
	seats?: number;
	/** UTC epoch minutes */
	selection?: { start: number; minutes: number } | null;
	labels?: boolean;
	className?: string;
}) {
	const ds = dayStart(date, tz);
	const a = ds + window.open;
	const span = Math.max(60, window.close - window.open);
	const pct = (m: number) => `${Math.max(0, Math.min(100, ((m - a) / span) * 100))}%`;
	const width = (s: number, e: number) => `${Math.max(0, ((Math.min(e, a + span) - Math.max(s, a)) / span) * 100)}%`;
	const now = Math.floor(Date.now() / 60000);
	const past = now > a ? Math.min(now, a + span) : a;
	const hours: number[] = [];
	for (let h = Math.ceil(window.open / 60); h * 60 <= window.close; h++) hours.push(h);
	const busy = busyBlocks(ranges, date, tz, window, seats);
	return (
		<div className={cn('w-full', className)}>
			<div className="relative h-5 border border-line-strong bg-sheet">
				{past > a ? <div className="absolute inset-y-0 left-0 bg-paper-deep" style={{ width: width(a, past) }} aria-hidden /> : null}
				{busy.map(([s, e]) => (
					<div key={s} className="hatch absolute inset-y-0 border-x border-line-strong/70" style={{ left: pct(s), width: width(s, e) }} aria-hidden />
				))}
				{selection ? (
					<div
						className="absolute inset-y-[-3px] border-2 border-ink bg-marigold/80 transition-[left,width] duration-300"
						style={{ left: pct(selection.start), width: width(selection.start, selection.start + selection.minutes) }}
						aria-hidden
					/>
				) : null}
			</div>
			{labels ? (
				<div className="relative mt-1 h-3.5">
					{hours.map((h, i) =>
						i % (hours.length > 10 ? 2 : 1) === 0 ? (
							<span key={h} className="t-num absolute -translate-x-1/2 text-[0.625rem] text-faint" style={{ left: pct(ds + h * 60) }}>
								{String(h).padStart(2, '0')}
							</span>
						) : null,
					)}
				</div>
			) : null}
		</div>
	);
});
