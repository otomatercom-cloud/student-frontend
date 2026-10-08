'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PACKAGE_TYPES, inr } from '@/lib/format';
import { Badge, Button, Empty, Field, Modal, Select, useToast } from '@/components/ui';

export default function EnrollModal({ open, onClose, student, meta, onDone }: { open: boolean; onClose: () => void; student: any; meta: any; onDone: () => void }) {
  const toast = useToast();
  const [batch, setBatch] = useState('');
  const [fees, setFees] = useState<any[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setBatch(student?.batch?.id ? String(student.batch.id) : ''); setSel([]); } }, [open, student]);
  useEffect(() => { setSel([]); if (batch) api('fees?batch_id=' + batch).then((r) => setFees(r.filter((f: any) => f.active))).catch(() => setFees([])); else setFees([]); }, [batch]);

  const chosen = fees.filter((f) => sel.includes(f.id));
  const packages = chosen.filter((f) => PACKAGE_TYPES.includes(f.fee_type));
  const total = chosen.reduce((a, f) => a + f.total, 0);
  const toggle = (f: any) => {
    if (sel.includes(f.id)) return setSel(sel.filter((x) => x !== f.id));
    if (PACKAGE_TYPES.includes(f.fee_type)) return setSel([...sel.filter((id) => !PACKAGE_TYPES.includes(fees.find((x) => x.id === id)?.fee_type)), f.id]);
    setSel([...sel, f.id]);
  };
  async function submit() {
    setBusy(true);
    try { const r = await api('enroll', { student_id: student.id, batch_id: Number(batch), fee_ids: sel }); toast('Enrolled · total ' + inr(r.total)); onDone(); onClose(); }
    catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }
  return (
    <Modal open={open} onClose={onClose} title={`Enroll ${student?.name || ''}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!batch || !sel.length} onClick={submit}>Confirm enrollment · {inr(total)}</Button></>}>
      <Field label="Batch" required><Select value={batch} onChange={(e) => setBatch(e.target.value)}><option value="">Select batch...</option>{meta.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      {batch && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Select fees (e.g. Admission + Lump Sum)</div>
          {!fees.length ? <Empty text="No fee structures mapped to this batch" /> : (
            <div className="space-y-2">{fees.map((f) => (
              <label key={f.id} className={'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition ' + (sel.includes(f.id) ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300')}>
                <input type="checkbox" checked={sel.includes(f.id)} onChange={() => toggle(f)} />
                <div className="flex-1"><div className="font-semibold text-slate-900">{f.name}</div><div className="text-xs text-slate-500">GST {f.gst_rate}%{f.fee_type === 'installment' ? ` · ${f.installment_count} installments` : ''}</div></div>
                <Badge tone="blue">{f.fee_type.replace('_', ' ')}</Badge><div className="w-24 text-right font-bold">{inr(f.total)}</div>
              </label>))}</div>)}
          {packages.length > 0 && <p className="mt-2 text-xs text-slate-400">Only one course package (lump sum / installment / monthly...) can be chosen. Admission, exam, material and registration fees can be added with it.</p>}
        </div>)}
    </Modal>
  );
}
