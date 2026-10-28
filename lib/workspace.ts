import type { AddOnListItemResponse, Location, ProductListItemResponse, ProductListVariant } from '@opencals/storefront-sdk';
import { housePresentation, houses as housesConfig, kindByCollection, kinds, type KindKey } from '@/lib/site-config';

/**
 * Gable's network as the site sees it: houses, the bookable spaces in them, and the extras.
 *
 * Store conventions (README "Data model"):
 * - A **house** is a physical store location.
 * - A **space** is one product variant: its own resource, listed at exactly one house. Its **kind** comes from its
 *   collection (`site-config.ts` `kinds[].collection`).
 * - Product groups are per kind per house (`Meeting room · Dock House`); the variant title is the space's own name
 *   (`Liffey`, `S3`, `B1`, `Flex floor`).
 * - Seats: rooms, studios, events and offices seat `maxGuests + 1` (guests get the invites). The flex floor seats
 *   `maxAttendees` (a team books several seats with `numberOfAttendees`). Booths and studio desks seat one.
 * - The description is copy, then optional fact lines: `Level: 2` and `Kit: 75" screen, Video bar, Daylight`.
 *
 * Pure and client-safe: the server builds the catalogue (`buildCatalogue`), everything else is lookups and prices.
 */

export type { KindKey } from '@/lib/site-config';

export interface House {
	id: string;
	slug: string;
	/** Store location title ("Gable Dock House") */
	title: string;
	/** "Dock House" */
	short: string;
	/** "Grand Canal Dock, Dublin 2" */
	neighbourhood: string;
	address: string | null;
	city: string | null;
	lat: number | null;
	lng: number | null;
	/** IANA timezone of the house's spaces (their schedule), else the store's */
	tz: string;
	/** The location's own description from the store */
	description: string | null;
	/** Presentation from site-config (null for a location it doesn't know) */
	presentation: ReturnType<typeof housePresentation>;
	/** Kinds with at least one space here, in site-config order */
	kinds: KindKey[];
	spaceCount: number;
	/** Seats on the flex floor(s) */
	flexSeats: number;
	/** Rooms (meeting rooms, studios, events, offices) */
	roomCount: number;
}

export interface Space {
	/** The bookable variant id (the resource) */
	id: string;
	slug: string;
	/** Product group id and slug ("meeting-rooms-dock-house") */
	groupId: string;
	groupSlug: string;
	kind: KindKey;
	/** The space's own name: "Liffey", "S3", "Flex floor" */
	name: string;
	/** Product title: "Meeting room · Dock House" */
	title: string;
	houseId: string;
	/** People it seats (see the conventions above) */
	seats: number;
	/** Capacity in bookings: maxAttendees (> 1 only on a flex floor) */
	capacity: number;
	/** Shared floor where several people book seats */
	shared: boolean;
	level: number | null;
	kit: string[];
	/** Description without the fact lines */
	copy: string;
	/** Price per base unit (per seat on a shared floor) */
	price: number;
	/** Base unit and longest booking, minutes */
	baseMin: number;
	maxMin: number;
	allowGuests: boolean;
	maxGuests: number;
	cancelGapMin: number;
	rescheduleGapMin: number;
	image: string | null;
	gallery: string[];
	color: string;
}

export interface Extra {
	id: string;
	slug: string;
	title: string;
	description: string;
	price: number;
	/** Charged per base unit of the booking (per half hour on a room, per hour in a studio) */
	perUnit: boolean;
	/** Most you can add (people for catering); 1 = a yes/no extra */
	maxQuantity: number;
	image: string | null;
	houseIds: string[];
	spaceIds: string[];
}

export interface Catalogue {
	houses: House[];
	spaces: Space[];
	extras: Extra[];
}

export const EMPTY_CATALOGUE: Catalogue = { houses: [], spaces: [], extras: [] };

// ── Parsing ──────────────────────────────────────────────────────────────

export interface ParsedDescription {
	copy: string;
	level: number | null;
	kit: string[];
}

/** Split a space description into copy and the `Level:` / `Kit:` fact lines. */
export function parseDescription(raw: string | null | undefined): ParsedDescription {
	const lines = (raw ?? '').split(/\r?\n/);
	let level: number | null = null;
	let kit: string[] = [];
	const copy: string[] = [];
	for (const line of lines) {
		const t = line.trim();
		const lv = t.match(/^level\s*:\s*(-?\d+)/i);
		const kt = t.match(/^kit\s*:\s*(.+)$/i);
		if (lv?.[1]) level = parseInt(lv[1], 10);
		else if (kt?.[1])
			kit = kt[1]
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		else if (t) copy.push(t);
	}
	return { copy: copy.join(' '), level, kit };
}

const imageUrl = (img: { url?: string | null } | null | undefined): string | null => img?.url ?? null;

/** The variant's own default image first, then the rest of its gallery (the API returns `images` unordered). */
function galleryOf(v: ProductListVariant): string[] {
	const first = imageUrl(v.image) ?? (v.images ?? []).find((i) => i.id === v.imageId)?.url ?? null;
	const rest = (v.images ?? []).map((i) => i.url).filter((u): u is string => !!u && u !== first);
	return first ? [first, ...rest] : rest;
}

const stripBrand = (title: string, brand: string) => title.replace(new RegExp(`^${brand}\\s+`, 'i'), '').trim();

/** "Liffey" → "liffey"; used for anchors and fallbacks. */
export const slugify = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export type LocationLike = Pick<
	Location,
	'id' | 'slug' | 'title' | 'description' | 'city' | 'type' | 'displayAddress' | 'address' | 'addressLine1' | 'addressLine2' | 'latitude' | 'longitude'
>;

/**
 * Builds the catalogue from the store's product groups, locations and add-ons. `brand` is stripped from location
 * titles for the short name ("Gable Dock House" → "Dock House") when site-config has no presentation for it.
 */
export function buildCatalogue(
	groups: ProductListItemResponse[],
	locations: LocationLike[],
	addOns: AddOnListItemResponse[],
	storeTz: string,
	brand = 'Gable',
): Catalogue {
	const spaces: Space[] = [];
	const tzByHouse = new Map<string, string>();

	for (const group of groups) {
		for (const v of group.variants ?? []) {
			if (v.status && v.status !== 'active') continue;
			const kind = (v.collections ?? []).map((c) => kindByCollection(c.slug)?.key).find(Boolean);
			const houseId = v.locations?.[0]?.id;
			if (!kind || !houseId) continue;
			if (v.schedule?.timezone && !tzByHouse.has(houseId)) tzByHouse.set(houseId, v.schedule.timezone);
			const d = parseDescription(v.description || group.description);
			const capacity = Math.max(1, v.maxAttendees || 1);
			const shared = capacity > 1;
			const maxGuests = v.allowGuests ? Math.max(0, v.maxGuests ?? 0) : 0;
			const baseMin = Math.max(1, Math.round((v.duration || 1800) / 60));
			const gallery = galleryOf(v);
			spaces.push({
				id: v.id,
				slug: v.slug,
				groupId: group.id,
				groupSlug: group.slug,
				kind,
				name: v.variantTitle?.trim() || stripBrand(v.title, brand),
				title: v.title,
				houseId,
				seats: shared ? capacity : maxGuests + 1,
				capacity,
				shared,
				level: d.level,
				kit: d.kit,
				copy: d.copy,
				price: v.price,
				baseMin,
				maxMin: v.allowCustomDuration ? Math.max(baseMin, v.maxDuration > 0 ? Math.round(v.maxDuration / 60) : 12 * 60) : baseMin,
				allowGuests: !!v.allowGuests && maxGuests > 0,
				maxGuests,
				cancelGapMin: Math.round((v.cancelGap ?? 0) / 60),
				rescheduleGapMin: Math.round((v.rescheduleGap ?? 0) / 60),
				image: gallery[0] ?? null,
				gallery,
				color: v.color,
			});
		}
	}

	const kindOrder: KindKey[] = kinds.map((k) => k.key);
	spaces.sort(
		(a, b) =>
			kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) ||
			a.seats - b.seats ||
			a.name.localeCompare(b.name, 'en', { numeric: true }),
	);

	const physical = locations.filter((l) => l.type === 'physical');
	const houses: House[] = physical
		.map((loc) => {
			const own = spaces.filter((s) => s.houseId === loc.id);
			const p = housePresentation(loc);
			const title = loc.title ?? loc.city ?? loc.slug;
			return {
				id: loc.id,
				slug: loc.slug,
				title,
				short: p?.short ?? stripBrand(title, brand),
				neighbourhood: p?.neighbourhood ?? [loc.addressLine2, loc.city].filter(Boolean).join(', '),
				address: loc.displayAddress ?? loc.address ?? ([loc.addressLine1, loc.city].filter(Boolean).join(', ') || null),
				city: loc.city,
				lat: loc.latitude,
				lng: loc.longitude,
				tz: tzByHouse.get(loc.id) ?? storeTz,
				description: loc.description ?? null,
				presentation: p,
				kinds: kindOrder.filter((k) => own.some((s) => s.kind === k)),
				spaceCount: own.length,
				flexSeats: own.filter((s) => s.kind === 'flex').reduce((n, s) => n + s.capacity, 0),
				roomCount: own.filter((s) => s.kind === 'room' || s.kind === 'studio' || s.kind === 'event' || s.kind === 'office').length,
			};
		})
		// Houses with spaces first, in site-config order; unknown locations last.
		.sort((a, b) => {
			const ia = a.presentation ? housesConfig.indexOf(a.presentation) : 99;
			const ib = b.presentation ? housesConfig.indexOf(b.presentation) : 99;
			return Number(b.spaceCount > 0) - Number(a.spaceCount > 0) || ia - ib;
		});

	const spaceIds = new Set(spaces.map((s) => s.id));
	const extras: Extra[] = addOns
		.filter((a) => a.status !== 'inactive')
		.map((a) => ({
			id: a.id,
			slug: a.slug,
			title: a.title,
			description: a.description ?? '',
			price: a.price,
			perUnit: !!a.durationMultiplied,
			maxQuantity: Math.max(1, a.maxQuantity ?? 1),
			image: imageUrl(a.image),
			houseIds: (a.locations ?? []).map((l) => l.id),
			spaceIds: (a.products ?? []).map((p) => p.id).filter((id) => spaceIds.has(id)),
		}));

	return { houses, spaces, extras };
}

// ── Lookups ──────────────────────────────────────────────────────────────

export function houseBySlug(cat: Catalogue, slugOrId: string | null | undefined): House | null {
	if (!slugOrId) return null;
	return cat.houses.find((h) => h.slug === slugOrId || h.id === slugOrId) ?? null;
}

export function houseOf(cat: Catalogue, space: Pick<Space, 'houseId'>): House | null {
	return cat.houses.find((h) => h.id === space.houseId) ?? null;
}

export function spaceBySlug(cat: Catalogue, slugOrId: string | null | undefined): Space | null {
	if (!slugOrId) return null;
	return cat.spaces.find((s) => s.slug === slugOrId || s.id === slugOrId) ?? null;
}

export function spacesAt(cat: Catalogue, houseId: string, kind?: KindKey | KindKey[]): Space[] {
	const ks = kind ? (Array.isArray(kind) ? kind : [kind]) : null;
	return cat.spaces.filter((s) => s.houseId === houseId && (!ks || ks.includes(s.kind)));
}

export function spacesOfKind(cat: Catalogue, kind: KindKey): Space[] {
	return cat.spaces.filter((s) => s.kind === kind);
}

/** Extras offered with a space (scoped by product, else by house). */
export function extrasFor(cat: Catalogue, space: Pick<Space, 'id' | 'houseId'>): Extra[] {
	return cat.extras.filter((e) => (e.spaceIds.length ? e.spaceIds.includes(space.id) : !e.houseIds.length || e.houseIds.includes(space.houseId)));
}

// ── Prices ───────────────────────────────────────────────────────────────

/** Base units a booking takes (the API prices custom durations as ceil(length / base) × price). */
export function unitsFor(space: Pick<Space, 'baseMin'>, minutes: number): number {
	return Math.max(1, Math.ceil(minutes / space.baseMin));
}

/** Price for a booking: units × price, × seats on a shared floor (quantity = units × attendees). */
export function priceFor(space: Pick<Space, 'baseMin' | 'price'>, minutes: number, seats = 1): number {
	return Math.round(space.price * unitsFor(space, minutes) * Math.max(1, seats) * 100) / 100;
}

/** What an extra costs for a booking of `minutes` on `space`. */
export function extraPrice(extra: Pick<Extra, 'price' | 'perUnit'>, quantity: number, space: Pick<Space, 'baseMin'>, minutes: number): number {
	const unit = extra.perUnit ? extra.price * unitsFor(space, minutes) : extra.price;
	return Math.round(unit * quantity * 100) / 100;
}

/** "€15 / half day", "€28 / 30 min", "€65 / hour" — the price per base unit, in words. */
export function unitLabel(space: Pick<Space, 'baseMin'>): string {
	const m = space.baseMin;
	if (m === 240) return 'half day';
	if (m === 480) return 'day';
	if (m === 60) return 'hour';
	if (m % 60 === 0) return `${m / 60} h`;
	return `${m} min`;
}

/** Lengths (minutes) a space can be booked for, from a list of offered chips. */
export function lengthsFor(space: Pick<Space, 'baseMin' | 'maxMin'>, offered: number[]): number[] {
	const ok = offered.filter((m) => m >= space.baseMin && m <= space.maxMin && m % space.baseMin === 0);
	return ok.length ? ok : [space.baseMin];
}

export function formatLength(minutes: number): string {
	if (minutes === 240) return 'Half day';
	if (minutes === 480) return 'Full day';
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h && m) return `${h} h ${m}`;
	if (h) return `${h} h`;
	return `${m} min`;
}

/** Short form for chips and dimension lines: "30m", "1h 30", "8h". */
export function shortLength(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h && m) return `${h}h ${m}`;
	if (h) return `${h}h`;
	return `${m}m`;
}

export function seatsLabel(space: Pick<Space, 'seats' | 'shared'>): string {
	if (space.shared) return `${space.seats} seats`;
	return space.seats === 1 ? 'For 1' : `Seats ${space.seats}`;
}
