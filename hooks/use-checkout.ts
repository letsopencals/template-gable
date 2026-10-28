'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import useSWR from 'swr';
import type { CartCheckoutQuestionResponse, CartResponse, CheckoutStartResponse, CustomerProviderCatalogItem } from '@opencals/storefront-sdk';
import { useCart } from '@/contexts/cart-context';
import { usePaymentProviders } from '@/hooks/use-payment-providers';
import { revalidateHouseAvailability } from '@/hooks/use-house-availability';
import { patchSnapshot, saveSnapshot } from '@/lib/day-snapshot';
import type { Booking } from '@/lib/booking';

/**
 * Checkout for the whole day sheet, in the order the Storefront API expects:
 *   save-customer → save-answers → start(provider) → [Stripe confirm] → submit → /thank-you
 * Offline methods (pay at the house) start and submit together on "Confirm". Card starts as soon as it's chosen and
 * the details are valid, so the card form can mount.
 */
export interface Details {
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	marketing: boolean;
}

const validEmail = (v: string) => /.+@.+\..+/.test(v.trim());

async function readError(res: Response, fallback: string) {
	const data = await res.json().catch(() => null);
	return (data?.error as string) || fallback;
}

export function useCheckout(bookings: Booking[]) {
	const router = useRouter();
	const { data: session } = useSession();
	const { cart, cartId, setCart, clearCart } = useCart();
	const customerId = session?.customer?.id ?? null;

	const [details, setDetails] = useState<Details>({ email: '', firstName: '', lastName: '', phone: '', marketing: false });
	const prefilled = useRef(false);
	useEffect(() => {
		const c = session?.customer;
		if (!c || prefilled.current) return;
		prefilled.current = true;
		setDetails((d) => ({ ...d, email: c.email ?? d.email, firstName: c.firstName ?? d.firstName, lastName: c.lastName ?? d.lastName }));
	}, [session]);

	const headers = useCallback((): Record<string, string> => ({ 'Content-Type': 'application/json', ...(cartId ? { 'X-Cart-Id': cartId } : {}) }), [cartId]);

	// Questions for everything on the cart
	const { data: questionData } = useSWR<CartCheckoutQuestionResponse[]>(cartId ? ['/api/checkout/questions', cartId, cart?.items?.length ?? 0] : null, ([url, id]: [string, string]) =>
		fetch(url, { headers: { 'X-Cart-Id': id } }).then((r) => (r.ok ? r.json() : [])),
	);
	const questions = useMemo(() => (Array.isArray(questionData) ? questionData : []), [questionData]);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const titleOf = (q: CartCheckoutQuestionResponse) => q.translations?.[0]?.title ?? q.internalName;

	const providers = usePaymentProviders(cartId);
	const [provider, setProvider] = useState<CustomerProviderCatalogItem['name'] | null>(null);
	useEffect(() => {
		if (!provider && providers.length) setProvider(providers[0]!.name);
	}, [providers, provider]);

	// Discount code
	const [codeError, setCodeError] = useState<string | null>(null);
	const [codeBusy, setCodeBusy] = useState(false);
	const applyCode = useCallback(
		async (code: string) => {
			setCodeBusy(true);
			setCodeError(null);
			try {
				const res = await fetch('/api/cart/discount-code', { method: 'POST', headers: headers(), body: JSON.stringify({ code }) });
				if (!res.ok) return setCodeError(await readError(res, 'That code didn’t work.'));
				setCart((await res.json()) as CartResponse);
			} finally {
				setCodeBusy(false);
			}
		},
		[headers, setCart],
	);
	const removeCode = useCallback(async () => {
		const res = await fetch('/api/cart/discount-code', { method: 'DELETE', headers: headers() });
		if (res.ok) setCart((await res.json()) as CartResponse);
	}, [headers, setCart]);

	const requiredMissing = questions.some((q) => q.required && !answers[q.id]?.trim());
	const valid = validEmail(details.email) && details.firstName.trim().length > 0 && !requiredMissing;

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [payment, setPayment] = useState<CheckoutStartResponse | null>(null);

	/** Customer + answers onto the cart (both checkout paths). */
	const prepare = useCallback(async () => {
		const customer = customerId
			? { customerId, firstName: details.firstName.trim() || null, lastName: details.lastName.trim() || null, phone: details.phone.trim() || null }
			: {
					email: details.email.trim(),
					firstName: details.firstName.trim() || null,
					lastName: details.lastName.trim() || null,
					phone: details.phone.trim() || null,
					...(details.marketing ? { marketingConsent: { email: true } } : {}),
				};
		let res = await fetch('/api/checkout/customer', { method: 'POST', headers: headers(), body: JSON.stringify({ customer }) });
		if (!res.ok) throw new Error(await readError(res, 'We couldn’t save your details.'));
		const list = questions.filter((q) => answers[q.id]?.trim()).map((q) => ({ questionId: q.id, question: titleOf(q), answer: answers[q.id]!.trim() }));
		if (list.length) {
			res = await fetch('/api/checkout/answers', { method: 'POST', headers: headers(), body: JSON.stringify({ answers: list }) });
			if (!res.ok) throw new Error(await readError(res, 'We couldn’t save your answers.'));
		}
		saveSnapshot({ at: Date.now(), orderId: null, ref: '', bookings, firstName: details.firstName.trim() || null, email: details.email.trim() || null, total: cart?.total ?? 0, payAtHouse: false });
	}, [customerId, details, headers, questions, answers, bookings, cart?.total]);

	const start = useCallback(
		async (name: string): Promise<CheckoutStartResponse> => {
			const res = await fetch('/api/checkout/start', { method: 'POST', headers: headers(), body: JSON.stringify({ provider: name }) });
			if (!res.ok) throw new Error(await readError(res, 'We couldn’t start checkout.'));
			const data = (await res.json()) as CheckoutStartResponse;
			if (data.invalidItemIds?.length) throw new Error('Something on your day sheet was taken or expired. Remove it and try again.');
			setPayment(data);
			return data;
		},
		[headers],
	);

	const submit = useCallback(
		async (stripePaymentIntentId?: string) => {
			const res = await fetch('/api/checkout/submit', {
				method: 'POST',
				headers: headers(),
				body: JSON.stringify({ appointmentsSettings: { markAsScheduled: true }, ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}) }),
			});
			if (!res.ok) throw new Error(await readError(res, 'We couldn’t confirm the booking.'));
			const data = await res.json();
			patchSnapshot({ orderId: data.order?.id ?? null, ref: String(data.order?.name ?? '').replace(/^#/, ''), payAtHouse: !stripePaymentIntentId, total: data.order?.total ?? cart?.total ?? 0 });
			if (data.auth?.accessToken) await signIn('checkout-token', { accessToken: data.auth.accessToken, refreshToken: data.auth.refreshToken, redirect: false });
			clearCart();
			revalidateHouseAvailability();
			router.push(`/thank-you?orderId=${encodeURIComponent(data.order?.id ?? '')}`);
		},
		[headers, clearCart, router, cart?.total],
	);

	/** Offline (pay at the house) or nothing to pay: one button does everything. */
	const confirm = useCallback(async () => {
		if (!provider || !valid) return;
		setSubmitting(true);
		setError(null);
		try {
			await prepare();
			const data = await start(provider);
			if (data.provider === 'stripe' && data.clientSecret) {
				setSubmitting(false);
				return; // the card form mounts; it calls submit() itself
			}
			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
				return;
			}
			await submit();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Something went wrong.');
			setSubmitting(false);
		}
	}, [provider, valid, prepare, start, submit]);

	const onCardPaid = useCallback(
		async (paymentIntentId: string) => {
			setSubmitting(true);
			try {
				await submit(paymentIntentId);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Payment went through but we couldn’t confirm. Contact the house.');
				setSubmitting(false);
			}
		},
		[submit],
	);

	const chosen = providers.find((p) => p.name === provider) ?? null;

	return {
		details,
		setDetails,
		signedIn: !!customerId,
		questions,
		answers,
		setAnswers,
		titleOf,
		providers,
		provider,
		setProvider: (p: CustomerProviderCatalogItem['name']) => {
			setProvider(p);
			setPayment(null);
		},
		chosen,
		applyCode,
		removeCode,
		codeError,
		codeBusy,
		valid,
		confirm,
		submitting,
		error,
		setError,
		payment,
		onCardPaid,
	};
}

export type Checkout = ReturnType<typeof useCheckout>;
