import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social card: a drawing sheet — cobalt field, the gable mark, the headline and a title-block strip. */
export default function OpengraphImage() {
	return new ImageResponse(
		(
			<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#2A44D4', color: '#fff', padding: 48, fontFamily: 'sans-serif' }}>
				<div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', border: '2px solid rgba(255,255,255,0.7)', padding: 48 }}>
					<svg width="120" height="114" viewBox="-6 0 106 100">
						<path d="M42 88 H16 V54 H8 L50 12 L92 54 H84 V88 H58 V66 H42 Z" fill="none" stroke="#fff" strokeWidth="7" />
						<circle cx="50" cy="40" r="6.5" fill="none" stroke="#F4B63F" strokeWidth="6" />
					</svg>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Work in a good building.</div>
						<div style={{ fontSize: 30, marginTop: 20, opacity: 0.85 }}>Desks, rooms, booths and studios in six houses across Dublin, Cork and Galway.</div>
					</div>
				</div>
				<div style={{ display: 'flex', borderLeft: '2px solid rgba(255,255,255,0.7)', borderRight: '2px solid rgba(255,255,255,0.7)', borderBottom: '2px solid rgba(255,255,255,0.7)', fontSize: 20, letterSpacing: 3 }}>
					<div style={{ padding: '14px 20px', borderRight: '2px solid rgba(255,255,255,0.7)' }}>GA-001</div>
					<div style={{ padding: '14px 20px', flex: 1 }}>GABLE · WORKSPACE ACROSS IRELAND</div>
					<div style={{ padding: '14px 20px', background: '#F4B63F', color: '#121633' }}>BOOK BY THE HALF HOUR</div>
				</div>
			</div>
		),
		size,
	);
}
