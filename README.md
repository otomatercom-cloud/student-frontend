# Student Management – Next.js frontend (Odoo 19 BFF)

Modules: students, batches, courses, attendance, marks (+ send to parents on WhatsApp),
WhatsApp log and a public SaaS-style student joining form (`/register`).

The browser never talks to Odoo. Next.js route handlers (`app/api/*`) proxy to the Odoo
module `student_details_19` (`/api/sdm/*`) and keep the Odoo `session_id` in an httpOnly cookie,
so Odoo groups and record rules decide what each user may do.

## Odoo side
1. Deploy `student_details_19` v19.0.1.6.0 (adds `controllers/api.py`), **restart Odoo**, upgrade the module.
2. Users sign in with their normal Odoo login (give them the Student Details groups).

## Run
```bash
cp .env.example .env.local      # set ODOO_BASE_URL, ODOO_DB, COOKIE_SECURE
npm install
npm run build
pm2 start npm --name student-ui -- start      # serves on :3010
# after editing .env.local:  pm2 restart student-ui --update-env
```
Put nginx/Cloudflare in front for HTTPS and set `COOKIE_SECURE=true`.

## Pages
`/login` · `/dashboard` · `/students` (+new, edit) · `/batches` (+detail: coordinators, courses, add/remove students)
· `/courses` · `/attendance` (take, draft, lock) · `/marks` (create exam, enter marks, publish, send to parents)
· `/whatsapp` · `/register` (public form, no login)

## Finance features
Fees page (create fees, GST, installments, batch mapping), student page tabs (Profile, Enrollment & Fees, Attendance, Marks, Account),
multi-fee enrollment, payments, Razorpay links, batch transfer, Dues report and finance stats on the dashboard.
Requires student_details_19 v19.0.1.7.0.
