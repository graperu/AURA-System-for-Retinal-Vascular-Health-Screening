import React, { useState, useEffect } from 'react';
import {
  Bell,
  Eye,
  LogOut,
  Menu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Sparkles,
  CreditCard,
  User,
} from 'lucide-react';
import { UserSession } from '../types/auth';
import { notificationApi, getAccessToken } from '../services/api';

interface HeaderProps {
  currentUser: UserSession;
  onLogout: () => void;
  onOpenMenu: () => void;
  onOpenChat?: () => void;
}

const roleLabels: Record<string, string> = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  clinic: 'Phòng khám',
  admin: 'Quản trị viên',
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenMenu,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<any | null>(null);

  const loadNotifications = async () => {
    try {
      const [resList, resCount] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);
      if (resList.success && Array.isArray(resList.data)) {
        setNotifications(resList.data);
      }
      if (resCount.success && resCount.data) {
        setUnreadCount(Number(resCount.data.unreadCount || 0));
      }
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    }
  };

  useEffect(() => {
    void loadNotifications();

    let eventSource: EventSource | null = null;
    try {
      const streamUrl = notificationApi.getStreamUrl();
      const token = getAccessToken();
      const sseUrl = token
        ? `${streamUrl}?token=${encodeURIComponent(token)}`
        : streamUrl;

      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener('NOTIFICATION', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setActiveToast(data);
          setTimeout(() => {
            setActiveToast((curr: any) => (curr?.id === data.id ? null : curr));
          }, 6000);
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {
      console.warn('SSE stream setup error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.warn('Could not mark notification as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Could not mark all as read:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#CCFBF1] bg-white/95 backdrop-blur-md shadow-medical-sm">
      {/* Realtime Toast Alert */}
      {activeToast && (
        <div className="fixed top-18 right-6 z-50 max-w-sm rounded-2xl border border-cyan-200 bg-white p-4 shadow-medical-modal animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#F0FDFA] p-2 text-[#0891B2] shrink-0 border border-[#CCFBF1]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Đóng"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug line-clamp-2">
                {activeToast.message}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#0891B2] font-semibold">
                  Thông báo mới
                </span>
                <button
                  onClick={() => {
                    handleMarkAsRead(activeToast.id);
                    setActiveToast(null);
                  }}
                  className="text-[11px] font-semibold text-[#0891B2] hover:underline"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left Branding */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-[#F0FDFA] hover:text-[#0891B2] lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0891B2] to-[#0E7490] text-white shadow-md">
            <Eye className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#134E4A]">
                AURA
              </span>
              <span className="hidden rounded-full bg-[#F0FDFA] px-2 py-0.5 text-[11px] font-semibold text-[#0891B2] sm:inline border border-[#CCFBF1]">
                Clinical AI
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">
              Sàng lọc vi mạch võng mạc & tim mạch
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] px-3.5 py-1.5 text-xs font-bold text-[#0891B2] xl:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Chuẩn bảo mật HIPAA
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-[#F0FDFA] hover:text-[#0891B2] transition-colors border border-slate-200/80"
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-medical-modal border border-[#CCFBF1] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#CCFBF1]/60 bg-[#F0FDFA] px-4 py-3">
                  <span className="font-bold text-xs text-[#134E4A] flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-[#0891B2]" />
                    Trung Tâm Thông Báo
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-[#0891B2] hover:underline"
                      >
                        Đọc tất cả
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Không có thông báo mới nào.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3.5 transition-colors cursor-pointer hover:bg-[#F0FDFA]/50 ${
                          !n.isRead ? 'bg-[#F0FDFA]/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className={`text-xs truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0891B2] to-[#0E7490] text-white font-bold text-xs shadow-xs">
              {currentUser.name
                ? currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'AU'}
            </div>

            <div className="hidden text-left md:block">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                {currentUser.name || 'Người dùng'}
              </div>
              <div className="text-[11px] font-medium text-[#0891B2]">
                {roleLabels[currentUser.role] || currentUser.role}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
