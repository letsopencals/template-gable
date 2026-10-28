import type { Metadata } from 'next';
import { KindPage } from '@/components/site/kind-page';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Day offices', description: 'Lockable private offices for four or six people, by the half or full day.' };

export default function DayOfficesPage() {
	return (
		<KindPage
			number="DO"
			keys={['office']}
			title="Your own door, for today."
			lead="A lockable office for four or six, with desks, a screen and a whiteboard. For a sprint, an audit week, interviews or a visiting team. You get the key at reception and the run of the house."
		/>
	);
}
