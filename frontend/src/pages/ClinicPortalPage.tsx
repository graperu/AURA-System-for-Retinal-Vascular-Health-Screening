import React, { useEffect, useState } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicBatchJob } from '../types/cds';
import { bulkScreeningApi, clinicApi } from '../services/api';
import { ShieldCheck, Activity, RotateCcw, Search, Loader2, Layers } from 'lucide-react';

const STORAGE_KEY = 'AURA_CLINIC_BATCH_JOB';

const getInitialBatchJob = (): ClinicBatchJob => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi nạp dữ liệu đợt khám đã lưu:', e);
  }

  // Trạng thái ban đầu khi chưa tải đợt nào
  return {
    batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
    clinicId: 'CLN-CHO-RAY-01',
    clinicName: 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
    totalImages: 0,
    processedCount: 0,
    failedCount: 0,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    estimatedTimeRemainingSec: 0,
    items: [],
  };
};

// FR-22: Hồ sơ đăng ký & xác thực tổ chức phòng khám
const ClinicProfileSection: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | undefined>(undefined);
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    const res = await clinicApi.getProfile();
    if (res.success && res.data) {
      setProfile(res.data);
      setOrgName(res.data.organizationName || '');
      setLicenseNumber(res.data.licenseNumber || '');
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setLicenseDocUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setSubmitting(true);
    setMessage(null);
    const res = await clinicApi.submitProfile({
      organizationName: orgName.trim(),
      licenseNumber: licenseNumber.trim() || undefined,
      licenseDocumentUrl: licenseDocUrl,
    });
    setSubmitting(false);
    if (res.success) {
      setMessage('Đã nộp hồ sơ, đang chờ Quản trị viên xác minh.');
      loadProfile();
    } else {
      setMessage(res.message || 'Nộp hồ sơ thất bại. Vui lòng thử lại.');
    }
  };

  const statusBadge = (status?: string) => {
    if (status === 'APPROVED') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Đã xác minh</span>;
    if (status === 'REJECTED') return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">Bị từ chối</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">Đang chờ duyệt</span>;
  };

  if (loading) return <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 text-sm text-slate-500">Đang tải hồ sơ phòng khám…</div>;

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#134E4A]">Hồ Sơ Tổ Chức Phòng Khám (FR-22)</h2>
          <p className="text-xs text-slate-500 mt-1">Đăng ký & xác thực pháp nhân để được cấp quyền quản lý bác sĩ trực thuộc.</p>
        </div>
        {profile && statusBadge(profile.verificationStatus)}
      </div>

      {profile?.verificationStatus === 'REJECTED' && profile.rejectionReason && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">Lý do từ chối: {profile.rejectionReason}</p>
      )}
      {profile?.verificationStatus === 'PENDING' && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
          Hồ sơ đang chờ Admin xác minh. Bạn chỉ có thể thêm bác sĩ / phân công bệnh nhân sau khi hồ sơ được duyệt.
        </p>
      )}
      {message && <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2">{message}</p>}

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1">Tên tổ chức</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Phòng khám Đa khoa AURA" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Số giấy phép hoạt động</label>
          <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="GPHĐ-000123/BYT" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Giấy phép hoạt động (ảnh/PDF)</label>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-xs" />
          {licenseFileName && <p className="text-[11px] text-slate-400 mt-1">Đã chọn: {licenseFileName}</p>}
        </div>
        <div className="sm:col-span-2">
          <button disabled={submitting} className="rounded-xl bg-[#0891B2] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {submitting ? 'Đang nộp…' : profile ? 'Cập nhật & nộp lại hồ sơ' : 'Nộp hồ sơ đăng ký'}
          </button>
        </div>
      </form>
    </div>
  );
};

// FR-23: Quản lý Bác sĩ trực thuộc & phân công bệnh nhân
const ClinicMembersSection: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [assignPatientId, setAssignPatientId] = useState<Record<string, string>>({});
  const [assignMessage, setAssignMessage] = useState<Record<string, string>>({});

  const loadMembers = async () => {
    setLoading(true);
    const res = await clinicApi.listMembers();
    setMembers(res.success && res.data ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim()) return;
    setError(null);
    const res = await clinicApi.addMember(doctorEmail.trim());
    if (res.success) {
      setDoctorEmail('');
      loadMembers();
    } else {
      setError(res.message || 'Không thể thêm bác sĩ. Kiểm tra lại email, vai trò tài khoản, và hồ sơ phòng khám đã được duyệt (APPROVED) chưa.');
    }
  };

  const handleRemove = async (memberId: string) => {
    const res = await clinicApi.removeMember(memberId);
    if (res.success) loadMembers();
  };

  const handleAssign = async (doctorId: string) => {
    const patientId = assignPatientId[doctorId]?.trim();
    if (!patientId) return;
    const res = await clinicApi.assignPatientToDoctor(doctorId, patientId);
    setAssignMessage((prev) => ({
      ...prev,
      [doctorId]: res.success ? 'Đã phân công bệnh nhân thành công.' : res.message || 'Phân công thất bại.',
    }));
  };

  const handleUnassign = async (doctorId: string) => {
    const patientId = assignPatientId[doctorId]?.trim();
    if (!patientId) return;
    const res = await clinicApi.unassignPatientFromDoctor(doctorId, patientId);
    setAssignMessage((prev) => ({
      ...prev,
      [doctorId]: res.success ? 'Đã gỡ phân công bệnh nhân.' : res.message || 'Gỡ phân công thất bại.',
    }));
  };

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-[#134E4A]">Quản Lý Bác Sĩ Trực Thuộc (FR-23)</h2>
        <p className="text-xs text-slate-500 mt-1">Mời bác sĩ (đã có tài khoản vai trò Bác sĩ) vào phòng khám, và phân công bệnh nhân cho từng bác sĩ.</p>
      </div>

      <form onSubmit={handleAddDoctor} className="flex gap-2 max-w-xl">
        <input
          value={doctorEmail}
          onChange={(e) => setDoctorEmail(e.target.value)}
          placeholder="email.bacsi@aura.com"
          type="email"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm"
        />
        <button className="rounded-xl bg-[#0891B2] px-4 py-2 text-sm font-bold text-white">Thêm bác sĩ</button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải danh sách…</p>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Chưa có bác sĩ nào trực thuộc phòng khám.
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{m.doctorName || m.doctorEmail}</p>
                  <p className="text-xs text-slate-500">{m.doctorEmail} · {m.status}</p>
                </div>
                <button onClick={() => handleRemove(m.id)} className="text-xs font-bold text-red-600 hover:underline">
                  Gỡ khỏi phòng khám
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  value={assignPatientId[m.doctorId] || ''}
                  onChange={(e) => setAssignPatientId((prev) => ({ ...prev, [m.doctorId]: e.target.value }))}
                  placeholder="ID bệnh nhân cần phân công"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
                <button
                  onClick={() => handleAssign(m.doctorId)}
                  className="text-xs font-bold text-[#0891B2] hover:underline shrink-0"
                >
                  Phân công
                </button>
                <button
                  onClick={() => handleUnassign(m.doctorId)}
                  className="text-xs font-bold text-slate-500 hover:underline shrink-0"
                >
                  Gỡ phân công
                </button>
              </div>
              {assignMessage[m.doctorId] && <p className="text-[11px] text-slate-500">{assignMessage[m.doctorId]}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const mapBatch = (data: any): ClinicBatchJob => ({
  batchId: data.batchId,
  clinicId: data.clinicId || 'CLN-AURA-01',
  clinicName: data.clinicName || data.clinicId || 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
  totalImages: data.totalImages || 0,
  processedCount: data.processedCount || 0,
  failedCount: data.failedCount || 0,
  status: data.status || 'COMPLETED',
  createdAt: data.createdAt || new Date().toISOString(),
  estimatedTimeRemainingSec: data.estimatedTimeRemainingSeconds || 0,
  items: (data.items || []).map((item: any) => ({
    id: item.itemId,
    patientName: item.pseudonymPatientId || item.rawMrn || 'Ẩn danh',
    mrn: item.rawMrn || item.pseudonymPatientId,
    eye: item.eyePosition === 'OS' ? 'OS (Mắt Trái)' : 'OD (Mắt Phải)',
    fileName: item.fileName,
    status:
      item.status === 'COMPLETED'
        ? 'DONE'
        : item.status === 'QUEUED'
        ? 'PENDING'
        : item.status === 'FAILED'
        ? 'ERROR'
        : 'PROCESSING',
    riskLevel: item.aiResult?.cardiovascularRiskLevel || item.aiResult?.riskLevel || item.riskLevel,
    riskScore: item.aiResult?.overallVascularRiskScore ?? item.aiResult?.riskScore ?? item.riskScore,
    thumbnailUrl: item.thumbnailUrl || '/assets/images/fundus_original.png',
    anomaliesCount: item.aiResult?.detectedAnomaliesCount,
    strokeRisk: item.aiResult?.threeYearStrokeRiskPercent,
    drLevel: item.aiResult?.diabeticRetinopathyLevel,
    arteryVeinRatio: item.aiResult?.arteryVeinRatio,
    vesselDensity: item.aiResult?.vesselDensityPercentage,
    tortuosityIndex: item.aiResult?.tortuosityIndex,
    rationales: item.aiResult?.xaiRationales,
    heatmapUrl: item.aiResult?.heatmapOverlayUrl,
  })),
});

interface ClinicPortalProps {
  activeView?: string;
}

export const ClinicPortalPage: React.FC<ClinicPortalProps> = ({ activeView }) => {
  const [batchJob, setBatchJob] = useState<ClinicBatchJob>(getInitialBatchJob);
  const [lookupBatchId, setLookupBatchId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // Load available batches from server on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await bulkScreeningApi.listBatches();
        if (response.success && Array.isArray(response.data)) {
          setAvailableBatches(response.data);
        }
      } catch {
        // Ignore network errors on init
      }
    };
    fetchBatches();
  }, []);

  if (activeView === 'campaign-analytics') {
    return <ClinicCampaignAnalytics />;
  }

  if (activeView === 'doctors-manage') {
    return (
      <div className="space-y-6">
        <ClinicProfileSection />
        <ClinicMembersSection />
      </div>
    );
  }

  const handleUpdateBatch = (updated: ClinicBatchJob) => {
    setBatchJob(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi lưu đợt khám:', e);
    }
  };

  const handleResetBatch = () => {
    if (batchJob.items.length > 0) {
      const ok = window.confirm(
        'Bạn có chắc chắn muốn kết thúc đợt khám này và TẠO ĐỢT KHÁM MỚI (đưa tiến độ về 0%) không? Toàn bộ danh sách các ảnh đã khám hiện tại sẽ được làm mới.'
      );
      if (!ok) return;
    }
    const emptyJob: ClinicBatchJob = {
      batchId: 'CHƯA_TẢI_ĐỢT_NÀO',
      clinicId: 'CLN-CHO-RAY-01',
      clinicName: 'Bệnh viện Chợ Rẫy — Trung tâm Sàng lọc Đáy mắt',
      totalImages: 0,
      processedCount: 0,
      failedCount: 0,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      estimatedTimeRemainingSec: 0,
      items: [],
    };
    setBatchJob(emptyJob);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Lỗi xóa cache:', e);
    }
  };

  const handleLookupBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupBatchId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const response = await bulkScreeningApi.getBatch(lookupBatchId.trim());
      if (!response.success || !response.data) {
        setLookupError(response.message || 'Không tìm thấy batch hoặc bạn không có quyền truy cập.');
      } else {
        const mapped = mapBatch(response.data);
        handleUpdateBatch(mapped);
      }
    } catch (err: any) {
      setLookupError(err.message || 'Lỗi khi tra cứu batch.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSelectBatch = async (selectedId: string) => {
    if (!selectedId || selectedId === batchJob.batchId) return;
    setLookupBatchId(selectedId);
    setLookupLoading(true);
    setLookupError(null);
    try {
      const response = await bulkScreeningApi.getBatch(selectedId);
      if (response.success && response.data) {
        handleUpdateBatch(mapBatch(response.data));
      } else {
        setLookupError(response.message || 'Không thể tải dữ liệu đợt khám.');
      }
    } catch (err: any) {
      setLookupError(err.message || 'Lỗi khi tải đợt khám.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinic Portal Header Banner */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#134E4A]">
              Cổng Quản Lý Chiến Dịch Sàng Lọc Hàng Loạt (Clinic Portal)
            </h1>
            <span className="bg-cyan-100 text-[#0891B2] text-[11px] font-bold font-mono-data px-2.5 py-0.5 rounded-full border border-cyan-200">
              FR-24 &bull; FR-25 &bull; FR-29 &bull; NFR-2 &bull; NFR-9
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Tiếp nhận thư mục ảnh chụp đáy mắt khối lượng lớn (≥100 ảnh), tự động khử định danh HIPAA SHA-256 HMAC, đưa vào hàng đợi PyTorch AI bất đồng bộ và hỗ trợ giám sát rủi ro tổng hợp.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Quick lookup form */}
            <form onSubmit={handleLookupBatch} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={lookupBatchId}
                onChange={(e) => setLookupBatchId(e.target.value)}
                placeholder="Nhập mã Batch ID cần tra cứu..."
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-[#0891B2] outline-none"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="flex items-center gap-1 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Tra cứu</span>
              </button>
            </form>

            {/* Dropdown for available batches */}
            {availableBatches.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#0891B2]" /> Đợt có sẵn:
                </span>
                <select
                  value={batchJob.batchId}
                  onChange={(e) => handleSelectBatch(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:border-[#0891B2]"
                >
                  <option value="">-- Chọn đợt sàng lọc --</option>
                  {availableBatches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} ({b.processedCount}/{b.totalImages} ảnh &bull; {b.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {lookupError && <p className="mt-1 text-xs text-red-500 font-medium">{lookupError}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F0FDFA] border border-[#CCFBF1] px-3.5 py-2 rounded-xl text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-[#134E4A]">HIPAA De-ID v3</span>
          </div>
          <div className="flex items-center gap-2 bg-[#F0FDFA] border border-[#CCFBF1] px-3.5 py-2 rounded-xl text-xs">
            <Activity className="w-4 h-4 text-[#0891B2]" />
            <span className="font-semibold text-[#134E4A]">PyTorch ResNet50</span>
          </div>
          {batchJob.items.length > 0 && (
            <button
              onClick={handleResetBatch}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Làm mới để bắt đầu chiến dịch tầm soát mới (xóa dữ liệu đợt cũ đã lưu)"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Tạo Đợt Khám Mới
            </button>
          )}
        </div>
      </div>

      {/* Main Batch Processing Dashboard */}
      <ClinicBatchProcessing
        batchJob={batchJob}
        onUpdateBatch={handleUpdateBatch}
        onResetBatch={handleResetBatch}
      />
    </div>
  );
};