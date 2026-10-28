import '@/lib/opencals';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
	AddonService,
	LocationService,
	ProductService,
	StoreService,
	type AddOnListItemResponse,
	type ProductListItemResponse,
	type StorePublicSettings,
} from '@opencals/storefront-sdk';
import { siteConfig } from '@/lib/site-config';
import { buildCatalogue, EMPTY_CATALOGUE, houseBySlug, spaceBySlug, type Catalogue, type House, type Space } from '@/lib/workspace';

/**
 * Server-only data readers. Each is wrapped in React.cache() so repeated calls within one request are deduped. RSCs
 * call these directly instead of going through the template's own /api/* routes. Never import this module from a
 * 'use client' file — the /api/* routes remain the client/SWR data source.
 */

export const getStoreSettings = cache(async (): Promise<StorePublicSettings | null> => {
	try {
		const { data } = await StoreService.getStorePublicSettings();
		return data ?? null;
	} catch {
		return null;
	}
});

/** Every product group, all pages (the catalogue spans every house). */
async function listAllProducts(): Promise<ProductListItemResponse[]> {
	const out: ProductListItemResponse[] = [];
	for (let page = 1; page <= 10; page++) {
		const { data } = await ProductService.list({ query: { take: 100, page }, throwOnError: true });
		out.push(...(data?.data ?? []));
		if (!data?.meta?.hasNextPage) break;
	}
	return out;
}

async function listAllAddOns(): Promise<AddOnListItemResponse[]> {
	const out: AddOnListItemResponse[] = [];
	for (let page = 1; page <= 5; page++) {
		const { data } = await AddonService.list({ query: { take: 100, page, status: ['active'] }, throwOnError: true });
		out.push(...(data?.data ?? []));
		if (!data?.meta?.hasNextPage) break;
	}
	return out;
}

/**
 * Houses + spaces + extras, shaped for the site. Cached across requests for five minutes (spaces change rarely;
 * availability is cached separately and much shorter). On an API error nothing is cached and an empty catalogue
 * renders, so a hiccup never sticks.
 */
const loadCatalogue = unstable_cache(
	async (): Promise<Catalogue> => {
		const [products, locations, addOns, settings] = await Promise.all([
			listAllProducts(),
			LocationService.list({ query: { take: 100 }, throwOnError: true }).then((r) => r.data?.data ?? []),
			listAllAddOns(),
			StoreService.getStorePublicSettings().then((r) => r.data ?? null),
		]);
		return buildCatalogue(products, locations, addOns, settings?.settings?.timezone ?? 'Europe/Dublin', siteConfig.name);
	},
	['gable-catalogue-v1'],
	{ revalidate: 300, tags: ['catalogue'] },
);

export const getCatalogue = cache(async (): Promise<Catalogue> => {
	try {
		return await loadCatalogue();
	} catch {
		return EMPTY_CATALOGUE;
	}
});

export const getHouse = cache(async (slug: string): Promise<House | null> => houseBySlug(await getCatalogue(), slug));

export const getSpace = cache(async (slug: string): Promise<Space | null> => spaceBySlug(await getCatalogue(), slug));
