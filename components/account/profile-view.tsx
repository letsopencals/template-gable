'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

interface Profile {
	email: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
}

/** Name and phone (the email is the sign-in, so it isn't editable here). */
export function ProfileView() {
	const { data, mutate } = useSWR<Profile>('/api/account/profile', (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error()))));
	const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
	const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
	useEffect(() => {
		if (data) setForm({ firstName: data.firstName ?? '', lastName: data.lastName ?? '', phone: data.phone ?? '' });
	}, [data]);
	const save = async (e: React.FormEvent) => {
		e.preventDefault();
		setState('busy');
		const res = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
		setState(res.ok ? 'saved' : 'error');
		if (res.ok) void mutate();
	};
	return (
		<form onSubmit={save} className="grid grid-cols-[minmax(0,1fr)] max-w-2xl gap-4 sm:grid-cols-2">
			<Field label="Email" htmlFor="p-email" className="sm:col-span-2" hint="Your sign-in. Codes and confirmations go here.">
				<Input id="p-email" value={data?.email ?? ''} readOnly />
			</Field>
			<Field label="First name" htmlFor="p-first">
				<Input id="p-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
			</Field>
			<Field label="Last name" htmlFor="p-last">
				<Input id="p-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
			</Field>
			<Field label="Phone" htmlFor="p-phone" optional>
				<Input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
			</Field>
			<div className="flex items-center gap-3 sm:col-span-2">
				<Button type="submit" loading={state === 'busy'}>
					Save
				</Button>
				<span aria-live="polite" className="text-[0.875rem] text-mute">
					{state === 'saved' ? 'Saved.' : state === 'error' ? 'Couldn’t save. Try again.' : ''}
				</span>
			</div>
		</form>
	);
}
