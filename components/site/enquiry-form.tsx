'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { FormError } from '@/components/site/auth-sheet';

export interface EnquiryField {
	name: string;
	label: string;
	type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
	options?: string[];
	required?: boolean;
	placeholder?: string;
	half?: boolean;
}

/**
 * A plain enquiry form that hands off to the visitor's email app (mailto:) with every field written out, so the
 * template needs no server or third-party form service. Swap `onSubmit` for your CRM or a route handler if you
 * have one.
 */
export function EnquiryForm({ to, subject, fields, submitLabel = 'Send' }: { to: string; subject: string; fields: EnquiryField[]; submitLabel?: string }) {
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const missing = fields.filter((f) => f.required && !String(data.get(f.name) ?? '').trim());
		if (missing.length) return setError(`Please fill in: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.`);
		const email = String(data.get('email') ?? '');
		if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('That email address doesn’t look right.');
		setError(null);
		const body = fields.map((f) => `${f.label}: ${String(data.get(f.name) ?? '').trim() || '—'}`).join('\n');
		window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		setSent(true);
	};

	return (
		<form onSubmit={onSubmit} noValidate className="grid gap-4 border border-ink bg-sheet p-5 sm:grid-cols-2 sm:p-6">
			{error ? (
				<div className="sm:col-span-2">
					<FormError>{error}</FormError>
				</div>
			) : null}
			{fields.map((f) => {
				const id = `enq-${f.name}`;
				const control =
					f.type === 'textarea' ? (
						<Textarea id={id} name={f.name} placeholder={f.placeholder} rows={5} />
					) : f.type === 'select' ? (
						<Select id={id} name={f.name} defaultValue="">
							<option value="" disabled>
								Choose…
							</option>
							{f.options?.map((o) => (
								<option key={o}>{o}</option>
							))}
						</Select>
					) : (
						<Input id={id} name={f.name} type={f.type ?? 'text'} placeholder={f.placeholder} autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined} />
					);
				return (
					<Field key={f.name} label={f.label} htmlFor={id} optional={!f.required} className={f.half ? '' : 'sm:col-span-2'}>
						{control}
					</Field>
				);
			})}
			<div className="flex flex-wrap items-center gap-4 sm:col-span-2">
				<Button type="submit" size="lg">
					{submitLabel}
				</Button>
				<p className="text-[0.8125rem] text-mute">{sent ? 'Your email app should have opened with the message ready to send.' : `Opens your email app, addressed to ${to}.`}</p>
			</div>
		</form>
	);
}
