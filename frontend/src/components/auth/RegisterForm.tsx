import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PasswordInput } from './PasswordInput';
import googleLogo from '../../assets/sso/google.png';
import { isFirebaseConfigured, signInWithGoogleFirebase } from '../../config/firebase';

interface Props { onLogin: (email?: string, message?: string) => void }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export const RegisterForm: React.FC<Props> = ({ onLogin }) => {
  const { sendOtp, verifyOtpAndRegister, loginWithSocial } = useAuth();
  const { t, isVi } = useLanguage();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Submit Registration Form -> Sends OTP to email
  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || socialLoading) return;
    const cleanEmail = email.trim();
    const next: Record<string, string> = {};
    if (fullName.trim().length > 150) next.fullName = isVi ? 'Họ và tên không được vượt quá 150 ký tự.' : 'Full name cannot exceed 150 characters.';
    if (!cleanEmail) next.email = t('auth.loginForm.errorMessages.emailRequired', isVi ? 'Vui lòng nhập địa chỉ email.' : 'Email address is required.');
    else if (!emailPattern.test(cleanEmail)) next.email = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
    if (!password) next.password = t('auth.loginForm.errorMessages.passwordRequired', isVi ? 'Vui lòng nhập mật khẩu.' : 'Password is required.');
    else if (!passwordPattern.test(password)) next.password = isVi ? 'Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.' : 'Password does not meet security requirements.';
    if (!confirm) next.confirm = isVi ? 'Vui lòng xác nhận lại mật khẩu.' : 'Please confirm your password.';
    else if (confirm !== password) next.confirm = isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.';
    if (Object.keys(next).length) { setErrors(next); return; }

    setSubmitting(true);
    setErrors({});
    const result = await sendOtp({ email: cleanEmail, fullName: fullName.trim() || undefined, type: 'REGISTER' });
    setSubmitting(false);

    if (result.success) {
      setStep('otp');
      setCooldown(60);
      setOtp('');
    } else {
      setErrors({ form: result.message || (isVi ? 'Không thể gửi mã OTP. Vui lòng thử lại.' : 'Could not send OTP code. Please try again.') });
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    setErrors({});
    const result = await sendOtp({ email: email.trim(), fullName: fullName.trim() || undefined, type: 'REGISTER' });
    setSubmitting(false);
    if (result.success) {
      setCooldown(60);
      setOtp('');
    } else {
      setErrors({ form: result.message || (isVi ? 'Gửi lại mã OTP thất bại.' : 'Resending OTP failed.') });
    }
  };

  // Step 3: Verify OTP & Activate Account
  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrors({ otp: isVi ? 'Vui lòng nhập mã OTP.' : 'Please enter the OTP code.' });
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrors({ otp: isVi ? 'Mã OTP phải gồm đúng 6 chữ số.' : 'OTP code must be exactly 6 digits.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    const result = await verifyOtpAndRegister({
      email: email.trim(),
      otp: cleanOtp,
      fullName: fullName.trim() || undefined,
      password: password,
    });
    setSubmitting(false);

    if (result.success) {
      onLogin(email.trim(), isVi ? 'Đăng ký và xác thực tài khoản thành công!' : 'Account registered and verified successfully!');
    } else {
      setErrors({ otp: result.message || (isVi ? 'Xác thực mã OTP thất bại. Vui lòng kiểm tra lại.' : 'OTP verification failed. Please check again.') });
    }
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
        setErrors({ form: result.message || (isVi ? 'Đăng ký Google qua Firebase thất bại.' : 'Google sign-up failed.') });
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setErrors({ form: err.message || (isVi ? 'Lỗi xác thực Google.' : 'Google authentication error.') });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // OTP Verification Screen (Clean, NO yellow test box, NO autofill)
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} noValidate className="mt-4 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {t('auth.registerForm.verifyOtpTitle', isVi ? 'Xác thực mã OTP' : 'Verify OTP Code')}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t('auth.registerForm.otpSentTo', isVi ? 'Mã OTP gồm 6 chữ số đã được gửi tới:' : 'A 6-digit OTP code was sent to:')}
            <br />
            <span className="font-semibold text-slate-800">{email}</span>
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-900 text-center leading-relaxed">
          {isVi
            ? '💡 Vui lòng kiểm tra email của bạn (hoặc log hệ thống backend) để lấy mã xác thực 6 chữ số.'
            : '💡 Please check your email inbox (or backend logs) for the 6-digit verification code.'}
        </div>

        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-center" role="alert">
            {errors.form}
          </div>
        )}

        <div>
          <label htmlFor="register-otp" className="mb-1.5 block text-center text-xs font-medium text-slate-600">
            {t('auth.registerForm.enterOtpLabel', isVi ? 'Nhập mã xác thực 6 chữ số' : 'Enter 6-digit verification code')}
          </label>
          <input
            id="register-otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            placeholder="••••••"
            value={otp}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(val);
              if (errors.otp) setErrors({});
            }}
            className={`h-[54px] w-full text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-xl border bg-slate-50/50 text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 ${errors.otp ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'}`}
          />
          {errors.otp && <p className="mt-1.5 text-center text-xs text-red-600" role="alert">{errors.otp}</p>}
        </div>

        {/* Resend OTP */}
        <div className="text-center pt-1">
          {cooldown > 0 ? (
            <span className="text-xs text-slate-400">
              {isVi ? `Gửi lại mã sau (${cooldown}s)` : `Resend code in (${cooldown}s)`}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={submitting}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              {t('auth.registerForm.resendOtpBtn', isVi ? 'Gửi lại mã OTP' : 'Resend OTP Code')}
            </button>
          )}
        </div>

        {/* CTA Verify Button */}
        <button
          type="submit"
          disabled={submitting || otp.length < 6}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand-600 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('auth.registerForm.verifyingOtp', isVi ? 'Đang xác thực…' : 'Verifying...')}</>
          ) : (
            t('auth.registerForm.verifyAndCreateBtn', isVi ? 'Xác thực & Tạo tài khoản' : 'Verify & Create Account')
          )}
        </button>

        {/* Back Button */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => { setStep('form'); setErrors({}); setOtp(''); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t('auth.registerForm.changeEmailBtn', isVi ? 'Thay đổi thông tin email' : 'Change email address')}
          </button>
        </div>
      </form>
    );
  }

  // Initial Registration Form
  return (
    <form onSubmit={handleRequestOtp} noValidate className="mt-5 space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {errors.form}
        </div>
      )}

      {/* Google Sign-up Button */}
      <div>
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
              <span>{t('auth.registerForm.signUpWithGoogle', isVi ? 'Đăng ký bằng Google' : 'Sign up with Google')}</span>
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
          <span className="bg-white px-3 text-slate-400">{t('auth.registerForm.orDivider', isVi ? 'Hoặc' : 'Or')}</span>
        </div>
      </div>

      {/* Name Input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="register-name" className="text-sm font-medium text-slate-700">
            {t('auth.registerForm.fullName', isVi ? 'Họ và tên' : 'Full Name')}
          </label>
          <span className="text-xs text-slate-400">{t('auth.registerForm.optionalLabel', isVi ? 'Tùy chọn' : 'Optional')}</span>
        </div>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="register-name"
            placeholder={isVi ? "Nguyễn Văn A" : "John Doe"}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoComplete="name"
            className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${errors.fullName ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'}`}
          />
        </div>
        {errors.fullName && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.fullName}</p>}
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-700">
          {t('auth.registerForm.email', isVi ? 'Email' : 'Email Address')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="register-email"
            type="email"
            placeholder="name@hospital.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'}`}
          />
        </div>
        {errors.email && <p id="register-email-error" className="mt-1.5 text-xs text-red-600" role="alert">{errors.email}</p>}
      </div>

      {/* Password Input */}
      <PasswordInput
        id="register-password"
        label={t('auth.registerForm.password', isVi ? 'Mật khẩu' : 'Password')}
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
        error={errors.password}
      />
      <p className="-mt-2 text-xs text-slate-400">
        {t('auth.registerForm.passwordRequirementsHint', isVi ? 'Mật khẩu 12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' : 'Password must be 12–128 characters, with uppercase, lowercase, numbers, and special characters.')}
      </p>

      {/* Confirm Password Input */}
      <PasswordInput
        id="register-confirm"
        label={t('auth.registerForm.confirmPassword', isVi ? 'Xác nhận mật khẩu' : 'Confirm Password')}
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        autoComplete="new-password"
        error={errors.confirm}
      />

      {/* CTA Button */}
      <button
        type="submit"
        disabled={submitting || Boolean(socialLoading)}
        className="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand-600 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" />{t('auth.registerForm.sendingOtp', isVi ? 'Đang gửi mã OTP…' : 'Sending OTP code...')}</>
        ) : (
          t('auth.registerForm.continueBtn', isVi ? 'Tiếp tục' : 'Continue')
        )}
      </button>
    </form>
  );
};
