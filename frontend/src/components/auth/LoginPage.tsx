import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthHeroPanel } from './AuthHeroPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useLanguage } from '../../context/LanguageContext';

type Mode = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const { t, isVi } = useLanguage();
  const [mode, setMode] = useState<Mode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [success, setSuccess] = useState('');

  const selectMode = (next: Mode) => {
    setMode(next);
    if (next !== 'login') setSuccess('');
  };

  const returnToLogin = (email?: string, message?: string) => {
    if (email) setLoginEmail(email);
    if (message) setSuccess(message);
    setMode('login');
  };

  return (
    <main className="auth-page relative">
      <div className="auth-container relative bg-white shadow-[0_20px_60px_rgba(7,13,45,0.3)]">
        <AuthHeroPanel />
        <section className="auth-form-panel">
          <div className="auth-form-card w-full max-w-[500px] rounded-[26px] border border-slate-100/80 bg-white p-6 sm:p-8 shadow-sm">
            {/* Header Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200" role="tablist" aria-label={t('login.tabLogin', 'Chọn hình thức xác thực')}>
              {(['login', 'register'] as ('login' | 'register')[]).map(item => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={mode === item}
                  onClick={() => selectMode(item)}
                  className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${
                    (mode === item || (item === 'login' && mode === 'forgot'))
                      ? 'text-brand-700 after:absolute after:bottom-0 after:left-1/4 after:h-0.5 after:w-1/2 after:rounded-full after:bg-brand-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item === 'login' ? t('login.tabLogin', 'Đăng nhập') : t('login.tabRegister', 'Đăng ký')}
                </button>
              ))}
            </div>

            {/* Title & Subtitle */}
            <div className="mt-5">
              <h1 className="text-[30px] font-bold tracking-tight text-slate-900 leading-tight">
                {mode === 'login'
                  ? t('login.titleLogin', 'Đăng nhập')
                  : mode === 'register'
                  ? t('login.titleRegister', 'Đăng ký')
                  : (isVi ? 'Quên mật khẩu' : 'Forgot Password')}
              </h1>
              <p className="mt-1 text-[15px] text-slate-500">
                {mode === 'login'
                  ? t('login.subtitleLogin', 'Truy cập hệ thống AURA')
                  : mode === 'register'
                  ? t('login.subtitleRegister', 'Tạo tài khoản để sử dụng hệ thống AURA')
                  : (isVi ? 'Khôi phục mật khẩu tài khoản AURA của bạn' : 'Recover access to your AURA account')}
              </p>
            </div>

            {success && mode === 'login' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            {mode === 'login' && (
              <LoginForm
                key={loginEmail}
                initialEmail={loginEmail}
                onRegister={() => selectMode('register')}
                onForgotPassword={() => selectMode('forgot')}
              />
            )}

            {mode === 'register' && (
              <RegisterForm onLogin={returnToLogin} />
            )}

            {mode === 'forgot' && (
              <ForgotPasswordForm
                initialEmail={loginEmail}
                onBackToLogin={returnToLogin}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
