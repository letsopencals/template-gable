import { cn } from '@/lib/utils';

/** Questions as numbered rows on a schedule; native <details>, so it works without JS. */
export function FaqList({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
	return (
		<div className={cn('border-t border-ink', className)}>
			{items.map((f, i) => (
				<details key={f.q} className="group border-b border-line-strong">
					<summary className="flex cursor-pointer list-none items-baseline gap-4 py-4 hover:text-cobalt [&::-webkit-details-marker]:hidden">
						<span className="t-label w-8 shrink-0 text-faint">Q{String(i + 1).padStart(2, '0')}</span>
						<span className="flex-1 font-display text-[1.125rem] font-semibold leading-snug">{f.q}</span>
						<span aria-hidden className="relative h-3 w-3 shrink-0">
							<span className="absolute inset-x-0 top-1/2 h-px bg-current" />
							<span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform group-open:scale-y-0" />
						</span>
					</summary>
					<p className="max-w-2xl pb-5 pl-12 text-[0.9375rem] text-mute">{f.a}</p>
				</details>
			))}
		</div>
	);
}
