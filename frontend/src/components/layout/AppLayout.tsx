import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserSession } from '../../types/auth';
import { notificationApi } from '../../services/api';
import { realtimeBus } from '../../services/realtimeService';
import { stompClient } from '../../services/websocketService';
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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
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

    // STOMP WebSocket Chat Subscription for current user (R5, AC-5)
    let unsubStompChat: (() => void) | undefined;
    let unsubStompMsg: (() => void) | undefined;
    if (currentUser?.id) {
      try {
        stompClient.connect();
        unsubStompChat = stompClient.subscribe(`/topic/chat.${currentUser.id}`, () => {
          if (isMounted) setUnreadChatCount((prev) => prev + 1);
        });
        unsubStompMsg = stompClient.subscribe(`/topic/messages.${currentUser.id}`, () => {
          if (isMounted) setUnreadChatCount((prev) => prev + 1);
        });
      } catch (err) {
        console.warn('STOMP chat subscription error:', err);
      }
    }

    const unsubChatBus = realtimeBus.subscribe(['chat:new', 'chat:message', 'MESSAGE_RECEIVED'], () => {
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
          title={title}
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
