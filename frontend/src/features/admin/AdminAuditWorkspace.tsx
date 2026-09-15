import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  AlertTriangle,
  Info,
  Clock,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { useLanguage } from '../../context/LanguageContext';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
}

export interface AdminAuditWorkspaceProps {
  logs: AuditLogItem[];
  loading?: boolean;
  onRefresh?: () => void;
  onExportLogs?: () => void;
}

export const AdminAuditWorkspace: React.FC<AdminAuditWorkspaceProps> = ({
  logs,
  loading = false,
  onRefresh,
  onExportLogs,
}) => {
  const { t, isVi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const severityOptions = useMemo<ClinicalSelectOption<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>[]>(() => [
    { value: 'ALL', label: t('admin.audit.severityAll', isVi ? 'Mức độ (Tất cả)' : 'Severity (All)') },
    { value: 'INFO', label: t('admin.audit.severityInfo', isVi ? 'Thông tin' : 'Info'), riskLevel: 'low' },
    { value: 'WARNING', label: t('admin.audit.severityWarning', isVi ? 'Cảnh báo' : 'Warning'), riskLevel: 'moderate' },
    { value: 'CRITICAL', label: t('admin.audit.severityCritical', isVi ? 'Nguy kịch' : 'Critical'), riskLevel: 'critical' },
  ], [t, isVi]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.actor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.resource || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSev = severityFilter === 'ALL' || l.severity === severityFilter;
      return matchSearch && matchSev;
    });
  }, [logs, searchTerm, severityFilter]);

  const formatRole = (role: string) => {
    if (role === 'ROLE_ADMIN' || role === 'ADMIN') return isVi ? 'Quản trị viên' : 'Administrator';
    if (role === 'ROLE_DOCTOR' || role === 'DOCTOR') return isVi ? 'Bác sĩ chuyên khoa' : 'Specialist Doctor';
    if (role === 'ROLE_CLINIC' || role === 'CLINIC') return isVi ? 'Phòng khám' : 'Clinic';
    if (role === 'ROLE_USER' || role === 'USER') return isVi ? 'Bệnh nhân' : 'Patient';
    return role;
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'SCREENING_CREATE':
        return isVi ? 'Tạo ca sàng lọc' : 'Create Screening';
      case 'DOCTOR_REVIEW':
        return isVi ? 'Ký duyệt kết quả' : 'Doctor Sign-off';
      case 'USER_LOGIN':
        return isVi ? 'Đăng nhập hệ thống' : 'User Login';
      case 'USER_ROLE_UPDATE':
        return isVi ? 'Cập nhật phân quyền' : 'Role Update';
      case 'PACKAGE_CREATE':
        return isVi ? 'Tạo gói dịch vụ' : 'Package Created';
      case 'PACKAGE_UPDATE':
        return isVi ? 'Cập nhật gói dịch vụ' : 'Package Updated';
      case 'CLINIC_APPROVE':
        return isVi ? 'Phê duyệt phòng khám' : 'Clinic Approved';
      case 'CLINIC_REJECT':
        return isVi ? 'Từ chối phòng khám' : 'Clinic Rejected';
      default:
        return action;
    }
  };

  const columns: Column<AuditLogItem>[] = useMemo(() => [
    {
      header: t('admin.audit.columns.timestamp', isVi ? 'Thời Gian' : 'Timestamp'),
      accessor: (row) => (
        <span className="font-mono-data text-xs text-slate-700 whitespace-nowrap">
          {new Date(row.timestamp || Date.now()).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: t('admin.audit.columns.user', isVi ? 'Người Thực Hiện' : 'Actor'),
      accessor: (row) => (
        <div className="min-w-[140px] space-y-0.5">
          <span className="font-semibold text-slate-900 block truncate max-w-[180px]" title={row.actor}>
            {row.actor}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {formatRole(row.role)}
          </span>
        </div>
      ),
    },
    {
      header: t('admin.audit.columns.actionResource', isVi ? 'Hành Động & Tài Nguyên' : 'Action & Resource'),
      accessor: (row) => (
        <div className="min-w-[160px] space-y-0.5">
          <span className="font-semibold text-teal-700 block">{formatAction(row.action)}</span>
          <span className="text-[11px] text-slate-500 font-mono-data block truncate max-w-[200px]" title={row.resource}>
            {row.resource}
          </span>
        </div>
      ),
    },
    {
      header: t('admin.audit.columns.severity', isVi ? 'Mức Độ' : 'Severity'),
      accessor: (row) => {
        const severityLabel =
          row.severity === 'CRITICAL'
            ? t('admin.audit.severityCritical', isVi ? 'Nguy kịch' : 'Critical')
            : row.severity === 'WARNING'
            ? t('admin.audit.severityWarning', isVi ? 'Cảnh báo' : 'Warning')
            : t('admin.audit.severityInfo', isVi ? 'Thông tin' : 'Info');
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border select-none whitespace-nowrap ${
              row.severity === 'CRITICAL'
                ? 'bg-red-50 text-red-700 border-red-200'
                : row.severity === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.severity === 'CRITICAL'
                  ? 'bg-red-500'
                  : row.severity === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-cyan-500'
              }`}
            />
            {severityLabel}
          </span>
        );
      },
    },
    {
      header: t('admin.audit.columns.status', isVi ? 'Trạng Thái' : 'Status'),
      align: 'right',
      className: 'text-right whitespace-nowrap',
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border select-none whitespace-nowrap ${
            row.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
          }`}
        >
          {row.status === 'SUCCESS' ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-red-600" />
          )}
          {row.status === 'SUCCESS'
            ? t('admin.audit.statusSuccess', isVi ? 'Thành công' : 'Success')
            : t('admin.audit.statusFailed', isVi ? 'Thất bại' : 'Failed')}
        </span>
      ),
    },
  ], [t, isVi]);

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600 shrink-0" />
              {t('admin.audit.title', isVi ? 'Nhật Ký Kiểm Toán & Truy Vết Bảo Mật HIPAA' : 'HIPAA Security & Audit Trail Logs')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {t('admin.audit.subtitle', isVi ? 'Toàn bộ thao tác truy cập hồ sơ bệnh án và xuất dữ liệu đều được ghi vết bảo mật.' : 'All medical records access and data export activities are securely audited.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full xl:w-auto flex-wrap sm:flex-nowrap shrink-0">
            <div className="relative flex-1 min-w-[220px] sm:w-72 sm:flex-initial">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isVi ? 'Tìm người dùng, IP, hành động...' : 'Search logs by actor, IP, action...'}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="w-44 shrink-0">
              <ClinicalSelect<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>
                value={severityFilter}
                onChange={setSeverityFilter}
                options={severityOptions}
                size="sm"
                align="right"
              />
            </div>

            {(searchTerm || severityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('ALL');
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                title={t('admin.audit.resetFilter', isVi ? 'Đặt lại bộ lọc' : 'Reset filter')}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('admin.audit.resetFilter', isVi ? 'Đặt lại' : 'Reset')}</span>
              </button>
            )}

            {onExportLogs && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportLogs}
                icon={<Download className="w-3.5 h-3.5" />}
                className="whitespace-nowrap shrink-0"
              >
                {t('admin.audit.exportBtn', isVi ? 'Xuất Nhật Ký' : 'Export Logs')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="w-full">
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          loading={loading}
          pagination={{
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 50],
            itemLabel: isVi ? 'nhật ký' : 'logs',
          }}
          emptyMessage={t('admin.audit.emptyMessage', isVi ? 'Không có nhật ký kiểm toán nào phù hợp.' : 'No matching audit logs found.')}
        />
      </div>
    </div>
  );
};
