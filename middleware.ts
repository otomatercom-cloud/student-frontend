import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (!req.cookies.get('sdm_session')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!.*\\..*).*)'] };
