import type { Metadata } from 'next';
import { getCatalogue } from '@/lib/server-data';
import { existingImage } from '@/lib/media';
import { siteConfig } from '@/lib/site-config';
import { PageHeader } from '@/components/site/page-header';
import { EnquiryForm } from '@/components/site/enquiry-form';
import { Sheet } from '@/components/ui/sheet';
import { ButtonLink } from '@/components/ui/button';
import { DaySheetDemo } from '@/components/home/day-sheet-demo';

export const metadata: Metadata = {
	title: 'Teams',
	description: 'Company accounts for distributed teams: one monthly invoice, team days with flex seats and rooms, offsites on the Roof Terrace or in the Long Room.',
};

export default async function TeamsPage() {
	const cat = await getCatalogue();
	const t = siteConfig.teams;
	const houses = cat.houses.filter((h) => h.spaceCount).map((h) => h.short);

	return (
		<>
			<PageHeader
				number="TM-100"
				strip="Teams · company accounts"
				note="One invoice"
				title={t.heading}
				lead={t.lead}
				image={existingImage('/images/gallery/workshop.jpg')}
				imageAlt="A team workshop in the Long Room"
				caption="The Long Room, Spanish Arch · a team offsite"
			>
				<div className="flex flex-wrap gap-3">
					<ButtonLink href="#enquire" size="lg">
						Set up a team account
					</ButtonLink>
					<ButtonLink href="/events" variant="outline" size="lg">
						Offsite spaces
					</ButtonLink>
				</div>
			</PageHeader>

			<Sheet number="TM-101" title="How it works">
				<ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
					{t.points.map((p, i) => (
						<li key={p.title} className="flex flex-col gap-3 border-b border-r border-ink bg-sheet p-6">
							<span className="t-label text-cobalt">T-0{i + 1}</span>
							<h2 className="t-h3">{p.title}</h2>
							<p className="text-[0.9375rem] text-mute">{p.body}</p>
						</li>
					))}
				</ul>
			</Sheet>

			<Sheet number="TM-102" title="A team day" note="Example" tone="cobalt">
				<div className="grid gap-12 lg:grid-cols-12 lg:items-center">
					<div className="lg:col-span-5">
						<h2 className="t-h1">Everyone lands on the same day.</h2>
						<p className="mt-5 text-[1.125rem] text-white/80">
							Book a block of seats on the open floor for the whole team, a room for the planning session and lunch for the room. Each person gets the details; the bill goes on the company invoice.
						</p>
					</div>
					<div className="lg:col-span-6 lg:col-start-7">
						<DaySheetDemo />
					</div>
				</div>
			</Sheet>

			<Sheet number="TM-103" title="Enquire" id="enquire">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="lg:col-span-4">
						<h2 className="t-h2">{t.formHeading}</h2>
						<p className="t-lead mt-4">{t.formLead}</p>
						<p className="mt-6 text-[0.9375rem]">
							Or write to{' '}
							<a href={`mailto:${siteConfig.contact.teamsEmail}`} className="text-cobalt underline underline-offset-4">
								{siteConfig.contact.teamsEmail}
							</a>
						</p>
					</div>
					<div className="lg:col-span-8">
						<EnquiryForm
							to={siteConfig.contact.teamsEmail}
							subject="Team account enquiry"
							submitLabel="Send enquiry"
							fields={[
								{ name: 'name', label: 'Your name', required: true, half: true },
								{ name: 'company', label: 'Company', required: true, half: true },
								{ name: 'email', label: 'Work email', type: 'email', required: true, half: true },
								{ name: 'phone', label: 'Phone', type: 'tel', half: true },
								{ name: 'size', label: 'Team size', type: 'select', options: ['2–5', '6–15', '16–40', '40+'], half: true },
								{ name: 'house', label: 'Main house', type: 'select', options: [...houses, 'Several'], half: true },
								{ name: 'needs', label: 'What do you need?', type: 'textarea', placeholder: 'e.g. 8 flex seats twice a week at Dock House, a room for 10 on Tuesdays, a quarterly offsite' },
							]}
						/>
					</div>
				</div>
			</Sheet>
		</>
	);
}
