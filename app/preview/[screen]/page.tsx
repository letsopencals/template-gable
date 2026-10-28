import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ThankYouView } from '@/components/confirmation/thank-you-view';
import { BookingsView } from '@/components/account/bookings-view';
import { getCatalogue } from '@/lib/server-data';
import { PREVIEW_RECEIPT, previewBookings } from '@/lib/preview-fixtures';

export const metadata: Metadata = { title: 'Preview', robots: { index: false } };

const SCREENS = [
	{ key: 'thank-you', label: 'Confirmation: the day sheet printout (pay at the house)' },
	{ key: 'thank-you-paid', label: 'Confirmation, paid by card' },
	{ key: 'account', label: 'Account: week plan + coming up (actions don’t write)' },
];

/**
 * Post-booking screens rendered from fixtures built off the live catalogue, for screenshots and review without
 * placing real bookings. Available in development, or in production with GABLE_PREVIEW=1.
 */
export default async function PreviewPage({ params }: { params: Promise<{ screen: string }> }) {
	if (process.env.NODE_ENV !== 'development' && process.env.GABLE_PREVIEW !== '1') notFound();
	const { screen } = await params;
	const cat = await getCatalogue();
	const all = previewBookings(cat);
	const now = Math.floor(Date.now() / 60000);
	const day = all.filter((b) => b.end > now).slice(0, 3);
	const total = day.reduce((s, b) => s + (b.total ?? 0) + b.extras.reduce((x, e) => x + (e.total ?? 0), 0), 0);

	if (screen === 'thank-you' || screen === 'thank-you-paid') {
		const paid = screen === 'thank-you-paid';
		return <ThankYouView cat={cat} bookings={day} preview receipt={{ ...PREVIEW_RECEIPT, paid, total, due: paid ? 0 : total }} />;
	}
	if (screen === 'account') {
		return (
			<div className="mx-auto max-w-[1360px] px-4 pb-24 pt-8 sm:px-6 lg:px-10">
				<h1 className="t-h1 mb-8">
					Hello, <span className="highlight">Aoife</span>
				</h1>
				<BookingsView cat={cat} fixtures={all} />
			</div>
		);
	}
	if (screen !== 'index') notFound();
	return (
		<div className="mx-auto max-w-3xl px-4 py-16">
			<h1 className="t-h2">Preview screens</h1>
			<ul className="mt-6 divide-y divide-line border-y border-line">
				{SCREENS.map((s) => (
					<li key={s.key} className="py-3">
						<Link href={`/preview/${s.key}`} className="font-medium text-cobalt underline underline-offset-4">
							/preview/{s.key}
						</Link>
						<span className="ml-3 text-mute">{s.label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
