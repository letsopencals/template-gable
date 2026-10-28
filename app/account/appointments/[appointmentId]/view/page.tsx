import { redirect } from 'next/navigation';

/** Links in booking emails (/account/appointments/:id[/view]?action=cancel|reschedule) open the booking in the account. */
export default async function AppointmentLink({ params, searchParams }: { params: Promise<{ appointmentId: string }>; searchParams: Promise<{ action?: string }> }) {
	const { appointmentId } = await params;
	const { action } = await searchParams;
	redirect(`/account?booking=${encodeURIComponent(appointmentId)}${action ? `&action=${encodeURIComponent(action)}` : ''}`);
}
