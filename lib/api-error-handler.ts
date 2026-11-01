import { OpencalsApiError, type CheckoutErrorResponse } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';

/** Error JSON every /api route answers with. `code`, `orderId` and `paymentStatus` come from the API when it sends them. */
export interface ApiErrorBody extends Partial<Pick<CheckoutErrorResponse, 'orderId' | 'paymentStatus'>> {
	error: string;
	errors?: Record<string, string>;
	/** The API's field validation errors, unchanged: `{ property: 'customer.email', messages: [...] }` per failing field. */
	fieldErrors?: OpencalsApiError['errors'];
	/** The API's machine-readable reason, e.g. a `CheckoutErrorCode` or a discount code's `CODE_EXPIRED`. */
	code?: string;
}

/** Error JSON from the /api/checkout/* routes. A plain 400 validation error has no `code`. */
export type CheckoutApiErrorBody = Omit<ApiErrorBody, 'code'> & Partial<Pick<CheckoutErrorResponse, 'code'>>;

export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		// 409 CART_ALREADY_CHECKED_OUT carries the order it became, 402 PAYMENT_NOT_AUTHORIZED the card's status.
		const checkout = (err.body ?? {}) as Partial<CheckoutErrorResponse>;
		const fieldErrors = err.toFieldErrors();
		const body: ApiErrorBody = {
			error: err.message,
			...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
			...(err.errors?.length && { fieldErrors: err.errors }),
			...(err.code && { code: err.code }),
			...(checkout.orderId && { orderId: checkout.orderId }),
			...(checkout.paymentStatus && { paymentStatus: checkout.paymentStatus }),
		};
		return NextResponse.json(body, { status: err.status });
	}

	console.error(fallbackMessage, err);
	return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
