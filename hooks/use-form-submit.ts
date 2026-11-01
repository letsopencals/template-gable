'use client';

import { useEffect, useMemo } from 'react';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { mapFieldErrors } from '@/lib/field-errors';
import { useApiRequest } from './use-api-request';

interface UseFormSubmitOptions<TData> {
	url: string;
	method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	headers?: Record<string, string>;
	onSuccess?: (data: TData) => void;
}

interface UseFormSubmitResult<TData> {
	submit: (body: unknown) => Promise<TData | null>;
	isSubmitting: boolean;
	error: string | null;
	clearError: () => void;
}

export function useFormSubmit<TFormValues extends FieldValues, TData = unknown>(
	form: UseFormReturn<TFormValues>,
	options: UseFormSubmitOptions<TData>,
): UseFormSubmitResult<TData> {
	const { url, method = 'POST', headers, onSuccess } = options;

	const request = useApiRequest<TData>(url, {
		method,
		headers,
		autoFetch: false,
		onSuccess,
	});

	// The API's field errors, sorted onto this form's fields (`first_name` / `customer.firstName` → `firstName`).
	const { mapped, unmapped } = useMemo(
		() => mapFieldErrors(request.fieldErrors, Object.keys(form.getValues()) as FieldPath<TFormValues>[]),
		[request.fieldErrors, form],
	);

	useEffect(() => {
		const entries = Object.entries(mapped) as [FieldPath<TFormValues>, string][];
		entries.forEach(([field, message], i) => form.setError(field, { type: 'server', message }, { shouldFocus: i === 0 }));
	}, [mapped, form]);

	// The banner is only for errors no field shows.
	const allMapped = !!request.fieldErrors?.length && unmapped.length === 0;

	return {
		submit: request.execute,
		isSubmitting: request.loading,
		error: allMapped ? null : request.error,
		clearError: request.reset,
	};
}
