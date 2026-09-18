import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, ShieldCheck, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PasswordInput } from './PasswordInput';

interface Props {
  initialEmail?: string;
  onBackToLogin: (email?: string, message?: string) => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export const ForgotPasswordForm: React.FC<Props> = ({ initialEmail = '', onBackToLogin }) => {
  const { forgotPassword, resetPassword } = useAuth();
  const { t, isVi } = useLanguage();

  const [step, setStep] = useState<'email' | 'otp_reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request OTP for password reset
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim();
    const next: Record<string, string> = {};
    if (!cleanEmail) {
      next.email = t('auth.loginForm.errorMessages.emailRequired', isVi ? 'Vui lòng nhập địa chỉ email.' : 'Email address is required.');
    } else if (!emailPattern.test(cleanEmail)) {
      next.email = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const result = await forgotPassword(cleanEmail);
    setSubmitting(false);

    if (result.success) {
      setStep('otp_reset');
      setCooldown(60);
      setOtp('');
    } else {
      setErrors({
        form: result.message || (isVi ? 'Không thể gửi mã OTP đặt lại mật khẩu. Vui lòng thử lại.' : 'Could not send password reset OTP. Please try again.')
      });
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    setErrors({});
    const result = await forgotPassword(email.trim());
    setSubmitting(false);
    if (result.success) {
      setCooldown(60);
      setOtp('');
    } else {
      setErrors({
        form: result.message || (isVi ? 'Gửi lại mã OTP thất bại.' : 'Resending OTP failed.')
      });
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanOtp = otp.trim();
    const next: Record<string, string> = {};

    if (!cleanOtp) {
      next.otp = isVi ? 'Vui lòng nhập mã OTP.' : 'Please enter the OTP code.';
    } else if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      next.otp = isVi ? 'Mã OTP phải gồm đúng 6 chữ số.' : 'OTP code must be exactly 6 digits.';
    }

    if (!newPassword) {
      next.newPassword = isVi ? 'Vui lòng nhập mật khẩu mới.' : 'Please enter your new password.';
    } else if (!passwordPattern.test(newPassword)) {
      next.newPassword = isVi ? 'Mật khẩu chưa đáp ứng đầy đủ yêu cầu bảo mật.' : 'Password does not meet security requirements.';
    }

    if (!confirmPassword) {
      next.confirmPassword = isVi ? 'Vui lòng xác nhận lại mật khẩu mới.' : 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.';
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    setErrors({});
    const result = await resetPassword({
      email: email.trim(),
      otp: cleanOtp,
      newPassword: newPassword
    });
    setSubmitting(false);

    if (result.success) {
      onBackToLogin(email.trim(), isVi ? 'Đặt lại mật khẩu thành công! Bạn đã có thể đăng nhập.' : 'Password reset successfully! You can now log in.');
    } else {
      setErrors({
        form: result.message || (isVi ? 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.' : 'Password reset failed. Please check your OTP code.')
      });
    }
  };

  // View: Step 2 - Verify OTP & Set New Password
  if (step === 'otp_reset') {
    return (
      <form onSubmit={handleResetPassword} noValidate className="mt-4 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <KeyRound className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {isVi ? 'Xác thực mã & Thiết lập mật khẩu mới' : 'Verify Code & Set New Password'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {isVi ? 'Mã xác thực 6 chữ số đã được gửi tới:' : 'A 6-digit verification code was sent to:'}
            <br />
            <span className="font-semibold text-slate-800">{email}</span>
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-900 text-center leading-relaxed">
          {isVi
            ? '💡 Vui lòng kiểm tra hộp thư email (bao gồm cả thư mục Spam/Rác) để lấy mã OTP 6 chữ số.'
            : '💡 Please check your email inbox (including Spam folder) for the 6-digit verification code.'}
        </div>

        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-center" role="alert">
            {errors.form}
          </div>
        )}

        {/* OTP Input */}
        <div>
          <label htmlFor="reset-otp" className="mb-1.5 block text-center text-xs font-medium text-slate-600">
            {isVi ? 'Nhập mã xác thực 6 chữ số' : 'Enter 6-digit verification code'}
          </label>
          <input
            id="reset-otp"
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
            className={`h-[54px] w-full text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-xl border bg-slate-50/50 text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 ${
              errors.otp
                ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'
            }`}
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
              {isVi ? 'Gửi lại mã OTP' : 'Resend OTP Code'}
            </button>
          )}
        </div>

        {/* New Password */}
        <div>
          <PasswordInput
            id="reset-new-password"
            label={isVi ? 'Mật khẩu mới' : 'New Password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            error={errors.newPassword}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {isVi
              ? 'Mật khẩu 12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
              : 'Password must be 12–128 characters, with uppercase, lowercase, numbers, and special characters.'}
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <PasswordInput
            id="reset-confirm-password"
            label={isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>

        {/* Submit Reset Button */}
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {isVi ? 'Đang cập nhật mật khẩu…' : 'Updating password...'}
            </>
          ) : (
            isVi ? 'Đặt lại mật khẩu & Đăng nhập' : 'Reset Password & Sign In'
          )}
        </button>

        {/* Back button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setStep('email')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {isVi ? 'Đổi email khác' : 'Change email'}
          </button>
        </div>
      </form>
    );
  }

  // View: Step 1 - Enter Email
  return (
    <form onSubmit={handleRequestOtp} noValidate className="mt-5 space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {errors.form}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600 leading-relaxed">
        {isVi
          ? 'Nhập địa chỉ email liên kết với tài khoản của bạn. Hệ thống sẽ gửi một mã OTP 6 chữ số để bạn thiết lập lại mật khẩu an toàn.'
          : 'Enter the email address associated with your account. The system will send a 6-digit OTP code to securely reset your password.'}
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-slate-700">
          {isVi ? 'Email tài khoản' : 'Account Email'}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="name@hospital.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'forgot-email-error' : undefined}
            className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-brand-600 focus:ring-brand-500/20'
            }`}
          />
        </div>
        {errors.email && <p id="forgot-email-error" className="mt-1.5 text-xs text-red-600" role="alert">{errors.email}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {isVi ? 'Đang gửi mã OTP…' : 'Sending OTP code...'}
          </>
        ) : (
          isVi ? 'Gửi mã OTP đặt lại mật khẩu' : 'Send Reset Code'
        )}
      </button>

      {/* Back to login */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => onBackToLogin(email.trim())}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isVi ? 'Quay lại Đăng nhập' : 'Back to Sign In'}
        </button>
      </div>
    </form>
  );
};
