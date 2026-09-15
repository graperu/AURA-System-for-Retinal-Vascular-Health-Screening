import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PasswordInput } from './PasswordInput';
import googleLogo from '../../assets/sso/google.png';
import { isFirebaseConfigured, signInWithGoogleFirebase, sendMagicLinkFirebase } from '../../config/firebase';
import { GoogleAccountModal, type GoogleAuthPayload } from './GoogleAccountModal';

interface Props {
  initialEmail: string;
  onRegister: () => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<Props> = ({ initialEmail, onRegister }) => {
  const { login, loginWithSocial } = useAuth();
  const { t, isVi } = useLanguage();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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
    setErrors({});

    // 1. If Firebase is fully configured, try live popup first
    if (isFirebaseConfigured()) {
      setSocialLoading('google');
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
        return;
      } catch (err: any) {
        if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setIsGoogleModalOpen(true);
        }
        return;
      } finally {
        setSocialLoading(null);
      }
    }

    // 2. Open Google Account Chooser modal (supports both verified presets and custom Google accounts)
    setIsGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (payload: GoogleAuthPayload) => {
    setSocialLoading('google');
    try {
      const result = await loginWithSocial(payload);
      if (!result.success) {
        return { success: false, message: result.message || (isVi ? 'Đăng nhập Google thất bại.' : 'Google sign-in failed.') };
      }
      return { success: true };
    } finally {
      setSocialLoading(null);
    }
  };

  const handleMagicLink = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrors({ email: isVi ? 'Vui lòng nhập địa chỉ email để gửi link.' : 'Please enter your email address to send sign-in link.' });
      return;
    }
    if (!emailPattern.test(cleanEmail)) {
      setErrors({ email: isVi ? 'Email không đúng định dạng.' : 'Invalid email format.' });
      return;
    }
    
    if (submitting || socialLoading) return;
    setSocialLoading('magiclink');
    setErrors({});
    
    if (isFirebaseConfigured()) {
      try {
        const actionCodeSettings = {
          url: window.location.origin + '/verify-email', // URL chuyển hướng sau khi click
          handleCodeInApp: true,
        };
        await sendMagicLinkFirebase(cleanEmail, actionCodeSettings);
        setMagicLinkSent(true);
        setErrors({ form: t('auth.loginForm.magicLinkSent', isVi ? 'Đã gửi liên kết đăng nhập. Vui lòng kiểm tra email của bạn.' : 'Sign-in link sent. Please check your email inbox.') });
      } catch (err: any) {
        setErrors({ form: err.message || (isVi ? 'Lỗi gửi liên kết đăng nhập.' : 'Error sending sign-in link.') });
      } finally {
        setSocialLoading(null);
      }
    } else {
      setErrors({ form: isVi ? 'Đăng nhập Firebase chưa được cấu hình.' : 'Firebase authentication is not configured.' });
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

        <button
          type="button"
          onClick={handleMagicLink}
          disabled={Boolean(socialLoading) || submitting || magicLinkSent}
          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-600 disabled:opacity-50"
        >
          {socialLoading === 'magiclink' ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          ) : (
            <>
              <Mail className="h-5 w-5 text-slate-500 shrink-0" />
              <span>{magicLinkSent ? (isVi ? 'Đã gửi Magic Link' : 'Magic Link Sent') : t('auth.loginForm.signInWithMagicLink', isVi ? 'Đăng nhập qua Link Email' : 'Sign in via Email Link')}</span>
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
      <PasswordInput
        id="login-password"
        label={t('auth.loginForm.password', isVi ? 'Mật khẩu' : 'Password')}
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
        error={errors.password}
      />

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

      {/* Google Identity Chooser Modal */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </form>
  );
};
