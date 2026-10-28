import '@/lib/opencals';
import { CartService, OpencalsApiError } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

const MESSAGES: Record<string, string> = {
	CODE_NOT_FOUND: 'We don’t recognise that code.',
	CODE_EXPIRED: 'That code has expired.',
	CODE_DISABLED: 'That code is no longer active.',
	CODE_LIMIT_REACHED: 'That code has been used up.',
	CODE_CUSTOMER_INELIGIBLE: 'That code isn’t available on this account.',
	CODE_NO_MATCHING_ITEMS: 'That code doesn’t apply to anything on your day sheet.',
	CODE_NO_CREDIT: 'There’s no credit left on that code.',
	minimum_requirement_not_met: 'Your day sheet doesn’t meet that code’s minimum yet.',
};

async function headers(request: NextRequest) {
	const token = await getAccessToken();
	return { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': request.headers.get('X-Cart-Id') ?? '' };
}

/** Apply a discount code to the cart; a 400 comes back with a friendly `error`. */
export async function POST(request: NextRequest) {
	try {
		const { code } = (await request.json()) as { code?: string };
		if (!code?.trim()) return NextResponse.json({ error: 'Enter a code' }, { status: 400 });
		const { data } = await CartService.applyCode({ body: { code: code.trim() }, headers: await headers(request), throwOnError: true });
		return NextResponse.json(data);
	} catch (err) {
		if (err instanceof OpencalsApiError && err.status === 400) {
			return NextResponse.json({ error: (err.code && MESSAGES[err.code]) || err.message || 'That code didn’t work.' }, { status: 400 });
		}
		return handleApiError(err);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { data } = await CartService.removeCode({ headers: await headers(request), throwOnError: true });
		return NextResponse.json(data);
	} catch (err) {
		return handleApiError(err);
	}
}
