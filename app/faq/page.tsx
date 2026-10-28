import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';
import { PageHeader } from '@/components/site/page-header';
import { FaqList } from '@/components/site/faq-list';
import { Sheet } from '@/components/ui/sheet';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'FAQ', description: 'Answers about booking desks and rooms at Gable: memberships, guests, changes, VAT, accessibility.' };

const MORE = [
	{ q: 'How far ahead can I book?', a: 'Up to three weeks ahead for every space. Teams who need longer can ask us for a block booking.' },
	{ q: 'What if I need the room for longer on the day?', a: 'Extend from your account if the room is free after you, or ask reception. The extra time is added to the same booking.' },
	{ q: 'Do I pay now or at the house?', a: 'You choose at checkout where the house offers both. Company accounts can pay on the monthly invoice.' },
	{ q: 'Can I get a receipt with my company name?', a: 'Yes. Add the company at checkout and it appears on the confirmation and the receipt.' },
];

export default function FaqPage() {
	const all = [...siteConfig.faq, ...MORE];
	return (
		<>
			<PageHeader number="GA-600" strip="Questions" note={`${all.length} answers`} title="Questions, answered." lead="If yours isn’t here, call any house or write to us. A person answers." />
			<Sheet number="GA-601" title="Booking and visiting">
				<div className="grid gap-10 lg:grid-cols-12">
					<div className="flex flex-col gap-4 lg:col-span-4">
						<p className="t-lead">Still stuck?</p>
						<div className="flex flex-wrap gap-3">
							<ButtonLink href="/contact" variant="outline">
								Contact
							</ButtonLink>
							<ButtonLink href="/book">Plan your day</ButtonLink>
						</div>
					</div>
					<FaqList items={all} className="lg:col-span-8" />
				</div>
			</Sheet>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'FAQPage',
						mainEntity: all.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
					}),
				}}
			/>
		</>
	);
}
