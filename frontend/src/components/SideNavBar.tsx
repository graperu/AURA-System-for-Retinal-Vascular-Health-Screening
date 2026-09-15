import React, { useMemo } from "react";
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
import { useLanguage } from "../context/LanguageContext";

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

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeSection,
  onSelectSection = () => undefined,
  isOpen = false,
  onClose,
}) => {
  const { t, isVi } = useLanguage();

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

  const roleTitles: Record<UserRole, string> = {
    patient: t("navigation.workspacePatient", "Không gian Bệnh nhân"),
    doctor: t("navigation.workspaceDoctor", "Bàn làm việc Bác sĩ"),
    clinic: t("navigation.workspaceClinic", "Không gian Phòng khám"),
    admin: t("navigation.workspaceAdmin", "Quản trị Hệ thống"),
  };

  const navGroups: NavGroup[] = useMemo(() => {
    switch (normalizedRole) {
      case "patient":
        return [
          {
            groupTitle: t("navigation.groupOverview", "TỔNG QUAN"),
            items: [
              { id: "dashboard", label: t("navigation.dashboard", "Tổng quan sức khỏe"), icon: LayoutDashboard },
            ],
          },
          {
            groupTitle: t("navigation.groupScreening", "SÀNG LỌC VÕNG MẠC"),
            items: [
              { id: "upload-scan", label: t("navigation.newScan", "Phân tích ảnh mới"), icon: UploadCloud },
              { id: "cds-viewer", label: t("navigation.cdsWorkspace", "Bản đồ nhiệt & XAI"), icon: Eye },
              { id: "scan-history", label: t("navigation.historyReports", "Lịch sử & Báo cáo"), icon: History },
            ],
          },
          {
            groupTitle: t("navigation.groupCare", "CHĂM SÓC & TƯ VẤN"),
            items: [
              { id: "consultation", label: t("navigation.consultation", "Tư vấn Bác sĩ"), icon: MessageSquare },
              { id: "medical-profile", label: t("navigation.medicalProfile", "Hồ sơ y tế & Tiền sử"), icon: UserCog },
            ],
          },
          {
            groupTitle: t("navigation.groupBilling", "TÀI KHOẢN & DỊCH VỤ"),
            items: [
              { id: "billing", label: t("navigation.billingCredits", "Nạp lượt & Giao dịch"), icon: CreditCard },
            ],
          },
        ];

      case "doctor":
        return [
          {
            groupTitle: t("navigation.groupClinical", "CHẨN ĐOÁN LÂM SÀNG"),
            items: [
              { id: "cds-viewer", label: t("navigation.cdsWorkspace", "Bàn chẩn đoán ảnh CDS"), icon: Eye },
              { id: "patient-list", label: t("navigation.patientList", "Danh sách bệnh nhân"), icon: Users },
            ],
          },
          {
            groupTitle: t("navigation.groupAnalytics", "PHÂN TÍCH & BÁO CÁO"),
            items: [
              { id: "risk-analytics", label: t("navigation.riskAnalytics", "Thống kê nguy cơ"), icon: Activity },
              { id: "reports", label: t("navigation.medicalReportsSignoff", "Báo cáo y khoa & Ký duyệt"), icon: FileSpreadsheet },
            ],
          },
          {
            groupTitle: t("navigation.groupCommunication", "GIAO TIẾP"),
            items: [
              { id: "consultation", label: t("navigation.consultation", "Trao đổi với bệnh nhân"), icon: MessageSquare },
            ],
          },
        ];

      case "clinic":
        return [
          {
            groupTitle: t("navigation.groupCampaign", "CHIẾN DỊCH TẦM SOÁT"),
            items: [
              { id: "bulk-batch", label: t("navigation.bulkScreening", "Sàng lọc hàng loạt (≥100)"), icon: UploadCloud },
              { id: "campaign-analytics", label: t("navigation.campaignAnalytics", "Báo cáo chiến dịch"), icon: LayoutDashboard },
            ],
          },
          {
            groupTitle: t("navigation.groupFacility", "NHÂN SỰ & CƠ SỞ"),
            items: [
              { id: "doctors-manage", label: t("navigation.doctorManagement", "Bác sĩ & Phân công"), icon: Users },
              { id: "credit-package", label: t("navigation.creditPackage", "Gói cước cơ sở"), icon: CreditCard },
            ],
          },
        ];

      case "admin":
        return [
          {
            groupTitle: t("navigation.groupUserAdmin", "QUẢN TRỊ TÀI KHOẢN"),
            items: [
              { id: "user-management", label: t("navigation.userManagement", "Quản lý tài khoản"), icon: Users },
              { id: "rbac-matrix", label: t("navigation.rbacPermissions", "Phân quyền vai trò"), icon: ShieldCheck },
              { id: "clinic-approvals", label: t("navigation.clinicApprovals", "Phê duyệt phòng khám"), icon: UserCog },
              { id: "package-management", label: t("navigation.packageManagement", "Quản lý gói dịch vụ"), icon: CreditCard },
            ],
          },
          {
            groupTitle: t("navigation.groupConfigAudit", "CẤU HÌNH & KIỂM TOÁN"),
            items: [
              { id: "ai-thresholds", label: t("navigation.aiConfiguration", "Cấu hình tham số AI"), icon: Settings },
              { id: "notification-config", label: t("navigation.notificationConfig", "Mẫu thông báo & CS"), icon: MessageSquare },
              { id: "audit-logs", label: t("navigation.auditLogs", "Nhật ký kiểm toán HIPAA"), icon: FileText },
            ],
          },
        ];

      default:
        return [];
    }
  }, [normalizedRole, t]);

  const allItems = navGroups.flatMap((g) => g.items);
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
          aria-label={t("common.close", "Đóng menu")}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-clinical-border bg-white p-4 transition-transform duration-200 lg:sticky lg:top-[64px] lg:z-30 lg:h-[calc(100vh-64px)] lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-medical-modal" : "-translate-x-full"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="mb-4 px-2 pt-1 pb-3 border-b border-clinical-border flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">
              {isVi ? "Phân hệ làm việc" : "Workspace"}
            </div>
            <div className="text-xs font-bold text-clinical-text mt-0.5">
              {roleTitles[normalizedRole] || (isVi ? "Cổng làm việc" : "Portal")}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.groupTitle && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
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
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 ${
                      isSelected
                        ? "bg-brand-50 text-brand-700 font-semibold border-r-2 border-brand-600"
                        : "text-clinical-text-secondary hover:bg-slate-50 hover:text-brand-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isSelected
                            ? "text-brand-600"
                            : "text-clinical-text-muted group-hover:text-brand-600"
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

        <div className="mt-auto border-t border-clinical-border pt-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> AURA Clinical AI v1.0
            </div>
            <p className="text-[10px] text-clinical-text-muted mt-0.5">
              {isVi ? "Hỗ trợ sàng lọc • Không thay thế BS" : "Screening Aid • Not a Diagnosis"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
