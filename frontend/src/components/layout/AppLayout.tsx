import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserSession } from '../../types/auth';
import { notificationApi, chatApi } from '../../services/api';
import { realtimeBus } from '../../services/realtimeService';
import { stompClient } from '../../services/websocketService';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransitionVariants } from '../../utils/motion';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';
import { useLanguage } from '../../context/LanguageContext';

export interface AppLayoutProps {
  currentUser: UserSession;
  activeSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  title?: string;
  onSearch?: (query: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  activeSection,
  onSelectSection,
  onLogout,
  children,
  title,
  onSearch,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const prefersReducedMotion = useAuraReducedMotion();
  const { isVi } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    notificationApi
      .getUnreadCount()
      .then((res) => {
        if (isMounted && res.success && res.data && typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch(() => {});

    chatApi
      .getUnreadCount()
      .then((res) => {
        if (isMounted && res.success && res.data && typeof res.data.unreadCount === 'number') {
          setUnreadChatCount(res.data.unreadCount);
        }
      })
      .catch(() => {});

    // STOMP WebSocket Chat Subscription for current user (R5, AC-5)
    let unsubStompChat: (() => void) | undefined;
    let unsubStompMsg: (() => void) | undefined;
    if (currentUser?.id) {
      try {
        stompClient.connect();
        unsubStompChat = stompClient.subscribe(`/topic/chat.${currentUser.id}`, (data: any) => {
          if (isMounted && data?.senderId !== currentUser.id) {
            setUnreadChatCount((prev) => prev + 1);
          }
        });
        unsubStompMsg = stompClient.subscribe(`/topic/messages.${currentUser.id}`, (data: any) => {
          if (isMounted && data?.senderId !== currentUser.id) {
            setUnreadChatCount((prev) => prev + 1);
          }
        });
      } catch (err) {
        console.warn('STOMP chat subscription error:', err);
      }
    }

    const unsubChatBus = realtimeBus.subscribe(['chat:new', 'chat:message', 'MESSAGE_RECEIVED'], (event: any) => {
      const payload = event?.data || event?.payload || event;
      if (isMounted && payload?.senderId && payload?.senderId === currentUser?.id) {
        return;
      }
      if (isMounted) setUnreadChatCount((prev) => prev + 1);
    });
    const unsubChatRead = realtimeBus.subscribe(['chat:read', 'CHAT_READ'], (event) => {
      if (!isMounted) return;
      if (typeof event?.data?.unreadCount === 'number') {
        setUnreadChatCount(event.data.unreadCount);
      } else {
        setUnreadChatCount(0);
      }
    });

    const unsubNotif = realtimeBus.subscribe('NOTIFICATION_CREATED', () => {
      if (isMounted) setUnreadCount((prev) => prev + 1);
    });
    const unsubScreening = realtimeBus.subscribe('screening:created', () => {
      if (isMounted) setUnreadCount((prev) => prev + 1);
    });
    const unsubRead = realtimeBus.subscribe('NOTIFICATION_READ', (event) => {
      if (!isMounted) return;
      if (typeof event?.data?.remainingUnread === 'number') {
        setUnreadCount(event.data.remainingUnread);
      } else {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
    const unsubUnread = realtimeBus.subscribe('NOTIFICATION_UNREAD', (event) => {
      if (!isMounted) return;
      if (typeof event?.data?.remainingUnread === 'number') {
        setUnreadCount(event.data.remainingUnread);
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    });
    const unsubCleared = realtimeBus.subscribe('NOTIFICATION_CLEARED', (event) => {
      if (!isMounted) return;
      if (typeof event?.data?.remainingUnread === 'number') {
        setUnreadCount(event.data.remainingUnread);
      } else {
        setUnreadCount(0);
      }
    });

    return () => {
      isMounted = false;
      unsubNotif();
      unsubScreening();
      unsubRead();
      unsubUnread();
      unsubCleared();
      unsubChatBus();
      unsubChatRead();
      unsubStompChat?.();
      unsubStompMsg?.();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeSection === 'consultation' || activeSection === 'consultation-chat') {
      setUnreadChatCount(0);
    }
  }, [activeSection]);

  const computedTitle = useMemo(() => {
    if (title && title.trim()) return title;
    
    // Clinic titles
    if (currentUser.role === 'clinic') {
      switch (activeSection) {
        case 'dashboard':
        case 'overview':
          return isVi ? 'Tổng quan phòng khám' : 'Clinic Dashboard';
        case 'patient-list':
          return isVi ? 'Danh sách bệnh nhân cơ sở' : 'Clinic Patient Directory';
        case 'bulk-batch':
          return isVi ? 'Sàng lọc vi mạch theo lô' : 'Bulk Batch Screening';
        case 'scan-history':
          return isVi ? 'Kết quả & Lịch sử sàng lọc' : 'Screening Results & History';
        case 'doctors-manage':
          return isVi ? 'Quản lý bác sĩ cơ sở' : 'Clinic Staff & Doctors';
        case 'appointments':
          return isVi ? 'Lịch hẹn & Tiếp nhận bệnh nhân' : 'Appointments & Reception';
        case 'campaign-analytics':
          return isVi ? 'Báo cáo phân tích chiến dịch' : 'Campaign Analytics';
        case 'notifications':
          return isVi ? 'Trung tâm thông báo cơ sở' : 'Facility Notifications';
        case 'credit-package':
        case 'billing':
          return isVi ? 'Gói cước & Hạn mức khám' : 'Screening Credits & Billing';
        default:
          return isVi ? 'Không gian phòng khám AURA' : 'AURA Clinic Portal';
      }
    }
    
    // Doctor titles
    if (currentUser.role === 'doctor') {
      switch (activeSection) {
        case 'dashboard':
          return isVi ? 'Bàn làm việc bác sĩ' : 'Doctor Worklist';
        case 'cds-viewer':
          return isVi ? 'Chẩn đoán vi mạch võng mạc CDS' : 'Retinal CDS Diagnostic Viewer';
        case 'patient-list':
          return isVi ? 'Hồ sơ bệnh nhân phụ trách' : 'Assigned Patients';
        case 'reports':
          return isVi ? 'Báo cáo & Kết quả thẩm định' : 'Clinical Reports & Reviews';
        case 'appointments':
          return isVi ? 'Lịch khám & Hội chẩn' : 'Appointments & Consultations';
        case 'consultation':
        case 'consultation-chat':
          return isVi ? 'Phòng tư vấn Telemedicine' : 'Telemedicine Consultation';
        case 'notifications':
          return isVi ? 'Thông báo chuyên môn' : 'Clinical Notifications';
        default:
          return isVi ? 'Bàn làm việc bác sĩ' : 'Doctor Portal';
      }
    }
    
    // Patient titles
    if (currentUser.role === 'patient') {
      switch (activeSection) {
        case 'overview':
        case 'dashboard':
          return isVi ? 'Tổng quan sức khỏe võng mạc' : 'Vascular Health Overview';
        case 'upload-scan':
          return isVi ? 'Sàng lọc võng mạc AI' : 'AI Retinal Screening';
        case 'scan-history':
        case 'screening-result':
          return isVi ? 'Kết quả & Lịch sử sàng lọc' : 'Screening History & Results';
        case 'appointment':
        case 'appointments':
          return isVi ? 'Lịch hẹn khám' : 'My Appointments';
        case 'consultation':
        case 'consultation-chat':
          return isVi ? 'Tư vấn với bác sĩ' : 'Doctor Consultation';
        case 'medical-profile':
          return isVi ? 'Hồ sơ y tế điện tử' : 'Medical Health Profile';
        case 'billing':
          return isVi ? 'Gói cước & Lượt khám' : 'Screening Passes & Credits';
        case 'notifications':
          return isVi ? 'Thông báo cá nhân' : 'Personal Notifications';
        default:
          return isVi ? 'Cổng bệnh nhân AURA' : 'AURA Patient Portal';
      }
    }

    // Admin titles
    if (currentUser.role === 'admin') {
      switch (activeSection) {
        case 'dashboard':
          return isVi ? 'Trung tâm quản trị AURA' : 'AURA Admin Central';
        case 'user-management':
          return isVi ? 'Quản lý người dùng' : 'User Management';
        case 'clinic-approvals':
          return isVi ? 'Thẩm định cơ sở y tế' : 'Clinic Approvals';
        case 'screenings':
          return isVi ? 'Giám sát ca sàng lọc toàn hệ thống' : 'System-wide Screenings';
        case 'rbac-matrix':
          return isVi ? 'Phân quyền & Vai trò' : 'RBAC Matrix';
        case 'audit-logs':
          return isVi ? 'Nhật ký kiểm toán hệ thống' : 'System Audit Logs';
        case 'ai-thresholds':
          return isVi ? 'Cấu hình ngưỡng AI' : 'AI Diagnostic Thresholds';
        case 'notifications':
          return isVi ? 'Cấu hình thông báo' : 'Notification Templates';
        default:
          return isVi ? 'Trung tâm quản trị AURA' : 'AURA Admin Central';
      }
    }

    return isVi ? 'Không gian làm việc AURA' : 'AURA Medical Workspace';
  }, [title, currentUser.role, activeSection, isVi]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans text-[#111827] antialiased selection:bg-[#3478F6] selection:text-white">
      {/* Fixed Desktop Left Sidebar / Mobile Drawer */}
      <Sidebar
        currentRole={currentUser.role}
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        onLogout={onLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        unreadChatCount={unreadChatCount}
        unreadNotificationCount={unreadCount}
      />

      {/* Main Content Viewport Container */}
      <div className="flex min-h-screen flex-col lg:pl-[236px] transition-all duration-200">
        {/* Fixed / Sticky Topbar Header */}
        <Topbar
          currentUser={currentUser}
          title={computedTitle}
          onLogout={onLogout}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={onSelectSection}
          onSearch={onSearch}
          unreadChatCount={unreadChatCount}
        />

        {/* Main Padded Canvas */}
        <main className="flex-1 p-5 sm:p-7 w-full max-w-[1600px] mx-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              custom={prefersReducedMotion}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
