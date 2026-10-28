import type { Metadata } from 'next';
import { ThankYouLoader } from '@/components/confirmation/thank-you-loader';
import { getCatalogue } from '@/lib/server-data';

export const metadata: Metadata = { title: 'You’re booked', robots: { index: false } };

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
	const { orderId } = await searchParams;
	return <ThankYouLoader cat={await getCatalogue()} orderId={orderId || null} />;
}
