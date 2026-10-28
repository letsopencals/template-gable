'use client';

import { useMemo, useState } from 'react';
import { type Appearance, type StripeError, loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

const envPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

const appearance: Appearance = {
	theme: 'flat',
	variables: {
		colorPrimary: '#2a44d4',
		colorBackground: '#ffffff',
		colorText: '#121633',
		colorDanger: '#c43d2b',
		fontFamily: 'Onest, system-ui, sans-serif',
		spacingUnit: '4px',
		borderRadius: '2px',
	},
	rules: { '.Input': { border: '1px solid #b9bed0' }, '.Input:focus': { border: '1px solid #121633', boxShadow: 'none' } },
};

/** Card payment with Stripe Elements. Loaded with next/dynamic from the checkout so Stripe isn't in the first bundle. */
export function StripePayment({
	clientSecret,
	stripeAccountId,
	publishableKey: fromApi,
	label,
	onSuccess,
	onError,
}: {
	clientSecret: string;
	stripeAccountId?: string | null;
	/** The key the API returns with checkout (matches the store's test/live mode); falls back to the env key */
	publishableKey?: string | null;
	label: string;
	onSuccess: (paymentIntentId: string) => void;
	onError: (message: string) => void;
}) {
	const publishableKey = fromApi || envPublishableKey;
	const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey, { stripeAccount: stripeAccountId ?? undefined }) : null), [publishableKey, stripeAccountId]);
	const options = useMemo(() => ({ clientSecret, appearance }), [clientSecret]);
	if (!stripePromise)
		return (
			<p className="border-l-2 border-alert bg-sheet px-3 py-2 text-[0.875rem]">
				Card payments aren’t configured. Set <code className="t-num">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> or connect Stripe in the dashboard.
			</p>
		);
	return (
		<Elements stripe={stripePromise} options={options}>
			<CardForm label={label} onSuccess={onSuccess} onError={onError} />
		</Elements>
	);
}

function CardForm({ label, onSuccess, onError }: { label: string; onSuccess: (id: string) => void; onError: (m: string) => void }) {
	const stripe = useStripe();
	const elements = useElements();
	const [busy, setBusy] = useState(false);
	const pay = async () => {
		if (!stripe || !elements || busy) return;
		setBusy(true);
		try {
			const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
			if (error) return onError((error as StripeError).message ?? 'Payment failed');
			if (paymentIntent?.id) onSuccess(paymentIntent.id);
			else onError('The payment didn’t return a result. Try again.');
		} catch (e) {
			onError(e instanceof Error ? e.message : 'Payment failed');
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="flex flex-col gap-4">
			<PaymentElement options={{ layout: 'tabs' }} />
			<Button size="lg" fullWidth onClick={pay} loading={busy} disabled={!stripe || !elements}>
				{label}
			</Button>
		</div>
	);
}
