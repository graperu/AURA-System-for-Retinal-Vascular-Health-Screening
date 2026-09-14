import React, { useState } from 'react';
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

const SEVERITY_OPTIONS: ClinicalSelectOption<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>[] = [
  { value: 'ALL', label: 'Mức độ (Tất cả)' },
  { value: 'INFO', label: 'INFO', riskLevel: 'low' },
  { value: 'WARNING', label: 'WARNING', riskLevel: 'moderate' },
  { value: 'CRITICAL', label: 'CRITICAL', riskLevel: 'critical' },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.actor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.resource || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSev = severityFilter === 'ALL' || l.severity === severityFilter;
    return matchSearch && matchSev;
  });

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'Thời Gian',
      accessor: (row) => (
        <span className="font-mono-data text-xs text-clinical-text-secondary whitespace-nowrap">
          {new Date(row.timestamp || Date.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Người Thực Hiện',
      accessor: (row) => (
        <div className="min-w-[120px]">
          <span className="font-semibold text-clinical-text block truncate max-w-[140px]">{row.actor}</span>
          <span className="text-[10px] text-clinical-text-muted">{row.role}</span>
        </div>
      ),
    },
    {
      header: 'Hành Động & Tài Nguyên',
      accessor: (row) => (
        <div className="min-w-[160px]">
          <span className="font-semibold text-brand-700 block">{row.action}</span>
          <span className="text-[11px] text-clinical-text-secondary font-mono-data">{row.resource}</span>
        </div>
      ),
    },
    {
      header: 'Mức Độ',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
            row.severity === 'CRITICAL'
              ? 'bg-red-50 text-red-700 border-red-200'
              : row.severity === 'WARNING'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {row.severity}
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      align: 'right',
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            row.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
          }`}
        >
          {row.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Nhật Ký Kiểm Toán & Truy Vết Bảo Mật (HIPAA Audit Logs)
            </h2>
            <p className="text-xs text-clinical-text-muted mt-0.5">
              Toàn bộ thao tác truy cập hồ sơ bệnh án và xuất dữ liệu đều được ghi vết bảo mật.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhật ký..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-clinical-border bg-white text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <ClinicalSelect<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>
              value={severityFilter}
              onChange={setSeverityFilter}
              options={SEVERITY_OPTIONS}
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
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            )}

            {onExportLogs && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportLogs}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Xuất Nhật Ký
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
          emptyMessage="Không có nhật ký kiểm toán nào phù hợp."
        />
      </div>
    </div>
  );
};
