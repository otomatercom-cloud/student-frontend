'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wallet, Users, Layers, BookOpen, CalendarCheck, ClipboardList, Send, AlertTriangle, FileEdit, UserX, Sun, Sunset, Moon } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Card, PageHeader, Spinner, Stat, ErrorBox } from '@/components/ui';

function Welcome({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const h = now ? now.getHours() : 12;
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const Icon = h < 12 ? Sun : h < 17 ? Sunset : Moon;
  const hh = now ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/ ?[ap]m/i, '') : '--:--';
  const ss = now ? String(now.getSeconds()).padStart(2, '0') : '--';
  const ap = now ? (now.getHours() >= 12 ? 'PM' : 'AM') : '';
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 p-6 text-white shadow-lg sm:p-8">
      <style>{`@keyframes sdFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}@keyframes sdRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes sdPulse{0%,100%{opacity:1}50%{opacity:.25}}@keyframes sdWave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(14deg)}20%,40%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}`}</style>
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" style={{ animation: 'sdFloat 6s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute bottom-[-40px] right-32 h-28 w-28 rounded-full bg-white/10" style={{ animation: 'sdFloat 8s ease-in-out infinite 1s' }} />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div style={{ animation: 'sdRise .7s ease both' }}>
          <div className="flex items-center gap-2 text-sm font-medium text-white/80"><Icon size={18} /> {greet}</div>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Welcome back, {name || 'there'} <span className="inline-block origin-[70%_70%]" style={{ animation: 'sdWave 2.5s ease-in-out infinite' }}>👋</span></h1>
          <p className="mt-1 text-sm text-white/80">{now ? now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
        </div>
        <div className="rounded-xl bg-white/15 px-5 py-3 text-center backdrop-blur" style={{ animation: 'sdRise .9s ease both' }}>
          <div className="flex items-baseline justify-center gap-1 font-mono text-4xl font-bold tabular-nums">
            <span>{hh}</span><span style={{ animation: 'sdPulse 1s steps(2) infinite' }}>:</span><span>{ss}</span><span className="ml-1 text-sm font-semibold text-white/80">{ap}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbsentPanel({ rows, date }: { rows: any[]; date: string }) {
  return (
    <Card className="flex max-h-[34rem] flex-col p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 font-bold text-slate-800"><UserX size={18} className="text-red-500" /> Absent today</div>
        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">{rows.length}</span>
      </div>
      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {rows.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No absentees marked for {date || 'today'} 🎉</div>}
        {rows.map((r, i) => (
          <Link key={r.id} href={'/students/' + r.student_id} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50" style={{ animation: `sdRise .4s ease ${Math.min(i, 12) * 40}ms both` }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600">{(r.name || '?').charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-800">{r.name}</div><div className="truncate text-xs text-slate-500">{r.batch}</div></div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: me } = useApi<any>('me');
  const { data, loading, error } = useApi<any>('dashboard');
  const { data: fin } = useApi<any>('finance/summary');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox text={error} />;
  const d = data!;
  const quick = [
    { href: '/students/new', t: 'Add Student', s: 'Register a new student' },
    { href: '/attendance', t: 'Take Attendance', s: 'Open today\'s sheet' },
    { href: '/marks', t: 'Enter Marks', s: 'Create exam & enter marks' },
    { href: '/batches', t: 'Manage Batches', s: 'Batches & students' },
  ];
  return (
    <>
      <Welcome name={(me?.name || '').split(' ')[0]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Students" value={d.students} icon={<Users size={22} />} />
        <Stat label="Batches" value={d.batches} icon={<Layers size={22} />} tone="blue" />
        <Stat label="Courses" value={d.courses} icon={<BookOpen size={22} />} tone="amber" />
        <Stat label="Exams" value={d.exams} icon={<ClipboardList size={22} />} />
        <Stat label="Attendance today" value={d.attendance_today} icon={<CalendarCheck size={22} />} tone="blue" />
        <Stat label="Draft attendance" value={d.draft_attendance} icon={<FileEdit size={22} />} tone="amber" />
        <Stat label="Messages sent" value={d.wa_sent} icon={<Send size={22} />} />
        <Stat label="Messages failed" value={d.wa_failed} icon={<AlertTriangle size={22} />} tone="red" />
      </div>
      {fin && <div className="mt-4 grid gap-4 sm:grid-cols-3"><Stat label="Fees collected" value={'₹' + Number(fin.collected).toLocaleString('en-IN')} icon={<Wallet size={22} />} /><Stat label="Outstanding" value={'₹' + Number(fin.due).toLocaleString('en-IN')} icon={<AlertTriangle size={22} />} tone="red" /><Stat label="Partial / unpaid" value={`${fin.partial} / ${fin.unpaid}`} icon={<FileEdit size={22} />} tone="amber" /></div>}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick actions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {quick.map((q) => (
          <Link key={q.href} href={q.href}><Card className="p-5 transition hover:-translate-y-0.5 hover:border-brand-300"><div className="font-bold text-brand-800">{q.t}</div><div className="mt-1 text-sm text-slate-500">{q.s}</div></Card></Link>
        ))}
      </div>
      </div>
      <aside><AbsentPanel rows={d.absent_today || []} date={d.today} /></aside>
      </div>
    </>
  );
}
