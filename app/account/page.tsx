import { BookingsView } from '@/components/account/bookings-view';
import { getCatalogue } from '@/lib/server-data';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ booking?: string; action?: string }> }) {
	const { booking, action } = await searchParams;
	return <BookingsView cat={await getCatalogue()} focus={booking ? { id: booking, action: action ?? null } : null} />;
}
