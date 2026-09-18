import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserSession } from '../../types/auth';
import { notificationApi } from '../../services/api';
import { realtimeBus } from '../../services/realtimeService';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransitionVariants } from '../../utils/motion';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

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
  const prefersReducedMotion = useAuraReducedMotion();

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
    };
  }, []);

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
        unreadNotificationCount={unreadCount}
      />

      {/* Main Content Viewport Container */}
      <div className="flex min-h-screen flex-col lg:pl-[236px] transition-all duration-200">
        {/* Fixed / Sticky Topbar Header */}
        <Topbar
          currentUser={currentUser}
          title={title}
          onLogout={onLogout}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={onSelectSection}
          onSearch={onSearch}
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
