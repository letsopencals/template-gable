'use client';

import { cn } from '@/lib/utils';

/** Quantity stepper (people, catering portions, seats). Square, hairline, mono figure. */
export function Stepper({
	value,
	onChange,
	min = 0,
	max = 99,
	label,
	size = 'md',
	className,
}: {
	value: number;
	onChange: (next: number) => void;
	min?: number;
	max?: number;
	/** Accessible name, e.g. "People" */
	label: string;
	size?: 'sm' | 'md';
	className?: string;
}) {
	const h = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
	return (
		<div role="group" aria-label={label} className={cn('inline-flex w-max items-stretch self-start rounded-[2px] border border-line-strong bg-sheet', className)}>
			<button
				type="button"
				aria-label={`Fewer ${label.toLowerCase()}`}
				disabled={value <= min}
				onClick={() => onChange(Math.max(min, value - 1))}
				className={cn(h, 'grid place-items-center text-ink hover:bg-paper-deep disabled:text-faint disabled:hover:bg-transparent')}
			>
				<svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
					<path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</button>
			<output aria-live="polite" className={cn('t-num grid min-w-9 place-items-center border-x border-line-strong px-1 text-[0.9375rem]', size === 'sm' && 'min-w-8 text-[0.8125rem]')}>
				{value}
			</output>
			<button
				type="button"
				aria-label={`More ${label.toLowerCase()}`}
				disabled={value >= max}
				onClick={() => onChange(Math.min(max, value + 1))}
				className={cn(h, 'grid place-items-center text-ink hover:bg-paper-deep disabled:text-faint disabled:hover:bg-transparent')}
			>
				<svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
					<path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</button>
		</div>
	);
}
