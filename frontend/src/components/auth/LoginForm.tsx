import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PasswordInput } from './PasswordInput';
import googleLogo from '../../assets/sso/google.png';
import { signInWithGoogleFirebase } from '../../config/firebase';

interface Props {
  initialEmail: string;
  onRegister: () => void;
  onForgotPassword?: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<Props> = ({ initialEmail, onRegister, onForgotPassword }) => {
  const { login, loginWithSocial } = useAuth();
  const { t, isVi } = useLanguage();
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
    if (!cleanEmail) next.email = t('auth.loginForm.errorMessages.emailRequired', isVi ? 'Vui lòng nhập địa chỉ email.' : 'Email address is required.');
    else if (!emailPattern.test(cleanEmail)) next.email = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
    if (!password) next.password = t('auth.loginForm.errorMessages.passwordRequired', isVi ? 'Vui lòng nhập mật khẩu.' : 'Password is required.');
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true);
    setErrors({});
    const result = await login(cleanEmail, password);
    if (!result.success) setErrors({ form: result.message || t('auth.loginForm.errorMessages.invalidCredentials', isVi ? 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.' : 'Login failed. Please check your credentials.') });
    setSubmitting(false);
  };

  const handleGoogleAuth = async () => {
    if (submitting || socialLoading) return;
    setSocialLoading('google');
    setErrors({});

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
        setErrors({ form: result.message || (isVi ? 'Đăng nhập Google qua Firebase thất bại.' : 'Firebase Google sign-in failed.') });
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setErrors({ form: err.message || (isVi ? 'Lỗi xác thực Google.' : 'Google authentication error.') });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {errors.form}
        </div>
      )}

      {/* Google Login Button */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={Boolean(socialLoading) || submitting}
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-600 disabled:opacity-50"
        >
          {socialLoading === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          ) : (
            <>
              <img src={googleLogo || '/assets/sso/google.png'} alt="Google" className="h-5 w-5 object-contain shrink-0" />
              <span>{t('auth.loginForm.signInWithGoogle', isVi ? 'Đăng nhập bằng Google' : 'Sign in with Google')}</span>
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
          <span className="bg-white px-3 text-slate-400">{t('auth.loginForm.orDivider', isVi ? 'Hoặc' : 'Or')}</span>
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
          {t('auth.loginForm.accountEmailLabel', isVi ? 'Email tài khoản' : 'Account email')}
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
            className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'}`}
          />
        </div>
        {errors.email && <p id="login-email-error" className="mt-1.5 text-xs text-red-600" role="alert">{errors.email}</p>}
      </div>

      {/* Password Input */}
      <div>
        <PasswordInput
          id="login-password"
          label={t('auth.loginForm.password', isVi ? 'Mật khẩu' : 'Password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          error={errors.password}
        />
        {onForgotPassword && (
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
            >
              {t('auth.loginForm.forgotPassword', isVi ? 'Quên mật khẩu?' : 'Forgot password?')}
            </button>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        type="submit"
        disabled={submitting || Boolean(socialLoading)}
        className="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('auth.loginForm.loggingIn', isVi ? 'Đang đăng nhập…' : 'Signing in...')}</>
        ) : (
          t('auth.loginForm.loginButton', isVi ? 'Đăng nhập' : 'Sign In')
        )}
      </button>
    </form>
  );
};
