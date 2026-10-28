'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { OrderListItemResponse } from '@opencals/storefront-sdk';
import { Tag } from '@/components/ui/chip';
import { useSettings } from '@/contexts/settings-context';
import { formatMoney } from '@/lib/money';
import { at, isoToMin } from '@/lib/workspace-time';

/** Receipts: every order, its total and payment, and a link to its day sheet. */
export function OrdersView() {
	const { currency } = useSettings();
	const { data, isLoading, error } = useSWR<{ data: OrderListItemResponse[] }>('/api/account/orders?take=50', (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error()))));
	const orders = data?.data ?? [];
	if (isLoading) return <div className="hatch-light h-48 border border-line" aria-label="Loading" />;
	if (error) return <p className="border-l-2 border-alert bg-sheet px-4 py-3">We couldn’t load your receipts just now.</p>;
	if (!orders.length) return <p className="drafting-grid border border-line-strong px-5 py-10 text-center text-mute">No receipts yet.</p>;
	return (
		<table className="w-full border-collapse border border-ink bg-sheet text-left text-[0.9375rem]">
			<thead>
				<tr className="t-label border-b border-ink text-mute">
					<th className="px-3 py-2.5 font-medium">Ref</th>
					<th className="px-3 py-2.5 font-medium">Booked</th>
					<th className="hidden px-3 py-2.5 font-medium sm:table-cell">Payment</th>
					<th className="px-3 py-2.5 text-right font-medium">Total</th>
					<th className="px-3 py-2.5" />
				</tr>
			</thead>
			<tbody>
				{orders.map((o) => {
					const paid = o.paymentStatus === 'paid';
					return (
						<tr key={o.id} className="border-b border-line last:border-b-0">
							<td className="t-num px-3 py-3">{o.name}</td>
							<td className="t-num px-3 py-3 text-mute">{at(isoToMin(o.createdAt), 'Europe/Dublin', 'D MMM YYYY')}</td>
							<td className="hidden px-3 py-3 sm:table-cell">{paid ? <Tag tone="free">Paid</Tag> : <Tag tone="marigold">Pay at the house</Tag>}</td>
							<td className="t-num px-3 py-3 text-right">{formatMoney(o.total, o.paymentCurrencyCode || currency)}</td>
							<td className="px-3 py-3 text-right">
								<Link href={`/thank-you?orderId=${o.id}`} className="text-[0.875rem] font-medium text-cobalt underline underline-offset-4">
									Day sheet
								</Link>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
