import { PageHeader } from '@/components/site/page-header';
import { Sheet } from '@/components/ui/sheet';

/** Terms and privacy: numbered clauses down a narrow column, clause numbers in the margin like a specification. */
export function LegalPage({ number, title, lead, updated, clauses }: { number: string; title: string; lead: string; updated: string; clauses: { h: string; p: string[] }[] }) {
	return (
		<>
			<PageHeader number={number} strip={title} note={`Revised ${updated}`} title={title} lead={lead} />
			<Sheet number={`${number}-1`} title="Clauses" refs={false}>
				<ol className="max-w-3xl border-t border-ink">
					{clauses.map((c, i) => (
						<li key={c.h} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-line-strong py-6">
							<span className="t-label pt-1.5 text-cobalt">{String(i + 1).padStart(2, '0')}</span>
							<div className="flex flex-col gap-3">
								<h2 className="t-h3">{c.h}</h2>
								{c.p.map((p) => (
									<p key={p} className="text-mute">
										{p}
									</p>
								))}
							</div>
						</li>
					))}
				</ol>
				<p className="mt-8 max-w-3xl text-[0.8125rem] text-faint">This is sample text for an open-source template, not legal advice. Replace it with your own terms.</p>
			</Sheet>
		</>
	);
}
