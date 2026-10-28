'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthSheet } from '@/components/site/auth-sheet';
import { ButtonLink, Spinner } from '@/components/ui/button';
import { resolveLink, type ResolveLinkResult } from '@/app/auth/actions/resolve-link';

const ERROR_COPY: Record<NonNullable<ResolveLinkResult['errorCode']>, { title: string; message: string }> = {
	TOKEN_EXPIRED: { title: 'Link Expired', message: 'This link has expired. Please request a new one.' },
	TOKEN_USED: { title: 'Link Already Used', message: 'This link has already been used.' },
	TOKEN_INVALID: { title: 'Invalid Link', message: 'This link is invalid or could not be found.' },
};

/**
 * The backend emits `/account/appointments/{id}/view(?action=...)`, but this
 * template's detail route is `/account/appointments/{id}`. Strip the trailing
 * `/view` segment while preserving any query string (e.g. `?action=cancel`).
 */
function normalizeRedirect(path: string): string {
	return path.replace(/^(\/account\/appointments\/[^/]+)\/view/, '$1');
}

export default function LinkPage() {
	const router = useRouter();
	const params = useParams<{ token: string }>();
	const token = params?.token;

	const [status, setStatus] = useState<'resolving' | 'error'>('resolving');
	const [errorCode, setErrorCode] = useState<NonNullable<ResolveLinkResult['errorCode']>>('TOKEN_INVALID');
	const ranRef = useRef(false);

	useEffect(() => {
		if (!token || ranRef.current) return;
		ranRef.current = true;

		(async () => {
			const result = await resolveLink(token);
			if (result.success && result.redirectPath) {
				router.replace(normalizeRedirect(result.redirectPath));
				router.refresh();
			} else {
				setErrorCode(result.errorCode ?? 'TOKEN_INVALID');
				setStatus('error');
			}
		})();
	}, [token, router]);

	return (
		<AuthSheet number="AU-09" title={status === 'error' ? ERROR_COPY[errorCode].title : 'Signing you in'}>
			{status === 'resolving' ? (
				<p className="flex items-center gap-3 text-mute">
					<Spinner /> Checking your link…
				</p>
			) : (
				<div className="flex flex-col items-start gap-6">
					<p className="text-mute">{ERROR_COPY[errorCode].message}</p>
					<ButtonLink href="/auth/sign-in">Sign in with a code</ButtonLink>
				</div>
			)}
		</AuthSheet>
	);
}
