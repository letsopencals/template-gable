import { cn } from '@/lib/utils';
import type { KindKey } from '@/lib/site-config';

/**
 * Each kind of space drawn as a tiny plan (seen from above, wall lines + furniture + door swing), 32×32 viewBox,
 * 1.25px strokes in currentColor. Used in the mega menu, kind headers, space rows and the day sheet.
 */
export function PlanIcon({ kind, className, title }: { kind: KindKey; className?: string; title?: string }) {
	return (
		<svg
			viewBox="0 0 32 32"
			className={cn('h-8 w-8 shrink-0', className)}
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="square"
			role={title ? 'img' : undefined}
			aria-hidden={title ? undefined : true}
		>
			{title ? <title>{title}</title> : null}
			{ICONS[kind]}
		</svg>
	);
}

const door = (x: number, y: number) => (
	<>
		<path d={`M${x} ${y}v-6`} />
		<path d={`M${x} ${y - 6}a6 6 0 0 1 6 6`} strokeDasharray="1.5 1.5" />
	</>
);

const ICONS: Record<KindKey, React.ReactNode> = {
	// open floor: one long bench, chairs both sides
	flex: (
		<>
			<rect x="5" y="13" width="22" height="6" />
			{[8, 13, 18, 23].map((x) => (
				<g key={x}>
					<rect x={x - 1.5} y="9" width="3" height="2.5" />
					<rect x={x - 1.5} y="20.5" width="3" height="2.5" />
				</g>
			))}
		</>
	),
	// one desk, monitor, chair, locker
	desk: (
		<>
			<rect x="6" y="8" width="16" height="8" />
			<path d="M11 10h6" strokeWidth="2" />
			<circle cx="14" cy="20.5" r="2.5" />
			<rect x="24" y="8" width="3" height="16" strokeDasharray="1.5 1.5" />
		</>
	),
	// room walls with a table and chairs
	room: (
		<>
			<path d="M4 4h24v24H16" />
			<path d="M10 28H4V4" />
			{door(10, 28)}
			<rect x="11" y="10" width="10" height="10" rx="1" />
			{[13, 19].map((x) => (
				<g key={x}>
					<circle cx={x} cy="7.5" r="1.2" />
					<circle cx={x} cy="22.5" r="1.2" />
				</g>
			))}
			<circle cx="8.5" cy="15" r="1.2" />
			<circle cx="23.5" cy="15" r="1.2" />
		</>
	),
	// a small cell with one stool and a door
	booth: (
		<>
			<path d="M9 6h14v20h-8" />
			<path d="M9 26V6" />
			<path d="M9 26h0" />
			<path d="M15 26v-5" />
			<path d="M15 21a5 5 0 0 1 5 5" strokeDasharray="1.5 1.5" />
			<rect x="12" y="9" width="8" height="3" />
			<circle cx="16" cy="15.5" r="2" />
		</>
	),
	// studio: room + a mic on a boom + acoustic panels
	studio: (
		<>
			<path d="M4 4h24v24H16" />
			<path d="M10 28H4V4" />
			{door(10, 28)}
			<path d="M7 7v8M7 18v6M25 7v8M25 18v6" strokeWidth="2" />
			<circle cx="16" cy="14" r="3" />
			<path d="M16 17v4M13 21h6" />
		</>
	),
	// event space: big room, rows of seats facing a stage
	event: (
		<>
			<rect x="3" y="4" width="26" height="24" />
			<path d="M7 8h18" strokeWidth="2.5" />
			{[13, 17, 21, 25].map((y) => (
				<path key={y} d={`M7 ${y}h4M14 ${y}h4M21 ${y}h4`} />
			))}
		</>
	),
	// lockable office: room, two desks, a key
	office: (
		<>
			<path d="M4 4h24v24H16" />
			<path d="M10 28H4V4" />
			{door(10, 28)}
			<rect x="7" y="7" width="8" height="5" />
			<rect x="17" y="7" width="8" height="5" />
			<circle cx="22" cy="20" r="2" />
			<path d="M22 22v3M22 24h1.5" />
		</>
	),
};
