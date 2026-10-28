'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { AuthSheet, FormError } from '@/components/site/auth-sheet';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

const emailSchema = z.string().min(1, 'Enter your email').email('That doesn’t look like an email address');

type Step = 'email' | 'choose' | 'code' | 'password';

/**
 * Sign in: email first, then a choice — a 6-digit code by email (the default, no password needed) or a password.
 */
export default function SignInPage() {
	return (
		<Suspense fallback={<AuthSheet number="AU-01" title="Sign in">{null}</AuthSheet>}>
			<SignInContent />
		</Suspense>
	);
}

function SignInContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get('callbackUrl') ?? '/account';

	const [step, setStep] = useState<Step>('email');
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	const goToChoose = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		const parsed = emailSchema.safeParse(email.trim());
		if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Enter a valid email');
		setStep('choose');
	};

	const sendCode = async () => {
		setError(null);
		setLoading(true);
		try {
			await fetch('/api/auth/request-login-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() }),
			});
			setCooldown(60);
			setCode('');
			setStep('code');
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const done = () => {
		router.push(callbackUrl);
		router.refresh();
	};

	const verifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (code.trim().length < 6) return setError('Enter the 6-digit code from your email.');
		setLoading(true);
		try {
			const result = await signIn('login-code', { email: email.trim(), code: code.trim(), redirect: false });
			if (result?.error) setError('That code is wrong or has expired. Try again or send a new one.');
			else done();
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const withPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (password.length < 6) return setError('Password must be at least 6 characters.');
		setLoading(true);
		try {
			const result = await signIn('credentials', { email: email.trim(), password, redirect: false });
			if (result?.error) setError('Email or password is wrong.');
			else done();
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const restart = () => {
		setError(null);
		setCode('');
		setPassword('');
		setStep('email');
	};

	const lead =
		step === 'code'
			? `We’ve emailed a 6-digit code to ${email}.`
			: step === 'choose'
				? 'How would you like to sign in?'
				: 'See your week, move a booking, add guests or lunch.';

	return (
		<AuthSheet
			number="AU-01"
			title={step === 'code' ? 'Check your email' : 'Sign in'}
			lead={lead}
			aside={
				<>
					No account yet? You don’t need one to book; we create it with your first booking.{' '}
					<Link href="/auth/sign-up" className="font-medium text-cobalt underline underline-offset-4">
						Create one now
					</Link>
					.
				</>
			}
		>
			{error ? <FormError>{error}</FormError> : null}

			{step === 'email' ? (
				<form onSubmit={goToChoose} className="flex flex-col gap-4" noValidate>
					<Field label="Email" htmlFor="email">
						<Input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.ie" />
					</Field>
					<Button type="submit" size="lg" fullWidth>
						Continue
					</Button>
				</form>
			) : null}

			{step === 'choose' ? (
				<div className="flex flex-col gap-3">
					<p className="t-num border border-line-strong bg-paper px-3 py-2 text-[0.875rem]">{email}</p>
					<button
						type="button"
						onClick={sendCode}
						disabled={loading}
						className="group flex items-start gap-4 border border-ink bg-sheet p-4 text-left hover:bg-wash/60 disabled:opacity-60"
					>
						<span className="t-label mt-0.5 border border-ink px-1.5 py-0.5">A</span>
						<span>
							<span className="block font-semibold group-hover:text-cobalt">Email me a sign-in code</span>
							<span className="text-[0.875rem] text-mute">Six digits, valid for ten minutes. No password needed.</span>
						</span>
					</button>
					<button type="button" onClick={() => setStep('password')} className="group flex items-start gap-4 border border-line-strong bg-sheet p-4 text-left hover:border-ink">
						<span className="t-label mt-0.5 border border-line-strong px-1.5 py-0.5">B</span>
						<span>
							<span className="block font-semibold group-hover:text-cobalt">Use my password</span>
							<span className="text-[0.875rem] text-mute">If you set one up before.</span>
						</span>
					</button>
					<button type="button" onClick={restart} className="self-start text-[0.875rem] text-mute underline underline-offset-4 hover:text-ink">
						Use a different email
					</button>
				</div>
			) : null}

			{step === 'code' ? (
				<form onSubmit={verifyCode} className="flex flex-col gap-4" noValidate>
					<Field label="6-digit code" htmlFor="code">
						<Input
							id="code"
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
							maxLength={6}
							value={code}
							onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
							placeholder="••••••"
							className="t-num h-14 text-center text-2xl tracking-[0.6em]"
						/>
					</Field>
					<Button type="submit" size="lg" fullWidth loading={loading}>
						Sign in
					</Button>
					<div className="flex items-center justify-between text-[0.875rem]">
						<button type="button" onClick={sendCode} disabled={cooldown > 0 || loading} className="text-cobalt underline underline-offset-4 disabled:text-faint disabled:no-underline">
							{cooldown > 0 ? `Send again in ${cooldown}s` : 'Send a new code'}
						</button>
						<button type="button" onClick={restart} className="text-mute underline underline-offset-4 hover:text-ink">
							Different email
						</button>
					</div>
				</form>
			) : null}

			{step === 'password' ? (
				<form onSubmit={withPassword} className="flex flex-col gap-4" noValidate>
					<p className="t-num border border-line-strong bg-paper px-3 py-2 text-[0.875rem]">{email}</p>
					<Field label="Password" htmlFor="password">
						<Input id="password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
					</Field>
					<Button type="submit" size="lg" fullWidth loading={loading}>
						Sign in
					</Button>
					<div className="flex items-center justify-between text-[0.875rem]">
						<Link href="/auth/forgot-password" className="text-mute underline underline-offset-4 hover:text-ink">
							Forgot password?
						</Link>
						<button type="button" onClick={sendCode} className="text-cobalt underline underline-offset-4">
							Email me a code instead
						</button>
					</div>
				</form>
			) : null}
		</AuthSheet>
	);
}
