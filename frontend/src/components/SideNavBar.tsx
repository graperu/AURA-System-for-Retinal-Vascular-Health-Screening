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
} from 'lucide-react';
import { UserRole } from '../types/cds';

interface SideNavBarProps {
  currentRole: UserRole | string;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = {
  doctor: [
    { id: 'cds-viewer', label: 'Phân tích ảnh AI', icon: Eye },
    { id: 'patient-list', label: 'Danh sách bệnh nhân', icon: Users },
    { id: 'risk-analytics', label: 'Phân tích nguy cơ', icon: Activity },
    { id: 'reports', label: 'Báo cáo y khoa', icon: FileSpreadsheet },
  ],
  clinic: [
    { id: 'bulk-batch', label: 'Sàng lọc hàng loạt', icon: UploadCloud },
    { id: 'doctors-manage', label: 'Bác sĩ và ca khám', icon: Users },
    { id: 'credit-package', label: 'Gói sàng lọc', icon: CreditCard },
    { id: 'campaign-analytics', label: 'Báo cáo chiến dịch', icon: LayoutDashboard },
  ],
  patient: [
    { id: 'my-scans', label: 'Tổng quan sức khỏe', icon: LayoutDashboard },
    { id: 'upload-scan', label: 'Tải ảnh khám mới', icon: UploadCloud },
    { id: 'health-advice', label: 'Kết quả và lời khuyên', icon: Activity },
  ],
  admin: [
    { id: 'audit-logs', label: 'Nhật ký hệ thống', icon: ShieldCheck },
    { id: 'ai-thresholds', label: 'Cấu hình mô hình AI', icon: Settings },
    { id: 'user-management', label: 'Quản lý người dùng', icon: Users },
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
  const selectedSection = activeSection ?? navigation[normalizedRole][0].id;
  const selectSection = (section: string) => {
    onSelectSection(section);
    onClose?.();
  };

  return (
    <>
      {isOpen && <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} aria-label="Đóng menu" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200 lg:sticky lg:top-[72px] lg:z-30 lg:h-[calc(100vh-72px)] lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="mb-5 flex items-center justify-between px-2 pt-1 lg:pt-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700">AURA Workspace</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{roleTitles[normalizedRole]}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5">
          {navigation[normalizedRole].map(({ id, label, icon: Icon }) => {
            const active = selectedSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                aria-current={active ? 'page' : undefined}
                className={`group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 ${
                  active ? 'bg-cyan-700 text-white shadow-[0_8px_20px_rgba(14,116,144,0.18)]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              Hệ thống hoạt động tốt
            </div>
            <p className="mt-2 text-xs leading-5 text-emerald-800">Dịch vụ phân tích AI đã sẵn sàng.</p>
          </div>
          <button type="button" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <HelpCircle className="h-5 w-5 text-cyan-700" />
            Trung tâm trợ giúp
          </button>
          <p className="px-3 text-[11px] text-slate-400">AURA Health © 2026</p>
        </div>
      </aside>
    </>
  );
};
