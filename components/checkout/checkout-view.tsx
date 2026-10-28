'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Price } from '@/components/ui/price';
import { SheetStrip } from '@/components/ui/sheet';
import { DaySheet } from '@/components/day-sheet/day-sheet';
import { useDaySheet } from '@/hooks/use-day-sheet';
import { useCheckout } from '@/hooks/use-checkout';
import { useSettings } from '@/contexts/settings-context';
import type { Catalogue } from '@/lib/workspace';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

const StripePayment = dynamic(() => import('@/components/checkout/stripe-payment').then((m) => m.StripePayment), {
	ssr: false,
	loading: () => <div className="hatch-light h-40 border border-line" aria-hidden />,
});

/**
 * /checkout — one form for the whole day sheet: who's booking, the house's questions, a code, how to pay. The day
 * sheet stays on the right with the total (on phones the total and the confirm button sit at the bottom).
 */
export function CheckoutView({ cat }: { cat: Catalogue }) {
	const sheet = useDaySheet(cat);
	const c = useCheckout(sheet.bookings);
	const { settings, currency } = useSettings();
	const marketing = settings?.checkoutSettings?.emailMarketingOptIn;
	const phoneReq = settings?.checkoutSettings?.customerPhoneRequirement;
	const [code, setCode] = useState('');

	if (!sheet.count) {
		return (
			<div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-6 lg:px-10">
				<SheetStrip number="GA-300" title="Checkout" />
				<div className="drafting-grid mt-8 border border-line-strong px-6 py-16 text-center">
					<h1 className="t-h2">Your day sheet is empty</h1>
					<p className="t-lead mx-auto mt-3 max-w-md">Holds last 15 minutes. If yours ran out, the spaces are probably still free: plan the day again.</p>
					<Link href="/book" className={cn(buttonClasses('primary', 'lg'), 'mt-6')}>
						Plan your day
					</Link>
				</div>
			</div>
		);
	}

	const card = c.chosen?.checkoutMode === 'internal' || c.chosen?.checkoutMode === 'redirect';
	const confirmLabel = card ? `Continue to payment` : sheet.total > 0 ? 'Confirm, pay at the house' : 'Confirm booking';
	const set = (k: keyof typeof c.details) => (e: React.ChangeEvent<HTMLInputElement>) => c.setDetails({ ...c.details, [k]: k === 'marketing' ? e.target.checked : e.target.value });

	return (
		<div className="mx-auto max-w-[1360px] px-4 pb-32 sm:px-6 lg:px-10 lg:pb-24">
			<SheetStrip number="GA-300" title="Checkout" note={`${sheet.count} ${sheet.count === 1 ? 'booking' : 'bookings'}`} />
			<div className="grid grid-cols-[minmax(0,1fr)] gap-10 pt-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
				<form
					id="checkout"
					className="flex min-w-0 flex-col gap-10"
					onSubmit={(e) => {
						e.preventDefault();
						void c.confirm();
					}}
				>
					<header>
						<h1 className="t-h1">Check out your day</h1>
						<p className="t-lead mt-2">One booking for everything on the sheet. Confirmation and calendar invites go to your email.</p>
					</header>

					<Step n="01" title="Who’s booking" aside={c.signedIn ? <span className="text-[0.8125rem] text-mute">Signed in</span> : <Link href="/auth/sign-in?callbackUrl=/checkout" className="text-[0.8125rem] font-medium text-cobalt underline underline-offset-4">Have an account? Sign in</Link>}>
						<div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
							<Field label="Email" htmlFor="co-email" className="sm:col-span-2" hint="Your confirmation, invoice and the calendar file go here.">
								<Input id="co-email" type="email" autoComplete="email" required value={c.details.email} onChange={set('email')} readOnly={c.signedIn} />
							</Field>
							<Field label="First name" htmlFor="co-first">
								<Input id="co-first" autoComplete="given-name" required value={c.details.firstName} onChange={set('firstName')} />
							</Field>
							<Field label="Last name" htmlFor="co-last" optional>
								<Input id="co-last" autoComplete="family-name" value={c.details.lastName} onChange={set('lastName')} />
							</Field>
							{phoneReq !== 'hidden' ? (
								<Field label="Phone" htmlFor="co-phone" optional={phoneReq !== 'required'} hint="Only if reception needs to reach you on the day.">
									<Input id="co-phone" type="tel" autoComplete="tel" required={phoneReq === 'required'} value={c.details.phone} onChange={set('phone')} />
								</Field>
							) : null}
							{marketing && marketing !== 'dont_show' && !c.signedIn ? (
								<label className="flex items-start gap-2.5 text-[0.875rem] sm:col-span-2">
									<input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-cobalt)]" checked={c.details.marketing} onChange={set('marketing')} />
									<span>Send me the monthly house letter: new rooms, events and the odd free day pass.</span>
								</label>
							) : null}
						</div>
					</Step>

					{c.questions.length ? (
						<Step n="02" title="For the house">
							<div className="grid grid-cols-[minmax(0,1fr)] gap-4">
								{c.questions.map((q) => (
									<Field key={q.id} label={c.titleOf(q)} htmlFor={`q-${q.id}`} optional={!q.required} hint={q.translations?.[0]?.description ?? undefined}>
										<Input id={`q-${q.id}`} required={q.required} value={c.answers[q.id] ?? ''} onChange={(e) => c.setAnswers({ ...c.answers, [q.id]: e.target.value })} />
									</Field>
								))}
							</div>
						</Step>
					) : null}

					<Step n={c.questions.length ? '03' : '02'} title="Discount code">
						{sheet.code ? (
							<div className="flex items-center justify-between gap-3 border border-free bg-free-wash px-3 py-2.5">
								<span className="t-num text-[0.875rem] text-free">{sheet.code} applied</span>
								<button type="button" onClick={() => void c.removeCode()} className="text-[0.8125rem] font-medium underline underline-offset-2">
									Remove
								</button>
							</div>
						) : (
							<div className="flex gap-2">
								<Input aria-label="Discount code" placeholder="e.g. GABLETEAM" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="t-num uppercase" />
								<Button variant="outline" onClick={() => void c.applyCode(code)} loading={c.codeBusy} disabled={!code.trim()}>
									Apply
								</Button>
							</div>
						)}
						{c.codeError ? (
							<p role="alert" className="mt-2 text-[0.8125rem] text-alert">
								{c.codeError}
							</p>
						) : null}
					</Step>

					<Step n={c.questions.length ? '04' : '03'} title="How you’ll pay">
						<div role="radiogroup" aria-label="Payment" className="flex flex-col border border-line-strong">
							{c.providers.map((p) => (
								<label key={p.name} className={cn('flex cursor-pointer items-start gap-3 border-b border-line-strong px-4 py-3 last:border-b-0', c.provider === p.name && 'bg-wash/60')}>
									<input type="radio" name="provider" className="mt-1 h-4 w-4 accent-[var(--color-cobalt)]" checked={c.provider === p.name} onChange={() => c.setProvider(p.name)} />
									<span>
										<span className="block font-medium">{p.displayName}</span>
										{p.description ? <span className="block text-[0.8125rem] text-mute">{p.description}</span> : null}
									</span>
								</label>
							))}
							{!c.providers.length ? <p className="px-4 py-3 text-[0.875rem] text-mute">Loading payment options…</p> : null}
						</div>
						{c.payment?.clientSecret ? (
							<div className="mt-5">
								<StripePayment
									clientSecret={c.payment.clientSecret}
									stripeAccountId={c.payment.stripeAccountId}
									publishableKey={c.payment.publishableKey}
									label={`Pay ${formatMoney(sheet.total, currency)} and confirm`}
									onSuccess={(id) => void c.onCardPaid(id)}
									onError={c.setError}
								/>
							</div>
						) : null}
					</Step>

					{c.error ? (
						<p role="alert" className="border-l-2 border-alert bg-sheet px-4 py-3 text-[0.9375rem]">
							{c.error}
						</p>
					) : null}

					{!c.payment?.clientSecret ? (
						<div className="hidden flex-col gap-2 lg:flex">
							<Button type="submit" size="lg" fullWidth loading={c.submitting} disabled={!c.valid || !c.provider}>
								{confirmLabel} · <Price amount={sheet.total} />
							</Button>
							{!c.valid ? <p className="text-center text-[0.8125rem] text-mute">Add your email and first name to confirm.</p> : null}
						</div>
					) : null}
					<p className="text-[0.8125rem] text-mute">
						By confirming you agree to the <Link href="/terms" className="underline">house terms</Link>. Cancel free up to an hour before (two days for event spaces) from your bookings page.
					</p>
				</form>

				<aside aria-label="Day sheet" className="order-first lg:order-none">
					<div className="lg:sticky lg:top-[8.75rem]">
						<DaySheet cat={cat} sheet={sheet} showCheckout={false} />
						<Link href="/book" className="mt-3 inline-block text-[0.875rem] font-medium text-cobalt underline underline-offset-4">
							← Add more to the day
						</Link>
					</div>
				</aside>
			</div>

			{!c.payment?.clientSecret ? (
				<div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-sheet px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden">
					<div className="flex items-center gap-3">
						<div className="flex-1">
							<span className="t-label block text-mute">Total</span>
							<Price amount={sheet.total} className="text-[1.125rem] font-medium" />
						</div>
						<Button type="submit" form="checkout" loading={c.submitting} disabled={!c.valid || !c.provider}>
							{card ? 'Continue' : 'Confirm'}
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

function Step({ n, title, aside, children }: { n: string; title: string; aside?: ReactNode; children: ReactNode }) {
	return (
		<section aria-labelledby={`step-${n}`} className="flex flex-col gap-4">
			<div className="flex items-stretch border-b border-ink">
				<span className="t-label flex items-center border-r border-ink pr-3 font-semibold">{n}</span>
				<h2 id={`step-${n}`} className="flex-1 py-2 pl-3 font-display text-xl font-semibold">
					{title}
				</h2>
				{aside ? <div className="flex items-center">{aside}</div> : null}
			</div>
			{children}
		</section>
	);
}
