'use client';
import { useState } from 'react';
import { Plus, Trash2, DoorOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui';

const toTime = (h: number) => { const m = Math.round(h * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const toHours = (t: string) => { const [h, m] = t.split(':').map(Number); return h + (m || 0) / 60; };
const BLANK = { batch_id: '', subject_id: '', faculty_id: '', classroom_id: '', weekday: '0', start: '09:00', end: '10:00', valid_from: '', valid_to: '' };

export default function Timetable() {
  const toast = useToast();
  const { data: meta, error: merr, reload: reloadMeta } = useApi<any>('timetable/meta');
  const [by, setBy] = useState<'batch' | 'faculty' | 'classroom'>('batch');
  const [sel, setSel] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [date, setDate] = useState(todayStr);
  const filt = sel ? `${by}_id=${sel}` : '';
  const { data: wk, loading: wl, error: werr, reload: reloadWk } = useApi<any[]>(meta && mode === 'week' ? `timetable?${filt}` : null);
  const { data: dy, loading: dl, error: derr, reload: reloadDy } = useApi<any>(meta && mode === 'day' ? `timetable/day?date=${date}&${filt}` : null);
  const slots = mode === 'week' ? wk : dy?.slots;
  const loading = mode === 'week' ? wl : dl; const error = mode === 'week' ? werr : derr;
  const reload = () => { reloadWk(); reloadDy(); };
  const shift = (n: number) => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + n); setDate(d.toISOString().slice(0, 10)); };
  const dayName = (ds: string) => new Date(ds + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const [edit, setEdit] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const { data: rooms, reload: reloadRooms } = useApi<any[]>(room ? 'classrooms' : null);

  async function save() {
    setBusy(true);
    try {
      await api('timetable/save', { ...edit, start: toHours(edit.start), end: toHours(edit.end) });
      toast('Timetable saved'); setEdit(null); reload();
    } catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }
  async function del() {
    if (!confirm('Delete this period?')) return;
    try { await api(`timetable/${edit.id}/delete`, {}); setEdit(null); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function saveRoom() {
    try { await api('classrooms/save', room); toast('Classroom saved'); setRoom({ name: '', capacity: '' }); reloadRooms(); } catch (e: any) { toast(e.message, 'err'); }
  }
  const openEdit = (s: any) => setEdit({ id: s.id, batch_id: s.batch.id, subject_id: s.subject.id, faculty_id: s.faculty?.id || '', classroom_id: s.classroom?.id || '',
    weekday: s.weekday, start: toTime(s.start), end: toTime(s.end), valid_from: s.valid_from, valid_to: s.valid_to });
  const f = (k: string) => (e: any) => setEdit({ ...edit, [k]: e.target.value });

  if (merr) return <ErrorBox text={merr} />;
  if (!meta) return <Spinner />;
  const canEdit = meta.can_edit;
  const list = by === 'batch' ? meta.batches : by === 'faculty' ? meta.faculty : meta.classrooms;
  const days = meta.weekdays.filter((d: any) => d.value !== '6' || (slots || []).some((s) => s.weekday === '6'));

  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly classes by batch, subject, faculty and classroom"
        actions={canEdit ? <>{meta.is_manager && <Button variant="ghost" onClick={() => setRoom({ name: '', capacity: '' })}><DoorOpen size={16} /> Classrooms</Button>}<Button onClick={() => setEdit({ ...BLANK, weekday: String((new Date(date + 'T00:00:00').getDay() + 6) % 7), batch_id: sel && by === 'batch' ? sel : '' })}><Plus size={16} /> Add period</Button></> : undefined} />
      <Card className="mb-3 flex flex-wrap items-center gap-3 p-4">
        <div className="flex rounded-xl bg-slate-100 p-1">{(['day', 'week'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={'rounded-lg px-4 py-1.5 text-sm font-semibold transition ' + (mode === m ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>{m === 'day' ? 'By date' : 'Weekly'}</button>))}</div>
        {mode === 'day' && <div className="flex items-center gap-1.5">
          <button onClick={() => shift(-1)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-44" />
          <button onClick={() => shift(1)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronRight size={16} /></button>
          {date !== todayStr && <Button variant="soft" onClick={() => setDate(todayStr)}>Today</Button>}</div>}
      </Card>
      <Card className="mb-5 grid gap-3 p-4 md:grid-cols-[12rem_1fr]">
        <Select value={by} onChange={(e) => { setBy(e.target.value as any); setSel(''); }}>
          <option value="batch">View by batch</option><option value="faculty">View by faculty</option><option value="classroom">View by classroom</option></Select>
        <Select value={sel} onChange={(e) => setSel(e.target.value)}><option value="">All {by === 'batch' ? 'batches' : by === 'faculty' ? 'faculty' : 'classrooms'}</option>
          {list.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
      </Card>
      {error && <ErrorBox text={error} />}
      {mode === 'day' && <div className="mb-3 text-sm font-semibold text-slate-700">{dayName(date)}{dy?.off?.map((o: any) => <Badge key={o.batch} tone="slate"> {o.batch}: {o.reason} </Badge>)}</div>}
      {loading || !slots ? <Spinner /> : mode === 'day' ? (
        !slots.length ? <Card><Empty text="No classes on this date" /></Card> : (
          <Card className="divide-y divide-slate-100 overflow-hidden">{slots.map((s: any) => (
            <button key={s.id} disabled={!canEdit} onClick={() => openEdit(s)} className="flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3.5 text-left transition enabled:hover:bg-slate-50">
              <span className="w-28 font-mono text-sm font-semibold text-brand-700">{s.time}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{s.subject.name}</span>
                <span className="block truncate text-xs text-slate-500">{[s.batch.name, s.faculty?.name].filter(Boolean).join(' · ')}</span></span>
              {s.classroom && <Badge tone="blue">{s.classroom.name}</Badge>}
            </button>))}</Card>)
      ) : !slots.length ? <Card><Empty text="No periods yet" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{days.map((d: any) => {
          const items = slots.filter((s) => s.weekday === d.value);
          return (
            <Card key={d.value} className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700">{d.label}</div>
              {!items.length ? <div className="p-4 text-center text-xs text-slate-400">No classes</div> : (
                <div className="divide-y divide-slate-100">{items.map((s) => (
                  <button key={s.id} disabled={!canEdit} onClick={() => openEdit(s)} className="block w-full px-4 py-3 text-left transition enabled:hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold text-brand-700">{s.time}</span>
                      {s.classroom && <Badge tone="blue">{s.classroom.name}</Badge>}</div>
                    <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{s.subject.name}</div>
                    <div className="truncate text-xs text-slate-500">{[by !== 'batch' && s.batch.name, by !== 'faculty' && s.faculty?.name].filter(Boolean).join(' · ') || (by === 'batch' ? s.faculty?.name : s.batch.name)}</div>
                  </button>))}</div>)}
            </Card>); })}</div>)}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit period' : 'Add period'}
        footer={<>{edit?.id && <Button variant="ghost" onClick={del}><Trash2 size={15} className="text-red-500" /></Button>}<Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
          <Button loading={busy} disabled={!edit?.batch_id || !edit?.subject_id} onClick={save}>Save</Button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch" required><Select value={edit.batch_id} onChange={f('batch_id')}><option value="">-</option>{meta.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Subject" required><Select value={edit.subject_id} onChange={f('subject_id')}><option value="">-</option>{meta.subjects.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Faculty"><Select value={edit.faculty_id} onChange={f('faculty_id')}><option value="">-</option>{meta.faculty.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Classroom"><Select value={edit.classroom_id} onChange={f('classroom_id')}><option value="">-</option>{meta.classrooms.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Day" required><Select value={edit.weekday} onChange={f('weekday')}>{meta.weekdays.map((d: any) => <option key={d.value} value={d.value}>{d.label}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Start" required><Input type="time" value={edit.start} onChange={f('start')} /></Field><Field label="End" required><Input type="time" value={edit.end} onChange={f('end')} /></Field></div>
          <Field label="Valid from" hint="Optional"><Input type="date" value={edit.valid_from} onChange={f('valid_from')} /></Field>
          <Field label="Valid to" hint="Optional"><Input type="date" value={edit.valid_to} onChange={f('valid_to')} /></Field>
        </div>}
      </Modal>

      <Modal open={!!room} onClose={() => { setRoom(null); reloadMeta(); }} title="Classrooms"
        footer={<Button variant="ghost" onClick={() => setRoom(null)}>Close</Button>}>
        {room && <div className="space-y-4">
          <div className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
            <Field label="New classroom"><Input value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} placeholder="e.g. Room 101" /></Field>
            <Field label="Seats"><Input type="number" value={room.capacity} onChange={(e) => setRoom({ ...room, capacity: e.target.value })} /></Field>
            <Button disabled={!room.name.trim()} onClick={saveRoom}>Add</Button></div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">{(rooms || []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm"><span className={r.active ? 'font-medium' : 'text-slate-400 line-through'}>{r.name}{r.capacity ? ` · ${r.capacity} seats` : ''}</span>
              <button className="text-xs text-slate-500 hover:text-brand-700" onClick={async () => { await api('classrooms/save', { ...r, active: !r.active }); reloadRooms(); }}>{r.active ? 'Archive' : 'Restore'}</button></div>))}</div>
        </div>}
      </Modal>
    </>
  );
}
