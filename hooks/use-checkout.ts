'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import useSWR from 'swr';
import type { CartCheckoutQuestionResponse, CartResponse, CheckoutResponse, CheckoutStartResponse, CustomerProviderCatalogItem } from '@opencals/storefront-sdk';
import type { ApiErrorBody } from '@/lib/api-error-handler';
import { useCart } from '@/contexts/cart-context';
import { usePaymentProviders } from '@/hooks/use-payment-providers';
import { revalidateHouseAvailability } from '@/hooks/use-house-availability';
import { patchSnapshot, readSnapshot, saveSnapshot } from '@/lib/day-snapshot';
import { awaitingOf, type Booking } from '@/lib/booking';

/**
 * Checkout for the whole day sheet, in the order the Storefront API expects:
 *   save-customer → save-answers → start(provider) → [Stripe confirm] → submit → /thank-you
 * Where it goes after start follows the method's `checkoutMode`: `internal` mounts the card form (it calls submit
 * itself), `redirect` leaves for the provider, `manual` (pay at the house, bank transfer, invoice) and `none` (nothing
 * to pay) submit straight away.
 */
export interface Details {
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
	marketing: boolean;
}

const validEmail = (v: string) => /.+@.+\..+/.test(v.trim());

/** A failed /api call, with the API's machine-readable code (and the order a checked-out cart became) when sent. */
class CheckoutError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code?: string,
		readonly orderId?: string,
	) {
		super(message);
	}
}

const MESSAGES: Record<string, string> = {
	CART_EXPIRED: 'Your hold ran out and a space on your day sheet was booked in the meantime. Plan the day again: the rest is probably still free.',
	CHECKOUT_IN_PROGRESS: 'We’re still confirming this day sheet. Give it a moment and try again.',
	PAYMENT_NOT_AUTHORIZED: 'Your card wasn’t authorised, so nothing was booked or charged. Check the details or use another card and pay again.',
};

async function readError(res: Response, fallback: string): Promise<CheckoutError> {
	const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
	const code = data?.code;
	return new CheckoutError((code && MESSAGES[code]) || data?.error || fallback, res.status, code, data?.orderId);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST to a checkout route. 409 CHECKOUT_IN_PROGRESS (a double click, a second tab) is retried a few times. */
async function post<T>(url: string, headers: Record<string, string>, body: unknown, fallback: string): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
		if (res.ok) return (await res.json()) as T;
		const err = await readError(res, fallback);
		if (err.code !== 'CHECKOUT_IN_PROGRESS' || attempt >= 3) throw err;
		await wait(1500 * (attempt + 1));
	}
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
				if (!res.ok) return setCodeError((await readError(res, 'That code didn’t work.')).message);
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
		if (!res.ok) throw await readError(res, 'We couldn’t save your details.');
		const list = questions.filter((q) => answers[q.id]?.trim()).map((q) => ({ questionId: q.id, question: titleOf(q), answer: answers[q.id]!.trim() }));
		if (list.length) {
			res = await fetch('/api/checkout/answers', { method: 'POST', headers: headers(), body: JSON.stringify({ answers: list }) });
			if (!res.ok) throw await readError(res, 'We couldn’t save your answers.');
		}
		saveSnapshot({ at: Date.now(), orderId: null, ref: '', bookings, firstName: details.firstName.trim() || null, email: details.email.trim() || null, total: cart?.total ?? 0, provider: null, instructions: null });
	}, [customerId, details, headers, questions, answers, bookings, cart?.total]);

	const start = useCallback(
		async (name: string): Promise<CheckoutStartResponse> => {
			const data = await post<CheckoutStartResponse>('/api/checkout/start', headers(), { provider: name }, 'We couldn’t start checkout.');
			if (data.invalidItemIds?.length) throw new Error('Something on your day sheet was taken or expired. Remove it and try again.');
			setPayment(data);
			return data;
		},
		[headers],
	);

	const submit = useCallback(
		async (stripePaymentIntentId?: string) => {
			const data = await post<CheckoutResponse>(
				'/api/checkout/submit',
				headers(),
				{ appointmentsSettings: { markAsScheduled: true }, ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}) },
				'We couldn’t confirm the booking.',
			);
			// The confirmation reads the order back; until it can (and for the bank details or invoice link, which only
			// submit returns) it shows the day sheet saved in this tab, now with each booking's confirmation state.
			const appts = new Map((data.order?.lineItems ?? []).flatMap((li) => (li.appointment ? [[li.appointment.id, li.appointment] as const] : [])));
			patchSnapshot({
				orderId: data.order?.id ?? null,
				ref: String(data.order?.name ?? '').replace(/^#/, ''),
				provider: data.paymentInstructions?.provider ?? provider,
				instructions: data.paymentInstructions ?? null,
				total: data.order?.total ?? cart?.total ?? 0,
				bookings: (readSnapshot()?.bookings ?? []).map((b) => {
					const a = appts.get(b.id);
					return a ? { ...b, status: (a.status ?? b.status).toLowerCase(), awaiting: awaitingOf(a) } : b;
				}),
			});
			if (data.auth?.accessToken) await signIn('checkout-token', { accessToken: data.auth.accessToken, refreshToken: data.auth.refreshToken, redirect: false });
			clearCart();
			revalidateHouseAvailability();
			router.push(`/thank-you?orderId=${encodeURIComponent(data.order?.id ?? '')}`);
		},
		[headers, clearCart, router, cart?.total, provider],
	);

	/** A 409 or 402 from start/submit: send the customer where they can carry on. */
	const recover = useCallback(
		async (e: unknown, fallback: string) => {
			if (e instanceof CheckoutError && e.code === 'CART_ALREADY_CHECKED_OUT') {
				// The day sheet is already an order. Submitting again returns that order (and how to pay it).
				try {
					await submit();
					return;
				} catch {
					clearCart();
					router.push(e.orderId ? `/thank-you?orderId=${encodeURIComponent(e.orderId)}` : '/account');
					return;
				}
			}
			if (e instanceof CheckoutError && e.code === 'CART_EXPIRED') {
				// The held spaces are gone: the empty day sheet shows this message and a way back to the planner.
				clearCart();
				revalidateHouseAvailability();
				setPayment(null);
			}
			setError(e instanceof Error ? e.message : fallback);
			setSubmitting(false);
		},
		[submit, clearCart, router],
	);

	/** One button for every method: card and redirect methods stop after start, the rest confirm right away. */
	const confirm = useCallback(async () => {
		if (!provider || !valid) return;
		setSubmitting(true);
		setError(null);
		try {
			await prepare();
			const data = await start(provider);
			const mode = (data.provider as string) === 'no_payment_required' ? 'none' : (providers.find((p) => p.name === provider)?.checkoutMode ?? (data.clientSecret ? 'internal' : 'manual'));
			if (mode === 'internal') {
				setSubmitting(false);
				if (!data.clientSecret) throw new Error('The card form didn’t load. Try again, or pick another way to pay.');
				return; // the card form mounts; it calls submit() itself
			}
			if (mode === 'redirect') {
				if (!data.redirectUrl) throw new Error('We couldn’t reach the payment page. Try again, or pick another way to pay.');
				window.location.href = data.redirectUrl;
				return;
			}
			await submit();
		} catch (e) {
			await recover(e, 'Something went wrong.');
		}
	}, [provider, valid, prepare, start, submit, providers, recover]);

	const onCardPaid = useCallback(
		async (paymentIntentId: string) => {
			setSubmitting(true);
			setError(null);
			try {
				await submit(paymentIntentId);
			} catch (e) {
				await recover(e, 'Payment went through but we couldn’t confirm. Contact the house.');
			}
		},
		[submit, recover],
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
