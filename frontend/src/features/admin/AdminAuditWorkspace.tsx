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
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';

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
        <span className="font-mono-data text-xs text-slate-700">
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
        <div>
          <span className="font-bold text-slate-900 block truncate max-w-[140px]">{row.actor}</span>
          <span className="text-[10px] text-slate-500">{row.role}</span>
        </div>
      ),
    },
    {
      header: 'Hành Động & Tài Nguyên',
      accessor: (row) => (
        <div>
          <span className="font-bold text-[#0891B2] block">{row.action}</span>
          <span className="text-[11px] text-slate-600 font-mono-data">{row.resource}</span>
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
            row.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
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
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0891B2]" />
              Nhật Ký Kiểm Toán & Truy Vết Bảo Mật (HIPAA Audit Logs)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ thao tác truy cập hồ sơ bệnh án và xuất dữ liệu đều được ghi vết bảo mật.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhật ký..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Mức độ (Tất cả)</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>

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

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        loading={loading}
        emptyMessage="Không có nhật ký kiểm toán nào phù hợp."
      />
    </div>
  );
};
