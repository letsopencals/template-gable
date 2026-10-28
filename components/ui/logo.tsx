import { cn } from '@/lib/utils';

/**
 * The Gable mark and monoline wordmark — the same hand-drawn paths as public/logo.svg, in currentColor so the logo
 * follows its surface (cobalt on paper by default via `text-cobalt`, paper on dark bands).
 * The mark: a gable end with a door cut out and a round attic window.
 */
const MARK = (
	<>
		<path d="M42 88 H16 V54 H8 L50 12 L92 54 H84 V88 H58 V66 H42 Z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="miter" strokeMiterlimit="10" />
		<circle cx="50" cy="40" r="6.5" fill="none" stroke="currentColor" strokeWidth="6" />
	</>
);

export function GableMark({ className }: { className?: string }) {
	return (
		<svg viewBox="-6 0 106 100" className={cn('h-8 w-8', className)} aria-hidden>
			{MARK}
		</svg>
	);
}

export function Logo({ className }: { className?: string }) {
	return (
		<svg viewBox="-6 0 386 100" className={cn('h-7 w-auto', className)} role="img" aria-label="Gable">
			{MARK}
			<g fill="none" stroke="currentColor" strokeWidth="7">
				<path d="M175.2 36.8 A30 30 0 1 0 184 58 H164" />
				<circle cx="216" cy="68" r="19" />
				<path d="M235 47 V88" />
				<path d="M256 26 V88" />
				<circle cx="275" cy="68" r="19" />
				<path d="M314 26 V88" />
				<path d="M333 68 H371 A19 19 0 1 0 366.6 80.2" />
			</g>
		</svg>
	);
}
