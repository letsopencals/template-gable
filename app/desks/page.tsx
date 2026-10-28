import type { Metadata } from 'next';
import { KindPage } from '@/components/site/kind-page';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Desks', description: 'Flex desks on the open floor and named studio desks with a monitor, by the half day or the day, in six houses across Ireland.' };

export default function DesksPage() {
	return (
		<KindPage
			number="DK"
			keys={['flex', 'desk']}
			title="A desk for the morning, the day, or every Tuesday."
			lead="Flex desks are any free seat on the open floor. Studio desks are named desks in the quiet studio, with a monitor, a proper chair and a locker. Both book by the half day, and you can bring a guest."
		/>
	);
}
