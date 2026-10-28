'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from '@/contexts/location-context';
import { useSettings } from '@/contexts/settings-context';
import { StatusDot } from '@/components/ui/chip';
import { housePresentation } from '@/lib/site-config';
import { openStatus } from '@/lib/house-hours';
import { cn } from '@/lib/utils';

/**
 * The thin bar under the header: which house you're working from today. It is global context (remembered in the
 * browser by LocationContext) — the planner, kind pages and "free now" start from it. Shows the house's open status
 * from its hours and a link to the house page.
 */
export function HouseBar() {
	const { locations, selectedLocationId, setSelectedLocationId } = useLocation();
	const { settings } = useSettings();
	const tz = settings?.settings?.timezone ?? 'Europe/Dublin';
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const [now, setNow] = useState<Date | null>(null);

	const houses = useMemo(() => locations.filter((l) => l.type === 'physical'), [locations]);
	const current = houses.find((h) => h.id === selectedLocationId) ?? null;
	const pres = current ? housePresentation(current) : null;

	useEffect(() => {
		setNow(new Date());
		const t = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(t);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	const status = pres && now ? openStatus(pres.hours, tz, now) : null;

	return (
		<div className="border-b border-line-strong bg-sheet">
			<div ref={ref} className="relative mx-auto flex h-10 max-w-[1360px] items-center gap-3 px-4 text-[0.8125rem] sm:px-6 lg:px-10">
				<span className="t-label hidden text-mute sm:inline">Working from</span>
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={open}
					onClick={() => setOpen((o) => !o)}
					className="flex h-full items-center gap-1.5 font-semibold hover:text-cobalt"
				>
					{current ? (pres?.short ?? current.title) : houses.length ? 'Choose a house' : 'All houses'}
					<svg viewBox="0 0 10 10" className={cn('h-2.5 w-2.5 transition-transform', open && 'rotate-180')} aria-hidden>
						<path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
					</svg>
				</button>
				{status ? (
					<span className="flex items-center gap-2 text-mute">
						<StatusDot free={status.open} />
						<span className="truncate">{status.text}</span>
					</span>
				) : null}
				{current ? (
					<Link href={`/houses/${current.slug}`} className="ml-auto hidden text-mute underline-offset-4 hover:text-ink hover:underline sm:inline">
						{pres?.neighbourhood ?? current.city} · house page →
					</Link>
				) : (
					<span className="ml-auto hidden text-mute sm:inline">Six houses in Dublin, Cork and Galway</span>
				)}

				{open ? (
					<ul role="listbox" aria-label="Houses" className="absolute left-4 top-full z-50 w-[min(92vw,360px)] border border-ink bg-sheet sm:left-6 lg:left-10">
						{houses.map((h) => {
							const p = housePresentation(h);
							const sel = h.id === selectedLocationId;
							return (
								<li key={h.id} role="option" aria-selected={sel}>
									<button
										type="button"
										onClick={() => {
											setSelectedLocationId(h.id);
											setOpen(false);
										}}
										className={cn('flex w-full items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 text-left hover:bg-wash/60', sel && 'bg-wash')}
									>
										<span className="font-semibold">{p?.short ?? h.title}</span>
										<span className="truncate text-[0.75rem] text-mute">{p?.neighbourhood ?? h.city}</span>
									</button>
								</li>
							);
						})}
						<li>
							<Link href="/houses" className="block px-4 py-2.5 text-cobalt hover:bg-wash/60">
								Compare all houses →
							</Link>
						</li>
					</ul>
				) : null}
			</div>
		</div>
	);
}
