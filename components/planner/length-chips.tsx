'use client';

import { memo } from 'react';
import { Chip } from '@/components/ui/chip';
import { DimensionLine } from '@/components/ui/dimension-line';
import { formatLength, shortLength } from '@/lib/workspace';
import { cn } from '@/lib/utils';

/** Length chips with a dimension line under them that stretches to the chosen length. */
export const LengthChips = memo(function LengthChips({
	lengths,
	value,
	onChange,
	showLine = true,
	labelBg,
	className,
}: {
	lengths: number[];
	value: number;
	onChange: (m: number) => void;
	showLine?: boolean;
	labelBg?: string;
	className?: string;
}) {
	const max = Math.max(...lengths, value);
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<div role="group" aria-label="Length" className="flex flex-wrap gap-1.5">
				{lengths.map((m) => (
					<Chip key={m} size="sm" selected={m === value} onClick={() => onChange(m)} title={formatLength(m)}>
						{m === 240 ? 'Half day' : m === 480 ? 'Full day' : m === 720 ? 'Late (12h)' : shortLength(m)}
					</Chip>
				))}
			</div>
			{showLine ? <DimensionLine label={formatLength(value)} fraction={value / max} tone="cobalt" labelBg={labelBg} /> : null}
		</div>
	);
});
