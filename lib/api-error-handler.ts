import { OpencalsApiError } from '@opencals/storefront-sdk';
import { NextResponse } from 'next/server';

/** Error JSON every /api route answers with. `code`, `orderId` and `paymentStatus` come from the API when it sends them. */
export interface ApiErrorBody {
	error: string;
	errors?: Record<string, string>;
	code?: string;
	orderId?: string;
	paymentStatus?: string;
}

export function handleApiError(err: unknown, fallbackMessage = 'Internal server error') {
	if (err instanceof OpencalsApiError) {
		// 409 CART_ALREADY_CHECKED_OUT carries the order it became, 402 PAYMENT_NOT_AUTHORIZED the card's status.
		const orderId = typeof err.body?.orderId === 'string' ? err.body.orderId : undefined;
		const paymentStatus = typeof err.body?.paymentStatus === 'string' ? err.body.paymentStatus : undefined;
		const fieldErrors = err.toFieldErrors();
		const body: ApiErrorBody = {
			error: err.message,
			...(Object.keys(fieldErrors).length > 0 && { errors: fieldErrors }),
			...(err.code && { code: err.code }),
			...(orderId && { orderId }),
			...(paymentStatus && { paymentStatus }),
		};
		return NextResponse.json(body, { status: err.status });
	}

	console.error(fallbackMessage, err);
	return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
