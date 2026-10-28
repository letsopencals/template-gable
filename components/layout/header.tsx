'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Logo } from '@/components/ui/logo';
import { PlanIcon } from '@/components/ui/plan-icon';
import { ButtonLink } from '@/components/ui/button';
import { Drawer } from '@/components/ui/dialog';
import { HouseBar } from '@/components/layout/house-bar';
import { useCart } from '@/contexts/cart-context';
import { kinds, siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/**
 * A normal sticky top header: logo · Spaces ▾ (mega menu of the seven kinds, each with its plan icon) · Houses ·
 * Extras · Pricing · Teams · Account · "Plan your day" (with the day sheet's item count). The house bar sits under it.
 */
export function Header() {
	const pathname = usePathname();
	const [spacesOpen, setSpacesOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { cart } = useCart();
	const { status } = useSession();
	const count = cart?.items?.length ?? 0;

	// Close menus on navigation
	useEffect(() => {
		setSpacesOpen(false);
		setMobileOpen(false);
	}, [pathname]);

	// Close the mega menu on outside click / Escape
	useEffect(() => {
		if (!spacesOpen) return;
		const onDown = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSpacesOpen(false);
		};
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSpacesOpen(false);
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [spacesOpen]);

	const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
	const spacesActive = ['/spaces', ...kinds.map((k) => k.href.split('#')[0]!)].some(isActive);

	return (
		<header className="sticky top-0 z-40 print:hidden">
			<div className="border-b border-ink bg-paper">
				<div ref={menuRef} className="relative mx-auto flex h-16 max-w-[1360px] items-center gap-6 px-4 sm:px-6 lg:px-10">
					<Link href="/" aria-label={`${siteConfig.name} home`} className="text-cobalt">
						<Logo />
					</Link>

					<nav aria-label="Main" className="ml-4 hidden h-full items-stretch lg:flex">
						<button
							type="button"
							aria-expanded={spacesOpen}
							aria-controls="spaces-menu"
							onClick={() => setSpacesOpen((o) => !o)}
							className={cn(
								'relative flex items-center gap-1.5 px-3.5 text-[0.9375rem] font-medium hover:text-cobalt',
								(spacesActive || spacesOpen) && 'text-cobalt',
							)}
						>
							Spaces
							<svg viewBox="0 0 10 10" className={cn('h-2.5 w-2.5 transition-transform', spacesOpen && 'rotate-180')} aria-hidden>
								<path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
							</svg>
							{spacesActive ? <span className="absolute inset-x-3.5 bottom-0 h-[3px] bg-marigold" /> : null}
						</button>
						<NavLink href="/houses" active={isActive('/houses')}>
							Houses
						</NavLink>
						{siteConfig.nav
							.filter((n) => n.href !== '/houses')
							.map((n) => (
								<NavLink key={n.href} href={n.href} active={isActive(n.href)}>
									{n.label}
								</NavLink>
							))}
					</nav>

					<div className="ml-auto flex items-center gap-2 sm:gap-4">
						<Link
							href={status === 'authenticated' ? '/account' : '/auth/sign-in'}
							className="hidden items-center gap-2 text-[0.9375rem] font-medium hover:text-cobalt sm:flex"
						>
							<svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
								<circle cx="8" cy="5.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
								<path d="M2.5 14.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
							</svg>
							{status === 'authenticated' ? 'Your bookings' : 'Sign in'}
						</Link>
						<ButtonLink href="/book" size="sm" className="h-10">
							Plan your day
							{count > 0 ? (
								<span className="t-num grid h-5 min-w-5 place-items-center bg-marigold px-1 text-[0.6875rem] text-ink">{count}</span>
							) : null}
						</ButtonLink>
						<button
							type="button"
							onClick={() => setMobileOpen(true)}
							aria-label="Open menu"
							className="grid h-10 w-10 place-items-center border border-ink lg:hidden"
						>
							<svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
								<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" />
							</svg>
						</button>
					</div>

					{spacesOpen ? <SpacesMenu /> : null}
				</div>
			</div>
			<HouseBar />

			<Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" number="GA-000">
				<nav aria-label="Mobile" className="flex flex-col">
					<p className="t-label border-b border-line px-5 pb-2 pt-5 text-mute">Spaces</p>
					{kinds.map((k) => (
						<Link key={k.key} href={k.href} className="flex items-center gap-3 border-b border-line px-5 py-3 hover:bg-paper-deep">
							<PlanIcon kind={k.key} className="h-7 w-7 text-cobalt" />
							<span className="font-medium">{k.plural}</span>
						</Link>
					))}
					<Link href="/spaces" className="border-b border-line px-5 py-3 font-medium text-cobalt hover:bg-paper-deep">
						All spaces →
					</Link>
					<p className="t-label border-b border-line px-5 pb-2 pt-6 text-mute">Gable</p>
					{[{ label: 'Houses', href: '/houses' }, ...siteConfig.nav.filter((n) => n.href !== '/houses'), { label: 'About', href: '/about' }, { label: 'FAQ', href: '/faq' }, { label: 'Contact', href: '/contact' }].map((n) => (
						<Link key={n.href} href={n.href} className="border-b border-line px-5 py-3 font-medium hover:bg-paper-deep">
							{n.label}
						</Link>
					))}
					<Link href={status === 'authenticated' ? '/account' : '/auth/sign-in'} className="border-b border-line px-5 py-3 font-medium hover:bg-paper-deep">
						{status === 'authenticated' ? 'Your bookings' : 'Sign in'}
					</Link>
				</nav>
			</Drawer>
		</header>
	);
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
	return (
		<Link
			href={href}
			aria-current={active ? 'page' : undefined}
			className={cn('relative flex items-center px-3.5 text-[0.9375rem] font-medium hover:text-cobalt', active && 'text-cobalt')}
		>
			{children}
			{active ? <span className="absolute inset-x-3.5 bottom-0 h-[3px] bg-marigold" /> : null}
		</Link>
	);
}

function SpacesMenu() {
	return (
		<div id="spaces-menu" className="absolute inset-x-4 top-full z-50 border border-t-0 border-ink bg-sheet sm:inset-x-6 lg:inset-x-10">
			<div className="grid grid-cols-12">
				<ul className="col-span-9 grid grid-cols-3">
					{kinds.map((k, i) => (
						<li key={k.key} className={cn('border-line', i % 3 !== 2 && 'border-r', i < 6 && 'border-b')}>
							<Link href={k.href} className="group flex h-full gap-4 p-5 hover:bg-wash/60">
								<PlanIcon kind={k.key} className="h-10 w-10 text-cobalt transition-transform group-hover:-rotate-3" />
								<span className="flex min-w-0 flex-col gap-1">
									<span className="font-display text-[1.0625rem] font-semibold leading-tight group-hover:text-cobalt">{k.plural}</span>
									<span className="text-[0.8125rem] leading-snug text-mute">{k.tagline}</span>
								</span>
							</Link>
						</li>
					))}
					<li className="flex">
						<Link href="/spaces" className="flex w-full flex-col justify-end gap-1 p-5 hover:bg-wash/60">
							<span className="t-label text-mute">Catalogue</span>
							<span className="font-display text-[1.0625rem] font-semibold text-cobalt">Every space, every house →</span>
						</Link>
					</li>
				</ul>
				<div className="col-span-3 flex flex-col justify-between gap-6 border-l border-ink bg-cobalt p-6 text-white">
					<div>
						<p className="t-label text-white/70">Day sheet</p>
						<p className="mt-2 font-display text-2xl font-semibold leading-tight">Plan the whole day in one booking.</p>
						<p className="mt-2 text-[0.875rem] text-white/80">A desk, a room for the call, lunch for the room and a booth. One payment.</p>
					</div>
					<ButtonLink href="/book" variant="marigold" size="md">
						Start a day sheet
					</ButtonLink>
				</div>
			</div>
		</div>
	);
}
