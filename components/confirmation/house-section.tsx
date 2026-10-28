import { spacesAt, type Catalogue, type House, type Space } from '@/lib/workspace';
import { cn } from '@/lib/utils';

/**
 * A section through the house — the drawing an architect cuts vertically through a building: floors stacked under the
 * gable, a stair core, the front door on the ground floor. Each booked space is marked on its level in marigold, and a
 * dashed route runs from the front door, up the stairs, to it. Levels come from the spaces' `Level:` lines; a space
 * without one sits on the ground floor.
 */
export function HouseSection({ cat, house, marked, className }: { cat: Catalogue; house: House; marked: Space[]; className?: string }) {
	const all = spacesAt(cat, house.id);
	const levels = Math.max(2, ...all.map((s) => (s.level ?? 0) + 1), ...marked.map((s) => (s.level ?? 0) + 1));
	const W = 560;
	const floorH = 54;
	const roof = 70;
	const ground = roof + levels * floorH;
	const H = ground + 34;
	const left = 40;
	const right = W - 40;
	const core = { x: right - 92, w: 46 };
	const door = { x: left + 22, w: 26 };
	const floorY = (lv: number) => ground - lv * floorH; // the floor line of a level
	// place the marked spaces along their level, left of the core
	const byLevel = new Map<number, Space[]>();
	for (const s of marked) {
		const lv = Math.max(0, s.level ?? 0);
		byLevel.set(lv, [...(byLevel.get(lv) ?? []), s]);
	}
	const boxes = [...byLevel.entries()].flatMap(([lv, list]) =>
		list.map((s, i) => {
			const slot = (core.x - left - 30) / Math.max(2, list.length);
			const w = Math.min(130, slot - 14);
			const x = left + 24 + (lv === 0 ? 60 : 0) + i * slot;
			return { s, lv, x, y: floorY(lv) - floorH + 12, w, h: floorH - 18 };
		}),
	);
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className={cn('w-full text-ink', className)} role="img" aria-label={`Section through ${house.short}: ${marked.map((s) => `${s.name} on ${s.level ? `level ${s.level}` : 'the ground floor'}`).join(', ')}`}>
			<defs>
				<pattern id="sec-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
				</pattern>
			</defs>
			{/* ground, cut hatched */}
			<rect x="0" y={ground} width={W} height="12" fill="url(#sec-hatch)" />
			<line x1="0" y1={ground} x2={W} y2={ground} stroke="currentColor" strokeWidth="1.6" />
			{/* walls + gable */}
			<path d={`M${left} ${ground}V${roof}L${W / 2} 10L${right} ${roof}V${ground}`} fill="none" stroke="currentColor" strokeWidth="2.4" />
			{/* floors */}
			{Array.from({ length: levels }, (_, lv) => (
				<g key={lv}>
					{lv > 0 ? <rect x={left} y={floorY(lv) - 3} width={right - left} height="6" fill="url(#sec-hatch)" stroke="currentColor" strokeWidth="1" /> : null}
					<text x={right + 6} y={floorY(lv) - floorH / 2 + 4} className="fill-current" style={{ font: '500 9px var(--font-mono)', letterSpacing: '0.08em' }}>
						{lv === 0 ? 'L0' : `L${lv}`}
					</text>
				</g>
			))}
			{/* stair core */}
			<rect x={core.x} y={floorY(levels - 1) - floorH + 6} width={core.w} height={ground - (floorY(levels - 1) - floorH + 6)} fill="var(--color-paper)" stroke="currentColor" strokeWidth="1" />
			{Array.from({ length: levels }, (_, lv) => (
				<path key={lv} d={`M${core.x + 4} ${floorY(lv) - 4}L${core.x + core.w - 4} ${floorY(lv) - floorH + 10}`} stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" fill="none" />
			))}
			{/* door */}
			<rect x={door.x} y={ground - 34} width={door.w} height="34" fill="var(--color-sheet)" stroke="currentColor" strokeWidth="1.4" />
			<text x={door.x - 2} y={ground + 26} className="fill-current" style={{ font: '500 9px var(--font-mono)', letterSpacing: '0.08em' }}>
				ENTRANCE
			</text>
			{/* booked spaces */}
			{boxes.map((b) => (
				<g key={b.s.id}>
					<rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--color-marigold)" stroke="currentColor" strokeWidth="1.6" />
					<text x={b.x + 6} y={b.y + b.h / 2 + 4} className="fill-current" style={{ font: '600 11px var(--font-sans)' }}>
						{b.s.name.length > 16 ? `${b.s.name.slice(0, 15)}…` : b.s.name}
					</text>
				</g>
			))}
			{/* routes: door → core → up → along to the space */}
			{boxes.map((b, i) => {
				const yWalk = ground - 10;
				const coreX = core.x + core.w / 2;
				const yLevel = b.lv === 0 ? yWalk : floorY(b.lv) - 10;
				const d =
					b.lv === 0
						? `M${door.x + door.w} ${yWalk}H${b.x}`
						: `M${door.x + door.w} ${yWalk}H${coreX}V${yLevel}H${b.x + b.w}`;
				const len = b.lv === 0 ? b.x - door.x : coreX - door.x + (yWalk - yLevel) + (coreX - b.x - b.w);
				const id = `route-${b.s.id}`;
				return (
					<g key={b.s.id}>
						{/* a solid stroke draws on inside the mask, so the dashed route appears from the door */}
						<mask id={id} maskUnits="userSpaceOnUse">
							<path d={d} fill="none" stroke="white" strokeWidth="6" className="draw-on" style={{ ['--len' as string]: Math.abs(len) + 40, animationDelay: `${300 + i * 250}ms` }} />
						</mask>
						<path d={d} fill="none" stroke="var(--color-cobalt)" strokeWidth="1.8" strokeDasharray="5 4" mask={`url(#${id})`} />
					</g>
				);
			})}
		</svg>
	);
}
