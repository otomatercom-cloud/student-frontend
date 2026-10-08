import { NextRequest, NextResponse } from 'next/server';
import { ODOO_BASE_URL, ODOO_DB, SESSION_COOKIE, cookieOptions } from '@/lib/odoo';

export async function POST(req: NextRequest) {
  const { login, password } = await req.json().catch(() => ({}));
  if (!login || !password) return NextResponse.json({ ok: false, error: 'Enter login and password' }, { status: 400 });
  let res: Response;
  try {
    res = await fetch(`${ODOO_BASE_URL}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', params: { db: ODOO_DB, login, password } }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Cannot reach the Odoo server' }, { status: 502 });
  }
  const json = await res.json().catch(() => null);
  const sid = (res.headers.get('set-cookie') || '').match(/session_id=([^;]+)/)?.[1];
  if (!json?.result?.uid || !sid) {
    return NextResponse.json({ ok: false, error: 'Invalid login or password' }, { status: 401 });
  }
  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, sid, cookieOptions());
  return out;
}
