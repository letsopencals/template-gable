'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SheetNumber } from '@/components/ui/sheet';

/**
 * Modal dialog and side/bottom drawer on the native <dialog> element (focus trap, Esc, inert page for free).
 * Both open with a sheet strip header (sheet number + title + close).
 *
 *   <Dialog open={o} onClose={() => setO(false)} title="Change time" number="AC-02">…</Dialog>
 *   <Drawer open={o} onClose={…} title="Day sheet" side="right" | "bottom">…</Drawer>
 */
interface BaseProps {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	number?: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
}

function useNativeDialog(open: boolean, onClose: () => void) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	}, [open]);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onCancel = (e: Event) => {
			e.preventDefault();
			onClose();
		};
		el.addEventListener('cancel', onCancel);
		return () => el.removeEventListener('cancel', onCancel);
	}, [onClose]);
	return ref;
}

function Header({ title, number, onClose, titleId }: { title: ReactNode; number?: string; onClose: () => void; titleId: string }) {
	return (
		<div className="flex items-stretch border-b border-ink">
			{number ? <SheetNumber number={number} className="border-ink" /> : null}
			<h2 id={titleId} className="flex-1 px-4 py-3 font-display text-lg font-semibold leading-tight">
				{title}
			</h2>
			<button type="button" onClick={onClose} aria-label="Close" className="grid w-12 place-items-center border-l border-ink hover:bg-paper-deep">
				<svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
					<path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</button>
		</div>
	);
}

export function Dialog({ open, onClose, title, number, children, footer, className }: BaseProps) {
	const ref = useNativeDialog(open, onClose);
	const titleId = useId();
	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			className={cn(
				'm-auto w-[min(92vw,560px)] max-h-[88vh] rounded-[2px] border border-ink bg-sheet p-0 text-ink backdrop:bg-ink/45 open:flex open:flex-col',
				className,
			)}
		>
			<Header title={title} number={number} onClose={onClose} titleId={titleId} />
			<div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
			{footer ? <div className="border-t border-line-strong p-4">{footer}</div> : null}
		</dialog>
	);
}

export function Drawer({ open, onClose, title, number, children, footer, className, side = 'right' }: BaseProps & { side?: 'right' | 'bottom' }) {
	const ref = useNativeDialog(open, onClose);
	const titleId = useId();
	return (
		<dialog
			ref={ref}
			aria-labelledby={titleId}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			className={cn(
				'm-0 max-h-none max-w-none border-ink bg-sheet p-0 text-ink backdrop:bg-ink/45 open:flex open:flex-col',
				side === 'right'
					? 'ml-auto h-dvh w-[min(100vw,440px)] border-l'
					: 'mt-auto max-h-[88dvh] w-full border-t',
				className,
			)}
		>
			<Header title={title} number={number} onClose={onClose} titleId={titleId} />
			<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
			{footer ? <div className="border-t border-ink bg-sheet p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
		</dialog>
	);
}
