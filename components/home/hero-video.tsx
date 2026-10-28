'use client';

import { useEffect, useRef } from 'react';

/** Muted looping hero film. `muted` is set through the ref, or browsers block autoplay. */
export function HeroVideo({ src, poster, caption }: { src: string; poster: string | null; caption: string }) {
	const ref = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		const v = ref.current;
		if (!v) return;
		v.muted = true;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		void v.play().catch(() => undefined);
	}, []);
	return (
		<figure className="absolute inset-0 overflow-hidden bg-paper-deep">
			<video ref={ref} className="h-full w-full object-cover" src={src} poster={poster ?? undefined} loop playsInline muted preload="metadata" aria-label={caption} />
			<figcaption className="t-label absolute bottom-0 left-0 border-r border-t border-ink/20 bg-sheet/95 px-2.5 py-1.5">{caption}</figcaption>
		</figure>
	);
}
