import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Activity,
  Eye,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';
import { screeningApi } from '../../services/api';
import { DoctorPatientSummary } from '../../pages/CDSDashboardPage';
import { useLanguage } from '../../context/LanguageContext';

interface DoctorRiskAnalyticsViewProps {
  assignedPatients: DoctorPatientSummary[];
  initialScreenings?: any[];
  onSelectPatientForCDS: (patientId: string, screeningId?: string) => void;
  onNavigate?: (section: string) => void;
}

export const DoctorRiskAnalyticsView: React.FC<DoctorRiskAnalyticsViewProps> = ({
  assignedPatients,
  initialScreenings,
  onSelectPatientForCDS,
}) => {
  const { t, isVi } = useLanguage();
  const [screenings, setScreenings] = useState<any[]>(initialScreenings || []);
  const [loading, setLoading] = useState<boolean>(!initialScreenings);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Multi-selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'batch';
    item?: any;
    ids?: string[];
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await screeningApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        setScreenings(res.data);
      } else {
        setScreenings([]);
      }
    } catch (err) {
      console.warn('Error loading screenings for analytics:', err);
      setError(
        isVi
          ? 'Không thể tải danh sách ca sàng lọc phục vụ thống kê lâm sàng.'
          : 'Failed to load screening cases for clinical analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, [isVi]);

  const handleRefreshAnalytics = async () => {
    await loadAnalyticsData();
    setActionNotice(
      isVi
        ? 'Đã làm mới dữ liệu thống kê lâm sàng thành công'
        : 'Clinical analytics refreshed successfully'
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Metric 1: Tổng số bệnh nhân phụ trách
  const totalPatients = assignedPatients.length;

  // Metric 2: Tổng số ca sàng lọc đã duyệt (REVIEWED)
  const reviewedScreenings = useMemo(() => {
    return screenings.filter(
      (s) => s.status === 'REVIEWED' || s.reviewDecision != null || s.digitalSignature != null
    );
  }, [screenings]);
  const totalReviewed = reviewedScreenings.length;

  // Metric 3: Số ca chờ thẩm định (ANALYZED / PENDING)
  const pendingScreenings = useMemo(() => {
    return screenings.filter(
      (s) => s.status === 'ANALYZED' || s.status === 'PENDING' || (s.status !== 'FAILED' && !s.reviewDecision)
    );
  }, [screenings]);
  const totalPending = pendingScreenings.length;

  // Metric 4: Tỷ lệ đồng thuận với AI (% Doctor-AI Consensus Rate)
  const consensusRate = useMemo(() => {
    if (totalReviewed === 0) return 100;
    const agreedCount = reviewedScreenings.filter((s) => {
      if (s.reviewDecision === 'APPROVED') return true;
      if (s.doctorRiskLevel && s.aiRiskLevel && s.doctorRiskLevel === s.aiRiskLevel) return true;
      if (s.reviewDecision === 'MODIFIED') return false;
      return true;
    }).length;
    return Math.round((agreedCount / totalReviewed) * 100);
  }, [reviewedScreenings, totalReviewed]);

  // Phân bố mức độ nguy cơ lâm sàng
  const riskDistribution = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
    screenings.forEach((s) => {
      const level = (s.riskLevel || s.aiRiskLevel || 'LOW').toUpperCase();
      if (level === 'CRITICAL' || level === 'SEVERE') counts.CRITICAL++;
      else if (level === 'HIGH') counts.HIGH++;
      else if (level === 'MODERATE' || level === 'MEDIUM') counts.MODERATE++;
      else counts.LOW++;
    });
    const total = screenings.length || 1;
    return {
      counts,
      percentages: {
        CRITICAL: Math.round((counts.CRITICAL / total) * 100),
        HIGH: Math.round((counts.HIGH / total) * 100),
        MODERATE: Math.round((counts.MODERATE / total) * 100),
        LOW: Math.round((counts.LOW / total) * 100),
      },
    };
  }, [screenings]);

  // Thống kê trung bình các chỉ số sinh học vi mạch (Vascular Biomarkers)
  const biomarkerAverages = useMemo(() => {
    const validAv = screenings.filter((s) => typeof s.avRatio === 'number' && s.avRatio > 0);
    const validDensity = screenings.filter((s) => typeof s.vesselDensityPercent === 'number' && s.vesselDensityPercent > 0);
    const validTortuosity = screenings.filter((s) => typeof s.tortuosityIndex === 'number' && s.tortuosityIndex > 0);
    const validCdr = screenings.filter((s) => typeof s.verticalCdr === 'number' && s.verticalCdr > 0);

    const avgAvRatio = validAv.length > 0
      ? (validAv.reduce((acc, cur) => acc + cur.avRatio, 0) / validAv.length).toFixed(2)
      : '0.65';

    const avgDensity = validDensity.length > 0
      ? (validDensity.reduce((acc, cur) => acc + cur.vesselDensityPercent, 0) / validDensity.length).toFixed(1)
      : '43.8';

    const avgTortuosity = validTortuosity.length > 0
      ? (validTortuosity.reduce((acc, cur) => acc + cur.tortuosityIndex, 0) / validTortuosity.length).toFixed(3)
      : '0.092';

    const avgCdr = validCdr.length > 0
      ? (validCdr.reduce((acc, cur) => acc + cur.verticalCdr, 0) / validCdr.length).toFixed(2)
      : '0.34';

    return { avgAvRatio, avgDensity, avgTortuosity, avgCdr };
  }, [screenings]);

  // Lọc danh sách ca khám theo nhóm rủi ro
  const filteredScreenings = useMemo(() => {
    if (riskFilter === 'ALL') return screenings;
    return screenings.filter((s) => {
      const lvl = (s.riskLevel || s.aiRiskLevel || 'LOW').toUpperCase();
      if (riskFilter === 'CRITICAL') return lvl === 'CRITICAL' || lvl === 'SEVERE';
      return lvl === riskFilter;
    });
  }, [screenings, riskFilter]);

  // Selection handlers
  const isAllFilteredSelected =
    filteredScreenings.length > 0 &&
    filteredScreenings.every((item) => selectedIds.has(String(item.id)));
  const isSomeFilteredSelected =
    filteredScreenings.some((item) => selectedIds.has(String(item.id))) &&
    !isAllFilteredSelected;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredScreenings.length === 0) return;
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredScreenings.forEach((item) => next.delete(String(item.id)));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredScreenings.forEach((item) => next.add(String(item.id)));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single' && deleteTarget.item) {
        const screeningId = String(deleteTarget.item.id);
        const res = await screeningApi.delete(screeningId);
        if (res && res.success === false) {
          throw new Error(res.message || (isVi ? 'Không thể xóa ca khám khỏi hệ thống' : 'Failed to delete screening case'));
        }
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(screeningId);
          return next;
        });
        setActionNotice(
          isVi
            ? 'Đã xóa ca khám thành công khỏi hệ thống'
            : 'Screening case successfully deleted from system'
        );
      } else if (deleteTarget.type === 'batch' && deleteTarget.ids) {
        const ids = deleteTarget.ids;
        const res = await screeningApi.batchDelete(ids);
        if (res && res.success === false) {
          throw new Error(res.message || (isVi ? 'Không thể xóa các ca khám đã chọn' : 'Failed to delete selected screening cases'));
        }
        setSelectedIds(new Set());
        setActionNotice(
          isVi
            ? `Đã xóa thành công ${ids.length} ca khám đã chọn`
            : `Successfully deleted ${ids.length} selected screening cases`
        );
      }
      await loadAnalyticsData();
    } catch (err: any) {
      console.error('Delete screening error:', err);
      setActionNotice(
        err.message ||
          (isVi
            ? 'Không thể xóa ca khám. Vui lòng kiểm tra quyền hạn và thử lại.'
            : 'Failed to delete screening case. Please check permissions and try again.')
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Ánh xạ thông tin bệnh nhân tương ứng cho mỗi ca khám
  const patientMap = useMemo(() => {
    const map = new Map<string, DoctorPatientSummary>();
    assignedPatients.forEach((p) => map.set(p.patientId, p));
    return map;
  }, [assignedPatients]);

  const columns: Column<any>[] = [
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
            aria-label={isVi ? 'Chọn tất cả ca khám' : 'Select all cases'}
            className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-slate-300 cursor-pointer accent-teal-700"
          />
        </div>
      ),
      className: 'w-10 text-center px-2',
      accessor: (row) => {
        const rowId = String(row.id);
        return (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(rowId)}
              onChange={() => handleToggleSelect(rowId)}
              aria-label={isVi ? `Chọn ca khám ${rowId}` : `Select scan ${rowId}`}
              className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-slate-300 cursor-pointer accent-teal-700"
            />
          </div>
        );
      },
    },
    {
      header: isVi ? 'Mã Ca Khám / Ngày' : 'Scan ID / Date',
      accessor: (row) => {
        const dateStr = row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : (isVi ? 'Gần đây' : 'Recent');
        return (
          <div className="space-y-0.5">
            <span className="font-mono-data font-bold text-slate-900 block text-xs">
              #{row.id ? String(row.id).slice(0, 8).toUpperCase() : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 block">{dateStr}</span>
          </div>
        );
      },
    },
    {
      header: t('doctor.worklist.columns.patient', 'Bệnh Nhân'),
      accessor: (row) => {
        const patient = patientMap.get(row.patientId);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] text-[#0891B2] font-bold flex items-center justify-center border border-[#CCFBF1] shrink-0 text-xs">
              {patient?.fullName ? patient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : (isVi ? 'BN' : 'PT')}
            </div>
            <div>
              <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                {patient?.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
              </span>
              <span className="text-[11px] text-slate-500 font-mono-data">
                {patient?.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')} • {patient?.age ? `${patient.age}${isVi ? 't' : 'y'}` : ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: isVi ? 'Mắt Khám' : 'Examined Eye',
      accessor: (row) => {
        const eye = row.eyePosition || 'OD';
        const isOD = eye.includes('OD') || eye.includes('Right');
        return (
          <span className="inline-flex items-center gap-1 font-mono-data font-semibold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <Eye className="w-3 h-3 text-teal-600" />
            {isOD ? (isVi ? 'Mắt Phải' : 'Right Eye') : (isVi ? 'Mắt Trái' : 'Left Eye')}
          </span>
        );
      },
    },
    {
      header: isVi ? 'Chỉ Số Vi Mạch' : 'Biomarkers',
      accessor: (row) => (
        <div className="space-y-0.5 text-xs font-mono-data">
          <div>
            <span className="text-slate-500">A/V: </span>
            <strong className="text-slate-800">{row.avRatio ? row.avRatio.toFixed(2) : '--'}</strong>
          </div>
          <div>
            <span className="text-slate-500">{isVi ? 'Mật độ:' : 'Density:'} </span>
            <strong className="text-slate-800">{row.vesselDensityPercent ? `${row.vesselDensityPercent}%` : '--'}</strong>
          </div>
        </div>
      ),
    },
    {
      header: isVi ? 'Nguy Cơ AI' : 'AI Risk',
      accessor: (row) => <RiskBadge level={row.riskLevel || row.aiRiskLevel || 'Low'} size="sm" />,
    },
    {
      header: isVi ? 'Thẩm Định Bác Sĩ' : 'Doctor Review',
      accessor: (row) => {
        const isReviewed = row.status === 'REVIEWED' || row.reviewDecision != null;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isReviewed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
            {isReviewed
              ? (row.reviewDecision === 'MODIFIED'
                  ? t('doctor.riskAnalytics.modified', 'Đã hiệu chỉnh')
                  : t('doctor.riskAnalytics.approvedSigned', 'Đã duyệt ký'))
              : t('doctor.worklist.filterTabs.pending', 'Chờ thẩm định')}
          </span>
        );
      },
    },
    {
      header: t('doctor.worklist.columns.action', 'Thao Tác'),
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectPatientForCDS(row.patientId, row.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title={t('doctor.worklist.openCds', 'Mở CDS')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('doctor.worklist.openCds', 'Mở CDS')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget({ type: 'single', item: row })}
            className="inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
            title={isVi ? 'Xóa ca khám này' : 'Delete this screening case'}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-clinical-border rounded-2xl p-5 shadow-medical-sm">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <h1 className="text-lg font-bold text-clinical-text">
              {t('doctor.riskAnalytics.title', isVi ? 'Thống Kê Nguy Cơ & Hiệu Suất Lâm Sàng' : 'Clinical Risk & Performance Analytics')}
            </h1>
          </div>
          <p className="text-xs text-clinical-text-muted mt-1">
            {t('doctor.riskAnalytics.subtitle', isVi ? 'Chỉ số nguy cơ vi mạch võng mạc, phân bố rủi ro và tỷ lệ đồng thuận AI.' : 'Retinal microvascular biomarkers, risk distribution and AI consensus.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-clinical-border bg-white hover:bg-slate-50 text-clinical-text-secondary text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('doctor.riskAnalytics.refresh', 'Làm mới')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-950 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
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

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bệnh nhân phụ trách */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-medical-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {t('doctor.riskAnalytics.assignedPatients', 'Bệnh Nhân Phụ Trách')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono-data mt-3">
            {totalPatients}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {t('doctor.riskAnalytics.assignedPatientsDesc', 'Bệnh nhân trong danh sách quản lý')}
          </span>
        </div>

        {/* Card 2: Đã duyệt lâm sàng */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-medical-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">
              {t('doctor.riskAnalytics.clinicallyReviewed', 'Đã Duyệt Lâm Sàng')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono-data mt-3">
            {totalReviewed}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {t('doctor.riskAnalytics.clinicallyReviewedDesc', 'Ca sàng lọc đã ký số / xác nhận')}
          </span>
        </div>

        {/* Card 3: Ca chờ thẩm định */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-medical-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              {t('doctor.riskAnalytics.pendingReview', 'Chờ Thẩm Định')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono-data mt-3">
            {totalPending}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            {t('doctor.riskAnalytics.pendingReviewDesc', 'Ca AI đã phân tích cần bác sĩ xem')}
          </span>
        </div>

        {/* Card 4: Tỷ lệ đồng thuận với AI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-medical-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-700">
              {t('doctor.riskAnalytics.consensusWithAi', 'Đồng Thuận Với AI')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-brand-700 font-mono-data mt-3">
            {consensusRate}%
          </div>
          <span className="text-[11px] text-clinical-text-muted mt-1 block">
            {t('doctor.riskAnalytics.consensusWithAiDesc', 'Tỷ lệ đồng ý với phân loại AI')}
          </span>
        </div>
      </div>

      {/* Row: Phân Bố Mức Nguy Cơ & Trung Bình Chỉ Số Sinh Học Vi Mạch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Phân bố mức độ nguy cơ lâm sàng (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-medical-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0891B2]" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('doctor.riskAnalytics.riskDistributionTitle', 'Phân Bố Nguy Cơ Vi Mạch Lâm Sàng')}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono-data">
              {isVi ? `Tổng: ${screenings.length} ca` : `Total: ${screenings.length} cases`}
            </span>
          </div>

          {/* Phân bổ tỷ lệ trên 1 thanh đa màu */}
          <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
            {riskDistribution.percentages.CRITICAL > 0 && (
              <div
                style={{ width: `${riskDistribution.percentages.CRITICAL}%` }}
                className="bg-red-600 transition-all duration-300"
                title={`${t('doctor.riskAnalytics.critical', 'Nghiêm trọng')}: ${riskDistribution.counts.CRITICAL} (${riskDistribution.percentages.CRITICAL}%)`}
              />
            )}
            {riskDistribution.percentages.HIGH > 0 && (
              <div
                style={{ width: `${riskDistribution.percentages.HIGH}%` }}
                className="bg-orange-500 transition-all duration-300"
                title={`${t('doctor.riskAnalytics.highRisk', 'Nguy cơ cao')}: ${riskDistribution.counts.HIGH} (${riskDistribution.percentages.HIGH}%)`}
              />
            )}
            {riskDistribution.percentages.MODERATE > 0 && (
              <div
                style={{ width: `${riskDistribution.percentages.MODERATE}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`${t('doctor.riskAnalytics.moderate', 'Trung bình')}: ${riskDistribution.counts.MODERATE} (${riskDistribution.percentages.MODERATE}%)`}
              />
            )}
            {riskDistribution.percentages.LOW > 0 && (
              <div
                style={{ width: `${riskDistribution.percentages.LOW}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`${t('doctor.riskAnalytics.lowNormal', 'Thấp / Chuẩn')}: ${riskDistribution.counts.LOW} (${riskDistribution.percentages.LOW}%)`}
              />
            )}
          </div>

          {/* 4 Nhóm chi tiết (Click để lọc) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                riskFilter === 'CRITICAL'
                  ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
                  : 'bg-slate-50/70 border-slate-200 hover:border-red-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-red-700">
                <span>{t('doctor.riskAnalytics.critical', 'Nghiêm trọng')}</span>
                <span className="w-2 h-2 rounded-full bg-red-600" />
              </div>
              <div className="text-xl font-extrabold text-red-600 font-mono-data mt-1">
                {riskDistribution.counts.CRITICAL}
              </div>
              <span className="text-[10px] text-slate-500">{riskDistribution.percentages.CRITICAL}% {isVi ? 'tổng số ca' : 'of total cases'}</span>
            </button>

            <button
              onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                riskFilter === 'HIGH'
                  ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400'
                  : 'bg-slate-50/70 border-slate-200 hover:border-orange-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-orange-700">
                <span>{t('doctor.riskAnalytics.highRisk', 'Nguy cơ cao')}</span>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
              <div className="text-xl font-extrabold text-orange-600 font-mono-data mt-1">
                {riskDistribution.counts.HIGH}
              </div>
              <span className="text-[10px] text-slate-500">{riskDistribution.percentages.HIGH}% {isVi ? 'tổng số ca' : 'of total cases'}</span>
            </button>

            <button
              onClick={() => setRiskFilter(riskFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                riskFilter === 'MODERATE'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                  : 'bg-slate-50/70 border-slate-200 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                <span>{t('doctor.riskAnalytics.moderate', 'Trung bình')}</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-extrabold text-amber-600 font-mono-data mt-1">
                {riskDistribution.counts.MODERATE}
              </div>
              <span className="text-[10px] text-slate-500">{riskDistribution.percentages.MODERATE}% {isVi ? 'tổng số ca' : 'of total cases'}</span>
            </button>

            <button
              onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                  : 'bg-slate-50/70 border-slate-200 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span>{t('doctor.riskAnalytics.lowNormal', 'Thấp / Chuẩn')}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono-data mt-1">
                {riskDistribution.counts.LOW}
              </div>
              <span className="text-[10px] text-slate-500">{riskDistribution.percentages.LOW}% {isVi ? 'tổng số ca' : 'of total cases'}</span>
            </button>
          </div>
        </div>

        {/* Thống kê trung bình các chỉ số sinh học vi mạch (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-clinical-border rounded-2xl p-5 shadow-medical-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-clinical-text">
                {t('doctor.riskAnalytics.avgBiomarkersTitle', 'Chỉ Số Sinh Học Vi Mạch Trung Bình')}
              </h3>
            </div>
            <span className="text-[11px] text-clinical-text-muted font-mono-data">
              {t('doctor.riskAnalytics.cohortAverage', 'Trung bình nhóm')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* A/V Ratio */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-clinical-border space-y-1">
              <span className="text-[11px] text-clinical-text-secondary font-medium block">
                {t('doctor.riskAnalytics.avRatioLabel', 'Tỷ lệ động-tĩnh mạch (A/V)')}
              </span>
              <div className="text-2xl font-bold text-clinical-text font-mono-data text-right mt-1">
                {biomarkerAverages.avgAvRatio}
              </div>
              <span className="text-[10px] text-clinical-text-muted block mt-0.5">
                {t('doctor.riskAnalytics.avRatioRef', 'Chuẩn tham chiếu: ~0.67 (2:3)')}
              </span>
            </div>

            {/* Mật độ vi mạch */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-clinical-border space-y-1">
              <span className="text-[11px] text-clinical-text-secondary font-medium block">
                {t('doctor.riskAnalytics.vesselDensityLabel', 'Mật Độ Vi Mạch')}
              </span>
              <div className="text-2xl font-bold text-clinical-text font-mono-data text-right mt-1">
                {biomarkerAverages.avgDensity}%
              </div>
              <span className="text-[10px] text-clinical-text-muted block mt-0.5">
                {t('doctor.riskAnalytics.vesselDensityRef', 'Bình thường: 42% - 50%')}
              </span>
            </div>

            {/* Độ xoắn vặn mạch */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-clinical-border space-y-1">
              <span className="text-[11px] text-clinical-text-secondary font-medium block">
                {t('doctor.riskAnalytics.tortuosityLabel', 'Độ Xoắn Vặn (Tortuosity)')}
              </span>
              <div className="text-2xl font-bold text-clinical-text font-mono-data text-right mt-1">
                {biomarkerAverages.avgTortuosity}
              </div>
              <span className="text-[10px] text-clinical-text-muted block mt-0.5">
                {t('doctor.riskAnalytics.tortuosityRef', 'Chuẩn: 0.08 - 0.12')}
              </span>
            </div>

            {/* Vertical CDR */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-clinical-border space-y-1">
              <span className="text-[11px] text-clinical-text-secondary font-medium block">
                {t('doctor.riskAnalytics.cdrLabel', 'Lõm Gai Thị (CDR)')}
              </span>
              <div className="text-2xl font-bold text-clinical-text font-mono-data text-right mt-1">
                {biomarkerAverages.avgCdr}
              </div>
              <span className="text-[10px] text-clinical-text-muted block mt-0.5">
                {t('doctor.riskAnalytics.cdrRef', 'Sinh lý bình thường: 0.3 - 0.4')}
              </span>
            </div>
          </div>

          {/* Clinical note */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {t(
                'doctor.riskAnalytics.avWarning',
                'A/V Ratio < 0.50 phản ánh tình trạng co thắt tiểu động mạch võng mạc nghiêm trọng do xơ vữa hoặc tăng huyết áp mạn tính.'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Bảng danh sách ca khám gần nhất */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {t('doctor.riskAnalytics.recentScreeningsTitle', 'Danh Sách Ca Khám Phụ Trách Gần Nhất')}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
              ({filteredScreenings.length})
            </span>
            {riskFilter !== 'ALL' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold">
                {isVi ? 'Lọc:' : 'Filter:'} {riskFilter}
              </span>
            )}
          </div>
          {riskFilter !== 'ALL' && (
            <button
              onClick={() => setRiskFilter('ALL')}
              className="text-xs text-[#0891B2] hover:underline font-bold self-start cursor-pointer"
            >
              {isVi ? 'Xem tất cả' : 'View all'} ({screenings.length})
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredScreenings}
          keyExtractor={(row, idx) => row.id || idx}
          loading={loading}
          pagination={{
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 50],
            itemLabel: isVi ? 'ca khám' : 'screenings',
          }}
          emptyMessage={t('doctor.riskAnalytics.emptyRecent', 'Không có ca sàng lọc nào phù hợp với bộ lọc hiện tại.')}
        />
      </div>

      {/* Floating / Sticky Batch Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold">
              {isVi
                ? `Đã chọn ${selectedIds.size} / ${filteredScreenings.length} ca khám`
                : `Selected ${selectedIds.size} / ${filteredScreenings.length} cases`}
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
                      : `Confirm deletion of ${deleteTarget.ids?.length} selected screening cases?`
                    : isVi
                    ? 'Xác nhận xóa ca khám này?'
                    : 'Confirm deletion of this screening case?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isVi
                    ? 'Hành động này sẽ xóa vĩnh viễn dữ liệu ảnh chụp võng mạc và các chỉ số vi mạch AI liên quan khỏi hệ thống. Thao tác không thể hoàn tác.'
                    : 'This action will permanently delete retinal fundus scans and associated AI biomarkers from the system. This cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isVi ? 'Đang xóa...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {deleteTarget.type === 'batch'
                        ? isVi
                          ? `Xóa ${deleteTarget.ids?.length} ca khám`
                          : `Delete ${deleteTarget.ids?.length} cases`
                        : isVi
                        ? 'Xóa ca khám'
                        : 'Delete record'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Safety Disclaimer */}
      <MedicalDisclaimer variant="subtle" />
    </div>
  );
};
