import React from 'react';
import { UserRole } from '../types/cds';
import {
  LayoutDashboard,
  UploadCloud,
  Eye,
  Activity,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  HelpCircle,
  UserCheck,
} from 'lucide-react';

interface SideNavBarProps {
  currentRole: UserRole;
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentRole,
  activeSection,
  onSelectSection,
}) => {
  const getNavItems = () => {
    switch (currentRole) {
      case 'doctor':
        return [
          { id: 'cds-viewer', label: 'Bàn Chẩn Đoán AI (CDS)', icon: <Eye className="w-4 h-4" /> },
          { id: 'patient-list', label: 'Danh Sách Bệnh Nhân', icon: <Users className="w-4 h-4" /> },
          { id: 'risk-analytics', label: 'Phân Tích Rủi Ro Tim Mạch', icon: <Activity className="w-4 h-4" /> },
          { id: 'reports', label: 'Báo Cáo & Ký Số EMR', icon: <FileSpreadsheet className="w-4 h-4" /> },
        ];
      case 'clinic':
        return [
          { id: 'bulk-batch', label: 'Sàng Lọc Hàng Loạt (Bulk)', icon: <UploadCloud className="w-4 h-4" /> },
          { id: 'doctors-manage', label: 'Quản Lý Bác Sĩ & Ca', icon: <Users className="w-4 h-4" /> },
          { id: 'credit-package', label: 'Gói Credit Screening', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'campaign-analytics', label: 'Báo Cáo Chiến Dịch', icon: <LayoutDashboard className="w-4 h-4" /> },
        ];
      case 'patient':
        return [
          { id: 'my-scans', label: 'Ảnh Võng Mạc Cá Nhân', icon: <Eye className="w-4 h-4" /> },
          { id: 'upload-scan', label: 'Tải Lên Ảnh Fundus Mới', icon: <UploadCloud className="w-4 h-4" /> },
          { id: 'health-advice', label: 'Chỉ Số & Lời Khuyên Y Tế', icon: <Activity className="w-4 h-4" /> },
        ];
      case 'admin':
        return [
          { id: 'audit-logs', label: 'Nhật Ký Kiểm Toán Audit', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'ai-thresholds', label: 'Cấu Hình Ngưỡng AI', icon: <Settings className="w-4 h-4" /> },
          { id: 'user-management', label: 'Quản Lý Người Dùng', icon: <Users className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleTitle = () => {
    switch (currentRole) {
      case 'patient':
        return 'Menu Bệnh Nhân';
      case 'doctor':
        return 'Menu Bác Sĩ CDS';
      case 'clinic':
        return 'Menu Phòng Khám';
      case 'admin':
        return 'Menu System Admin';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#CCFBF1] flex flex-col justify-between p-4 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block px-3 mb-2 font-mono-data">
            {getRoleTitle()}
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#F0FDFA] text-[#0891B2] font-semibold border-l-4 border-[#0891B2] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0891B2]'
                  }`}
                >
                  <span className={isActive ? 'text-[#0891B2]' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Health Info Widget */}
        <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#134E4A]">AI Microservice:</span>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
          </div>
          <p className="text-[11px] text-slate-600">
            AURA-ResNet50 (PyTorch 2.2)
          </p>
          <div className="text-[10px] font-mono-data text-slate-400">
            Encrypted • HIPAA AA
          </div>
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-500 hover:text-[#0891B2] cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          <span>Hướng dẫn sử dụng Cổng Y tế</span>
        </div>
        <div>AURA Health &copy; 2026.</div>
      </div>
    </aside>
  );
};
