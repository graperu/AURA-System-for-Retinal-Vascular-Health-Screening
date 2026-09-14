import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isMagicLink, signInWithMagicLinkFirebase } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const VerifyEmailLink: React.FC = () => {
  const { t, isVi } = useLanguage();
  const [status, setStatus] = useState<string>(() =>
    t('auth.verifyEmailLink.verifyingStatus', isVi ? 'Đang xác thực liên kết...' : 'Verifying sign-in link...')
  );
  const [error, setError] = useState<string | null>(null);
  const { loginWithSocial } = useAuth();

  useEffect(() => {
    const verifyLink = async () => {
      if (!isMagicLink(window.location.href)) {
        setError(t('auth.verifyEmailLink.invalidLink', isVi ? 'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn.' : 'Invalid or expired verification link.'));
        return;
      }

      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt(isVi ? 'Vui lòng nhập lại email của bạn để xác nhận:' : 'Please enter your email again to confirm:');
      }

      if (!email) {
        setError(t('auth.verifyEmailLink.emailRequiredError', isVi ? 'Cần cung cấp email để tiếp tục.' : 'Email is required to proceed.'));
        return;
      }

      try {
        const { idToken, email: fbEmail, fullName, picture } = await signInWithMagicLinkFirebase(email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        
        setStatus(t('auth.verifyEmailLink.signingInStatus', isVi ? 'Đang đăng nhập vào hệ thống...' : 'Signing in to system...'));
        const result = await loginWithSocial({
          provider: 'magic-link',
          idToken,
          email: fbEmail,
          fullName,
          picture,
        });

        if (result.success) {
          window.location.href = '/'; // Redirect to home
        } else {
          setError(result.message || t('auth.verifyEmailLink.loginFailedError', isVi ? 'Đăng nhập vào hệ thống thất bại.' : 'System sign-in failed.'));
        }
      } catch (err: any) {
        setError(err.message || (isVi ? 'Lỗi khi xác thực liên kết đăng nhập.' : 'Error verifying sign-in link.'));
      }
    };

    verifyLink();
  }, [loginWithSocial, t, isVi]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {error ? (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-red-600 font-bold text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {t('auth.verifyEmailLink.failedTitle', isVi ? 'Đăng nhập thất bại' : 'Sign-In Failed')}
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              {t('auth.verifyEmailLink.returnToLogin', isVi ? 'Quay lại trang đăng nhập' : 'Return to sign-in')}
            </button>
          </div>
        ) : (
          <div>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {t('auth.verifyEmailLink.verifyingTitle', isVi ? 'Xin vui lòng chờ' : 'Please Wait')}
            </h2>
            <p className="text-slate-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};
