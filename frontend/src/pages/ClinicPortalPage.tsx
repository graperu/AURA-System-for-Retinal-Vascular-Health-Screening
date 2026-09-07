import React, { useEffect, useState } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicCampaignAnalytics } from '../components/ClinicCampaignAnalytics';
import { bulkScreeningApi } from '../services/api';
import { ClinicBatchJob } from '../types/cds';
import { Layers, RefreshCw, ArrowRight } from 'lucide-react';

const mapBatch = (data: any): ClinicBatchJob => ({
  batchId: data.batchId,
  clinicId: data.clinicId,
  clinicName: data.clinicId || 'Phòng khám đa khoa AURA',
  totalImages: data.totalImages || 0,
  processedCount: data.processedCount || 0,
  failedCount: data.failedCount || 0,
  status: data.status,
  createdAt: data.createdAt,
  estimatedTimeRemainingSec: data.estimatedTimeRemainingSeconds || 0,
  items: (data.items || []).map((item: any) => ({
    id: item.itemId,
    patientName: item.pseudonymPatientId,
    mrn: item.pseudonymPatientId,
    eye: item.eyePosition === 'OS' ? 'OS' : 'OD',
    fileName: item.fileName,
    status:
      item.status === 'COMPLETED'
        ? 'DONE'
        : item.status === 'QUEUED'
        ? 'PENDING'
        : item.status === 'FAILED'
        ? 'ERROR'
        : 'PROCESSING',
    riskLevel: item.aiResult?.cardiovascularRiskLevel || item.aiResult?.riskLevel,
    riskScore: item.aiResult?.overallVascularRiskScore ?? item.aiResult?.riskScore,
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
  const [batchId, setBatchId] = useState('');
  const [batchJob, setBatchJob] = useState<ClinicBatchJob | null>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load available batches on mount
  const fetchBatches = async () => {
    try {
      const response = await bulkScreeningApi.listBatches();
      if (response.success && Array.isArray(response.data)) {
        setAvailableBatches(response.data);
        if (response.data.length > 0 && !batchJob) {
          // Auto-load first batch
          const first = response.data[0];
          setBatchId(first.batchId);
          setBatchJob(mapBatch(first));
        }
      }
    } catch {
      // Ignore network errors on init
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const loadBatchById = async (idToLoad: string) => {
    if (!idToLoad.trim()) return;
    setLoading(true);
    setError(null);
    const response = await bulkScreeningApi.getBatch(idToLoad.trim());
    setLoading(false);
    if (!response.success || !response.data) {
      setBatchJob(null);
      setError(response.message || 'Không tìm thấy batch hoặc bạn không có quyền truy cập.');
      return;
    }
    setBatchJob(mapBatch(response.data));
  };

  if (activeView === 'campaign-analytics') {
    return <ClinicCampaignAnalytics />;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadBatchById(batchId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#134E4A]">Cổng Quản Lý Chiến Dịch Sàng Lọc Hàng Loạt</h1>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi dữ liệu nguy cơ tổng hợp [FR-25] và nhận cảnh báo ca bệnh nguy cơ cao khẩn cấp [FR-29].
            </p>
          </div>

          {availableBatches.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0891B2]" /> Đợt sàng lọc có sẵn:
              </span>
              <select
                value={batchJob?.batchId || ''}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  loadBatchById(e.target.value);
                }}
                className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none"
              >
                {availableBatches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} ({b.processedCount}/{b.totalImages} ảnh &bull; {b.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
          <input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Nhập mã batch (Ví dụ: BATCH-1725612345678)"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#0891B2] outline-none"
          />
          <button
            disabled={loading}
            className="rounded-xl bg-[#0891B2] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E7490] disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? 'Đang tải...' : 'Tải dữ liệu'}
          </button>
        </form>

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      </div>

      {batchJob ? (
        <ClinicBatchProcessing batchJob={batchJob} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Chưa tải đợt sàng lọc nào. Vui lòng nhập mã batch hoặc chọn đợt sàng lọc từ danh sách phía trên để giám sát rủi ro tổng hợp.
        </div>
      )}
    </div>
  );
};
