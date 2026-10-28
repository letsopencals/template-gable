'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import type { Booking } from '@/lib/booking';

/**
 * Invite people to a booked room by email (they get the confirmation and a calendar invite). Needs the signed-in
 * owner: checkout signs the customer in, so this works on the confirmation and in the account. `onAdded` lets the
 * parent refresh its list.
 */
export function InviteGuests({ booking, onAdded, preview }: { booking: Booking; onAdded?: (email: string) => void; preview?: boolean }) {
	const [email, setEmail] = useState('');
	const [added, setAdded] = useState<string[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const max = booking.space?.maxGuests ?? 0;
	const count = booking.guests.length + added.length;
	const full = max > 0 && count >= max;
	const valid = /.+@.+\..+/.test(email.trim());
	const add = async () => {
		if (!valid || full) return;
		setBusy(true);
		setError(null);
		try {
			if (!preview) {
				const res = await fetch(`/api/account/appointments/${booking.id}/guests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
				if (!res.ok) {
					const d = await res.json().catch(() => null);
					throw new Error(res.status === 401 ? 'Sign in to invite people.' : (d?.error ?? 'Couldn’t send the invite.'));
				}
			}
			setAdded((a) => [...a, email.trim()]);
			onAdded?.(email.trim());
			setEmail('');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Couldn’t send the invite.');
		} finally {
			setBusy(false);
		}
	};
	const everyone = [...booking.guests.map((g) => g.email), ...added];
	return (
		<div className="flex flex-col gap-2">
			{everyone.length ? (
				<ul className="flex flex-wrap gap-1.5" aria-label="Invited">
					{everyone.map((g) => (
						<li key={g} className="border border-line-strong bg-sheet px-2 py-0.5 text-[0.8125rem]">
							{g}
						</li>
					))}
				</ul>
			) : null}
			<div className="flex gap-2">
				<Input
					type="email"
					inputMode="email"
					aria-label={`Invite someone to ${booking.name}`}
					placeholder="name@company.ie"
					value={email}
					disabled={full}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							void add();
						}
					}}
				/>
				<Button variant="outline" onClick={() => void add()} loading={busy} disabled={!valid || full}>
					Invite
				</Button>
			</div>
			<p className="text-[0.75rem] text-mute">{full ? `${booking.name} is full: ${max + 1} people including you.` : `${count + 1} of ${max + 1} seats. Invitees get the calendar invite.`}</p>
			{error ? (
				<p role="alert" className="text-[0.8125rem] text-alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
