import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A page section is a *sheet* from the drawing set: a sheet strip across the top (sheet number, sheet title, a note
 * on the right such as a scale or a count), then the content inside a gutter with grid references on the edge.
 *
 *   <Sheet number="GA-104" title="Meeting rooms" note="22 rooms · 6 houses" tone="paper">…</Sheet>
 *
 * tone: paper (default page), sheet (white), cobalt (brand band, white ink), ink (dark band).
 */
export type SheetTone = 'paper' | 'sheet' | 'cobalt' | 'ink';

const toneClass: Record<SheetTone, string> = {
	paper: 'bg-paper text-ink',
	sheet: 'bg-sheet text-ink',
	cobalt: 'bg-cobalt text-white',
	ink: 'bg-ink text-paper',
};

export function Sheet({
	number,
	title,
	note,
	tone = 'paper',
	id,
	className,
	innerClassName,
	refs = true,
	children,
}: {
	number: string;
	title: string;
	note?: ReactNode;
	tone?: SheetTone;
	id?: string;
	className?: string;
	innerClassName?: string;
	/** Grid references (A B C D… along the strip) */
	refs?: boolean;
	children: ReactNode;
}) {
	const dark = tone === 'cobalt' || tone === 'ink';
	return (
		<section id={id} className={cn(toneClass[tone], 'relative', className)}>
			<div className="mx-auto max-w-[1360px] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-10">
				<SheetStrip number={number} title={title} note={note} dark={dark} refs={refs} />
				<div className={cn('pb-16 pt-8 sm:pb-24 sm:pt-12', innerClassName)}>{children}</div>
			</div>
		</section>
	);
}

/** The strip alone, for use inside other layouts (page headers, panels). */
export function SheetStrip({
	number,
	title,
	note,
	dark,
	refs = true,
	className,
}: {
	number: string;
	title: string;
	note?: ReactNode;
	dark?: boolean;
	refs?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				'flex items-stretch border-b text-[0.6875rem]',
				dark ? 'border-white/25' : 'border-line-strong',
				className,
			)}
		>
			<SheetNumber number={number} dark={dark} />
			<div className={cn('t-label flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5', dark ? 'text-white/80' : 'text-mute')}>
				<span className="truncate">{title}</span>
				{refs ? (
					<span aria-hidden className="ml-auto hidden gap-[3.25rem] pr-4 opacity-60 lg:flex">
						{['A', 'B', 'C', 'D', 'E', 'F'].map((r) => (
							<span key={r}>{r}</span>
						))}
					</span>
				) : null}
			</div>
			{note ? (
				<div className={cn('t-label hidden items-center border-l px-3 sm:flex', dark ? 'border-white/25 text-white/80' : 'border-line-strong text-mute')}>
					{note}
				</div>
			) : null}
		</div>
	);
}

/** "GA-104" set in a boxed cell, like the sheet number in a title block. */
export function SheetNumber({ number, dark, className }: { number: string; dark?: boolean; className?: string }) {
	return (
		<span
			className={cn(
				't-label inline-flex items-center border-r px-3 py-2.5 font-semibold',
				dark ? 'border-white/25 text-white' : 'border-line-strong text-ink',
				className,
			)}
		>
			{number}
		</span>
	);
}

/** Section heading inside a sheet: a big display line plus an optional lead paragraph, set on a 12-col grid. */
export function SheetHeading({
	title,
	lead,
	aside,
	dark,
	className,
}: {
	title: ReactNode;
	lead?: ReactNode;
	aside?: ReactNode;
	/** On cobalt/ink sheets */
	dark?: boolean;
	className?: string;
}) {
	return (
		<div className={cn('grid gap-6 lg:grid-cols-12 lg:items-end', className)}>
			<h2 className="t-h2 lg:col-span-7">{title}</h2>
			{lead || aside ? (
				<div className="flex flex-col gap-4 lg:col-span-5 lg:pb-1">
					{lead ? <p className={cn('t-lead', dark && 'text-current! opacity-80')}>{lead}</p> : null}
					{aside}
				</div>
			) : null}
		</div>
	);
}
