import React from "react";
import {
  LayoutDashboard,
  UploadCloud,
  Eye,
  History,
  MessageSquare,
  CreditCard,
  UserCog,
  Users,
  Activity,
  FileSpreadsheet,
  Settings,
  FileText,
  ShieldCheck,
  LucideIcon,
  Sparkles,
} from "lucide-react";
import { UserRole } from "../types/cds";

interface SideNavBarProps {
  currentRole: UserRole | string;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

const patientNavGroups: NavGroup[] = [
  {
    groupTitle: "TỔNG QUAN",
    items: [
      { id: "dashboard", label: "Tổng quan sức khỏe", icon: LayoutDashboard },
    ],
  },
  {
    groupTitle: "SÀNG LỌC VÕNG MẠC",
    items: [
      { id: "upload-scan", label: "Phân tích ảnh mới", icon: UploadCloud },
      { id: "cds-viewer", label: "Bản đồ nhiệt & XAI", icon: Eye },
      { id: "scan-history", label: "Lịch sử & Báo cáo", icon: History },
    ],
  },
  {
    groupTitle: "CHĂM SÓC & TƯ VẤN",
    items: [
      { id: "consultation", label: "Tư vấn Bác sĩ", icon: MessageSquare },
      { id: "medical-profile", label: "Hồ sơ y tế & Tiền sử", icon: UserCog },
    ],
  },
  {
    groupTitle: "TÀI KHOẢN & DỊCH VỤ",
    items: [
      { id: "billing", label: "Nạp lượt & Giao dịch", icon: CreditCard },
    ],
  },
];

const doctorNavGroups: NavGroup[] = [
  {
    groupTitle: "CHẨN ĐOÁN LÂM SÀNG",
    items: [
      { id: "cds-viewer", label: "Bàn chẩn đoán ảnh CDS", icon: Eye },
      { id: "patient-list", label: "Danh sách bệnh nhân", icon: Users },
    ],
  },
  {
    groupTitle: "PHÂN TÍCH & BÁO CÁO",
    items: [
      { id: "risk-analytics", label: "Thống kê nguy cơ", icon: Activity },
      { id: "reports", label: "Báo cáo y khoa & Ký duyệt", icon: FileSpreadsheet },
    ],
  },
  {
    groupTitle: "GIAO TIẾP",
    items: [
      { id: "consultation", label: "Trao đổi với bệnh nhân", icon: MessageSquare },
    ],
  },
];

const clinicNavGroups: NavGroup[] = [
  {
    groupTitle: "CHIẾN DỊCH TẦM SOÁT",
    items: [
      { id: "bulk-batch", label: "Sàng lọc hàng loạt (≥100)", icon: UploadCloud },
      { id: "campaign-analytics", label: "Báo cáo chiến dịch", icon: LayoutDashboard },
    ],
  },
  {
    groupTitle: "NHÂN SỰ & CƠ SỞ",
    items: [
      { id: "doctors-manage", label: "Bác sĩ & Phân công", icon: Users },
      { id: "credit-package", label: "Gói cước cơ sở", icon: CreditCard },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    groupTitle: "QUẢN TRỊ TÀI KHOẢN",
    items: [
      { id: "user-management", label: "Quản lý tài khoản", icon: Users },
      { id: "rbac-matrix", label: "Phân quyền vai trò", icon: ShieldCheck },
      { id: "clinic-approvals", label: "Phê duyệt phòng khám", icon: UserCog },
    ],
  },
  {
    groupTitle: "CẤU HÌNH & KIỂM TOÁN",
    items: [
      { id: "ai-thresholds", label: "Cấu hình tham số AI", icon: Settings },
      { id: "notification-config", label: "Mẫu thông báo & CS", icon: MessageSquare },
      { id: "audit-logs", label: "Nhật ký kiểm toán HIPAA", icon: FileText },
    ],
  },
];

const roleNavMap: Record<UserRole, NavGroup[]> = {
  patient: patientNavGroups,
  doctor: doctorNavGroups,
  clinic: clinicNavGroups,
  admin: adminNavGroups,
};

const roleTitles: Record<UserRole, string> = {
  patient: "Không gian Bệnh nhân",
  doctor: "Bàn làm việc Bác sĩ",
  clinic: "Không gian Phòng khám",
  admin: "Quản trị Hệ thống",
};

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeSection,
  onSelectSection = () => undefined,
  isOpen = false,
  onClose,
}) => {
  const normalizedRole: UserRole = (() => {
    if (
      currentRole === "patient" ||
      currentRole === "doctor" ||
      currentRole === "clinic" ||
      currentRole === "admin"
    )
      return currentRole as UserRole;
    const label = String(currentRole || "").toLocaleLowerCase("vi");
    if (label.includes("bệnh")) return "patient";
    if (label.includes("phòng")) return "clinic";
    if (label.includes("quản trị")) return "admin";
    return "doctor";
  })();

  const currentGroups = roleNavMap[normalizedRole] || patientNavGroups;
  const allItems = currentGroups.flatMap((g) => g.items);
  const selectedSection =
    activeSection && allItems.some((n) => n.id === activeSection)
      ? activeSection
      : allItems[0]?.id || "dashboard";

  const selectSection = (section: string) => {
    onSelectSection(section);
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden backdrop-blur-xs"
          onClick={onClose}
          aria-label="Đóng menu"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[#CCFBF1] bg-white p-4 transition-transform duration-200 lg:sticky lg:top-[64px] lg:z-30 lg:h-[calc(100vh-64px)] lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-medical-modal" : "-translate-x-full"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="mb-4 px-2 pt-1 pb-3 border-b border-[#CCFBF1]/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#0891B2] uppercase tracking-wider">
              Phân hệ làm việc
            </div>
            <div className="text-xs font-bold text-[#134E4A] mt-0.5">
              {roleTitles[normalizedRole] || "Cổng làm việc"}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          {currentGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.groupTitle && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isSelected = item.id === selectedSection;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectSection(item.id)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#F0FDFA] to-[#CCFBF1]/40 text-[#0891B2] border border-[#CCFBF1] shadow-xs"
                        : "text-slate-600 hover:bg-[#F0FDFA] hover:text-[#0891B2]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isSelected
                            ? "text-[#0891B2]"
                            : "text-slate-400 group-hover:text-[#0891B2]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#CCFBF1]/60 pt-3">
          <div className="rounded-xl bg-gradient-to-br from-[#F0FDFA] to-white p-3 border border-[#CCFBF1] text-center shadow-xs">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" /> AURA Clinical AI v1.0
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Hỗ trợ sàng lọc • Không thay thế BS
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
