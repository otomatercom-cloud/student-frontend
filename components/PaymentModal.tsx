'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PAY_MODES, inr } from '@/lib/format';
import { Button, Field, Input, Modal, Select, useToast } from '@/components/ui';

export default function PaymentModal({ enrollment, onClose, onDone }: { enrollment: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<any>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (enrollment) setF({ amount: enrollment.due, payment_mode: 'upi', payment_date: new Date().toISOString().slice(0, 10), receipt_no: '', remarks: '' }); }, [enrollment]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function save() {
    setBusy(true);
    try { await api(`enrollments/${enrollment.id}/payment`, { ...f, amount: Number(f.amount) }); toast('Payment recorded'); onDone(); onClose(); }
    catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }
  return (
    <Modal open={!!enrollment} onClose={onClose} title={`Add payment · due ${inr(enrollment?.due)}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save payment</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ₹" required><Input type="number" step="any" value={f.amount ?? ''} onChange={set('amount')} /></Field>
        <Field label="Date"><Input type="date" value={f.payment_date || ''} onChange={set('payment_date')} /></Field>
        <Field label="Mode"><Select value={f.payment_mode || 'upi'} onChange={set('payment_mode')}>{PAY_MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field label="Receipt / ref no."><Input value={f.receipt_no || ''} onChange={set('receipt_no')} /></Field>
      </div>
      <Field label="Remarks"><Input value={f.remarks || ''} onChange={set('remarks')} /></Field>
    </Modal>
  );
}
