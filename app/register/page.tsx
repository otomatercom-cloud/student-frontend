'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, GraduationCap, Loader2, MessageCircle, User, Phone, BookOpen, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cx, Field, Input, Select } from '@/components/ui';

const STEPS = [
  { t: 'Personal', icon: User }, { t: 'Contact', icon: Phone }, { t: 'Academic', icon: BookOpen }, { t: 'Parents', icon: Users },
];
const digits = (v: string) => (v || '').replace(/\D/g, '');

/** Resize the chosen photo to a passport-size JPEG (max 413x531) before upload. */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(413 / img.width, 531 / img.height, 1);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Invalid image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function Register() {
  const [opts, setOpts] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [f, setF] = useState<any>({ gender: 'female', joining_status: 'new', course_ids: [], website: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => { api('public/options').then(setOpts).catch((e) => setServerErr(e.message)); }, []);
  const set = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); if (errs[k]) setErrs({ ...errs, [k]: '' }); };
  const toggleCourse = (id: number) => setF({ ...f, course_ids: f.course_ids.includes(id) ? f.course_ids.filter((x: number) => x !== id) : [...f.course_ids, id] });

  function validate(s: number) {
    const e: Record<string, string> = {};
    const need = (k: string, label: string) => { if (!String(f[k] || '').trim()) e[k] = `${label} is required`; };
    if (s === 0) { need('name', 'Full name'); need('date_of_birth', 'Date of birth'); need('branch', 'Branch'); if (!f.photo) e.photo = 'Passport photo is required'; }
    if (s === 1) { need('email', 'Email'); need('phone', 'Phone'); need('district', 'District'); if (f.phone && digits(f.phone).length < 10) e.phone = 'Enter a valid phone number'; if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email'; }
    if (s === 2) { need('qualification', 'Qualification'); need('school', 'School'); need('college', 'College'); need('batch_id', 'Batch'); if (!f.course_ids.length) e.course_ids = 'Select the course name'; }
    if (s === 3) {
      need('father_name', "Father's name"); need('father_phone', "Father's phone"); need('mother_name', "Mother's name"); need('mother_phone', "Mother's phone");
      const w = digits(f.whatsapp_number); if (w.length < 10 || w.length > 15) e.whatsapp_number = "Parent's WhatsApp number is mandatory (10-15 digits)";
    }
    setErrs(e); return !Object.keys(e).length;
  }
  const go = (d: number) => { if (d > 0 && !validate(step)) return; setErrs({}); setStep(step + d); top.current?.scrollIntoView({ behavior: 'smooth' }); };

  async function submit() {
    if (!validate(3)) return;
    setBusy(true); setServerErr('');
    try { await api('public/register', { ...f, batch_id: Number(f.batch_id) }); setDone(true); }
    catch (e: any) { setServerErr(e.message); }
    setBusy(false);
  }
  async function pickPhoto(file?: File) {
    if (!file) return;
    try { setF({ ...f, photo: await resizePhoto(file) }); setErrs({ ...errs, photo: '' }); } catch { setErrs({ ...errs, photo: 'Please choose a valid image' }); }
  }
  const E = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-xs font-medium text-red-600">{errs[k]}</p> : null);
  const inp = (k: string, label: string, type = 'text', req = true) => (
    <Field label={label} required={req}><Input type={type} value={f[k] || ''} onChange={set(k)} className={errs[k] ? 'border-red-400' : ''} /><E k={k} /></Field>
  );

  if (done) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-500 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
        <CheckCircle2 size={64} className="mx-auto text-brand-600" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Registration submitted</h1>
        <p className="mt-2 text-slate-500">Thank you, {f.name}. Our team will contact you shortly.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white" ref={top}>
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-4 pb-24 pt-10 text-center text-white">
        <GraduationCap size={40} className="mx-auto" />
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Student Registration</h1>
        <p className="mt-1 text-brand-100">Join us in four quick steps</p>
      </div>
      <div className="mx-auto -mt-16 max-w-2xl px-4 pb-16">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
          {STEPS.map((s, i) => { const Icon = s.icon; return (
            <div key={s.t} className="flex flex-1 flex-col items-center gap-1.5">
              <div className={cx('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition', i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-700 text-white ring-4 ring-brand-100' : 'bg-slate-100 text-slate-400')}>{i < step ? '✓' : <Icon size={18} />}</div>
              <span className={cx('text-xs font-semibold', i === step ? 'text-brand-800' : 'text-slate-400')}>{s.t}</span>
            </div>); })}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card md:p-8">
          {!opts ? <div className="flex justify-center py-16 text-brand-600"><Loader2 className="animate-spin" /></div> : (
            <div className="space-y-5">
              {serverErr && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverErr}</div>}
              <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />

              {step === 0 && (<>
                <div className="flex flex-col items-center gap-2">
                  <label className="group relative flex h-40 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 hover:border-brand-500">
                    {f.photo ? <img src={f.photo} alt="" className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-xs font-semibold"><Camera /> Passport photo *</div>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                  </label><E k="photo" />
                </div>
                {inp('name', 'Full name')}
                <div className="grid gap-4 sm:grid-cols-2">
                  {inp('date_of_birth', 'Date of birth', 'date')}
                  <Field label="Gender"><Select value={f.gender} onChange={set('gender')}>{opts.genders.map((g: any) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select></Field>
                </div>
                <Field label="Branch" required><Select value={f.branch || ''} onChange={set('branch')} className={errs.branch ? 'border-red-400' : ''}><option value="">Select branch</option>{opts.branches.map((g: any) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select><E k="branch" /></Field>
                <Field label="Joining status"><Select value={f.joining_status} onChange={set('joining_status')}><option value="new">New student</option><option value="existing">Existing student</option></Select></Field>
                {f.joining_status === 'new' && <Field label="Admission officer name"><Input value={f.admission_officer_text || ''} onChange={set('admission_officer_text')} /></Field>}
              </>)}

              {step === 1 && (<>
                <div className="grid gap-4 sm:grid-cols-2">{inp('email', 'Email address', 'email')}{inp('phone', 'Student phone', 'tel')}</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="District" required><Select value={f.district || ''} onChange={set('district')} className={errs.district ? 'border-red-400' : ''}><option value="">Select district</option>{opts.districts.map((g: any) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select><E k="district" /></Field>
                  {inp('city', 'City', 'text', false)}
                </div>
                {inp('insta_id', 'Instagram ID (optional)', 'text', false)}
              </>)}

              {step === 2 && (<>
                {inp('qualification', 'Highest qualification')}
                <div className="grid gap-4 sm:grid-cols-2">{inp('school', 'Previous school')}{inp('college', 'Previous college')}</div>
                <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Course name <span className="text-red-500">*</span></div>
                  <div className="grid gap-2 sm:grid-cols-2">{opts.courses.map((c: any) => (
                    <button type="button" key={c.id} onClick={() => toggleCourse(c.id)} className={cx('rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition', f.course_ids.includes(c.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-700 hover:border-brand-300')}>{c.name}</button>))}</div><E k="course_ids" /></div>
                <Field label="Batch" required><Select value={f.batch_id || ''} onChange={set('batch_id')} className={errs.batch_id ? 'border-red-400' : ''}><option value="">Select batch</option>{opts.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select><E k="batch_id" /></Field>
              </>)}

              {step === 3 && (<>
                <div className="grid gap-4 sm:grid-cols-2">{inp('father_name', "Father's name")}{inp('father_phone', "Father's phone", 'tel')}{inp('mother_name', "Mother's name")}{inp('mother_phone', "Mother's phone", 'tel')}</div>
                <div className="rounded-2xl border border-dashed border-brand-400 bg-brand-50/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-800"><MessageCircle size={16} /> Parent&apos;s WhatsApp number <span className="text-red-500">*</span></div>
                  <Input type="tel" inputMode="tel" placeholder="e.g. 9847012345" value={f.whatsapp_number || ''} onChange={set('whatsapp_number')} className={errs.whatsapp_number ? 'border-red-400' : ''} /><E k="whatsapp_number" />
                </div>
              </>)}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => go(-1)} disabled={step === 0} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible"><ArrowLeft size={16} /> Back</button>
                {step < 3
                  ? <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800">Next <ArrowRight size={16} /></button>
                  : <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60">{busy && <Loader2 size={15} className="animate-spin" />} Submit registration</button>}
              </div>
            </div>)}
        </div>
      </div>
    </div>
  );
}
