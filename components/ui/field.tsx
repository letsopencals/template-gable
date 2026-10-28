import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Fields look like boxes on a drawing schedule: a mono key above, a hairline box below. */
const fieldBase =
	'w-full rounded-[2px] border border-line-strong bg-sheet px-3.5 text-[0.9375rem] text-ink placeholder:text-faint transition-colors hover:border-mute focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/20 aria-[invalid=true]:border-alert disabled:bg-paper-deep disabled:text-faint';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
	{ className, ...rest },
	ref,
) {
	return <input ref={ref} className={cn(fieldBase, 'h-11', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
	{ className, rows = 4, ...rest },
	ref,
) {
	return <textarea ref={ref} rows={rows} className={cn(fieldBase, 'py-2.5 leading-relaxed', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
	{ className, children, ...rest },
	ref,
) {
	return (
		<div className="relative">
			<select ref={ref} className={cn(fieldBase, 'h-11 appearance-none pr-9', className)} {...rest}>
				{children}
			</select>
			<svg viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-mute" aria-hidden>
				<path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
			</svg>
		</div>
	);
});

/** Label + control + hint/error. `htmlFor` must match the control id. */
export function Field({
	label,
	htmlFor,
	hint,
	error,
	optional,
	children,
	className,
}: {
	label: ReactNode;
	htmlFor?: string;
	hint?: ReactNode;
	error?: ReactNode;
	optional?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-1.5', className)}>
			<label htmlFor={htmlFor} className="t-label flex items-baseline justify-between text-mute">
				<span>{label}</span>
				{optional ? <span className="text-faint normal-case tracking-normal">optional</span> : null}
			</label>
			{children}
			{error ? (
				<p role="alert" className="text-[0.8125rem] text-alert">
					{error}
				</p>
			) : hint ? (
				<p className="text-[0.8125rem] text-mute">{hint}</p>
			) : null}
		</div>
	);
}
