'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { toBooking, type AppointmentLike, type Booking } from '@/lib/booking';
import type { Catalogue } from '@/lib/workspace';

interface Page {
	data: AppointmentLike[];
}

/** The signed-in customer's bookings (latest 100), read as Bookings. `fallback` seeds previews. */
export function useAccountBookings(cat: Catalogue, fallback?: Booking[]) {
	const { data, error, isLoading, mutate } = useSWR<Page>(fallback ? null : '/api/account/appointments?take=100', (url: string) =>
		fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
		{ revalidateOnFocus: true },
	);
	const bookings = useMemo(() => fallback ?? (data?.data ?? []).map((a) => toBooking(a, cat)).sort((a, b) => a.start - b.start), [fallback, data, cat]);
	return { bookings, loading: !fallback && isLoading, error: !fallback && !!error, refresh: () => mutate() };
}
