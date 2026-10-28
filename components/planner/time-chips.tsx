'use client';

import { memo } from 'react';
import { Chip } from '@/components/ui/chip';
import { at } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

const PARTS = [
	{ label: 'Morning', until: 12 * 60 },
	{ label: 'Afternoon', until: 17 * 60 },
	{ label: 'Evening', until: 24 * 60 },
];

/**
 * Start times as plain tappable chips, grouped Morning / Afternoon / Evening. `anyLabel` adds an "Any time" chip
 * (value null) in front. Starts are UTC epoch minutes, shown in the house's timezone.
 */
export const TimeChips = memo(function TimeChips({
	starts,
	value,
	onChange,
	tz,
	anyLabel,
	empty = 'Nothing free that day for this length. Try a shorter length or another day.',
	className,
}: {
	starts: number[];
	value: number | null;
	onChange: (start: number | null) => void;
	tz: string;
	anyLabel?: string;
	empty?: string;
	className?: string;
}) {
	if (!starts.length) return <p className={cn('hatch-light border border-line px-3 py-3 text-[0.875rem] text-mute', className)}>{empty}</p>;
	const local = (s: number) => {
		const [h, m] = at(s, tz, 'H:m').split(':').map(Number);
		return h! * 60 + m!;
	};
	let from = 0;
	const groups = PARTS.map((p) => {
		const list = starts.filter((s) => {
			const l = local(s);
			return l >= from && l < p.until;
		});
		from = p.until;
		return { ...p, list };
	}).filter((g) => g.list.length);
	return (
		<div className={cn('flex flex-col gap-2.5', className)}>
			{anyLabel ? (
				<div>
					<Chip size="sm" selected={value === null} onClick={() => onChange(null)}>
						{anyLabel}
					</Chip>
				</div>
			) : null}
			{groups.map((g) => (
				<div key={g.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
					<span className="t-label w-20 shrink-0 pt-2 text-mute">{g.label}</span>
					<div role="group" aria-label={`${g.label} start times`} className="flex flex-wrap gap-1.5">
						{g.list.map((s) => (
							<Chip key={s} size="sm" selected={value === s} onClick={() => onChange(s)} className="t-num min-w-[3.75rem]">
								{at(s, tz, 'HH:mm')}
							</Chip>
						))}
					</div>
				</div>
			))}
		</div>
	);
});
