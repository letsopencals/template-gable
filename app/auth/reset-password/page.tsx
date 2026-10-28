'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/schemas';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { AuthSheet, FormError } from '@/components/site/auth-sheet';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={<AuthSheet number="AU-04" title="Set a new password">{null}</AuthSheet>}>
			<ResetPasswordContent />
		</Suspense>
	);
}

function ResetPasswordContent() {
	const router = useRouter();
	const token = useSearchParams().get('token') ?? '';
	const [success, setSuccess] = useState(false);
	const form = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });
	const { submit, isSubmitting, error } = useFormSubmit(form, { url: '/api/auth/reset-password' });
	const errors = form.formState.errors;

	if (!token) {
		return (
			<AuthSheet number="AU-04" title="This link is incomplete" lead="The reset link is missing its token. Ask for a new one.">
				<ButtonLink href="/auth/forgot-password">Request a new link</ButtonLink>
			</AuthSheet>
		);
	}

	const onSubmit = async (data: ResetPasswordFormValues) => {
		const result = await submit({ token, new_password: data.password });
		if (result !== null) {
			setSuccess(true);
			setTimeout(() => router.push('/auth/sign-in'), 2500);
		}
	};

	return (
		<AuthSheet
			number="AU-04"
			title={success ? 'Password changed' : 'Set a new password'}
			lead={success ? 'Taking you to sign in…' : undefined}
			aside={
				<Link href="/auth/sign-in" className="font-medium text-cobalt underline underline-offset-4">
					← Back to sign in
				</Link>
			}
		>
			{success ? null : (
				<>
					{error ? <FormError>{error}</FormError> : null}
					<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
						<Field label="New password" htmlFor="password" error={errors.password?.message}>
							<Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
						</Field>
						<Field label="Repeat it" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
							<Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...form.register('confirmPassword')} />
						</Field>
						<Button type="submit" size="lg" fullWidth loading={isSubmitting}>
							Save password
						</Button>
					</form>
				</>
			)}
		</AuthSheet>
	);
}
