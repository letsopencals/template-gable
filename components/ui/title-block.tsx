import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The title block — the boxed table in the corner of every drawing. Gable uses it for every summary: the day sheet
 * total, a space's data sheet, the footer, order details.
 *
 *   <TitleBlock heading="Day sheet" number="DS-01" rows={[{ k: 'House', v: 'Dock House' }, …]} footer={…} />
 */
export interface TitleBlockRow {
	k: ReactNode;
	v: ReactNode;
}

export function TitleBlock({
	heading,
	number,
	rows,
	footer,
	className,
}: {
	heading?: ReactNode;
	number?: ReactNode;
	rows: TitleBlockRow[];
	footer?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('title-block', className)}>
			{heading || number ? (
				<div className="flex items-stretch border-b border-ink">
					<div className="flex-1 px-3 py-2.5 font-display text-[1.0625rem] font-semibold leading-tight">{heading}</div>
					{number ? <div className="t-label flex items-center border-l border-ink px-3 text-ink">{number}</div> : null}
				</div>
			) : null}
			{rows.map((r, i) => (
				<div key={i} className="tb-row">
					<div className="tb-key">{r.k}</div>
					<div className="tb-val">{r.v}</div>
				</div>
			))}
			{footer ? <div className="border-t border-ink p-3">{footer}</div> : null}
		</div>
	);
}
