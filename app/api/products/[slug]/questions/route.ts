import '@/lib/opencals';
import { CheckoutQuestionService, ProductService, type LanguageCode } from '@opencals/storefront-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const language = (request.nextUrl.searchParams.get('language') ?? 'en') as LanguageCode;

	try {
		const { data: product } = await ProductService.getBySlug({ path: { slug } });
		if (!product) return NextResponse.json([]);

		const { data: questions } = await CheckoutQuestionService.listTranslations({
			path: { productId: product.id, language },
		});
		return NextResponse.json(questions ?? []);
	} catch (err) {
		return handleApiError(err);
	}
}
