import React, { useState } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { bulkScreeningApi } from '../services/api';
import { ClinicBatchJob } from '../types/cds';

const mapBatch = (data: any): ClinicBatchJob => ({
  batchId: data.batchId,
  clinicId: data.clinicId,
  clinicName: data.clinicId,
  totalImages: data.totalImages,
  processedCount: data.processedCount,
  failedCount: data.failedCount,
  status: data.status,
  createdAt: data.createdAt,
  estimatedTimeRemainingSec: data.estimatedTimeRemainingSeconds,
  items: (data.items || []).map((item: any) => ({
    id: item.itemId,
    patientName: item.pseudonymPatientId,
    mrn: item.pseudonymPatientId,
    eye: item.eyePosition === 'OS' ? 'OS' : 'OD',
    fileName: item.fileName,
    status: item.status === 'COMPLETED' ? 'DONE' : item.status === 'QUEUED' ? 'PENDING' : item.status === 'FAILED' ? 'ERROR' : 'PROCESSING',
    riskLevel: item.aiResult?.riskLevel,
    riskScore: item.aiResult?.riskScore,
  })),
});

export const ClinicPortalPage: React.FC = () => {
  const [batchId, setBatchId] = useState('');
  const [batchJob, setBatchJob] = useState<ClinicBatchJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!batchId.trim()) return;
    setLoading(true);
    setError(null);
    const response = await bulkScreeningApi.getBatch(batchId.trim());
    setLoading(false);
    if (!response.success || !response.data) {
      setBatchJob(null);
      setError(response.message || 'Không tìm thấy batch hoặc bạn không có quyền truy cập.');
      return;
    }
    setBatchJob(mapBatch(response.data));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#134E4A]">Cổng Quản Lý Chiến Dịch Sàng Lọc Hàng Loạt</h1>
          <p className="text-xs text-slate-500 mt-1">Nhập mã batch đã tạo để theo dõi dữ liệu xử lý thật từ máy chủ.</p>
        </div>
        <form onSubmit={loadBatch} className="flex gap-2 max-w-xl">
          <input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Mã batch" className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm" />
          <button disabled={loading} className="rounded-xl bg-[#0891B2] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {loading ? 'Đang tải…' : 'Tải dữ liệu'}
          </button>
        </form>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
      {batchJob ? <ClinicBatchProcessing batchJob={batchJob} /> : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Chưa tải batch nào. Màn hình không còn tự sinh bệnh nhân hay kết quả AI mẫu.
        </div>
      )}
    </div>
  );
};
