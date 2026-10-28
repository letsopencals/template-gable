import type { Metadata } from 'next';
import { KindPage } from '@/components/site/kind-page';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Event spaces', description: 'The Roof Terrace at Dock House and the Long Room in Galway, by the half or full day, with a barista bar and catering.' };

export default function EventsPage() {
	return (
		<KindPage
			number="EV"
			keys={['event']}
			title="Launches, offsites and long tables."
			lead="A roof terrace for sixty over Grand Canal Dock and a stone-walled room in Galway that seats forty at one table. Book by the half or full day; we bring the barista bar, lunch and a host."
		/>
	);
}
