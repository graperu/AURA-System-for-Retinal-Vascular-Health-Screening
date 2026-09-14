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

  const columns: Column<AuditLogItem>[] = useMemo(() => [
    {
      header: t('admin.audit.columns.timestamp', isVi ? 'Thời Gian' : 'Timestamp'),
      accessor: (row) => (
        <span className="font-mono-data text-xs text-clinical-text-secondary whitespace-nowrap">
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
        <div className="min-w-[120px]">
          <span className="font-semibold text-clinical-text block truncate max-w-[140px]">{row.actor}</span>
          <span className="text-[10px] text-clinical-text-muted">{formatRole(row.role)}</span>
        </div>
      ),
    },
    {
      header: t('admin.audit.columns.actionResource', isVi ? 'Hành Động & Tài Nguyên' : 'Action & Resource'),
      accessor: (row) => (
        <div className="min-w-[160px]">
          <span className="font-semibold text-brand-700 block">{row.action}</span>
          <span className="text-[11px] text-clinical-text-secondary font-mono-data">{row.resource}</span>
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
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              row.severity === 'CRITICAL'
                ? 'bg-red-50 text-red-700 border-red-200'
                : row.severity === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {severityLabel}
          </span>
        );
      },
    },
    {
      header: t('admin.audit.columns.status', isVi ? 'Trạng Thái' : 'Status'),
      align: 'right',
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            row.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
          }`}
        >
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              {t('admin.audit.title', isVi ? 'Nhật Ký Kiểm Toán & Truy Vết Bảo Mật HIPAA' : 'HIPAA Security & Audit Trail Logs')}
            </h2>
            <p className="text-xs text-clinical-text-muted mt-0.5">
              {t('admin.audit.subtitle', isVi ? 'Toàn bộ thao tác truy cập hồ sơ bệnh án và xuất dữ liệu đều được ghi vết bảo mật.' : 'All medical records access and data export activities are securely audited.')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.audit.searchByUserIp', isVi ? 'Tìm nhật ký theo người dùng, hành động, IP...' : 'Search logs by user, action, IP...')}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <ClinicalSelect<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>
              value={severityFilter}
              onChange={setSeverityFilter}
              options={severityOptions}
              size="sm"
              className="w-44"
            />

            {(searchTerm || severityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('ALL');
                }}
                className="h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all flex items-center gap-1 shrink-0"
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
              >
                {t('admin.audit.exportBtn', isVi ? 'Xuất Nhật Ký' : 'Export Logs')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          loading={loading}
          emptyMessage={t('admin.audit.emptyMessage', isVi ? 'Không có nhật ký kiểm toán nào phù hợp.' : 'No matching audit logs found.')}
        />
      </div>
    </div>
  );
};
