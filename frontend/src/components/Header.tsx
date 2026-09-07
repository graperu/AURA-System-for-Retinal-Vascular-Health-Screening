import React, { useState } from 'react';
import { Bell, Eye, LogOut, Menu, ShieldCheck, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';
import { UserSession } from '../types/auth';

interface HeaderProps {
  currentUser: UserSession;
  onLogout: () => void;
  onOpenMenu: () => void;
  onOpenChat?: () => void;
}

const roleLabels = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  clinic: 'Phòng khám',
  admin: 'Quản trị viên',
};

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onOpenMenu, onOpenChat }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    {
      id: '1',
      type: 'ai',
      title: 'Phân tích AI hoàn tất',
      desc: 'Ảnh võng mạc OD-8842 đã xử lý xong. Nguy cơ vi mạch: Moderate (58%).',
      time: '5 phút trước',
      unread: true,
    },
    {
      id: '2',
      type: 'doctor',
      title: 'Bác sĩ đã thẩm định kết quả',
      desc: 'BS. CKII Nguyễn Thị Thanh đã ký duyệt báo cáo lâm sàng ca khám của bạn.',
      time: '25 phút trước',
      unread: true,
    },
    {
      id: '3',
      type: 'alert',
      title: 'Cảnh báo nguy cơ vi mạch',
      desc: 'Tỷ lệ A/V 0.52 (co thắt động mạch nhỏ). Khuyến cáo theo dõi huyết áp.',
      time: '1 giờ trước',
      unread: true,
    },
    {
      id: '4',
      type: 'system',
      title: 'Hệ thống AURA cập nhật',
      desc: 'Mô hình phân loại PyTorch Fundus-Model-v1.4 đã được tối ưu hóa độ nhạy.',
      time: '1 ngày trước',
      unread: false,
    },
  ];

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left Brand & Mobile Menu */}
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
              <span className="hidden rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-800 sm:inline">
                Hỗ trợ sàng lọc AI
              </span>
            </div>
            <p className="truncate text-xs font-medium text-slate-500">Sức khỏe mạch máu võng mạc</p>
          </div>
        </div>

        {/* Right Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 xl:flex">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Phiên làm việc an toàn (HIPAA)
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={handleOpenNotif}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-cyan-700" /> Trung Tâm Thông Báo Lâm Sàng
                  </span>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        notif.unread ? 'bg-cyan-50/30' : ''
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          notif.type === 'ai'
                            ? 'bg-cyan-100 text-cyan-800'
                            : notif.type === 'doctor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : notif.type === 'alert'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {notif.type === 'alert' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono-data">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{notif.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center">
                  <span className="text-[11px] font-semibold text-cyan-800 hover:underline cursor-pointer">
                    Đã xem tất cả thông báo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge */}
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="max-w-48 truncate text-sm font-bold text-slate-800">
              {currentUser.name && !currentUser.name.includes('?')
                ? currentUser.name
                : currentUser.role === 'patient'
                ? 'Bệnh nhân Nguyễn Trọng Nam'
                : currentUser.role === 'doctor'
                ? 'BS. CKII Nguyễn Thị Thanh'
                : currentUser.role === 'clinic'
                ? 'Phòng khám Đa khoa AURA'
                : 'Quản trị viên Hệ thống'}
            </p>
            <p className="text-xs text-slate-500">{roleLabels[currentUser.role]}</p>
          </div>

          {/* Logout Button */}
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
};
