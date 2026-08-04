import React from 'react';
import { Bell, Eye, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { UserSession } from '../types/auth';

interface HeaderProps {
  currentUser: UserSession;
  onLogout: () => void;
  onOpenMenu: () => void;
}

const roleLabels = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  clinic: 'Phòng khám',
  admin: 'Quản trị viên',
};

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onOpenMenu }) => (
  <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 lg:hidden"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-[0_8px_24px_rgba(14,116,144,0.24)]">
          <Eye className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">AURA</span>
            <span className="hidden rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-800 sm:inline">Hỗ trợ sàng lọc AI</span>
          </div>
          <p className="truncate text-xs font-medium text-slate-500">Sức khỏe mạch máu võng mạc</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 xl:flex">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Phiên làm việc an toàn
        </div>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>

        <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
          <p className="max-w-48 truncate text-sm font-bold text-slate-800">{currentUser.name}</p>
          <p className="text-xs text-slate-500">{roleLabels[currentUser.role]}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
          aria-label="Đăng xuất"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </div>
    </div>
  </header>
);
