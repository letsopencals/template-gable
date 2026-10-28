import { NextResponse } from 'next/server';
import { houseBySlug, spacesAt } from '@/lib/workspace';
import { getCatalogue } from '@/lib/server-data';
import { getHouseAvailability } from '@/lib/availability-server';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * Every space's free ranges at one house, packed `[start, length, taken, capacity]` (UTC epoch minutes). One request
 * per house; the planner, the space pages and "free now" compute everything else in the browser. `?kind=room,booth`
 * narrows it to some kinds.
 */
export async function GET(request: Request, { params }: { params: Promise<{ houseId: string }> }) {
	const { houseId } = await params;
	try {
		const cat = await getCatalogue();
		const house = houseBySlug(cat, houseId);
		if (!house) return NextResponse.json({ error: 'Unknown house' }, { status: 404 });
		const kinds = new URL(request.url).searchParams.get('kind')?.split(',').filter(Boolean);
		const spaces = spacesAt(cat, house.id).filter((s) => !kinds?.length || kinds.includes(s.kind));
		const data = await getHouseAvailability(spaces, house.tz);
		return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
	} catch (err) {
		return handleApiError(err);
	}
}
