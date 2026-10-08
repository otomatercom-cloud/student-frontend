'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { inr, payTone } from '@/lib/format';
import { Badge, Button, Card, Empty, ErrorBox, PageHeader, Spinner, Stat, cx } from '@/components/ui';
import { Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import FeeEditor from '@/components/FeeEditor';

export default function Fees() {
  const [tab, setTab] = useState(0);
  const [edit, setEdit] = useState<any>(null);
  const { data: fees, loading, error, reload } = useApi<any[]>('fees');
  const { data: sum } = useApi<any>('finance/summary');
  const [filter, setFilter] = useState('partial');
  const { data: dues, loading: dl } = useApi<any[]>(tab === 1 ? `enrollments?payment_status=${filter}` : null);

  async function open(id?: number) { setEdit(id ? await api('fees/' + id) : {}); }
  return (
    <>
      <PageHeader title="Fee Management" subtitle="Fee structures, batch mapping and dues" actions={<Button onClick={() => open()}><Plus size={16} /> New fee</Button>} />
      {sum && <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total billed" value={inr(sum.total)} icon={<Wallet size={22} />} tone="blue" />
        <Stat label="Collected" value={inr(sum.collected)} icon={<CheckCircle2 size={22} />} />
        <Stat label="Outstanding" value={inr(sum.due)} icon={<AlertCircle size={22} />} tone="red" /></div>}
      <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 shadow-card sm:w-fit">{['Fee structures', 'Dues'].map((t, i) => <button key={t} onClick={() => setTab(i)} className={cx('rounded-lg px-5 py-2 text-sm font-semibold', tab === i ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100')}>{t}</button>)}</div>
      {error && <ErrorBox text={error} />}
      {tab === 0 && (loading ? <Spinner /> : !fees?.length ? <Card><Empty text="No fee structures yet" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{fees.map((f) => (
          <Card key={f.id} className="p-5">
            <div className="flex items-start justify-between gap-2"><div className="font-bold text-slate-900">{f.name}</div><button onClick={() => open(f.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Pencil size={15} /></button></div>
            <div className="mt-2 flex flex-wrap gap-1.5"><Badge tone="blue">{f.fee_type.replace('_', ' ')}</Badge><Badge>GST {f.gst_rate}%</Badge>{!f.active && <Badge tone="red">archived</Badge>}{f.fee_type === 'installment' && <Badge tone="amber">{f.installment_count} installments</Badge>}</div>
            <div className="mt-3 text-2xl font-bold text-brand-800">{inr(f.total)}</div>
            <div className="mt-2 text-xs text-slate-500">{f.batches.length ? f.batches.map((b: any) => b.name).join(', ') : 'Not mapped to any batch'}</div>
          </Card>))}</div>))}
      {tab === 1 && (<>
        <div className="mb-3 flex gap-2">{[['partial', 'Partial'], ['unpaid', 'Unpaid'], ['paid', 'Paid']].map(([v, l]) => <Button key={v} variant={filter === v ? 'primary' : 'ghost'} onClick={() => setFilter(v)}>{l}</Button>)}</div>
        <Card className="overflow-hidden">{dl ? <Spinner /> : !dues?.length ? <Empty text="Nothing here" /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-3 py-3">Batch</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Paid</th><th className="px-3 py-3">Due</th><th className="px-3 py-3">Next due</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{dues.map((e) => <tr key={e.id} className="hover:bg-slate-50"><td className="px-5 py-3"><Link href={'/students/' + e.student.id} className="font-semibold text-brand-800 hover:underline">{e.student.name}</Link><div className="text-xs text-slate-400">{e.student.phone}</div></td>
              <td className="px-3 py-3">{e.batch.name}</td><td className="px-3 py-3">{inr(e.total_fee)}</td><td className="px-3 py-3">{inr(e.paid)}</td><td className="px-3 py-3 font-bold text-red-600">{inr(e.due)}</td><td className="px-3 py-3">{e.next_due_date || '—'}</td><td className="px-3 py-3"><Badge tone={payTone(e.payment_status)}>{e.payment_status}</Badge></td></tr>)}</tbody></table></div>)}</Card></>)}
      <FeeEditor fee={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />
    </>
  );
}
