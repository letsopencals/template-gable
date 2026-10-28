import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { existingImage } from '@/lib/media';
import { formatMoney } from '@/lib/money';
import { freeNowHouses, houseCards, houseImage, spaceCard } from '@/lib/site-data';
import { kinds, siteConfig } from '@/lib/site-config';
import { houseBySlug } from '@/lib/workspace';
import { PageHeader } from '@/components/site/page-header';
import { SpaceGroupRow, SpaceRows } from '@/components/site/space-rows';
import { PlanLocator } from '@/components/site/plan-locator';
import { HousesSchedule } from '@/components/site/houses-schedule';
import { FreeNowBoard } from '@/components/home/free-now';
import { Sheet } from '@/components/ui/sheet';
import { ButtonLink } from '@/components/ui/button';
import { TitleBlock } from '@/components/ui/title-block';
import { Figure } from '@/components/ui/figure';
import { Tag } from '@/components/ui/chip';
import { PlanIcon } from '@/components/ui/plan-icon';

export const revalidate = 300;

export async function generateStaticParams() {
	const cat = await getCatalogue();
	return cat.houses.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const h = houseBySlug(await getCatalogue(), slug);
	if (!h) return { title: 'House not found' };
	return { title: `${h.short} · ${h.neighbourhood}`, description: h.presentation?.line ?? h.description ?? undefined };
}

export default async function HousePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const house = houseBySlug(cat, slug);
	if (!house) notFound();
	const currency = settings?.currency ?? 'EUR';
	const p = house.presentation;
	const index = cat.houses.findIndex((h) => h.id === house.id) + 1;
	const spaces = cat.spaces.filter((s) => s.houseId === house.id);
	const others = houseCards(cat).filter((c) => c.id !== house.id).slice(0, 3);
	const live = freeNowHouses(cat).filter((h) => h.id === house.id);
	const gallery = (p?.gallery ?? []).map((g) => existingImage(g)).filter((g): g is string => !!g);
	const extrasHere = cat.extras.filter((e) => e.houseIds.includes(house.id) && e.houseIds.length < cat.houses.length);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CoworkingSpace',
		name: `${siteConfig.name} ${house.short}`,
		description: p?.story ?? house.description,
		url: `${siteConfig.url}/houses/${house.slug}`,
		telephone: p?.phone,
		address: { '@type': 'PostalAddress', streetAddress: house.address, addressLocality: house.city, addressCountry: 'IE' },
		geo: house.lat != null && house.lng != null ? { '@type': 'GeoCoordinates', latitude: house.lat, longitude: house.lng } : undefined,
		amenityFeature: (p?.amenities ?? []).map((a) => ({ '@type': 'LocationFeatureSpecification', name: a, value: true })),
	};

	return (
		<>
			<PageHeader
				number={`H-0${index}`}
				strip={`${house.title} · ${house.neighbourhood}`}
				note={`${spaces.length} spaces`}
				title={house.short}
				lead={p?.story ?? house.description}
				image={houseImage(house)}
				imageAlt={house.title}
				caption={p?.line}
			>
				<div className="flex flex-wrap gap-3">
					<ButtonLink href={`/book?house=${house.slug}`} size="lg">
						Plan a day here
					</ButtonLink>
					{house.lat != null && house.lng != null ? (
						<ButtonLink href={`https://www.google.com/maps/search/?api=1&query=${house.lat},${house.lng}`} variant="outline" size="lg" target="_blank" rel="noreferrer">
							Directions ↗
						</ButtonLink>
					) : null}
				</div>
			</PageHeader>

			<Sheet number={`H-0${index}-01`} title="Live" note="Updated every minute">
				<FreeNowBoard houses={live} />
			</Sheet>

			<Sheet number={`H-0${index}-02`} title="Spaces in this house" note={`${house.kinds.length} kinds of space`} tone="sheet" id="spaces">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<div className="lg:sticky lg:top-32">
							<h2 className="t-h2">Plan</h2>
							<p className="mt-2 text-[0.9375rem] text-mute">Schematic, not to scale: meeting rooms on the north side, the open floor, studio desks and booths by the east wall.</p>
							<div className="mt-5 border border-ink bg-paper p-3">
								<PlanLocator spaces={spaces.map((s) => ({ id: s.id, kind: s.kind, name: s.name, seats: s.seats }))} label={`Plan of ${house.short}`} />
							</div>
							<nav aria-label="Kinds in this house" className="mt-5 flex flex-col border-t border-ink">
								{house.kinds.map((k) => {
									const kc = kinds.find((x) => x.key === k)!;
									return (
										<a key={k} href={`#k-${k}`} className="flex items-center gap-3 border-b border-line-strong py-2.5 hover:text-cobalt">
											<PlanIcon kind={k} className="h-6 w-6 text-cobalt" />
											<span className="flex-1 font-medium">{kc.plural}</span>
											<span className="t-num text-[0.8125rem] text-mute">{spaces.filter((s) => s.kind === k).length}</span>
										</a>
									);
								})}
							</nav>
						</div>
					</div>
					<div className="flex flex-col gap-12 lg:col-span-8">
						{house.kinds.map((k) => {
							const kc = kinds.find((x) => x.key === k)!;
							return (
								<div key={k} id={`k-${k}`} className="scroll-mt-32">
									<div className="mb-2 flex items-baseline justify-between gap-4">
										<h3 className="t-h3">{kc.plural}</h3>
										<Link href={`/book?house=${house.slug}&kind=${k}`} className="t-label font-semibold text-cobalt hover:underline">
											Find a time →
										</Link>
									</div>
									{k === 'desk' || k === 'booth' ? (
										<SpaceGroupRow spaces={spaces.filter((s) => s.kind === k).map((s) => spaceCard(cat, s))} currency={currency} />
									) : (
										<SpaceRows spaces={spaces.filter((s) => s.kind === k).map((s) => spaceCard(cat, s))} currency={currency} showHouse={false} />
									)}
								</div>
							);
						})}
					</div>
				</div>
			</Sheet>

			<Sheet number={`H-0${index}-03`} title="Visiting" note={house.neighbourhood}>
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-5">
						<TitleBlock
							heading={`Gable ${house.short}`}
							number={`H-0${index}`}
							rows={[
								{ k: 'Address', v: house.address ?? house.neighbourhood },
								{
									k: 'Hours',
									v: (
										<span className="t-num text-[0.8125rem]">
											{(p?.hours ?? []).map((r) => (
												<span key={r.days} className="block">
													{r.days} {r.time}
												</span>
											))}
											<span className="block text-mute">Sun closed</span>
										</span>
									),
								},
								...(p?.phone ? [{ k: 'Phone', v: <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="t-num hover:text-cobalt">{p.phone}</a> }] : []),
								...(p?.arrival ? [{ k: 'Arriving', v: p.arrival }] : []),
								...(p?.wifi ? [{ k: 'Wi-Fi', v: p.wifi }] : []),
							]}
						/>
					</div>
					<div className="flex flex-col gap-8 lg:col-span-7">
						{p?.gettingThere?.length ? (
							<div>
								<h3 className="t-h3 mb-3">Getting there</h3>
								<ul className="border-t border-ink">
									{p.gettingThere.map((g, i) => (
										<li key={g} className="flex gap-4 border-b border-line-strong py-2.5">
											<span className="t-label pt-1 text-faint">R{i + 1}</span>
											<span>{g}</span>
										</li>
									))}
								</ul>
							</div>
						) : null}
						{p?.amenities?.length ? (
							<div>
								<h3 className="t-h3 mb-3">In the house</h3>
								<div className="flex flex-wrap gap-1.5">
									{p.amenities.map((a) => (
										<Tag key={a} tone="cobalt">
											{a}
										</Tag>
									))}
								</div>
							</div>
						) : null}
						{extrasHere.length ? (
							<div>
								<h3 className="t-h3 mb-3">Only here</h3>
								<ul className="border-t border-ink">
									{extrasHere.map((e) => (
										<li key={e.id} className="flex justify-between gap-4 border-b border-line-strong py-2.5">
											<span>{e.title}</span>
											<span className="t-num text-mute">{formatMoney(e.price, currency)}</span>
										</li>
									))}
								</ul>
							</div>
						) : null}
					</div>
				</div>
				{gallery.length ? (
					<div className="mt-12 grid gap-px border border-ink bg-ink sm:grid-cols-2">
						{gallery.map((g, i) => (
							<Figure key={g} src={g} alt={`${house.short}, view ${i + 1}`} caption={`${house.short} · ${String(i + 1).padStart(2, '0')}`} className="aspect-[3/2]" />
						))}
					</div>
				) : null}
			</Sheet>

			{others.length ? (
				<Sheet number={`H-0${index}-04`} title="Other houses" tone="sheet">
					<h2 className="t-h2 mb-8">Same booking, other houses.</h2>
					<HousesSchedule houses={others} />
				</Sheet>
			) : null}

			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
		</>
	);
}
