'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { SpaceRows } from '@/components/site/space-rows';
import { Chip } from '@/components/ui/chip';
import { Stepper } from '@/components/ui/stepper';
import { PlanIcon } from '@/components/ui/plan-icon';
import { kinds, type KindKey } from '@/lib/site-config';
import type { SpaceCard } from '@/lib/site-data';
import { cn } from '@/lib/utils';

export interface CatalogueFilters {
	kind: KindKey | null;
	house: string | null;
	seats: number;
	kit: string[];
	sort: 'fit' | 'price' | 'seats';
}

/**
 * Every space, filterable by kind, house, seats and kit, sorted by best fit, price or size. Filters live in the URL
 * (`?kind=room&house=dock-house&seats=6&kit=Daylight&sort=price`) so a filtered list can be shared; changing one
 * replaces the URL without a navigation. All filtering is local: the full list arrives with the page.
 */
export function SpaceCatalogue({
	spaces,
	houses,
	currency,
	initial,
}: {
	spaces: SpaceCard[];
	houses: { slug: string; short: string }[];
	currency: string;
	initial: CatalogueFilters;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [, startTransition] = useTransition();
	const [f, setF] = useState<CatalogueFilters>(initial);

	const update = (patch: Partial<CatalogueFilters>) => {
		const next = { ...f, ...patch };
		setF(next);
		const q = new URLSearchParams();
		if (next.kind) q.set('kind', next.kind);
		if (next.house) q.set('house', next.house);
		if (next.seats > 1) q.set('seats', String(next.seats));
		next.kit.forEach((k) => q.append('kit', k));
		if (next.sort !== 'fit') q.set('sort', next.sort);
		startTransition(() => router.replace(`${pathname}${q.size ? `?${q}` : ''}`, { scroll: false }));
	};

	const kitOptions = useMemo(() => {
		const count = new Map<string, number>();
		for (const s of spaces) if (!f.kind || s.kind === f.kind) for (const k of s.kit) count.set(k, (count.get(k) ?? 0) + 1);
		return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k);
	}, [spaces, f.kind]);

	const list = useMemo(() => {
		const out = spaces.filter(
			(s) =>
				(!f.kind || s.kind === f.kind) &&
				(!f.house || s.houseSlug === f.house) &&
				s.seats >= f.seats &&
				f.kit.every((k) => s.kit.includes(k)),
		);
		if (f.sort === 'price') out.sort((a, b) => a.price - b.price);
		else if (f.sort === 'seats') out.sort((a, b) => b.seats - a.seats);
		// "fit": the smallest space that seats everyone first
		else if (f.seats > 1) out.sort((a, b) => a.seats - b.seats);
		return out;
	}, [spaces, f]);

	const active = !!(f.kind || f.house || f.seats > 1 || f.kit.length);

	return (
		<div className="grid gap-8 lg:grid-cols-12">
			<aside className="lg:col-span-3" aria-label="Filters">
				<div className="flex flex-col gap-6 border border-ink bg-sheet p-4 lg:sticky lg:top-32">
					<FilterGroup label="Kind">
						<div className="grid grid-cols-1 gap-1">
							{kinds.map((k) => {
								const n = spaces.filter((s) => s.kind === k.key && (!f.house || s.houseSlug === f.house)).length;
								if (!n) return null;
								const on = f.kind === k.key;
								return (
									<button
										key={k.key}
										type="button"
										aria-pressed={on}
										onClick={() => update({ kind: on ? null : k.key, kit: [] })}
										className={cn('flex items-center gap-2.5 border px-2 py-1.5 text-left text-[0.875rem]', on ? 'border-ink bg-ink text-paper' : 'border-transparent hover:border-line-strong')}
									>
										<PlanIcon kind={k.key} className={cn('h-5 w-5', on ? 'text-marigold' : 'text-cobalt')} />
										<span className="flex-1">{k.plural}</span>
										<span className="t-num text-[0.75rem] opacity-70">{n}</span>
									</button>
								);
							})}
						</div>
					</FilterGroup>
					<FilterGroup label="House">
						<select
							value={f.house ?? ''}
							onChange={(e) => update({ house: e.target.value || null })}
							className="h-10 w-full border border-line-strong bg-sheet px-2 text-[0.9375rem] focus:border-cobalt focus:outline-none"
						>
							<option value="">Every house</option>
							{houses.map((h) => (
								<option key={h.slug} value={h.slug}>
									{h.short}
								</option>
							))}
						</select>
					</FilterGroup>
					<FilterGroup label="Seats at least">
						<Stepper value={f.seats} onChange={(v) => update({ seats: v })} min={1} max={60} label="Seats" />
					</FilterGroup>
					{kitOptions.length ? (
						<FilterGroup label="Kit">
							<div className="flex flex-wrap gap-1.5">
								{kitOptions.map((k) => (
									<Chip key={k} size="sm" selected={f.kit.includes(k)} onClick={() => update({ kit: f.kit.includes(k) ? f.kit.filter((x) => x !== k) : [...f.kit, k] })}>
										{k}
									</Chip>
								))}
							</div>
						</FilterGroup>
					) : null}
					{active ? (
						<button type="button" onClick={() => update({ kind: null, house: null, seats: 1, kit: [] })} className="self-start text-[0.875rem] text-mute underline underline-offset-4 hover:text-ink">
							Clear filters
						</button>
					) : null}
				</div>
			</aside>
			<div className="lg:col-span-9">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
					<p className="t-label text-mute" aria-live="polite">
						{list.length} {list.length === 1 ? 'space' : 'spaces'}
					</p>
					<div className="flex items-center gap-1.5">
						<span className="t-label mr-1 text-mute">Sort</span>
						{(
							[
								['fit', 'Best fit'],
								['price', 'Price'],
								['seats', 'Largest'],
							] as const
						).map(([v, l]) => (
							<Chip key={v} size="sm" selected={f.sort === v} onClick={() => update({ sort: v })}>
								{l}
							</Chip>
						))}
					</div>
				</div>
				<SpaceRows spaces={list} currency={currency} />
			</div>
		</div>
	);
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="t-label text-mute">{label}</span>
			{children}
		</div>
	);
}
