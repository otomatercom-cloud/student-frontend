'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Spinner, useToast } from '@/components/ui';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Holidays() {
  const toast = useToast();
  const { data: me } = useApi<any>('me');
  const { data: meta } = useApi<any>('meta');
  const { data, loading, error, reload } = useApi<any>('holidays');
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const manager = !!me?.is_manager;

  async function save() {
    setBusy(true);
    try { await api('holidays/save', edit); toast('Holiday saved'); setEdit(null); reload(); }
    catch (e: any) { toast(e.message, 'err'); }
    setBusy(false);
  }
  async function del(id: number) {
    if (!confirm('Delete this holiday?')) return;
    try { await api(`holidays/${id}/delete`, {}); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function toggleDay(d: number) {
    const cur: number[] = data.weekly_off;
    const days = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    try { await api('holidays/weekly-off', { days, auto: data.auto }); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function setAuto(auto: string) {
    try { await api('holidays/weekly-off', { days: data.weekly_off, auto }); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  const toggleBatch = (id: number) => setEdit({ ...edit, batch_ids: edit.batch_ids.includes(id) ? edit.batch_ids.filter((x: number) => x !== id) : [...edit.batch_ids, id] });

  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  return (
    <>
      <PageHeader title="Holidays & weekly off" subtitle="No attendance sheet is created on these days"
        actions={manager ? <Button onClick={() => setEdit({ name: '', date_from: '', date_to: '', batch_ids: [] })}><Plus size={16} /> Add holiday</Button> : undefined} />
      <Card className="mb-6 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Weekly off days</div>
        <div className="flex flex-wrap gap-2">{DAYS.map((d, i) => (
          <button key={d} disabled={!manager} onClick={() => toggleDay(i)}
            className={'rounded-lg border px-4 py-2 text-sm font-semibold transition ' + (data.weekly_off.includes(i) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>{d}</button>))}</div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" disabled={!manager} className="h-4 w-4 accent-brand-600" checked={data.auto === 'on'} onChange={(e) => setAuto(e.target.checked ? 'on' : 'off')} />
          Create attendance sheets automatically every day
        </label>
      </Card>
      <Card className="overflow-hidden">
        {!data.items.length ? <Empty text="No holidays added yet" /> : (
          <div className="divide-y divide-slate-100">{data.items.map((h: any) => (
            <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div><div className="font-semibold text-slate-900">{h.name}</div>
                <div className="text-xs text-slate-500">{h.date_from}{h.date_to !== h.date_from ? ' to ' + h.date_to : ''}</div></div>
              <div className="flex flex-wrap items-center gap-2">
                {h.batches.length ? h.batches.map((b: any) => <Badge key={b.id} tone="blue">{b.name}</Badge>) : <Badge>All batches</Badge>}
                {manager && <>
                  <Button variant="ghost" onClick={() => setEdit({ id: h.id, name: h.name, date_from: h.date_from, date_to: h.date_to, batch_ids: h.batches.map((b: any) => b.id) })}>Edit</Button>
                  <button onClick={() => del(h.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button></>}
              </div></div>))}</div>)}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit holiday' : 'Add holiday'}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button loading={busy} disabled={!edit?.name || !edit?.date_from} onClick={save}>Save</Button></>}>
        {edit && <div className="space-y-4">
          <Field label="Holiday name" required><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Onam" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" required><Input type="date" value={edit.date_from} onChange={(e) => setEdit({ ...edit, date_from: e.target.value, date_to: edit.date_to || e.target.value })} /></Field>
            <Field label="To"><Input type="date" min={edit.date_from} value={edit.date_to} onChange={(e) => setEdit({ ...edit, date_to: e.target.value })} /></Field>
          </div>
          <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Only these batches (empty = all)</div>
            <div className="flex flex-wrap gap-2">{meta?.batches.map((b: any) => (
              <button type="button" key={b.id} onClick={() => toggleBatch(b.id)} className={'rounded-full border px-3 py-1 text-xs font-medium ' + (edit.batch_ids.includes(b.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600')}>{b.name}</button>))}</div></div>
        </div>}
      </Modal>
    </>
  );
}
