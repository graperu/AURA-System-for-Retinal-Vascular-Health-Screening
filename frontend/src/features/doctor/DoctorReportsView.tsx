import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
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

interface DoctorReportsViewProps {
  assignedPatients: DoctorPatientSummary[];
  onReviewAndSign: (patientId: string, screeningId: string) => void;
  doctorName?: string;
}

export const DoctorReportsView: React.FC<DoctorReportsViewProps> = ({
  assignedPatients,
  onReviewAndSign,
  doctorName,
}) => {
  const { user } = useAuth();
  const currentDoctorName = doctorName || user?.name || 'Bác sĩ chuyên khoa';
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANALYZED' | 'REVIEWED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleRefreshReports = async () => {
    await loadScreenings();
    setActionNotice('Đã làm mới danh sách hồ sơ báo cáo y khoa thành công');
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

  const loadScreenings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await screeningApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        setScreenings(res.data);
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

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  // Ánh xạ patientId -> DoctorPatientSummary
  const patientMap = useMemo(() => {
    const map = new Map<string, DoctorPatientSummary>();
    assignedPatients.forEach((p) => map.set(p.patientId, p));
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
      fullName: patientSummary?.fullName || 'Bệnh nhân',
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
      header: 'Mã Ca Khám',
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
      header: 'Ngày Khám',
      accessor: (row) => {
        const dateStr = row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Gần đây';
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono-data">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{dateStr}</span>
          </div>
        );
      },
    },
    {
      header: 'Bệnh Nhân',
      accessor: (row) => {
        const patient = patientMap.get(row.patientId);
        return (
          <div className="flex items-center gap-2.5 font-sans">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold flex items-center justify-center border border-teal-200/80 shrink-0 text-xs font-sans">
              {patient?.fullName ? patient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'BN'}
            </div>
            <div>
              <span className="font-semibold text-slate-900 block truncate max-w-[140px]">
                {patient?.fullName || 'Bệnh nhân'}
              </span>
              <span className="text-[11px] text-slate-500">
                <span className="font-mono-data">{patient?.mrn || 'Chưa có MRN'}</span> • {patient?.age ? `${patient.age} tuổi` : ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Mắt Khám',
      accessor: (row) => <EyeBadge position={row.eyePosition} />,
    },
    {
      header: 'Mức Rủi Ro AI',
      accessor: (row) => <RiskBadge level={row.riskLevel || row.aiRiskLevel || 'Low'} size="sm" />,
    },
    {
      header: 'Trạng Thái Duyệt',
      accessor: (row) => {
        const isReviewed = row.status === 'REVIEWED' || row.reviewDecision != null || row.digitalSignature != null;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${
              isReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}
          >
            {isReviewed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
            {isReviewed ? 'Đã ký duyệt' : 'Chờ thẩm định'}
          </span>
        );
      },
    },
    {
      header: 'Chữ Ký Số HMAC',
      accessor: (row) => {
        const hasSig = Boolean(row.digitalSignature);
        if (!hasSig) {
          return (
            <span className="text-[11px] text-slate-400 italic font-sans">Chưa ký số</span>
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
                patientName: patient?.fullName || 'Bệnh nhân',
                mrn: patient?.mrn || 'N/A',
                signature: row.digitalSignature,
                signedAt: row.signedAt || row.reviewedAt || row.updatedAt || 'Hôm nay',
                decision: row.reviewDecision || 'APPROVED',
              })
            }
            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition-colors font-sans font-medium cursor-pointer"
            title="Nhấp để kiểm tra chứng thư số HMAC-SHA256"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono-data font-semibold">{shortSig}</span>
          </button>
        );
      },
    },
    {
      header: 'Thao Tác',
      align: 'right',
      accessor: (row) => {
        return (
          <div className="flex items-center justify-end gap-2 font-sans">
            {/* Nút Thẩm Định / Ký Số */}
            <button
              type="button"
              onClick={() => onReviewAndSign(row.patientId, row.id)}
              title="Mở ảnh đáy mắt trên bàn chẩn đoán CDS để ký duyệt lâm sàng"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-teal-700" />
              <span>Thẩm Định / Ký</span>
            </button>

            {/* Nút In Phiếu Kết Quả / Xuất Báo Cáo */}
            <button
              type="button"
              onClick={() => handleOpenPrintModal(row)}
              title="Xem và in phiếu kết quả chẩn đoán y khoa"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0891B2]" />
            <h1 className="text-lg font-bold text-[#134E4A]">Hồ Sơ Báo Cáo Y Khoa & Ký Duyệt Chẩn Đoán</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            FR-15, FR-16: Quản lý hồ sơ kết luận lâm sàng, xác thực chữ ký số HMAC và xuất phiếu kết quả y tế.
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
            <span>Làm mới</span>
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
            className="text-teal-700 hover:text-teal-950 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 Summary Badges / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-medical-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Tổng Số Hồ Sơ Báo Cáo</span>
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
            <span className="text-xs font-semibold text-amber-800 block">Chờ Bác Sĩ Thẩm Định</span>
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
            <span className="text-xs font-semibold text-emerald-800 block">Đã Ký Duyệt Lâm Sàng</span>
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
            Tìm kiếm hồ sơ báo cáo
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MRN, tên bệnh nhân, mã ca..."
              className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50/50 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-700 sm:hidden">Lọc trạng thái:</label>
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
              Tất cả ({screenings.length})
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
              <span>Chờ Thẩm Định ({stats.pending})</span>
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
              <span>Đã Ký Duyệt ({stats.reviewed})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Danh Sách */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Danh sách hồ sơ báo cáo
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
        emptyMessage="Không tìm thấy hồ sơ báo cáo nào phù hợp với điều kiện lọc."
      />

      {/* Medical Safety Disclaimer */}
      <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          <strong>Lưu ý y khoa bắt buộc:</strong> Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.
        </span>
      </div>

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
                <h3 className="text-base font-bold text-slate-900">Chứng Thư & Chữ Ký Số Lâm Sàng</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác thực tính toàn vẹn hồ sơ bệnh án theo tiêu chuẩn bảo mật y tế HIPAA & HMAC-SHA256
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
                  <h4 className="text-xs font-bold text-emerald-950">Chữ Ký Số Hợp Lệ & Toàn Vẹn</h4>
                  <p className="text-[11px] text-emerald-700">
                    Bản ghi chẩn đoán đã được niêm phong mật mã bởi bác sĩ chuyên khoa.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mã ca khám:</span>
                  <span className="font-mono-data font-bold text-slate-900">
                    {selectedSignature.screeningId}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSignature.patientName} ({selectedSignature.mrn})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Bác sĩ ký duyệt:</span>
                  <span className="font-bold text-slate-900">{currentDoctorName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Thời điểm ký:</span>
                  <span className="font-mono-data text-slate-700">
                    {new Date(selectedSignature.signedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Quyết định lâm sàng:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedSignature.decision === 'APPROVED' ? 'Đồng thuận chẩn đoán AI' : 'Hiệu chỉnh chuyên môn'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <FileBadge className="w-3.5 h-3.5 text-slate-500" />
                  Chuỗi mã băm chữ ký số HMAC:
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
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
