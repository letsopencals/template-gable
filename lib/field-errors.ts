import type { OpencalsApiError } from '@opencals/storefront-sdk';

/** Phones are saved in international format, so ask for the country code up front (and check it before sending). */
export const PHONE_HINT = 'Include the country code, e.g. +353 87 123 4567.';

/** One failing field from an API 400: `property` is the full dotted path of the request body (`customer.email`). */
export type ApiFieldError = NonNullable<OpencalsApiError['errors']>[number];

/** `first_name` → `firstName`, so snake-case request bodies map onto camelCase form fields. */
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * Sorts the API's field errors onto the form's own fields. Each `property` is tried from its full path down to its
 * last segment (`customer.billingAddress.phone` → `billingAddress.phone` → `phone`), so `customer.email` and `email`
 * both land on the `email` field. Whatever matches no field comes back in `unmapped` for the generic banner.
 */
export function mapFieldErrors<K extends string>(
	errors: readonly ApiFieldError[] | null | undefined,
	fields: readonly K[],
): { mapped: Partial<Record<K, string>>; unmapped: ApiFieldError[] } {
	const mapped: Partial<Record<K, string>> = {};
	const unmapped: ApiFieldError[] = [];
	for (const err of errors ?? []) {
		const parts = err.property.split('.');
		let field: K | undefined;
		for (let i = 0; i < parts.length && !field; i++) {
			const path = parts.slice(i).join('.');
			field = fields.find((f) => f === path || f === camel(path));
		}
		if (field) mapped[field] = [mapped[field], ...err.messages].filter(Boolean).join(' ');
		else unmapped.push(err);
	}
	return { mapped, unmapped };
}
