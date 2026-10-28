import type { Metadata, Viewport } from 'next';
import { Azeret_Mono, Bricolage_Grotesque, Onest } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/components/providers';
import { houses, siteConfig } from '@/lib/site-config';
import { getStoreSettings } from '@/lib/server-data';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const sans = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' });
const mono = Azeret_Mono({ subsets: ['latin'], variable: '--font-azeret', display: 'swap', weight: ['400', '500', '600'] });

const title = `${siteConfig.name} — ${siteConfig.tagline}`;

export const metadata: Metadata = {
	title: { default: title, template: `%s · ${siteConfig.name}` },
	description: siteConfig.description,
	metadataBase: new URL(siteConfig.url),
	openGraph: { title, description: siteConfig.description, siteName: siteConfig.name, locale: 'en_IE', type: 'website' },
	twitter: { card: 'summary_large_image', title, description: siteConfig.description },
	robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#f6f6f2' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const initialSettings = await getStoreSettings();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: siteConfig.name,
		description: siteConfig.description,
		url: siteConfig.url,
		email: siteConfig.contact.email,
		telephone: siteConfig.contact.phone,
		subOrganization: houses.map((h) => ({
			'@type': 'CoworkingSpace',
			name: `${siteConfig.name} ${h.short}`,
			url: `${siteConfig.url}/houses/${h.match[0]}`,
			telephone: h.phone,
			address: { '@type': 'PostalAddress', addressLocality: h.neighbourhood, addressCountry: 'IE' },
			openingHours: h.hours.map((r) => `${r.days.replace('–', '-').replace(/(\w{2})\w/g, '$1')} ${r.time.replace('–', '-')}`),
		})),
	};

	return (
		<html lang="en-IE" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
			<body>
				{/* Allow parent frames (the opencals.com template tour) to control scrolling via postMessage */}
				<script
					dangerouslySetInnerHTML={{
						__html: `window.addEventListener("message",function(e){if(e.data&&e.data.type==="scrollTo"&&e.data.id){var el=document.getElementById(e.data.id);if(el){var top=el.getBoundingClientRect().top+window.scrollY;window.scrollTo({top:top,behavior:"smooth"})}}if(e.data&&e.data.type==="scrollTop"){window.scrollTo({top:0,behavior:"smooth"})}});`,
					}}
				/>
				<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
					Skip to content
				</a>
				<Providers initialSettings={initialSettings}>
					<Header />
					<main id="main">{children}</main>
					<Footer />
				</Providers>
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			</body>
		</html>
	);
}
