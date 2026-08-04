import React, { useState } from 'react';
import { Loader2, Mail, UserRound, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PasswordInput } from './PasswordInput';

interface Props { onLogin: (email?: string, message?: string) => void }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export const RegisterForm: React.FC<Props> = ({ onLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (submitting) return;
    const cleanEmail = email.trim(); const next: Record<string, string> = {};
    if (fullName.trim().length > 150) next.fullName = 'Họ và tên không được vượt quá 150 ký tự.';
    if (!cleanEmail) next.email = 'Vui lòng nhập email.'; else if (!emailPattern.test(cleanEmail)) next.email = 'Email không đúng định dạng.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.'; else if (!passwordPattern.test(password)) next.password = 'Mật khẩu chưa đáp ứng đầy đủ yêu cầu bên dưới.';
    if (!confirm) next.confirm = 'Vui lòng xác nhận mật khẩu.'; else if (confirm !== password) next.confirm = 'Mật khẩu xác nhận không khớp.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true); setErrors({});
    const result = await register({ fullName, email: cleanEmail, password });
    if (result.success) onLogin(cleanEmail, result.message || 'Đăng ký thành công. Bạn có thể đăng nhập ngay.');
    else setErrors({ ...Object.fromEntries((result.details || []).map(item => [item.field, item.message])), form: result.message || 'Đăng ký không thành công. Vui lòng thử lại.' });
    setSubmitting(false);
  };

  const inputClass = (invalid: boolean) => `h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm outline-none focus:ring-4 ${invalid ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'}`;
  return <form onSubmit={submit} noValidate className="mt-6 space-y-4">
    {errors.form && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errors.form}</div>}
    <div><label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-slate-700">Họ và tên <span className="font-normal text-slate-400">(không bắt buộc)</span></label><div className="relative"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="register-name" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" className={inputClass(Boolean(errors.fullName))} /></div>{errors.fullName && <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.fullName}</p>}</div>
    <div><label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className={inputClass(Boolean(errors.email))} /></div>{errors.email && <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.email}</p>}</div>
    <PasswordInput id="register-password" label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" error={errors.password} />
    <p className="-mt-2 text-xs leading-5 text-slate-500">Từ 12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
    <PasswordInput id="register-confirm" label="Xác nhận mật khẩu" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" error={errors.confirm} />
    <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-65">{submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Đang tạo tài khoản…</> : <><UserPlus className="h-4 w-4" />Tạo tài khoản</>}</button>
    <p className="text-center text-sm text-slate-500">Đã có tài khoản? <button type="button" onClick={() => onLogin()} className="font-bold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Đăng nhập</button></p>
  </form>;
};
