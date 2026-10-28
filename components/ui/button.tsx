import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Buttons are rectangles (radius 2px), never pills. The primary press is the only shadow on the site: a 1px ink
 * offset line that the button "sits down" onto.
 *   primary  cobalt fill, white text — one per view
 *   ink      ink fill, paper text — on photos and cobalt bands
 *   outline  hairline ink border
 *   ghost    text only, underline on hover
 *   marigold the highlighter colour — only for "add to day sheet" upsells
 */
export type ButtonVariant = 'primary' | 'ink' | 'outline' | 'ghost' | 'marigold';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
	'inline-flex items-center justify-center gap-2 rounded-[2px] font-medium whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 disabled:opacity-45 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
	primary:
		'bg-cobalt text-white shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-cobalt-deep active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
	ink: 'bg-ink text-paper shadow-[2px_2px_0_0_var(--color-cobalt)] hover:bg-ink-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
	outline: 'border border-ink text-ink bg-transparent hover:bg-ink hover:text-paper',
	ghost: 'text-ink underline-offset-4 decoration-1 hover:underline px-0!',
	marigold:
		'bg-marigold text-ink shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-[#f0a91f] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
};

const sizes: Record<ButtonSize, string> = {
	sm: 'h-9 px-3.5 text-[0.8125rem]',
	md: 'h-11 px-5 text-[0.9375rem]',
	lg: 'h-14 px-7 text-base',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', fullWidth = false) {
	return cn(base, variants[variant], sizes[size], fullWidth && 'w-full');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = 'primary', size = 'md', fullWidth, loading, className, children, disabled, type = 'button', ...rest },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={cn(buttonClasses(variant, size, fullWidth), className)}
			{...rest}
		>
			{loading ? <Spinner /> : null}
			{children}
		</button>
	);
});

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean };

/** A `next/link` styled as a button (navigation stays a real link). */
export function ButtonLink({ variant = 'primary', size = 'md', fullWidth, className, ...rest }: ButtonLinkProps) {
	return <Link className={cn(buttonClasses(variant, size, fullWidth), className)} {...rest} />;
}

export function Spinner({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 16 16" className={cn('h-4 w-4 animate-spin', className)} aria-hidden>
			<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
			<path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}
