import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalogue } from '@/lib/server-data';
import { siteConfig } from '@/lib/site-config';
import { PageHeader } from '@/components/site/page-header';
import { EnquiryForm } from '@/components/site/enquiry-form';
import { Sheet } from '@/components/ui/sheet';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Contact', description: 'Call any Gable house or write to us.' };

export default async function ContactPage() {
	const cat = await getCatalogue();
	const houses = cat.houses.filter((h) => h.spaceCount);
	return (
		<>
			<PageHeader
				number="GA-700"
				strip="Contact"
				title="Talk to a house."
				lead="Every house has its own team at reception during opening hours. For anything else — teams, events, press — write to us."
				aside={
					<div className="flex h-full flex-col justify-center gap-5 bg-ink p-6 text-paper sm:p-10">
						<p className="t-label text-paper/60">Head office</p>
						<p className="whitespace-pre-line font-display text-2xl font-semibold leading-tight">{siteConfig.contact.address}</p>
						<p className="t-num">
							<a href={`mailto:${siteConfig.contact.email}`} className="hover:text-marigold">
								{siteConfig.contact.email}
							</a>
							<br />
							<a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="hover:text-marigold">
								{siteConfig.contact.phone}
							</a>
						</p>
					</div>
				}
			/>
			<Sheet number="GA-701" title="Houses" note="Reception, opening hours">
				<ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
					{houses.map((h, i) => (
						<li key={h.id} className="flex flex-col gap-2 border-b border-r border-ink bg-sheet p-5">
							<span className="t-label text-faint">H-0{i + 1}</span>
							<Link href={`/houses/${h.slug}`} className="t-h3 hover:text-cobalt">
								{h.short}
							</Link>
							<p className="text-[0.875rem] text-mute">{h.address ?? h.neighbourhood}</p>
							{h.presentation?.phone ? (
								<a href={`tel:${h.presentation.phone.replace(/\s/g, '')}`} className="t-num hover:text-cobalt">
									{h.presentation.phone}
								</a>
							) : null}
							<p className="t-num mt-auto text-[0.75rem] text-mute">{(h.presentation?.hours ?? []).map((r) => `${r.days} ${r.time}`).join(' · ')}</p>
						</li>
					))}
				</ul>
			</Sheet>
			<Sheet number="GA-702" title="Write to us" tone="sheet">
				<div className="grid gap-10 lg:grid-cols-12">
					<h2 className="t-h2 lg:col-span-4">Send a message.</h2>
					<div className="lg:col-span-8">
						<EnquiryForm
							to={siteConfig.contact.email}
							subject="Message from the website"
							fields={[
								{ name: 'name', label: 'Name', required: true, half: true },
								{ name: 'email', label: 'Email', type: 'email', required: true, half: true },
								{ name: 'topic', label: 'About', type: 'select', options: ['A booking', 'Teams', 'Events', 'Press', 'Something else'], half: true },
								{ name: 'house', label: 'House', type: 'select', options: [...houses.map((h) => h.short), 'Not sure'], half: true },
								{ name: 'message', label: 'Message', type: 'textarea', required: true },
							]}
						/>
					</div>
				</div>
			</Sheet>
		</>
	);
}
