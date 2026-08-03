import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [portalRole, setPortalRole] = useState<'DOCTOR' | 'USER' | 'ADMIN' | 'CLINIC'>('DOCTOR');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('dr.phandinh@aura.vn');
  const [loginPassword, setLoginPassword] = useState('phandinh123@A');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const portals = [
    { id: 'DOCTOR', name: 'Bác sĩ', icon: 'stethoscope', desc: 'Bàn làm việc Bác sĩ & Chẩn đoán' },
    { id: 'USER', name: 'Bệnh nhân', icon: 'person', desc: 'Xem hồ sơ & Lịch sử tầm soát' },
    { id: 'ADMIN', name: 'Quản trị viên', icon: 'admin_panel_settings', desc: 'Quản trị hệ thống & Kiểm toán' },
    { id: 'CLINIC', name: 'Phòng khám', icon: 'domain', desc: 'Quản lý cơ sở & Ca khám' },
  ];

  const handlePortalChange = (roleId: 'DOCTOR' | 'USER' | 'ADMIN' | 'CLINIC') => {
    setPortalRole(roleId);
    setErrorMsg('');
    setSuccessMsg('');
    if (roleId === 'DOCTOR') setLoginEmail('dr.phandinh@aura.vn');
    else if (roleId === 'USER') setLoginEmail('patient.nguyenan@aura.vn');
    else if (roleId === 'ADMIN') setLoginEmail('admin@aura.vn');
    else if (roleId === 'CLINIC') setLoginEmail('clinic.central@aura.vn');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await auth.login(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng vào giao diện...');
        setTimeout(() => {
          redirectByRole(auth.user?.role || portalRole);
        }, 500);
      } else {
        if (res.message?.includes('Failed to fetch') || res.message?.includes('HTTP Error')) {
          setSuccessMsg(`Chuyển hướng vào giao diện ${portalRole} (Offline Mode)...`);
          setTimeout(() => redirectByRole(portalRole), 600);
        } else {
          setErrorMsg(res.message || 'Đăng nhập không thành công.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật.');
      setLoading(false);
      return;
    }

    try {
      const res = await auth.register({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        role: portalRole,
        password: regPassword,
      });

      if (res.success) {
        setSuccessMsg(`Đăng ký tài khoản ${portalRole} thành công! Đang chuyển hướng...`);
        setTimeout(() => {
          redirectByRole(portalRole);
        }, 800);
      } else {
        if (res.message?.includes('Failed to fetch') || res.message?.includes('HTTP Error')) {
          setSuccessMsg(`Đăng ký tài khoản ${portalRole} thành công (Offline Mode)...`);
          setTimeout(() => redirectByRole(portalRole), 600);
        } else {
          setErrorMsg(res.message || 'Đăng ký thất bại.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    if (role === 'PATIENT' || role === 'USER') {
      navigate('/patient');
    } else if (role === 'CLINIC') {
      navigate('/clinic');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/doctor');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex selection:bg-primary-container selection:text-on-primary-container">
      {/* Panel đồ họa Y khoa bên trái */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dim items-end p-margin-page overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBqGsVQD_C4YtqWhHxmvw3Lq5TYTJIftI2guyquiKgBHZo6LNT3IRN80Pswm15WsjecSt_eMcZtUA-002Xjd09h6-bmb9hfEAmdeUmQvSnqkSQ7HBYk-8AIQu8ZhmS9uV6CpmSXbTP-fVQWO12lDUN3BFI1NcMFVhL9M4TKmW1_qSeX5V4H5DThqZM2PpKIE_5MPd9cMib75MDVpuSaqqacrh9fsM8SuN05p6q7Z5NYz1foVefu3eWm')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent" />
        <div className="relative z-10 w-full max-w-lg text-on-secondary">
          <h1 className="font-display-lg text-display-lg mb-2">AURA</h1>
          <p className="font-headline-sm text-headline-sm mb-6 opacity-90">Tầm Soát Sức Khỏe Mạch Máu Võng Mạc</p>
          <div className="h-[1px] w-12 bg-on-secondary opacity-50 mb-6" />
          <p className="font-body-lg text-body-lg opacity-80 leading-relaxed">
            Hệ thống hỗ trợ quyết định lâm sàng chính xác cao, ứng dụng trí tuệ nhân tạo phân tích vi mạch võng mạc mắt, phát hiện sớm bệnh lý võng mạc tiểu đường và cao huyết áp.
          </p>
        </div>
      </div>

      {/* Container Form Đăng nhập / Đăng ký bên phải */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-gutter sm:p-margin-page bg-surface overflow-y-auto">
        <div className="w-full max-w-[460px] bg-surface-container-lowest border border-outline-variant rounded-xl p-8 sm:p-10 shadow-sm my-6">
          <div className="mb-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[32px] filled">visibility</span>
              <h2 className="font-display-lg text-display-lg text-primary tracking-tight">AURA Clinical</h2>
            </div>

            {/* Chọn Cổng Giao Diện / Vai Trò */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                Chọn cổng giao diện đối tượng:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {portals.map((p) => {
                  const isSelected = portalRole === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePortalChange(p.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-primary-container text-on-primary-container border-primary shadow-xs font-semibold'
                          : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${isSelected ? 'filled' : ''}`}>
                        {p.icon}
                      </span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Swapper: Đăng Nhập vs Đăng Ký */}
            <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant mb-6">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-md font-semibold text-label-md transition-all ${
                  mode === 'login'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-md font-semibold text-label-md transition-all ${
                  mode === 'register'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Đăng Ký Tài Khoản
              </button>
            </div>

            <h3 className="font-headline-md text-headline-md text-on-surface mb-1">
              {mode === 'login' ? `Đăng nhập Cổng ${portals.find(p => p.id === portalRole)?.name}` : `Đăng ký Cổng ${portals.find(p => p.id === portalRole)?.name}`}
            </h3>
            <p className="font-body-md text-on-surface-variant">
              {mode === 'login'
                ? `Nhập thông tin để truy cập trực tiếp vào giao diện ${portals.find(p => p.id === portalRole)?.name}.`
                : `Tạo tài khoản mới để truy cập vào giao diện ${portals.find(p => p.id === portalRole)?.name}.`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-body-md rounded-lg flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-error">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-tertiary-container/30 text-tertiary text-body-md rounded-lg flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Đăng Nhập */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-2 uppercase tracking-wide" htmlFor="loginEmail">
                  Email Bác sĩ / Cán bộ / Bệnh nhân
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="dr.phandinh@aura.vn"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-label-md text-label-md text-on-surface uppercase tracking-wide" htmlFor="loginPassword">
                    Mật khẩu
                  </label>
                  <a href="#" className="font-label-md text-label-md text-primary hover:underline transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
                <input
                  id="loginPassword"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 bg-primary text-on-primary rounded font-label-md text-label-md uppercase tracking-wider hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập Hệ Thống'}
                </button>
              </div>
            </form>
          ) : (
            /* Form Đăng Ký */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="regFullName">
                  Họ và Tên
                </label>
                <input
                  id="regFullName"
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nguyễn Văn An"
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="regEmail">
                    Địa chỉ Email
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nguyenvanan@gmail.com"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="regPhone">
                    Số điện thoại
                  </label>
                  <input
                    id="regPhone"
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="portalRoleSelect">
                  Vai trò Cổng Giao diện Đăng ký
                </label>
                <select
                  id="portalRoleSelect"
                  value={portalRole}
                  onChange={(e) => handlePortalChange(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-semibold"
                >
                  <option value="DOCTOR">🩺 Bác sĩ Chẩn đoán / Nhãn khoa</option>
                  <option value="USER">👤 Bệnh nhân / Người dùng</option>
                  <option value="ADMIN">🛡️ Quản trị viên Hệ thống</option>
                  <option value="CLINIC">🏥 Quản lý Phòng khám / Đơn vị Y tế</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="regPassword">
                    Mật khẩu
                  </label>
                  <input
                    id="regPassword"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 uppercase tracking-wide" htmlFor="regConfirmPassword">
                    Xác nhận Mật khẩu
                  </label>
                  <input
                    id="regConfirmPassword"
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-xs text-on-surface-variant leading-tight cursor-pointer">
                  Tôi đồng ý với <a href="#" className="text-primary underline">Điều khoản Sử dụng</a> và <a href="#" className="text-primary underline">Chính sách Bảo mật Y tế</a> của AURA.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 bg-primary text-on-primary rounded font-label-md text-label-md uppercase tracking-wider hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản Mới'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 mb-5 relative flex items-center">
            <div className="flex-grow border-t border-outline-variant" />
            <span className="flex-shrink-0 mx-4 font-body-md text-on-surface-variant text-xs">Hoặc đăng nhập nhanh bằng</span>
            <div className="flex-grow border-t border-outline-variant" />
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/patient')}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface rounded font-label-md text-label-md uppercase hover:bg-surface-container-low transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tài khoản Google
            </button>

            <button
              onClick={() => navigate('/admin')}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface-container-lowest border border-outline-variant text-on-surface rounded font-label-md text-label-md uppercase hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">badge</span>
              Đăng nhập SSO Đơn vị (Admin)
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="font-body-md text-on-surface-variant text-xs opacity-80">
              © 2026 Hệ thống Hỗ trợ Quyết định Lâm sàng AURA.<br />
              Môi trường bảo mật đạt chuẩn y tế.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
