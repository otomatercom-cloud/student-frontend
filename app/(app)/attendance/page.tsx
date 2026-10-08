'use client';
import { useState } from 'react';
import { CheckCheck, Lock, Save, ArrowLeft } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, PageHeader, Select, Spinner, Textarea, useToast } from '@/components/ui';

const TONE: Record<string, string> = {
  present: 'border-emerald-500 bg-emerald-50 text-emerald-800', late: 'border-amber-500 bg-amber-50 text-amber-800',
  half_day: 'border-sky-500 bg-sky-50 text-sky-800', absent: 'border-red-500 bg-red-50 text-red-700', leave: 'border-slate-500 bg-slate-100 text-slate-700',
};
const SHORT: Record<string, string> = { present: 'P', late: 'L', half_day: 'H', absent: 'A', leave: 'OL' };

export default function Attendance() {
  const toast = useToast();
  const { data: meta } = useApi<any>('meta');
  const { data: batches, loading, error, reload } = useApi<any[]>('attendance/batches');
  const [pick, setPick] = useState({ batch_id: '', session: 'full_day', date: new Date().toISOString().slice(0, 10) });
  const [sheet, setSheet] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function open(batch_id?: string) {
    try { setSheet(await api('attendance/open', { ...pick, batch_id: batch_id || pick.batch_id })); }
    catch (e: any) { toast(e.message, 'err'); }
  }
  const setStatus = (id: number, status: string) => setSheet({ ...sheet, lines: sheet.lines.map((l: any) => (l.id === id ? { ...l, status } : l)) });
  const counts = sheet ? sheet.lines.reduce((a: any, l: any) => ({ ...a, [l.status]: (a[l.status] || 0) + 1 }), {}) : {};
  const locked = sheet?.state === 'locked';

  async function save(action: 'draft' | 'lock') {
    if (action === 'lock' && !confirm('Submit and lock this attendance? Absent parents may get a WhatsApp message.')) return;
    setBusy(true);
    try {
      const s = await api(`attendance/${sheet.id}/save`, { lines: sheet.lines, topic: sheet.topic, remarks: sheet.remarks, action });
      setSheet(s); toast(action === 'lock' ? 'Attendance locked' : 'Draft saved'); reload();
    } catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }

  if (sheet) return (
    <>
      <PageHeader title={sheet.batch.name} subtitle={`${sheet.date} · ${meta?.att_sessions.find((s: any) => s.value === sheet.session)?.label}`}
        actions={<><Button variant="ghost" onClick={() => setSheet(null)}><ArrowLeft size={15} /> Back</Button>{!locked && <Button variant="soft" onClick={() => setSheet({ ...sheet, lines: sheet.lines.map((l: any) => ({ ...l, status: 'present' })) })}><CheckCheck size={16} /> All present</Button>}</>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {meta?.att_statuses.map((s: any) => <span key={s.value} className={'rounded-full border px-3 py-1 text-xs font-semibold ' + TONE[s.value]}>{s.label}: {counts[s.value] || 0}</span>)}
        {locked && <Badge tone="slate">Locked</Badge>}
      </div>
      <Card className="overflow-hidden">
        <div className="divide-y divide-slate-100">{sheet.lines.map((l: any) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0"><div className="truncate font-semibold text-slate-900">{l.name}</div><div className="text-xs text-slate-400">{l.roll_no}</div></div>
            <div className="flex gap-1.5">{meta?.att_statuses.map((s: any) => (
              <button key={s.value} disabled={locked} title={s.label} onClick={() => setStatus(l.id, s.value)}
                className={'h-9 min-w-9 rounded-lg border px-2 text-xs font-bold transition ' + (l.status === s.value ? TONE[s.value] : 'border-slate-200 text-slate-400 hover:bg-slate-50') + (locked ? ' opacity-70' : '')}>{SHORT[s.value]}</button>))}</div>
          </div>))}</div>
      </Card>
      <Card className="mt-4 grid gap-4 p-4 md:grid-cols-2">
        <Field label="Topic / subject"><Input disabled={locked} value={sheet.topic || ''} onChange={(e) => setSheet({ ...sheet, topic: e.target.value })} /></Field>
        <Field label="Notes"><Textarea disabled={locked} rows={1} value={sheet.remarks || ''} onChange={(e) => setSheet({ ...sheet, remarks: e.target.value })} /></Field>
      </Card>
      {!locked && <div className="mt-5 flex justify-center gap-3"><Button variant="ghost" loading={busy} onClick={() => save('draft')}><Save size={16} /> Save draft</Button><Button loading={busy} onClick={() => save('lock')}><Lock size={16} /> Submit & lock</Button></div>}
    </>
  );

  return (
    <>
      <PageHeader title="Take Attendance" subtitle="Choose batch, date and session" />
      {error && <ErrorBox text={error} />}
      <Card className="mb-6 grid gap-3 p-4 md:grid-cols-4">
        <Select value={pick.batch_id} onChange={(e) => setPick({ ...pick, batch_id: e.target.value })}><option value="">Select batch...</option>{batches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        <Input type="date" max={new Date().toISOString().slice(0, 10)} value={pick.date} onChange={(e) => setPick({ ...pick, date: e.target.value })} />
        <Select value={pick.session} onChange={(e) => setPick({ ...pick, session: e.target.value })}>{meta?.att_sessions.map((s: any) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        <Button disabled={!pick.batch_id} onClick={() => open()}>Open sheet</Button>
      </Card>
      {loading ? <Spinner /> : !batches?.length ? <Card><Empty text="No batches assigned to you" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{batches.map((b) => (
          <Card key={b.id} className="p-5"><div className="font-bold">{b.name}</div><div className="mt-1 text-xs text-slate-500">{b.student_count} students</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{b.today.length ? b.today.map((t: any) => <Badge key={t.id} tone={t.state === 'locked' ? 'green' : 'amber'}>{t.session.replace('_', ' ')} · {t.state} · {t.rate}%</Badge>) : <Badge>not taken today</Badge>}</div>
            <Button variant="soft" className="mt-4 w-full" onClick={() => { setPick({ ...pick, batch_id: String(b.id) }); open(String(b.id)); }}>Take today</Button></Card>))}</div>)}
    </>
  );
}
