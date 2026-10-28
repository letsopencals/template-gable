import type { Metadata } from 'next';
import { CheckoutView } from '@/components/checkout/checkout-view';
import { getCatalogue } from '@/lib/server-data';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
	return <CheckoutView cat={await getCatalogue()} />;
}
