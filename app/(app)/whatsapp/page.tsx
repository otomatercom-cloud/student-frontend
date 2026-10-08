'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api';
import { Badge, Card, Empty, ErrorBox, PageHeader, Select, Spinner } from '@/components/ui';

export default function WhatsappLog() {
  const [state, setState] = useState('');
  const { data, loading, error } = useApi<any[]>('whatsapp/logs' + (state ? '?state=' + state : ''));
  const tone: any = { sent: 'green', failed: 'red', queued: 'amber', skipped: 'slate' };
  return (
    <>
      <PageHeader title="WhatsApp Log" subtitle="Absent, late and marks messages" actions={<Select className="w-44" value={state} onChange={(e) => setState(e.target.value)}><option value="">All</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="queued">Queued</option><option value="skipped">Skipped</option></Select>} />
      {error && <ErrorBox text={error} />}
      <Card className="overflow-hidden">{loading ? <Spinner /> : !data?.length ? <Empty text="No messages" /> : (
        <div className="divide-y divide-slate-100">{data.map((l) => (
          <div key={l.id} className="px-5 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">{l.student}</div><div className="flex gap-2"><Badge tone="blue">{l.type}</Badge><Badge tone={tone[l.state]}>{l.state}</Badge></div></div>
            <div className="mt-1 text-xs text-slate-500">{l.number}</div>
            {l.error && <div className="mt-1 text-xs text-red-600">{l.error}</div>}</div>))}</div>)}</Card>
    </>
  );
}
