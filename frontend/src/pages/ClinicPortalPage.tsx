import React, { useEffect, useState } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { ClinicBatchJob } from '../types/cds';
import { bulkScreeningApi } from '../services/api';
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
