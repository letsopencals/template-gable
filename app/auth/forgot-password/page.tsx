'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/schemas';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { AuthSheet } from '@/components/site/auth-sheet';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function ForgotPasswordPage() {
	const [sent, setSent] = useState(false);
	const form = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });
	const { submit, isSubmitting } = useFormSubmit(form, { url: '/api/auth/forgot-password' });
	const errors = form.formState.errors;

	const onSubmit = async (data: ForgotPasswordFormValues) => {
		await submit({ email: data.email });
		setSent(true);
	};

	return (
		<AuthSheet
			number="AU-03"
			title={sent ? 'Check your email' : 'Reset your password'}
			lead={sent ? `If ${form.getValues('email')} has an account, a reset link is on its way.` : 'We’ll email you a link to set a new one.'}
			aside={
				<Link href="/auth/sign-in" className="font-medium text-cobalt underline underline-offset-4">
					← Back to sign in (or use a code instead)
				</Link>
			}
		>
			{sent ? (
				<Button variant="outline" onClick={() => form.handleSubmit(onSubmit)()} loading={isSubmitting}>
					Send it again
				</Button>
			) : (
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
					<Field label="Email" htmlFor="email" error={errors.email?.message}>
						<Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
					</Field>
					<Button type="submit" size="lg" fullWidth loading={isSubmitting}>
						Send reset link
					</Button>
				</form>
			)}
		</AuthSheet>
	);
}
