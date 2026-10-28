import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalogue } from '@/lib/server-data';
import { houseCards } from '@/lib/site-data';
import { kinds } from '@/lib/site-config';
import { PageHeader } from '@/components/site/page-header';
import { HousesSchedule } from '@/components/site/houses-schedule';
import { IrelandMap } from '@/components/site/ireland-map';
import { Sheet } from '@/components/ui/sheet';
import { PlanIcon } from '@/components/ui/plan-icon';

export const revalidate = 300;
export const metadata: Metadata = {
	title: 'Houses',
	description: 'Six Gable workspaces in restored buildings: Dock House, Smithfield, Portobello and Harbour in Dublin, Shandon in Cork and Spanish Arch in Galway.',
};

export default async function HousesPage() {
	const cat = await getCatalogue();
	const cards = houseCards(cat);
	const houses = cat.houses.filter((h) => h.spaceCount);
	const pins = houses
		.map((h, i) => ({ slug: h.slug, short: h.short, lat: h.lat ?? NaN, lng: h.lng ?? NaN, index: i + 1 }))
		.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

	return (
		<>
			<PageHeader
				number="GA-200"
				strip="Houses · location plan"
				note={`${houses.length} houses · 3 cities`}
				title="Six old buildings, one booking."
				lead="A grain warehouse, a bonded whiskey store, a Georgian townhouse, a seafront house, a butter market and a stone quay house. Same Wi-Fi, same coffee, same account in all of them."
				aside={
					<div className="drafting-grid flex h-full items-center p-4 sm:p-8">
						<IrelandMap pins={pins} />
					</div>
				}
			/>

			<Sheet number="GA-201" title="Houses" note="Photographs and plans">
				<HousesSchedule houses={cards} />
			</Sheet>

			<Sheet number="GA-202" title="Compare houses" note="Spaces by kind" tone="sheet">
				<h2 className="t-h2 mb-8">What each house has.</h2>
				<div className="overflow-x-auto border border-ink">
					<table className="w-full min-w-[760px] border-collapse text-left">
						<thead>
							<tr className="border-b border-ink">
								<th className="t-label px-4 py-3 font-medium text-mute">House</th>
								{kinds.map((k) => (
									<th key={k.key} className="t-label border-l border-line-strong px-3 py-3 text-center font-medium text-mute">
										<span className="flex flex-col items-center gap-1">
											<PlanIcon kind={k.key} className="h-6 w-6 text-cobalt" />
											{k.plural}
										</span>
									</th>
								))}
								<th className="t-label border-l border-line-strong px-4 py-3 font-medium text-mute">Hours</th>
							</tr>
						</thead>
						<tbody>
							{houses.map((h) => (
								<tr key={h.id} className="border-b border-line-strong last:border-b-0 hover:bg-wash/40">
									<td className="px-4 py-3">
										<Link href={`/houses/${h.slug}`} className="font-display text-[1.0625rem] font-semibold hover:text-cobalt">
											{h.short}
										</Link>
										<span className="block text-[0.8125rem] text-mute">{h.neighbourhood}</span>
									</td>
									{kinds.map((k) => {
										const list = cat.spaces.filter((s) => s.houseId === h.id && s.kind === k.key);
										const n = k.key === 'flex' ? list.reduce((a, s) => a + s.seats, 0) : list.length;
										return (
											<td key={k.key} className={`t-num border-l border-line-strong px-3 py-3 text-center ${n ? '' : 'hatch-light text-faint'}`}>
												{n ? (k.key === 'flex' ? `${n} seats` : n) : '—'}
											</td>
										);
									})}
									<td className="t-num border-l border-line-strong px-4 py-3 text-[0.75rem] leading-relaxed">
										{(h.presentation?.hours ?? []).map((r) => (
											<span key={r.days} className="block whitespace-nowrap">
												{r.days} {r.time}
											</span>
										))}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Sheet>
		</>
	);
}
