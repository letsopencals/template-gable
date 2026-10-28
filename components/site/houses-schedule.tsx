import Link from 'next/link';
import { Figure } from '@/components/ui/figure';
import { PlanIcon } from '@/components/ui/plan-icon';
import type { KindKey } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export interface HouseCard {
	id: string;
	slug: string;
	short: string;
	neighbourhood: string;
	line: string;
	image: string | null;
	kinds: KindKey[];
	flexSeats: number;
	roomCount: number;
	spaceCount: number;
}

/**
 * The houses as a drawing schedule: one ruled grid of cells sharing their borders (no floating cards), each with a
 * photo, H-number, name, neighbourhood, one line, and the kinds it has as plan icons.
 */
export function HousesSchedule({ houses, columns = 3 }: { houses: HouseCard[]; columns?: 2 | 3 }) {
	return (
		<ul className={cn('grid border-l border-t border-ink sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>
			{houses.map((h, i) => (
				<li key={h.id} className="border-b border-r border-ink bg-sheet">
					<Link href={`/houses/${h.slug}`} className="group flex h-full flex-col">
						<Figure src={h.image} alt={`Gable ${h.short}`} className="aspect-[4/3] border-b border-ink" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" />
						<div className="flex flex-1 flex-col gap-3 p-5">
							<div className="flex items-baseline justify-between gap-3">
								<h3 className="t-h3 group-hover:text-cobalt">{h.short}</h3>
								<span className="t-label text-faint">H-0{i + 1}</span>
							</div>
							<p className="t-label -mt-2 text-mute">{h.neighbourhood}</p>
							<p className="text-[0.9375rem] text-mute">{h.line}</p>
							<div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
								<span className="flex gap-1 text-cobalt">
									{h.kinds.map((k) => (
										<PlanIcon key={k} kind={k} className="h-6 w-6" title={k} />
									))}
								</span>
								<span className="t-num text-right text-[0.75rem] text-mute">
									{h.flexSeats ? `${h.flexSeats} desks · ` : ''}
									{h.roomCount} rooms
								</span>
							</div>
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
