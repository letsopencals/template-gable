'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment-timezone';
import { useLocation } from '@/contexts/location-context';
import { useHouseAvailability } from '@/hooks/use-house-availability';
import { canHost, defaultLength, rankResults, seatsFor, tabByKey, tabFor, tabLengths, TABS, unionStarts, type TabKey } from '@/lib/planner';
import { houseBySlug, spaceBySlug, spacesAt, type Catalogue, type House } from '@/lib/workspace';
import { dayStart, dayWindow, nextDays, openDays, todayIn, type HouseAvailability } from '@/lib/workspace-time';

/** What the URL can carry: /book?house=&kind=&date=&start=HH:mm&length=&people=&space= */
export interface PlannerParams {
	house?: string | null;
	kind?: string | null;
	date?: string | null;
	start?: string | null;
	length?: string | null;
	people?: string | null;
	space?: string | null;
}

/**
 * The planner's state: one house, one day, a tab of kinds, a length, a party size and an optional start, plus the
 * open result. Starts from the URL, else the house remembered in the browser (house bar), else the first house.
 * The URL follows the state (replaceState), so a planner view can be shared or bookmarked.
 */
export function usePlanner(cat: Catalogue, params: PlannerParams, initialAvailability?: { houseId: string; data: HouseAvailability } | null) {
	const { selectedLocationId, setSelectedLocationId } = useLocation();
	const linkedSpace = spaceBySlug(cat, params.space);
	const linkedHouse = houseBySlug(cat, params.house) ?? (linkedSpace ? (cat.houses.find((h) => h.id === linkedSpace.houseId) ?? null) : null);
	const [houseId, setHouseIdState] = useState<string | null>(linkedHouse?.id ?? cat.houses[0]?.id ?? null);

	// No house in the link: use the one remembered in the browser (house bar), or remember the planner's.
	const adopted = useRef(false);
	useEffect(() => {
		if (adopted.current) return;
		adopted.current = true;
		if (linkedHouse) {
			setSelectedLocationId(linkedHouse.id);
			return;
		}
		let stored: string | null = null;
		try {
			stored = selectedLocationId ?? localStorage.getItem('@opencals/location');
		} catch {
			// storage blocked: keep the default house
		}
		if (stored && cat.houses.some((h) => h.id === stored)) setHouseIdState(stored);
		else if (houseId) setSelectedLocationId(houseId);
	}, [selectedLocationId, cat.houses, houseId, setSelectedLocationId, linkedHouse]);

	const house: House | null = cat.houses.find((h) => h.id === houseId) ?? null;
	const tz = house?.tz ?? 'Europe/Dublin';
	const today = useMemo(() => todayIn(tz), [tz]);
	const days = useMemo(() => nextDays(today, 14), [today]);

	const houseSpaces = useMemo(() => (house ? spacesAt(cat, house.id) : []), [cat, house]);
	const tabs = useMemo(() => TABS.filter((t) => houseSpaces.some((s) => t.kinds.includes(s.kind))), [houseSpaces]);
	const [tabKey, setTabKey] = useState<TabKey>(tabFor(linkedSpace?.kind ?? params.kind) ?? 'desks');
	const tab = tabs.find((t) => t.key === tabKey) ?? tabs[0] ?? tabByKey('desks');
	const tabSpaces = useMemo(() => houseSpaces.filter((s) => tab.kinds.includes(s.kind)), [houseSpaces, tab]);
	const lengths = useMemo(() => tabLengths(tab, tabSpaces), [tab, tabSpaces]);

	const [date, setDateState] = useState(() => (params.date && moment(params.date, 'YYYY-MM-DD', true).isValid() && params.date >= today ? params.date : today));
	const [minutes, setMinutesState] = useState(() => {
		const n = Number(params.length);
		return n > 0 ? n : defaultLength(tab, lengths);
	});
	const [people, setPeople] = useState(() => Math.max(1, Math.min(60, Number(params.people) || 1)));
	const [start, setStart] = useState<number | null>(() => {
		if (!params.start || !/^\d{1,2}:\d{2}$/.test(params.start)) return null;
		const [h, m] = params.start.split(':').map(Number);
		return dayStart(date, tz) + h! * 60 + m!;
	});
	const [openId, setOpenId] = useState<string | null>(linkedSpace?.id ?? null);

	// Keep the length valid for the tab.
	const len = lengths.includes(minutes) ? minutes : defaultLength(tab, lengths);

	const avail = useHouseAvailability(houseId, initialAvailability && initialAvailability.houseId === houseId ? initialAvailability.data : undefined);
	const ranges = avail.ranges;
	const hasData = Object.keys(ranges).length > 0;

	const window = useMemo(() => dayWindow(houseSpaces, ranges, date, tz), [houseSpaces, ranges, date, tz]);
	const open = useMemo(
		() => (hasData ? openDays(tabSpaces, ranges, days, tz, () => len, people) : null),
		[hasData, tabSpaces, ranges, days, tz, len, people],
	);
	const starts = useMemo(() => unionStarts(tabSpaces, ranges, date, tz, len, people), [tabSpaces, ranges, date, tz, len, people]);
	const results = useMemo(() => rankResults(tabSpaces, ranges, date, tz, start, len, people), [tabSpaces, ranges, date, tz, start, len, people]);
	const tooBig = tabSpaces.length > 0 && !tabSpaces.some((s) => canHost(s, people, len));

	// A start that no longer exists (day/length changed) falls back to "any time".
	useEffect(() => {
		if (start !== null && hasData && !starts.includes(start)) setStart(null);
	}, [start, starts, hasData]);

	// URL follows state.
	useEffect(() => {
		if (!house) return;
		const p = new URLSearchParams();
		p.set('house', house.slug);
		p.set('kind', tab.key);
		if (date !== today) p.set('date', date);
		if (start !== null) p.set('start', moment.utc(start * 60000).tz(tz).format('HH:mm'));
		p.set('length', String(len));
		if (people > 1) p.set('people', String(people));
		const sp = openId ? cat.spaces.find((s) => s.id === openId) : null;
		if (sp) p.set('space', sp.slug);
		window_replace(`/book?${p}`);
	}, [house, tab.key, date, today, start, len, people, openId, cat.spaces, tz]);

	const setHouse = useCallback(
		(id: string) => {
			setHouseIdState(id);
			setSelectedLocationId(id);
			setStart(null);
			setOpenId(null);
		},
		[setSelectedLocationId],
	);
	const setTab = useCallback((k: TabKey) => {
		setTabKey(k);
		setStart(null);
		setOpenId(null);
		const t = tabByKey(k);
		setMinutesState(defaultLength(t, tabLengths(t, [])));
	}, []);
	const setDate = useCallback((d: string) => {
		setDateState(d);
		setStart(null);
	}, []);
	const setMinutes = useCallback((m: number) => setMinutesState(m), []);

	return {
		house,
		houses: cat.houses,
		setHouse,
		tz,
		today,
		days,
		tabs,
		tab,
		setTab,
		lengths,
		minutes: len,
		setMinutes,
		people,
		setPeople,
		date,
		setDate,
		start,
		setStart,
		open,
		starts,
		results,
		tooBig,
		window,
		openId,
		setOpenId,
		ranges,
		availability: avail,
		seatsFor: (spaceId: string) => {
			const s = cat.spaces.find((x) => x.id === spaceId);
			return s ? seatsFor(s, people) : 1;
		},
	};
}

function window_replace(url: string) {
	if (typeof window === 'undefined') return;
	if (window.location.pathname + window.location.search === url) return;
	window.history.replaceState(window.history.state, '', url);
}

export type Planner = ReturnType<typeof usePlanner>;

