import React, { useState } from 'react';
import { UserRole } from '../../types/cds';
import { UserSession, MOCK_USERS } from '../../types/auth';
import { Eye, UserCheck, Stethoscope, Building2, ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, UserPlus, X } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState<string>(MOCK_USERS['patient'].email);
  const [password, setPassword] = useState<string>('password123');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);

  // When switching actor tab, update email placeholder to corresponding mock email
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(MOCK_USERS[role].email);
    setPassword('password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const session = MOCK_USERS[selectedRole];
    onLoginSuccess(session);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    onLoginSuccess(MOCK_USERS[role]);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setShowRegisterModal(false);
    }, 2500);
  };

  const roleMeta: Record<UserRole, { title: string; desc: string; icon: React.ReactNode; badge: string }> = {
    patient: {
      title: 'Cổng Dành Cho Bệnh Nhân',
      desc: 'Theo dõi chỉ số vi mạch võng mạc, tải lên ảnh fundus cá nhân và nhận khuyến cáo y tế.',
      icon: <UserCheck className="w-6 h-6 text-[#16A34A]" />,
      badge: 'Bệnh Nhân',
    },
    doctor: {
      title: 'Cổng Bác Sĩ Chẩn Đoán CDS',
      desc: 'Bàn chẩn đoán tương tác side-by-side, phân tích nguy cơ Tim Mạch - Đột Quỵ và ký số EMR.',
      icon: <Stethoscope className="w-6 h-6 text-[#0891B2]" />,
      badge: 'Bác Sĩ Chuyên Khoa',
    },
    clinic: {
      title: 'Cổng Phòng Khám & Bulk Campaign',
      desc: 'Sàng lọc hàng loạt (≥100 ảnh), quản lý hàng đợi AI PyTorch và credit screening.',
      icon: <Building2 className="w-6 h-6 text-teal-600" />,
      badge: 'Đơn Vị Y Tế / Phòng Khám',
    },
    admin: {
      title: 'Cổng Quản Trị Hệ Thống',
      desc: 'Nhật ký kiểm toán an ninh audit logs, cấu hình ngưỡng AI và quản lý phân quyền.',
      icon: <ShieldAlert className="w-6 h-6 text-slate-700" />,
      badge: 'Quản Trị An Ninh System',
    },
  };

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#0891B2] selection:text-white">
      <div className="w-full max-w-5xl bg-white border border-[#CCFBF1] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Brand Visual & Medical Trust Signals */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0891B2] via-[#0E7490] to-[#134E4A] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-white text-[#0891B2] rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight block text-white">AURA System</span>
                <span className="text-[11px] text-cyan-200 font-mono-data uppercase tracking-wider block">
                  AI Retinal Vascular Screening
                </span>
              </div>
            </div>

            {/* Dynamic Role Description */}
            <div className="space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-100 text-xs font-semibold backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                {roleMeta[selectedRole].badge}
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                {roleMeta[selectedRole].title}
              </h2>

              <p className="text-xs text-cyan-100/90 leading-relaxed">
                {roleMeta[selectedRole].desc}
              </p>
            </div>
          </div>

          {/* Security Standards Info */}
          <div className="pt-8 border-t border-white/10 space-y-2 text-[11px] text-cyan-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Chuẩn Bảo Mật Y Tế HIPAA & ISO 15224</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Mã Hóa Dữ Liệu Bệnh Nhân SHA-256 HMAC</span>
            </div>
            <div className="text-[10px] text-cyan-300/60 font-mono-data pt-2">
              AURA Health Cloud Platform &copy; 2026. Version 2.4.
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms & Actor Portal Selector */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h3 className="text-base font-bold text-[#134E4A] mb-1">
                Đăng Nhập Vào Hệ Thống AURA
              </h3>
              <p className="text-xs text-slate-500">
                Chọn tác nhân người dùng của bạn để truy cập đúng phân vùng chức năng được cấp phép.
              </p>
            </div>

            {/* Dedicated Role Tabs Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {(['patient', 'doctor', 'clinic', 'admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedRole === role
                      ? 'bg-white text-[#0891B2] shadow-sm border border-[#CCFBF1]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0891B2]'
                  }`}
                >
                  {roleMeta[role].icon}
                  <span className="text-[11px] capitalize">
                    {role === 'patient' ? 'Bệnh Nhân' : role === 'doctor' ? 'Bác Sĩ' : role === 'clinic' ? 'Phòng Khám' : 'Admin'}
                  </span>
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Đăng Nhập ({roleMeta[selectedRole].badge}):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@auraclinical.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Mật Khẩu:</label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ Trưởng khoa/Admin hệ thống để khôi phục mật khẩu.'); }} className="text-[11px] font-semibold text-[#0891B2] hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0891B2] hover:bg-[#0E7490] text-white font-bold rounded-xl text-xs shadow-medical-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                Đăng Nhập Ngay Vào {roleMeta[selectedRole].badge}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Login Option */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono-data">
                Thao Tác Nhanh (Single-Click Demo Login):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickDemoLogin('patient')}
                  className="p-2 rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Login Bệnh Nhân
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('doctor')}
                  className="p-2 rounded-xl bg-cyan-50 text-[#0891B2] border border-cyan-200 font-bold text-xs hover:bg-cyan-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5" /> Login Bác Sĩ CDS
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('clinic')}
                  className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" /> Login Phòng Khám
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Login Admin
                </button>
              </div>
            </div>
          </div>

          {/* Footer Register Option */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Chưa có tài khoản Y tế?</span>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="font-bold text-[#0891B2] hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Đăng ký tài khoản mới
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal Popup */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#CCFBF1] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#134E4A] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0891B2]" /> Đăng Ký Tài Khoản {roleMeta[selectedRole].badge}
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên / Tên Đơn Vị:</label>
                <input type="text" required placeholder="Nhập tên đầy đủ..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0891B2]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Đăng Ký:</label>
                <input type="email" required placeholder="name@example.com" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0891B2]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật Khẩu:</label>
                <input type="password" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0891B2]" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#0891B2] text-white font-bold rounded-xl shadow-sm hover:bg-[#0E7490] transition-colors mt-2">
                Xác Nhận Gửi Đăng Ký Y Tế
              </button>
            </form>

            {registerSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-[#16A34A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Đăng ký thành công! Đang chuyển hướng đăng nhập...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
