import { cn } from '@/lib/utils';
import { PlanIcon } from '@/components/ui/plan-icon';
import type { KindKey } from '@/lib/site-config';

/**
 * A photograph with a caption strip, or — when there's no image — a drawn placeholder: an elevation of a gable
 * building (houses) or the kind's plan icon blown up on the drafting grid (spaces). Never a broken image.
 * `src` must already be resolved (lib/media.ts#existingImage on the server, or an API image URL).
 */
export function Figure({
	src,
	alt,
	caption,
	fallback = 'house',
	kind,
	className,
	imgClassName,
	priority,
}: {
	src: string | null | undefined;
	alt: string;
	caption?: React.ReactNode;
	fallback?: 'house' | 'kind';
	kind?: KindKey;
	className?: string;
	imgClassName?: string;
	priority?: boolean;
}) {
	return (
		<figure className={cn('relative overflow-hidden bg-paper-deep', className)}>
			{src ? (
				// eslint-disable-next-line @next/next/no-img-element -- images are pre-sized; next.config sets unoptimized
				<img
					src={src}
					alt={alt}
					loading={priority ? 'eager' : 'lazy'}
					fetchPriority={priority ? 'high' : undefined}
					className={cn('h-full w-full object-cover', imgClassName)}
				/>
			) : fallback === 'kind' && kind ? (
				<div role="img" aria-label={alt} className="drafting-grid grid h-full w-full place-items-center text-cobalt">
					<PlanIcon kind={kind} className="h-1/2 max-h-40 w-1/2 max-w-40 opacity-80 [stroke-width:0.6]" />
				</div>
			) : (
				<Elevation label={alt} />
			)}
			{caption ? (
				<figcaption className="t-label absolute bottom-0 left-0 max-w-full truncate border-r border-t border-ink/20 bg-sheet/95 px-2.5 py-1.5 text-ink">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}

/** Front elevation of a gable-ended building on the drafting grid, hatched ground line. */
export function Elevation({ label, className }: { label: string; className?: string }) {
	return (
		<div role="img" aria-label={label} className={cn('drafting-grid relative h-full w-full bg-wash/60', className)}>
			<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full text-cobalt" fill="none" stroke="currentColor" strokeWidth="1.2">
				<path d="M60 230V110L160 40l100 70v120" />
				<path d="M260 230V130h90v100" />
				<path d="M260 130l45-30 45 30" />
				{[0, 1, 2].map((r) =>
					[0, 1, 2].map((c) => <rect key={`${r}${c}`} x={92 + c * 52} y={112 + r * 36} width="32" height="24" />),
				)}
				<rect x="146" y="196" width="28" height="34" />
				<rect x="284" y="150" width="42" height="26" />
				<rect x="152" y="70" width="16" height="16" fill="var(--color-marigold)" stroke="currentColor" />
				<path d="M20 230h360" strokeWidth="1.6" />
			</svg>
			<div className="hatch-light absolute inset-x-0 bottom-0 h-[11.5%]" />
		</div>
	);
}
