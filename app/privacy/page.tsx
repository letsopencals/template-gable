import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Privacy', description: `How ${siteConfig.name} handles your data.` };

export default function PrivacyPage() {
	return (
		<LegalPage
			number="LG-200"
			title="Privacy"
			lead="We keep what we need to run your bookings and nothing else."
			updated="October 2026"
			clauses={[
				{ h: 'What we keep', p: ['Your name, email, phone (if you give it), your bookings, and the names and emails of guests you invite.'] },
				{ h: 'Why', p: ['To run your bookings: confirmations, reminders, letting your guests in and invoicing your company if you have an account.'] },
				{ h: 'Who sees it', p: ['The house team, our booking platform and our payment provider. We don’t sell data and we don’t run ad tracking.'] },
				{ h: 'Your rights', p: ['Ask us for a copy of your data, to correct it or to delete it, at ' + siteConfig.contact.email + '.'] },
				{ h: 'Cookies', p: ['We use a sign-in cookie and remember the house you chose in your browser. No advertising cookies.'] },
			]}
		/>
	);
}
