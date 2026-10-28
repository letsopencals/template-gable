/** Money in the store currency (EUR for the seeded Irish store). Whole amounts drop the cents. Safe on server and client. */
export function formatMoney(amount: number, currency = 'EUR'): string {
	const whole = Math.round(amount * 100) % 100 === 0;
	return new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency,
		minimumFractionDigits: whole ? 0 : 2,
		maximumFractionDigits: 2,
	}).format(amount);
}
