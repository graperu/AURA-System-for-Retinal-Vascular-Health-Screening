import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { useLanguage } from './LanguageContext';
import { notificationApi } from '../services/api';
import { eventBus } from '../services/eventBusService';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'SCAN_UPLOADED'
  | 'RESULT_REVIEWED'
  | 'BATCH_STATUS_CHANGED'
  | 'NOTIFICATION_NEW'
  | string;

export type PortalType = 'patient' | 'doctor' | 'clinic' | 'admin' | 'all';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  timestamp: number | string | Date;
  read: boolean;
  isRead?: boolean;
  link?: string;
  linkUrl?: string;
  portal?: PortalType;
}

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Partial<AppNotification> & { title: string; message: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const defaultContextValue: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  addNotification: () => undefined,
  markAsRead: () => undefined,
  markAllAsRead: () => undefined,
  clearNotification: () => undefined,
  clearAll: () => undefined,
};

export const NotificationContext = createContext<NotificationContextType>(defaultContextValue);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { lastEvent } = useRealtimeEvents();
  const { isVi } = useLanguage();

  // Load initial notifications from API / localStorage if available
  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const mapped: AppNotification[] = res.data.map((item: any) => ({
            id: String(item.id || item._id || Math.random()),
            type: item.type || 'info',
            title: item.title || (isVi ? 'Thông báo' : 'Notification'),
            message: item.message || '',
            timestamp: item.createdAt || item.timestamp || Date.now(),
            read: Boolean(item.isRead || item.read),
            link: item.linkUrl || item.link,
            portal: item.portal || 'all',
          }));
          setNotifications(mapped);
        }
      } catch {
        // Fallback or ignore if backend offline / running in mock mode
      }
    };

    void fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

  const addNotification = useCallback(
    (notif: Partial<AppNotification> & { title: string; message: string }) => {
      const newNotif: AppNotification = {
        id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: notif.type || 'info',
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp || Date.now(),
        read: Boolean(notif.read ?? false),
        link: notif.link,
        portal: notif.portal || 'all',
      };

      setNotifications((prev) => {
        // Prevent duplicate IDs
        if (prev.some((item) => item.id === newNotif.id)) {
          return prev;
        }
        return [newNotif, ...prev];
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      void notificationApi.markAsRead(id);
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      void notificationApi.markAllAsRead();
    } catch {
      // ignore
    }
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen to realtime events
  useEffect(() => {
    if (!lastEvent) return;

    const eventType = String(lastEvent.type || '').toUpperCase();
    const data = lastEvent.data || {};

    if (eventType === 'NOTIFICATION_NEW' || eventType === 'NOTIFICATION_CREATED' || eventType === 'NOTIFICATION:NEW') {
      addNotification({
        id: data.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: data.type || data.notificationType || 'NOTIFICATION_NEW',
        title: data.title || (isVi ? 'Thông báo mới' : 'New Notification'),
        message: data.message || data.content || '',
        timestamp: data.timestamp || lastEvent.timestamp || Date.now(),
        read: false,
        link: data.link || data.linkUrl || data.url,
        portal: data.portal || 'all',
      });
    } else if (eventType === 'SCAN_UPLOADED' || eventType === 'SCREENING_CREATED') {
      addNotification({
        id: data.id || `scan-${Date.now()}`,
        type: 'SCAN_UPLOADED',
        title: isVi ? 'Ảnh chụp võng mạc mới' : 'New Retinal Scan Uploaded',
        message: data.patientName
          ? (isVi ? `Bệnh nhân: ${data.patientName} vừa tải lên ảnh mới` : `Patient: ${data.patientName} uploaded a new scan`)
          : (isVi ? 'Một ca chụp mới đã được tải lên thành công' : 'A new scan was successfully uploaded'),
        timestamp: lastEvent.timestamp || Date.now(),
        read: false,
        link: '/doctor/cds-viewer',
        portal: 'doctor',
      });
    } else if (eventType === 'RESULT_REVIEWED' || eventType === 'DOCTOR_REVIEWED') {
      addNotification({
        id: data.id || `rev-${Date.now()}`,
        type: 'RESULT_REVIEWED',
        title: isVi ? 'Kết quả khám đã được thẩm định' : 'Screening Result Reviewed',
        message: data.doctorName
          ? (isVi ? `Bác sĩ ${data.doctorName} đã ký duyệt kết quả` : `Dr. ${data.doctorName} approved your screening`)
          : (isVi ? 'Bác sĩ chuyên khoa đã hoàn tất thẩm định kết quả của bạn' : 'Specialist completed screening review'),
        timestamp: lastEvent.timestamp || Date.now(),
        read: false,
        link: '/patient/scan-history',
        portal: 'patient',
      });
    } else if (eventType === 'BATCH_STATUS_CHANGED' || eventType === 'BATCH_PROGRESS') {
      addNotification({
        id: data.id || `batch-${Date.now()}`,
        type: 'BATCH_STATUS_CHANGED',
        title: isVi ? 'Tiến độ sàng lọc lô phòng khám' : 'Clinic Batch Progress Update',
        message: data.batchId
          ? (isVi ? `Lô ${data.batchId}: Đã xử lý ${data.processedCount || 0}/${data.totalImages || 0} ảnh` : `Batch ${data.batchId}: Processed ${data.processedCount || 0}/${data.totalImages || 0}`)
          : (isVi ? 'Trạng thái xử lý lô khám đã có cập nhật mới' : 'Batch screening status has been updated'),
        timestamp: lastEvent.timestamp || Date.now(),
        read: false,
        link: '/clinic/bulk-batch',
        portal: 'clinic',
      });
    }
  }, [lastEvent, isVi, addNotification]);

  // Listen to EventBus events for system-wide zero-F5 sync
  useEffect(() => {
    const unsub = eventBus.subscribe('*', ({ eventType, payload }: { eventType: string; payload: any }) => {
      if (!eventType) return;
      const typeUpper = String(eventType).toUpperCase();
      const data = payload || {};

      if (typeUpper === 'NOTIFICATION_NEW' || typeUpper === 'NOTIFICATION_CREATED') {
        addNotification({
          id: data.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: data.type || 'NOTIFICATION_NEW',
          title: data.title || (isVi ? 'Thông báo mới' : 'New Notification'),
          message: data.message || '',
          timestamp: data.createdAt || data.timestamp || Date.now(),
          read: false,
          link: data.link,
          portal: data.portal || 'all',
        });
      } else if (typeUpper === 'SCAN_UPLOADED' || typeUpper === 'SCREENING_CREATED') {
        addNotification({
          id: data.scanId || data.id || `scan-${Date.now()}`,
          type: 'SCAN_UPLOADED',
          title: isVi ? 'Ảnh chụp võng mạc mới' : 'New Retinal Scan Uploaded',
          message: data.patientName
            ? (isVi ? `Bệnh nhân: ${data.patientName} vừa tải lên ảnh mới` : `Patient: ${data.patientName} uploaded a new scan`)
            : (isVi ? 'Một ca chụp mới đã được tải lên thành công' : 'A new scan was successfully uploaded'),
          timestamp: data.uploadedAt || Date.now(),
          read: false,
          link: '/doctor/cds-viewer',
          portal: 'doctor',
        });
      } else if (typeUpper === 'RESULT_REVIEWED' || typeUpper === 'DOCTOR_REVIEWED') {
        addNotification({
          id: data.screeningId || data.id || `rev-${Date.now()}`,
          type: 'RESULT_REVIEWED',
          title: isVi ? 'Kết quả khám đã được thẩm định' : 'Screening Result Reviewed',
          message: data.doctorName
            ? (isVi ? `Bác sĩ ${data.doctorName} đã ký duyệt kết quả` : `Dr. ${data.doctorName} approved your screening`)
            : (isVi ? 'Bác sĩ chuyên khoa đã hoàn tất thẩm định kết quả của bạn' : 'Specialist completed screening review'),
          timestamp: data.reviewedAt || Date.now(),
          read: false,
          link: '/patient/scan-history',
          portal: 'patient',
        });
      } else if (typeUpper === 'BATCH_STATUS_CHANGED' || typeUpper === 'BATCH_PROGRESS') {
        addNotification({
          id: data.batchId || data.id || `batch-${Date.now()}`,
          type: 'BATCH_STATUS_CHANGED',
          title: isVi ? 'Tiến độ sàng lọc lô phòng khám' : 'Clinic Batch Progress Update',
          message: data.batchId
            ? (isVi ? `Lô ${data.batchId}: Đã xử lý ${data.processedCount || 0}/${data.totalCount || data.totalImages || 0} ảnh` : `Batch ${data.batchId}: Processed ${data.processedCount || 0}/${data.totalCount || data.totalImages || 0}`)
            : (isVi ? 'Trạng thái xử lý lô khám đã có cập nhật mới' : 'Batch screening status has been updated'),
          timestamp: data.updatedAt || Date.now(),
          read: false,
          link: '/clinic/bulk-batch',
          portal: 'clinic',
        });
      }
    });

    return () => {
      unsub();
    };
  }, [isVi, addNotification]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const contextValue: NotificationContextType = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotification, clearAll]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context || defaultContextValue;
};

/**
 * Headless NotificationManager for robust cross-portal state management & testing
 */
export class NotificationManager {
  private notifications: AppNotification[] = [];
  private listeners: Set<(notifications: AppNotification[], unreadCount: number) => void> = new Set();
  private isVi: boolean;
  private unsubBus: (() => void) | null = null;

  constructor(initialNotifications: AppNotification[] = [], isVi: boolean = true, autoSubscribe: boolean = true) {
    this.notifications = [...initialNotifications];
    this.isVi = isVi;
    if (autoSubscribe) {
      this.subscribeToEventBus();
    }
  }

  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public subscribe(listener: (notifications: AppNotification[], unreadCount: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const unread = this.getUnreadCount();
    const list = this.getNotifications();
    this.listeners.forEach((fn) => {
      try {
        fn(list, unread);
      } catch (err) {
        console.warn('Error in notification listener:', err);
      }
    });
  }

  public addNotification(notif: Partial<AppNotification> & { title: string; message: string }): AppNotification {
    const newNotif: AppNotification = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: notif.type || 'info',
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp || Date.now(),
      read: Boolean(notif.read ?? false),
      link: notif.link,
      portal: notif.portal || 'all',
    };

    if (this.notifications.some((item) => item.id === newNotif.id)) {
      return this.notifications.find((item) => item.id === newNotif.id)!;
    }

    this.notifications = [newNotif, ...this.notifications];
    this.notify();
    return newNotif;
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.notify();
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
  }

  public clearNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  public clearAll() {
    this.notifications = [];
    this.notify();
  }

  public subscribeToEventBus(): () => void {
    if (this.unsubBus) return this.unsubBus;

    this.unsubBus = eventBus.subscribe('*', ({ eventType, payload }: { eventType: string; payload: any }) => {
      this.handleIncomingEvent(eventType, payload);
    });
    return () => this.destroy();
  }

  public handleIncomingEvent(eventType: string, data: any) {
    if (!eventType) return;
    const typeUpper = String(eventType).toUpperCase();
    const isVi = this.isVi;

    if (typeUpper === 'NOTIFICATION_NEW' || typeUpper === 'NOTIFICATION_CREATED' || typeUpper === 'NOTIFICATION:NEW') {
      this.addNotification({
        id: data?.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: data?.type || data?.notificationType || 'NOTIFICATION_NEW',
        title: data?.title || (isVi ? 'Thông báo mới' : 'New Notification'),
        message: data?.message || data?.content || '',
        timestamp: data?.timestamp || Date.now(),
        read: false,
        link: data?.link || data?.linkUrl || data?.url,
        portal: data?.portal || 'all',
      });
    } else if (typeUpper === 'SCAN_UPLOADED' || typeUpper === 'SCREENING_CREATED') {
      this.addNotification({
        id: data?.scanId || data?.id || `scan-${Date.now()}`,
        type: 'SCAN_UPLOADED',
        title: isVi ? 'Ảnh chụp võng mạc mới' : 'New Retinal Scan Uploaded',
        message: data?.patientName
          ? (isVi ? `Bệnh nhân: ${data.patientName} vừa tải lên ảnh mới` : `Patient: ${data.patientName} uploaded a new scan`)
          : (isVi ? 'Một ca chụp mới đã được tải lên thành công' : 'A new scan was successfully uploaded'),
        timestamp: data?.uploadedAt || Date.now(),
        read: false,
        link: '/doctor/cds-viewer',
        portal: 'doctor',
      });
    } else if (typeUpper === 'RESULT_REVIEWED' || typeUpper === 'DOCTOR_REVIEWED') {
      this.addNotification({
        id: data?.screeningId || data?.id || `rev-${Date.now()}`,
        type: 'RESULT_REVIEWED',
        title: isVi ? 'Kết quả khám đã được thẩm định' : 'Screening Result Reviewed',
        message: data?.doctorName
          ? (isVi ? `Bác sĩ ${data.doctorName} đã ký duyệt kết quả` : `Dr. ${data.doctorName} approved your screening`)
          : (isVi ? 'Bác sĩ chuyên khoa đã hoàn tất thẩm định kết quả của bạn' : 'Specialist completed screening review'),
        timestamp: data?.reviewedAt || Date.now(),
        read: false,
        link: '/patient/scan-history',
        portal: 'patient',
      });
    } else if (typeUpper === 'BATCH_STATUS_CHANGED' || typeUpper === 'BATCH_PROGRESS') {
      this.addNotification({
        id: data?.batchId || data?.id || `batch-${Date.now()}`,
        type: 'BATCH_STATUS_CHANGED',
        title: isVi ? 'Tiến độ sàng lọc lô phòng khám' : 'Clinic Batch Progress Update',
        message: data?.batchId
          ? (isVi ? `Lô ${data.batchId}: Đã xử lý ${data.processedCount || 0}/${data.totalCount || data.totalImages || 0} ảnh` : `Batch ${data.batchId}: Processed ${data.processedCount || 0}/${data.totalCount || data.totalImages || 0}`)
          : (isVi ? 'Trạng thái xử lý lô khám đã có cập nhật mới' : 'Batch screening status has been updated'),
        timestamp: data?.updatedAt || Date.now(),
        read: false,
        link: '/clinic/bulk-batch',
        portal: 'clinic',
      });
    }
  }

  public destroy() {
    if (this.unsubBus) {
      this.unsubBus();
      this.unsubBus = null;
    }
    this.listeners.clear();
  }
}

export default useNotifications;
