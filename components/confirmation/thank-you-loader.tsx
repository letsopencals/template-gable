'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { OrderDetailResponse } from '@opencals/storefront-sdk';
import { ThankYouView } from '@/components/confirmation/thank-you-view';
import { orderBookings, orderReceipt } from '@/lib/booking';
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
		return <ThankYouView cat={cat} bookings={orderBookings(order, cat)} receipt={{ ref: r.ref, paid: r.paid, total: order.total, due: r.due, email: r.email, name }} />;
	}
	if (isLoading && !snap) return <div className="mx-auto h-[60vh] max-w-[1360px] px-4 pt-10 sm:px-6 lg:px-10"><div className="hatch-light h-full border border-line" aria-label="Loading your day sheet" /></div>;
	const s = snap;
	return (
		<ThankYouView
			cat={cat}
			bookings={s?.bookings ?? []}
			receipt={{ ref: s?.ref ?? '', paid: s ? !s.payAtHouse && s.total > 0 : false, total: s?.total ?? 0, due: s?.payAtHouse ? s.total : 0, email: s?.email ?? null, name: s?.firstName ?? null }}
		/>
	);
}
