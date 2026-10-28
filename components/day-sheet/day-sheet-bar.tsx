'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Drawer } from '@/components/ui/dialog';
import { buttonClasses } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { DaySheet } from '@/components/day-sheet/day-sheet';
import type { DaySheet as DaySheetState } from '@/hooks/use-day-sheet';
import type { Catalogue } from '@/lib/workspace';
import type { HouseRanges } from '@/lib/workspace-time';
import { cn } from '@/lib/utils';

/**
 * Phones: the day sheet as a bar fixed to the bottom of the screen (count, total, Check out), which opens the full
 * sheet in a bottom drawer. The total and the primary action are always in view while you plan.
 */
export function DaySheetBar({ cat, sheet, ranges, houseId, className }: { cat: Catalogue; sheet: DaySheetState; ranges?: HouseRanges; houseId?: string | null; className?: string }) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	useEffect(() => setOpen(false), [pathname]);
	return (
		<>
			<div className={cn('fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-sheet pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden', className)}>
				<div className="flex items-center gap-3 px-4 py-2.5">
					<button type="button" onClick={() => setOpen(true)} className="flex min-w-0 flex-1 flex-col items-start text-left" aria-label="Open the day sheet">
						<span className="t-label text-mute">
							Day sheet · {sheet.count} {sheet.count === 1 ? 'booking' : 'bookings'}
						</span>
						<span className="flex items-baseline gap-2">
							<Price amount={sheet.total} className="text-[1.125rem] font-medium" />
							<span className="text-[0.8125rem] text-cobalt underline underline-offset-2">View</span>
						</span>
					</button>
					{sheet.count ? (
						<Link href="/checkout" className={buttonClasses('primary', 'md')}>
							Check out
						</Link>
					) : null}
				</div>
			</div>
			<Drawer open={open} onClose={() => setOpen(false)} title="Day sheet" number="DS-01" side="bottom">
				<div className="p-3">
					<DaySheet cat={cat} sheet={sheet} ranges={ranges} houseId={houseId} inDrawer />
				</div>
			</Drawer>
		</>
	);
}
