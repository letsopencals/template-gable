import Link from 'next/link';
import { Figure } from '@/components/ui/figure';
import { PlanIcon } from '@/components/ui/plan-icon';
import { Tag } from '@/components/ui/chip';
import { formatMoney } from '@/lib/money';
import { kindByKey } from '@/lib/site-config';
import type { SpaceCard } from '@/lib/site-data';
import { cn } from '@/lib/utils';

/**
 * Spaces as a schedule: one row per space with a photo, plan icon, name, house and level, seats, kit, the price per
 * unit, and two actions (the space page, and straight into the planner with the space pre-picked).
 * Server- and client-safe (no hooks).
 */
export function SpaceRows({ spaces, currency, showHouse = true, className }: { spaces: SpaceCard[]; currency: string; showHouse?: boolean; className?: string }) {
	if (!spaces.length) {
		return <p className="hatch-light border border-line-strong p-8 text-center text-mute">No spaces match. Try another house or fewer filters.</p>;
	}
	return (
		<ul className={cn('border-t border-ink', className)}>
			{spaces.map((s) => (
				<li key={s.id} className="grid grid-cols-12 gap-x-4 gap-y-3 border-b border-line-strong py-4 sm:gap-x-6">
					<Link href={`/spaces/${s.slug}`} className="col-span-4 sm:col-span-3 lg:col-span-2">
						<Figure src={s.image} alt={s.name} fallback="kind" kind={s.kind} className="aspect-[4/3] border border-line-strong" />
					</Link>
					<div className="col-span-8 flex min-w-0 flex-col gap-1.5 sm:col-span-5 lg:col-span-5">
						<p className="t-label flex items-center gap-2 text-mute">
							<PlanIcon kind={s.kind} className="h-4 w-4 text-cobalt" />
							{kindByKey(s.kind).label}
							{showHouse ? <span>· {s.houseShort}</span> : null}
							{s.level != null ? <span>· L{s.level}</span> : null}
						</p>
						<Link href={`/spaces/${s.slug}`} className="font-display text-[1.25rem] font-semibold leading-tight hover:text-cobalt">
							{s.name}
						</Link>
						<p className="line-clamp-2 text-[0.875rem] text-mute">{s.copy}</p>
						{s.kit.length ? (
							<div className="mt-1 hidden flex-wrap gap-1 sm:flex">
								{s.kit.slice(0, 4).map((k) => (
									<Tag key={k}>{k}</Tag>
								))}
							</div>
						) : null}
					</div>
					<div className="col-span-6 flex flex-col justify-center gap-1 sm:col-span-2 lg:col-span-2">
						<span className="t-label text-mute">Seats</span>
						<span className="t-num text-[1.0625rem]">{s.shared ? `${s.seats} seats` : s.seats}</span>
					</div>
					<div className="col-span-6 flex flex-col items-end justify-center gap-2 sm:col-span-2 lg:col-span-3">
						<span className="t-num text-right">
							<span className="text-[1.25rem] font-medium">{formatMoney(s.price, currency)}</span>
							<span className="text-[0.75rem] text-mute"> / {s.unit}{s.shared ? ' · seat' : ''}</span>
						</span>
						<Link
							href={`/book?house=${s.houseSlug}&kind=${s.kind}&space=${s.slug}`}
							className="t-label inline-flex items-center gap-2 border border-ink px-3 py-2 font-semibold hover:bg-ink hover:text-paper"
						>
							Book →
						</Link>
					</div>
				</li>
			))}
		</ul>
	);
}

/**
 * Many interchangeable units (studio desks S1–S8, booths B1–B3) as one row: the first unit's photo and copy, the
 * price, and a chip per unit linking to its page. Falls back to SpaceRows for three or fewer.
 */
export function SpaceGroupRow({ spaces, currency }: { spaces: SpaceCard[]; currency: string }) {
	if (spaces.length <= 3) return <SpaceRows spaces={spaces} currency={currency} showHouse={false} />;
	const s = spaces[0]!;
	const label = kindByKey(s.kind);
	return (
		<div className="grid grid-cols-12 gap-x-4 gap-y-3 border-y border-ink py-4 sm:gap-x-6">
			<div className="col-span-4 sm:col-span-3 lg:col-span-2">
				<Figure src={s.image} alt={label.plural} fallback="kind" kind={s.kind} className="aspect-[4/3] border border-line-strong" />
			</div>
			<div className="col-span-8 flex min-w-0 flex-col gap-2 sm:col-span-6 lg:col-span-7">
				<p className="t-label flex items-center gap-2 text-mute">
					<PlanIcon kind={s.kind} className="h-4 w-4 text-cobalt" />
					{spaces.length} {label.plural.toLowerCase()}
				</p>
				<p className="line-clamp-2 text-[0.875rem] text-mute">{s.copy}</p>
				<div className="flex flex-wrap gap-1">
					{spaces.map((u) => (
						<Link key={u.id} href={`/spaces/${u.slug}`} className="t-num border border-line-strong px-2 py-1 text-[0.8125rem] hover:border-ink hover:bg-wash">
							{u.name}
						</Link>
					))}
				</div>
			</div>
			<div className="col-span-12 flex items-center justify-between gap-2 sm:col-span-3 sm:flex-col sm:items-end sm:justify-center">
				<span className="t-num text-right">
					<span className="text-[1.25rem] font-medium">{formatMoney(s.price, currency)}</span>
					<span className="text-[0.75rem] text-mute"> / {s.unit}</span>
				</span>
				<Link href={`/book?house=${s.houseSlug}&kind=${s.kind}`} className="t-label inline-flex items-center gap-2 border border-ink px-3 py-2 font-semibold hover:bg-ink hover:text-paper">
					Book any →
				</Link>
			</div>
		</div>
	);
}
