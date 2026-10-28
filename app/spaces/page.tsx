import type { Metadata } from 'next';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { spaceCard } from '@/lib/site-data';
import { kinds, type KindKey } from '@/lib/site-config';
import { PageHeader } from '@/components/site/page-header';
import { SpaceCatalogue, type CatalogueFilters } from '@/components/site/space-catalogue';
import { Sheet } from '@/components/ui/sheet';

export const metadata: Metadata = {
	title: 'All spaces',
	description: 'Every desk, meeting room, booth, studio, event space and day office in every Gable house, with seats, kit and prices.',
};

export default async function SpacesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	const [cat, settings, sp] = await Promise.all([getCatalogue(), getStoreSettings(), searchParams]);
	const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
	const kind = one(sp.kind);
	const sort = one(sp.sort);
	const initial: CatalogueFilters = {
		kind: kinds.some((k) => k.key === kind) ? (kind as KindKey) : null,
		house: one(sp.house),
		seats: Math.max(1, parseInt(one(sp.seats) ?? '1', 10) || 1),
		kit: ([] as string[]).concat(sp.kit ?? []),
		sort: sort === 'price' || sort === 'seats' ? sort : 'fit',
	};

	return (
		<>
			<PageHeader
				number="GA-300"
				strip="Schedule of spaces"
				note={`${cat.spaces.length} spaces · ${cat.houses.filter((h) => h.spaceCount).length} houses`}
				title="Every space, every house."
				lead="Filter by what you need: how many people, which house, a screen, daylight. Every row books straight into the planner."
			/>
			<Sheet number="GA-301" title="Spaces" refs={false}>
				<SpaceCatalogue
					spaces={cat.spaces.map((s) => spaceCard(cat, s))}
					houses={cat.houses.filter((h) => h.spaceCount).map((h) => ({ slug: h.slug, short: h.short }))}
					currency={settings?.currency ?? 'EUR'}
					initial={initial}
				/>
			</Sheet>
		</>
	);
}
