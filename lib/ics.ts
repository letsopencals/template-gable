import type { Booking } from '@/lib/booking';
import { kindByKey } from '@/lib/site-config';

const stamp = (min: number) => new Date(min * 60000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** An .ics calendar file with one event per booking (UTC times, so every calendar places them right). */
export function bookingsToIcs(bookings: Booking[], brand: string): string {
	const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${brand}//Day sheet//EN`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
	for (const b of bookings) {
		const kind = b.space ? kindByKey(b.space.kind).label : 'Booking';
		const where = [b.house?.title, b.house?.address].filter(Boolean).join(', ');
		const notes = [b.ref ? `Ref ${b.ref}` : '', b.house?.presentation?.arrival ?? '', b.extras.length ? `Extras: ${b.extras.map((x) => `${x.title}${x.quantity > 1 ? ` ×${x.quantity}` : ''}`).join(', ')}` : '']
			.filter(Boolean)
			.join('\n');
		lines.push(
			'BEGIN:VEVENT',
			`UID:${b.id}@${brand.toLowerCase()}`,
			`DTSTAMP:${stamp(Math.floor(Date.now() / 60000))}`,
			`DTSTART:${stamp(b.start)}`,
			`DTEND:${stamp(b.end)}`,
			`SUMMARY:${esc(`${b.meetingTitle ? `${b.meetingTitle} · ` : ''}${b.name} (${kind}) · ${brand} ${b.house?.short ?? ''}`.trim())}`,
			`LOCATION:${esc(where)}`,
			`DESCRIPTION:${esc(notes)}`,
			...(b.house?.lat != null && b.house?.lng != null ? [`GEO:${b.house.lat};${b.house.lng}`] : []),
			'END:VEVENT',
		);
	}
	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

export function downloadIcs(bookings: Booking[], brand: string, filename = 'gable-day.ics') {
	const blob = new Blob([bookingsToIcs(bookings, brand)], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
