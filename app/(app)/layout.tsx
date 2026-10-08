'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, Layers, BookOpen, CalendarCheck, ClipboardList, MessageCircle, Wallet, LogOut, Menu, GraduationCap, UserPlus } from 'lucide-react';
import { useApi } from '@/lib/api';
import { cx } from '@/components/ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/batches', label: 'Batches', icon: Layers },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/fees', label: 'Fees', icon: Wallet },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/marks', label: 'Marks', icon: ClipboardList },
  { href: '/whatsapp', label: 'WhatsApp Log', icon: MessageCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: me } = useApi<any>('me');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }
  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + '/');
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={cx('flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
              active ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white')}>
            <Icon size={18} /> {label}
          </Link>
        );
      })}
      <a href="/register" target="_blank" className="mt-4 flex items-center gap-3 rounded-xl border border-white/20 px-3.5 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/10">
        <UserPlus size={18} /> Public Join Form
      </a>
    </nav>
  );
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-brand-800 to-brand-900 py-6 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="mb-8 flex items-center gap-3 px-6 text-white"><GraduationCap size={28} /><div className="text-lg font-bold leading-tight">Student<br />Management</div></div>
        {nav}
        <div className="px-4 pt-4">
          <div className="mb-2 truncate rounded-xl bg-white/10 px-3 py-2 text-xs text-brand-100">{me?.name || '...'}</div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50" />
          <aside className="relative flex h-full w-64 flex-col bg-brand-900 py-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center gap-3 px-6 text-white"><GraduationCap size={26} /><span className="font-bold">Student Management</span></div>
            {nav}
            <button onClick={logout} className="mx-4 mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-100 hover:bg-white/10"><LogOut size={16} /> Sign out</button>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-slate-100"><Menu size={22} /></button>
          <span className="font-bold text-brand-800">Student Management</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
