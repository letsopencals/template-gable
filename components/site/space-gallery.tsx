'use client';

import { useState } from 'react';
import { Figure } from '@/components/ui/figure';
import type { KindKey } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/** The space's photographs: one large, the rest as a ruled strip of thumbnails underneath. */
export function SpaceGallery({ images, name, kind }: { images: string[]; name: string; kind: KindKey }) {
	const [i, setI] = useState(0);
	const current = images[i] ?? null;
	return (
		<div className="border-t border-ink">
			<Figure src={current} alt={`${name}${images.length > 1 ? `, photo ${i + 1} of ${images.length}` : ''}`} fallback="kind" kind={kind} className="aspect-[16/10]" priority caption={images.length > 1 ? `${String(i + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}` : undefined} />
			{images.length > 1 ? (
				<div className="flex border-t border-ink">
					{images.slice(0, 6).map((src, n) => (
						<button
							key={src}
							type="button"
							aria-label={`Show photo ${n + 1}`}
							aria-pressed={n === i}
							onClick={() => setI(n)}
							className={cn('relative aspect-[4/3] w-24 border-r border-ink last:border-r-0', n === i && 'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-marigold')}
						>
							{/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnails */}
							<img src={src} alt="" className={cn('h-full w-full object-cover', n !== i && 'opacity-70 hover:opacity-100')} />
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
