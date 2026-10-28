import type { Metadata } from 'next';
import { existingImage } from '@/lib/media';
import { siteConfig } from '@/lib/site-config';
import { getCatalogue } from '@/lib/server-data';
import { houseCards } from '@/lib/site-data';
import { PageHeader } from '@/components/site/page-header';
import { HousesSchedule } from '@/components/site/houses-schedule';
import { Sheet } from '@/components/ui/sheet';
import { Figure } from '@/components/ui/figure';

export const revalidate = 300;
export const metadata: Metadata = { title: 'About', description: siteConfig.about.lead };

export default async function AboutPage() {
	const a = siteConfig.about;
	const cat = await getCatalogue();
	const photos = [
		{ src: existingImage('/images/gallery/coffee-bar.jpg'), caption: 'The coffee bar, Dock House' },
		{ src: existingImage('/images/gallery/working.jpg'), caption: 'Level 4, Dock House' },
		{ src: existingImage('/images/gallery/booth.jpg'), caption: 'A booth on the landing' },
	];

	return (
		<>
			<PageHeader
				number="AB-100"
				strip="About Gable"
				note="Since 2017"
				title={a.heading}
				lead={a.lead}
				image={existingImage('/images/houses/dock-house.jpg')}
				imageAlt="Dock House on Grand Canal Dock"
				caption="Dock House · built 1820 as a grain store"
			/>

			<Sheet number="AB-101" title="Notes">
				<div className="grid gap-10 lg:grid-cols-12">
					<dl className="grid grid-cols-2 border-l border-t border-ink lg:col-span-4">
						{a.figures.map((f) => (
							<div key={f.label} className="flex flex-col gap-1 border-b border-r border-ink bg-sheet p-5">
								<dt className="t-label order-2 text-mute">{f.label}</dt>
								<dd className="t-num order-1 text-4xl font-medium">{f.value}</dd>
							</div>
						))}
					</dl>
					<div className="flex flex-col gap-5 text-[1.125rem] leading-relaxed lg:col-span-7 lg:col-start-6">
						{a.body.map((p) => (
							<p key={p}>{p}</p>
						))}
					</div>
				</div>
			</Sheet>

			<section className="bg-paper">
				<div className="mx-auto grid max-w-[1360px] gap-px border-y border-ink bg-ink sm:grid-cols-3">
					{photos.map((p) => (
						<Figure key={p.caption} src={p.src} alt={p.caption} caption={p.caption} className="aspect-[4/5]" />
					))}
				</div>
			</section>

			<Sheet number="AB-102" title="Principles" tone="sheet">
				<h2 className="t-h2 mb-8">How we run the houses.</h2>
				<ol className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
					{a.principles.map((p, i) => (
						<li key={p.title} className="flex flex-col gap-3 border-b border-r border-ink p-6">
							<span className="t-label text-cobalt">P-0{i + 1}</span>
							<h3 className="t-h3">{p.title}</h3>
							<p className="text-[0.9375rem] text-mute">{p.body}</p>
						</li>
					))}
				</ol>
			</Sheet>

			<Sheet number="AB-103" title="The houses">
				<HousesSchedule houses={houseCards(cat)} />
			</Sheet>
		</>
	);
}
