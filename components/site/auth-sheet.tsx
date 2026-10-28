import type { ReactNode } from 'react';
import { SheetStrip } from '@/components/ui/sheet';
import { GableMark } from '@/components/ui/logo';

/**
 * Layout for every auth screen: a cobalt cover panel (the gable drawn large, a line about what an account is for)
 * beside a framed sheet with its strip and the form. Stacks on phones with the form first.
 */
export function AuthSheet({ number, title, lead, children, aside }: { number: string; title: string; lead?: ReactNode; children: ReactNode; aside?: ReactNode }) {
	return (
		<section className="bg-paper">
			<div className="mx-auto grid max-w-[1360px] px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-12 lg:px-10">
				<div className="order-2 hidden flex-col justify-between gap-10 border border-ink bg-cobalt p-8 text-white lg:order-1 lg:col-span-5 lg:flex lg:border-r-0">
					<GableMark className="h-24 w-24 text-white" />
					<div>
						<p className="t-label text-white/70">Your Gable account</p>
						<p className="mt-3 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em]">Your week, your rooms, your guests. In one place.</p>
						<ul className="mt-6 border-t border-white/30 text-[0.9375rem] text-white/85">
							{['See every booking on one week board', 'Move a meeting or extend it by half an hour', 'Add guests and catering after you book', 'Book the same desk again in one tap'].map((t) => (
								<li key={t} className="border-b border-white/30 py-2.5">
									{t}
								</li>
							))}
						</ul>
					</div>
				</div>
				<div className="order-1 border border-ink bg-sheet lg:order-2 lg:col-span-7">
					<SheetStrip number={number} title={title} refs={false} className="border-ink" />
					<div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10 sm:py-14">
						<div>
							<h1 className="t-h2">{title}</h1>
							{lead ? <p className="mt-3 text-mute">{lead}</p> : null}
						</div>
						{children}
						{aside ? <div className="border-t border-line pt-5 text-[0.875rem] text-mute">{aside}</div> : null}
					</div>
				</div>
			</div>
		</section>
	);
}

export function FormError({ children }: { children: ReactNode }) {
	return (
		<p role="alert" className="border-l-2 border-alert bg-alert/5 px-3 py-2 text-[0.875rem] text-alert">
			{children}
		</p>
	);
}
