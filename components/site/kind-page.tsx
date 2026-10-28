import Link from 'next/link';
import { PageHeader } from '@/components/site/page-header';
import { SpaceGroupRow, SpaceRows } from '@/components/site/space-rows';
import { Sheet } from '@/components/ui/sheet';
import { ButtonLink } from '@/components/ui/button';
import { PlanIcon } from '@/components/ui/plan-icon';
import { TitleBlock } from '@/components/ui/title-block';
import { DimInline } from '@/components/ui/dimension-line';
import { existingImage } from '@/lib/media';
import { formatMoney } from '@/lib/money';
import { kindByKey, siteConfig, type KindKey } from '@/lib/site-config';
import { cheapest, spaceCard } from '@/lib/site-data';
import { formatLength, unitLabel, type Catalogue } from '@/lib/workspace';
import { getCatalogue, getStoreSettings } from '@/lib/server-data';

/**
 * A kind page (/desks, /meeting-rooms, /studios, /events, /day-offices): the header for the first kind, then one
 * sheet per kind with what's included (title block), lengths and price, and every space of that kind grouped by
 * house. Everything listed comes from the store; the copy comes from site-config `kinds`.
 */
export async function KindPage({ number, keys, title, lead }: { number: string; keys: KindKey[]; title: string; lead: string }) {
	const [cat, settings] = await Promise.all([getCatalogue(), getStoreSettings()]);
	const currency = settings?.currency ?? 'EUR';
	const first = kindByKey(keys[0]!);
	const total = cat.spaces.filter((s) => keys.includes(s.kind)).length;

	return (
		<>
			<PageHeader
				number={`${first.sheet}-100`}
				strip={keys.map((k) => kindByKey(k).plural).join(' & ')}
				note={`${total} spaces`}
				title={title}
				lead={lead}
				image={existingImage(first.image)}
				imageAlt={first.plural}
				fallbackKind={first.key}
				caption={first.plural}
			>
				<div className="flex flex-wrap gap-3">
					<ButtonLink href={`/book?kind=${first.key}`} size="lg">
						Find a {first.label.toLowerCase()}
					</ButtonLink>
					{keys.length > 1 ? (
						<ButtonLink href={`#${keys[1]}`} variant="outline" size="lg">
							{kindByKey(keys[1]!).plural} ↓
						</ButtonLink>
					) : null}
				</div>
			</PageHeader>

			{keys.map((k, i) => (
				<KindSheet key={k} number={`${number}-${String(i + 1).padStart(2, '0')}`} kind={k} cat={cat} currency={currency} tone={i % 2 ? 'sheet' : 'paper'} />
			))}

			<Sheet number={`${number}-90`} title="Questions" tone="sheet">
				<div className="grid gap-8 lg:grid-cols-12">
					<h2 className="t-h2 lg:col-span-4">Still deciding?</h2>
					<div className="flex flex-col gap-4 lg:col-span-8">
						<p className="t-lead">
							Compare every space side by side in the catalogue, or read how pricing works. Anything else: {siteConfig.contact.phone}.
						</p>
						<div className="flex flex-wrap gap-3">
							<ButtonLink href="/spaces" variant="outline">
								All spaces
							</ButtonLink>
							<ButtonLink href="/pricing" variant="outline">
								Pricing
							</ButtonLink>
							<ButtonLink href="/faq" variant="ghost">
								FAQ →
							</ButtonLink>
						</div>
					</div>
				</div>
			</Sheet>
		</>
	);
}

function KindSheet({ number, kind, cat, currency, tone }: { number: string; kind: KindKey; cat: Catalogue; currency: string; tone: 'paper' | 'sheet' }) {
	const k = kindByKey(kind);
	const spaces = cat.spaces.filter((s) => s.kind === kind);
	const c = cheapest(spaces);
	const housesWith = cat.houses.filter((h) => spaces.some((s) => s.houseId === h.id));
	const lengths = c ? k.lengths.filter((m) => m >= c.baseMin && m <= c.maxMin) : k.lengths;

	return (
		<Sheet number={number} title={k.plural} note={`${spaces.length} spaces · ${housesWith.length} houses`} tone={tone} id={kind === 'desk' ? 'studio' : kind === 'booth' ? 'booths' : kind}>
			<div className="grid gap-10 lg:grid-cols-12">
				<div className="flex flex-col gap-6 lg:col-span-5">
					<div className="flex items-center gap-4">
						<PlanIcon kind={kind} className="h-14 w-14 text-cobalt" />
						<h2 className="t-h2">{k.plural}</h2>
					</div>
					<p className="t-lead">{k.blurb}</p>
					{c ? (
						<TitleBlock
							heading="Schedule"
							number={number}
							rows={[
								{ k: 'From', v: <span className="t-num text-[1.0625rem] font-medium">{formatMoney(c.price, currency)} / {unitLabel(c)}{c.shared ? ' per seat' : ''}</span> },
								{ k: 'Book for', v: <span className="flex flex-wrap gap-x-3 gap-y-1">{lengths.map((m) => <DimInline key={m}>{formatLength(m)}</DimInline>)}</span> },
								{ k: 'Seats', v: c.shared ? `Up to ${Math.max(...spaces.map((s) => s.seats))} on a floor` : `${Math.min(...spaces.map((s) => s.seats))}–${Math.max(...spaces.map((s) => s.seats))}` },
								{ k: 'Included', v: <ul className="list-inside list-[square] marker:text-cobalt">{k.includes.map((x) => <li key={x}>{x}</li>)}</ul> },
							]}
						/>
					) : null}
				</div>
				<div className="lg:col-span-7">
					{housesWith.map((h) => (
						<div key={h.id} className="mb-10 last:mb-0">
							<div className="mb-2 flex items-baseline justify-between gap-4">
								<h3 className="t-h3">
									<Link href={`/houses/${h.slug}`} className="hover:text-cobalt">
										{h.short}
									</Link>
								</h3>
								<span className="t-label text-mute">{h.neighbourhood}</span>
							</div>
							{kind === 'desk' || kind === 'booth' ? (
								<SpaceGroupRow spaces={spaces.filter((s) => s.houseId === h.id).map((s) => spaceCard(cat, s))} currency={currency} />
							) : (
								<SpaceRows spaces={spaces.filter((s) => s.houseId === h.id).map((s) => spaceCard(cat, s))} currency={currency} showHouse={false} />
							)}
						</div>
					))}
					{!housesWith.length ? <p className="hatch-light border border-line-strong p-8 text-center text-mute">None of these in the store yet.</p> : null}
				</div>
			</div>
		</Sheet>
	);
}
