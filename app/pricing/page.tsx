import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { formatMoney } from '@/lib/money';
import { kindSummaries } from '@/lib/site-data';
import { kinds, siteConfig } from '@/lib/site-config';
import { formatLength, lengthsFor, priceFor, unitLabel } from '@/lib/workspace';
import { PageHeader } from '@/components/site/page-header';
import { KindsSchedule } from '@/components/site/kinds-schedule';
import { DayCostBuilder } from '@/components/site/day-cost-builder';
import { FaqList } from '@/components/site/faq-list';
import { Sheet } from '@/components/ui/sheet';
import { PlanIcon } from '@/components/ui/plan-icon';

export const revalidate = 300;
export const metadata: Metadata = {
	title: 'Pricing',
	description: 'Pay for the time you book: flex desks from a half day, meeting rooms by the half hour, studios by the hour. No membership, VAT included.',
};

export default async function PricingPage() {
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const currency = settings?.currency ?? 'EUR';
	const houses = cat.houses.filter((h) => h.spaceCount);

	return (
		<>
			<PageHeader
				number="GA-500"
				strip="Pricing"
				note="VAT included"
				title={siteConfig.pricingSection.heading}
				lead={siteConfig.pricingSection.lead}
				aside={
					<div className="flex h-full flex-col justify-center gap-0 bg-cobalt p-6 text-white sm:p-10">
						{[
							['No membership', 'Book what you need, when you need it.'],
							['No deposit', 'Pay at checkout or at the house.'],
							['Change it', 'Move or cancel from your account.'],
							['One invoice', 'Company accounts for teams.'],
						].map(([t, b], i) => (
							<div key={t} className="flex gap-4 border-b border-white/30 py-4 last:border-b-0">
								<span className="t-label pt-1 text-marigold">0{i + 1}</span>
								<div>
									<p className="font-display text-xl font-semibold">{t}</p>
									<p className="text-white/75">{b}</p>
								</div>
							</div>
						))}
					</div>
				}
			/>

			<Sheet number="GA-501" title="Price schedule" note="From-prices per kind">
				<KindsSchedule summaries={kindSummaries(cat)} currency={currency} />
			</Sheet>

			<Sheet number="GA-502" title="By house" note="Lowest price per length" tone="sheet">
				<h2 className="t-h2 mb-8">Prices by house.</h2>
				<div className="overflow-x-auto border border-ink">
					<table className="w-full min-w-[820px] border-collapse text-left">
						<thead>
							<tr className="border-b border-ink">
								<th className="t-label px-4 py-3 font-medium text-mute">Kind</th>
								<th className="t-label border-l border-line-strong px-4 py-3 font-medium text-mute">Unit</th>
								{houses.map((h) => (
									<th key={h.id} className="t-label border-l border-line-strong px-3 py-3 text-right font-medium text-mute">
										{h.short}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{kinds.map((k) => {
								const all = cat.spaces.filter((s) => s.kind === k.key);
								if (!all.length) return null;
								const any = all[0]!;
								return (
									<tr key={k.key} className="border-b border-line-strong last:border-b-0">
										<td className="px-4 py-3">
											<Link href={k.href} className="flex items-center gap-3 font-medium hover:text-cobalt">
												<PlanIcon kind={k.key} className="h-6 w-6 text-cobalt" />
												{k.plural}
											</Link>
										</td>
										<td className="t-num border-l border-line-strong px-4 py-3 text-[0.8125rem] text-mute">
											{unitLabel(any)}
											{any.shared ? ' · seat' : ''}
										</td>
										{houses.map((h) => {
											const here = all.filter((s) => s.houseId === h.id).map((s) => s.price);
											return (
												<td key={h.id} className={`t-num border-l border-line-strong px-3 py-3 text-right ${here.length ? '' : 'hatch-light text-faint'}`}>
													{here.length ? (Math.min(...here) === Math.max(...here) ? formatMoney(here[0]!, currency) : `${formatMoney(Math.min(...here), currency)}–${formatMoney(Math.max(...here), currency)}`) : '—'}
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<div className="mt-10 grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
					{kinds.map((k) => {
						const s = cat.spaces.filter((x) => x.kind === k.key).sort((a, b) => a.price - b.price)[0];
						if (!s) return null;
						return (
							<div key={k.key} className="border-b border-r border-ink bg-sheet p-5">
								<p className="t-label mb-3 flex items-center gap-2 text-mute">
									<PlanIcon kind={k.key} className="h-5 w-5 text-cobalt" />
									{k.label}
								</p>
								<ul className="t-num text-[0.875rem]">
									{lengthsFor(s, k.lengths).map((m) => (
										<li key={m} className="flex justify-between border-b border-line py-1.5 last:border-b-0">
											<span className="font-sans">{formatLength(m)}</span>
											<span>{formatMoney(priceFor(s, m), currency)}</span>
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			</Sheet>

			<Sheet number="GA-503" title="What a day costs" note="Worked example">
				<h2 className="t-h2 mb-3">Price a whole day.</h2>
				<p className="t-lead mb-8 max-w-2xl">Change the team, the house and the plan. The figures are the store’s prices, worked out the way checkout does.</p>
				<DayCostBuilder
					houses={houses.map((h) => ({ id: h.id, slug: h.slug, short: h.short }))}
					spaces={cat.spaces.map((s) => ({ id: s.id, slug: s.slug, kind: s.kind, name: s.name, seats: s.seats, price: s.price, baseMin: s.baseMin, maxMin: s.maxMin, houseId: s.houseId, shared: s.shared }))}
					extras={cat.extras.map((e) => ({ id: e.id, slug: e.slug, title: e.title, price: e.price, perUnit: e.perUnit, maxQuantity: e.maxQuantity, houseIds: e.houseIds, spaceIds: e.spaceIds }))}
					currency={currency}
				/>
			</Sheet>

			<Sheet number="GA-504" title="Pricing questions" tone="sheet">
				<div className="grid gap-10 lg:grid-cols-12">
					<h2 className="t-h2 lg:col-span-4">Good to know.</h2>
					<FaqList
						className="lg:col-span-8"
						items={[
							siteConfig.faq[0]!,
							siteConfig.faq[5]!,
							{ q: 'How is a longer booking priced?', a: 'In the space’s own steps: a room booked for 90 minutes is three half hours; a flex desk for a full day is two half days. You see the exact figure before you pay.' },
							{ q: 'Is there a discount for teams?', a: 'Company accounts get one monthly invoice and can use team codes on meeting rooms. Talk to us on the Teams page.' },
						]}
					/>
				</div>
			</Sheet>
		</>
	);
}
