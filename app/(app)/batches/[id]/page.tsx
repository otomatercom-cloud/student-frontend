'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui';

export default function BatchDetail({ params }: { params: { id: string } }) {
  const toast = useToast();
  const { data: meta } = useApi<any>('meta');
  const { data: b, loading, error, reload } = useApi<any>('batches/' + params.id);
  const [f, setF] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<any[]>([]);
  if (loading || !meta) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  const form = f || { name: b.name, start_date: b.start_date, end_date: b.end_date, active: b.active, course_ids: b.courses.map((c: any) => c.id), coordinator_ids: b.coordinators.map((c: any) => c.id) };
  const set = (k: string, v: any) => setF({ ...form, [k]: v });
  const multi = (k: string, id: number) => set(k, form[k].includes(id) ? form[k].filter((x: number) => x !== id) : [...form[k], id]);

  async function save() { try { await api('batches/save', { ...form, id: b.id }); toast('Batch saved'); setF(null); reload(); } catch (e: any) { toast(e.message, 'err'); } }
  async function search(v: string) { setQ(v); if (v.length < 2) return setFound([]); const r = await api('students?search=' + encodeURIComponent(v) + '&limit=15'); setFound(r.items); }
  async function change(body: any) { try { await api(`batches/${b.id}/students`, body); reload(); } catch (e: any) { toast(e.message, 'err'); } }

  return (
    <>
      <PageHeader title={b.name} subtitle={`${b.student_count} students`} actions={<Button onClick={() => setAddOpen(true)}><UserPlus size={16} /> Add students</Button>} />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="space-y-4 self-start p-5">
          <Field label="Batch name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></Field>
            <Field label="End"><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></Field>
          </div>
          <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Courses</div>
            <div className="flex flex-wrap gap-2">{meta.courses.map((c: any) => (
              <button key={c.id} onClick={() => multi('course_ids', c.id)} className={'rounded-full border px-3 py-1 text-xs font-medium ' + (form.course_ids.includes(c.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600')}>{c.name}</button>))}</div></div>
          <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Coordinators (can take attendance)</div>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">{meta.coordinators.map((u: any) => (
              <button key={u.id} onClick={() => multi('coordinator_ids', u.id)} className={'rounded-full border px-3 py-1 text-xs font-medium ' + (form.coordinator_ids.includes(u.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600')}>{u.name}</button>))}</div></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active</label>
          <Button className="w-full" onClick={save} disabled={!f}>Save changes</Button>
        </Card>
        <Card className="overflow-hidden">
          {!b.students.length ? <Empty text="No students in this batch" /> : (
            <div className="divide-y divide-slate-100">{b.students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div><Link href={'/students/' + s.id} className="font-semibold text-brand-800 hover:underline">{s.name}</Link><div className="text-xs text-slate-400">{s.registration_no || s.roll_no} · {s.whatsapp_number || <span className="text-red-500">no WhatsApp</span>}</div></div>
                <button onClick={() => confirm('Remove from batch?') && change({ remove: [s.id] })} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
              </div>))}</div>)}
        </Card>
      </div>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add students to batch">
        <Input autoFocus placeholder="Search student name / phone..." value={q} onChange={(e) => search(e.target.value)} />
        <div className="divide-y divide-slate-100">{found.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-2.5 text-sm"><div><div className="font-medium">{s.name}</div><div className="text-xs text-slate-400">{s.batch ? 'Now in ' + s.batch.name : 'No batch'}</div></div>
            <Button variant="soft" onClick={() => change({ add: [s.id] }).then(() => toast('Added'))}>Add</Button></div>))}</div>
      </Modal>
    </>
  );
}
