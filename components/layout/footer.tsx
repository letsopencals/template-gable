import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { houses, kinds, siteConfig } from '@/lib/site-config';

/**
 * The footer is the drawing's title block, blown up to full width: a grid of boxed cells with mono keys —
 * every house with its hours and phone, the spaces, the company, and the drawing's "issue" line.
 */
export function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="bg-paper print:hidden">
			<div className="mx-auto max-w-[1360px] px-4 pb-8 pt-16 sm:px-6 lg:px-10">
				<div className="border border-ink bg-sheet">
					{/* Row 1: brand + spaces + company */}
					<div className="grid lg:grid-cols-12">
						<div className="flex flex-col justify-between gap-8 border-b border-ink p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
							<Link href="/" aria-label={`${siteConfig.name} home`} className="text-cobalt">
								<Logo />
							</Link>
							<p className="max-w-sm text-[0.9375rem] text-mute">{siteConfig.description}</p>
							<div className="t-num text-[0.8125rem] leading-relaxed">
								<a href={`mailto:${siteConfig.contact.email}`} className="hover:text-cobalt">
									{siteConfig.contact.email}
								</a>
								<br />
								<a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="hover:text-cobalt">
									{siteConfig.contact.phone}
								</a>
							</div>
						</div>
						<FooterCol title="Spaces" className="border-b border-ink lg:col-span-3 lg:border-b-0 lg:border-r">
							{kinds.map((k) => (
								<FooterLink key={k.key} href={k.href}>
									{k.plural}
								</FooterLink>
							))}
							<FooterLink href="/spaces">All spaces</FooterLink>
						</FooterCol>
						<FooterCol title="Gable" className="lg:col-span-4">
							<div className="grid grid-cols-2 gap-x-4">
								{[
									['/houses', 'Houses'],
									['/extras', 'Extras'],
									['/pricing', 'Pricing'],
									['/teams', 'Teams'],
									['/about', 'About'],
									['/faq', 'FAQ'],
									['/contact', 'Contact'],
									['/account', 'Your bookings'],
								].map(([href, label]) => (
									<FooterLink key={href} href={href!}>
										{label}
									</FooterLink>
								))}
							</div>
						</FooterCol>
					</div>

					{/* Row 2: every house */}
					<div className="grid grid-cols-2 border-t border-ink md:grid-cols-3 xl:grid-cols-6">
						{houses.map((h, i) => (
							<Link
								key={h.short}
								href={`/houses/${h.match[0]}`}
								className="group flex flex-col gap-1 border-b border-r border-line-strong p-4 hover:bg-wash/60 xl:border-b-0 [&:nth-child(6)]:border-r-0"
							>
								<span className="t-label text-mute">H-0{i + 1}</span>
								<span className="font-display text-[1.0625rem] font-semibold group-hover:text-cobalt">{h.short}</span>
								<span className="text-[0.8125rem] text-mute">{h.neighbourhood}</span>
								<span className="t-num mt-2 text-[0.75rem] leading-relaxed">
									{h.hours.map((r) => (
										<span key={r.days} className="block">
											{r.days} {r.time}
										</span>
									))}
								</span>
							</Link>
						))}
					</div>

					{/* Row 3: the issue line */}
					<div className="grid border-t border-ink text-[0.75rem] sm:grid-cols-12">
						<div className="t-label border-b border-line-strong px-4 py-3 text-mute sm:col-span-5 sm:border-b-0 sm:border-r">{siteConfig.footer.note}</div>
						<div className="t-label border-b border-line-strong px-4 py-3 text-mute sm:col-span-3 sm:border-b-0 sm:border-r">
							© {year} {siteConfig.legalName}
						</div>
						<div className="flex items-center gap-4 px-4 py-3 sm:col-span-3">
							<Link href="/terms" className="hover:text-cobalt">
								Terms
							</Link>
							<Link href="/privacy" className="hover:text-cobalt">
								Privacy
							</Link>
							{siteConfig.social.map((s) => (
								<a key={s.label} href={s.href} className="hover:text-cobalt" rel="noreferrer" target="_blank">
									{s.label}
								</a>
							))}
						</div>
						<div className="t-label hidden items-center justify-center border-l border-ink font-semibold sm:col-span-1 sm:flex">GA-999</div>
					</div>
				</div>
				<p className="mt-4 text-center text-[0.75rem] text-faint">
					A booking site template built on{' '}
					<a href="https://opencals.com" className="underline underline-offset-2 hover:text-ink">
						Opencals
					</a>
					.
				</p>
			</div>
		</footer>
	);
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={className}>
			<p className="t-label border-b border-line-strong px-6 py-3 text-mute">{title}</p>
			<div className="flex flex-col p-6 pt-4">{children}</div>
		</div>
	);
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link href={href} className="py-1 text-[0.9375rem] hover:text-cobalt">
			{children}
		</Link>
	);
}
