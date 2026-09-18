import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  UploadCloud,
  CheckCircle2,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { type NotificationItem, MOCK_NOTIFICATIONS } from './mockNotifications';

export type { NotificationItem } from './mockNotifications';
export { MOCK_NOTIFICATIONS } from './mockNotifications';

export interface NotificationBellProps {
  notifications?: any[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (item: any) => void;
  onOpenDrawer?: () => void;
  className?: string;
}

export const formatRelativeTime = (
  timestamp: string | number | Date,
  isVi = true
): string => {
  try {
    const date =
      typeof timestamp === 'string' || typeof timestamp === 'number'
        ? new Date(timestamp)
        : timestamp;
    if (isNaN(date.getTime())) return '';
    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return isVi ? 'Vừa xong' : 'Just now';
    }
    if (diffMins < 60) {
      return isVi ? `${diffMins} phút trước` : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return isVi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return isVi ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    }
    return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications: propNotifications,
  unreadCount: propUnreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onOpenDrawer,
  className = '',
}) => {
  const { isVi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(
    propNotifications || MOCK_NOTIFICATIONS
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with propNotifications if provided and changed
  useEffect(() => {
    if (propNotifications) {
      setItems(propNotifications);
    }
  }, [propNotifications]);

  const effectiveUnreadCount =
    propUnreadCount !== undefined
      ? propUnreadCount
      : items.filter((n) => !n.read && !n.isRead).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true, isRead: true })));
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read && !item.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true, isRead: true } : n))
      );
      if (onMarkAsRead) {
        onMarkAsRead(item.id);
      }
    }
    setIsOpen(false);
    if (onNotificationClick) {
      onNotificationClick(item);
    }
  };

  const handleItemMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
    );
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const getNotificationIcon = (type?: string) => {
    const tUpper = String(type || '').toUpperCase();
    if (
      tUpper.includes('ALERT') ||
      tUpper.includes('HIGH_RISK') ||
      tUpper.includes('ERROR') ||
      tUpper.includes('CRITICAL')
    ) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }
    if (tUpper.includes('SCAN') || tUpper.includes('UPLOAD')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
          <UploadCloud className="h-4 w-4" />
        </div>
      );
    }
    if (tUpper.includes('RESULT') || tUpper.includes('REVIEW')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      );
    }
    if (tUpper.includes('BATCH')) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
          <Layers className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FE] text-[#3478F6] border border-[#D0E2FF]">
        <Bell className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAECF0] bg-white text-[#667085] hover:bg-[#F8F9FA] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3478F6]"
        aria-label={isVi ? 'Thông báo' : 'Notifications'}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {effectiveUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3478F6] px-1 text-[10px] font-bold text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3478F6] opacity-75" />
            <span className="relative">
              {effectiveUnreadCount > 9 ? '9+' : effectiveUnreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#EAECF0] bg-white shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header dropdown */}
          <div className="flex items-center justify-between border-b border-[#EAECF0] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111827]">
                {isVi ? 'Thông báo' : 'Notifications'}
              </h3>
              {effectiveUnreadCount > 0 && (
                <span className="rounded-full bg-[#EEF4FE] px-2 py-0.5 text-[11px] font-bold text-[#3478F6]">
                  {effectiveUnreadCount} {isVi ? 'mới' : 'new'}
                </span>
              )}
            </div>

            {effectiveUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3478F6] hover:text-[#285ec4] hover:underline transition-colors"
                title={isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{isVi ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}</span>
              </button>
            )}
          </div>

          {/* List of Notifications: bg-white, border border-[#EAECF0], shadow-lg, rounded-2xl, max-h-80 overflow-y-auto */}
          <div className="bg-white max-h-80 overflow-y-auto divide-y divide-[#EAECF0]">
            {items.length === 0 ? (
              <div className="py-10 text-center text-[#667085] px-4">
                <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6F8]">
                  <Bell className="h-5 w-5 text-[#98A2B3]" />
                </div>
                <p className="text-xs font-semibold text-[#111827]">
                  {isVi ? 'Không có thông báo nào' : 'No notifications'}
                </p>
                <p className="mt-1 text-[11px] text-[#667085]">
                  {isVi
                    ? 'Bạn sẽ nhận thông báo khi có ca khám mới hoặc kết quả thẩm định'
                    : 'You will receive updates on screenings and clinical reviews'}
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isUnread = !item.read && !item.isRead;
                const displayTitle = isVi ? item.title : item.titleEn || item.title;
                const displayMessage = isVi ? item.message : item.messageEn || item.message;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      isUnread
                        ? 'bg-[#F8FAFF] hover:bg-[#EEF4FE]/80 border-l-4 border-[#3478F6]'
                        : 'bg-white hover:bg-[#F8F9FA]'
                    }`}
                  >
                    {/* Icon */}
                    {getNotificationIcon(item.type)}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-bold text-[#111827]'
                              : 'font-medium text-[#4B5563]'
                          }`}
                        >
                          {displayTitle}
                        </h4>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-[#98A2B3]">
                            {formatRelativeTime(item.timestamp, isVi)}
                          </span>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleItemMarkAsRead(e, item.id)}
                              className="p-1 rounded-md text-[#98A2B3] hover:text-[#3478F6] hover:bg-white transition-colors"
                              title={isVi ? 'Đánh dấu đã đọc' : 'Mark as read'}
                              aria-label={isVi ? 'Đánh dấu đã đọc' : 'Mark as read'}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#667085] mt-1 line-clamp-2 leading-relaxed">
                        {displayMessage}
                      </p>

                      {item.link && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#3478F6] hover:underline">
                          <span>{isVi ? 'Xem chi tiết' : 'View details'}</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#EAECF0] bg-[#FAFAFA] px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] text-[#98A2B3] font-medium">
              AURA Retinal Screening System
            </span>
            {onOpenDrawer && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDrawer();
                }}
                className="text-[11px] font-medium text-[#3478F6] hover:underline cursor-pointer"
              >
                {isVi ? 'Xem tất cả' : 'View all'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
