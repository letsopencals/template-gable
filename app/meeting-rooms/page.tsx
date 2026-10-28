import type { Metadata } from 'next';
import { KindPage } from '@/components/site/kind-page';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Meeting rooms', description: 'Meeting rooms for 4 to 16 and phone booths, by the half hour, with catering, video kit and guest invites.' };

export default function MeetingRoomsPage() {
	return (
		<KindPage
			number="MR"
			keys={['room', 'booth']}
			title="Rooms that work with one cable."
			lead="Daylit meeting rooms for four to sixteen, each with a screen, a video bar and a whiteboard wall, plus phone booths for the call you can’t take at your desk. Book by the half hour, add coffee or lunch, invite your guests."
		/>
	);
}
