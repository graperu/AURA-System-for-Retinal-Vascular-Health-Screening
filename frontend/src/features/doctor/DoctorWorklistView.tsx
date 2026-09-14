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
  RotateCcw,
} from 'lucide-react';
import { PatientProfile } from '../../types/cds';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';
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
  onNewPatientClick?: () => void;
}

export const DoctorWorklistView: React.FC<DoctorWorklistViewProps> = ({
  patients,
  loading = false,
  onRefresh,
  onSelectPatient,
  onNewPatientClick,
}) => {
  const { t, isVi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilterType>('ALL');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilterType>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
    setActionNotice(
      isVi
        ? 'Đã đặt lại toàn bộ bộ lọc và ô tìm kiếm về mặc định'
        : 'All filters and search reset to default'
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

  const columns: Column<PatientProfile>[] = [
    {
      header: t('doctor.worklist.columns.patient', 'Bệnh Nhân / MRN'),
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center border border-teal-200/80 shrink-0 font-sans">
            {row.fullName
              ? row.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : (isVi ? 'BN' : 'PT')}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
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
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelectPatient(row)}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          {t('doctor.worklist.openCds', 'Mở CDS')}
        </Button>
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
            <span className="text-xs font-bold text-red-900">{t('doctor.worklist.criticalLevel', 'Rất nghiêm trọng')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono-data mt-2">
            {riskCounts.critical}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityCritical', 'Cần ưu tiên thẩm định')}</span>
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
            <span className="text-xs font-bold text-orange-900">{t('doctor.worklist.highLevel', 'Nguy cơ cao')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 font-mono-data mt-2">
            {riskCounts.high}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityHigh', 'Vi tổn thương đáng kể')}</span>
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
            <span className="text-xs font-bold text-amber-900">{t('doctor.worklist.moderateLevel', 'Nguy cơ trung bình')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono-data mt-2">
            {riskCounts.moderate}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityModerate', 'Cần theo dõi định kỳ')}</span>
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
            <span className="text-xs font-bold text-emerald-900">{t('doctor.worklist.lowLevel', 'Nguy cơ thấp')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono-data mt-2">
            {riskCounts.low}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">{t('doctor.worklist.priorityLow', 'Cấu trúc vi mạch ổn định')}</span>
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

      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#0891B2]" />
            {t('doctor.worklist.title', 'Danh sách ca khám phân công')}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredPatients.length})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {isVi
            ? `Tổng cộng ${patients.length} bệnh nhân trong danh sách phụ trách.`
            : `Total ${patients.length} patients in assigned directory.`}
        </p>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        keyExtractor={(p, idx) => p.id || p.mrn || String(idx)}
        loading={loading}
        emptyMessage={t('doctor.worklist.emptyFiltered', 'Không tìm thấy bệnh nhân nào phù hợp với bộ lọc.')}
      />

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
