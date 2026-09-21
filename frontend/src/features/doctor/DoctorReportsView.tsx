import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Printer,
  ShieldCheck,
  FileBadge,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { EyeBadge } from '../../components/ui/EyeBadge';
import { ScanTypeBadge } from '../../components/ui/ScanTypeBadge';
import { MedicalReportModal } from '../../components/MedicalReportModal';
import { screeningApi } from '../../services/api';
import { mapScreeningToAIRiskResult } from '../../services/screeningMapper';
import { PatientProfile, AIRiskResult } from '../../types/cds';
import { DoctorPatientSummary } from '../../pages/CDSDashboardPage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';

interface DoctorReportsViewProps {
  assignedPatients: DoctorPatientSummary[];
  onReviewAndSign: (patientId: string, screeningId: string, directPatient?: DoctorPatientSummary | any) => void;
  doctorName?: string;
}

export const DoctorReportsView: React.FC<DoctorReportsViewProps> = ({
  assignedPatients,
  onReviewAndSign,
  doctorName,
}) => {
  const { user } = useAuth();
  const { t, isVi } = useLanguage();
  const currentDoctorName = doctorName || user?.name || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist');
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANALYZED' | 'REVIEWED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadScreenings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await screeningApi.getAll();
      const list = Array.isArray(res?.data)
        ? res.data
        : (res?.data as any)?.items || (res?.data as any)?.content || [];
      if (res && res.success && list.length > 0) {
        setScreenings(list);
      } else {
        setScreenings([]);
      }
    } catch (err) {
      console.warn('Error loading reports screenings:', err);
      setScreenings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshReports = async () => {
    await loadScreenings();
    setActionNotice(
      isVi
        ? 'Đã làm mới danh sách hồ sơ báo cáo y khoa thành công'
        : 'Medical reports archive refreshed successfully'
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Modal in phiếu kết quả
  const [selectedReportPatient, setSelectedReportPatient] = useState<PatientProfile | null>(null);
  const [selectedReportResult, setSelectedReportResult] = useState<AIRiskResult | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Modal chi tiết chữ ký số HMAC
  const [selectedSignature, setSelectedSignature] = useState<{
    screeningId: string;
    patientName: string;
    mrn: string;
    signature: string;
    signedAt: string;
    decision: string;
  } | null>(null);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  // Ánh xạ patientId -> DoctorPatientSummary
  const patientMap = useMemo(() => {
    const map = new Map<string, DoctorPatientSummary>();
    assignedPatients.forEach((p) => {
      if (p.patientId) map.set(String(p.patientId), p);
      if ((p as any).id) map.set(String((p as any).id), p);
      if ((p as any).userId) map.set(String((p as any).userId), p);
    });
    return map;
  }, [assignedPatients]);

  // Bộ lọc dữ liệu
  const filteredScreenings = useMemo(() => {
    return screenings.filter((s) => {
      const patient = patientMap.get(s.patientId);
      const patientName = patient?.fullName || '';
      const patientMrn = patient?.mrn || '';
      const screeningId = String(s.id || '');

      const matchesSearch =
        patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screeningId.toLowerCase().includes(searchTerm.toLowerCase());

      const isReviewed = s.status === 'REVIEWED' || s.reviewDecision != null || s.digitalSignature != null;
      const isPending = s.status === 'ANALYZED' || s.status === 'PENDING' || (!isReviewed && s.status !== 'FAILED');

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'REVIEWED' && isReviewed) ||
        (statusFilter === 'ANALYZED' && isPending);

      return matchesSearch && matchesStatus;
    });
  }, [screenings, patientMap, searchTerm, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let reviewedCount = 0;
    let pendingCount = 0;
    screenings.forEach((s) => {
      const isRev = s.status === 'REVIEWED' || s.reviewDecision != null || s.digitalSignature != null;
      if (isRev) reviewedCount++;
      else if (s.status !== 'FAILED') pendingCount++;
    });
    return {
      total: screenings.length,
      reviewed: reviewedCount,
      pending: pendingCount,
    };
  }, [screenings]);

  // Hàm mở modal in báo cáo kết quả
  const handleOpenPrintModal = (screening: any) => {
    const patientSummary = patientMap.get(screening.patientId);
    const mappedPatient: PatientProfile = {
      id: screening.patientId,
      userId: screening.patientId,
      mrn: patientSummary?.mrn || 'N/A',
      fullName: patientSummary?.fullName || (isVi ? 'Bệnh nhân' : 'Patient'),
      age: patientSummary?.age ?? null,
      gender: patientSummary?.gender || null,
      systolicBp: patientSummary?.systolicBp ?? null,
      diastolicBp: patientSummary?.diastolicBp ?? null,
      hba1c: patientSummary?.hba1c ?? null,
      hasDiabetes: patientSummary?.hasDiabetes ?? null,
      hasHypertension: patientSummary?.hasHypertension ?? null,
      assignedDoctor: currentDoctorName,
    };

    const airisk = mapScreeningToAIRiskResult(screening, screening.imageUrl);
    setSelectedReportPatient(mappedPatient);
    setSelectedReportResult(airisk);
    setIsReportModalOpen(true);
  };

  const columns: Column<any>[] = [
    {
      header: t('doctor.reportsView.columns.code', 'Mã Ca Khám'),
      accessor: (row) => (
        <div className="space-y-1">
          <span className="font-mono-data font-bold text-slate-900 block text-xs">
            #{String(row.id || '').slice(0, 8).toUpperCase()}
          </span>
          <ScanTypeBadge scanType={row.scanType} />
        </div>
      ),
    },
    {
      header: t('doctor.reportsView.columns.date', 'Ngày Khám'),
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
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono-data">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{dateStr}</span>
          </div>
        );
      },
    },
    {
      header: t('doctor.reportsView.columns.patient', 'Bệnh Nhân'),
      accessor: (row) => {
        const patient = patientMap.get(row.patientId);
        return (
          <div className="flex items-center gap-2.5 font-sans">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center border border-teal-200/80 shrink-0 text-xs font-sans">
              {patient?.fullName ? patient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : (isVi ? 'BN' : 'PT')}
            </div>
            <div>
              <span className="font-semibold text-slate-900 block truncate max-w-[140px]">
                {patient?.fullName || (isVi ? 'Bệnh nhân' : 'Patient')}
              </span>
              <span className="text-[11px] text-slate-500">
                <span className="font-mono-data">{patient?.mrn || (isVi ? 'Chưa có MRN' : 'No MRN')}</span> • {patient?.age ? `${patient.age} ${isVi ? 'tuổi' : 'yrs'}` : ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: t('doctor.reportsView.columns.eye', 'Mắt Khám'),
      accessor: (row) => <EyeBadge position={row.eyePosition} />,
    },
    {
      header: t('doctor.reportsView.columns.aiRisk', 'Mức Rủi Ro AI'),
      accessor: (row) => <RiskBadge level={row.riskLevel || row.aiRiskLevel || 'Low'} size="sm" />,
    },
    {
      header: t('doctor.reportsView.columns.status', 'Trạng Thái Duyệt'),
      accessor: (row) => {
        const isRejected = row.reviewDecision === 'REJECTED' || row.status === 'REJECTED';
        const isReviewed = !isRejected && (row.status === 'REVIEWED' || row.reviewDecision != null || row.digitalSignature != null);
        if (isRejected) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none bg-rose-50 text-rose-800 border-rose-200/80">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              {isVi ? 'Bác sĩ bác bỏ' : 'Rejected'}
            </span>
          );
        }
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}
          >
            {isReviewed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
            {isReviewed ? t('doctor.reportsView.reviewedTab', 'Đã Ký Duyệt') : t('doctor.reportsView.pendingTab', 'Chờ Thẩm Định')}
          </span>
        );
      },
    },
    {
      header: t('doctor.reportsView.columns.hmac', 'Chữ Ký Số HMAC'),
      accessor: (row) => {
        const hasSig = Boolean(row.digitalSignature);
        if (!hasSig) {
          return (
            <span className="text-[11px] text-slate-400 italic font-sans">{t('doctor.reportsView.unsigned', 'Chưa ký số')}</span>
          );
        }
        const patient = patientMap.get(row.patientId);
        const shortSig = row.digitalSignature.slice(0, 12) + '...';
        return (
          <button
            type="button"
            onClick={() =>
              setSelectedSignature({
                screeningId: row.id,
                patientName: patient?.fullName || (isVi ? 'Bệnh nhân' : 'Patient'),
                mrn: patient?.mrn || 'N/A',
                signature: row.digitalSignature,
                signedAt: row.signedAt || row.reviewedAt || row.updatedAt || new Date().toISOString(),
                decision: row.reviewDecision || 'APPROVED',
              })
            }
            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-colors font-sans font-medium cursor-pointer"
            title={isVi ? 'Nhấp để kiểm tra chứng thư số HMAC-SHA256' : 'Click to verify HMAC-SHA256 digital certificate'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono-data font-semibold">{shortSig}</span>
          </button>
        );
      },
    },
    {
      header: t('doctor.reportsView.columns.actions', 'Thao Tác'),
      align: 'right',
      accessor: (row) => {
        return (
          <div className="flex items-center justify-end gap-2 font-sans">
            {/* Nút Thẩm Định / Ký Số */}
            <button
              type="button"
              onClick={() => {
                const p = patientMap.get(String(row.patientId));
                onReviewAndSign(row.patientId, row.id, p);
              }}
              title={isVi ? 'Mở ảnh đáy mắt trên bàn chẩn đoán CDS để ký duyệt lâm sàng' : 'Open fundus scan in CDS desk for clinical review & sign-off'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>{t('doctor.reportsView.reviewAndSign', 'Thẩm Định / Ký')}</span>
            </button>

            {/* Nút In Phiếu Kết Quả / Xuất Báo Cáo */}
            <button
              type="button"
              onClick={() => handleOpenPrintModal(row)}
              title={isVi ? 'Xem và in phiếu kết quả chẩn đoán y khoa' : 'View and print medical report'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('doctor.reportsView.print', 'In Báo Cáo')}</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#C7D7FE] rounded-2xl p-5 shadow-medical-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#3478F6]" />
            <h1 className="text-lg font-bold text-[#111827]">
              {t('doctor.reportsView.title', 'Hồ Sơ Báo Cáo Y Khoa & Ký Duyệt Chẩn Đoán')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('doctor.reportsView.subtitle', 'FR-15, FR-16: Quản lý hồ sơ kết luận lâm sàng, xác thực chữ ký số HMAC và xuất phiếu kết quả y tế.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('doctor.riskAnalytics.refresh', 'Làm mới')}</span>
          </button>
        </div>
      </div>

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

      {/* 3 Summary Badges / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-medical-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              {t('doctor.reportsView.totalReports', 'Tổng Số Hồ Sơ Báo Cáo')}
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono-data mt-1 block">
              {stats.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <FileBadge className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-medical-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 block">
              {t('doctor.reportsView.pendingReview', 'Chờ Bác Sĩ Thẩm Định')}
            </span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono-data mt-1 block">
              {stats.pending}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-medical-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              {t('doctor.reportsView.reviewed', 'Đã Ký Duyệt Lâm Sàng')}
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 font-mono-data mt-1 block">
              {stats.reviewed}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm Clean UI */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-end justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-80 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('doctor.reportsView.searchLabel', 'Tìm kiếm hồ sơ báo cáo')}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('doctor.reportsView.searchPlaceholder', 'Tìm theo MRN, tên bệnh nhân, mã ca...')}
              className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50/50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-700 sm:hidden">{isVi ? 'Lọc trạng thái:' : 'Status Filter:'}</label>
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('doctor.reportsView.allTab', 'Tất cả')} ({screenings.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ANALYZED')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ANALYZED'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('doctor.reportsView.pendingTab', 'Chờ Thẩm Định')} ({stats.pending})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REVIEWED')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'REVIEWED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('doctor.reportsView.reviewedTab', 'Đã Ký Duyệt')} ({stats.reviewed})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Danh Sách */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {t('doctor.reportsView.listTitle', 'Danh sách hồ sơ báo cáo')}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            ({filteredScreenings.length})
          </span>
        </div>
      </div>

      {/* Bảng Danh Sách Báo Cáo */}
      <DataTable
        columns={columns}
        data={filteredScreenings}
        keyExtractor={(row, idx) => row.id || idx}
        loading={loading}
        pagination={{
          pageSize: 10,
          pageSizeOptions: [5, 10, 20, 50],
          itemLabel: isVi ? 'báo cáo' : 'reports',
        }}
        emptyMessage={t('doctor.reportsView.emptyReports', 'Không tìm thấy hồ sơ báo cáo nào phù hợp với điều kiện lọc.')}
      />

      {/* Medical Safety Disclaimer */}
      <MedicalDisclaimer variant="subtle" />

      {/* Modal In Phiếu Kết Quả (Tích hợp MedicalReportModal có sẵn) */}
      {selectedReportPatient && selectedReportResult && (
        <MedicalReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReportPatient(null);
            setSelectedReportResult(null);
          }}
          patient={selectedReportPatient}
          result={selectedReportResult}
          doctorName={currentDoctorName}
        />
      )}

      {/* Modal Xem Chi Tiết Chữ Ký Số HMAC */}
      {selectedSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t('doctor.reportsView.certModalTitle', 'Chứng Thư & Chữ Ký Số Lâm Sàng')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('doctor.reportsView.certModalDesc', 'Xác thực tính toàn vẹn hồ sơ bệnh án theo tiêu chuẩn bảo mật y tế HIPAA & HMAC-SHA256')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignature(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    {t('doctor.reportsView.validCert', 'Chữ Ký Số Hợp Lệ & Toàn Vẹn')}
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    {t('doctor.reportsView.sealedDesc', 'Bản ghi chẩn đoán đã được niêm phong mật mã bởi bác sĩ chuyên khoa.')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{t('doctor.reportsView.recordCodeLabel', 'Mã ca khám')}:</span>
                  <span className="font-mono-data font-bold text-slate-900">
                    {selectedSignature.screeningId}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{t('doctor.reportsView.patientLabel', 'Bệnh nhân')}:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSignature.patientName} ({selectedSignature.mrn})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{t('doctor.reportsView.signingDoctor', 'Bác sĩ ký duyệt')}:</span>
                  <span className="font-bold text-slate-900">{currentDoctorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{t('doctor.reportsView.signedAtLabel', 'Thời điểm ký')}:</span>
                  <span className="font-mono-data text-slate-700">
                    {new Date(selectedSignature.signedAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{t('doctor.reportsView.clinicalDecisionLabel', 'Quyết định lâm sàng')}:</span>
                  <span className={`font-bold ${
                    selectedSignature.decision === 'REJECTED'
                      ? 'text-rose-700'
                      : selectedSignature.decision === 'MODIFIED'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}>
                    {selectedSignature.decision === 'REJECTED'
                      ? (isVi ? 'Bác sĩ bác bỏ kết quả' : 'Rejected by Specialist')
                      : selectedSignature.decision === 'APPROVED'
                      ? t('doctor.reportsView.approvedDecision', 'Đồng thuận chẩn đoán AI')
                      : t('doctor.reportsView.modifiedDecision', 'Hiệu chỉnh chuyên môn')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                  {t('doctor.reportsView.hmacHashLabel', 'Chuỗi mã băm chữ ký số HMAC:')}
                </label>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] break-all select-all shadow-inner border border-slate-800">
                  {selectedSignature.signature}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSignature(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {t('doctor.reportsView.close', 'Đóng')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
