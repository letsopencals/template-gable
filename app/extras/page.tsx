import type { Metadata } from 'next';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { existingImage } from '@/lib/media';
import { formatMoney } from '@/lib/money';
import { extraGroups, kindByKey } from '@/lib/site-config';
import type { Extra } from '@/lib/workspace';
import { PageHeader } from '@/components/site/page-header';
import { ruleOf } from '@/components/site/extras-list';
import { Sheet } from '@/components/ui/sheet';
import { Figure } from '@/components/ui/figure';
import { ButtonLink } from '@/components/ui/button';

export const revalidate = 300;
export const metadata: Metadata = {
	title: 'Extras',
	description: 'Coffee and lunch for the room, video kit, parking, lockers, a guest pass, studio engineers and more — added to any Gable booking.',
};

export default async function ExtrasPage() {
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const currency = settings?.currency ?? 'EUR';
	const houseName = Object.fromEntries(cat.houses.map((h) => [h.id, h.short]));
	const known = new Set(extraGroups.flatMap((g) => g.slugs));
	const groups = [
		...extraGroups.map((g) => ({ ...g, items: g.slugs.map((s) => cat.extras.find((e) => e.slug === s)).filter((e): e is Extra => !!e) })),
		{ key: 'more', label: 'More', blurb: 'Everything else the houses can add.', slugs: [], items: cat.extras.filter((e) => !known.has(e.slug)) },
	].filter((g) => g.items.length);

	const kindsFor = (e: Extra) => [...new Set(cat.spaces.filter((s) => e.spaceIds.includes(s.id)).map((s) => s.kind))].map((k) => kindByKey(k).plural.toLowerCase());

	return (
		<>
			<PageHeader
				number="GA-400"
				strip="Extras"
				note={`${cat.extras.length} extras`}
				title="The things that make a booking work."
				lead="Pick extras while you book, or add them later from your account. Prices include VAT; per-person extras scale with your headcount, kit for the room scales with the length of the booking."
				image={existingImage('/images/addons/coffee-pastries.jpg')}
				imageAlt="Coffee and pastries set up in a meeting room"
				caption="Coffee & pastries · set up before you arrive"
			>
				<nav aria-label="Extras groups" className="flex flex-wrap gap-2">
					{groups.map((g) => (
						<a key={g.key} href={`#x-${g.key}`} className="t-label border border-ink px-3 py-2 font-semibold hover:bg-ink hover:text-paper">
							{g.label}
						</a>
					))}
				</nav>
			</PageHeader>

			{groups.map((g, gi) => (
				<Sheet key={g.key} number={`GA-40${gi + 1}`} title={g.label} note={`${g.items.length} extras`} tone={gi % 2 ? 'sheet' : 'paper'} id={`x-${g.key}`}>
					<div className="mb-8 grid gap-4 lg:grid-cols-12 lg:items-end">
						<h2 className="t-h2 lg:col-span-6">{g.label}</h2>
						<p className="t-lead lg:col-span-6">{g.blurb}</p>
					</div>
					<ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
						{g.items.map((e) => {
							const where = e.houseIds.length && e.houseIds.length < cat.houses.length ? e.houseIds.map((id) => houseName[id]).filter(Boolean).join(', ') : null;
							const ks = kindsFor(e);
							return (
								<li key={e.id} className="flex flex-col border-b border-r border-ink bg-sheet">
									<Figure src={existingImage(`/images/addons/${e.slug}.jpg`) ?? e.image} alt={e.title} className="aspect-[4/3] border-b border-ink" />
									<div className="flex flex-1 flex-col gap-2 p-4">
										<h3 className="font-display text-[1.125rem] font-semibold leading-tight">{e.title}</h3>
										<p className="flex-1 text-[0.875rem] text-mute">{e.description}</p>
										<p className="t-label text-faint">{where ? `Only at ${where}` : ks.length ? `With ${ks.join(', ')}` : 'Every house'}</p>
										<p className="t-num flex items-baseline justify-between border-t border-line pt-2">
											<span className="text-[1.125rem] font-medium">{formatMoney(e.price, currency)}</span>
											<span className="text-[0.6875rem] text-mute">{ruleOf(e)}</span>
										</p>
									</div>
								</li>
							);
						})}
					</ul>
				</Sheet>
			))}

			<Sheet number="GA-409" title="Book" tone="cobalt">
				<div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
					<h2 className="t-h1 max-w-2xl">Extras are added to a space, on the same booking.</h2>
					<ButtonLink href="/book" variant="marigold" size="lg">
						Start a day sheet
					</ButtonLink>
				</div>
			</Sheet>
		</>
	);
}
