'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormValues } from '@/lib/schemas';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { AuthSheet, FormError } from '@/components/site/auth-sheet';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function SignUpPage() {
	const router = useRouter();
	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { email: '', password: '', firstName: '', lastName: '' },
	});
	const { submit, isSubmitting, error } = useFormSubmit(form, { url: '/api/auth/sign-up' });
	const errors = form.formState.errors;

	const onSubmit = async (data: SignUpFormValues) => {
		const result = await submit({ email: data.email, password: data.password, first_name: data.firstName, last_name: data.lastName || undefined });
		if (result !== null) router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
	};

	return (
		<AuthSheet
			number="AU-02"
			title="Create an account"
			lead="Book faster next time, keep a week board of your bookings and manage guests."
			aside={
				<>
					Already have one?{' '}
					<Link href="/auth/sign-in" className="font-medium text-cobalt underline underline-offset-4">
						Sign in
					</Link>
				</>
			}
		>
			{error ? <FormError>{error}</FormError> : null}
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
				<div className="grid gap-4 sm:grid-cols-2">
					<Field label="First name" htmlFor="firstName" error={errors.firstName?.message}>
						<Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...form.register('firstName')} />
					</Field>
					<Field label="Last name" htmlFor="lastName" optional error={errors.lastName?.message}>
						<Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
					</Field>
				</div>
				<Field label="Email" htmlFor="email" error={errors.email?.message}>
					<Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register('email')} />
				</Field>
				<Field label="Password" htmlFor="password" hint="At least 8 characters." error={errors.password?.message}>
					<Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register('password')} />
				</Field>
				<Button type="submit" size="lg" fullWidth loading={isSubmitting}>
					Create account
				</Button>
			</form>
		</AuthSheet>
	);
}
