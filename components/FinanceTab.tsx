'use client';
import { useState } from 'react';
import { Link2, Plus, RefreshCw, Wallet, CheckCheck, Copy } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { inr, payTone } from '@/lib/format';
import { Badge, Button, Card, Empty, ErrorBox, Spinner, useToast } from '@/components/ui';
import EnrollModal from './EnrollModal';
import PaymentModal from './PaymentModal';

export default function FinanceTab({ student, meta, onChanged }: { student: any; meta: any; onChanged: () => void }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>(`students/${student.id}/finance`);
  const [enroll, setEnroll] = useState(false);
  const [pay, setPay] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const refresh = () => { reload(); onChanged(); };
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  const w = data.wallet;

  async function run(key: string, fn: () => Promise<any>, ok: string) {
    setBusy(key);
    try { const r = await fn(); toast(ok); reload(); return r; } catch (e: any) { toast(e.message, 'err'); }
    finally { setBusy(''); }
  }
  const link = async (e: any) => { const r = await run('l' + e.id, () => api(`enrollments/${e.id}/razorpay`, {}), 'Payment link created'); if (r?.payment?.short_url) { navigator.clipboard?.writeText(r.payment.short_url); toast('Link copied'); } };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {[['Total fee', inr(w.total)], ['Paid', inr(w.paid)], ['Due', inr(w.due)], ['Next due', w.next_due || '—']].map(([k, v]) => (
          <Card key={k} className="p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</div><div className={'mt-1 text-xl font-bold ' + (k === 'Due' && w.due > 0 ? 'text-red-600' : 'text-slate-900')}>{v}</div></Card>))}
      </div>
      <div className="flex justify-end"><Button onClick={() => setEnroll(true)}><Plus size={16} /> Enroll in batch</Button></div>

      {!data.enrollments.length ? <Card><Empty text="Not enrolled yet. Click “Enroll in batch” to choose fees." /></Card> : data.enrollments.map((e: any) => (
        <Card key={e.id} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-slate-900">{e.batch.name}</span>
                <Badge tone={e.status === 'enrolled' ? 'blue' : e.status === 'completed' ? 'green' : 'slate'}>{e.status}</Badge><Badge tone={payTone(e.payment_status)}>{e.payment_status}</Badge></div>
              <div className="mt-2 flex flex-wrap gap-1.5">{e.fees.map((f: any) => <Badge key={f.id} tone="slate">{f.name}</Badge>)}</div>
              <div className="mt-2 text-xs text-slate-500">Enrolled {e.enrollment_date} · Total {inr(e.total_fee)} · Paid {inr(e.paid)} · <b className={e.due > 0 ? 'text-red-600' : ''}>Due {inr(e.due)}</b>{e.next_due_date && ` · Next ${e.next_due_date}`}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {e.due > 0 && e.status === 'enrolled' && <><Button onClick={() => setPay(e)}><Wallet size={15} /> Add payment</Button>
                <Button variant="soft" loading={busy === 'l' + e.id} onClick={() => link(e)}><Link2 size={15} /> Razorpay link</Button></>}
              <select value={e.status} onChange={(ev) => run('s' + e.id, () => api(`enrollments/${e.id}/status`, { status: ev.target.value }), 'Status updated')} className="rounded-xl border border-slate-200 px-3 text-sm">
                <option value="enrolled">Enrolled</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select>
            </div>
          </div>
          {e.payments.length > 0 && (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-2.5">Date</th><th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Mode</th><th className="px-3 py-2.5">Receipt</th><th className="px-3 py-2.5">Status</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-100">{e.payments.map((p: any) => (
                <tr key={p.id}><td className="px-5 py-2.5">{p.date}</td><td className="px-3 py-2.5 font-semibold">{inr(p.source === 'razorpay' ? p.amount_received || p.amount : p.amount)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.source === 'razorpay' ? 'Razorpay' : p.mode}</td><td className="px-3 py-2.5 text-slate-600">{p.receipt_no || '—'}</td>
                  <td className="px-3 py-2.5">{p.source === 'razorpay' ? <Badge tone={p.razorpay_status === 'paid' ? 'green' : p.razorpay_status === 'partial' ? 'amber' : 'slate'}>{p.razorpay_status || 'link'}</Badge> : <Badge tone="green">received</Badge>}</td>
                  <td className="px-3 py-2.5 text-right">{p.source === 'razorpay' && p.razorpay_status !== 'paid' && (<div className="flex justify-end gap-1">
                    {p.short_url && <button title="Copy link" onClick={() => { navigator.clipboard?.writeText(p.short_url); toast('Link copied'); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Copy size={15} /></button>}
                    <button title="Refresh status" onClick={() => run('r' + p.id, () => api(`payments/${p.id}/refresh`, {}), 'Status refreshed')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><RefreshCw size={15} /></button>
                    <button title="Mark paid (checked manually)" onClick={() => confirm('Mark as paid after checking the Razorpay dashboard?') && run('m' + p.id, () => api(`payments/${p.id}/mark-paid`, {}), 'Marked paid')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><CheckCheck size={15} /></button></div>)}</td></tr>))}</tbody>
            </table></div>)}
        </Card>))}
      <EnrollModal open={enroll} onClose={() => setEnroll(false)} student={student} meta={meta} onDone={refresh} />
      <PaymentModal enrollment={pay} onClose={() => setPay(null)} onDone={refresh} />
    </div>
  );
}
