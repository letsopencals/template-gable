import type { PaymentInstructions, StorefrontAppointmentPendingReason } from '@opencals/storefront-sdk';
import { formatMoney } from '@/lib/money';
import { at, isoToMin } from '@/lib/workspace-time';

/** How the confirmation reads the money side of an order. */
export interface PaymentState {
	paid: boolean;
	total: number;
	due: number;
	/** Cancelled before anything was paid: nothing is due */
	voided?: boolean;
	/** Payment method chosen at checkout, when this tab knows it */
	provider?: string | null;
	instructions?: PaymentInstructions | null;
	/** Pay-by deadline (ISO) from the instructions or the order */
	dueAt?: string | null;
}

/** "by Fri 14 Nov, 17:00" in the house's timezone, or '' without a deadline. */
export function payBy(dueAt: string | null | undefined, tz: string): string {
	return dueAt ? `by ${at(isoToMin(dueAt), tz, 'ddd D MMM, HH:mm')}` : '';
}

/** The sentence under the headline. Says how this order is really paid: never "at the desk" for a transfer or invoice. */
export function payLine(p: PaymentState, currency: string, tz: string): string {
	if (p.voided) return 'It was cancelled before payment, so nothing was charged.';
	if (p.total <= 0) return 'There’s nothing to pay.';
	if (p.paid) return `Paid ${formatMoney(p.total, currency)}, receipt in your inbox.`;
	const amount = formatMoney(p.due, currency);
	const by = payBy(p.dueAt, tz);
	switch (p.provider) {
		case 'cash':
			return `Pay ${amount} at the front desk on the day, by card or phone.`;
		case 'bank_transfer':
			return `Pay ${amount} by bank transfer ${by}`.trim() + '. The account details are below and in your email.';
		case 'stripe_invoice':
			return `Pay ${amount} by invoice ${by}`.trim() + '. The invoice link is below and in your email.';
		default:
			return `${amount} still to pay${by ? ` ${by}` : ''}. Your confirmation email says how.`;
	}
}

/** The Payment row of the title block. */
export function payRow(p: PaymentState, currency: string): string {
	if (p.voided) return 'Cancelled — not charged';
	if (p.total <= 0) return 'Nothing to pay';
	if (p.paid) return 'Paid';
	const amount = formatMoney(p.due, currency);
	switch (p.provider) {
		case 'cash':
			return `${amount} at the front desk`;
		case 'bank_transfer':
			return `${amount} by bank transfer`;
		case 'stripe_invoice':
			return `${amount} by invoice`;
		default:
			return `${amount} to pay`;
	}
}

/** Headline wording for an order that waits, or null once it's confirmed. */
export function awaitingCopy(reason: StorefrontAppointmentPendingReason | null, count: number): { strip: string; lead: string } | null {
	const it = count === 1 ? 'it' : 'them';
	if (reason === 'awaiting_payment') return { strip: 'Awaiting payment', lead: `We’re holding ${count === 1 ? 'your booking' : 'your bookings'} until the payment arrives, then we confirm ${it}.` };
	if (reason === 'awaiting_approval') return { strip: 'Awaiting confirmation', lead: `The house still has to confirm ${it}. We’ll email you as soon as they do.` };
	return null;
}
