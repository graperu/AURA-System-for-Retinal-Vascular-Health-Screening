import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  X,
  ExternalLink,
  Check,
  CheckCheck,
  Trash2,
  MailCheck,
  Mail,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { drawerRightVariants, modalBackdropVariants } from '../utils/motion';
import { Pagination } from './ui/Pagination';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  linkUrl?: string;
  link?: string;
  titleEn?: string;
  messageEn?: string;
}

export interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notif: NotificationItem) => void;
  onMarkAsUnread?: (id: string) => void;
  onClearAll?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export type NotificationCategoryTab = 'ALL' | 'SCAN_RESULTS' | 'DOCTOR_REVIEWS' | 'SYSTEM_ALERTS';

export function isNotificationInCategory(
  n: NotificationItem,
  category: NotificationCategoryTab
): boolean {
  if (category === 'ALL') return true;

  const typeUpper = (n.type || '').toUpperCase();
  const titleUpper = (n.title || '').toUpperCase();

  if (category === 'SCAN_RESULTS') {
    // Exact token matching for OCT to prevent falsely matching DOCTOR
    const isOct = typeUpper === 'OCT' || typeUpper.split('_').includes('OCT');
    // Word boundary or specific medical phrases for 'ẢNH' to prevent matching CẢNH BÁO
    const hasImagePhrase =
      titleUpper.includes('ẢNH CHỤP') ||
      titleUpper.includes('ẢNH ĐÁY MẮT') ||
      titleUpper.includes('ẢNH VÕNG MẠC') ||
      /(?:^|\s)ảnh(?:\s|$)/i.test(titleUpper);

    // Ensure that Doctor notifications (DOCTOR_REVIEWED, DOCTOR_ASSIGNED) ONLY appear in DOCTOR_REVIEWS (and ALL),
    // and System Alerts (CẢNH BÁO...) ONLY appear in SYSTEM_ALERTS (and ALL), never bleeding into SCAN_RESULTS.
    const isDoctor =
      typeUpper.includes('DOCTOR') ||
      titleUpper.includes('BÁC SĨ') ||
      titleUpper.includes('THẨM ĐỊNH');
    const isSystemAlert =
      typeUpper.includes('ALERT') ||
      typeUpper.includes('SECURITY') ||
      typeUpper.includes('BILLING') ||
      titleUpper.includes('CẢNH BÁO') ||
      titleUpper.includes('HỆ THỐNG');

    if (isDoctor || isSystemAlert) {
      return false;
    }

    return (
      typeUpper.includes('SCAN') ||
      typeUpper.includes('AI') ||
      typeUpper.includes('SCREENING') ||
      typeUpper.includes('IMAGE') ||
      isOct ||
      typeUpper.includes('FUNDUS') ||
      hasImagePhrase ||
      titleUpper.includes('SCAN') ||
      titleUpper.includes('SÀNG LỌC')
    );
  }

  if (category === 'DOCTOR_REVIEWS') {
    return (
      typeUpper.includes('DOCTOR') ||
      typeUpper.includes('REVIEW') ||
      typeUpper.includes('CONSULT') ||
      typeUpper.includes('NOTE') ||
      typeUpper.includes('OPINION') ||
      typeUpper.includes('CLINICAL') ||
      titleUpper.includes('BÁC SĨ') ||
      titleUpper.includes('THẨM ĐỊNH') ||
      titleUpper.includes('TƯ VẤN')
    );
  }

  if (category === 'SYSTEM_ALERTS') {
    return (
      typeUpper.includes('SYSTEM') ||
      typeUpper.includes('ALERT') ||
      typeUpper.includes('BILLING') ||
      typeUpper.includes('CREDIT') ||
      typeUpper.includes('BATCH') ||
      typeUpper.includes('USER') ||
      typeUpper.includes('ROLE') ||
      typeUpper.includes('AUTH') ||
      typeUpper.includes('SECURITY') ||
      titleUpper.includes('CẢNH BÁO') ||
      titleUpper.includes('HỆ THỐNG') ||
      titleUpper.includes('GÓI') ||
      titleUpper.includes('LÔ')
    );
  }

  return true;
}

export function filterNotifications(
  items: NotificationItem[],
  tab: NotificationCategoryTab,
  unreadOnly: boolean = false
): NotificationItem[] {
  return items.filter((n) => {
    const isItemRead = Boolean(n.isRead || n.read);
    if (unreadOnly && isItemRead) return false;
    return isNotificationInCategory(n, tab);
  });
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onMarkAsUnread,
  onClearAll,
  onDeleteNotification,
}) => {
  const { t, isVi, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<NotificationCategoryTab>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [drawerPage, setDrawerPage] = useState<number>(1);
  const [drawerPageSize] = useState<number>(6);

  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, activeTab, unreadOnly);
  }, [notifications, activeTab, unreadOnly]);

  useEffect(() => {
    setDrawerPage(1);
  }, [activeTab, unreadOnly]);

  const totalDrawerPages = Math.max(1, Math.ceil(filteredNotifications.length / drawerPageSize));
  const paginatedNotifications = useMemo(() => {
    const start = (drawerPage - 1) * drawerPageSize;
    return filteredNotifications.slice(start, start + drawerPageSize);
  }, [filteredNotifications, drawerPage, drawerPageSize]);

  const getNotificationIcon = (type?: string) => {
    const tUpper = (type || '').toUpperCase();
    if (tUpper.includes('AI') || tUpper.includes('SCREENING')) {
      return (
        <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (tUpper.includes('DOCTOR') || tUpper.includes('REVIEW')) {
      return (
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
      );
    }
    if (tUpper.includes('CONSULT') || tUpper.includes('CHAT')) {
      return (
        <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    if (tUpper.includes('BILLING') || tUpper.includes('CREDIT')) {
      return (
        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
          <CreditCard className="w-4 h-4" />
        </div>
      );
    }
    if (tUpper.includes('BATCH')) {
      return (
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
          <Activity className="w-4 h-4" />
        </div>
      );
    }
    if (tUpper.includes('WARN') || tUpper.includes('ALERT')) {
      return (
        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <motion.div
              variants={drawerRightVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col pointer-events-auto"
            >
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900" title={isVi ? "Trung Tâm Thông Báo" : "Notification Center"}>
                    {t('header.notificationCenter', isVi ? 'Trung Tâm Thông Báo' : 'Notification Center')}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono-data">
                      {unreadCount} {t('header.unread')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isVi
                    ? 'Cập nhật lâm sàng & sự kiện hệ thống thời gian thực'
                    : 'Real-time clinical updates & system alerts'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clinical Category Tabs */}
          <div className="px-5 pt-3 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t('header.all', isVi ? 'Tất cả' : 'All')} ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SCAN_RESULTS')}
                title={isVi ? "Kết quả chụp" : "Scan Results"}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'SCAN_RESULTS'
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t('header.scanResults', isVi ? 'Kết quả chụp' : 'Scan Results')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DOCTOR_REVIEWS')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'DOCTOR_REVIEWS'
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t('header.doctorReviews', isVi ? 'Bác sĩ thẩm định' : 'Doctor Reviews')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SYSTEM_ALERTS')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'SYSTEM_ALERTS'
                    ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t('header.systemAlerts', isVi ? 'Cảnh báo hệ thống' : 'System Alerts')}
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="py-2 flex items-center justify-between border-t border-slate-100 text-xs">
              {/* Unread Filter Toggle */}
              <button
                type="button"
                onClick={() => setUnreadOnly((prev) => !prev)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  unreadOnly
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>{t('header.unread')} ({unreadCount})</span>
              </button>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[11px] font-medium text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t('header.markAllAsRead')}</span>
                  </button>
                )}

                {notifications.length > 0 && onClearAll && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t('header.clearAll')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-400">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">
                  {t('header.noNotifications')}
                </p>
              </div>
              ) : (
                paginatedNotifications.map((item) => {
                const isItemRead = Boolean(item.isRead || item.read);
                const displayTitle =
                  language === 'en' && item.titleEn ? item.titleEn : item.title;
                const displayMessage =
                  language === 'en' && item.messageEn ? item.messageEn : item.message;

                return (
                  <div
                    key={item.id}
                    onClick={() => onNotificationClick(item)}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                      !isItemRead
                        ? 'bg-teal-50/40 hover:bg-teal-50/70 border border-teal-100/80 my-1 shadow-2xs'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(item.type)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs truncate ${
                              !isItemRead
                                ? 'font-bold text-slate-900'
                                : 'font-medium text-slate-700'
                            }`}
                          >
                            {displayTitle}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono-data shrink-0">
                            {new Date(item.createdAt || Date.now()).toLocaleTimeString(
                              language === 'en' ? 'en-US' : 'vi-VN',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                          {displayMessage}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-teal-700 font-semibold flex items-center gap-1 hover:underline">
                            <span>{isVi ? 'Xem chi tiết' : 'View details'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>

                          <div className="flex items-center gap-2">
                            {!isItemRead ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(item.id);
                                }}
                                className="text-slate-400 hover:text-teal-700 font-medium cursor-pointer flex items-center gap-0.5"
                                title={t('header.markAllAsRead')}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isVi ? 'Đã đọc' : 'Read'}</span>
                              </button>
                            ) : (
                              onMarkAsUnread && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsUnread(item.id);
                                  }}
                                  className="text-slate-400 hover:text-teal-700 font-medium cursor-pointer flex items-center gap-0.5"
                                  title={t('header.markAsUnread')}
                                >
                                  <MailCheck className="w-3 h-3" />
                                  <span>{t('header.markAsUnread')}</span>
                                </button>
                              )
                            )}

                            {onDeleteNotification && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(item.id);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Pagination */}
          {filteredNotifications.length > drawerPageSize && (
            <div className="p-3 border-t border-slate-100 bg-white">
              <Pagination
                currentPage={drawerPage}
                totalPages={totalDrawerPages}
                totalItems={filteredNotifications.length}
                pageSize={drawerPageSize}
                showSizeChanger={false}
                onPageChange={setDrawerPage}
                itemLabel={isVi ? 'thông báo' : 'notifications'}
              />
            </div>
          )}

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              AURA Health Notification System v1.0
            </span>
          </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
