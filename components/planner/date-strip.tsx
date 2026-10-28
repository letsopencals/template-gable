'use client';

import { memo, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import { cn } from '@/lib/utils';

/**
 * A row of days (today + the next two weeks). Closed or fully booked days stay visible but are struck through, so the
 * week keeps its shape. The chosen day is scrolled into view on narrow screens.
 */
export const DateStrip = memo(function DateStrip({
	days,
	value,
	onChange,
	open,
	today,
	className,
}: {
	days: string[];
	value: string;
	onChange: (d: string) => void;
	/** Days with at least one fitting start; null while availability loads (nothing struck) */
	open: Set<string> | null;
	today: string;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
		el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}, [value]);
	return (
		<div ref={ref} role="group" aria-label="Day" className={cn('no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1', className)}>
			{days.map((d) => {
				const m = moment(d);
				const closed = open !== null && !open.has(d);
				const selected = d === value;
				return (
					<button
						key={d}
						type="button"
						aria-pressed={selected}
						aria-label={`${m.format('dddd D MMMM')}${closed ? ', nothing free' : ''}`}
						onClick={() => onChange(d)}
						className={cn(
							'relative flex w-[3.25rem] shrink-0 flex-col items-center rounded-[2px] border py-1.5 transition-colors',
							selected
								? 'border-ink bg-ink text-paper after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-marigold'
								: closed
									? 'hatch-light border-line text-faint'
									: 'border-line-strong bg-sheet hover:border-ink',
						)}
					>
						<span className={cn('t-label', selected ? 'text-paper/70' : 'text-mute', closed && 'text-faint')}>
							{d === today ? 'Today' : m.format('ddd')}
						</span>
						<span className={cn('t-num text-[1.0625rem] leading-tight', closed && !selected && 'line-through')}>{m.format('D')}</span>
						<span className={cn('text-[0.625rem] leading-none', selected ? 'text-paper/70' : 'text-faint')}>{m.format('MMM')}</span>
					</button>
				);
			})}
		</div>
	);
});
