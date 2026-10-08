import { NextRequest, NextResponse } from 'next/server';
import { ODOO_BASE_URL, SESSION_COOKIE, cookieOptions } from '@/lib/odoo';

// Generic BFF proxy: /api/<x>  ->  Odoo /api/sdm/<x>. Only that prefix is reachable.
async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const isPublic = path.startsWith('public/');
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (!isPublic && !sid) return NextResponse.json({ ok: false, error: 'Not logged in' }, { status: 401 });

  const url = `${ODOO_BASE_URL}/api/sdm/${path}${req.nextUrl.search}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sid && !isPublic) headers.Cookie = `session_id=${sid}`;
  const init: RequestInit = { method: req.method, headers, cache: 'no-store', redirect: 'manual' };
  if (req.method === 'POST') init.body = await req.text();

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    return NextResponse.json({ ok: false, error: 'Cannot reach the Odoo server' }, { status: 502 });
  }
  // Odoo redirects to /web/login when the session has expired.
  if (res.status >= 300 && res.status < 400) {
    const out = NextResponse.json({ ok: false, error: 'Session expired' }, { status: 401 });
    out.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
    return out;
  }
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
export { proxy as GET, proxy as POST };
