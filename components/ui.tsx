'use client';
import { ReactNode, createContext, useContext, useState, useCallback, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- toast ---------- */
const ToastCtx = createContext<(m: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; m: string; kind: 'ok' | 'err' }[]>([]);
  const push = useCallback((m: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, m, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className={cx('flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-card', i.kind === 'ok' ? 'bg-brand-700' : 'bg-red-600')}>
            {i.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {i.m}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- basics ---------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-card', className)}>{children}</div>;
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft'; loading?: boolean };
export function Button({ variant = 'primary', loading, className, children, disabled, ...p }: BtnProps) {
  const v = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
    soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
    ghost: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return (
    <button {...p} disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50', v, className)}>
      {loading && <Loader2 size={15} className="animate-spin" />}{children}
    </button>
  );
}
const fieldCls = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100';
export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldCls, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(fieldCls, p.className)} />;

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'red' | 'amber' | 'blue' }) {
  const t = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-800', red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-800', blue: 'bg-sky-100 text-sky-800' }[tone];
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', t)}>{children}</span>;
}
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
export function Spinner() { return <div className="flex justify-center py-16 text-brand-600"><Loader2 className="animate-spin" /></div>; }
export function Empty({ text }: { text: string }) { return <div className="py-14 text-center text-sm text-slate-400">{text}</div>; }
export function ErrorBox({ text }: { text: string }) { return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>; }
export function Stat({ label, value, tone = 'brand', icon }: { label: string; value: ReactNode; tone?: 'brand' | 'amber' | 'red' | 'blue'; icon?: ReactNode }) {
  const t = { brand: 'bg-brand-50 text-brand-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700' }[tone];
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cx('flex h-12 w-12 items-center justify-center rounded-xl', t)}>{icon}</div>
      <div><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div></div>
    </Card>
  );
}
