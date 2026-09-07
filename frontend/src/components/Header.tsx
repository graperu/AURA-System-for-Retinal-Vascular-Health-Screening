import React, { useState, useEffect } from "react";
import {
  Bell,
  Eye,
  LogOut,
  Menu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  X,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { UserSession } from "../types/auth";
import { notificationApi, getAccessToken } from "../services/api";

interface HeaderProps {
  currentUser: UserSession;
  onLogout: () => void;
  onOpenMenu: () => void;
  onOpenChat?: () => void;
}

const roleLabels = {
  patient: "Bệnh nhân",
  doctor: "Bác sĩ",
  clinic: "Phòng khám",
  admin: "Quản trị viên",
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenMenu,
  onOpenChat,
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
      console.warn("Could not fetch notifications:", e);
    }
  };

  useEffect(() => {
    void loadNotifications();

    // Setup SSE Stream (FR-9)
    let eventSource: EventSource | null = null;
    try {
      const streamUrl = notificationApi.getStreamUrl();
      const token = getAccessToken();
      const sseUrl = token
        ? `${streamUrl}?token=${encodeURIComponent(token)}`
        : streamUrl;

      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener("NOTIFICATION", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount((prev) => prev + 1);
          // Show realtime Toast
          setActiveToast(data);
          setTimeout(() => {
            setActiveToast((curr: any) => (curr?.id === data.id ? null : curr));
          }, 6000);
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {
      console.warn("SSE stream setup error:", e);
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
      console.warn("Could not mark notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn("Could not mark all as read:", e);
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (type === "AI_READY")
      return <Sparkles className="h-4 w-4 text-cyan-600" />;
    if (type === "BILLING")
      return <CreditCard className="h-4 w-4 text-emerald-600" />;
    if (severity === "CRITICAL" || severity === "WARNING")
      return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    return <CheckCircle2 className="h-4 w-4 text-cyan-700" />;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      {/* Toast Alert popup on SSE arrival */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm rounded-2xl border border-cyan-300 bg-white p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700 shrink-0">
              {getIcon(activeToast.type, activeToast.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {activeToast.title}
                </h4>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Đóng toast"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-tight line-clamp-2">
                {activeToast.message}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">
                  Thông báo mới
                </span>
                <button
                  onClick={() => {
                    handleMarkAsRead(activeToast.id);
                    setActiveToast(null);
                  }}
                  className="text-[10px] font-bold text-cyan-700 hover:underline"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                AURA
              </span>
              <span className="hidden rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-800 sm:inline">
                Hỗ trợ sàng lọc AI
              </span>
            </div>
            <p className="truncate text-xs font-medium text-slate-500">
              Sức khỏe mạch máu võng mạc
            </p>
          </div>
        </div>

        {/* Right Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 xl:flex">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Phiên làm việc an toàn (HIPAA)
          </div>

          {/* Notification Bell with Dropdown (FR-9) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-cyan-700" /> Trung Tâm Thông
                    Báo (FR-9)
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-cyan-700 hover:underline"
                      >
                        Đọc tất cả
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                      aria-label="Đóng menu thông báo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                          !notif.isRead ? "bg-cyan-50/40" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            notif.type === "AI_READY"
                              ? "bg-cyan-100 text-cyan-800"
                              : notif.type === "DOCTOR_REVIEW"
                                ? "bg-emerald-100 text-emerald-800"
                                : notif.type === "BILLING"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {getIcon(notif.type, notif.severity)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono-data">
                              {notif.createdAt
                                ? new Date(notif.createdAt).toLocaleTimeString(
                                    "vi-VN",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0 mt-2"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center flex items-center justify-between px-4">
                  <span className="text-[10px] text-slate-500 font-medium">
                    {unreadCount} thông báo chưa đọc
                  </span>
                  <button
                    onClick={loadNotifications}
                    className="text-[11px] font-semibold text-cyan-800 hover:underline"
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge */}
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="max-w-48 truncate text-sm font-bold text-slate-800">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500">
              {roleLabels[currentUser.role]}
            </p>
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
