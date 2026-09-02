import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PasswordInput } from './PasswordInput';

interface Props { initialEmail: string; onRegister: () => void }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<Props> = ({ initialEmail, onRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const cleanEmail = email.trim();
    const next: Record<string, string> = {};
    if (!cleanEmail) next.email = 'Vui lòng nhập email.';
    else if (!emailPattern.test(cleanEmail)) next.email = 'Email không đúng định dạng.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true); setErrors({});
    const result = await login(cleanEmail, password);
    if (!result.success) {
      const fieldErrors = Object.fromEntries((result.details || []).map(item => [item.field, item.message]));
      setErrors({ ...fieldErrors, form: result.message || 'Đăng nhập không thành công. Vui lòng thử lại.' });
    }
    setSubmitting(false);
  };

  return <form onSubmit={submit} noValidate className="mt-6 space-y-4">
    {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.form}</div>}
    <div>
      <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
      <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm outline-none focus:ring-4 ${errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'}`} /></div>
      {errors.email && <p id="login-email-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.email}</p>}
    </div>
    <PasswordInput id="login-password" label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" error={errors.password} />
    <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-65">{submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Đang đăng nhập…</> : <>Đăng nhập<ArrowRight className="h-4 w-4" /></>}</button>
    <p className="text-center text-sm text-slate-500">Chưa có tài khoản? <button type="button" onClick={onRegister} className="font-bold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Đăng ký</button></p>
  </form>;
};
