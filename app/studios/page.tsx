import type { Metadata } from 'next';
import { KindPage } from '@/components/site/kind-page';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Studios', description: 'A treated podcast sound room in Smithfield and a north-lit photo studio in Cork, by the hour, with engineers and kit.' };

export default function StudiosPage() {
	return (
		<KindPage
			number="ST"
			keys={['studio']}
			title="Record it here. Shoot it here."
			lead="The Sound Room in Smithfield is treated for voice, with four broadcast mics and a desk. The Daylight Studio in Shandon has north light all day and a cyclorama wall. Book by the hour; add an engineer or a backdrop kit."
		/>
	);
}
