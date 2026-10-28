'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CartResponse } from '@opencals/storefront-sdk';
import { useCart } from '@/contexts/cart-context';
import { cartBookings, type Booking } from '@/lib/booking';
import { type Catalogue, type Extra, type Space } from '@/lib/workspace';
import { toSlot } from '@/lib/workspace-time';
import { revalidateHouseAvailability } from '@/hooks/use-house-availability';

/**
 * The day sheet is the cart: every space you add is held at once (an appointment in the cart, which expires unless
 * checked out), so a desk, a room and a booth for the same day go through one checkout and one payment.
 *
 *   add()      /api/book → AppointmentService.create into the cart (the backend re-checks the span)
 *   remove()   /api/cart/items/:id
 *   setExtra() /api/cart/items/:id/add-ons, /api/cart/add-ons/:id (PATCH quantity / DELETE)
 *   swap()     add the new space for the same span, then drop the old one (never leaves you with neither)
 */

export interface AddRequest {
	space: Space;
	/** UTC epoch minute */
	start: number;
	minutes: number;
	/** Seats on a shared floor (numberOfAttendees); 1 elsewhere */
	seats?: number;
	extras?: { extra: Extra; quantity: number }[];
	/** Invitees' emails (rooms, studios, events, offices) */
	guests?: string[];
	customAttributes?: Record<string, string>;
}

export interface DaySheetResult {
	ok: boolean;
	error?: string;
	/** The space was taken since the planner loaded */
	taken?: boolean;
}

async function readError(res: Response, fallback: string) {
	const data = await res.json().catch(() => null);
	return (data?.error as string) || fallback;
}

const TAKEN = /maximum attendees|not available|already booked|no longer available|not enough seats|conflict/i;

export function useDaySheet(cat: Catalogue) {
	const { cart, cartId, setCart, removeItem, timeRemaining, extendCart } = useCart();
	const [busy, setBusy] = useState<string | null>(null);

	const bookings: Booking[] = useMemo(() => cartBookings(cart, cat), [cart, cat]);

	const headers = useCallback(
		(json = true): Record<string, string> => ({ ...(json ? { 'Content-Type': 'application/json' } : {}), ...(cartId ? { 'X-Cart-Id': cartId } : {}) }),
		[cartId],
	);

	const add = useCallback(
		async (req: AddRequest): Promise<DaySheetResult> => {
			setBusy(`add:${req.space.id}`);
			try {
				const res = await fetch('/api/book', {
					method: 'POST',
					headers: headers(),
					body: JSON.stringify({
						slot: toSlot(req.space, req.start, req.minutes),
						numberOfAttendees: req.space.shared ? Math.max(1, req.seats ?? 1) : 1,
						// Per-unit extras scale with the booking length on the API side: send them without a quantity.
						addOns: (req.extras ?? [])
							.filter((x) => x.quantity > 0)
							.map((x) => (x.extra.perUnit ? { addOnId: x.extra.id } : { addOnId: x.extra.id, quantity: x.quantity })),
						guests: (req.guests ?? []).filter((g) => /.+@.+\..+/.test(g)).map((email) => ({ email: email.trim() })),
						customAttributes: req.customAttributes ?? {},
					}),
				});
				if (!res.ok) {
					const message = await readError(res, 'That time was just taken. Pick another one.');
					const taken = TAKEN.test(message) || res.status === 409;
					if (taken) revalidateHouseAvailability();
					return { ok: false, taken, error: taken ? 'Someone booked that just now. Pick another time or space.' : message };
				}
				const data = (await res.json()) as { cart?: CartResponse };
				if (data.cart) setCart(data.cart);
				revalidateHouseAvailability();
				return { ok: true };
			} catch {
				return { ok: false, error: 'We couldn’t reach the booking service. Try again.' };
			} finally {
				setBusy(null);
			}
		},
		[headers, setCart],
	);

	const remove = useCallback(
		async (itemId: string) => {
			setBusy(`remove:${itemId}`);
			try {
				await removeItem(itemId);
				revalidateHouseAvailability();
			} finally {
				setBusy(null);
			}
		},
		[removeItem],
	);

	/** Set an extra's quantity on a held item (0 removes it). Per-unit extras are on/off. */
	const setExtra = useCallback(
		async (booking: Booking, extra: Extra, quantity: number): Promise<DaySheetResult> => {
			if (!booking.itemId) return { ok: false };
			const current = booking.extras.find((x) => x.extraId === extra.id);
			setBusy(`extra:${booking.itemId}:${extra.id}`);
			try {
				let res: Response;
				if (current?.itemId && quantity <= 0) res = await fetch(`/api/cart/add-ons/${current.itemId}`, { method: 'DELETE', headers: headers(false) });
				else if (current?.itemId) res = await fetch(`/api/cart/add-ons/${current.itemId}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ quantity }) });
				else if (quantity > 0)
					res = await fetch(`/api/cart/items/${booking.itemId}/add-ons`, {
						method: 'POST',
						headers: headers(),
						body: JSON.stringify(extra.perUnit ? { addOnId: extra.id } : { addOnId: extra.id, quantity }),
					});
				else return { ok: true };
				if (!res.ok) return { ok: false, error: await readError(res, 'Couldn’t update the extra.') };
				setCart((await res.json()) as CartResponse);
				return { ok: true };
			} finally {
				setBusy(null);
			}
		},
		[headers, setCart],
	);

	/** Move a held booking to another space for the same span (an upgrade or a better fit). */
	const swap = useCallback(
		async (booking: Booking, to: Space): Promise<DaySheetResult> => {
			if (!booking.itemId) return { ok: false };
			const r = await add({ space: to, start: booking.start, minutes: booking.minutes, seats: booking.seats, guests: booking.guests.map((g) => g.email) });
			if (r.ok) await remove(booking.itemId);
			return r;
		},
		[add, remove],
	);

	const discounts = useMemo(() => (cart?.appliedDiscounts ?? []).filter((d) => d.totalAmount > 0), [cart]);

	return {
		cart,
		cartId,
		bookings,
		count: bookings.length,
		subtotal: cart?.subtotal ?? 0,
		total: cart?.total ?? 0,
		discounts,
		code: cart?.appliedDiscountCode ?? null,
		timeRemaining,
		extendCart,
		add,
		remove,
		setExtra,
		swap,
		busy,
	};
}

export type DaySheet = ReturnType<typeof useDaySheet>;
