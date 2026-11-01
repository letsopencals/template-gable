'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { OrderDetailResponse } from '@opencals/storefront-sdk';
import { ThankYouView } from '@/components/confirmation/thank-you-view';
import { orderAwaiting, orderBookings, orderReceipt } from '@/lib/booking';
import { readSnapshot, type DaySnapshot } from '@/lib/day-snapshot';
import type { Catalogue } from '@/lib/workspace';

/**
 * Reads the order (the customer is signed in by checkout), falling back to the day sheet saved in this tab while the
 * order isn't readable yet.
 */
export function ThankYouLoader({ cat, orderId }: { cat: Catalogue; orderId: string | null }) {
	const [snap, setSnap] = useState<DaySnapshot | null>(null);
	useEffect(() => setSnap(readSnapshot()), []);
	const { data: order, isLoading } = useSWR<OrderDetailResponse>(orderId ? `/api/account/orders/${orderId}` : null, (url: string) =>
		fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
		{ revalidateOnFocus: false, shouldRetryOnError: false },
	);

	if (order?.lineItems?.length) {
		const r = orderReceipt(order);
		const name = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || snap?.firstName || null;
		const bookings = orderBookings(order, cat);
		// Bank details and the invoice link only come back from submit: this tab saved them with the order id.
		const mine = snap?.orderId === order.id ? snap : null;
		const provider = mine?.provider ?? order.transactions?.[0]?.provider ?? null;
		return (
			<ThankYouView
				cat={cat}
				bookings={bookings}
				receipt={{
					ref: r.ref,
					paid: r.paid,
					voided: r.voided,
					total: order.total,
					due: r.due,
					email: r.email,
					name,
					awaiting: orderAwaiting(bookings),
					provider,
					instructions: mine?.instructions ?? null,
					dueAt: mine?.instructions?.dueAt ?? order.paymentDueAt ?? null,
				}}
			/>
		);
	}
	if (isLoading && !snap) return <div className="mx-auto h-[60vh] max-w-[1360px] px-4 pt-10 sm:px-6 lg:px-10"><div className="hatch-light h-full border border-line" aria-label="Loading your day sheet" /></div>;
	const s = snap;
	return (
		<ThankYouView
			cat={cat}
			bookings={s?.bookings ?? []}
			receipt={{
				ref: s?.ref ?? '',
				// Card payments are taken before submit; manual methods (and the instructions for them) leave it due.
				paid: s ? s.provider === 'stripe' && s.total > 0 : false,
				total: s?.total ?? 0,
				due: s && s.provider !== 'stripe' && s.provider !== 'no_payment_required' ? s.total : 0,
				email: s?.email ?? null,
				name: s?.firstName ?? null,
				awaiting: orderAwaiting(s?.bookings ?? []),
				provider: s?.provider ?? null,
				instructions: s?.instructions ?? null,
				dueAt: s?.instructions?.dueAt ?? null,
			}}
		/>
	);
}
