import React, { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  LogOut,
  Menu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { UserSession } from "../types/auth";
import { notificationApi } from "../services/api";

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
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [toast, setToast] = useState<any | null>(null);
  const primed = React.useRef(false);

  const refresh = async () => {
    const [listRes, countRes] = await Promise.all([
      notificationApi.list(),
      notificationApi.unreadCount(),
    ]);
    if (listRes.success && Array.isArray(listRes.data)) {
      const next = listRes.data;
      setItems((prev) => {
        if (
          primed.current &&
          next.length > 0 &&
          (prev.length === 0 || next[0]?.id !== prev[0]?.id)
        ) {
          setToast(next[0]);
          window.setTimeout(() => setToast(null), 6000);
        }
        primed.current = true;
        return next;
      });
    }
    if (countRes.success && countRes.data)
      setUnreadCount(countRes.data.count || 0);
  };

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(t);
  }, []);

  const handleOpenNotif = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      await notificationApi.readAll();
      setUnreadCount(0);
      void refresh();
    }
  };

  const iconFor = (type: string) => {
    if (type === "CRITICAL_ALERT" || type === "LOW_CREDIT")
      return AlertTriangle;
    if (type === "DOCTOR_MESSAGE") return MessageSquare;
    if (type === "APPOINTMENT_REMINDER") return Bell;
    return CheckCircle2;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      {toast && (
        <div className="fixed top-20 right-6 z-[60] max-w-sm bg-white border-2 border-cyan-500 rounded-2xl p-3 shadow-2xl text-xs">
          <p className="font-bold text-slate-900">{toast.title}</p>
          <p className="text-slate-600 mt-1">{toast.body}</p>
          <p className="text-[10px] text-cyan-700 mt-1">
            Kênh: {toast.channels}
          </p>
        </div>
      )}
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white">
            <Eye className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              AURA
            </span>
            <p className="truncate text-xs font-medium text-slate-500">
              Sức khỏe mạch máu võng mạc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 xl:flex">
            <ShieldCheck className="h-4 w-4" />
            Phiên làm việc an toàn (HIPAA)
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => void handleOpenNotif()}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-cyan-700" /> Trung tâm thông
                    báo (FR-9)
                  </span>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400">
                      Chưa có thông báo.
                    </p>
                  ) : (
                    items.map((notif) => {
                      const Icon = iconFor(notif.type);
                      return (
                        <div
                          key={notif.id}
                          className={`p-3.5 flex items-start gap-3 ${notif.read ? "" : "bg-cyan-50/40"}`}
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
                            {notif.type === "LOW_CREDIT" ? (
                              <CreditCard className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <p className="text-xs font-bold text-slate-900">
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono-data whitespace-nowrap">
                                {notif.createdAt
                                  ? new Date(
                                      notif.createdAt,
                                    ).toLocaleTimeString("vi-VN")
                                  : ""}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {notif.body}
                            </p>
                            <p className="text-[10px] text-cyan-700 mt-0.5">
                              {notif.channels}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="max-w-48 truncate text-sm font-bold text-slate-800">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500">
              {roleLabels[currentUser.role]}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
