import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { SheetStrip } from '@/components/ui/sheet';

export default function NotFound() {
	return (
		<section className="bg-paper">
			<div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
				<div className="border border-ink bg-sheet">
					<SheetStrip number="GA-404" title="Sheet missing from the set" refs={false} className="border-ink" />
					<div className="grid gap-8 p-6 sm:p-12 lg:grid-cols-12">
						<div className="hatch-light flex min-h-56 items-center justify-center border border-line-strong lg:col-span-5">
							<span className="t-num text-7xl font-medium text-cobalt">404</span>
						</div>
						<div className="flex flex-col justify-center gap-5 lg:col-span-7">
							<h1 className="t-h1">This page isn’t in the drawing set.</h1>
							<p className="t-lead">It may have moved, or the space was renamed. Start from the planner or the list of houses.</p>
							<div className="flex flex-wrap gap-3">
								<ButtonLink href="/book">Plan your day</ButtonLink>
								<ButtonLink href="/houses" variant="outline">
									Houses
								</ButtonLink>
								<Link href="/" className="self-center text-mute underline underline-offset-4 hover:text-ink">
									Home
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
