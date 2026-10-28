'use client';

import { useSettings } from '@/contexts/settings-context';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';

/**
 * <Price amount={30} per="day" /> → "€30 / day", figures in mono.
 * Client component (reads the store currency); in RSCs pass `currency` to formatMoney directly.
 */
export function Price({
	amount,
	per,
	from,
	className,
	strike,
}: {
	amount: number;
	per?: string;
	from?: boolean;
	className?: string;
	/** Previous price shown struck through (discounts) */
	strike?: number;
}) {
	const { currency } = useSettings();
	return (
		<span className={cn('t-num whitespace-nowrap', className)}>
			{from ? <span className="mr-1 font-sans text-[0.8em] text-mute">from</span> : null}
			{strike != null && strike > amount ? <s className="mr-1.5 text-mute">{formatMoney(strike, currency)}</s> : null}
			{formatMoney(amount, currency)}
			{per ? <span className="ml-0.5 font-sans text-[0.8em] text-mute"> / {per}</span> : null}
		</span>
	);
}
