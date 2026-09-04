import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AuthHeroPanel } from './AuthHeroPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type Mode = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [success, setSuccess] = useState('');

  const selectMode = (next: Mode) => {
    setMode(next);
    if (next === 'register') setSuccess('');
  };

  const returnToLogin = (email?: string, message?: string) => {
    if (email) setLoginEmail(email);
    if (message) setSuccess(message);
    setMode('login');
  };

  return (
    <main className="auth-page relative bg-gradient-to-br from-[#24376f] via-[#344a88] to-[#202f65]">
      <div className="auth-pink-shape pointer-events-none absolute" />
      <div className="auth-dots auth-dots-top pointer-events-none absolute" />
      <div className="auth-dots auth-dots-bottom pointer-events-none absolute" />
      <div className="auth-dots auth-dots-left-bottom pointer-events-none absolute" />
      <div className="auth-dots auth-dots-right-top pointer-events-none absolute" />
      <div className="auth-dots auth-dots-right-middle pointer-events-none absolute" />
      
      <div className="auth-container relative bg-white shadow-[0_20px_60px_rgba(7,13,45,0.3)]">
        <AuthHeroPanel />
        <section className="auth-form-panel bg-[#f4f7fc]">
          <div className="auth-form-card w-full max-w-[500px] rounded-[26px] border border-slate-100/80 bg-white p-6 sm:p-8 shadow-sm">
            {/* Header Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200" role="tablist" aria-label="Chọn hình thức xác thực">
              {(['login', 'register'] as Mode[]).map(item => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={mode === item}
                  onClick={() => selectMode(item)}
                  className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                    mode === item
                      ? 'text-blue-700 after:absolute after:bottom-0 after:left-1/4 after:h-0.5 after:w-1/2 after:rounded-full after:bg-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {/* Title & Subtitle */}
            <div className="mt-5">
              <h1 className="text-[30px] font-bold tracking-tight text-slate-900 leading-tight">
                {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </h1>
              <p className="mt-1 text-[15px] text-slate-500">
                {mode === 'login' ? 'Truy cập hệ thống AURA' : 'Tạo tài khoản để sử dụng hệ thống AURA'}
              </p>
            </div>

            {success && mode === 'login' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            {mode === 'login' ? (
              <LoginForm key={loginEmail} initialEmail={loginEmail} onRegister={() => selectMode('register')} />
            ) : (
              <RegisterForm onLogin={returnToLogin} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
