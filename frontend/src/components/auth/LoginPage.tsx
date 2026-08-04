import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { MOCK_USERS, UserSession } from '../../types/auth';
import { UserRole } from '../../types/cds';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

const roles = {
  patient: { label: 'Bệnh nhân', description: 'Xem kết quả và theo dõi sức khỏe', icon: UserCheck },
  doctor: { label: 'Bác sĩ', description: 'Phân tích ảnh và duyệt chẩn đoán', icon: Stethoscope },
  clinic: { label: 'Phòng khám', description: 'Quản lý các đợt sàng lọc', icon: Building2 },
  admin: { label: 'Quản trị', description: 'Vận hành và kiểm soát hệ thống', icon: ShieldAlert },
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState(MOCK_USERS.patient.email);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const selected = roles[selectedRole];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    if (showRegisterModal) closeButtonRef.current?.focus();
  }, [showRegisterModal]);

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(MOCK_USERS[role].email);
    setPassword('password123');
  };

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();
    onLoginSuccess(MOCK_USERS[selectedRole]);
  };

  const submitRegistration = (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterSuccess(true);
    window.setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterModal(false);
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-[#f4f8f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#083c4a] p-10 text-white lg:flex lg:flex-col lg:justify-between" aria-label="Giới thiệu AURA">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-800 shadow-lg">
                <Eye className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">AURA Health</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Retinal screening</p>
              </div>
            </div>

            <div className="mt-20 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                <HeartPulse className="h-4 w-4" /> Sàng lọc sớm, chăm sóc tốt hơn
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.14] tracking-tight">
                Hiểu rõ sức khỏe mạch máu qua một lần chụp võng mạc.
              </h1>
              <p className="mt-5 text-base leading-7 text-cyan-50/80">
                AURA giúp bệnh nhân và nhân viên y tế theo dõi kết quả, đánh giá nguy cơ và phối hợp chăm sóc trên một giao diện rõ ràng.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-sm font-bold">Dữ liệu được bảo vệ</p>
              <p className="mt-1 text-xs leading-5 text-cyan-100/70">Mã hóa và phân quyền theo vai trò.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <Stethoscope className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-bold">Có bác sĩ thẩm định</p>
              <p className="mt-1 text-xs leading-5 text-cyan-100/70">AI hỗ trợ, không thay thế chẩn đoán.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[560px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-800 text-white"><Eye className="h-6 w-6" /></div>
              <div><p className="text-lg font-extrabold text-slate-900">AURA Health</p><p className="text-xs text-slate-500">Sàng lọc sức khỏe võng mạc</p></div>
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-700">Chào mừng bạn trở lại</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Đăng nhập vào AURA</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Chọn đúng vai trò để vào không gian làm việc phù hợp.</p>
            </div>

            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-bold text-slate-800">Bạn đang sử dụng AURA với vai trò</legend>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(roles) as UserRole[]).map((role) => {
                  const roleItem = roles[role];
                  const RoleIcon = roleItem.icon;
                  const active = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => selectRole(role)}
                      aria-pressed={active}
                      className={`relative min-h-[78px] rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 ${active ? 'border-cyan-700 bg-cyan-50 shadow-[0_8px_20px_rgba(14,116,144,0.10)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {active && <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-700 text-white"><Check className="h-3 w-3" /></span>}
                      <RoleIcon className={`h-5 w-5 ${active ? 'text-cyan-700' : 'text-slate-500'}`} />
                      <p className="mt-2 text-sm font-bold text-slate-800">{roleItem.label}</p>
                      <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{roleItem.description}</p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <form onSubmit={submitLogin} className="mt-7 space-y-5">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-800">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-bold text-slate-800">Mật khẩu</label>
                  <button type="button" className="text-sm font-semibold text-cyan-700 hover:underline" onClick={() => window.alert('Vui lòng liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.')}>Quên mật khẩu?</button>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(14,116,144,0.22)] transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200">
                Đăng nhập với vai trò {selected.label}<ArrowRight className="h-4 w-4" />
              </button>
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs leading-5 text-amber-900">Bản demo đã điền sẵn tài khoản. Chỉ cần chọn vai trò và đăng nhập.</p>
            </form>

            <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm sm:flex-row">
              <span className="text-slate-500">Chưa có tài khoản?</span>
              <button type="button" onClick={() => setShowRegisterModal(true)} className="inline-flex min-h-11 items-center gap-2 font-bold text-cyan-700 hover:underline"><UserPlus className="h-4 w-4" />Đăng ký tài khoản</button>
            </div>
          </div>
        </section>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="register-title" onKeyDown={(event) => event.key === 'Escape' && setShowRegisterModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-bold text-cyan-700">Tài khoản mới</p><h3 id="register-title" className="mt-1 text-xl font-extrabold text-slate-900">Đăng ký {selected.label}</h3></div>
              <button ref={closeButtonRef} type="button" onClick={() => setShowRegisterModal(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Đóng cửa sổ đăng ký"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitRegistration} className="mt-6 space-y-4">
              <div><label htmlFor="register-name" className="mb-2 block text-sm font-bold text-slate-800">Họ tên hoặc tên đơn vị</label><input id="register-name" required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100" /></div>
              <div><label htmlFor="register-email" className="mb-2 block text-sm font-bold text-slate-800">Email</label><input id="register-email" type="email" required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100" /></div>
              <div><label htmlFor="register-password" className="mb-2 block text-sm font-bold text-slate-800">Mật khẩu</label><input id="register-password" type="password" minLength={8} required className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100" /></div>
              <button type="submit" className="h-12 w-full rounded-xl bg-cyan-700 text-sm font-bold text-white hover:bg-cyan-800">Gửi yêu cầu đăng ký</button>
            </form>
            {registerSuccess && <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><Check className="h-4 w-4" />Đã gửi yêu cầu đăng ký thành công.</div>}
          </div>
        </div>
      )}
    </main>
  );
};
