import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Sparkles,
  X,
  Languages,
  Bell,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { UserSession } from '../../types/auth';
import { useLanguage } from '../../context/LanguageContext';
import { SearchField } from '../common/SearchField';
import { NotificationCenterDrawer } from '../NotificationCenterDrawer';
import { notificationApi, getAccessToken } from '../../services/api';
import { realtimeBus } from '../../services/realtimeService';
import { playNotificationChime } from '../../utils/soundEffects';
import { SyncIndicator } from '../../context/DataSyncContext';
import {
  NotificationBell,
  NotificationItem,
  MOCK_NOTIFICATIONS,
} from './NotificationBell';

export type OnlinePresenceStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface TopbarProps {
  currentUser: UserSession;
  title?: string;
  onLogout: () => void;
  onOpenMenu?: () => void;
  onNavigate?: (section: string) => void;
  onSearch?: (query: string) => void;
  onlineStatus?: OnlinePresenceStatus;
  className?: string;
}

const roleLabels: Record<string, { vi: string; en: string }> = {
  patient: { vi: 'Bệnh nhân', en: 'Patient' },
  doctor: { vi: 'Bác sĩ', en: 'Doctor' },
  clinic: { vi: 'Phòng khám', en: 'Clinic' },
  admin: { vi: 'Quản trị viên', en: 'Admin' },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  title,
  onLogout,
  onOpenMenu,
  onNavigate,
  onSearch,
  onlineStatus: propOnlineStatus,
  className = '',
}) => {
  const { t, language, setLanguage, isVi } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState<number>(
    MOCK_NOTIFICATIONS.filter((n) => !n.read && !n.isRead).length
  );
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [internalOnlineStatus, setInternalOnlineStatus] = useState<OnlinePresenceStatus>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'disconnected';
    }
    return 'connected';
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentOnlineStatus = propOnlineStatus || internalOnlineStatus;

  // Track browser connectivity status
  useEffect(() => {
    const handleOnline = () => setInternalOnlineStatus('connected');
    const handleOffline = () => setInternalOnlineStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications with fallback to mock data
  const loadNotifications = async () => {
    try {
      const [resList, resCount] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);
      if (resList.success && Array.isArray(resList.data) && resList.data.length > 0) {
        const mapped: NotificationItem[] = resList.data.map((item: any) => ({
          id: String(item.id || item._id || Math.random()),
          type: item.type || 'SYSTEM',
          title: item.title || '',
          titleEn: item.titleEn,
          message: item.message || '',
          messageEn: item.messageEn,
          timestamp: item.createdAt || item.timestamp || Date.now(),
          read: Boolean(item.isRead ?? item.read),
          link: item.linkUrl || item.link || '/dashboard',
          isRead: Boolean(item.isRead ?? item.read),
          linkUrl: item.linkUrl || item.link || '/dashboard',
        }));
        setNotifications(mapped);
      }
      if (resCount.success && resCount.data && resCount.data.unreadCount !== undefined) {
        setUnreadCount(Number(resCount.data.unreadCount || 0));
      }
    } catch (e) {
      console.warn('Could not fetch notifications from API, retaining default mock data:', e);
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

      eventSource.onopen = () => {
        setInternalOnlineStatus('connected');
      };

      eventSource.addEventListener('NOTIFICATION', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          const newNotif: NotificationItem = {
            id: String(data.id || Date.now()),
            type: data.type || 'SYSTEM',
            title: data.title || (isVi ? 'Thông báo mới' : 'New notification'),
            titleEn: data.titleEn || data.title,
            message: data.message || '',
            messageEn: data.messageEn || data.message,
            timestamp: data.timestamp || Date.now(),
            read: false,
            link: data.linkUrl || data.link || '/dashboard',
            isRead: false,
            linkUrl: data.linkUrl || data.link || '/dashboard',
          };
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setActiveToast(data);
          playNotificationChime();
          setTimeout(() => {
            setActiveToast((curr: any) => (curr?.id === data.id ? null : curr));
          }, 6000);

          realtimeBus.handleIncomingPayload(data, 'sse');
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      });

      eventSource.onerror = () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setInternalOnlineStatus('disconnected');
        } else {
          setInternalOnlineStatus('reconnecting');
        }
        eventSource?.close();
      };
    } catch (e) {
      console.warn('SSE stream setup error:', e);
    }

    const unsubBusNotif = realtimeBus.subscribe('NOTIFICATION_CREATED', (evtPayload) => {
      const data = (evtPayload?.data || evtPayload?.payload || evtPayload) as any;
      if (data && (data.title || data.message)) {
        const notifId = String(data.id || Date.now());
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notifId)) return prev;
          const newNotif: NotificationItem = {
            id: notifId,
            type: data.type || 'SYSTEM',
            title: data.title || (isVi ? 'Thông báo mới' : 'New notification'),
            titleEn: data.titleEn || data.title,
            message: data.message || '',
            messageEn: data.messageEn || data.message,
            timestamp: data.timestamp || Date.now(),
            read: false,
            link: data.linkUrl || data.link || '/dashboard',
            isRead: false,
            linkUrl: data.linkUrl || data.link || '/dashboard',
          };
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        setActiveToast(data);
        playNotificationChime();
        setTimeout(() => {
          setActiveToast((curr: any) => (curr?.id === data.id ? null : curr));
        }, 6000);
      }
    });

    return () => {
      if (eventSource) eventSource.close();
      unsubBusNotif();
    };
  }, [currentUser, isVi]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      const nextUnread = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnread);
      realtimeBus.emit('NOTIFICATION_READ', { id, remainingUnread: nextUnread });
      await notificationApi.markAsRead(id);
    } catch (e) {
      console.warn('Could not mark notification as read:', e);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false, isRead: false } : n))
      );
      const nextUnread = unreadCount + 1;
      setUnreadCount(nextUnread);
      realtimeBus.emit('NOTIFICATION_UNREAD', { id, remainingUnread: nextUnread });
      await notificationApi.markAsUnread(id);
    } catch (e) {
      console.warn('Could not mark notification as unread:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      realtimeBus.emit('NOTIFICATION_CLEARED', { remainingUnread: 0 });
      await notificationApi.clearAll();
    } catch (e) {
      console.warn('Could not clear all notifications:', e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target ? !target.isRead && !target.read : false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        const nextUnread = Math.max(0, unreadCount - 1);
        setUnreadCount(nextUnread);
        realtimeBus.emit('NOTIFICATION_READ', { id, remainingUnread: nextUnread });
      }
      await notificationApi.deleteNotification(id);
    } catch (e) {
      console.warn('Could not delete notification:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
      realtimeBus.emit('NOTIFICATION_CLEARED', { remainingUnread: 0 });
      await notificationApi.markAllAsRead();
    } catch (e) {
      console.warn('Could not mark all as read:', e);
    }
  };

  const resolveTargetSection = (notif: any): string => {
    const rawLink = String(notif?.linkUrl || '').trim();
    const cleanLink = rawLink.replace(/^\//, '').toLowerCase();

    if (cleanLink === 'cds-viewer' || cleanLink === 'cds' || cleanLink === 'viewer') {
      return 'cds-viewer';
    }
    if (cleanLink === 'scan-history' || cleanLink === 'history' || cleanLink === 'reports-history') {
      return 'scan-history';
    }
    if (cleanLink === 'upload-scan' || cleanLink === 'upload' || cleanLink === 'new-scan') {
      return 'upload-scan';
    }
    if (cleanLink === 'billing' || cleanLink === 'credits' || cleanLink === 'credit-package') {
      return currentUser.role === 'clinic' ? 'credit-package' : 'billing';
    }
    if (cleanLink === 'consultation' || cleanLink === 'chat' || cleanLink === 'consult') {
      return 'consultation';
    }
    if (cleanLink === 'medical-profile' || cleanLink === 'profile') {
      return 'medical-profile';
    }
    if (cleanLink === 'patient-list' || cleanLink === 'patients') {
      return 'patient-list';
    }
    if (cleanLink === 'reports' || cleanLink === 'medical-reports') {
      return 'reports';
    }
    if (cleanLink === 'bulk-batch' || cleanLink === 'bulk') {
      return 'bulk-batch';
    }
    if (cleanLink === 'user-management' || cleanLink === 'users') {
      return 'user-management';
    }

    const type = String(notif?.type || '').toUpperCase();
    if (type === 'AI_READY') {
      return currentUser.role === 'doctor' ? 'cds-viewer' : 'scan-history';
    }
    if (type === 'DOCTOR_REVIEW') {
      return currentUser.role === 'doctor' ? 'reports' : 'scan-history';
    }
    if (type === 'BILLING') {
      return currentUser.role === 'clinic' ? 'credit-package' : 'billing';
    }
    if (type === 'CONSULTATION') {
      return 'consultation';
    }
    if (type === 'BULK_BATCH') {
      return 'bulk-batch';
    }

    return 'dashboard';
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif) return;
    if (!notif.isRead && !notif.read && notif.id) {
      void handleMarkAsRead(notif.id);
    }
    setIsDrawerOpen(false);
    setActiveToast(null);

    if (onNavigate) {
      const target = resolveTargetSection(notif);
      onNavigate(target);
    }
  };

  const pageTitle = title || (isVi ? 'Tổng quan' : 'Dashboard');

  const roleText =
    roleLabels[currentUser.role]?.[language] ||
    currentUser.role;

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AU';

  const onlinePresenceTooltip =
    currentOnlineStatus === 'connected'
      ? (isVi ? 'Kết nối real-time: Đang hoạt động' : 'Real-time connection: Active')
      : currentOnlineStatus === 'reconnecting'
      ? (isVi ? 'Kết nối real-time: Đang kết nối lại' : 'Real-time connection: Reconnecting')
      : (isVi ? 'Kết nối real-time: Mất kết nối' : 'Real-time connection: Disconnected');

  const onlinePresenceDotColor =
    currentOnlineStatus === 'connected'
      ? 'bg-emerald-500'
      : currentOnlineStatus === 'reconnecting'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <header
      className={`sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-[#EAECF0] bg-white px-5 sm:px-8 transition-colors ${className}`}
    >
      {/* Realtime Toast Alert */}
      {activeToast && (
        <div
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed top-20 right-6 z-50 max-w-sm rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-xl cursor-pointer hover:border-[#3478F6] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#EEF5FF] p-2 text-[#3478F6] shrink-0 border border-[#E0EAFF]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] truncate">
                  {activeToast.title}
                </h4>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[#98A2B3] hover:text-[#111827]"
                  aria-label={isVi ? 'Đóng' : 'Close'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#667085] mt-1 leading-snug line-clamp-2">
                {activeToast.message}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#3478F6] font-semibold">
                  {t('header.newNotification', isVi ? 'Thông báo mới' : 'New notification')}
                </span>
                <span className="text-[11px] font-semibold text-[#3478F6] hover:underline">
                  {isVi ? 'Xem chi tiết →' : 'View details →'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left: Hamburger (Mobile) + Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAECF0] text-[#667085] hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors"
            aria-label={isVi ? 'Mở menu' : 'Open menu'}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          {pageTitle}
        </h1>
      </div>

      {/* Center: Search Field */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <SearchField
          onSearch={onSearch}
          placeholder={
            currentUser.role === 'patient'
              ? (isVi ? 'Tìm kiếm lịch sử khám, chỉ số võng mạc...' : 'Search exam history, retinal metrics...')
              : (isVi ? 'Tìm kiếm bệnh nhân, mã MRN, hồ sơ...' : 'Search patients, MRN, records...')
          }
          className="w-full"
        />
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-3.5">
        <SyncIndicator showLabel={false} />

        {/* Notification Bell with Dropdown Panel */}
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        {/* Notification Drawer (Full category view) */}
        <NotificationCenterDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          notifications={notifications as any}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
          onMarkAsUnread={handleMarkAsUnread}
          onClearAll={handleClearAll}
          onDeleteNotification={handleDeleteNotification}
        />

        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-[#F8F9FA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3478F6]"
          >
            {/* Avatar thumbnail with Online Presence indicator */}
            <div className="relative shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || 'User avatar'}
                  className="h-9 w-9 rounded-xl object-cover border border-[#EAECF0] shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3478F6] text-white font-bold text-xs shadow-xs">
                  {initials}
                </div>
              )}
              {/* Online Presence Indicator on Avatar (Mobile) */}
              <span
                className={`sm:hidden absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${onlinePresenceDotColor}`}
                title={onlinePresenceTooltip}
                aria-label={onlinePresenceTooltip}
              />
            </div>

            {/* Name and Role */}
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#111827] truncate max-w-[130px]">
                  {currentUser.name || (isVi ? 'Người dùng' : 'User')}
                </span>
                {/* Online Status Indicator Dot beside username */}
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${onlinePresenceDotColor}`}
                  title={onlinePresenceTooltip}
                  aria-label={onlinePresenceTooltip}
                />
              </div>
              <div className="text-[11px] font-medium text-[#667085]">
                {roleText}
              </div>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-[#98A2B3] transition-transform duration-150 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Popup */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#EAECF0] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-3 py-2 border-b border-[#EAECF0] mb-1">
                <p className="text-xs font-bold text-[#111827] truncate">
                  {currentUser.name || (isVi ? 'Người dùng' : 'User')}
                </p>
                <p className="text-[11px] text-[#667085] truncate">
                  {currentUser.email || roleText}
                </p>
              </div>

              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('medical-profile');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#4B5563] hover:bg-[#F4F6F8] hover:text-[#111827] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4 text-[#3478F6]" />
                    <span>{isVi ? 'Hồ sơ của tôi' : 'My Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (currentUser.role === 'admin') onNavigate('ai-thresholds');
                      else if (currentUser.role === 'clinic') onNavigate('credit-package');
                      else if (currentUser.role === 'doctor') onNavigate('risk-analytics');
                      else onNavigate('billing');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#4B5563] hover:bg-[#F4F6F8] hover:text-[#111827] transition-colors cursor-pointer"
                  >
                    {currentUser.role === 'patient' || currentUser.role === 'clinic' ? (
                      <CreditCard className="h-4 w-4 text-[#3478F6]" />
                    ) : currentUser.role === 'doctor' ? (
                      <BarChart3 className="h-4 w-4 text-[#3478F6]" />
                    ) : (
                      <Settings className="h-4 w-4 text-[#667085]" />
                    )}
                    <span>
                      {currentUser.role === 'admin'
                        ? (isVi ? 'Cài đặt hệ thống' : 'System Settings')
                        : currentUser.role === 'clinic'
                        ? (isVi ? 'Gói cước & Hạn mức' : 'Quota & Packages')
                        : currentUser.role === 'doctor'
                        ? (isVi ? 'Thống kê & Phân tích' : 'Analytics & Stats')
                        : (isVi ? 'Gói cước & Lượt khám' : 'Credits & Plans')}
                    </span>
                  </button>
                </>
              )}

              {/* Language Switch */}
              <button
                type="button"
                onClick={() => {
                  setLanguage(isVi ? 'en' : 'vi');
                  setIsProfileOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#4B5563] hover:bg-[#F4F6F8] hover:text-[#111827] transition-colors"
              >
                <Languages className="h-4 w-4 text-[#667085]" />
                <span>{isVi ? 'English (EN)' : 'Tiếng Việt (VI)'}</span>
              </button>

              <div className="my-1 border-t border-[#EAECF0]" />

              {/* Log Out */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{isVi ? 'Đăng xuất' : 'Log Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
