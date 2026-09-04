import React from 'react';
import {
  Activity,
  CreditCard,
  Eye,
  FileSpreadsheet,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
  X,
  MessageSquare,
  UserCog,
  History,
  FileText,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types/cds';

interface SideNavBarProps {
  currentRole: UserRole | string;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const patientNavigation = [
  { id: 'dashboard', label: 'Tổng quan sức khỏe', icon: LayoutDashboard, badge: 'KPI' },
  { id: 'upload-scan', label: 'Phân tích ảnh mới', icon: UploadCloud, badge: 'AI' },
  { id: 'cds-viewer', label: 'Trực quan & Heatmap', icon: Eye, badge: 'Grad-CAM' },
  { id: 'medical-profile', label: 'Hồ sơ y tế & Tiền sử', icon: UserCog },
  { id: 'scan-history', label: 'Lịch sử & Báo cáo', icon: History },
  { id: 'consultation', label: 'Tư vấn với Bác sĩ', icon: MessageSquare, badge: 'Online' },
  { id: 'billing', label: 'Nạp khám & Giao dịch', icon: CreditCard },
];

const navigation = {
  doctor: [
    { id: 'cds-viewer', label: 'Chẩn đoán ảnh AI (CDS)', icon: Eye },
    { id: 'patient-list', label: 'Danh sách bệnh nhân', icon: Users },
    { id: 'risk-analytics', label: 'Thống kê & Xu hướng', icon: Activity },
    { id: 'reports', label: 'Báo cáo y khoa & Ký duyệt', icon: FileSpreadsheet },
    { id: 'consultation', label: 'Trao đổi với bệnh nhân', icon: MessageSquare },
  ],
  clinic: [
    { id: 'bulk-batch', label: 'Sàng lọc hàng loạt (≥100)', icon: UploadCloud },
    { id: 'doctors-manage', label: 'Bác sĩ & Phân công', icon: Users },
    { id: 'credit-package', label: 'Gói cước phòng khám', icon: CreditCard },
    { id: 'campaign-analytics', label: 'Báo cáo chiến dịch lâm sàng', icon: LayoutDashboard },
  ],
  patient: patientNavigation,
  admin: [
    { id: 'user-management', label: 'Quản lý tài khoản & Phân quyền', icon: Users },
    { id: 'clinic-approvals', label: 'Phê duyệt phòng khám', icon: ShieldCheck },
    { id: 'ai-thresholds', label: 'Cấu hình tham số AI', icon: Settings },
    { id: 'audit-logs', label: 'Nhật ký kiểm toán HIPAA', icon: FileText },
  ],
};

const roleTitles = {
  patient: 'Không gian bệnh nhân',
  doctor: 'Không gian bác sĩ',
  clinic: 'Quản lý phòng khám',
  admin: 'Quản trị hệ thống',
};

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeSection,
  onSelectSection = () => undefined,
  isOpen = false,
  onClose,
}) => {
  const normalizedRole: UserRole = (() => {
    if (currentRole === 'patient' || currentRole === 'doctor' || currentRole === 'clinic' || currentRole === 'admin') return currentRole;
    const label = currentRole.toLocaleLowerCase('vi');
    if (label.includes('bệnh')) return 'patient';
    if (label.includes('phòng')) return 'clinic';
    if (label.includes('quản trị')) return 'admin';
    return 'doctor';
  })();

  const currentNav = navigation[normalizedRole] || navigation.patient;
  const selectedSection = activeSection && currentNav.some(n => n.id === activeSection) ? activeSection : currentNav[0].id;

  const selectSection = (section: string) => {
    onSelectSection(section);
    onClose?.();
  };

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden backdrop-blur-xs" onClick={onClose} aria-label="Đóng menu" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md p-4 shadow-2xl transition-transform duration-200 lg:sticky lg:top-[72px] lg:z-30 lg:h-[calc(100vh-72px)] lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="mb-5 flex items-center justify-between px-2 pt-1 lg:pt-0">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0891B2]">AURA Healthcare</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{roleTitles[normalizedRole]}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5 flex-1">
          {currentNav.map(({ id, label, icon: Icon, badge }: any) => {
            const active = selectedSection === id;
            return (
              <button
                key={id}
                onClick={() => selectSection(id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#0891B2] text-white shadow-md shadow-[#0891B2]/20 font-bold scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-[#0891B2]'}`} />
                  <span>{label}</span>
                </span>
                {badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold font-mono-data ${
                    active ? 'bg-white/20 text-white' : 'bg-teal-50 text-[#0891B2] border border-teal-200'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Info Card */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#134E4A]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Bảo Mật Y Tế Chuẩn HIPAA
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Mã hóa dữ liệu 256-bit • AI CDS v2.1
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
