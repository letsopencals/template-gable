import '@/lib/opencals';
import { CheckoutService } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

/** Attach the customer to the cart (before start/submit). Body: `{ customer: NewOrderCustomer | ExistingOrderCustomer }`. */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const token = await getAccessToken();
		const { data } = await CheckoutService.saveCustomer({
			body,
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': request.headers.get('X-Cart-Id') ?? '' } as never,
			throwOnError: true,
		});
		return NextResponse.json(data ?? { ok: true });
	} catch (err) {
		return handleApiError(err);
	}
}
