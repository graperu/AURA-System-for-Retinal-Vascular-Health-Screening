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
  X,
  ShieldCheck,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { EyeBadge } from '../../components/ui/EyeBadge';
import { ScanTypeBadge } from '../../components/ui/ScanTypeBadge';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { screeningApi } from '../../services/api';

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
  onDeleteScreening?: (id: string) => Promise<boolean | void>;
  onBatchDeleteScreenings?: (ids: string[]) => Promise<boolean | void>;
}

type EyeFilterType = 'ALL' | 'OD' | 'OS' | 'BOTH';
type RiskFilterType = 'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
type SortByType = 'NEWEST' | 'OLDEST' | 'SCORE_DESC' | 'SCORE_ASC';

interface DeleteTarget {
  type: 'single' | 'batch';
  item?: PatientHistoryItem;
  ids?: string[];
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  screenings,
  loading = false,
  onSelectScreening,
  onOpenReportModal,
  onRefresh,
  onDeleteScreening,
  onBatchDeleteScreenings,
}) => {
  const { t, isVi } = useLanguage();

  const eyeFilterOptions = useMemo<ClinicalSelectOption<EyeFilterType>[]>(
    () => [
      { value: 'ALL', label: isVi ? 'Tất cả mắt' : 'All eyes' },
      { value: 'OD', label: isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)' },
      { value: 'OS', label: isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)' },
      { value: 'BOTH', label: isVi ? 'Cả hai mắt' : 'Both eyes' },
    ],
    [isVi]
  );

  const riskFilterOptions = useMemo<ClinicalSelectOption<RiskFilterType>[]>(
    () => [
      { value: 'ALL', label: isVi ? 'Tất cả mức độ' : 'All levels' },
      { value: 'LOW', label: isVi ? 'Nguy cơ Thấp' : 'Low Risk', riskLevel: 'low' },
      { value: 'MODERATE', label: isVi ? 'Nguy cơ Trung bình' : 'Moderate Risk', riskLevel: 'moderate' },
      { value: 'HIGH', label: isVi ? 'Nguy cơ Cao' : 'High Risk', riskLevel: 'high' },
      { value: 'CRITICAL', label: isVi ? 'Nguy kịch' : 'Critical Risk', riskLevel: 'critical' },
    ],
    [isVi]
  );

  const sortOptions = useMemo<ClinicalSelectOption<SortByType>[]>(
    () => [
      { value: 'NEWEST', label: isVi ? 'Mới nhất trước' : 'Newest first' },
      { value: 'OLDEST', label: isVi ? 'Cũ nhất trước' : 'Oldest first' },
      { value: 'SCORE_DESC', label: isVi ? 'Điểm nguy cơ cao nhất' : 'Highest risk score' },
      { value: 'SCORE_ASC', label: isVi ? 'Điểm nguy cơ thấp nhất' : 'Lowest risk score' },
    ],
    [isVi]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<'ALL' | 'OD' | 'OS' | 'BOTH'>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SCORE_DESC' | 'SCORE_ASC'>('NEWEST');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setSelectedIds(new Set());
        setActionNotice(
          isVi
            ? `Đã làm mới danh sách (${screenings.length} ca khám)`
            : `Refreshed screening list (${screenings.length} cases)`
        );
      } catch {
        setActionNotice(isVi ? 'Đã gửi yêu cầu làm mới dữ liệu' : 'Sent data refresh request');
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
    setSelectedIds(new Set());
    setActionNotice(
      t(
        'patient.history.filters.resetFiltersNotice',
        isVi
          ? 'Đã đặt lại toàn bộ điều kiện lọc về mặc định. Lịch sử khám bệnh được lưu trữ an toàn theo tiêu chuẩn y tế.'
          : 'Reset all filter criteria to default. Medical screening history is securely preserved per clinical standards.'
      )
    );
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

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredData.length === 0) return;
    const allFilteredSelected = filteredData.every((item) => selectedIds.has(item.id));
    if (allFilteredSelected) {
      // Bỏ chọn các phần tử trong filteredData
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      // Chọn tất cả phần tử trong filteredData
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Export to CSV / Excel
  const handleExportCsv = (itemsToExport?: PatientHistoryItem[]) => {
    const targetItems =
      itemsToExport ||
      (selectedIds.size > 0
        ? filteredData.filter((item) => selectedIds.has(item.id))
        : filteredData);

    if (targetItems.length === 0) {
      setActionNotice(isVi ? 'Không có ca khám nào để xuất' : 'No records to export');
      return;
    }

    const sanitizeCsvCell = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      // Chống lỗ hổng CSV Injection / Formula Injection (OWASP)
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const formatDateTime = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return dateStr;
      }
    };

    const formatRiskLevel = (lvl?: string) => {
      const u = (lvl || '').toUpperCase();
      if (u.includes('LOW') || u.includes('THẤP') || u.includes('THAP')) return isVi ? 'Nguy cơ Thấp' : 'Low Risk';
      if (u.includes('MODERATE') || u.includes('TRUNG')) return isVi ? 'Nguy cơ Trung bình' : 'Moderate Risk';
      if (u.includes('HIGH') || u.includes('CAO')) return isVi ? 'Nguy cơ Cao' : 'High Risk';
      if (u.includes('CRITICAL') || u.includes('NGUY KỊCH') || u.includes('NGUY KICH')) return isVi ? 'Nguy kịch' : 'Critical Risk';
      return lvl || (isVi ? 'Chưa xác định' : 'Undetermined');
    };

    const headers = [
      'STT',
      isVi ? 'Mã Ca Khám' : 'Screening ID',
      isVi ? 'Thời Gian Khám' : 'Exam Date/Time',
      isVi ? 'Mắt Khám' : 'Eye Laterality',
      isVi ? 'Loại Ảnh' : 'Image Type',
      isVi ? 'Điểm Nguy Cơ (0-100)' : 'Risk Score (0-100)',
      isVi ? 'Phân Tầng Nguy Cơ' : 'Risk Classification',
      isVi ? 'Trạng Thái Khám' : 'Review Status',
      isVi ? 'Bác Sĩ Thẩm Định' : 'Attending Doctor',
      isVi ? 'Mã Bệnh ICD-10' : 'ICD-10 Code',
      isVi ? 'Kết Luận / Ghi Chú' : 'Clinical Notes',
    ];

    const rows = targetItems.map((item, idx) => {
      const dateStr = formatDateTime(item.createdAt);
      const eyeStr =
        item.eyePosition === 'OS' || item.eyePosition?.toUpperCase().includes('LEFT')
          ? (isVi ? 'Mắt Trái (OS)' : 'Left Eye (OS)')
          : (isVi ? 'Mắt Phải (OD)' : 'Right Eye (OD)');
      const riskLevelStr = formatRiskLevel(item.riskLevel);
      const statusStr =
        item.status === 'REVIEWED' || item.doctorReviewed
          ? (isVi ? 'Đã duyệt lâm sàng' : 'Clinically Reviewed')
          : item.status === 'FAILED'
          ? (isVi ? 'Thất bại' : 'Failed')
          : (isVi ? 'Đã phân tích AI' : 'AI Analyzed');
      const doctorStr =
        item.doctorName || (item.doctorReviewed ? (isVi ? 'Bác sĩ chuyên khoa' : 'Specialist') : (isVi ? 'Chưa thẩm định' : 'Unreviewed'));
      const notesStr = (item.doctorNotes || item.notes || '').replace(/[\r\n]+/g, ' ');
      const icdStr = (item.icd10Codes || []).join('; ');

      return [
        sanitizeCsvCell(idx + 1),
        sanitizeCsvCell(item.rawId || item.id),
        sanitizeCsvCell(dateStr),
        sanitizeCsvCell(eyeStr),
        sanitizeCsvCell(item.scanType || (isVi ? 'Chụp đáy mắt (Fundus)' : 'Fundus')),
        sanitizeCsvCell(item.riskScore ?? 0),
        sanitizeCsvCell(riskLevelStr),
        sanitizeCsvCell(statusStr),
        sanitizeCsvCell(doctorStr),
        sanitizeCsvCell(icdStr || (isVi ? 'Không' : 'None')),
        sanitizeCsvCell(notesStr || (isVi ? 'Không có ghi chú' : 'None')),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map((h) => sanitizeCsvCell(h)).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `aura_lich_su_kham_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionNotice(
      isVi
        ? `Đã xuất thành công ${targetItems.length} ca khám ra file CSV`
        : `Successfully exported ${targetItems.length} records to CSV`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Delete handlers
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single' && deleteTarget.item) {
        const id = deleteTarget.item.rawId || deleteTarget.item.id;
        if (onDeleteScreening) {
          await onDeleteScreening(id);
        } else {
          const res = await screeningApi.delete(id);
          if (res && res.success === false) {
            throw new Error(res.message || (isVi ? 'Không thể xóa ca khám' : 'Failed to delete screening'));
          }
        }
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.item!.id);
          return next;
        });
        setActionNotice(isVi ? 'Đã xóa ca khám thành công' : 'Screening record deleted successfully');
      } else if (deleteTarget.type === 'batch' && deleteTarget.ids) {
        const ids = deleteTarget.ids;
        if (onBatchDeleteScreenings) {
          await onBatchDeleteScreenings(ids);
        } else {
          const res = await screeningApi.batchDelete(ids);
          if (res && res.success === false) {
            throw new Error(res.message || (isVi ? 'Không thể xóa các ca khám đã chọn' : 'Failed to delete selected screenings'));
          }
        }
        setSelectedIds(new Set());
        setActionNotice(
          isVi
            ? `Đã xóa thành công ${ids.length} ca khám`
            : `Successfully deleted ${ids.length} screening records`
        );
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Delete screening error:', err);
      setActionNotice(
        err.message || (isVi ? 'Không thể xóa ca khám. Vui lòng thử lại.' : 'Failed to delete screening.')
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

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
          {isVi ? 'Đã duyệt lâm sàng' : 'Clinically Reviewed'}
        </span>
      );
    }
    if (s === 'ANALYZED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200/80 select-none">
          <Clock className="w-3 h-3 text-cyan-600" />
          {isVi ? 'Đã phân tích AI' : 'AI Analyzed'}
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 select-none">
          <XCircle className="w-3 h-3 text-rose-600" />
          {isVi ? 'Thất bại' : 'Failed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 select-none">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        {isVi ? 'Đang xử lý' : 'Processing'}
      </span>
    );
  };

  const isAllFilteredSelected =
    filteredData.length > 0 && filteredData.every((item) => selectedIds.has(item.id));
  const isSomeFilteredSelected =
    filteredData.some((item) => selectedIds.has(item.id)) && !isAllFilteredSelected;

  const columns: Column<PatientHistoryItem>[] = [
    // Cột 0: Chọn checkbox
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            ref={(input) => {
              if (input) input.indeterminate = isSomeFilteredSelected;
            }}
            onChange={handleToggleSelectAll}
            aria-label={isVi ? 'Chọn tất cả' : 'Select all'}
            className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-slate-300 cursor-pointer accent-teal-700"
          />
        </div>
      ),
      className: 'w-10 text-center px-2',
      accessor: (row) => (
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => handleToggleSelect(row.id)}
            aria-label={isVi ? `Chọn ca khám ${row.id}` : `Select scan ${row.id}`}
            className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-slate-300 cursor-pointer accent-teal-700"
          />
        </div>
      ),
    },
    // Cột 1: Ngày & Giờ khám
    {
      header: t('patient.history.columns.date', isVi ? 'Ngày & Giờ Khám' : 'Date & Time'),
      accessor: (row) => {
        const dateObj = row.createdAt ? new Date(row.createdAt) : new Date();
        const isValidDate = !isNaN(dateObj.getTime());
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 font-mono-data block text-xs">
              {isValidDate
                ? dateObj.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : isVi
                ? 'Chưa có ngày'
                : 'No date'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono-data">
              {isValidDate
                ? dateObj.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
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
      header: t('patient.history.columns.eye', isVi ? 'Mắt Khám' : 'Eye'),
      accessor: (row) => <EyeBadge position={row.eyePosition} />,
    },
    // Cột 3: Loại ảnh
    {
      header: t('patient.history.columns.modality', isVi ? 'Loại Ảnh Chụp' : 'Modality'),
      accessor: (row) => <ScanTypeBadge scanType={row.scanType} />,
    },
    // Cột 4: Mức độ rủi ro
    {
      header: t('patient.history.columns.riskLevel', isVi ? 'Mức Độ Nguy Cơ' : 'Risk Level'),
      accessor: (row) => <RiskBadge level={row.riskLevel} size="sm" />,
    },
    // Cột 5: Điểm rủi ro
    {
      header: isVi ? 'Điểm Rủi Ro' : 'Risk Score',
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
      header: t('patient.history.columns.status', isVi ? 'Trạng Thái Ca Khám' : 'Status'),
      accessor: (row) => renderStatusBadge(row.status, row.doctorReviewed),
    },
    // Cột 7: Thao tác
    {
      header: isVi ? 'Thao Tác' : 'Action',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onSelectScreening && (
            <button
              type="button"
              onClick={() => onSelectScreening(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200/80 transition-colors shadow-2xs cursor-pointer"
              title={isVi ? 'Xem bản đồ nhiệt Grad-CAM' : 'View Grad-CAM Heatmap'}
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">{isVi ? 'Heatmap' : 'Heatmap'}</span>
            </button>
          )}
          {onOpenReportModal && (
            <button
              type="button"
              onClick={() => onOpenReportModal(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
              title={isVi ? 'Xuất báo cáo y khoa chuẩn PDF/CSV' : 'Export standard medical report PDF/CSV'}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">{isVi ? 'Báo Cáo' : 'Report'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteTarget({ type: 'single', item: row })}
            className="inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
            title={isVi ? 'Xóa ca khám khỏi lịch sử' : 'Delete screening record'}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </button>
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
              {isVi ? 'Tìm kiếm ca khám' : 'Search screenings'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isVi ? 'Tìm mã khám, bác sĩ, ghi chú...' : 'Search by scan ID, doctor, notes...'}
                className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  title={isVi ? 'Xóa tìm kiếm' : 'Clear search'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Trường 2: Mắt khám */}
          <div className="lg:col-span-2 space-y-1.5">
            <ClinicalSelect<EyeFilterType>
              label={isVi ? 'Mắt khám' : 'Eye position'}
              value={eyeFilter}
              onChange={setEyeFilter}
              options={eyeFilterOptions}
              size="md"
            />
          </div>

          {/* Trường 3: Mức nguy cơ */}
          <div className="lg:col-span-2 space-y-1.5">
            <ClinicalSelect<RiskFilterType>
              label={isVi ? 'Mức nguy cơ' : 'Risk level'}
              value={riskFilter}
              onChange={setRiskFilter}
              options={riskFilterOptions}
              size="md"
            />
          </div>

          {/* Nút hành động */}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                className="flex-1 h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={isVi ? 'Làm mới danh sách' : 'Refresh list'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
              title={t(
                'patient.history.filters.resetFiltersTooltip',
                isVi
                  ? 'Đặt lại các điều kiện lọc (Mắt, Mức nguy cơ, Ô tìm kiếm) về mặc định'
                  : 'Reset all filter criteria (Eye, Risk level, Search box) to default'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('patient.history.filters.resetFilters', isVi ? 'Đặt lại' : 'Reset')}</span>
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
              className="text-teal-700 hover:text-teal-950 text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* EHR Immutability Notice Callout */}
      <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-600 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
        <span className="leading-relaxed">
          {t(
            'patient.history.immutabilityNotice',
            isVi
              ? 'Hồ sơ bệnh án điện tử (EMR) được lưu trữ an toàn theo tiêu chuẩn HIPAA & Bộ Y Tế.'
              : 'Electronic Medical Records (EMR) are securely preserved per HIPAA and clinical standards.'
          )}
        </span>
      </div>

      {/* Header Danh Sách & Sắp Xếp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isVi ? 'Lịch sử khám sàng lọc' : 'Retinal screening history'}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredData.length})
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
          <button
            type="button"
            onClick={() => handleExportCsv(filteredData)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-teal-50/60 text-slate-700 hover:text-teal-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all cursor-pointer shrink-0"
            title={isVi ? 'Xuất toàn bộ danh sách ra file Excel / CSV' : 'Export all records to Excel / CSV'}
          >
            <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="whitespace-nowrap">{isVi ? 'Xuất CSV' : 'Export CSV'}</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {isVi ? 'Sắp xếp:' : 'Sort by:'}
            </span>
            <ClinicalSelect<SortByType>
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              size="sm"
              className="w-44 sm:w-48"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        loading={loading}
        pagination={{
          pageSize: 10,
          pageSizeOptions: [5, 10, 20, 50],
          itemLabel: isVi ? 'ca khám' : 'screenings',
        }}
        emptyMessage={
          isVi
            ? 'Chưa có ca khám sàng lọc nào phù hợp với bộ lọc.'
            : 'No screening records found matching current filters.'
        }
      />

      {/* Floating / Sticky Batch Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold">
              {isVi
                ? `Đã chọn ${selectedIds.size} / ${filteredData.length} ca khám`
                : `Selected ${selectedIds.size} / ${filteredData.length} records`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {isVi ? 'Bỏ chọn' : 'Deselect all'}
            </button>
            <button
              type="button"
              onClick={() => handleExportCsv()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isVi ? `Xuất CSV (${selectedIds.size})` : `Export CSV (${selectedIds.size})`}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'batch',
                  ids: Array.from(selectedIds),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isVi ? `Xóa Đã Chọn (${selectedIds.size})` : `Delete Selected (${selectedIds.size})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {deleteTarget.type === 'batch'
                    ? isVi
                      ? `Xác nhận xóa ${deleteTarget.ids?.length} ca khám đã chọn?`
                      : `Confirm deletion of ${deleteTarget.ids?.length} selected scans?`
                    : isVi
                    ? 'Xác nhận xóa ca khám này?'
                    : 'Confirm deletion of this screening record?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isVi
                    ? 'Hành động này sẽ xóa vĩnh viễn dữ liệu ảnh chụp võng mạc và các chỉ số phân tích AI liên quan khỏi hệ thống. Thao tác không thể hoàn tác.'
                    : 'This action will permanently remove retinal fundus scans and associated AI biomarkers from the system. This cannot be undone.'}
                </p>
              </div>
            </div>

            {deleteTarget.type === 'single' && deleteTarget.item && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono-data">
                <div className="text-slate-700">
                  <strong>ID:</strong> {deleteTarget.item.id}
                </div>
                <div className="text-slate-600">
                  <strong>{isVi ? 'Thời gian:' : 'Date:'}</strong>{' '}
                  {new Date(deleteTarget.item.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')} •{' '}
                  <strong>{isVi ? 'Mắt:' : 'Eye:'}</strong> {deleteTarget.item.eyePosition}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isVi ? 'Xác nhận xóa' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
