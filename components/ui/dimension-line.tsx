import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A dimension line, as drawn on a plan:  |←—— 2 h ——→|
 * Used for durations (booking length, opening hours, a span on the day sheet). `fraction` (0–1) sets how much of the
 * container width the line spans; changing it animates the line (transform), so a length chip "stretches" it.
 */
export function DimensionLine({
	label,
	fraction = 1,
	tone = 'ink',
	labelBg = 'bg-sheet',
	className,
}: {
	label: ReactNode;
	fraction?: number;
	tone?: 'ink' | 'cobalt' | 'white';
	/** Background behind the label so the line breaks around it (match the surface: bg-sheet, bg-paper, bg-cobalt…) */
	labelBg?: string;
	className?: string;
}) {
	const f = Math.max(0.08, Math.min(1, fraction));
	const color = tone === 'cobalt' ? 'text-cobalt' : tone === 'white' ? 'text-white' : 'text-ink';
	return (
		<div className={cn('relative h-6 w-full', color, className)} aria-label={typeof label === 'string' ? label : undefined}>
			<div className="dim-line absolute inset-y-0 left-0" style={{ width: `${f * 100}%` }}>
				{/* extension ticks */}
				<span className="absolute left-0 top-0 h-full w-px bg-current" />
				<span className="absolute right-0 top-0 h-full w-px bg-current" />
				{/* the line */}
				<span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
				{/* arrowheads (architectural 45° slashes) */}
				<span className="absolute left-0 top-1/2 h-[9px] w-px -translate-y-1/2 translate-x-[1px] rotate-45 bg-current" />
				<span className="absolute right-0 top-1/2 h-[9px] w-px -translate-y-1/2 -translate-x-[1px] rotate-45 bg-current" />
			</div>
			{label === '' || label == null ? null : <span
				className={cn('t-num absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.75rem] font-medium transition-[left] duration-500', f >= 0.3 && '-translate-x-1/2')}
				// Short lines carry the label just past their end, long ones in the middle (with the line broken around it)
				style={{ left: f >= 0.3 ? `${(f * 100) / 2}%` : `calc(${f * 100}% + 0.375rem)` }}
			>
				<span className={cn('px-1', labelBg)}>{label}</span>
			</span>}
		</div>
	);
}

/** Static inline dimension (no animation) for small labels: ├ 4 h ┤ */
export function DimInline({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<span className={cn('t-num inline-flex items-center gap-1 text-[0.75rem]', className)}>
			<span aria-hidden className="inline-block h-2.5 w-px bg-current" />
			<span aria-hidden className="inline-block h-px w-2 bg-current" />
			<span>{children}</span>
			<span aria-hidden className="inline-block h-px w-2 bg-current" />
			<span aria-hidden className="inline-block h-2.5 w-px bg-current" />
		</span>
	);
}
