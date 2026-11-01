/**
 * A booked (or held) space, read the same way wherever it comes from: a cart item on the day sheet, an order line on
 * the confirmation, or an appointment in the account. Pure functions, safe on the server and the client; everything
 * comes from the API objects, matched against the catalogue (houses + spaces).
 */
import type {
	AppointmentDetailResponse,
	AppointmentListItemResponse,
	CartItem,
	CartResponse,
	OrderDetailAppointment,
	OrderDetailResponse,
	StorefrontAppointmentPendingReason,
} from '@opencals/storefront-sdk';
import { houseBySlug, spaceBySlug, type Catalogue, type House, type Space } from '@/lib/workspace';
import { isoToMin } from '@/lib/workspace-time';

type AppointmentFields =
	| 'id'
	| 'name'
	| 'status'
	| 'pendingReason'
	| 'from'
	| 'to'
	| 'productId'
	| 'locationId'
	| 'numberOfAttendees'
	| 'customAttributes'
	| 'product'
	| 'location';

/**
 * Every SDK appointment shape a booking is read from: a cart item, an order line, and the account list. Guests,
 * answers and add-ons are typed only on the appointment detail; the API sends them on the others too.
 */
export type AppointmentLike = (
	| Pick<NonNullable<CartItem['appointment']>, AppointmentFields>
	| Pick<OrderDetailAppointment, AppointmentFields>
	| Pick<AppointmentListItemResponse, AppointmentFields>
) &
	Partial<Pick<AppointmentDetailResponse, 'guests' | 'checkoutQuestionAnswers' | 'addOns'>>;

export interface BookingExtra {
	/** Cart add-on item id (day sheet only) */
	itemId: string | null;
	extraId: string | null;
	title: string;
	quantity: number;
	total: number | null;
}

export interface Booking {
	/** Appointment id */
	id: string;
	/** Cart item id when it's on the day sheet */
	itemId: string | null;
	/** "#2041" */
	ref: string;
	status: string;
	/** 'awaiting_payment' / 'awaiting_approval' while it waits to be confirmed, otherwise null */
	awaiting: StorefrontAppointmentPendingReason | null;
	space: Space | null;
	house: House | null;
	/** Space name even when the catalogue doesn't know it */
	name: string;
	/** UTC epoch minutes */
	start: number;
	end: number;
	minutes: number;
	/** Seats booked (numberOfAttendees) */
	seats: number;
	guests: { id: string | null; email: string }[];
	extras: BookingExtra[];
	/** "Meeting name for the door screen" answer, when given */
	meetingTitle: string | null;
	answers: { question: string; answer: string }[];
	/** Prices: list and after discounts (cart / order only) */
	listPrice: number | null;
	total: number | null;
	discountTitles: string[];
	cancelGapMin: number;
	rescheduleGapMin: number;
	allowCancel: boolean;
	allowReschedule: boolean;
}

/**
 * A booking waits only while it's pending *with* a reason. Right after checkout a booking on a house that confirms
 * everything is briefly pending with no reason (a background job confirms it): that one is confirmed.
 */
export function awaitingOf(a: Pick<AppointmentLike, 'status' | 'pendingReason'>): StorefrontAppointmentPendingReason | null {
	if ((a.status ?? '').toLowerCase() !== 'pending') return null;
	return a.pendingReason === 'awaiting_payment' || a.pendingReason === 'awaiting_approval' ? a.pendingReason : null;
}

/** The one reason a whole order waits for: payment first (it decides the rest), then approval. */
export function orderAwaiting(bookings: Pick<Booking, 'awaiting'>[]): StorefrontAppointmentPendingReason | null {
	if (bookings.some((b) => b.awaiting === 'awaiting_payment')) return 'awaiting_payment';
	if (bookings.some((b) => b.awaiting === 'awaiting_approval')) return 'awaiting_approval';
	return null;
}

const MEETING_Q = /door screen|meeting name|meeting title/i;

export function toBooking(a: AppointmentLike, cat: Catalogue, extra?: Partial<Booking>): Booking {
	const space = spaceBySlug(cat, a.productId ?? a.product.id ?? a.product.slug) ?? spaceBySlug(cat, a.product.slug);
	const house = space ? (cat.houses.find((h) => h.id === space.houseId) ?? null) : houseBySlug(cat, a.locationId ?? a.location?.slug ?? null);
	const start = isoToMin(a.from);
	const end = isoToMin(a.to);
	const answers = (a.checkoutQuestionAnswers ?? []).flatMap((x) => {
		const answer = x.answer?.trim();
		return answer ? [{ question: x.question, answer }] : [];
	});
	return {
		id: a.id,
		itemId: null,
		ref: (a.name ?? '').replace(/^#/, ''),
		status: (a.status ?? '').toLowerCase(),
		awaiting: awaitingOf(a),
		space,
		house,
		name: space?.name ?? a.product.variantTitle ?? a.product.title,
		start,
		end,
		minutes: Math.max(0, end - start),
		seats: Math.max(1, a.numberOfAttendees || 1),
		guests: (a.guests ?? []).map((g) => ({ id: g.id ?? null, email: g.email })),
		extras: (a.addOns ?? []).map((x) => ({
			itemId: null,
			extraId: x.addOnId ?? x.addOn?.id ?? null,
			title: x.addOn?.title ?? 'Extra',
			quantity: x.quantity,
			total: null,
		})),
		meetingTitle: answers.find((x) => MEETING_Q.test(x.question))?.answer ?? a.customAttributes?.meeting ?? null,
		answers,
		listPrice: null,
		total: null,
		discountTitles: [],
		cancelGapMin: Math.round((a.product.cancelGap ?? 0) / 60),
		rescheduleGapMin: Math.round((a.product.rescheduleGap ?? 0) / 60),
		allowCancel: a.product.allowCustomerCancel !== false,
		allowReschedule: a.product.allowCustomerReschedule !== false,
		...extra,
	};
}

/** The day sheet: every held item in the cart, in time order. */
export function cartBookings(cart: CartResponse | null | undefined, cat: Catalogue): Booking[] {
	return (cart?.items ?? [])
		.filter((it): it is CartItem & { appointment: NonNullable<CartItem['appointment']> } => !!it.appointment)
		.map((it) => {
			const b = toBooking(it.appointment, cat, {
				itemId: it.id,
				listPrice: it.originalSubtotal,
				total: it.discountedSubtotal,
				discountTitles: (it.discounts ?? []).map((d) => d.title),
			});
			b.extras = (it.addOnItems ?? []).map((x) => ({
				itemId: x.id,
				extraId: x.addOnId,
				title: x.addOn?.title ?? 'Extra',
				quantity: x.quantity,
				total: x.discountedTotal,
			}));
			return b;
		})
		.sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Bookings on an order, in time order, with their extras. */
export function orderBookings(order: OrderDetailResponse, cat: Catalogue): Booking[] {
	return order.lineItems
		.filter((li) => li.appointment)
		.map((li) =>
			toBooking(li.appointment, cat, {
				listPrice: li.originalSubtotal,
				total: li.discountedSubtotal,
				extras: (li.addOnLineItems ?? []).map((x) => ({ itemId: null, extraId: x.addOn?.id ?? null, title: x.addOn?.title ?? 'Extra', quantity: x.quantity, total: null })),
			}),
		)
		.sort((a, b) => a.start - b.start);
}

/** What's paid or owed on an order. A voided order was cancelled before anything was paid: nothing is due. */
export function orderReceipt(order: OrderDetailResponse): { paid: boolean; voided: boolean; due: number; paidTotal: number; ref: string; email: string | null } {
	const paid = !!order.isFullyPaid || order.paymentStatus === 'paid';
	const voided = order.paymentStatus === 'voided';
	return {
		paid,
		voided,
		due: paid || voided ? 0 : (order.dueToPay ?? order.total),
		paidTotal: order.paidTotal || (paid ? order.total : 0),
		ref: (order.name ?? '').replace(/^#/, ''),
		email: order.customer?.email ?? order.customerEmail ?? null,
	};
}

export const isUpcoming = (b: Pick<Booking, 'end' | 'status'>, now = Math.floor(Date.now() / 60000)) =>
	b.end > now && !['canceled', 'cancelled'].includes(b.status);

/** Can the customer still cancel / move it (notice gaps)? */
export function canCancel(b: Booking, now = Math.floor(Date.now() / 60000)): boolean {
	return b.allowCancel && isUpcoming(b, now) && b.start - now >= b.cancelGapMin;
}
export function canReschedule(b: Booking, now = Math.floor(Date.now() / 60000)): boolean {
	return b.allowReschedule && isUpcoming(b, now) && b.start - now >= b.rescheduleGapMin;
}

/** Group bookings by local day (YYYY-MM-DD in each booking's house timezone). */
export function byDay(bookings: Booking[], fallbackTz: string, localDay: (min: number, tz: string) => string): Map<string, Booking[]> {
	const out = new Map<string, Booking[]>();
	for (const b of bookings) {
		const d = localDay(b.start, b.house?.tz ?? fallbackTz);
		const list = out.get(d) ?? [];
		list.push(b);
		out.set(d, list);
	}
	return out;
}
