import React, { useState } from 'react';
import { X, User, ChevronRight, Loader2, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import googleLogo from '../../assets/sso/google.png';
import { useLanguage } from '../../context/LanguageContext';

export interface GoogleAuthPayload {
  provider: 'google';
  idToken: string;
  email: string;
  fullName: string;
  picture?: string;
}

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (payload: GoogleAuthPayload) => Promise<{ success: boolean; message?: string }>;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presetAccounts = [
    {
      email: 'doctor@aura.health',
      name: isVi ? 'BS. CKII Nguyễn Minh Tuấn' : 'Dr. Minh Tuan Nguyen',
      role: t('auth.googleModal.roleDoctor', isVi ? 'Bác sĩ Chuyên khoa Mắt' : 'Ophthalmology Specialist'),
      avatarColor: 'bg-emerald-600',
      initials: 'BS',
    },
    {
      email: 'patient.google@aura.health',
      name: isVi ? 'Nguyễn Văn An' : 'Van An Nguyen',
      role: t('auth.googleModal.rolePatient', isVi ? 'Bệnh nhân Tầm soát Võng mạc' : 'Retinal Screening Patient'),
      avatarColor: 'bg-blue-600',
      initials: 'NA',
    },
    {
      email: 'clinic.admin@aura.health',
      name: isVi ? 'PK Đa Khoa Quốc Tế AURA' : 'AURA International Clinic',
      role: t('auth.googleModal.roleClinic', isVi ? 'Quản trị viên Phòng khám' : 'Clinic Administrator'),
      avatarColor: 'bg-indigo-600',
      initials: 'PK',
    },
    {
      email: 'admin@aura.health',
      name: isVi ? 'Quản Trị Viên Hệ Thống' : 'System Administrator',
      role: t('auth.googleModal.roleAdmin', isVi ? 'Quản trị viên Cấp cao' : 'System Administrator'),
      avatarColor: 'bg-purple-600',
      initials: 'AD',
    },
  ];

  const buildMockGoogleJwt = (email: string, fullName: string) => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        iss: 'https://accounts.google.com',
        sub: 'google_mock_' + Math.abs(email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)),
        email: email.trim().toLowerCase(),
        email_verified: true,
        name: fullName.trim(),
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const signature = 'mock_cryptographic_signature_google_auth';
    return `${header}.${payload}.${signature}`;
  };

  const handleChooseAccount = async (email: string, name: string) => {
    if (loadingEmail) return;
    setLoadingEmail(email);
    setError(null);

    try {
      const idToken = buildMockGoogleJwt(email, name);
      const result = await onSelectAccount({
        provider: 'google',
        idToken,
        email: email.trim().toLowerCase(),
        fullName: name.trim(),
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
      });

      if (!result.success) {
        setError(result.message || (isVi ? 'Đăng nhập Google thất bại.' : 'Google sign-in failed.'));
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || (isVi ? 'Lỗi kết nối máy chủ Google.' : 'Google connection error.'));
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(isVi ? 'Vui lòng nhập địa chỉ email hợp lệ.' : 'Please enter a valid email address.');
      return;
    }
    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    handleChooseAccount(cleanEmail, cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={googleLogo || '/assets/sso/google.png'} alt="Google" className="h-6 w-6 object-contain" />
            <span className="text-sm font-bold text-slate-800 tracking-tight">Google Identity</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {t('auth.googleModal.title', isVi ? 'Đăng nhập bằng Google' : 'Sign in with Google')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t('auth.googleModal.subtitle', isVi ? 'Chọn tài khoản để tiếp tục với Hệ thống AURA' : 'Choose an account to continue to AURA Screening')}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              {error}
            </div>
          )}

          {!showCustomInput ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {t('auth.googleModal.presetAccountsTitle', isVi ? 'Tài khoản mẫu được xác thực' : 'Verified Sample Accounts')}
              </div>

              {presetAccounts.map((acc) => {
                const isSelected = loadingEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={Boolean(loadingEmail)}
                    onClick={() => handleChooseAccount(acc.email, acc.name)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-left transition hover:bg-slate-100/90 hover:border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${acc.avatarColor}`}>
                        {acc.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 truncate">{acc.name}</span>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                        <div className="text-[10px] font-medium text-brand-600 truncate">{acc.role}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isSelected ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={Boolean(loadingEmail)}
                  onClick={() => setShowCustomInput(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>{t('auth.googleModal.useOtherAccount', isVi ? 'Sử dụng tài khoản Google khác' : 'Use another Google account')}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => { setShowCustomInput(false); setError(null); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t('auth.googleModal.presetAccountsTitle', isVi ? 'Quay lại danh sách' : 'Back to accounts')}</span>
              </button>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.googleModal.emailLabel', isVi ? 'Địa chỉ Email Google' : 'Google Email Address')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder={t('auth.googleModal.emailPlaceholder', 'name@gmail.com')}
                    className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.googleModal.nameLabel', isVi ? 'Họ và tên hiển thị' : 'Display Full Name')}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('auth.googleModal.namePlaceholder', isVi ? 'Nguyễn Văn A' : 'John Doe')}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(false); setError(null); }}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t('auth.googleModal.cancelBtn', isVi ? 'Hủy' : 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(loadingEmail)}
                  className="flex-1 h-10 rounded-xl bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loadingEmail ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('auth.googleModal.loggingIn', isVi ? 'Đang kết nối...' : 'Connecting...')}</>
                  ) : (
                    t('auth.googleModal.signInBtn', isVi ? 'Đăng nhập ngay' : 'Sign In Now')
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Disclaimer */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            {t('auth.googleModal.privacyNotice', isVi ? 'Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với AURA theo Chính sách Quyền riêng tư.' : 'To continue, Google will share your name, email address, and profile picture with AURA.')}
          </div>
        </div>
      </div>
    </div>
  );
};
