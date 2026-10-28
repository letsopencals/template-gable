'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Stepper } from '@/components/ui/stepper';
import { Chip } from '@/components/ui/chip';
import { TitleBlock } from '@/components/ui/title-block';
import { buttonClasses } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { extraPrice, formatLength, priceFor, type Extra, type Space } from '@/lib/workspace';

type BuilderSpace = Pick<Space, 'id' | 'slug' | 'kind' | 'name' | 'seats' | 'price' | 'baseMin' | 'maxMin' | 'houseId' | 'shared'>;
type BuilderExtra = Pick<Extra, 'id' | 'slug' | 'title' | 'price' | 'perUnit' | 'maxQuantity' | 'houseIds' | 'spaceIds'>;

/**
 * "What a day costs": a worked example the visitor can change — a team on the open floor, a meeting room for a
 * while, coffee and lunch for the room, a booth for a call. Every figure comes from the store's prices with the same
 * maths the checkout uses (units × price, per seat, per person). Ends in a link into the planner.
 */
export function DayCostBuilder({ houses, spaces, extras, currency }: { houses: { id: string; slug: string; short: string }[]; spaces: BuilderSpace[]; extras: BuilderExtra[]; currency: string }) {
	const [houseId, setHouseId] = useState(houses[0]?.id ?? '');
	const [team, setTeam] = useState(4);
	const [deskLen, setDeskLen] = useState(480);
	const [roomHours, setRoomHours] = useState(2);
	const [coffee, setCoffee] = useState(true);
	const [lunch, setLunch] = useState(true);
	const [booths, setBooths] = useState(1);

	const at = spaces.filter((s) => s.houseId === houseId);
	const flex = at.find((s) => s.kind === 'flex');
	const room = at.filter((s) => s.kind === 'room' && s.seats >= team).sort((a, b) => a.seats - b.seats)[0] ?? at.filter((s) => s.kind === 'room').sort((a, b) => b.seats - a.seats)[0];
	const booth = at.find((s) => s.kind === 'booth');
	const ex = (slug: string) => extras.find((e) => e.slug === slug && (!e.houseIds.length || e.houseIds.includes(houseId)));
	const coffeeX = ex('coffee-pastries');
	const lunchX = ex('working-lunch');

	const lines = useMemo(() => {
		const out: { label: string; detail: string; amount: number }[] = [];
		if (flex) out.push({ label: `Flex desks × ${team}`, detail: formatLength(deskLen), amount: priceFor(flex, deskLen, team) });
		if (room && roomHours) out.push({ label: `${room.name} (${room.seats} seats)`, detail: formatLength(roomHours * 60), amount: priceFor(room, roomHours * 60) });
		if (room && coffee && coffeeX) out.push({ label: `${coffeeX.title} × ${team}`, detail: 'for the room', amount: extraPrice(coffeeX, team, room, roomHours * 60) });
		if (room && lunch && lunchX) out.push({ label: `${lunchX.title} × ${team}`, detail: 'for the room', amount: extraPrice(lunchX, team, room, roomHours * 60) });
		if (booth && booths) out.push({ label: `Phone booth × ${booths}`, detail: '30 min each', amount: priceFor(booth, 30) * booths });
		return out;
	}, [flex, room, booth, team, deskLen, roomHours, coffee, lunch, booths, coffeeX, lunchX]);

	const total = lines.reduce((a, l) => a + l.amount, 0);
	const perHead = team ? total / team : total;
	const house = houses.find((h) => h.id === houseId);

	return (
		<div className="grid gap-8 lg:grid-cols-12">
			<div className="flex flex-col gap-6 border border-ink bg-sheet p-5 sm:p-6 lg:col-span-7">
				<Row label="House">
					<div className="flex flex-wrap gap-1.5">
						{houses.map((h) => (
							<Chip key={h.id} size="sm" selected={h.id === houseId} onClick={() => setHouseId(h.id)}>
								{h.short}
							</Chip>
						))}
					</div>
				</Row>
				<Row label="Team">
					<Stepper value={team} onChange={setTeam} min={1} max={16} label="People" />
				</Row>
				{flex ? (
					<Row label="On the open floor">
						<div className="flex gap-1.5">
							{[240, 480].map((m) => (
								<Chip key={m} size="sm" selected={deskLen === m} onClick={() => setDeskLen(m)}>
									{formatLength(m)}
								</Chip>
							))}
						</div>
					</Row>
				) : null}
				{room ? (
					<Row label={`Room for the meeting · ${room.name}`}>
						<div className="flex flex-wrap gap-1.5">
							{[0, 1, 2, 3, 4].map((h) => (
								<Chip key={h} size="sm" selected={roomHours === h} onClick={() => setRoomHours(h)}>
									{h ? `${h} h` : 'None'}
								</Chip>
							))}
						</div>
					</Row>
				) : null}
				{room && roomHours ? (
					<Row label="For the room">
						<div className="flex flex-wrap gap-1.5">
							{coffeeX ? (
								<Chip size="sm" selected={coffee} onClick={() => setCoffee((v) => !v)}>
									{coffeeX.title}
								</Chip>
							) : null}
							{lunchX ? (
								<Chip size="sm" selected={lunch} onClick={() => setLunch((v) => !v)}>
									{lunchX.title}
								</Chip>
							) : null}
						</div>
					</Row>
				) : null}
				{booth ? (
					<Row label="Phone booth calls (30 min)">
						<Stepper value={booths} onChange={setBooths} min={0} max={6} label="Booth calls" />
					</Row>
				) : null}
			</div>
			<div className="lg:col-span-5">
				<TitleBlock
					heading={`A day at ${house?.short ?? 'Gable'}`}
					number="PR-01"
					rows={[
						...lines.map((l) => ({
							k: l.detail,
							v: (
								<span className="flex items-baseline justify-between gap-3">
									<span>{l.label}</span>
									<span className="t-num">{formatMoney(l.amount, currency)}</span>
								</span>
							),
						})),
						{ k: 'Per person', v: <span className="t-num">{formatMoney(Math.round(perHead * 100) / 100, currency)}</span> },
					]}
					footer={
						<div className="flex flex-col gap-3">
							<p className="flex items-baseline justify-between">
								<span className="t-label text-mute">Total, VAT incl.</span>
								<span className="t-num text-3xl font-medium">{formatMoney(total, currency)}</span>
							</p>
							<Link href={`/book?house=${house?.slug ?? ''}&kind=flex&people=${team}&length=${deskLen}`} className={buttonClasses('primary', 'lg', true)}>
								Plan this day
							</Link>
						</div>
					}
				/>
			</div>
		</div>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2 border-b border-line pb-5 last:border-b-0 last:pb-0">
			<span className="t-label text-mute">{label}</span>
			{children}
		</div>
	);
}
