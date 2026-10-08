'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Button, Card, Empty, ErrorBox, Input, PageHeader, Select, Spinner, Badge } from '@/components/ui';

export default function Students() {
  const [q, setQ] = useState('');
  const [sq, setSq] = useState('');
  const [batch, setBatch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setSq(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const { data: meta } = useApi<any>('meta');
  const { data, loading, error } = useApi<any>(`students?search=${encodeURIComponent(sq)}&batch_id=${batch}&page=${page}&limit=20`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return (
    <>
      <PageHeader title="Students" subtitle={data ? `${data.total} students` : ''}
        actions={<Link href="/students/new"><Button><Plus size={16} /> Add student</Button></Link>} />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-[1fr_240px]">
        <div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><Input className="pl-10" placeholder="Search name, phone, reg no..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={batch} onChange={(e) => { setBatch(e.target.value); setPage(1); }}><option value="">All batches</option>{meta?.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
      </Card>
      {error && <ErrorBox text={error} />}
      <Card className="overflow-hidden">
        {loading && !data ? <Spinner /> : !data?.items.length ? <Empty text="No students found" /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-3 py-3">Reg no</th><th className="px-3 py-3">Batch</th><th className="px-3 py-3">Courses</th><th className="px-3 py-3">Parent WhatsApp</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{data.items.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3"><Link href={'/students/' + s.id} className="font-semibold text-brand-800 hover:underline">{s.name}</Link><div className="text-xs text-slate-400">{s.phone}</div></td>
                <td className="px-3 py-3 text-slate-600">{s.registration_no || s.roll_no || '-'}</td>
                <td className="px-3 py-3">{s.batch ? <Badge tone="blue">{s.batch.name}</Badge> : '-'}</td>
                <td className="px-3 py-3 text-slate-600">{s.courses.map((c: any) => c.name).join(', ') || '-'}</td>
                <td className="px-3 py-3 text-slate-600">{s.whatsapp_number || <Badge tone="red">missing</Badge>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>
      {pages > 1 && (<div className="mt-4 flex items-center justify-center gap-3 text-sm">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-slate-500">Page {page} / {pages}</span>
        <Button variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>)}
    </>
  );
}
