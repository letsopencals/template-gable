import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/legal-page';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Terms', description: `Booking terms for ${siteConfig.name}.` };

export default function TermsPage() {
	return (
		<LegalPage
			number="LG-100"
			title="Booking terms"
			lead="The short version: book what you need, treat the houses well, change or cancel from your account."
			updated="October 2026"
			clauses={[
				{ h: 'Bookings', p: ['A booking gives you the space you booked for the time you booked it. Flex desk bookings give you any free seat on that house’s open floor.', 'Prices include Irish VAT. The price shown at checkout is the price you pay.'] },
				{ h: 'Changes and cancellations', p: ['You can move or cancel a booking from your account up to the cut-off shown on the booking. After the cut-off, contact the house.', 'If we have to close a space, we offer you another space or a full refund.'] },
				{ h: 'Guests', p: ['Guests you add to a booking are welcome for its duration. You’re responsible for them while they’re in the house.'] },
				{ h: 'Extras', p: ['Catering is prepared for the number of people you book. Changes to catering need 24 hours’ notice.'] },
				{ h: 'House rules', p: ['Keep calls to booths and rooms, leave a space as you found it, and be kind to the people around you.'] },
				{ h: 'Company accounts', p: ['Teams on a company account are invoiced monthly. Payment is due within 14 days of the invoice.'] },
			]}
		/>
	);
}
