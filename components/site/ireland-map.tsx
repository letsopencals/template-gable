/**
 * A hand-drawn location plan: Ireland's coastline as a single drafting line (simplified, projected from lat/lng),
 * every house as a numbered pin, and a Dublin Bay inset for the four Dublin houses. Pins link to the house pages.
 * Pins come from the store locations' latitude/longitude, so new houses land in the right place.
 */
export interface MapPin {
	slug: string;
	short: string;
	lat: number;
	lng: number;
	index: number;
}

// Coastline, clockwise from Malin Head (lng, lat).
const COAST: [number, number][] = [
	[-7.37, 55.38], [-7.63, 55.27], [-7.9, 55.22], [-8.28, 55.15], [-8.5, 54.99], [-8.45, 54.83], [-8.8, 54.7], [-8.5, 54.62], [-8.2, 54.6], [-8.45, 54.45], [-8.6, 54.3],
	[-9.0, 54.25], [-9.35, 54.32], [-9.8, 54.28], [-10.0, 54.22], [-9.95, 54.05], [-10.2, 53.95], [-9.75, 53.82], [-9.95, 53.72], [-9.9, 53.6], [-10.15, 53.52], [-10.2, 53.4],
	[-9.85, 53.33], [-9.4, 53.25], [-9.05, 53.26], [-9.0, 53.17], [-9.27, 53.15], [-9.45, 52.95], [-9.5, 52.75], [-9.93, 52.56], [-9.65, 52.55], [-9.95, 52.42], [-9.75, 52.25],
	[-10.45, 52.12], [-10.1, 52.0], [-10.35, 51.9], [-10.0, 51.75], [-10.2, 51.6], [-9.82, 51.45], [-9.4, 51.47], [-9.0, 51.55], [-8.5, 51.65], [-8.25, 51.8], [-7.85, 51.95],
	[-7.6, 52.08], [-7.2, 52.15], [-6.93, 52.12], [-6.65, 52.2], [-6.36, 52.17], [-6.25, 52.45], [-6.1, 52.75], [-6.0, 52.97], [-6.05, 53.15], [-6.12, 53.29], [-6.2, 53.33],
	[-6.05, 53.38], [-6.15, 53.5], [-6.25, 53.72], [-6.3, 53.9], [-6.05, 54.03], [-5.65, 54.23], [-5.5, 54.38], [-5.45, 54.6], [-5.7, 54.65], [-5.75, 54.85], [-6.0, 55.05],
	[-6.15, 55.22], [-6.65, 55.2], [-7.0, 55.18], [-7.3, 55.25],
];

const BAY: [number, number][] = [
	[-6.05, 53.392], [-6.1, 53.375], [-6.15, 53.362], [-6.19, 53.352], [-6.215, 53.344], [-6.205, 53.333], [-6.19, 53.32], [-6.17, 53.305], [-6.14, 53.296], [-6.12, 53.292], [-6.1, 53.28], [-6.09, 53.265], [-6.1, 53.25],
];

const MAIN = { lng0: -10.7, lat0: 55.5, sx: 59.5, sy: 100, ox: 12, oy: 10 };
const proj = ([lng, lat]: [number, number]) => [MAIN.ox + (lng - MAIN.lng0) * MAIN.sx, MAIN.oy + (MAIN.lat0 - lat) * MAIN.sy] as const;
// Inset: Dublin city to Dún Laoghaire, lng -6.31..-6.11, lat 53.365..53.245, drawn at x 330..560, y 40..270
const INSET = { lng0: -6.31, lat0: 53.365, sx: 1150, sy: 1920, ox: 330, oy: 48 };
const projInset = ([lng, lat]: [number, number]) => [INSET.ox + (lng - INSET.lng0) * INSET.sx, INSET.oy + (INSET.lat0 - lat) * INSET.sy] as const;

const pathOf = (pts: readonly (readonly [number, number])[], close = false) =>
	pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + (close ? ' Z' : '');

const inDublin = (p: MapPin) => p.lng > -6.31 && p.lng < -6.08 && p.lat > 53.245 && p.lat < 53.365;

export function IrelandMap({ pins }: { pins: MapPin[] }) {
	const coast = pathOf(COAST.map(proj), true);
	const bay = pathOf(BAY.map(projInset));
	const liffey = pathOf(([[-6.36, 53.348], [-6.3, 53.346], [-6.26, 53.346], [-6.235, 53.347], [-6.214, 53.345]] as [number, number][]).map(projInset));
	const canal = pathOf(([[-6.32, 53.33], [-6.28, 53.333], [-6.262, 53.331], [-6.25, 53.334], [-6.238, 53.338], [-6.235, 53.341]] as [number, number][]).map(projInset));
	const dublinBox = [proj([-6.31, 53.365]), proj([-6.08, 53.245])] as const;

	return (
		<svg viewBox="0 0 580 420" className="h-auto w-full text-ink" role="img" aria-label="Map of Gable houses in Ireland">
			<defs>
				<pattern id="sea-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="7" stroke="var(--color-cobalt)" strokeOpacity="0.14" strokeWidth="1" />
				</pattern>
			</defs>
			<rect x="0" y="0" width="300" height="420" fill="url(#sea-hatch)" />
			<path d={coast} fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="draw-on" style={{ ['--len' as string]: 1600 }} />

			{/* Dublin callout box + leader to the inset */}
			<rect x={dublinBox[0][0] - 4} y={dublinBox[0][1] - 4} width={dublinBox[1][0] - dublinBox[0][0] + 8} height={dublinBox[1][1] - dublinBox[0][1] + 8} fill="none" stroke="var(--color-cobalt)" strokeDasharray="3 2" />
			<path d={`M${dublinBox[1][0] + 4} ${dublinBox[0][1] - 4} L330 48`} stroke="var(--color-cobalt)" strokeWidth="0.8" strokeDasharray="3 2" />

			{pins.filter((p) => !inDublin(p)).map((p) => {
				const [x, y] = proj([p.lng, p.lat]);
				return <Pin key={p.slug} x={x} y={y} pin={p} labelRight={x < 120} />;
			})}

			{/* Inset */}
			<g>
				<rect x="322" y="30" width="250" height="250" fill="var(--color-sheet)" stroke="currentColor" />
				<clipPath id="inset-clip">
					<rect x="322" y="30" width="250" height="250" />
				</clipPath>
				<g clipPath="url(#inset-clip)">
					<path d={`${bay} L580 250 L580 30 Z`} fill="url(#sea-hatch)" />
					<path d={bay} fill="none" stroke="currentColor" strokeWidth="1.4" />
					<path d={liffey} fill="none" stroke="var(--color-cobalt)" strokeWidth="2" opacity="0.5" />
					<path d={canal} fill="none" stroke="var(--color-cobalt)" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
					{stackLabels(pins.filter(inDublin).map((p) => ({ p, xy: projInset([p.lng, p.lat]) }))).map(({ p, xy, ly }) => (
						<Pin key={p.slug} x={xy[0]} y={xy[1]} labelY={ly} pin={p} labelRight={xy[0] < 470} />
					))}
				</g>
				<text x="330" y="272" className="fill-current font-mono text-[9px] uppercase tracking-wider" opacity="0.7">
					Inset · Dublin Bay
				</text>
			</g>

			{/* scale bar + north */}
			<g transform="translate(330 330)">
				<rect x="0" y="0" width="40" height="5" fill="currentColor" />
				<rect x="40" y="0" width="40" height="5" fill="none" stroke="currentColor" />
				<rect x="80" y="0" width="40" height="5" fill="currentColor" />
				<text x="0" y="18" className="fill-current font-mono text-[8px]">0</text>
				<text x="112" y="18" className="fill-current font-mono text-[8px]">60 km</text>
				<path d="M200 -14 L206 6 L200 1 L194 6 Z" fill="currentColor" />
				<text x="200" y="18" textAnchor="middle" className="fill-current font-mono text-[8px]">N</text>
			</g>
			<text x="330" y="372" className="fill-current font-mono text-[9px] uppercase tracking-wider" opacity="0.7">
				Gable · location plan · not to scale
			</text>
		</svg>
	);
}

/** Push labels apart vertically (sorted by y) so close pins stay readable; a leader joins pin and label. */
function stackLabels<T extends { xy: readonly [number, number] }>(items: T[]): (T & { ly: number })[] {
	const sorted = [...items].sort((a, b) => a.xy[1] - b.xy[1]);
	let last = -Infinity;
	return sorted.map((it) => {
		const ly = Math.max(it.xy[1], last + 22);
		last = ly;
		return { ...it, ly };
	});
}

function Pin({ x, y, pin, labelRight, labelY }: { x: number; y: number; pin: MapPin; labelRight: boolean; labelY?: number }) {
	const label = `${String(pin.index).padStart(2, '0')} ${pin.short}`;
	const w = label.length * 6.2 + 10;
	const ly = labelY ?? y;
	const lx = labelRight ? x + 16 : x - 16 - w;
	return (
		<a href={`/houses/${pin.slug}`}>
			<g className="group cursor-pointer">
				{ly !== y ? <path d={`M${x} ${y} L${labelRight ? lx : lx + w} ${ly}`} stroke="var(--color-ink)" strokeWidth="0.8" /> : null}
				<circle cx={x} cy={y} r="9" fill="var(--color-marigold)" opacity="0.35" />
				<circle cx={x} cy={y} r="4.5" fill="var(--color-cobalt)" stroke="var(--color-sheet)" strokeWidth="1.5" />
				<g transform={`translate(${lx} ${ly - 9})`}>
					<rect width={w} height="18" fill="var(--color-ink)" className="transition-colors group-hover:fill-[var(--color-cobalt)]" />
					<text x="5" y="12.5" className="fill-white font-mono text-[9px] uppercase tracking-wide">
						{label}
					</text>
				</g>
			</g>
		</a>
	);
}
