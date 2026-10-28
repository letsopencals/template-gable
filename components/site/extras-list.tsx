import { formatMoney } from '@/lib/money';
import { extraGroups } from '@/lib/site-config';
import type { Extra } from '@/lib/workspace';

/**
 * Extras (store add-ons) grouped by site-config `extraGroups`, as a schedule: name and description left, price and
 * its rule ("per person", "per 30 min") right. Unknown add-ons land in "More".
 */
export function ExtrasList({ extras, currency, limitPerGroup, houseNames }: { extras: Extra[]; currency: string; limitPerGroup?: number; houseNames?: Record<string, string> }) {
	const known = new Set(extraGroups.flatMap((g) => g.slugs));
	const groups = [
		...extraGroups.map((g) => ({ ...g, items: g.slugs.map((s) => extras.find((e) => e.slug === s)).filter((e): e is Extra => !!e) })),
		{ key: 'more', label: 'More', blurb: '', slugs: [], items: extras.filter((e) => !known.has(e.slug)) },
	].filter((g) => g.items.length);

	return (
		<div className="grid gap-px border border-ink bg-ink lg:grid-cols-2">
			{groups.map((g) => (
				<section key={g.key} id={`extras-${g.key}`} className="bg-sheet">
					<header className="border-b border-ink px-5 py-4">
						<h3 className="t-h3">{g.label}</h3>
						{g.blurb ? <p className="mt-1 text-[0.875rem] text-mute">{g.blurb}</p> : null}
					</header>
					<ul>
						{g.items.slice(0, limitPerGroup ?? 99).map((e) => (
							<li key={e.id} className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
								<div className="min-w-0">
									<p className="font-medium">{e.title}</p>
									{e.description ? <p className="text-[0.8125rem] text-mute">{e.description}</p> : null}
									{houseNames && e.houseIds.length ? (
										<p className="t-label mt-1 text-faint">Only at {e.houseIds.map((id) => houseNames[id]).filter(Boolean).join(', ')}</p>
									) : null}
								</div>
								<div className="t-num shrink-0 text-right">
									<span className="font-medium">{formatMoney(e.price, currency)}</span>
									<span className="block text-[0.6875rem] text-mute">{ruleOf(e)}</span>
								</div>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}

export function ruleOf(e: Pick<Extra, 'perUnit' | 'maxQuantity'>): string {
	if (e.perUnit) return 'scales with the booking';
	if (e.maxQuantity > 1) return 'per person';
	return 'per booking';
}
