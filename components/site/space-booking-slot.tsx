import { SheetStrip } from '@/components/ui/sheet';
import { SpaceBookingPanel } from '@/components/planner/space-booking-panel';
import type { Catalogue, Space } from '@/lib/workspace';

/** The right column of a space page: the planner's booking panel for this one space (day column, length, extras). */
export function SpaceBookingSlot({ cat, space }: { cat: Catalogue; space: Space }) {
	return (
		<div className="flex h-full flex-col">
			<SheetStrip number="BK-01" title="Book this space" refs={false} className="border-ink" />
			<SpaceBookingPanel cat={cat} spaceSlug={space.slug} className="flex-1" />
		</div>
	);
}
