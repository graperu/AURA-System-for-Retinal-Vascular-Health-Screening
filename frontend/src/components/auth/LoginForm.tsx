import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PasswordInput } from './PasswordInput';
import googleLogo from '../../assets/sso/google.png';
import { isFirebaseConfigured, signInWithGoogleFirebase } from '../../config/firebase';

interface Props {
  initialEmail: string;
  onRegister: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<Props> = ({ initialEmail, onRegister }) => {
  const { login, loginWithSocial } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || socialLoading) return;
    const cleanEmail = email.trim();
    const next: Record<string, string> = {};
    if (!cleanEmail) next.email = 'Vui lòng nhập địa chỉ email.';
    else if (!emailPattern.test(cleanEmail)) next.email = 'Email không đúng định dạng.';
    if (!password) next.password = 'Vui lòng nhập mật khẩu.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true);
    setErrors({});
    const result = await login(cleanEmail, password);
    if (!result.success) setErrors({ form: result.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.' });
    setSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    if (submitting || socialLoading) return;
    setSocialLoading('google');
    setErrors({});

    // 1. Firebase Google Authentication Flow
    if (isFirebaseConfigured()) {
      try {
        const { idToken, email: fbEmail, fullName: fbName, picture } = await signInWithGoogleFirebase();
        const result = await loginWithSocial({
          provider: 'google',
          idToken,
          email: fbEmail,
          fullName: fbName,
          picture,
        });
        if (!result.success) {
          setErrors({ form: result.message || 'Đăng nhập Google qua Firebase thất bại.' });
        }
        return;
      } catch (err: any) {
        if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setErrors({ form: err.message || 'Lỗi xác thực Firebase Google.' });
        }
        return;
      } finally {
        setSocialLoading(null);
      }
    }

    setErrors({ form: 'Đăng nhập Google chưa được cấu hình. Vui lòng đăng nhập bằng email hoặc liên hệ quản trị viên.' });
    setSocialLoading(null);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {errors.form}
        </div>
      )}

      {/* Google Login Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={Boolean(socialLoading) || submitting}
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50"
        >
          {socialLoading === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : (
            <>
              <img src={googleLogo} alt="Google" className="h-5 w-5 object-contain shrink-0" />
              <span>Đăng nhập bằng Google</span>
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-3.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs font-medium">
          <span className="bg-white px-3 text-slate-400">Hoặc</span>
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
          Email tài khoản
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@hospital.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:ring-4 ${errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'}`}
          />
        </div>
        {errors.email && <p id="login-email-error" className="mt-1.5 text-xs text-red-600" role="alert">{errors.email}</p>}
      </div>

      {/* Password Input */}
      <PasswordInput
        id="login-password"
        label="Mật khẩu"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
        error={errors.password}
      />

      {/* CTA Button */}
      <button
        type="submit"
        disabled={submitting || Boolean(socialLoading)}
        className="flex h-[52px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin" />Đang đăng nhập…</>
        ) : (
          'Đăng nhập'
        )}
      </button>

    </form>
  );
};
