import type { ReactNode } from 'react';
import { SheetStrip } from '@/components/ui/sheet';
import { Figure } from '@/components/ui/figure';
import type { KindKey } from '@/lib/site-config';

/**
 * The top of every content page: the sheet strip (number, title, note), a big title and lead on the left, and an
 * optional photograph (or drawing) on the right — all inside one ruled frame, like the cover of a drawing.
 */
export function PageHeader({
	number,
	strip,
	note,
	title,
	lead,
	image,
	imageAlt,
	caption,
	fallbackKind,
	children,
	aside,
}: {
	number: string;
	strip: string;
	note?: ReactNode;
	title: ReactNode;
	lead?: ReactNode;
	image?: string | null;
	imageAlt?: string;
	caption?: ReactNode;
	fallbackKind?: KindKey;
	/** Under the lead (CTAs, chips) */
	children?: ReactNode;
	/** Replaces the image column */
	aside?: ReactNode;
}) {
	const hasRight = image !== undefined || aside;
	return (
		<section className="bg-paper">
			<div className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-6 lg:px-10">
				<div className="border border-ink bg-sheet">
					<SheetStrip number={number} title={strip} note={note} className="border-ink" />
					<div className={hasRight ? 'grid lg:grid-cols-12' : ''}>
						<div className={hasRight ? 'flex flex-col justify-end gap-6 p-6 sm:p-10 lg:col-span-6' : 'flex flex-col gap-6 p-6 sm:p-10'}>
							<h1 className="t-h1 max-w-3xl">{title}</h1>
							{lead ? <p className="t-lead max-w-2xl">{lead}</p> : null}
							{children}
						</div>
						{hasRight ? (
							<div className="relative min-h-[260px] border-t border-ink lg:col-span-6 lg:min-h-[420px] lg:border-l lg:border-t-0">
								{aside ?? (
									<Figure src={image ?? null} alt={imageAlt ?? ''} caption={caption} priority fallback={fallbackKind ? 'kind' : 'house'} kind={fallbackKind} className="absolute inset-0" />
								)}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	);
}
