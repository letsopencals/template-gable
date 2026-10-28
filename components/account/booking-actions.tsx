'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import type { CurrentAvailabilitySlot } from '@opencals/storefront-sdk';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { DateStrip } from '@/components/planner/date-strip';
import { TimeChips } from '@/components/planner/time-chips';
import { InviteGuests } from '@/components/confirmation/invite-guests';
import { useDaySheet } from '@/hooks/use-day-sheet';
import { revalidateHouseAvailability } from '@/hooks/use-house-availability';
import type { Booking } from '@/lib/booking';
import { formatLength, priceFor, type Catalogue } from '@/lib/workspace';
import { at, localDay, nextDays, nowMin, todayIn, toSlot } from '@/lib/workspace-time';

export type ActionKind = 'reschedule' | 'cancel' | 'invite' | 'extend';

const slotStart = (s: CurrentAvailabilitySlot) => Math.round(Date.parse(`${s.fromDate}T${s.fromTime}Z`) / 60000);

/** One dialog per action on a booking. `preview` renders everything but never writes. */
export function BookingActionDialog({
	cat,
	booking,
	action,
	onClose,
	onDone,
	preview,
}: {
	cat: Catalogue;
	booking: Booking;
	action: ActionKind;
	onClose: () => void;
	onDone: () => void;
	preview?: boolean;
}) {
	const titles: Record<ActionKind, string> = { reschedule: `Change time · ${booking.name}`, cancel: `Cancel ${booking.name}?`, invite: `Invite people · ${booking.name}`, extend: `Stay longer in ${booking.name}` };
	const numbers: Record<ActionKind, string> = { reschedule: 'AC-02', cancel: 'AC-03', invite: 'AC-04', extend: 'AC-05' };
	return (
		<Dialog open onClose={onClose} title={titles[action]} number={numbers[action]}>
			<div className="p-5">
				{action === 'reschedule' ? <Reschedule booking={booking} onDone={onDone} preview={preview} /> : null}
				{action === 'cancel' ? <Cancel booking={booking} onDone={onDone} onClose={onClose} preview={preview} /> : null}
				{action === 'invite' ? <InviteGuests booking={booking} preview={preview} onAdded={() => onDone()} /> : null}
				{action === 'extend' ? <Extend cat={cat} booking={booking} preview={preview} /> : null}
			</div>
		</Dialog>
	);
}

/** Same space, same length, another time: the day strip right above the start chips. */
function Reschedule({ booking: b, onDone, preview }: { booking: Booking; onDone: () => void; preview?: boolean }) {
	const tz = b.house?.tz ?? 'Europe/Dublin';
	const today = todayIn(tz);
	const days = useMemo(() => nextDays(today, 14), [today]);
	const [date, setDate] = useState(() => localDay(Math.max(b.start, nowMin()), tz));
	const [start, setStart] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const key = b.space
		? `/api/availability?${new URLSearchParams({ productId: b.space.id, date, timezone: tz, locationId: b.space.houseId, duration: String(b.minutes * 60), excludeAppointmentId: b.id })}`
		: null;
	const { data, isLoading } = useSWR<CurrentAvailabilitySlot[]>(key, (u: string) => fetch(u).then((r) => (r.ok ? r.json() : [])), { revalidateOnFocus: false });
	const starts = useMemo(() => [...new Set((data ?? []).filter((s) => (s.maxAttendees ?? 1) - (s.attendees ?? 0) >= (b.space?.shared ? b.seats : 1)).map(slotStart))].filter((s) => s > nowMin()).sort((x, y) => x - y), [data, b]);
	const save = async () => {
		if (start === null || !b.space) return;
		setBusy(true);
		setError(null);
		try {
			if (!preview) {
				const slot = toSlot(b.space, start, b.minutes);
				const res = await fetch(`/api/account/appointments/${b.id}/reschedule`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot }) });
				if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'That time was just taken. Pick another.');
				revalidateHouseAvailability();
			}
			onDone();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Couldn’t move it.');
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="flex flex-col gap-5">
			<p className="text-[0.9375rem] text-mute">
				Now {at(b.start, tz, 'ddd D MMM, HH:mm')}–{at(b.end, tz, 'HH:mm')}. Same space, same length ({formatLength(b.minutes).toLowerCase()}); extras and invitees move with it.
			</p>
			<div className="flex flex-col gap-1.5">
				<span className="t-label text-mute">Day</span>
				<DateStrip days={days} value={date} onChange={(d) => { setDate(d); setStart(null); }} open={null} today={today} />
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="t-label text-mute">New start</span>
				{isLoading ? <div className="hatch-light h-16 border border-line" aria-label="Checking times" /> : <TimeChips starts={starts} value={start} onChange={setStart} tz={tz} empty="Nothing free that day for this length." />}
			</div>
			{error ? <p role="alert" className="text-[0.875rem] text-alert">{error}</p> : null}
			<Button size="lg" fullWidth onClick={save} loading={busy} disabled={start === null}>
				{start === null ? 'Pick a new time' : `Move to ${at(start, tz, 'ddd D MMM, HH:mm')}`}
			</Button>
		</div>
	);
}

function Cancel({ booking: b, onDone, onClose, preview }: { booking: Booking; onDone: () => void; onClose: () => void; preview?: boolean }) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const tz = b.house?.tz ?? 'Europe/Dublin';
	const go = async () => {
		setBusy(true);
		setError(null);
		try {
			if (!preview) {
				const res = await fetch(`/api/account/appointments/${b.id}/cancel`, { method: 'PUT' });
				if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Couldn’t cancel it.');
				revalidateHouseAvailability();
			}
			onDone();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Couldn’t cancel it.');
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="flex flex-col gap-4">
			<p className="text-[0.9375rem]">
				{b.name} at {b.house?.short}, {at(b.start, tz, 'ddd D MMM, HH:mm')}–{at(b.end, tz, 'HH:mm')}. {b.guests.length ? `Your ${b.guests.length} invitees will be told.` : ''} Anything paid comes back to the card you used.
			</p>
			{error ? <p role="alert" className="text-[0.875rem] text-alert">{error}</p> : null}
			<div className="flex gap-2">
				<Button variant="outline" onClick={onClose} className="flex-1">
					Keep it
				</Button>
				<button type="button" onClick={go} disabled={busy} className="h-11 flex-1 rounded-[2px] bg-alert px-5 text-[0.9375rem] font-medium text-white hover:bg-[#a83323] disabled:opacity-50">
					{busy ? 'Cancelling…' : 'Cancel booking'}
				</button>
			</div>
		</div>
	);
}

/**
 * Staying longer is a new booking for the same space, straight after this one: checked against availability, added
 * to the day sheet and paid at checkout. (Changing the length of a paid booking would change its price.)
 */
function Extend({ cat, booking: b, preview }: { cat: Catalogue; booking: Booking; preview?: boolean }) {
	const router = useRouter();
	const sheet = useDaySheet(cat);
	const tz = b.house?.tz ?? 'Europe/Dublin';
	const space = b.space;
	const options = space ? [space.baseMin, space.baseMin * 2].filter((m) => m <= space.maxMin) : [];
	const [minutes, setMinutes] = useState(options[0] ?? 30);
	const [error, setError] = useState<string | null>(null);
	const key = space ? `/api/availability?${new URLSearchParams({ productId: space.id, date: localDay(b.end, tz), timezone: tz, locationId: space.houseId, duration: String(minutes * 60) })}` : null;
	const { data, isLoading } = useSWR<CurrentAvailabilitySlot[]>(key, (u: string) => fetch(u).then((r) => (r.ok ? r.json() : [])), { revalidateOnFocus: false });
	const free = (data ?? []).some((s) => slotStart(s) === b.end);
	if (!space) return <p>We can’t find this space any more.</p>;
	const go = async () => {
		setError(null);
		if (preview) return;
		const r = await sheet.add({ space, start: b.end, minutes, seats: b.seats });
		if (r.ok) router.push('/checkout');
		else setError(r.error ?? 'Couldn’t add it.');
	};
	return (
		<div className="flex flex-col gap-4">
			<p className="text-[0.9375rem] text-mute">
				Add time straight after {at(b.end, tz, 'HH:mm')}. It goes on a new day sheet and you pay for the extra time only.
			</p>
			<div className="flex gap-2">
				{options.map((m) => (
					<button key={m} type="button" aria-pressed={m === minutes} onClick={() => setMinutes(m)} className={`flex-1 border px-3 py-3 text-left ${m === minutes ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-sheet'}`}>
						<span className="block font-medium">+ {formatLength(m)}</span>
						<span className="t-num text-[0.8125rem] opacity-80">
							until {at(b.end + m, tz, 'HH:mm')} · <Price amount={priceFor(space, m, b.seats)} />
						</span>
					</button>
				))}
			</div>
			<p className="t-label" aria-live="polite">
				{isLoading ? 'Checking…' : free ? <span className="text-free">Free after you</span> : <span className="text-alert">Someone has it straight after you</span>}
			</p>
			{error ? <p role="alert" className="text-[0.875rem] text-alert">{error}</p> : null}
			<Button size="lg" fullWidth onClick={go} disabled={!free || isLoading} loading={sheet.busy !== null}>
				Add to a day sheet and check out
			</Button>
		</div>
	);
}
