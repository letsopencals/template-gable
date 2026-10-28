'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SheetStrip } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const TABS = [
	{ href: '/account', label: 'Bookings' },
	{ href: '/account/orders', label: 'Receipts' },
	{ href: '/account/profile', label: 'Profile' },
];

/** The account frame: sheet strip, greeting, tabs as underlined links, sign out. `base` swaps the hrefs for previews. */
export function AccountShell({ children, name: forcedName, base = '' }: { children: React.ReactNode; name?: string | null; base?: string }) {
	const pathname = usePathname();
	const { data } = useSession();
	const name = forcedName ?? data?.customer?.firstName ?? null;
	return (
		<div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-6 lg:px-10">
			<SheetStrip number="GA-500" title="Your bookings" note={data?.customer?.email ?? undefined} />
			<header className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-8">
				<h1 className="t-h1">{name ? <>Hello, <span className="highlight">{name}</span></> : 'Your bookings'}</h1>
				<button type="button" onClick={() => void signOut({ callbackUrl: '/' })} className="text-[0.875rem] font-medium text-mute underline underline-offset-4 hover:text-ink">
					Sign out
				</button>
			</header>
			<nav aria-label="Account" className="mb-8 flex gap-6 border-b border-line-strong">
				{TABS.map((t) => {
					const href = base ? `${base}${t.href === '/account' ? '' : t.href.replace('/account', '')}` : t.href;
					const active = pathname === href;
					return (
						<Link key={t.href} href={href} aria-current={active ? 'page' : undefined} className={cn('relative pb-2.5 text-[0.9375rem] font-medium', active ? 'text-ink' : 'text-mute hover:text-ink')}>
							{t.label}
							{active ? <span className="absolute inset-x-0 -bottom-px h-[3px] bg-marigold" /> : null}
						</Link>
					);
				})}
			</nav>
			{children}
		</div>
	);
}
