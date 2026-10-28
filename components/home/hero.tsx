import { Figure } from '@/components/ui/figure';
import { HeroVideo } from '@/components/home/hero-video';
import { siteConfig } from '@/lib/site-config';

/**
 * The hero is the cover sheet of the drawing set: a big headline set left on paper, the photograph (or film) on the
 * right in a ruled frame with its caption strip, and a column of "sheet facts" (houses, cities, first opened).
 */
export function Hero({ poster, video, houseCount, spaceCount }: { poster: string | null; video: string | null; houseCount: number; spaceCount: number }) {
	const h = siteConfig.hero;
	return (
		<section className="bg-paper">
			<div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-10">
				<div className="grid border-x border-b border-ink lg:grid-cols-12">
					<div className="flex flex-col justify-between gap-10 border-b border-ink p-6 sm:p-10 lg:col-span-6 lg:border-b-0 lg:border-r">
						<div className="flex items-center gap-3">
							<span className="t-label shrink-0 whitespace-nowrap border border-ink px-2 py-1 font-semibold">GA-001</span>
							<span className="t-label text-mute">{h.kicker}</span>
						</div>
						<h1 className="t-hero">
							{h.heading[0]}
							<br />
							<span className="highlight">{h.heading[1]}</span>
						</h1>
						<p className="t-lead max-w-xl">{h.body}</p>
						<dl className="grid grid-cols-3 border-t border-ink pt-4">
							{[
								[String(houseCount || 6), 'houses'],
								[String(spaceCount || '90+'), 'bookable spaces'],
								['30 min', 'shortest booking'],
							].map(([v, k]) => (
								<div key={k} className="flex flex-col gap-1">
									<dt className="t-label order-2 text-mute">{k}</dt>
									<dd className="t-num order-1 text-2xl font-medium sm:text-3xl">{v}</dd>
								</div>
							))}
						</dl>
					</div>
					<div className="relative min-h-[320px] lg:col-span-6 lg:min-h-[620px]">
						{video ? (
							<HeroVideo src={video} poster={poster} caption={h.caption} />
						) : (
							<Figure src={poster} alt="Inside Gable Dock House" caption={h.caption} priority className="absolute inset-0" />
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
