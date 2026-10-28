import type { Metadata } from 'next';
import { Planner } from '@/components/planner/planner';
import { getCatalogue } from '@/lib/server-data';
import { getHouseAvailability } from '@/lib/availability-server';
import { houseBySlug, spaceBySlug, spacesAt } from '@/lib/workspace';

export const metadata: Metadata = {
	title: 'Plan your day',
	description: 'Book a desk, a meeting room, a phone booth or a studio at any Gable house, and plan the whole day in one checkout.',
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function BookPage({ searchParams }: { searchParams: Promise<Search> }) {
	const sp = await searchParams;
	const params = {
		house: one(sp.house),
		kind: one(sp.kind),
		date: one(sp.date),
		start: one(sp.start),
		length: one(sp.length),
		people: one(sp.people),
		space: one(sp.space),
	};
	const cat = await getCatalogue();
	// Server-render the linked house's availability (else the first house's) so results paint without a spinner.
	const linked = houseBySlug(cat, params.house) ?? (() => {
		const s = spaceBySlug(cat, params.space);
		return s ? (cat.houses.find((h) => h.id === s.houseId) ?? null) : null;
	})();
	const house = linked ?? (params.house ? null : cat.houses[0]) ?? null;
	const initialAvailability = house ? { houseId: house.id, data: await getHouseAvailability(spacesAt(cat, house.id), house.tz) } : null;
	return <Planner cat={cat} params={params} initialAvailability={initialAvailability} />;
}
