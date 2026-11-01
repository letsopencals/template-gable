'use server';

import '@/lib/opencals';
import { AuthService, OpencalsApiError, type MagicLinkErrorCode, type MagicLinkErrorResponse } from '@opencals/storefront-sdk';
import { signIn } from '@/lib/auth';

export type ResolveLinkResult = {
	success: boolean;
	error?: string;
	errorCode?: MagicLinkErrorCode;
	redirectPath?: string;
};

/**
 * Resolves a magic-link token (`/link/{token}`). For most purposes the backend
 * returns session tokens and we sign the customer in; reset-password returns no
 * tokens and only a redirect path carrying the token as a query param.
 */
export async function resolveLink(token: string): Promise<ResolveLinkResult> {
	try {
		// The SDK's error interceptor throws OpencalsApiError, but depending on the
		// client's throwOnError config a failed call may instead resolve with a
		// populated `error`. Handle both so error classification always runs.
		const { data, error } = await AuthService.resolveLink({ query: { token } });
		if (error || !data) throw error ?? new Error('Invalid link');

		if (data.accessToken) {
			await signIn('magic-link', {
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				redirect: false,
			});
		}

		return { success: true, redirectPath: data.redirectPath };
	} catch (err) {
		const message =
			err && typeof err === 'object' && 'message' in err
				? String((err as { message: unknown }).message)
				: 'Invalid link';
		return { success: false, error: message, errorCode: linkErrorCode(err, message) };
	}
}

/** Every `code` the API sends for a bad link; anything else counts as invalid. */
const LINK_ERROR_CODES: Record<MagicLinkErrorCode, true> = { TOKEN_INVALID: true, TOKEN_USED: true, TOKEN_EXPIRED: true };

/** The API's `code` for the failure. Older APIs only said it in the message, so that stays as the fallback. */
function linkErrorCode(err: unknown, message: string): MagicLinkErrorCode {
	const body = (err instanceof OpencalsApiError ? err.body : err) as Partial<MagicLinkErrorResponse> | null | undefined;
	const code = body?.code;
	if (code && Object.hasOwn(LINK_ERROR_CODES, code)) return code;
	if (message.includes('expired')) return 'TOKEN_EXPIRED';
	if (message.includes('used')) return 'TOKEN_USED';
	return 'TOKEN_INVALID';
}
