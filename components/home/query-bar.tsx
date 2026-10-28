'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@/contexts/location-context';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Stepper } from '@/components/ui/stepper';
import { DimensionLine } from '@/components/ui/dimension-line';
import { PlanIcon } from '@/components/ui/plan-icon';
import { kinds, type KindKey } from '@/lib/site-config';
import { cn } from '@/lib/utils';
import { shortLength, formatLength } from '@/lib/workspace';

export interface QueryHouse {
	id: string;
	slug: string;
	short: string;
	kinds: KindKey[];
}

/**
 * The homepage query: what, where, when, how long, how many. Laid out as a title block (boxed cells with mono keys),
 * it deep-links into the planner: /book?kind=&house=&date=&start=HH:mm&length=<min>&people=.
 */
export function QueryBar({ houses, tz, className }: { houses: QueryHouse[]; tz: string; className?: string }) {
	const router = useRouter();
	const { selectedLocationId } = useLocation();
	const [kind, setKind] = useState<KindKey>('room');
	const [houseId, setHouseId] = useState<string>('');
	const [date, setDate] = useState('');
	const [start, setStart] = useState('10:00');
	const [len, setLen] = useState(60);
	const [people, setPeople] = useState(4);

	// Start from the remembered house once the client knows it.
	useEffect(() => {
		if (selectedLocationId && houses.some((h) => h.id === selectedLocationId)) setHouseId(selectedLocationId);
	}, [selectedLocationId, houses]);

	const days = useMemo(() => upcomingDays(tz, 14), [tz]);
	useEffect(() => {
		if (!date && days[0]) setDate(days[0].value);
	}, [date, days]);

	const k = kinds.find((x) => x.key === kind)!;
	const lengths = k.lengths;

	const pickKind = (next: KindKey) => {
		setKind(next);
		const kk = kinds.find((x) => x.key === next)!;
		setLen(kk.defaultLengthMin);
		if (next === 'booth' || next === 'desk') setPeople(1);
		else if (next === 'flex') setPeople((p) => Math.min(p, 6));
		else setPeople((p) => Math.max(p, 2));
	};

	const housesForKind = houses.filter((h) => h.kinds.includes(kind));
	const maxPeople = kind === 'booth' || kind === 'desk' ? 1 : kind === 'event' ? 60 : kind === 'flex' ? 12 : 16;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const house = houses.find((h) => h.id === houseId && h.kinds.includes(kind));
		const q = new URLSearchParams({ kind, date, start, length: String(len), people: String(people) });
		if (house) q.set('house', house.slug);
		router.push(`/book?${q.toString()}`);
	};

	return (
		<form onSubmit={submit} className={cn('border border-ink bg-sheet', className)} aria-label="Find a space">
			{/* What */}
			<div className="flex flex-wrap items-stretch border-b border-ink">
				<span className="t-label flex items-center border-r border-ink px-3 py-3 font-semibold">What</span>
				<div className="no-scrollbar flex flex-1 gap-0 overflow-x-auto">
					{kinds.map((x) => (
						<button
							key={x.key}
							type="button"
							aria-pressed={kind === x.key}
							onClick={() => pickKind(x.key)}
							className={cn(
								'relative flex shrink-0 items-center gap-2 border-r border-line px-4 py-2.5 text-[0.875rem] font-medium hover:bg-wash/60',
								kind === x.key && 'bg-wash text-cobalt-deep after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-marigold',
							)}
						>
							<PlanIcon kind={x.key} className="h-6 w-6" />
							{x.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-12">
				<Cell label="Where" className="col-span-2 lg:col-span-3">
					<select value={houseId} onChange={(e) => setHouseId(e.target.value)} className="w-full bg-transparent py-1 text-[1rem] font-semibold focus:outline-none">
						<option value="">Any house</option>
						{housesForKind.map((h) => (
							<option key={h.id} value={h.id}>
								{h.short}
							</option>
						))}
					</select>
				</Cell>
				<Cell label="When" className="lg:col-span-2">
					<select value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent py-1 text-[1rem] font-semibold focus:outline-none">
						{days.map((d) => (
							<option key={d.value} value={d.value}>
								{d.label}
							</option>
						))}
					</select>
				</Cell>
				<Cell label="From" className="lg:col-span-2">
					<select value={start} onChange={(e) => setStart(e.target.value)} className="t-num w-full bg-transparent py-1 text-[1rem] font-semibold focus:outline-none">
						{START_TIMES.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
				</Cell>
				<Cell label="People" className="col-span-2 lg:col-span-2">
					<Stepper value={Math.min(people, maxPeople)} onChange={setPeople} min={1} max={maxPeople} label="People" size="sm" />
				</Cell>
				<Cell label="For how long" className="col-span-2 lg:col-span-3 lg:border-r-0">
					<div className="flex flex-wrap gap-1.5">
						{lengths.map((m) => (
							<Chip key={m} size="sm" selected={len === m} onClick={() => setLen(m)} aria-label={formatLength(m)}>
								{shortLength(m)}
							</Chip>
						))}
					</div>
				</Cell>
			</div>

			<div className="flex flex-col gap-3 border-t border-ink p-3 sm:flex-row sm:items-center">
				<div className="flex-1 px-1">
					<DimensionLine label={`${start} · ${formatLength(len)}`} fraction={len / Math.max(...lengths)} tone="cobalt" />
				</div>
				<Button type="submit" size="lg" className="sm:min-w-56">
					Find a space →
				</Button>
			</div>
		</form>
	);
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={cn('flex min-w-0 flex-col gap-1.5 border-b border-r border-line-strong px-3 py-2.5 lg:border-b-0', className)}>
			<span className="t-label text-mute">{label}</span>
			{children}
		</div>
	);
}

const START_TIMES = Array.from({ length: 24 }, (_, i) => {
	const m = 8 * 60 + i * 30;
	return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});

/** The next `n` days in the house timezone, skipping Sundays (every house is closed). */
function upcomingDays(tz: string, n: number): { value: string; label: string }[] {
	const out: { value: string; label: string }[] = [];
	const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
	const nice = new Intl.DateTimeFormat('en-IE', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
	const now = Date.now();
	for (let i = 0; out.length < n && i < n + 4; i++) {
		const d = new Date(now + i * 86400000);
		const value = fmt.format(d);
		const label = nice.format(d);
		if (label.startsWith('Sun')) continue;
		out.push({ value, label: i === 0 ? `Today · ${label}` : i === 1 ? `Tomorrow · ${label}` : label });
	}
	return out;
}
