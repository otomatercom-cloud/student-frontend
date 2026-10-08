'use client';
import { useEffect, useState } from 'react';
import { api, useApi } from '@/lib/api';
import { inr } from '@/lib/format';
import { Badge, Button, Field, Input, Modal, Select, useToast } from '@/components/ui';

const addMonths = (d: string, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
function split(total: number, n: number, first: string) {
  const per = Math.round((total / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => ({ name: `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} Installment`, due_date: addMonths(first, i), amount_inclusive: i === n - 1 ? Math.round((total - per * (n - 1)) * 100) / 100 : per }));
}

export default function FeeEditor({ fee, onClose, onSaved }: { fee: any; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { data: fm } = useApi<any>('fees/meta');
  const { data: meta } = useApi<any>('meta');
  const [f, setF] = useState<any>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!fee) return;
    const today = new Date().toISOString().slice(0, 10);
    setF({ name: '', fee_type: 'lumpsum', gst_rate: '18', amount_entry_mode: 'inclusive', amount_inclusive: '', amount_exclusive: '', total_fee_amount: '', num_installments: 3, active: true, ...fee,
      batch_ids: fee.batches?.map((b: any) => b.id) || [], installments: fee.installments || [], first_due_date: fee.first_due_date || today });
  }, [fee]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const isInst = f.fee_type === 'installment';
  const rate = Number(f.gst_rate || 0);
  const allocated = (f.installments || []).reduce((a: number, r: any) => a + Number(r.amount_inclusive || 0), 0);
  const diff = Math.round((Number(f.total_fee_amount || 0) - allocated) * 100) / 100;
  const toggleBatch = (id: number) => setF({ ...f, batch_ids: f.batch_ids.includes(id) ? f.batch_ids.filter((x: number) => x !== id) : [...f.batch_ids, id] });
  const regen = () => setF({ ...f, installments: split(Number(f.total_fee_amount || 0), Math.max(1, Number(f.num_installments || 1)), f.first_due_date) });
  const setInst = (i: number, k: string, v: any) => setF({ ...f, installments: f.installments.map((r: any, j: number) => (j === i ? { ...r, [k]: v } : r)) });
  const shownIncl = f.amount_entry_mode === 'exclusive' ? Math.round(Number(f.amount_exclusive || 0) * (1 + rate / 100) * 100) / 100 : Number(f.amount_inclusive || 0);

  async function save() {
    setBusy(true);
    try {
      const body: any = { ...f, id: fee.id };
      if (isInst && !body.installments.length) body.installments = split(Number(f.total_fee_amount || 0), Number(f.num_installments || 1), f.first_due_date);
      await api('fees/save', body); toast('Fee saved'); onSaved();
    } catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }
  return (
    <Modal open={!!fee} onClose={onClose} title={fee?.id ? 'Edit fee' : 'New fee'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save fee</Button></>}>
      {fee && fm && meta && f.batch_ids && (<>
        <Field label="Fee name" required><Input value={f.name || ''} onChange={set('name')} placeholder="e.g. ACCA Lump Sum 2026" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fee type"><Select value={f.fee_type} onChange={set('fee_type')}>{fm.fee_types.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
          <Field label="GST"><Select value={f.gst_rate} onChange={set('gst_rate')}>{fm.gst_rates.map((r: string) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
        </div>
        {!isInst ? (<div className="grid grid-cols-2 gap-3">
          <Field label="Enter amount"><Select value={f.amount_entry_mode} onChange={set('amount_entry_mode')}><option value="inclusive">Incl. GST</option><option value="exclusive">Excl. GST</option></Select></Field>
          {f.amount_entry_mode === 'exclusive' ? <Field label="Amount (excl. GST) ₹" hint={'Incl. GST: ' + inr(shownIncl)}><Input type="number" step="any" value={f.amount_exclusive} onChange={set('amount_exclusive')} /></Field>
            : <Field label="Amount (incl. GST) ₹" hint={'Excl. GST: ' + inr(Math.round((Number(f.amount_inclusive || 0) / (1 + rate / 100)) * 100) / 100)}><Input type="number" step="any" value={f.amount_inclusive} onChange={set('amount_inclusive')} /></Field>}
        </div>) : (<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total (incl. GST) ₹"><Input type="number" step="any" value={f.total_fee_amount} onChange={set('total_fee_amount')} /></Field>
            <Field label="Installments"><Input type="number" min={1} value={f.num_installments} onChange={set('num_installments')} /></Field>
            <Field label="First due"><Input type="date" value={f.first_due_date} onChange={set('first_due_date')} /></Field>
          </div>
          <Button variant="soft" onClick={regen} disabled={!f.total_fee_amount}>Generate equal split</Button>
          {f.installments.length > 0 && <div className="space-y-2">{f.installments.map((r: any, i: number) => (
            <div key={i} className="grid grid-cols-[1fr_130px_110px] gap-2"><Input value={r.name} onChange={(e) => setInst(i, 'name', e.target.value)} /><Input type="date" value={r.due_date || ''} onChange={(e) => setInst(i, 'due_date', e.target.value)} /><Input type="number" step="any" value={r.amount_inclusive} onChange={(e) => setInst(i, 'amount_inclusive', e.target.value)} /></div>))}
            <div className="flex items-center justify-between text-sm"><span>Allocated {inr(allocated)}</span>{Math.abs(diff) < 0.01 ? <Badge tone="green">balanced</Badge> : <Badge tone="red">difference {inr(diff)}</Badge>}</div></div>}
        </div>)}
        <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Applicable batches</div>
          <div className="flex flex-wrap gap-2">{meta.batches.map((b: any) => <button type="button" key={b.id} onClick={() => toggleBatch(b.id)} className={'rounded-full border px-3 py-1 text-xs font-medium ' + (f.batch_ids.includes(b.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600')}>{b.name}</button>)}</div></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
      </>)}
    </Modal>
  );
}
