import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Returns the public path when the file exists in /public, else null, so pages can fall back to a drawn placeholder
 * (components/ui/figure.tsx) instead of a broken image. Absolute URLs (the store's CDN images) pass through.
 * Server-only: resolve on the server and pass the result to client components.
 */
export function existingImage(src: string | null | undefined): string | null {
	if (!src) return null;
	if (/^https?:\/\//.test(src)) return src;
	try {
		return existsSync(path.join(process.cwd(), 'public', src)) ? src : null;
	} catch {
		return null;
	}
}

export function firstExisting(...srcs: (string | null | undefined)[]): string | null {
	for (const s of srcs) {
		const hit = existingImage(s);
		if (hit) return hit;
	}
	return null;
}
