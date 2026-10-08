'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Select, Spinner, Textarea, cx, useToast } from '@/components/ui';
import StudentForm from '@/components/StudentForm';
import FinanceTab from '@/components/FinanceTab';

const TABS = ['Profile', 'Enrollment & Fees', 'Attendance', 'Marks', 'Batch History', 'Account'];
const ST_TONE: any = { present: 'green', late: 'amber', half_day: 'blue', absent: 'red', leave: 'slate' };

export default function StudentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const { data: meta } = useApi<any>('meta');
  const { data: s, loading, error, reload } = useApi<any>('students/' + params.id);
  const { data: ov, reload: reloadOv } = useApi<any>(tab >= 2 && tab !== 4 ? `students/${params.id}/overview` : null);
  const { data: fin, reload: reloadFin } = useApi<any>(tab === 4 ? `students/${params.id}/finance` : null);
  const [tr, setTr] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  if (loading || !meta) return <Spinner />;
  if (error) return <ErrorBox text={error} />;

  async function transfer() {
    try { await api(`students/${s.id}/transfer`, tr); toast('Student transferred'); setTr(null); reload(); reloadFin(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function sync() {
    setSyncing(true);
    try { const r = await api(`students/${s.id}/sync-moodle`, {}); toast(r.portal_message || 'Synced'); reloadOv(); } catch (e: any) { toast(e.message, 'err'); }
    setSyncing(false);
  }
  return (
    <>
      <PageHeader title={s.name} subtitle={`Reg: ${s.registration_no || '-'} · Overall attendance ${s.overall_attendance}%`}
        actions={<>{s.batch && <Badge tone="blue">{s.batch.name}</Badge>}{s.batch && <Button variant="ghost" onClick={() => setTr({ to_batch_id: '', transfer_date: new Date().toISOString().slice(0, 10), reason: '' })}><ArrowRightLeft size={15} /> Transfer batch</Button>}</>} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card">
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} className={cx('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition', tab === i ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100')}>{t}</button>)}
      </div>

      {tab === 0 && <StudentForm meta={meta} initial={s} onSaved={() => { reload(); }} />}
      {tab === 1 && <FinanceTab student={s} meta={meta} onChanged={reload} />}
      {tab === 2 && (!ov ? <Spinner /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">{[['Attendance', ov.attendance.percentage + '%'], ['Present', ov.attendance.present], ['Late', ov.attendance.late], ['Half day', ov.attendance.half_day], ['Absent', ov.attendance.absent], ['Leave', ov.attendance.leave]].map(([k, v]) => <Card key={k as string} className="p-4 text-center"><div className="text-xl font-bold">{v}</div><div className="text-xs uppercase text-slate-500">{k}</div></Card>)}</div>
          <Card className="overflow-hidden">{!ov.attendance.recent.length ? <Empty text="No locked attendance yet" /> : <div className="divide-y divide-slate-100">{ov.attendance.recent.map((r: any, i: number) => <div key={i} className="flex items-center justify-between px-5 py-3 text-sm"><div>{r.date} <span className="text-slate-400">· {r.session.replace('_', ' ')} · {r.batch}</span></div><Badge tone={ST_TONE[r.status]}>{r.status.replace('_', ' ')}</Badge></div>)}</div>}</Card>
        </div>))}
      {tab === 3 && (!ov ? <Spinner /> : <Card className="overflow-hidden">{!ov.marks.length ? <Empty text="No published marks yet" /> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Exam</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Marks</th><th className="px-3 py-3">%</th><th className="px-3 py-3">Result</th><th className="px-3 py-3">Rank</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{ov.marks.map((m: any, i: number) => <tr key={i}><td className="px-5 py-3 font-semibold">{m.exam}<div className="text-xs font-normal text-slate-400">{m.subject}</div></td><td className="px-3 py-3">{m.date}</td>
            <td className="px-3 py-3">{m.status === 'absent' ? 'Absent' : `${m.marks}/${m.max}`}</td><td className="px-3 py-3">{m.status === 'absent' ? '—' : m.percentage + '%'}</td>
            <td className="px-3 py-3">{m.status === 'absent' ? <Badge>absent</Badge> : <Badge tone={m.result === 'pass' ? 'green' : 'red'}>{m.result}</Badge>}</td><td className="px-3 py-3">{m.status === 'absent' ? '—' : m.rank}</td></tr>)}</tbody></table></div>)}</Card>)}
      {tab === 4 && (!fin ? <Spinner /> : <Card className="overflow-hidden">{!fin.transfers.length ? <Empty text="No batch transfers" /> : <div className="divide-y divide-slate-100">{fin.transfers.map((t: any) => <div key={t.id} className="px-5 py-3 text-sm"><div className="font-semibold">{t.from} → {t.to}</div><div className="text-xs text-slate-500">{t.date} · by {t.by}{t.reason && ` · ${t.reason}`}</div></div>)}</div>}</Card>)}
      {tab === 5 && (!ov ? <Spinner /> : (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><div className="text-xs font-semibold uppercase text-slate-500">Portal login</div><div className="mt-1 font-semibold">{ov.account.portal_login || '—'}</div><div className="text-xs text-slate-400">{ov.account.portal_message}</div></div>
            <div><div className="text-xs font-semibold uppercase text-slate-500">Moodle username</div><div className="mt-1 font-semibold">{ov.account.moodle_username || '—'}</div><div className="text-xs text-slate-400">{ov.account.moodle_user_id ? 'ID ' + ov.account.moodle_user_id : 'not synced'}</div></div>
          </div>
          <Badge tone={ov.account.portal_state === 'synced' ? 'green' : 'amber'}>{ov.account.portal_state || 'not synced'}</Badge>
          <div><Button loading={syncing} onClick={sync}><RefreshCw size={15} /> Sync portal & Moodle</Button></div>
        </Card>))}

      <Modal open={!!tr} onClose={() => setTr(null)} title="Transfer to another batch" footer={<><Button variant="ghost" onClick={() => setTr(null)}>Cancel</Button><Button disabled={!tr?.to_batch_id} onClick={transfer}>Confirm transfer</Button></>}>
        {tr && (<>
          <Field label="Transfer to" required><Select value={tr.to_batch_id} onChange={(e) => setTr({ ...tr, to_batch_id: e.target.value })}><option value="">Select batch...</option>{meta.batches.filter((b: any) => b.id !== s.batch?.id).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Date"><Input type="date" value={tr.transfer_date} onChange={(e) => setTr({ ...tr, transfer_date: e.target.value })} /></Field>
          <Field label="Reason"><Textarea rows={2} value={tr.reason} onChange={(e) => setTr({ ...tr, reason: e.target.value })} /></Field>
        </>)}
      </Modal>
    </>
  );
}
