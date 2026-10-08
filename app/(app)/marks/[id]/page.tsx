'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Save, Send, Unlock } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, ErrorBox, Input, PageHeader, Spinner, useToast } from '@/components/ui';

export default function ExamSheet({ params }: { params: { id: string } }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any>('exams/' + params.id);
  const [lines, setLines] = useState<any[]>([]);
  const [busy, setBusy] = useState('');
  useEffect(() => { if (data) setLines(data.lines.map((l: any) => ({ ...l, marks: l.status === 'appeared' ? String(l.marks) : '' }))); }, [data]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox text={error || 'Not found'} />;
  const locked = data.state === 'published';
  const patch = (id: number, v: any) => setLines(lines.map((l) => (l.id === id ? { ...l, ...v } : l)));
  const payload = () => lines.map((l) => ({ id: l.id, status: l.status === 'absent' ? 'absent' : undefined, marks: l.status === 'absent' ? null : l.marks, remarks: l.remarks }));

  async function run(key: string, fn: () => Promise<any>, msg: string) {
    setBusy(key);
    try { await fn(); toast(msg); reload(); } catch (e: any) { toast(e.message, 'err'); }
    setBusy('');
  }
  const save = (publish: boolean) => {
    if (publish && !confirm('Publish and lock marks? Parents can receive them on WhatsApp.')) return;
    run(publish ? 'pub' : 'save', () => api(`exams/${data.id}/save`, { lines: payload(), action: publish ? 'publish' : 'draft' }), publish ? 'Marks published' : 'Draft saved');
  };
  const send = () => confirm('Send marks to all parents on WhatsApp now?') && run('send', async () => { const r = await api(`exams/${data.id}/send`, {}); toast(`${r.sent} of ${r.attempted} sent`); }, 'Done');
  const s = data.stats;
  return (
    <>
      <PageHeader title={`${data.title} · ${data.subject}`} subtitle={`${data.batch.name} · ${data.exam_date} · Max ${data.max_marks} · Pass ${data.pass_marks}`}
        actions={<><Link href="/marks"><Button variant="ghost"><ArrowLeft size={15} /> Back</Button></Link>
          {locked ? <><Button loading={busy === 'send'} onClick={send}><Send size={15} /> Send to parents</Button>
            <Button variant="ghost" loading={busy === 'un'} onClick={() => confirm('Unlock marks for editing?') && run('un', () => api(`exams/${data.id}/unpublish`, {}), 'Unlocked')}><Unlock size={15} /> Unlock</Button></> : null}</>} />
      {locked && <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[['Average', s.average], ['Highest', s.highest], ['Passed', s.pass], ['Failed', s.fail], ['Absent', s.absent]].map(([k, v]) => <Card key={k as string} className="p-4 text-center"><div className="text-xl font-bold">{v}</div><div className="text-xs uppercase text-slate-500">{k}</div></Card>)}</div>}
      <Card className="overflow-hidden"><div className="divide-y divide-slate-100">
        {lines.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1"><div className="truncate font-semibold">{l.name}</div><div className="text-xs text-slate-400">{l.roll_no}</div></div>
            {locked ? (
              <div className="flex items-center gap-2 text-sm">{l.status === 'absent' ? <Badge>Absent</Badge> : <><span className="font-bold">{l.marks}/{data.max_marks}</span><Badge tone={l.result === 'pass' ? 'green' : 'red'}>{l.result}</Badge><Badge tone="blue">Rank {l.rank}</Badge></>}</div>
            ) : (
              <div className="flex items-center gap-3">
                <Input type="number" inputMode="decimal" step="any" min={0} max={data.max_marks} placeholder="Marks" disabled={l.status === 'absent'} className="w-28" value={l.marks} onChange={(e) => patch(l.id, { marks: e.target.value, status: 'appeared' })} />
                <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={l.status === 'absent'} onChange={(e) => patch(l.id, { status: e.target.checked ? 'absent' : 'pending', marks: '' })} /> Absent</label>
              </div>)}
          </div>))}</div></Card>
      {!locked && <div className="mt-5 flex justify-center gap-3"><Button variant="ghost" loading={busy === 'save'} onClick={() => save(false)}><Save size={16} /> Save draft</Button><Button loading={busy === 'pub'} onClick={() => save(true)}><Lock size={16} /> Publish marks</Button></div>}
    </>
  );
}
