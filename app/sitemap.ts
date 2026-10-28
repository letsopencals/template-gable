import type { MetadataRoute } from 'next';
import { getCatalogue } from '@/lib/server-data';
import { kinds, siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const cat = await getCatalogue();
	const base = siteConfig.url.replace(/\/$/, '');
	const now = new Date();
	const statics = ['', '/book', '/houses', '/spaces', '/extras', '/pricing', '/teams', '/about', '/faq', '/contact', '/terms', '/privacy', ...new Set(kinds.map((k) => k.href.split('#')[0]!))];
	return [
		...statics.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
		...cat.houses.filter((h) => h.spaceCount).map((h) => ({ url: `${base}/houses/${h.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
		...cat.spaces.map((s) => ({ url: `${base}/spaces/${s.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 })),
	];
}
