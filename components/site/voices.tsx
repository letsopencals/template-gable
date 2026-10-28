import { siteConfig } from '@/lib/site-config';

/** Testimonials as margin notes: a quote per cell of a two-column ruled grid, the speaker in mono underneath. */
export function Voices() {
	return (
		<ul className="grid border-l border-t border-line-strong md:grid-cols-2">
			{siteConfig.testimonials.map((t, i) => (
				<li key={t.name} className="flex flex-col justify-between gap-6 border-b border-r border-line-strong p-6 sm:p-8">
					<blockquote className="font-display text-[1.25rem] font-medium leading-snug tracking-[-0.01em] sm:text-[1.375rem]">
						<span aria-hidden className="mr-1 text-cobalt">“</span>
						{t.quote}
						<span aria-hidden className="text-cobalt">”</span>
					</blockquote>
					<p className="flex items-baseline gap-3">
						<span className="t-label text-faint">N{String(i + 1).padStart(2, '0')}</span>
						<span>
							<span className="font-semibold">{t.name}</span>
							<span className="text-mute"> · {t.role}</span>
						</span>
					</p>
				</li>
			))}
		</ul>
	);
}
