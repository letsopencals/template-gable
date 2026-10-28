import '@/lib/opencals';
import { unstable_cache } from 'next/cache';
import { OpencalsApiError, ProductService } from '@opencals/storefront-sdk';
import type { Space } from '@/lib/workspace';
import { mergePacked, nowMin, pack, WINDOW_DAYS, type HouseAvailability, type Packed } from '@/lib/workspace-time';

/**
 * A house's availability, read once per space and cached on the server.
 *
 * Every space is its own resource, so the API answers per space. Instead of one call per space *per day* from the
 * browser, the server asks each space once for its merged free ranges over the whole booking horizon (no `date`),
 * trims them to the planner window and caches each space for 60 seconds. The browser gets one response per house and
 * derives the planner results, start times, day strip, seats left and "free now" locally.
 *
 * Tags: `space:<id>` (dropped after a booking on that space), `house:<id>` and `availability` (dropped after a
 * cancel, a move or a cart removal). A space that fails (rate limit, 5xx) is not cached and is reported in `failed`,
 * so the client asks again in a moment and only that space is re-read.
 */

const CONCURRENCY = 3;
const MAX_RETRIES = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readRanges(spaceId: string, houseId: string, tz: string): Promise<Packed[]> {
	for (let attempt = 0; ; attempt++) {
		try {
			// throwOnError is required: without it the SDK resolves a 429 as an empty result.
			const { data } = await ProductService.getCurrentAvailabilitiesMerged({
				path: { productId: spaceId },
				query: { locationId: houseId, timezone: tz },
				throwOnError: true,
			});
			const until = nowMin() + (WINDOW_DAYS + 1) * 1440;
			return mergePacked((data ?? []).map(pack)).filter(([s, len]) => len > 0 && s < until);
		} catch (err) {
			const status = err instanceof OpencalsApiError ? err.status : 0;
			const retriable = status === 429 || status === 503 || status === 0;
			if (!retriable || attempt >= MAX_RETRIES) throw err;
			await sleep(400 * 2 ** attempt + Math.floor(Math.random() * 250));
		}
	}
}

function cachedRanges(spaceId: string, houseId: string, tz: string): Promise<Packed[]> {
	return unstable_cache(() => readRanges(spaceId, houseId, tz), ['space-ranges-v1', spaceId, houseId, tz], {
		revalidate: 60,
		tags: ['availability', `space:${spaceId}`, `house:${houseId}`],
	})();
}

export async function getHouseAvailability(spaces: Pick<Space, 'id' | 'houseId'>[], tz: string): Promise<HouseAvailability> {
	const ranges: Record<string, Packed[]> = {};
	const failed: string[] = [];
	let cursor = 0;
	const runners = Array.from({ length: Math.min(CONCURRENCY, spaces.length) }, async () => {
		while (cursor < spaces.length) {
			const space = spaces[cursor++]!;
			try {
				ranges[space.id] = await cachedRanges(space.id, space.houseId, tz);
			} catch {
				failed.push(space.id);
			}
		}
	});
	await Promise.all(runners);
	return { ranges, failed };
}
