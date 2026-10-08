// Server-only helpers (BFF). The browser never talks to Odoo directly.
export const ODOO_BASE_URL = (process.env.ODOO_BASE_URL || 'http://127.0.0.1:8069').replace(/\/$/, '');
export const ODOO_DB = process.env.ODOO_DB || '';
export const SESSION_COOKIE = 'sdm_session';
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

export function cookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return { httpOnly: true, sameSite: 'lax' as const, secure: COOKIE_SECURE, path: '/', maxAge };
}
