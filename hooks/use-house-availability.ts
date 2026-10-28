'use client';

import { useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { HouseAvailability } from '@/lib/workspace-time';

const EMPTY: HouseAvailability = { ranges: {}, failed: [] };

export function houseAvailabilityKey(houseId: string | null): string | null {
	return houseId ? `/api/houses/${houseId}/availability` : null;
}

/** Drop every house's availability in this tab after a booking change, so the planner re-reads. */
export function revalidateHouseAvailability() {
	void globalMutate((key) => typeof key === 'string' && key.startsWith('/api/houses/'));
}

/**
 * One house's free ranges, every space, the whole planner window: one request per house (cached 60 s on the
 * server). Refreshes every minute while open; spaces the server couldn't read (rate limit) are asked for again
 * after 2 s.
 */
export function useHouseAvailability(houseId: string | null, fallbackData?: HouseAvailability) {
	const key = houseAvailabilityKey(houseId);
	const { data, error, isLoading, mutate } = useSWR<HouseAvailability>(key, fetcher, {
		fallbackData,
		revalidateOnFocus: false,
		revalidateOnMount: !fallbackData,
		refreshInterval: 60_000,
		keepPreviousData: true,
		dedupingInterval: 5_000,
	});
	const value = data ?? EMPTY;
	const failedCount = value.failed.length;

	useEffect(() => {
		if (!key || failedCount === 0) return;
		const id = setTimeout(() => void mutate(), 2000);
		return () => clearTimeout(id);
	}, [key, failedCount, mutate]);

	return {
		ranges: value.ranges,
		failed: value.failed,
		/** Every space has answered */
		complete: !!data && failedCount === 0,
		loading: isLoading && !data,
		error: !!error && !data,
		refresh: mutate,
	};
}
