import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';

export interface PatientHistoryItem {
  id: string;
  rawId?: string;
  createdAt: string;
  eyePosition: string;
  scanType: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  doctorReviewed: boolean;
  doctorName?: string;
  doctorNotes?: string;
  digitalSignature?: string;
  signedAt?: string;
  icd10Codes?: string[];
  imageUrl?: string;
  rawScreening?: Record<string, unknown>;
  notes?: string;
}

export interface PatientHistoryViewProps {
  screenings: PatientHistoryItem[];
  loading?: boolean;
  onSelectScreening?: (item: PatientHistoryItem) => void;
  onOpenReportModal?: (item: PatientHistoryItem) => void;
  onRefresh?: () => void;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  screenings,
  loading = false,
  onSelectScreening,
  onOpenReportModal,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<'ALL' | 'OD' | 'OS' | 'BOTH'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('ALL');

  const filteredData = useMemo(() => {
    return screenings.filter((s) => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        (s.id || '').toLowerCase().includes(term) ||
        (s.doctorNotes || '').toLowerCase().includes(term) ||
        (s.notes || '').toLowerCase().includes(term) ||
        (s.doctorName || '').toLowerCase().includes(term);

      const normEye = (s.eyePosition || '').toUpperCase();
      const matchEye =
        eyeFilter === 'ALL' ||
        (eyeFilter === 'OD' && (normEye.includes('OD') || normEye.includes('RIGHT'))) ||
        (eyeFilter === 'OS' && (normEye.includes('OS') || normEye.includes('LEFT'))) ||
        (eyeFilter === 'BOTH' && (normEye.includes('BOTH') || normEye.includes('2')));

      const normRisk = (s.riskLevel || '').toUpperCase();
      const matchRisk =
        riskFilter === 'ALL' ||
        (riskFilter === 'LOW' && (normRisk === 'LOW' || normRisk === 'NORMAL')) ||
        (riskFilter === 'MODERATE' && (normRisk === 'MODERATE' || normRisk === 'MEDIUM')) ||
        (riskFilter === 'HIGH' && normRisk === 'HIGH') ||
        (riskFilter === 'CRITICAL' && (normRisk === 'CRITICAL' || normRisk === 'SEVERE'));

      return matchSearch && matchEye && matchRisk;
    });
  }, [screenings, searchTerm, eyeFilter, riskFilter]);

  const getScoreBadgeClass = (score: number) => {
    if (score < 45) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (score < 65) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (score < 80) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
  };

  const renderStatusBadge = (status: string, doctorReviewed: boolean) => {
    const s = (status || '').toUpperCase();
    if (s === 'REVIEWED' || doctorReviewed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Đã duyệt lâm sàng
        </span>
      );
    }
    if (s === 'ANALYZED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Clock className="w-3 h-3 text-cyan-600" />
          Đã phân tích AI
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Thất bại
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        Đang xử lý
      </span>
    );
  };

  const renderScanTypeBadge = (scanType: string) => {
    const typeUpper = (scanType || '').toUpperCase();
    let label = scanType || 'Ảnh võng mạc';
    if (typeUpper.includes('MACULA')) {
      label = 'Fundus Hoàng Điểm';
    } else if (typeUpper.includes('OPTIC') || typeUpper.includes('DISC')) {
      label = 'Fundus Đĩa Thị';
    } else if (typeUpper.includes('OCT')) {
      label = 'Cắt lớp OCT';
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 font-mono-data">
        {label}
      </span>
    );
  };

  const columns: Column<PatientHistoryItem>[] = [
    // Cột 1: Ngày & Giờ khám
    {
      header: 'Ngày & Giờ Khám',
      accessor: (row) => {
        const dateObj = row.createdAt ? new Date(row.createdAt) : new Date();
        const isValidDate = !isNaN(dateObj.getTime());
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 font-mono-data block text-xs">
              {isValidDate
                ? dateObj.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'Chưa có ngày'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono-data">
              {isValidDate
                ? dateObj.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--'}
            </span>
          </div>
        );
      },
    },
    // Cột 2: Mắt khám
    {
      header: 'Mắt Khám',
      accessor: (row) => {
        const eye = (row.eyePosition || '').toUpperCase();
        if (eye.includes('OD') || eye.includes('RIGHT')) {
          return (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono-data border bg-blue-50 text-blue-700 border-blue-200">
              Mắt Phải (OD)
            </span>
          );
        }
        if (eye.includes('OS') || eye.includes('LEFT')) {
          return (
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono-data border bg-teal-50 text-teal-700 border-teal-200">
              Mắt Trái (OS)
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono-data border bg-cyan-50 text-cyan-800 border-cyan-200">
            Hai mắt (OD+OS)
          </span>
        );
      },
    },
    // Cột 3: Loại ảnh
    {
      header: 'Loại Ảnh Chụp',
      accessor: (row) => renderScanTypeBadge(row.scanType),
    },
    // Cột 4: Mức độ rủi ro
    {
      header: 'Mức Độ Nguy Cơ',
      accessor: (row) => <RiskBadge level={row.riskLevel} size="sm" />,
    },
    // Cột 5: Điểm rủi ro
    {
      header: 'Điểm Rủi Ro',
      accessor: (row) => {
        const score = typeof row.riskScore === 'number' ? row.riskScore : 0;
        return (
          <span
            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono-data font-bold border ${getScoreBadgeClass(
              score
            )}`}
          >
            {score}/100
          </span>
        );
      },
    },
    // Cột 6: Trạng thái ca khám
    {
      header: 'Trạng Thái Ca Khám',
      accessor: (row) => renderStatusBadge(row.status, row.doctorReviewed),
    },
    // Cột 7: Thao tác
    {
      header: 'Thao Tác',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          {onSelectScreening && (
            <button
              onClick={() => onSelectScreening(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 transition-colors shadow-2xs"
              title="Xem bản đồ nhiệt Grad-CAM"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-600" />
              <span>Xem Bản Đồ Nhiệt</span>
            </button>
          )}
          {onOpenReportModal && (
            <button
              onClick={() => onOpenReportModal(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-2xs"
              title="Xuất báo cáo y khoa chuẩn PDF/CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Báo Cáo</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-[#0891B2]" />
              Lịch Sử Khám & Theo Dõi Vi Mạch Võng Mạc (FR-6)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng hợp toàn bộ các đợt chụp đáy mắt, theo dõi tiến trình nguy cơ tim mạch và xuất báo cáo y tế.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã khám, bác sĩ, ghi chú..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0891B2] transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {/* Filter by Eye */}
            <select
              value={eyeFilter}
              onChange={(e) => setEyeFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2] font-medium"
            >
              <option value="ALL">Mắt (Tất cả)</option>
              <option value="OD">Mắt Phải (OD)</option>
              <option value="OS">Mắt Trái (OS)</option>
              <option value="BOTH">Cả hai mắt</option>
            </select>

            {/* Filter by Risk Level */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#0891B2] font-medium"
            >
              <option value="ALL">Nguy cơ (Tất cả)</option>
              <option value="LOW">Nguy cơ Thấp</option>
              <option value="MODERATE">Nguy cơ Trung bình</option>
              <option value="HIGH">Nguy cơ Cao</option>
              <option value="CRITICAL">Nguy kịch</option>
            </select>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            )}
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
