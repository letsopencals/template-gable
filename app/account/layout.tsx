import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/account-shell';

export const metadata: Metadata = { title: 'Your bookings', robots: { index: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
	return <AccountShell>{children}</AccountShell>;
}
