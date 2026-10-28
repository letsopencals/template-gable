import { PlanIcon } from '@/components/ui/plan-icon';
import { siteConfig } from '@/lib/site-config';

/**
 * A drawn example of a day sheet, for the homepage: hours 08–20 down the left as a ruler, each booking a framed block
 * at its time and length, hatched where the day is already taken by others. Static illustration from site-config.
 */
export function DaySheetDemo() {
	const steps = siteConfig.daySection.steps;
	const hours = Array.from({ length: 9 }, (_, i) => 8 + i); // 08..16
	const top = (t: string) => {
		const [h, m] = t.split(':').map(Number);
		return ((h! - 8) * 60 + m!) / (9 * 60);
	};
	return (
		<div className="border border-white/60 bg-cobalt-deep/40">
			<div className="flex items-stretch border-b border-white/60">
				<span className="t-label border-r border-white/60 px-3 py-2 font-semibold">DS-01</span>
				<span className="t-label flex-1 px-3 py-2 text-white/80">Day sheet · Dock House · Thu</span>
			</div>
			<div className="relative h-[540px] my-4">
				{/* hour ruler */}
				{hours.map((h, i) => (
					<div key={h} className="absolute inset-x-0 flex items-start" style={{ top: `${(i / 9) * 100}%` }}>
						<span className="t-num w-14 -translate-y-1/2 pl-3 text-[0.6875rem] text-white/60">{String(h).padStart(2, '0')}:00</span>
						<span className="h-px flex-1 bg-white/15" />
					</div>
				))}
				{/* someone else's booking, hatched */}
				<div className="absolute left-[62%] right-3 border border-white/30" style={{ top: `${top('13:30') * 100}%`, height: `${(1.5 / 9) * 100}%`, backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.28) 0 1px, transparent 1px 6px)' }}>
					<span className="t-label absolute left-2 top-1 text-white/60">Taken</span>
				</div>
				{steps.map((s, i) => {
					const leftCol = s.kind === 'flex';
					return (
						<div
							key={i}
							className={`absolute flex gap-2 border border-white bg-sheet ${s.span >= 1 ? 'p-2' : 'items-center px-2 py-0'} text-ink ${leftCol ? 'left-16 right-[52%]' : 'left-[50%] right-3'}`}
							style={{ top: `calc(${top(s.time) * 100}% + 2px)`, height: `calc(${(Math.max(s.span, 0.5) / 9) * 100}% - 4px)` }}
						>
							<PlanIcon kind={s.kind} className={s.span >= 1 ? 'h-6 w-6 text-cobalt' : 'h-4 w-4 text-cobalt'} />
							{s.span >= 1 ? (
								<div className="min-w-0 leading-tight">
									<p className="t-num text-[0.6875rem] text-mute">{s.time}</p>
									<p className="truncate text-[0.8125rem] font-semibold">{s.title}</p>
									<p className="truncate text-[0.75rem] text-mute">{s.note}</p>
								</div>
							) : (
								<p className="min-w-0 truncate text-[0.75rem] leading-4">
									<span className="t-num text-mute">{s.time}</span> <span className="font-semibold">{s.title}</span>
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
