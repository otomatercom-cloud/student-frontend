import { NextRequest, NextResponse } from 'next/server';
import { ODOO_BASE_URL, SESSION_COOKIE, cookieOptions } from '@/lib/odoo';

export async function POST(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (sid) {
    await fetch(`${ODOO_BASE_URL}/web/session/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `session_id=${sid}` },
      body: JSON.stringify({ jsonrpc: '2.0', params: {} }),
    }).catch(() => null);
  }
  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
  return out;
}
