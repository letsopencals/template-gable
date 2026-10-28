import '@/lib/opencals';
import { CheckoutService } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

/** The checkout questions for everything on the cart, deduplicated by the API. */
export async function GET(request: NextRequest) {
	const cartId = request.headers.get('X-Cart-Id') ?? '';
	if (!cartId) return NextResponse.json([]);
	try {
		const token = await getAccessToken();
		const { data } = await CheckoutService.getCartQuestions({
			path: { language: 'en' },
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': cartId } as never,
			throwOnError: true,
		});
		return NextResponse.json(data ?? []);
	} catch (err) {
		return handleApiError(err);
	}
}
