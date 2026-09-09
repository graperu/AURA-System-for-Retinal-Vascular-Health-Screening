import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isMagicLink, signInWithMagicLinkFirebase } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmailLink: React.FC = () => {
  const [status, setStatus] = useState<string>('Đang xác thực liên kết...');
  const [error, setError] = useState<string | null>(null);
  const { loginWithSocial } = useAuth();

  useEffect(() => {
    const verifyLink = async () => {
      if (!isMagicLink(window.location.href)) {
        setError('Liên kết đăng nhập không hợp lệ hoặc đã hết hạn.');
        return;
      }

      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Vui lòng nhập lại email của bạn để xác nhận:');
      }

      if (!email) {
        setError('Cần cung cấp email để tiếp tục.');
        return;
      }

      try {
        const { idToken, email: fbEmail, fullName, picture } = await signInWithMagicLinkFirebase(email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        
        setStatus('Đang đăng nhập vào hệ thống...');
        const result = await loginWithSocial({
          provider: 'magic-link', // Backend can handle this or just treat it like google if configured
          idToken,
          email: fbEmail,
          fullName,
          picture,
        });

        if (result.success) {
          window.location.href = '/'; // Redirect to home
        } else {
          setError(result.message || 'Đăng nhập vào hệ thống thất bại.');
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi khi xác thực liên kết đăng nhập.');
      }
    };

    verifyLink();
  }, [loginWithSocial]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {error ? (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-red-600 font-bold text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đăng nhập thất bại</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Quay lại trang đăng nhập
            </button>
          </div>
        ) : (
          <div>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Xin vui lòng chờ</h2>
            <p className="text-slate-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};
