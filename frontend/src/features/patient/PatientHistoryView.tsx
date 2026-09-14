import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { EyeBadge } from '../../components/ui/EyeBadge';
import { ScanTypeBadge } from '../../components/ui/ScanTypeBadge';

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
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SCORE_DESC' | 'SCORE_ASC'>('NEWEST');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setActionNotice(`Đã làm mới danh sách (${screenings.length} ca khám)`);
      } catch {
        setActionNotice('Đã gửi yêu cầu làm mới dữ liệu');
      } finally {
        setIsRefreshing(false);
        setTimeout(() => setActionNotice(null), 3500);
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setEyeFilter('ALL');
    setRiskFilter('ALL');
    setSortBy('NEWEST');
    setActionNotice('Đã đặt lại toàn bộ bộ lọc và ô tìm kiếm về mặc định');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredData = useMemo(() => {
    const list = screenings.filter((s) => {
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

    return list.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'SCORE_DESC') {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === 'SCORE_ASC') {
        return (a.riskScore || 0) - (b.riskScore || 0);
      }
      return 0;
    });
  }, [screenings, searchTerm, eyeFilter, riskFilter, sortBy]);

  const getScoreBadgeClass = (score: number) => {
    if (score < 45) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (score < 65) {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    if (score < 80) {
      return 'bg-orange-50 text-orange-700 border-orange-200/80';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200/80 font-extrabold';
  };

  const renderStatusBadge = (status: string, doctorReviewed: boolean) => {
    const s = (status || '').toUpperCase();
    if (s === 'REVIEWED' || doctorReviewed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 select-none">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Đã duyệt lâm sàng
        </span>
      );
    }
    if (s === 'ANALYZED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200/80 select-none">
          <Clock className="w-3 h-3 text-cyan-600" />
          Đã phân tích AI
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 select-none">
          <XCircle className="w-3 h-3 text-rose-600" />
          Thất bại
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 select-none">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        Đang xử lý
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
            <span className="font-semibold text-slate-800 font-mono-data block text-xs">
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
      accessor: (row) => <EyeBadge position={row.eyePosition} />,
    },
    // Cột 3: Loại ảnh
    {
      header: 'Loại Ảnh Chụp',
      accessor: (row) => <ScanTypeBadge scanType={row.scanType} />,
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
            className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono-data font-bold border ${getScoreBadgeClass(
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
              type="button"
              onClick={() => onSelectScreening(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200/80 transition-colors shadow-2xs cursor-pointer"
              title="Xem bản đồ nhiệt Grad-CAM"
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>Xem Heatmap</span>
            </button>
          )}
          {onOpenReportModal && (
            <button
              type="button"
              onClick={() => onOpenReportModal(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
              title="Xuất báo cáo y khoa chuẩn PDF/CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Xuất Báo Cáo</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Filter Card Clean UI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Trường 1: Tìm kiếm */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tìm kiếm ca khám
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã khám, bác sĩ, ghi chú..."
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Trường 2: Mắt khám */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mắt khám
            </label>
            <div className="relative">
              <select
                value={eyeFilter}
                onChange={(e) => setEyeFilter(e.target.value as any)}
                className="w-full h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả mắt</option>
                <option value="OD">Mắt Phải (OD)</option>
                <option value="OS">Mắt Trái (OS)</option>
                <option value="BOTH">Cả hai mắt</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Trường 3: Mức nguy cơ */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mức nguy cơ
            </label>
            <div className="relative">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="w-full h-10 px-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả mức độ</option>
                <option value="LOW">Nguy cơ Thấp</option>
                <option value="MODERATE">Nguy cơ Trung bình</option>
                <option value="HIGH">Nguy cơ Cao</option>
                <option value="CRITICAL">Nguy kịch</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                className="flex-1 h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Thông báo tương tác khi nhấn nút */}
        {actionNotice && (
          <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              {actionNotice}
            </span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-teal-700 hover:text-teal-950 text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Header Danh Sách & Sắp Xếp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Lịch sử khám sàng lọc
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredData.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0 font-medium">Sắp xếp:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 appearance-none cursor-pointer shadow-2xs"
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="SCORE_DESC">Điểm nguy cơ cao nhất</option>
              <option value="SCORE_ASC">Điểm nguy cơ thấp nhất</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

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
