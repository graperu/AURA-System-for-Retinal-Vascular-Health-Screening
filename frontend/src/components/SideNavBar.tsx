import React, { useMemo } from 'react';
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
  CalendarCheck,
  Bell,
  LogOut,
  X,
  LucideIcon,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export interface SideNavBarProps {
  currentRole: UserRole | string;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  unreadChatCount?: number;
  unreadNotificationCount?: number;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeSection = 'dashboard',
  onSelectSection = () => undefined,
  isOpen = false,
  onClose,
  unreadChatCount = 0,
  unreadNotificationCount = 0,
  onLogout,
}) => {
  const { t, isVi } = useLanguage();
  const auth = useAuth();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (auth?.logout) {
      void auth.logout();
    }
  };

  const normalizedRole: UserRole = (() => {
    if (
      currentRole === 'patient' ||
      currentRole === 'doctor' ||
      currentRole === 'clinic' ||
      currentRole === 'admin'
    ) {
      return currentRole as UserRole;
    }
    const label = String(currentRole || '').toLowerCase();
    if (label.includes('bệnh') || label.includes('patient')) return 'patient';
    if (label.includes('phòng') || label.includes('clinic')) return 'clinic';
    if (label.includes('quản trị') || label.includes('admin')) return 'admin';
    return 'doctor';
  })();

  const navGroups: NavGroup[] = useMemo(() => {
    const generalTitle = isVi ? 'Tổng quan' : 'General';
    const otherTitle = isVi ? 'Khác' : 'Other';

    switch (normalizedRole) {
      case 'patient':
        return [
          {
            groupTitle: generalTitle,
            items: [
              {
                id: 'dashboard',
                label: t('navigation.dashboard', isVi ? 'Trang chủ' : 'Dashboard'),
                icon: LayoutDashboard,
              },
              {
                id: 'upload-scan',
                label: isVi ? 'Sàng lọc võng mạc' : 'Retinal Screening',
                icon: UploadCloud,
              },
              {
                id: 'scan-history',
                label: t('navigation.historyReports', isVi ? 'Kết quả & Lịch sử' : 'Results & History'),
                icon: History,
              },
              {
                id: 'appointment',
                label: isVi ? 'Lịch hẹn khám' : 'Appointments',
                icon: CalendarCheck,
              },
              {
                id: 'consultation',
                label: t('navigation.consultation', isVi ? 'Tin nhắn' : 'Messages'),
                icon: MessageSquare,
                badge: unreadChatCount > 0 ? unreadChatCount : undefined,
              },
              {
                id: 'medical-profile',
                label: t('navigation.medicalProfile', isVi ? 'Hồ sơ y tế' : 'Medical Profile'),
                icon: UserCog,
              },
            ],
          },
          {
            groupTitle: otherTitle,
            items: [
              {
                id: 'notifications',
                label: t('header.notificationCenter', isVi ? 'Thông báo' : 'Notifications'),
                icon: Bell,
                badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
              },
              {
                id: 'billing',
                label: t('navigation.billingCredits', isVi ? 'Cài đặt & Gói cước' : 'Settings'),
                icon: CreditCard,
              },
            ],
          },
        ];

      case 'doctor':
        return [
          {
            groupTitle: generalTitle,
            items: [
              {
                id: 'dashboard',
                label: t('navigation.dashboard', isVi ? 'Trang chủ' : 'Dashboard'),
                icon: LayoutDashboard,
              },
              {
                id: 'patient-list',
                label: t('navigation.patientList', isVi ? 'Danh sách bệnh nhân' : 'Patients'),
                icon: Users,
              },
              {
                id: 'cds-viewer',
                label: isVi ? 'Chờ duyệt chẩn đoán' : 'Pending Reviews',
                icon: Eye,
              },
              {
                id: 'reports',
                label: t('navigation.medicalReportsSignoff', isVi ? 'Lịch sử đánh giá' : 'Review History'),
                icon: FileSpreadsheet,
              },
              {
                id: 'consultation',
                label: t('navigation.consultation', isVi ? 'Tin nhắn' : 'Messages'),
                icon: MessageSquare,
                badge: unreadChatCount > 0 ? unreadChatCount : undefined,
              },
              {
                id: 'appointment',
                label: isVi ? 'Lịch hẹn khám' : 'Appointments',
                icon: CalendarCheck,
              },
            ],
          },
          {
            groupTitle: otherTitle,
            items: [
              {
                id: 'notifications',
                label: t('header.notificationCenter', isVi ? 'Thông báo' : 'Notifications'),
                icon: Bell,
                badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
              },
              {
                id: 'medical-profile',
                label: isVi ? 'Hồ sơ bác sĩ' : 'Profile',
                icon: UserCog,
              },
              {
                id: 'risk-analytics',
                label: t('navigation.riskAnalytics', isVi ? 'Thống kê nguy cơ' : 'Analytics'),
                icon: Activity,
              },
            ],
          },
        ];

      case 'clinic':
        return [
          {
            groupTitle: generalTitle,
            items: [
              {
                id: 'dashboard',
                label: t('navigation.dashboard', isVi ? 'Trang chủ' : 'Dashboard'),
                icon: LayoutDashboard,
              },
              {
                id: 'patient-list',
                label: isVi ? 'Bệnh nhân' : 'Patients',
                icon: Users,
              },
              {
                id: 'appointments',
                label: isVi ? 'Lịch hẹn & Tiếp nhận' : 'Appointments & Reception',
                icon: CalendarCheck,
              },
              {
                id: 'patient-assignments',
                label: isVi ? 'Phân công ca khám' : 'Patient Assignments',
                icon: UserCheck,
              },
              {
                id: 'bulk-batch',
                label: t('navigation.bulkScreening', isVi ? 'Sàng lọc theo lô' : 'Batch Screening'),
                icon: UploadCloud,
              },
              {
                id: 'scan-history',
                label: isVi ? 'Kết quả sàng lọc' : 'Results',
                icon: History,
              },
              {
                id: 'doctors-manage',
                label: t('navigation.doctorManagement', isVi ? 'Quản lý Bác sĩ' : 'Doctors'),
                icon: Users,
              },
              {
                id: 'campaign-analytics',
                label: t('navigation.campaignAnalytics', isVi ? 'Phân tích chiến dịch' : 'Analytics'),
                icon: Activity,
              },
            ],
          },
          {
            groupTitle: otherTitle,
            items: [
              {
                id: 'notifications',
                label: t('header.notificationCenter', isVi ? 'Thông báo' : 'Notifications'),
                icon: Bell,
                badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
              },
              {
                id: 'credit-package',
                label: t('navigation.creditPackage', isVi ? 'Cài đặt & Gói cước' : 'Settings'),
                icon: CreditCard,
              },
            ],
          },
        ];

      case 'admin':
        return [
          {
            groupTitle: generalTitle,
            items: [
              {
                id: 'dashboard',
                label: t('navigation.dashboard', isVi ? 'Trang chủ' : 'Dashboard'),
                icon: LayoutDashboard,
              },
              {
                id: 'user-management',
                label: t('navigation.userManagement', isVi ? 'Người dùng' : 'Users'),
                icon: Users,
              },
              {
                id: 'clinic-approvals',
                label: t('navigation.clinicApprovals', isVi ? 'Bác sĩ & Phòng khám' : 'Doctors & Clinics'),
                icon: UserCog,
              },
              {
                id: 'packages',
                label: isVi ? 'Gói dịch vụ' : 'Service Packages',
                icon: CreditCard,
              },
              {
                id: 'screenings',
                label: isVi ? 'Ca sàng lọc' : 'Screenings',
                icon: Eye,
              },
              {
                id: 'rbac-matrix',
                label: t('navigation.rbacPermissions', isVi ? 'Phân quyền' : 'Roles & Permissions'),
                icon: ShieldCheck,
              },
              {
                id: 'audit-logs',
                label: t('navigation.auditLogs', isVi ? 'Nhật ký hệ thống' : 'Audit Logs'),
                icon: FileText,
              },
            ],
          },
          {
            groupTitle: otherTitle,
            items: [
              {
                id: 'ai-thresholds',
                label: t('navigation.aiConfiguration', isVi ? 'Cài đặt hệ thống' : 'System Settings'),
                icon: Settings,
              },
              {
                id: 'notifications',
                label: t('header.notificationCenter', isVi ? 'Thông báo' : 'Notifications'),
                icon: Bell,
                badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
              },
            ],
          },
        ];

      default:
        return [];
    }
  }, [normalizedRole, t, isVi, unreadChatCount, unreadNotificationCount]);

  const handleItemClick = (id: string) => {
    onSelectSection(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          aria-label={isVi ? 'Đóng menu' : 'Close menu'}
        />
      )}

      {/* Side Navigation Bar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-[#EAECF0] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
        aria-label={isVi ? 'Điều hướng chính' : 'Main navigation'}
      >
        {/* Brand Header */}
        <div className="flex h-[76px] items-center justify-between px-6 border-b border-[#EAECF0]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3478F6] text-white shadow-xs">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#111827]">
                AURA
              </span>
              <p className="text-[10px] font-medium text-[#667085] leading-none">
                Retinal Health
              </p>
            </div>
          </div>

          {isOpen && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden rounded-lg p-1 text-[#98A2B3] hover:text-[#111827]"
              aria-label={isVi ? 'Đóng' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                {group.groupTitle}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      data-section={item.id}
                      data-testid={`sidenav-item-${item.id}`}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#3478F6] text-white shadow-xs'
                          : 'text-[#4B5563] hover:bg-[#F4F6F8] hover:text-[#111827]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isSelected
                              ? 'text-white'
                              : 'text-[#667085] group-hover:text-[#111827]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono-data shrink-0 ${
                            isSelected
                              ? 'bg-white/25 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pinned Log Out Button */}
        <div className="p-4 border-t border-[#EAECF0] bg-white mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#4B5563] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4 text-[#667085] group-hover:text-red-600" />
            <span>{isVi ? 'Đăng xuất' : 'Log Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
