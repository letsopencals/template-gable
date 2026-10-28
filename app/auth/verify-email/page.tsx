'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSheet } from '@/components/site/auth-sheet';
import { Button, ButtonLink, Spinner } from '@/components/ui/button';

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<AuthSheet number="AU-05" title="Verify your email">{null}</AuthSheet>}>
			<VerifyEmailContent />
		</Suspense>
	);
}

function VerifyEmailContent() {
	const router = useRouter();
	const params = useSearchParams();
	const token = params.get('token');
	const email = params.get('email');
	const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>(token ? 'verifying' : 'pending');
	const [resending, setResending] = useState(false);
	const [resent, setResent] = useState(false);
	const ran = useRef(false);

	useEffect(() => {
		if (!token || ran.current) return;
		ran.current = true;
		(async () => {
			try {
				const result = await signIn('verify-token', { token, redirect: false });
				if (result?.error) return setStatus('error');
				setStatus('success');
				setTimeout(() => {
					router.push('/account');
					router.refresh();
				}, 1500);
			} catch {
				setStatus('error');
			}
		})();
	}, [token, router]);

	const resend = async () => {
		if (!email || resending) return;
		setResending(true);
		try {
			// Signing up again with the same email re-sends the verification email; it doesn't create a second account.
			await fetch('/api/auth/sign-up', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: '' }) });
		} finally {
			setResent(true);
			setResending(false);
		}
	};

	if (status === 'verifying') {
		return (
			<AuthSheet number="AU-05" title="Verifying your email">
				<p className="flex items-center gap-3 text-mute">
					<Spinner /> One moment…
				</p>
			</AuthSheet>
		);
	}
	if (status === 'success') {
		return <AuthSheet number="AU-05" title="Email verified" lead="Taking you to your bookings…">{null}</AuthSheet>;
	}
	if (status === 'error') {
		return (
			<AuthSheet number="AU-05" title="That link didn’t work" lead="It may have expired. Sign in with a code instead; it verifies your email too.">
				<ButtonLink href="/auth/sign-in">Sign in with a code</ButtonLink>
			</AuthSheet>
		);
	}
	return (
		<AuthSheet
			number="AU-05"
			title="Check your email"
			lead={
				<>
					We’ve sent a verification link to <strong className="text-ink">{email ?? 'your inbox'}</strong>. Open it on this device to finish.
				</>
			}
		>
			{email ? (
				<Button variant="outline" onClick={resend} loading={resending} disabled={resent}>
					{resent ? 'Sent again' : 'Send the link again'}
				</Button>
			) : null}
		</AuthSheet>
	);
}
