import '@/lib/opencals';
import { CheckoutService } from '@opencals/storefront-sdk';
import { getAccessToken } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

/** Save checkout-question answers on the cart. Body: `{ answers: { questionId, question, answer }[] }`. */
export async function POST(request: NextRequest) {
	try {
		const { answers } = (await request.json()) as { answers?: { questionId: string; question: string; answer: string }[] };
		const token = await getAccessToken();
		await CheckoutService.saveAnswers({
			body: { answers: (answers ?? []).filter((a) => a.questionId && a.answer?.trim()) },
			headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Cart-Id': request.headers.get('X-Cart-Id') ?? '' } as never,
			throwOnError: true,
		});
		return NextResponse.json({ ok: true });
	} catch (err) {
		return handleApiError(err);
	}
}
