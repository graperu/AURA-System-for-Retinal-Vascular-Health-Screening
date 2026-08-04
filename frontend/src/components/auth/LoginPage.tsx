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

  const selectMode = (next: Mode) => { setMode(next); if (next === 'register') setSuccess(''); };
  const returnToLogin = (email?: string, message?: string) => { if (email) setLoginEmail(email); if (message) setSuccess(message); setMode('login'); };

  return <main className="auth-page relative bg-gradient-to-br from-[#24376f] via-[#344a88] to-[#202f65]">
    <div className="auth-pink-shape pointer-events-none absolute" />
    <div className="auth-dots auth-dots-top pointer-events-none absolute" />
    <div className="auth-dots auth-dots-bottom pointer-events-none absolute" />
    <div className="auth-dots auth-dots-left-bottom pointer-events-none absolute" />
    <div className="auth-dots auth-dots-right-top pointer-events-none absolute" />
    <div className="auth-dots auth-dots-right-middle pointer-events-none absolute" />
    <div className="auth-container relative bg-white shadow-[0_36px_90px_rgba(7,13,45,0.42)]">
      <AuthHeroPanel />
      <section className="auth-form-panel bg-[#f3f6fd]">
        <div className="auth-form-card rounded-[22px] border border-blue-50 bg-white shadow-[0_15px_40px_rgba(30,58,138,0.11)]">
          <div className="grid grid-cols-2 border-b border-slate-200" role="tablist" aria-label="Chọn hình thức xác thực">
            {(['login', 'register'] as Mode[]).map(item => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => selectMode(item)} className={`relative min-h-12 px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${mode === item ? 'text-blue-700 after:absolute after:bottom-0 after:left-1/4 after:h-0.5 after:w-1/2 after:rounded-full after:bg-blue-600' : 'text-slate-400 hover:text-slate-700'}`}>{item === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>)}
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-blue-700">{mode === 'login' ? 'Chào mừng bạn trở lại' : 'Bắt đầu cùng AURA'}</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Truy cập không gian sàng lọc sức khỏe của bạn.' : 'Nhập thông tin để đăng ký tài khoản người dùng AURA.'}</p>
          </div>
          {success && mode === 'login' && <div className="mt-5 flex gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</div>}
          {mode === 'login' ? <LoginForm key={loginEmail} initialEmail={loginEmail} onRegister={() => selectMode('register')} /> : <RegisterForm onLogin={returnToLogin} />}
        </div>
      </section>
    </div>
  </main>;
};
