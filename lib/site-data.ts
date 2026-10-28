import { existingImage } from '@/lib/media';
import { kinds, type KindKey } from '@/lib/site-config';
import { unitLabel, type Catalogue, type House, type Space } from '@/lib/workspace';
import type { HouseCard } from '@/components/site/houses-schedule';
import type { KindSummary } from '@/components/site/kinds-schedule';
import type { FreeNowHouse } from '@/components/home/free-now';

/**
 * Server-side view models for the content pages, built from the catalogue (lib/server-data.ts#getCatalogue).
 * Local images are resolved here (a missing file → null → drawn fallback).
 */

export function houseImage(h: House): string | null {
	return existingImage(h.presentation?.image);
}

export function houseCards(cat: Catalogue): HouseCard[] {
	return cat.houses
		.filter((h) => h.spaceCount > 0)
		.map((h) => ({
			id: h.id,
			slug: h.slug,
			short: h.short,
			neighbourhood: h.neighbourhood,
			line: h.presentation?.line ?? h.description ?? '',
			image: houseImage(h),
			kinds: h.kinds,
			flexSeats: h.flexSeats,
			roomCount: h.roomCount,
			spaceCount: h.spaceCount,
		}));
}

/** Cheapest space of a kind, by price per base unit (per seat on a flex floor). */
export function cheapest(spaces: Space[]): Space | null {
	return spaces.reduce<Space | null>((best, s) => (!best || s.price < best.price ? s : best), null);
}

export function kindSummary(cat: Catalogue, key: KindKey, houseId?: string): KindSummary {
	const list = cat.spaces.filter((s) => s.kind === key && (!houseId || s.houseId === houseId));
	const c = cheapest(list);
	const seats = list.map((s) => s.seats);
	return {
		key,
		count: list.length,
		houses: new Set(list.map((s) => s.houseId)).size,
		fromPrice: c ? c.price : null,
		unit: c ? unitLabel(c) : '',
		seatsMin: seats.length ? Math.min(...seats) : 0,
		seatsMax: seats.length ? Math.max(...seats) : 0,
	};
}

export function kindSummaries(cat: Catalogue, houseId?: string): KindSummary[] {
	return kinds.map((k) => kindSummary(cat, k.key, houseId));
}

export function freeNowHouses(cat: Catalogue): FreeNowHouse[] {
	return cat.houses
		.filter((h) => h.spaceCount > 0)
		.map((h) => ({
			id: h.id,
			slug: h.slug,
			short: h.short,
			neighbourhood: h.neighbourhood,
			tz: h.tz,
			hours: h.presentation?.hours ?? [
				{ days: 'Mon–Fri', time: '08:00–20:00' },
				{ days: 'Sat', time: '09:00–17:00' },
			],
			spaces: cat.spaces
				.filter((s) => s.houseId === h.id)
				.map((s) => ({ id: s.id, slug: s.slug, name: s.name, kind: s.kind, capacity: s.capacity, shared: s.shared, seats: s.seats })),
		}));
}

/** The lightweight space shape the catalogue/listing components need on the client. */
export interface SpaceCard {
	id: string;
	slug: string;
	kind: KindKey;
	name: string;
	houseId: string;
	houseShort: string;
	houseSlug: string;
	seats: number;
	shared: boolean;
	level: number | null;
	kit: string[];
	copy: string;
	price: number;
	unit: string;
	baseMin: number;
	maxMin: number;
	image: string | null;
}

export function spaceCard(cat: Catalogue, s: Space): SpaceCard {
	const h = cat.houses.find((x) => x.id === s.houseId);
	return {
		id: s.id,
		slug: s.slug,
		kind: s.kind,
		name: s.name,
		houseId: s.houseId,
		houseShort: h?.short ?? '',
		houseSlug: h?.slug ?? '',
		seats: s.seats,
		shared: s.shared,
		level: s.level,
		kit: s.kit,
		copy: s.copy,
		price: s.price,
		unit: unitLabel(s),
		baseMin: s.baseMin,
		maxMin: s.maxMin,
		image: s.image,
	};
}
