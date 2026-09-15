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
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language } = useLanguage();
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
    <header className="sticky top-0 z-40 border-b border-clinical-border bg-white backdrop-blur-md shadow-medical-sm">
      {/* Realtime Toast Alert */}
      {activeToast && (
        <div className="fixed top-18 right-6 z-50 max-w-sm rounded-2xl border border-clinical-border bg-white p-4 shadow-medical-modal animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-brand-50 p-2 text-brand-700 shrink-0 border border-brand-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-clinical-text truncate">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => setActiveToast(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-clinical-text-muted hover:text-clinical-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="Đóng"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-clinical-text-secondary mt-1 leading-snug line-clamp-2">
                {activeToast.message}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-brand-700 font-semibold">
                  {t('header.newNotification', 'Thông báo mới')}
                </span>
                <button
                  onClick={() => {
                    handleMarkAsRead(activeToast.id);
                    setActiveToast(null);
                  }}
                  className="text-[11px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  {t('header.gotIt', 'Đã hiểu')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-16 w-full max-w-[1536px] 2xl:max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left Branding */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-clinical-border text-clinical-text-secondary hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-medical-xs">
            <Eye className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-clinical-text">
                AURA
              </span>
              <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 sm:inline border border-brand-100">
                Clinical AI
              </span>
            </div>
            <p className="truncate text-xs text-clinical-text-muted">
              {t('header.tagline', 'Sàng lọc vi mạch võng mạc & tim mạch')}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-3.5 py-1.5 text-xs font-bold text-brand-700 xl:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {t('header.hipaaStandard', 'Chuẩn bảo mật HIPAA')}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-clinical-text-muted hover:bg-brand-50 hover:text-brand-700 border border-clinical-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={t('common.notifications', 'Thông báo')}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-medical-modal border border-clinical-border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-clinical-border bg-brand-50 px-4 py-3">
                  <span className="font-bold text-xs text-clinical-text flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-brand-700" />
                    {t('header.notificationCenter', 'Trung Tâm Thông Báo')}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                      >
                        {t('header.markAllAsRead', 'Đọc tất cả')}
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-clinical-text-muted hover:text-clinical-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-clinical-text-muted">
                      {t('header.noNotifications', 'Không có thông báo mới nào.')}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3.5 transition-colors cursor-pointer hover:bg-brand-50/50 ${
                          !n.isRead ? 'bg-brand-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className={`text-xs truncate ${!n.isRead ? 'font-bold text-clinical-text' : 'font-medium text-clinical-text-secondary'}`}>
                                {n.title}
                              </h5>
                              <span className="text-[10px] text-clinical-text-muted shrink-0">
                                {new Date(n.createdAt || Date.now()).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-clinical-text-muted mt-0.5 leading-snug line-clamp-2">
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
          <div className="flex items-center gap-2.5 pl-3 border-l border-clinical-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white font-bold text-xs shadow-xs">
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
              <div className="text-xs font-bold text-clinical-text truncate max-w-[140px]">
                {currentUser.name || 'Người dùng'}
              </div>
              <div className="text-[11px] font-medium text-brand-700">
                {t(`roles.${currentUser.role}`, roleLabels[currentUser.role] || currentUser.role)}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-clinical-text-muted hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-colors ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title={t('header.logout', 'Đăng xuất')}
              aria-label={t('header.logout', 'Đăng xuất')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
