import Link from 'next/link';
import { PlanIcon } from '@/components/ui/plan-icon';
import { formatMoney } from '@/lib/money';
import { kinds, type KindKey } from '@/lib/site-config';

export interface KindSummary {
	key: KindKey;
	count: number;
	houses: number;
	fromPrice: number | null;
	unit: string;
	seatsMin: number;
	seatsMax: number;
}

/**
 * The seven kinds as a schedule table: plan symbol, name and tagline, how many and where, seats, from-price per unit.
 * Rows link to the kind page. Kinds the store doesn't have are left out.
 */
export function KindsSchedule({ summaries, currency, dark }: { summaries: KindSummary[]; currency: string; dark?: boolean }) {
	const rows = kinds.map((k) => ({ k, s: summaries.find((x) => x.key === k.key) })).filter((r) => r.s && r.s.count > 0);
	const rule = dark ? 'border-white/25' : 'border-line-strong';
	return (
		<div className={dark ? 'border border-white/40' : 'border border-ink bg-sheet'}>
			<div className={`t-label hidden grid-cols-12 border-b px-4 py-2.5 md:grid ${dark ? 'border-white/40 text-white/70' : 'border-ink text-mute'}`}>
				<span className="col-span-5">Kind</span>
				<span className="col-span-3">Where</span>
				<span className="col-span-2">Seats</span>
				<span className="col-span-2 text-right">From</span>
			</div>
			{rows.map(({ k, s }) => (
				<Link
					key={k.key}
					href={k.href}
					className={`group grid grid-cols-12 items-center gap-y-2 border-b px-4 py-4 last:border-b-0 ${rule} ${dark ? 'hover:bg-white/10' : 'hover:bg-wash/50'}`}
				>
					<span className="col-span-12 flex items-center gap-4 md:col-span-5">
						<PlanIcon kind={k.key} className={`h-10 w-10 ${dark ? 'text-marigold' : 'text-cobalt'}`} />
						<span className="flex flex-col">
							<span className="font-display text-[1.1875rem] font-semibold leading-tight group-hover:underline group-hover:underline-offset-4">{k.plural}</span>
							<span className={`text-[0.875rem] ${dark ? 'text-white/70' : 'text-mute'}`}>{k.tagline}</span>
						</span>
					</span>
					<span className={`t-num col-span-6 text-[0.8125rem] md:col-span-3 ${dark ? 'text-white/80' : 'text-mute'}`}>
						{s!.count} {s!.count === 1 ? 'space' : 'spaces'} · {s!.houses} {s!.houses === 1 ? 'house' : 'houses'}
					</span>
					<span className={`t-num col-span-3 text-[0.8125rem] md:col-span-2 ${dark ? 'text-white/80' : 'text-mute'}`}>
						{k.key === 'flex' ? `${s!.seatsMin}–${s!.seatsMax} / floor` : s!.seatsMin === s!.seatsMax ? s!.seatsMin : `${s!.seatsMin}–${s!.seatsMax}`}
					</span>
					<span className="t-num col-span-3 text-right md:col-span-2">
						{s!.fromPrice != null ? (
							<>
								<span className="text-[1.0625rem] font-medium">{formatMoney(s!.fromPrice, currency)}</span>
								<span className={`block text-[0.6875rem] ${dark ? 'text-white/60' : 'text-mute'}`}>/ {s!.unit}</span>
							</>
						) : null}
					</span>
				</Link>
			))}
		</div>
	);
}
