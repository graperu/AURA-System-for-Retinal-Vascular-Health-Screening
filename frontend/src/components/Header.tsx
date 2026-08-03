import React from 'react';
import { UserSession } from '../types/auth';
import { Eye, ShieldCheck, LogOut, User, Building2, Stethoscope, ShieldAlert, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: UserSession;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'patient':
        return <UserCheck className="w-4 h-4 text-[#16A34A]" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-[#0891B2]" />;
      case 'clinic':
        return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <header className="bg-white border-b border-[#CCFBF1] sticky top-0 z-40 shadow-medical-sm">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0891B2] text-white rounded-xl flex items-center justify-center shadow-md">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#134E4A] tracking-tight">AURA System</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#CCFBF1] text-[#0891B2] font-semibold border border-[#99F6E4]">
                v2.4 (HIPAA Ready)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              Hệ Thống Sàng Lọc Sức Khỏe Mạch Máu Võng Mạc & Hỗ Trợ Chẩn Đoán AI
            </span>
          </div>
        </div>

        {/* Authenticated User Profile Badge & Logout Button */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1]">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[#0891B2] shadow-xs">
              {getRoleIcon()}
            </div>
            <div className="text-xs">
              <div className="font-bold text-[#134E4A]">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {currentUser.roleTitle} • <span className="text-[#0891B2] font-semibold">{currentUser.organization}</span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-[#16A34A] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">Secured Session</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-xs"
            title="Đăng xuất khỏi phân vùng tác nhân"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
