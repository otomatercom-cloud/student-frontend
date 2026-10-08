'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Field, Input, Select, Textarea, useToast } from '@/components/ui';

export default function StudentForm({ meta, initial, onSaved }: { meta: any; initial?: any; onSaved: (id: number) => void }) {
  const toast = useToast();
  const [f, setF] = useState<any>({
    gender: 'female', branch: 'kochi', joining_status: 'new', follow_social: true, see_social: true, active: true, ...initial,
    batch_id: initial?.batch?.id || '', course_ids: initial?.courses?.map((c: any) => c.id) || [],
  });
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string>('');
  const [errs, setErrs] = useState<string[]>([]);
  const needPhoto = !initial?.has_photo;
  const onPhoto = (e: any) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 3 * 1024 * 1024) { toast('Photo must be under 3 MB', 'err'); e.target.value = ''; return; } const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(file); };
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const tick = (k: string) => (e: any) => setF({ ...f, [k]: e.target.checked });
  const toggleCourse = (id: number) => setF({ ...f, course_ids: f.course_ids.includes(id) ? f.course_ids.filter((x: number) => x !== id) : [...f.course_ids, id] });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const must: [string, string][] = [['name','Full name'],['date_of_birth','Date of birth'],['email','Email'],['phone','Student phone'],['district','District'],['qualification','Highest qualification'],['school','Previous school'],['college','Previous college'],['father_name',"Father's name"],['father_phone',"Father's phone"],['mother_name',"Mother's name"],['mother_phone',"Mother's phone"],['whatsapp_number',"Parent's WhatsApp number"]];
    const miss = must.filter(([k]) => !String(f[k] || '').trim()).map(([, l]) => l);
    if (needPhoto && !photo) miss.push('Passport photo');
    setErrs(miss);
    if (miss.length) { toast('Fill the mandatory fields', 'err'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setBusy(true);
    try {
      const { id } = await api('students/save', { ...f, photo: photo || undefined, id: initial?.id });
      toast('Student saved');
      onSaved(id);
    } catch (err: any) { toast(err.message, 'err'); }
    setBusy(false);
  }
  const text = (k: string, label: string, required = false, type = 'text', hint?: string) => (
    <Field label={label} required={required} hint={hint}><Input type={type} value={f[k] || ''} onChange={set(k)} required={required} /></Field>
  );
  const sel = (k: string, label: string, opts: any[], required = false, blank = false) => (
    <Field label={label} required={required}><Select value={f[k] || ''} onChange={set(k)} required={required}>{blank && <option value="">- Select -</option>}{opts.map((g: any) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select></Field>
  );
  const phone = (k: string, label: string, hint?: string) => (
    <Field label={label} required hint={hint}><Input type="tel" inputMode="tel" value={f[k] || ''} onChange={set(k)} required pattern="[0-9+ ]{10,15}" title="10-15 digits" /></Field>
  );
  const H = ({ n, t }: { n: number; t: string }) => <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">{n}</span>{t}</h3>;
  const Check = ({ k, label }: { k: string; label: string }) => <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!f[k]} onChange={tick(k)} className="h-4 w-4 accent-brand-600" /> {label}</label>;
  return (
    <form onSubmit={save} className="space-y-6">
      {errs.length > 0 && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><b>Please fill the mandatory fields:</b> {errs.join(', ')}</div>}
      <p className="text-xs text-slate-500">Fields marked <span className="text-red-500">*</span> are mandatory.</p>
      <Card className="p-6"><H n={1} t="Personal details" />
        <div className="grid gap-4 md:grid-cols-2">
          {text('name', 'Full name', true)}
          {text('date_of_birth', 'Date of birth', true, 'date')}
          {sel('gender', 'Gender', meta.genders)}
          {sel('joining_status', 'Joining status', meta.joining_statuses || [{ value: 'new', label: 'New' }, { value: 'existing', label: 'Existing' }], true)}
          {sel('branch', 'Branch', meta.branches, true)}
          <Field label="Register number" hint={initial?.registration_no ? 'Auto-generated' : 'Auto-generated on save'}><Input value={initial?.registration_no || f.roll_no || ''} onChange={set('roll_no')} readOnly={!!initial?.registration_no} placeholder="Auto" /></Field>
          {initial?.lead_reference_no && <Field label="Lead reference"><Input value={initial.lead_reference_no} readOnly /></Field>}
          <Field label="Passport photo" required={needPhoto} hint="JPG/PNG, max 3 MB">
            <div className="flex items-center gap-3">
              {photo && <img src={photo} alt="" className="h-16 w-14 rounded-lg border object-cover" />}
              <input type="file" accept="image/*" onChange={onPhoto} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800" />
            </div>
          </Field>
        </div></Card>
      <Card className="p-6"><H n={2} t="Contact & address" />
        <div className="grid gap-4 md:grid-cols-2">
          {phone('phone', 'Student phone')}
          {text('email', 'Email', true, 'email')}
          <div className="md:col-span-2"><Field label="Address"><Textarea rows={2} value={f.address || ''} onChange={set('address')} placeholder="House / street / area" /></Field></div>
          {text('city', 'City')}
          {sel('district', 'District', meta.districts, true, true)}
        </div></Card>
      <Card className="p-6"><H n={3} t="Parent / guardian" />
        <div className="grid gap-4 md:grid-cols-2">
          {text('father_name', "Father's name", true)}{phone('father_phone', "Father's phone")}
          {text('mother_name', "Mother's name", true)}{phone('mother_phone', "Mother's phone")}
          {phone('whatsapp_number', "Parent's WhatsApp number", '10-15 digits')}
          {text('guardian_occupation', 'Guardian occupation')}
        </div></Card>
      <Card className="p-6"><H n={4} t="Education" />
        <div className="grid gap-4 md:grid-cols-2">
          {text('qualification', 'Highest qualification', true)}{text('school', 'Previous school name', true)}{text('college', 'Previous college name', true)}
        </div></Card>
      <Card className="p-6"><H n={5} t="Batch & courses" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Batch"><Select value={f.batch_id} onChange={set('batch_id')}><option value="">- Select -</option>{meta.batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
          <Field label="Admission officer"><Select value={f.admission_officer_id || ''} onChange={set('admission_officer_id')}><option value="">-</option>{(meta.coordinators || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
          {f.joining_status === 'new' && text('admission_officer_text', 'Admission officer name (portal)')}
        </div>
        <div className="mt-4"><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Course name</div>
          <div className="flex flex-wrap gap-2">{meta.courses.map((c: any) => (
            <button type="button" key={c.id} onClick={() => toggleCourse(c.id)}
              className={'rounded-full border px-4 py-1.5 text-sm font-medium transition ' + (f.course_ids.includes(c.id) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>{c.name}</button>
          ))}</div></div>
      </Card>
      <Card className="p-6"><H n={6} t="Marketing & settings" />
        <div className="grid gap-4 md:grid-cols-2">
          {sel('logic_join', 'How did you hear about us', meta.logic_join || [], false, true)}
          {text('reference_code', 'Reference code')}
          {text('insta_id', 'Instagram ID')}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <Check k="follow_social" label="Follows us on social media" />
          <Check k="see_social" label="Sees our posts on social media" />
          <Check k="att_wa_opt_out" label="Stop attendance WhatsApp alerts" />
          {initial && <Check k="active" label="Active" />}
        </div></Card>
      <div className="flex justify-end"><Button type="submit" loading={busy} className="px-8">Save student</Button></div>
    </form>
  );
}
