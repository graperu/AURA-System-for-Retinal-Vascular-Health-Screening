import React, { useState } from 'react';
import { History, Search, Eye, Filter, FileText, Calendar, ArrowUpDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';

export interface PatientHistoryItem {
  id: string;
  createdAt: string;
  eyePosition: string;
  scanType: string;
  riskLevel: string;
  doctorReviewed: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface PatientHistoryViewProps {
  screenings: PatientHistoryItem[];
  loading?: boolean;
  onSelectScreening?: (item: PatientHistoryItem) => void;
  onOpenReportModal?: (item: PatientHistoryItem) => void;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  screenings,
  loading = false,
  onSelectScreening,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<'ALL' | 'OD' | 'OS'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('ALL');

  const filteredData = screenings.filter((s) => {
    const matchSearch = (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEye = eyeFilter === 'ALL' || s.eyePosition === eyeFilter;
    const matchRisk = riskFilter === 'ALL' || (s.riskLevel || '').toUpperCase() === riskFilter;
    return matchSearch && matchEye && matchRisk;
  });

  const columns: Column<PatientHistoryItem>[] = [
    {
      header: 'Thời Gian Sàng Lọc',
      accessor: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 font-mono-data block">
            {new Date(row.createdAt || Date.now()).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
          <span className="text-[11px] text-slate-400 block">
            {new Date(row.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Mắt Khám',
      accessor: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono-data border ${
          row.eyePosition === 'OD'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-teal-50 text-teal-700 border-teal-200'
        }`}>
          {row.eyePosition === 'OD' ? 'Mắt Phải (OD)' : row.eyePosition === 'OS' ? 'Mắt Trái (OS)' : row.eyePosition || 'Cả 2 mắt'}
        </span>
      ),
    },
    {
      header: 'Mức Độ Nguy Cơ',
      accessor: (row) => <RiskBadge level={row.riskLevel} size="sm" />,
    },
    {
      header: 'Trạng Thái Thẩm Định',
      accessor: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
          row.doctorReviewed
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {row.doctorReviewed ? 'Đã duyệt' : 'Chờ bác sĩ xem'}
        </span>
      ),
    },
    {
      header: 'Thao Tác',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          {onSelectScreening && (
            <button
              onClick={() => onSelectScreening(row)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#F0FDFA] text-slate-700 hover:text-[#0891B2] transition-colors"
              title="Xem bản đồ nhiệt"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onOpenReportModal && (
            <button
              onClick={() => onOpenReportModal(row)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#F0FDFA] text-slate-700 hover:text-[#0891B2] transition-colors"
              title="Xem báo cáo y khoa"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-[#0891B2]" />
              Lịch Sử Sàng Lọc Vi Mạch Võng Mạc
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi biến chuyển các chỉ số vi mạch qua các lần khám định kỳ.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo ghi chú..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2]"
            >
              <option value="ALL">Mắt (Tất cả)</option>
              <option value="OD">Mắt Phải (OD)</option>
              <option value="OS">Mắt Trái (OS)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Chưa có ca khám sàng lọc nào phù hợp với bộ lọc."
      />
    </div>
  );
};
