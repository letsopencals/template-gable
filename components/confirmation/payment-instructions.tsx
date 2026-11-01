import { TitleBlock, type TitleBlockRow } from '@/components/ui/title-block';
import { buttonClasses } from '@/components/ui/button';
import type { PaymentState } from '@/lib/payment-copy';
import { payBy } from '@/lib/payment-copy';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * How to pay an order placed with a manual method: the bank account to transfer to, or the hosted invoice, and the
 * deadline. Drawn as a title block like every other summary. Without the details (this tab reloaded, another device)
 * it points to the confirmation email, which has them.
 */
export function PaymentInstructionsBlock({ payment, reference, currency, tz, className }: { payment: PaymentState; reference: string; currency: string; tz: string; className?: string }) {
	if (payment.paid || payment.voided || payment.total <= 0 || payment.due <= 0 || payment.provider === 'cash') return null;
	const pi = payment.instructions;
	const bank = pi?.bankDetails;
	const invoice = pi?.hostedInvoiceUrl && pi.hostedInvoiceUrl.startsWith('https://') ? pi.hostedInvoiceUrl : null;
	const by = payBy(pi?.dueAt ?? payment.dueAt, tz);

	if (!bank && !invoice) {
		if (pi?.provider === 'cash') return null;
		return (
			<p className={cn('hatch-light border border-line-strong px-4 py-3 text-[0.9375rem]', className)}>
				{pi?.provider === 'stripe_invoice'
					? 'Your invoice is on its way by email; pay it from the link there'
					: 'The payment details are in your confirmation email'}
				{by ? ` ${by}` : ''}. Unpaid bookings are released after the deadline.
			</p>
		);
	}

	const rows: TitleBlockRow[] = [{ k: 'Amount', v: <span className="t-num">{formatMoney(payment.due, currency)}</span> }];
	if (bank) {
		if (bank.accountName) rows.push({ k: 'Account name', v: bank.accountName });
		if (bank.bankName) rows.push({ k: 'Bank', v: bank.bankName });
		if (bank.iban) rows.push({ k: 'IBAN / account', v: <span className="t-num break-all">{bank.iban}</span> });
		if (bank.swift) rows.push({ k: 'SWIFT / BIC', v: <span className="t-num">{bank.swift}</span> });
		if (reference) rows.push({ k: 'Reference', v: <span className="t-num">#{reference}</span> });
	}
	if (by) rows.push({ k: 'Pay', v: by });

	return (
		<section aria-label="How to pay" className={cn('grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start', className)}>
			<TitleBlock heading={invoice && !bank ? 'Pay by invoice' : 'Pay by bank transfer'} number="PAY" rows={rows} />
			<div className="flex flex-col gap-3 text-[0.9375rem]">
				<p>{bank ? 'Use the reference so we can match your transfer to the booking.' : 'The invoice takes card or bank payment.'} Unpaid bookings are released after the deadline.</p>
				{invoice ? (
					<a href={invoice} target="_blank" rel="noreferrer" className={cn(buttonClasses('primary', 'md'), 'self-start')}>
						Pay invoice →
					</a>
				) : null}
			</div>
		</section>
	);
}
