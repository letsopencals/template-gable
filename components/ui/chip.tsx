import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Selectable choice (date, start time, length, kind, filter). Square corners, hairline border.
 * Selected = ink fill with a marigold underline bar (the highlighter), so the choice reads at a glance.
 * State comes from `selected` (rendered as aria-pressed).
 */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	selected?: boolean;
	size?: 'sm' | 'md';
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
	{ selected, size = 'md', className, children, type = 'button', ...rest },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			aria-pressed={selected}
			className={cn(
				'relative inline-flex items-center justify-center gap-1.5 rounded-[2px] border text-center transition-colors disabled:cursor-not-allowed',
				size === 'sm' ? 'h-8 px-2.5 text-[0.8125rem]' : 'h-10 px-3.5 text-[0.875rem]',
				selected
					? 'border-ink bg-ink text-paper after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-marigold'
					: 'border-line-strong bg-sheet text-ink hover:border-ink disabled:border-line disabled:bg-paper disabled:text-faint disabled:line-through',
				className,
			)}
			{...rest}
		>
			{children}
		</button>
	);
});

/** Non-interactive tag: kit items, seat counts, status. */
export function Tag({
	children,
	tone = 'plain',
	className,
}: {
	children: ReactNode;
	tone?: 'plain' | 'free' | 'busy' | 'cobalt' | 'marigold';
	className?: string;
}) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]',
				tone === 'plain' && 'border border-line-strong text-mute',
				tone === 'free' && 'bg-free-wash text-free',
				tone === 'busy' && 'hatch-light border border-line-strong text-mute',
				tone === 'cobalt' && 'bg-wash text-cobalt-deep',
				tone === 'marigold' && 'bg-marigold-soft text-ink',
				className,
			)}
		>
			{children}
		</span>
	);
}

/** A live status dot (free now / busy). */
export function StatusDot({ free, className }: { free: boolean; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn('inline-block h-2 w-2 rounded-full', free ? 'bg-free ring-4 ring-free-wash' : 'bg-faint', className)}
		/>
	);
}
