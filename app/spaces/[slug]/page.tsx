import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';
import { formatMoney } from '@/lib/money';
import { spaceCard } from '@/lib/site-data';
import { kindByKey, siteConfig } from '@/lib/site-config';
import { extrasFor, formatLength, houseOf, lengthsFor, priceFor, spaceBySlug, unitLabel } from '@/lib/workspace';
import { SpaceGallery } from '@/components/site/space-gallery';
import { PlanLocator } from '@/components/site/plan-locator';
import { SpaceRows } from '@/components/site/space-rows';
import { SpaceBookingSlot } from '@/components/site/space-booking-slot';
import { ruleOf } from '@/components/site/extras-list';
import { Sheet, SheetStrip } from '@/components/ui/sheet';
import { TitleBlock } from '@/components/ui/title-block';
import { Tag } from '@/components/ui/chip';
import { PlanIcon } from '@/components/ui/plan-icon';
import { DimensionLine } from '@/components/ui/dimension-line';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const cat = await getCatalogue();
	const s = spaceBySlug(cat, slug);
	if (!s) return { title: 'Space not found' };
	const h = houseOf(cat, s);
	return { title: `${s.name} · ${h?.short ?? ''}`, description: s.copy || `${kindByKey(s.kind).label} at Gable ${h?.short ?? ''}.` };
}

export default async function SpacePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const space = spaceBySlug(cat, slug);
	if (!space) notFound();
	const currency = settings?.currency ?? 'EUR';
	const house = houseOf(cat, space);
	const kind = kindByKey(space.kind);
	const here = cat.spaces.filter((s) => s.houseId === space.houseId);
	const lengths = lengthsFor(space, kind.lengths);
	const maxLen = Math.max(...lengths);
	const extras = extrasFor(cat, space);
	const alternatives = here.filter((s) => s.kind === space.kind && s.id !== space.id).slice(0, 4);
	const sheetNo = `${kind.sheet}-${String(cat.spaces.indexOf(space) + 1).padStart(3, '0')}`;

	return (
		<>
			<section className="bg-paper">
				<div className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-6 lg:px-10">
					<nav aria-label="Breadcrumb" className="t-label mb-3 flex flex-wrap gap-2 text-mute">
						<Link href="/spaces" className="hover:text-ink">
							Spaces
						</Link>
						<span>/</span>
						{house ? (
							<>
								<Link href={`/houses/${house.slug}`} className="hover:text-ink">
									{house.short}
								</Link>
								<span>/</span>
							</>
						) : null}
						<span className="text-ink">{space.name}</span>
					</nav>
					<div className="grid border border-ink bg-sheet lg:grid-cols-12">
						<div className="border-b border-ink lg:col-span-7 lg:border-b-0 lg:border-r">
							<SheetStrip number={sheetNo} title={`${kind.label} · ${house?.title ?? ''}`} note={space.level != null ? `Level ${space.level}` : undefined} className="border-ink" />
							<div className="p-5 sm:p-8">
								<p className="t-label flex items-center gap-2 text-cobalt">
									<PlanIcon kind={space.kind} className="h-5 w-5" />
									{kind.label}
								</p>
								<h1 className="t-h1 mt-3">{space.name}</h1>
								<p className="t-lead mt-4 max-w-2xl">{space.copy || kind.blurb}</p>
								<div className="mt-5 flex flex-wrap gap-1.5">
									<Tag tone="cobalt">{space.shared ? `${space.seats} seats on the floor` : space.seats === 1 ? 'For one' : `Seats ${space.seats}`}</Tag>
									{space.kit.map((k) => (
										<Tag key={k}>{k}</Tag>
									))}
								</div>
							</div>
							<SpaceGallery images={space.gallery} name={space.name} kind={space.kind} />
						</div>
						<div className="lg:col-span-5">
							<SpaceBookingSlot cat={cat} space={space} />
						</div>
					</div>
				</div>
			</section>

			<Sheet number={`${sheetNo}-A`} title="Room data sheet" note={house?.short}>
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-6">
						<TitleBlock
							heading={space.name}
							number={sheetNo}
							rows={[
								{ k: 'Kind', v: kind.label },
								{ k: 'House', v: house ? <Link href={`/houses/${house.slug}`} className="hover:text-cobalt">{house.title}</Link> : '—' },
								...(space.level != null ? [{ k: 'Level', v: String(space.level) }] : []),
								{ k: 'Seats', v: space.shared ? `${space.seats} on the open floor; book as many as you need` : String(space.seats) },
								...(space.allowGuests ? [{ k: 'Guests', v: `Invite up to ${space.maxGuests}; we send them the details` }] : []),
								{ k: 'Booked in', v: `${formatLength(space.baseMin)} steps, up to ${formatLength(space.maxMin)}` },
								...(space.kit.length ? [{ k: 'Kit', v: space.kit.join(', ') }] : []),
								...(space.cancelGapMin ? [{ k: 'Changes', v: `Move or cancel up to ${formatLength(space.cancelGapMin)} before` }] : [{ k: 'Changes', v: 'Move or cancel from your account' }]),
							]}
						/>
					</div>
					<div className="lg:col-span-6">
						<h2 className="t-h3 mb-4">Price by length</h2>
						<ul className="border-t border-ink">
							{lengths.map((m) => (
								<li key={m} className="grid grid-cols-12 items-center gap-3 border-b border-line-strong py-3">
									<span className="col-span-3 font-medium">{formatLength(m)}</span>
									<span className="col-span-6">
										<DimensionLine label="" fraction={m / maxLen} tone="cobalt" className="h-4" />
									</span>
									<span className="t-num col-span-3 text-right">
										{formatMoney(priceFor(space, m), currency)}
										{space.shared ? <span className="text-[0.75rem] text-mute"> /seat</span> : null}
									</span>
								</li>
							))}
						</ul>
						<p className="mt-3 text-[0.8125rem] text-mute">
							{formatMoney(space.price, currency)} per {unitLabel(space)}
							{space.shared ? ' per seat' : ''}, VAT included.
						</p>
					</div>
				</div>
			</Sheet>

			<Sheet number={`${sheetNo}-B`} title="Where it is" note="Schematic plan" tone="sheet">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="border border-ink bg-paper p-4 lg:col-span-7">
						<PlanLocator spaces={here.map((s) => ({ id: s.id, kind: s.kind, name: s.name, seats: s.seats }))} highlightId={space.id} route label={`${space.name} on the plan of ${house?.short}`} />
					</div>
					<div className="flex flex-col gap-4 lg:col-span-5">
						<h2 className="t-h2">From the front door.</h2>
						<p className="text-mute">{house?.presentation?.arrival ?? 'Say your name at reception and we’ll show you the way.'}</p>
						{house?.presentation?.gettingThere?.length ? (
							<ul className="border-t border-ink text-[0.9375rem]">
								{house.presentation.gettingThere.slice(0, 3).map((g) => (
									<li key={g} className="border-b border-line-strong py-2">
										{g}
									</li>
								))}
							</ul>
						) : null}
					</div>
				</div>
			</Sheet>

			{extras.length ? (
				<Sheet number={`${sheetNo}-C`} title="Extras for this space" note={`${extras.length} extras`}>
					<h2 className="t-h2 mb-8">Add it while you book.</h2>
					<ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
						{extras.map((e) => (
							<li key={e.id} className="flex flex-col gap-2 border-b border-r border-ink bg-sheet p-5">
								<p className="font-semibold">{e.title}</p>
								<p className="flex-1 text-[0.8125rem] text-mute">{e.description}</p>
								<p className="t-num">
									{formatMoney(e.price, currency)} <span className="text-[0.75rem] text-mute">{ruleOf(e)}</span>
								</p>
							</li>
						))}
					</ul>
				</Sheet>
			) : null}

			{alternatives.length ? (
				<Sheet number={`${sheetNo}-D`} title="Also at this house" tone="sheet">
					<h2 className="t-h2 mb-8">Other {kind.plural.toLowerCase()} at {house?.short}.</h2>
					<SpaceRows spaces={alternatives.map((s) => spaceCard(cat, s))} currency={currency} showHouse={false} />
				</Sheet>
			) : null}

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'Product',
						name: `${space.name} · ${house?.short ?? ''}`,
						description: space.copy,
						image: space.image ?? undefined,
						brand: { '@type': 'Brand', name: siteConfig.name },
						offers: { '@type': 'Offer', price: space.price, priceCurrency: currency, availability: 'https://schema.org/InStock' },
					}),
				}}
			/>
		</>
	);
}
