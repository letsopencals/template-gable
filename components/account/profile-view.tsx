'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { SelfServiceProfileResponse } from '@opencals/storefront-sdk';
import { Button } from '@/components/ui/button';
import { Field, Input, fieldAria } from '@/components/ui/field';
import type { ApiErrorBody } from '@/lib/api-error-handler';
import { PHONE_HINT, mapFieldErrors } from '@/lib/field-errors';

const PROFILE_FIELDS = ['firstName', 'lastName', 'phone'] as const;
type ProfileField = (typeof PROFILE_FIELDS)[number];

/** Name and phone (the email is the sign-in, so it isn't editable here). */
export function ProfileView() {
	const { data, mutate } = useSWR<SelfServiceProfileResponse>('/api/account/profile', (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error()))));
	const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
	const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
	const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
	useEffect(() => {
		if (data) setForm({ firstName: data.firstName ?? '', lastName: data.lastName ?? '', phone: data.phone ?? '' });
	}, [data]);
	/** Editing a field clears the error under it. */
	const edit = (k: ProfileField) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [k]: e.target.value });
		if (errors[k]) setErrors({ ...errors, [k]: undefined });
	};
	const save = async (e: React.FormEvent) => {
		e.preventDefault();
		const phone = form.phone.trim();
		if (phone && !phone.startsWith('+')) {
			setErrors({ phone: PHONE_HINT });
			document.getElementById('p-phone')?.focus();
			return;
		}
		setErrors({});
		setState('busy');
		const res = await fetch('/api/account/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
		if (res.ok) {
			setState('saved');
			void mutate();
			return;
		}
		// Messages go under their field; "Couldn’t save" is only for what no field shows.
		const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
		const { mapped, unmapped } = mapFieldErrors(data?.fieldErrors, PROFILE_FIELDS);
		setErrors(mapped);
		const first = PROFILE_FIELDS.find((f) => mapped[f]);
		if (first) document.getElementById({ firstName: 'p-first', lastName: 'p-last', phone: 'p-phone' }[first])?.focus();
		setState(first && !unmapped.length ? 'idle' : 'error');
	};
	return (
		<form onSubmit={save} className="grid grid-cols-[minmax(0,1fr)] max-w-2xl gap-4 sm:grid-cols-2">
			<Field label="Email" htmlFor="p-email" className="sm:col-span-2" hint="Your sign-in. Codes and confirmations go here.">
				<Input id="p-email" value={data?.email ?? ''} readOnly />
			</Field>
			<Field label="First name" htmlFor="p-first" error={errors.firstName}>
				<Input id="p-first" value={form.firstName} onChange={edit('firstName')} {...fieldAria('p-first', errors.firstName)} />
			</Field>
			<Field label="Last name" htmlFor="p-last" error={errors.lastName}>
				<Input id="p-last" value={form.lastName} onChange={edit('lastName')} {...fieldAria('p-last', errors.lastName)} />
			</Field>
			<Field label="Phone" htmlFor="p-phone" optional hint={PHONE_HINT} error={errors.phone}>
				<Input id="p-phone" type="tel" autoComplete="tel" placeholder="+353 87 123 4567" value={form.phone} onChange={edit('phone')} {...fieldAria('p-phone', errors.phone, true)} />
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
