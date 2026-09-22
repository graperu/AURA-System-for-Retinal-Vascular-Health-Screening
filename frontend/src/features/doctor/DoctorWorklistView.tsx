import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  RefreshCw,
  Stethoscope,
  X,
  Trash2,
  AlertTriangle,
  MessageSquare,
  User,
  Phone,
  MapPin,
  Activity,
  Heart,
  RotateCcw,
} from 'lucide-react';
import { PatientProfile } from '../../types/cds';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ClinicalSelect, ClinicalSelectOption } from '../../components/ui/ClinicalSelect';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';

type RiskFilterType = 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
type ReviewFilterType = 'ALL' | 'PENDING' | 'REVIEWED';

export interface DoctorWorklistViewProps {
  patients: PatientProfile[];
  loading?: boolean;
  onRefresh?: () => void;
  onSelectPatient: (patient: PatientProfile) => void;
  onStartConsultation?: (patient: PatientProfile) => void;
  onNewPatientClick?: () => void;
  onDeletePatient?: (patient: PatientProfile) => Promise<boolean | void> | void;
  onBatchDeletePatients?: (patientIds: string[]) => Promise<boolean | void> | void;
}

export const DoctorWorklistView: React.FC<DoctorWorklistViewProps> = ({
  patients,
  loading = false,
  onRefresh,
  onSelectPatient,
  onStartConsultation,
  onNewPatientClick,
  onDeletePatient,
  onBatchDeletePatients,
}) => {
  const { t, isVi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilterType>('ALL');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilterType>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [viewingPatient, setViewingPatient] = useState<PatientProfile | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch';
    targetPatient?: PatientProfile;
  }>({ isOpen: false, mode: 'single' });

  const reviewFilterOptions = useMemo<ClinicalSelectOption<ReviewFilterType>[]>(
    () => [
      { value: 'ALL', label: t('doctor.worklist.allStatuses', 'Tất cả trạng thái') },
      { value: 'PENDING', label: t('doctor.worklist.pendingStatus', 'Chờ xem xét') },
      { value: 'REVIEWED', label: t('doctor.worklist.reviewedStatus', 'Đã ký duyệt') },
    ],
    [t]
  );

  const riskFilterOptions = useMemo<ClinicalSelectOption<RiskFilterType>[]>(
    () => [
      { value: 'ALL', label: t('doctor.worklist.allLevels', 'Tất cả mức độ') },
      { value: 'CRITICAL', label: t('doctor.worklist.criticalLevel', 'Rất nghiêm trọng'), riskLevel: 'critical' },
      { value: 'HIGH', label: t('doctor.worklist.highLevel', 'Nguy cơ cao'), riskLevel: 'high' },
      { value: 'MODERATE', label: t('doctor.worklist.moderateLevel', 'Nguy cơ trung bình'), riskLevel: 'moderate' },
      { value: 'LOW', label: t('doctor.worklist.lowLevel', 'Nguy cơ thấp'), riskLevel: 'low' },
    ],
    [t]
  );

  const getPatientKey = (p: PatientProfile) => p.id || p.userId || p.mrn || '';

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setActionNotice(
          isVi
            ? `Đã làm mới danh sách (${patients.length} bệnh nhân)`
            : `List refreshed (${patients.length} patients)`
        );
      } catch {
        setActionNotice(isVi ? 'Đã gửi yêu cầu làm mới dữ liệu' : 'Refresh request sent');
      } finally {
        setIsRefreshing(false);
        setTimeout(() => setActionNotice(null), 3500);
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setRiskFilter('ALL');
    setReviewFilter('ALL');
    setSelectedIds(new Set());
    setActionNotice(
      isVi
        ? 'Đã đặt lại bộ lọc về mặc định'
        : 'Filters reset to default'
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchQuery =
        (p.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.mrn || '').toLowerCase().includes(searchTerm.toLowerCase());

      const patientRisk = (p.riskLevel || 'Low').toUpperCase();
      const isCritical =
        patientRisk === 'CRITICAL' ||
        patientRisk === 'SEVERE' ||
        patientRisk === 'ALARM';
      const matchRisk =
        riskFilter === 'ALL' ||
        (riskFilter === 'CRITICAL' ? isCritical : patientRisk === riskFilter);

      const isReviewed = p.reviewStatus === 'REVIEWED';
      const matchReview =
        reviewFilter === 'ALL' ||
        (reviewFilter === 'REVIEWED' && isReviewed) ||
        (reviewFilter === 'PENDING' && !isReviewed);

      return matchQuery && matchRisk && matchReview;
    });
  }, [patients, searchTerm, riskFilter, reviewFilter]);

  // Risk summary counts
  const riskCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
    patients.forEach((p) => {
      const lvl = (p.riskLevel || 'Low').toUpperCase();
      if (lvl === 'CRITICAL' || lvl === 'SEVERE' || lvl === 'ALARM') counts.critical++;
      else if (lvl === 'HIGH') counts.high++;
      else if (lvl === 'MODERATE') counts.moderate++;
      else counts.low++;
    });
    return counts;
  }, [patients]);

  const allFilteredSelected = useMemo(() => {
    if (filteredPatients.length === 0) return false;
    return filteredPatients.every((p) => selectedIds.has(getPatientKey(p)));
  }, [filteredPatients, selectedIds]);

  const someFilteredSelected = useMemo(() => {
    return filteredPatients.some((p) => selectedIds.has(getPatientKey(p)));
  }, [filteredPatients, selectedIds]);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect all filtered
      const next = new Set(selectedIds);
      filteredPatients.forEach((p) => next.delete(getPatientKey(p)));
      setSelectedIds(next);
    } else {
      // Select all filtered
      const next = new Set(selectedIds);
      filteredPatients.forEach((p) => {
        const k = getPatientKey(p);
        if (k) next.add(k);
      });
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (key: string) => {
    if (!key) return;
    const next = new Set(selectedIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedIds(next);
  };

  const handleTriggerSingleDelete = (patient: PatientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      mode: 'single',
      targetPatient: patient,
    });
  };

  const handleTriggerBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModalState({
      isOpen: true,
      mode: 'batch',
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.mode === 'single' && deleteModalState.targetPatient) {
        const p = deleteModalState.targetPatient;
        if (onDeletePatient) {
          await onDeletePatient(p);
        }
        const k = getPatientKey(p);
        const next = new Set(selectedIds);
        next.delete(k);
        setSelectedIds(next);
        setActionNotice(
          isVi
            ? `Đã xóa hồ sơ bệnh nhân "${p.fullName || p.mrn || 'N/A'}"`
            : `Patient record "${p.fullName || p.mrn || 'N/A'}" deleted`
        );
      } else if (deleteModalState.mode === 'batch') {
        const ids = Array.from(selectedIds);
        if (onBatchDeletePatients) {
          await onBatchDeletePatients(ids);
        }
        const count = selectedIds.size;
        setSelectedIds(new Set());
        setActionNotice(
          isVi
            ? `Đã xóa thành công ${count} hồ sơ bệnh nhân đã chọn`
            : `Successfully deleted ${count} selected patient records`
        );
      }
      setDeleteModalState({ isOpen: false, mode: 'single' });
      if (onRefresh) {
        onRefresh();
      }
    } catch {
      setActionNotice(
        isVi
          ? 'Đã xảy ra lỗi khi thực hiện thao tác xóa'
          : 'Error occurred while deleting patient record(s)'
      );
    } finally {
      setIsDeleting(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const columns: Column<PatientProfile>[] = [
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = someFilteredSelected && !allFilteredSelected;
              }
            }}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
            title={isVi ? 'Chọn tất cả trên trang' : 'Select all on page'}
          />
        </div>
      ),
      accessor: (row) => {
        const key = getPatientKey(row);
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedIds.has(key)}
              onChange={() => toggleSelectOne(key)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
            />
          </div>
        );
      },
      className: 'w-10 text-center',
      align: 'center',
    },
    {
      header: t('doctor.worklist.columns.patient', 'Bệnh Nhân / MRN'),
      accessor: (row) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setViewingPatient(row)}
          title={isVi ? 'Nhấp để xem chi tiết hồ sơ bệnh nhân' : 'Click to view patient profile'}
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 group-hover:bg-teal-100 text-teal-800 font-bold flex items-center justify-center border border-teal-200/80 shrink-0 font-sans transition-colors">
            {row.fullName
              ? row.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : (isVi ? 'BN' : 'PT')}
          </div>
          <div>
            <span className="font-semibold text-slate-900 group-hover:text-[#3478F6] block truncate max-w-[160px] transition-colors">
              {row.fullName || (isVi ? 'Chưa có tên' : 'Unnamed')}
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              <span className="font-mono-data">{row.mrn || 'N/A'}</span> •{' '}
              {row.age ? `${row.age} ${isVi ? 'tuổi' : 'yrs'}` : ''}{' '}
              {row.gender === 'Female' ? t('common.gender.female', 'Nữ') : row.gender === 'Male' ? t('common.gender.male', 'Nam') : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t('doctor.worklist.columns.date', 'Lần Khám Gần Nhất'),
      accessor: (row) => (
        <span className="text-xs text-slate-600 font-mono-data">
          {row.lastExamDate || (isVi ? 'Chưa có' : 'None')}
        </span>
      ),
    },
    {
      header: t('doctor.worklist.columns.vitals', 'Chỉ Số Sinh Hiệu'),
      accessor: (row) => (
        <div className="text-xs space-y-0.5 font-sans">
          <span className="text-slate-800 block">
            {isVi ? 'HA:' : 'BP:'} <span className="font-mono-data font-semibold">{row.systolicBp && row.diastolicBp ? `${row.systolicBp}/${row.diastolicBp}` : '--'}</span>
          </span>
          <span className="text-slate-500 text-[11px] block">
            HbA1c: <span className="font-mono-data font-semibold">{row.hba1c ? `${row.hba1c}%` : '--'}</span>
          </span>
        </div>
      ),
    },
    {
      header: t('doctor.worklist.columns.aiRisk', 'Mức Rủi Ro Sơ Bộ'),
      accessor: (row) => (
        <RiskBadge level={row.riskLevel || 'Low'} size="sm" />
      ),
    },
    {
      header: t('doctor.worklist.columns.status', 'Trạng Thái Thẩm Định'),
      accessor: (row) => {
        const isReviewed = row.reviewStatus === 'REVIEWED';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}
          >
            {isReviewed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
            {isReviewed ? t('doctor.worklist.reviewed', 'Đã duyệt') : t('doctor.worklist.pendingReview', 'Chờ bác sĩ xem')}
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
            data-testid={`worklist-view-profile-btn-${row.id || (row as any).patientId}`}
            onClick={() => setViewingPatient(row)}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            title={isVi ? 'Xem chi tiết hồ sơ bệnh nhân' : 'View patient medical profile'}
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{isVi ? 'Hồ sơ' : 'Profile'}</span>
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelectPatient(row)}
            icon={<Stethoscope className="w-3.5 h-3.5" />}
          >
            {t('doctor.worklist.openCds', 'Mở CDS')}
          </Button>
          {onStartConsultation && (
            <button
              type="button"
              data-testid={`worklist-consultation-btn-${row.id || (row as any).patientId}`}
              onClick={() => onStartConsultation(row)}
              className="px-2.5 py-1.5 text-xs font-bold text-[#3478F6] bg-[#EEF5FF] hover:bg-[#D0DDFE] border border-[#C7D7FE] rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title={isVi ? 'Vào phòng tư vấn' : 'Enter Consultation'}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#3478F6]" />
              <span className="hidden sm:inline">{isVi ? 'Vào phòng tư vấn' : 'Consultation'}</span>
            </button>
          )}
          {(onDeletePatient || onBatchDeletePatients) && (
            <button
              type="button"
              onClick={(e) => handleTriggerSingleDelete(row, e)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              title={isVi ? 'Xóa hồ sơ bệnh nhân' : 'Delete patient record'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Compact Risk Stratification Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'CRITICAL'
              ? 'bg-red-50/80 border-red-300 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-red-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900">{t('doctor.worklist.criticalLevel', isVi ? 'Rất nghiêm trọng' : 'Critical')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-2">
            {riskCounts.critical}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityCritical', isVi ? 'Cần ưu tiên khám' : 'Priority review')}</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'HIGH'
              ? 'bg-orange-50/80 border-orange-300 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-orange-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-900">{t('doctor.worklist.highLevel', isVi ? 'Nguy cơ cao' : 'High Risk')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 font-mono-data mt-2">
            {riskCounts.high}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityHigh', isVi ? 'Tổn thương rõ' : 'Marked lesions')}</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'MODERATE'
              ? 'bg-amber-50/80 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">{t('doctor.worklist.moderateLevel', isVi ? 'Trung bình' : 'Moderate')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-2">
            {riskCounts.moderate}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityModerate', isVi ? 'Theo dõi định kỳ' : 'Periodic follow-up')}</span>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            riskFilter === 'LOW'
              ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-emerald-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">{t('doctor.worklist.lowLevel', isVi ? 'Nguy cơ thấp' : 'Low Risk')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-2">
            {riskCounts.low}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityLow', isVi ? 'Vi mạch ổn định' : 'Stable')}</span>
        </div>
      </div>

      {/* Main Filter & Worklist Toolbar - Clean UI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {t('doctor.worklist.searchLabel', 'Tìm kiếm bệnh nhân')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('doctor.worklist.searchPlaceholder', 'Tìm họ tên, mã MRN...')}
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

          {/* Review Filter */}
          <div className="lg:col-span-2 space-y-1.5">
            <ClinicalSelect<ReviewFilterType>
              label={t('doctor.worklist.reviewStatusLabel', 'Trạng thái thẩm định')}
              value={reviewFilter}
              onChange={setReviewFilter}
              options={reviewFilterOptions}
              size="md"
            />
          </div>

          {/* Risk Filter */}
          <div className="lg:col-span-2 space-y-1.5">
            <ClinicalSelect<RiskFilterType>
              label={t('doctor.worklist.riskLevelLabel', 'Mức nguy cơ')}
              value={riskFilter}
              onChange={setRiskFilter}
              options={riskFilterOptions}
              size="md"
            />
          </div>

          {/* Actions */}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                className="flex-1 h-10 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={t('doctor.worklist.refresh', 'Làm mới')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                <span>{t('doctor.worklist.refresh', 'Làm mới')}</span>
              </button>
            )}

            {onNewPatientClick && (
              <button
                type="button"
                onClick={onNewPatientClick}
                className="h-10 px-3.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={t('doctor.worklist.addPatient', 'Thêm BN')}
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('doctor.worklist.addPatient', 'Thêm BN')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
              title={t('doctor.worklist.reset', 'Đặt lại')}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('doctor.worklist.reset', 'Đặt lại')}</span>
            </button>
          </div>
        </div>

        {/* Action Notice */}
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

      {/* Batch Selection Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-xs font-bold text-teal-950">
              {isVi
                ? `Đã chọn ${selectedIds.size} bệnh nhân`
                : `${selectedIds.size} patient(s) selected`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-600 border-slate-300 hover:bg-white"
            >
              {isVi ? 'Bỏ chọn tất cả' : 'Deselect all'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleTriggerBatchDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              className="bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              {isVi
                ? `Xóa ${selectedIds.size} bệnh nhân đã chọn`
                : `Delete ${selectedIds.size} selected`}
            </Button>
          </div>
        </div>
      )}

      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#3478F6]" />
            {t('doctor.worklist.title', 'Danh Sách Bệnh Nhân')}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredPatients.length})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {isVi
            ? `Tổng cộng ${patients.length} bệnh nhân.`
            : `Total ${patients.length} patients.`}
        </p>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        keyExtractor={(p, idx) => getPatientKey(p) || String(idx)}
        loading={loading}
        onRowClick={(row) => setViewingPatient(row)}
        pagination={{
          pageSize: 10,
          pageSizeOptions: [5, 10, 20, 50],
          itemLabel: isVi ? 'bệnh nhân' : 'patients',
        }}
        emptyMessage={
          patients.length === 0
            ? (isVi
                ? 'Tài khoản bác sĩ hiện chưa được phân công ca khám nào từ phòng khám.'
                : 'No patients currently assigned to this doctor by the clinic.')
            : t('doctor.worklist.emptyFiltered', 'Không có bệnh nhân nào phù hợp.')
        }
      />

      {/* Patient Profile Detail Modal */}
      <Modal
        isOpen={Boolean(viewingPatient)}
        onClose={() => setViewingPatient(null)}
        maxWidth="2xl"
        title={isVi ? 'Hồ Sơ Y Tế Bệnh Nhân' : 'Patient Medical Profile'}
        description={isVi ? 'Thông tin hành chính, chỉ số sinh hiệu và tiền sử bệnh lý lâm sàng' : 'Demographics, baseline vitals, and clinical medical history'}
      >
        {viewingPatient && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* 1. Header Card: Patient Identity & Risk */}
            <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-teal-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#3478F6] text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                  {viewingPatient.fullName
                    ? viewingPatient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : (isVi ? 'BN' : 'PT')}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {viewingPatient.fullName || (isVi ? 'Chưa có tên' : 'Unnamed')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-blue-100/80 text-[#3478F6] font-mono-data font-semibold text-xs border border-blue-200">
                      {viewingPatient.mrn || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {viewingPatient.age ? `${viewingPatient.age} ${isVi ? 'tuổi' : 'years'}` : (isVi ? 'Chưa rõ tuổi' : 'Age unknown')} •{' '}
                    {viewingPatient.gender === 'Female' ? (isVi ? 'Nữ' : 'Female') : viewingPatient.gender === 'Male' ? (isVi ? 'Nam' : 'Male') : (isVi ? 'Khác' : 'Other')}
                    {viewingPatient.assignedDoctor && (
                      <span className="ml-2 text-teal-700 font-medium">
                        • {isVi ? 'BS phụ trách:' : 'Doctor:'} {viewingPatient.assignedDoctor}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {viewingPatient.riskLevel && (
                  <RiskBadge level={viewingPatient.riskLevel as any} size="md" />
                )}
              </div>
            </div>

            {/* 2. Grid Vitals & Biometrics */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#3478F6]" />
                <span>{isVi ? 'Sinh hiệu & Đo lường lâm sàng' : 'Clinical Vitals & Measurements'}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{isVi ? 'Huyết áp (HA)' : 'Blood Pressure'}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono-data mt-0.5 block">
                    {viewingPatient.systolicBp && viewingPatient.diastolicBp ? `${viewingPatient.systolicBp}/${viewingPatient.diastolicBp} mmHg` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {viewingPatient.systolicBp && viewingPatient.systolicBp >= 140 ? (isVi ? 'Tăng huyết áp' : 'Hypertension') : (isVi ? 'Bình thường' : 'Normal')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">HbA1c</span>
                  <span className="text-sm font-bold text-slate-900 font-mono-data mt-0.5 block">
                    {viewingPatient.hba1c ? `${viewingPatient.hba1c}%` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {viewingPatient.hba1c && viewingPatient.hba1c >= 6.5 ? (isVi ? 'Đái tháo đường' : 'Diabetic') : (isVi ? 'Kiểm soát tốt' : 'Controlled')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{isVi ? 'Điểm nguy cơ AI' : 'AI Risk Score'}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono-data mt-0.5 block">
                    {typeof viewingPatient.riskScore === 'number' ? `${viewingPatient.riskScore}/100` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {viewingPatient.reviewStatus === 'REVIEWED' ? (isVi ? 'Đã duyệt' : 'Reviewed') : (isVi ? 'Chờ duyệt' : 'Pending')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">{isVi ? 'Số ca khám' : 'Total Screenings'}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono-data mt-0.5 block">
                    {(viewingPatient as any).screeningCount || 1} {isVi ? 'ca' : 'scans'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {viewingPatient.lastExamDate || (isVi ? 'Gần đây' : 'Recent')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Tiền sử bệnh lý mạn tính */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>{isVi ? 'Tiền sử bệnh lý & Yếu tố nguy cơ' : 'Medical History & Risk Factors'}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${viewingPatient.hasDiabetes ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>{isVi ? 'Đái tháo đường:' : 'Diabetes:'}</span>
                  <span className="font-bold">{viewingPatient.hasDiabetes ? (isVi ? 'Có' : 'Yes') : (isVi ? 'Không' : 'No')}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${viewingPatient.hasHypertension ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>{isVi ? 'Tăng huyết áp:' : 'Hypertension:'}</span>
                  <span className="font-bold">{viewingPatient.hasHypertension ? (isVi ? 'Có' : 'Yes') : (isVi ? 'Không' : 'No')}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${viewingPatient.historyOfSmoking ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>{isVi ? 'Hút thuốc lá:' : 'Smoking:'}</span>
                  <span className="font-bold">{viewingPatient.historyOfSmoking ? (isVi ? 'Có' : 'Yes') : (isVi ? 'Không' : 'No')}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${(viewingPatient as any).historyOfHeartDisease ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>{isVi ? 'Bệnh tim mạch:' : 'Heart Disease:'}</span>
                  <span className="font-bold">{(viewingPatient as any).historyOfHeartDisease ? (isVi ? 'Có' : 'Yes') : (isVi ? 'Không' : 'No')}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${(viewingPatient as any).historyOfStroke ? 'bg-rose-50/70 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>{isVi ? 'Tiền sử đột quỵ:' : 'Stroke History:'}</span>
                  <span className="font-bold">{(viewingPatient as any).historyOfStroke ? (isVi ? 'Có' : 'Yes') : (isVi ? 'Không' : 'No')}</span>
                </div>
                <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-between">
                  <span>{isVi ? 'Nhóm máu:' : 'Blood Type:'}</span>
                  <span className="font-bold">{(viewingPatient as any).bloodType || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 4. Liên hệ & Địa chỉ */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{isVi ? 'Số điện thoại:' : 'Phone:'} <strong className="font-mono-data text-slate-900">{viewingPatient.phone || (viewingPatient as any).phoneNumber || (isVi ? 'Chưa cập nhật' : 'N/A')}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{isVi ? 'Địa chỉ cư trú:' : 'Address:'} <strong className="text-slate-900">{viewingPatient.address || (isVi ? 'Chưa cập nhật' : 'N/A')}</strong></span>
              </div>
              {viewingPatient.findingsSummary && (
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">{isVi ? 'Tóm tắt lâm sàng:' : 'Clinical Summary:'}</span>
                  <p className="text-slate-600 leading-relaxed italic">{viewingPatient.findingsSummary}</p>
                </div>
              )}
            </div>

            {/* 5. Footer Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-mono-data">
                ID: {viewingPatient.id || (viewingPatient as any).patientId || (viewingPatient as any).userId || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setViewingPatient(null)}
                  className="rounded-xl px-4"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </Button>
                {onStartConsultation && (
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<MessageSquare className="w-4 h-4 text-[#3478F6]" />}
                    onClick={() => {
                      const p = viewingPatient;
                      setViewingPatient(null);
                      onStartConsultation(p);
                    }}
                    className="rounded-xl text-[#3478F6] bg-[#EEF5FF] hover:bg-[#D0DDFE] border border-[#C7D7FE]"
                  >
                    {isVi ? 'Vào phòng tư vấn' : 'Consultation'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  icon={<Stethoscope className="w-4 h-4" />}
                  onClick={() => {
                    const p = viewingPatient;
                    setViewingPatient(null);
                    onSelectPatient(p);
                  }}
                  className="rounded-xl font-bold bg-[#3478F6] hover:bg-[#2563EB]"
                >
                  {isVi ? 'Mở buồng lái CDS' : 'Open CDS Cockpit'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalState.isOpen}
        onClose={() => !isDeleting && setDeleteModalState({ isOpen: false, mode: 'single' })}
        maxWidth="sm"
        title={isVi ? 'Xác nhận xóa bệnh nhân' : 'Confirm Deletion'}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 bg-red-50/80 rounded-xl border border-red-200/80">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 space-y-1">
              <p className="font-bold">
                {deleteModalState.mode === 'single'
                  ? (isVi
                      ? `Xóa bệnh nhân "${deleteModalState.targetPatient?.fullName || deleteModalState.targetPatient?.mrn || 'N/A'}"?`
                      : `Delete patient "${deleteModalState.targetPatient?.fullName || deleteModalState.targetPatient?.mrn || 'N/A'}"?`)
                  : (isVi
                      ? `Xóa ${selectedIds.size} bệnh nhân đã chọn?`
                      : `Delete ${selectedIds.size} selected patients?`)}
              </p>
              <p className="text-red-700 leading-relaxed">
                {isVi
                  ? 'Hồ sơ này sẽ bị xóa khỏi danh sách. Thao tác không thể hoàn tác.'
                  : 'This record will be removed from your list. This cannot be undone.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteModalState({ isOpen: false, mode: 'single' })}
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isVi ? 'Xác nhận xóa' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
