'use client';
import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { api, useApi } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, Spinner, useToast } from '@/components/ui';

export default function Courses() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<any[]>('courses');
  const [edit, setEdit] = useState<any>(null);
  async function save() {
    try { await api('courses/save', edit); toast('Course saved'); setEdit(null); reload(); }
    catch (e: any) { toast(e.message, 'err'); }
  }
  return (
    <>
      <PageHeader title="Courses" subtitle="Course master" actions={<Button onClick={() => setEdit({ name: '', code: '', active: true })}><Plus size={16} /> Add course</Button>} />
      {error && <ErrorBox text={error} />}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : !data?.length ? <Empty text="No courses yet" /> : (
          <div className="divide-y divide-slate-100">{data.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div><div className="font-semibold text-slate-900">{c.name} {!c.active && <Badge tone="slate">archived</Badge>}</div>
                <div className="text-xs text-slate-500">{c.code || 'no code'} · {c.batches.length} batches</div></div>
              <Button variant="ghost" onClick={() => setEdit(c)}><Pencil size={14} /> Edit</Button>
            </div>))}</div>)}
      </Card>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit course' : 'New course'}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (<>
          <Field label="Course name" required><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Code"><Input value={edit.code || ''} onChange={(e) => setEdit({ ...edit, code: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
        </>)}
      </Modal>
    </>
  );
}
