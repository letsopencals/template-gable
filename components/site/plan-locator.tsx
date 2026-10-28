import type { KindKey } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export interface LocatorSpace {
	id: string;
	kind: KindKey;
	name: string;
	seats: number;
}

/**
 * A schematic floor plan of one house, generated from its spaces (no per-store drawing needed): rooms along the
 * north wall sized by seats, a corridor, the open floor with its benches, the studio desks in a row and the booths
 * by the east wall; the entrance is a gap in the south wall. `highlightId` fills that space with the highlighter and,
 * with `route`, a dashed route is drawn from the front door to it (the wayfinding on the confirmation).
 * Pure SVG, safe in server components.
 */
export function PlanLocator({
	spaces,
	highlightId,
	route,
	className,
	label,
}: {
	spaces: LocatorSpace[];
	highlightId?: string | null;
	route?: boolean;
	className?: string;
	label?: string;
}) {
	const W = 400;
	const H = 260;
	const rooms = spaces.filter((s) => s.kind === 'room' || s.kind === 'studio' || s.kind === 'event' || s.kind === 'office');
	const flex = spaces.filter((s) => s.kind === 'flex');
	const desks = spaces.filter((s) => s.kind === 'desk');
	const booths = spaces.filter((s) => s.kind === 'booth');

	// North band: rooms left to right, widths ~ seats, scaled to fit.
	const raw = rooms.map((r) => Math.max(36, Math.min(130, 18 + r.seats * 6)));
	const avail = W - 20;
	const scale = Math.min(1, avail / Math.max(1, raw.reduce((a, b) => a + b, 0)));
	let x = 10;
	const roomRects = rooms.map((r, i) => {
		const w = raw[i]! * scale;
		const rect = { s: r, x, y: 10, w, h: 96 };
		x += w;
		return rect;
	});

	// South band: open floor (x 96–262), desks column, booths column.
	const flexRect = flex.length ? { s: flex[0]!, x: 102, y: 146, w: 160, h: 94 } : null;
	const deskCols = Math.ceil(desks.length / 4) || 1;
	const deskRects = desks.map((d, i) => ({ s: d, x: 274 + Math.floor(i / 4) * 24, y: 150 + (i % 4) * 22, w: 18, h: 16 }));
	const bx = 274 + deskCols * 24 + 8;
	const boothRects = booths.map((b, i) => ({ s: b, x: Math.min(bx, W - 40), y: 150 + i * 30, w: 28, h: 24 }));

	const all = [...roomRects, ...(flexRect ? [flexRect] : []), ...deskRects, ...boothRects];
	const target = all.find((r) => r.s.id === highlightId) ?? null;
	const door = { x: 88, y: H - 10 };
	const corridorY = 126;

	let path: string | null = null;
	if (route && target) {
		const cx = target.x + target.w / 2;
		const ty = target.y < corridorY ? target.y + target.h : target.y;
		path = target.y < corridorY ? `M${door.x} ${door.y} V${corridorY} H${cx} V${ty}` : `M${door.x} ${door.y} V${corridorY} H${cx} V${ty}`;
	}

	return (
		<svg viewBox={`0 0 ${W} ${H}`} className={cn('h-auto w-full text-ink', className)} role="img" aria-label={label ?? 'Floor plan'}>
			<defs>
				<pattern id="pl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
				</pattern>
			</defs>
			{/* outer walls, with a gap for the door */}
			<path d={`M${door.x - 16} ${H - 10} H10 V10 H${W - 10} V${H - 10} H${door.x + 16}`} fill="none" stroke="currentColor" strokeWidth="3" />
			<path d={`M${door.x + 16} ${H - 10} v-22 a22 22 0 0 0 -22 22`} fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
			<text x={door.x} y={H - 1} textAnchor="middle" className="fill-current font-mono text-[7px] uppercase tracking-wider" opacity="0.7">
				Entrance
			</text>
			{/* stair core */}
			<rect x="14" y="146" width="58" height="94" fill="url(#pl-hatch)" stroke="currentColor" strokeWidth="1" />
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<line key={i} x1="14" x2="72" y1={160 + i * 12} y2={160 + i * 12} stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
			))}
			<text x="43" y="155" textAnchor="middle" className="fill-current font-mono text-[7px] uppercase" opacity="0.7">
				Stairs
			</text>

			{roomRects.map((r) => (
				<Room key={r.s.id} r={r} on={r.s.id === highlightId} />
			))}
			{flexRect ? (
				<g>
					<rect x={flexRect.x} y={flexRect.y} width={flexRect.w} height={flexRect.h} fill={flexRect.s.id === highlightId ? 'var(--color-marigold-soft)' : 'none'} stroke={flexRect.s.id === highlightId ? 'var(--color-cobalt)' : 'currentColor'} strokeWidth={flexRect.s.id === highlightId ? 2 : 1} strokeDasharray="4 3" />
					{[0, 1, 2].map((i) => (
						<rect key={i} x={flexRect.x + 14} y={flexRect.y + 14 + i * 26} width={flexRect.w - 28} height="10" fill="none" stroke="currentColor" strokeWidth="0.9" />
					))}
					<text x={flexRect.x + flexRect.w / 2} y={flexRect.y + flexRect.h - 4} textAnchor="middle" className="fill-current font-mono text-[7px] uppercase">
						Open floor · {flexRect.s.seats}
					</text>
				</g>
			) : null}
			{deskRects.map((r) => (
				<rect key={r.s.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.s.id === highlightId ? 'var(--color-marigold)' : 'none'} stroke={r.s.id === highlightId ? 'var(--color-cobalt)' : 'currentColor'} strokeWidth={r.s.id === highlightId ? 2 : 0.9}>
					<title>{r.s.name}</title>
				</rect>
			))}
			{boothRects.map((r) => (
				<g key={r.s.id}>
					<rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.s.id === highlightId ? 'var(--color-marigold)' : 'url(#pl-hatch)'} stroke={r.s.id === highlightId ? 'var(--color-cobalt)' : 'currentColor'} strokeWidth={r.s.id === highlightId ? 2 : 1} />
					<text x={r.x + r.w / 2} y={r.y + r.h / 2 + 2.5} textAnchor="middle" className="fill-current font-mono text-[7px]">
						{r.s.name}
					</text>
				</g>
			))}

			{path ? (
				<>
					<path d={path} fill="none" stroke="var(--color-cobalt)" strokeWidth="2" strokeDasharray="5 4" className="draw-on" style={{ ['--len' as string]: 900 }} />
					<circle cx={door.x} cy={door.y} r="4" fill="var(--color-cobalt)" />
				</>
			) : null}

			{/* north arrow */}
			<g transform={`translate(${W - 24} ${H - 34})`} opacity="0.75">
				<path d="M0 -10 L5 6 L0 2 L-5 6 Z" fill="currentColor" />
				<text y="16" textAnchor="middle" className="fill-current font-mono text-[7px]">
					N
				</text>
			</g>
		</svg>
	);
}

function Room({ r, on }: { r: { s: LocatorSpace; x: number; y: number; w: number; h: number }; on: boolean }) {
	const doorX = r.x + r.w / 2 - 7;
	return (
		<g>
			<rect x={r.x} y={r.y} width={r.w} height={r.h} fill={on ? 'var(--color-marigold-soft)' : 'none'} stroke={on ? 'var(--color-cobalt)' : 'currentColor'} strokeWidth={on ? 2.5 : 1.4} />
			{/* door swing into the corridor */}
			<path d={`M${doorX} ${r.y + r.h} h14`} stroke="var(--color-paper)" strokeWidth="3" />
			<path d={`M${doorX} ${r.y + r.h} v12 a12 12 0 0 0 12 -12`} fill="none" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 2" />
			{r.w > 34 ? (
				<text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" className={cn('font-mono text-[7.5px] uppercase', on ? 'fill-[var(--color-cobalt-deep)] font-semibold' : 'fill-current')}>
					{r.s.name.length > Math.floor(r.w / 5.2) ? `${r.s.name.slice(0, Math.floor(r.w / 5.2) - 1)}…` : r.s.name}
				</text>
			) : null}
			<text x={r.x + r.w / 2} y={r.y + r.h / 2 + 11} textAnchor="middle" className="fill-current font-mono text-[7px]" opacity="0.6">
				{r.s.seats}p
			</text>
		</g>
	);
}
