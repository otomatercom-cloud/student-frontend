'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Spinner, useToast } from '@/components/ui';

export default function Batches() {
  const toast = useToast();
  const router = useRouter();
  const { data, loading, error, reload } = useApi<any[]>('batches');
  const [form, setForm] = useState<any>(null);
  async function create() {
    try { const r = await api('batches/save', form); toast('Batch created'); setForm(null); reload(); router.push('/batches/' + r.id); }
    catch (e: any) { toast(e.message, 'err'); }
  }
  return (
    <>
      <PageHeader title="Batches" subtitle="Create and manage batches" actions={<Button onClick={() => setForm({ name: '', start_date: '', end_date: '' })}><Plus size={16} /> New batch</Button>} />
      {error && <ErrorBox text={error} />}
      {loading ? <Spinner /> : !data?.length ? <Card><Empty text="No batches yet" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.map((b) => (
          <Link key={b.id} href={'/batches/' + b.id}><Card className="p-5 transition hover:-translate-y-0.5 hover:border-brand-300">
            <div className="flex items-start justify-between gap-2"><div className="font-bold text-slate-900">{b.name}</div>{!b.active && <Badge>archived</Badge>}</div>
            <div className="mt-1 text-xs text-slate-500">{b.start_date || '—'} → {b.end_date || '—'}</div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-700"><Users size={16} /> {b.student_count} students</div>
            <div className="mt-2 text-xs text-slate-500">{b.courses.map((c: any) => c.name).join(', ')}</div>
          </Card></Link>))}</div>)}
      <Modal open={!!form} onClose={() => setForm(null)} title="New batch" footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={create}>Create</Button></>}>
        {form && (<>
          <Field label="Batch name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="End date"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div></>)}
      </Modal>
    </>
  );
}
