'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui';

export default function Marks() {
  const toast = useToast();
  const router = useRouter();
  const { data: meta } = useApi<any>('meta');
  const { data, loading, error } = useApi<any[]>('exams');
  const [f, setF] = useState<any>(null);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function create() {
    try { const r = await api('exams/create', f); toast('Exam created'); router.push('/marks/' + r.id); }
    catch (e: any) { toast(e.message, 'err'); }
  }
  return (
    <>
      <PageHeader title="Marks" subtitle="Exams, mark entry and parent reports"
        actions={<Button onClick={() => setF({ batch_id: '', title: '', subject: '', exam_type: 'unit_test', exam_date: new Date().toISOString().slice(0, 10), max_marks: 100, pass_marks: 40 })}><Plus size={16} /> New exam</Button>} />
      {error && <ErrorBox text={error} />}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : !data?.length ? <Empty text="No exams yet" /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Exam</th><th className="px-3 py-3">Batch</th><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-center">Avg</th><th className="px-3 py-3 text-center">Pass %</th><th className="px-3 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{data.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50"><td className="px-5 py-3"><Link href={'/marks/' + e.id} className="font-semibold text-brand-800 hover:underline">{e.title}</Link><div className="text-xs text-slate-400">{e.subject}</div></td>
                <td className="px-3 py-3">{e.batch.name}</td><td className="px-3 py-3 text-slate-600">{e.exam_date}</td>
                <td className="px-3 py-3 text-center">{e.stats.average}/{e.max_marks}</td><td className="px-3 py-3 text-center">{e.stats.pass_percentage}%</td>
                <td className="px-3 py-3">{e.state === 'published' ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}</td></tr>))}</tbody>
          </table></div>)}
      </Card>
      <Modal open={!!f} onClose={() => setF(null)} title="New exam" footer={<><Button variant="ghost" onClick={() => setF(null)}>Cancel</Button><Button onClick={create}>Create</Button></>}>
        {f && (<>
          <Field label="Batch" required><Select value={f.batch_id} onChange={set('batch_id')}><option value="">Select...</option>{meta?.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Exam title" required><Input value={f.title} onChange={set('title')} placeholder="Unit Test 1" /></Field>
          <Field label="Subject / paper" required><Input list="subjects" value={f.subject} onChange={set('subject')} placeholder="Select or type" /><datalist id="subjects">{meta?.subjects.map((s: any) => <option key={s.id} value={s.name} />)}</datalist></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><Select value={f.exam_type} onChange={set('exam_type')}>{meta?.exam_types.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
            <Field label="Date"><Input type="date" value={f.exam_date} onChange={set('exam_date')} /></Field>
            <Field label="Max marks"><Input type="number" value={f.max_marks} onChange={set('max_marks')} /></Field>
            <Field label="Pass marks"><Input type="number" value={f.pass_marks} onChange={set('pass_marks')} /></Field>
          </div></>)}
      </Modal>
    </>
  );
}
