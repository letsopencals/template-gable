import Link from 'next/link';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { existingImage } from '@/lib/media';
import { freeNowHouses, houseCards, kindSummaries } from '@/lib/site-data';
import { siteConfig } from '@/lib/site-config';
import { Hero } from '@/components/home/hero';
import { QueryBar } from '@/components/home/query-bar';
import { FreeNowBoard } from '@/components/home/free-now';
import { DaySheetDemo } from '@/components/home/day-sheet-demo';
import { HousesSchedule } from '@/components/site/houses-schedule';
import { KindsSchedule } from '@/components/site/kinds-schedule';
import { ExtrasList } from '@/components/site/extras-list';
import { Voices } from '@/components/site/voices';
import { FaqList } from '@/components/site/faq-list';
import { Sheet, SheetHeading } from '@/components/ui/sheet';
import { ButtonLink } from '@/components/ui/button';

export const revalidate = 300;

export default async function HomePage() {
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const currency = settings?.currency ?? 'EUR';
	const tz = settings?.settings?.timezone ?? 'Europe/Dublin';
	const cards = houseCards(cat);
	const queryHouses = cat.houses.filter((h) => h.spaceCount).map((h) => ({ id: h.id, slug: h.slug, short: h.short, kinds: h.kinds }));
	const ds = siteConfig.daySection;

	return (
		<>
			<Hero
				poster={existingImage(siteConfig.hero.poster)}
				video={existingImage(siteConfig.hero.video)}
				houseCount={cards.length}
				spaceCount={cat.spaces.length}
			/>

			{/* The query sits directly under the hero, on the same frame */}
			<section className="bg-paper">
				<div className="mx-auto max-w-[1360px] px-4 pt-8 sm:px-6 lg:px-10">
					<h2 className="t-label mb-3 text-mute">{siteConfig.query.heading}</h2>
					<QueryBar houses={queryHouses} tz={tz} />
				</div>
			</section>

			<Sheet number="GA-002" title={siteConfig.freeNow.heading} note="Live · every house" id="free-now">
				<SheetHeading title={siteConfig.freeNow.heading} lead={siteConfig.freeNow.lead} className="mb-8" />
				<FreeNowBoard houses={freeNowHouses(cat)} />
			</Sheet>

			<Sheet number="GA-003" title="Houses" note={`${cards.length} houses · 3 cities`} tone="sheet" id="houses">
				<SheetHeading
					title={siteConfig.housesSection.heading}
					lead={siteConfig.housesSection.lead}
					aside={
						<Link href="/houses" className="t-label self-start border-b border-ink pb-0.5 font-semibold hover:text-cobalt">
							Compare all houses →
						</Link>
					}
					className="mb-10"
				/>
				<HousesSchedule houses={cards} />
			</Sheet>

			<Sheet number="GA-004" title="Spaces" note={`${cat.spaces.length} bookable spaces`} id="spaces">
				<SheetHeading title={siteConfig.kindsSection.heading} lead={siteConfig.kindsSection.lead} className="mb-10" />
				<KindsSchedule summaries={kindSummaries(cat)} currency={currency} />
			</Sheet>

			<Sheet number="GA-005" title="The day sheet" note="One booking · one payment" tone="cobalt" id="day-sheet">
				<div className="grid gap-12 lg:grid-cols-12 lg:items-center">
					<div className="lg:col-span-5">
						<h2 className="t-h1">{ds.heading}</h2>
						<p className="mt-5 text-[1.125rem] text-white/80">{ds.lead}</p>
						<ol className="mt-8 border-t border-white/30">
							{['Pick a house, a day and what you need', 'Add rooms, desks and booths to one day sheet', 'Add lunch, kit or a guest to any of them', 'Pay once; change any part later'].map((s, i) => (
								<li key={s} className="flex gap-4 border-b border-white/30 py-3">
									<span className="t-label pt-0.5 text-marigold">0{i + 1}</span>
									<span>{s}</span>
								</li>
							))}
						</ol>
						<ButtonLink href="/book" variant="marigold" size="lg" className="mt-8">
							Start your day sheet
						</ButtonLink>
					</div>
					<div className="lg:col-span-6 lg:col-start-7">
						<DaySheetDemo />
					</div>
				</div>
			</Sheet>

			<Sheet number="GA-006" title="Extras" note={`${cat.extras.length} extras`} id="extras">
				<SheetHeading
					title={siteConfig.extrasSection.heading}
					lead={siteConfig.extrasSection.lead}
					aside={
						<Link href="/extras" className="t-label self-start border-b border-ink pb-0.5 font-semibold hover:text-cobalt">
							Every extra →
						</Link>
					}
					className="mb-10"
				/>
				<ExtrasList extras={cat.extras} currency={currency} limitPerGroup={3} />
			</Sheet>

			<Sheet number="GA-007" title="Teams" note="Company accounts" tone="ink" id="teams">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<h2 className="t-h1">{siteConfig.teams.heading}</h2>
						<p className="mt-5 text-[1.125rem] text-paper/75">{siteConfig.teams.lead}</p>
						<ButtonLink href="/teams" variant="marigold" size="lg" className="mt-8">
							Set up a team account
						</ButtonLink>
					</div>
					<ul className="grid border-l border-t border-white/25 sm:grid-cols-2 lg:col-span-7">
						{siteConfig.teams.points.map((p, i) => (
							<li key={p.title} className="border-b border-r border-white/25 p-6">
								<span className="t-label text-marigold">T-0{i + 1}</span>
								<h3 className="t-h3 mt-3">{p.title}</h3>
								<p className="mt-2 text-[0.9375rem] text-paper/70">{p.body}</p>
							</li>
						))}
					</ul>
				</div>
			</Sheet>

			<Sheet number="GA-008" title="Notes from the houses" note="Members, in their words" tone="sheet">
				<Voices />
			</Sheet>

			<Sheet number="GA-009" title="Questions" note={`${siteConfig.faq.length} answers`} id="faq">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<h2 className="t-h2">Before you book.</h2>
						<p className="t-lead mt-4">Anything else, ask the house team: {siteConfig.contact.phone}.</p>
						<Link href="/faq" className="t-label mt-6 inline-block border-b border-ink pb-0.5 font-semibold hover:text-cobalt">
							All questions →
						</Link>
					</div>
					<FaqList items={siteConfig.faq.slice(0, 6)} className="lg:col-span-8" />
				</div>
			</Sheet>
		</>
	);
}
