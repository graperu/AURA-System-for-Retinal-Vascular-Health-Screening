import React, { useState, useEffect } from 'react';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';
import { ClinicBatchJob } from '../types/cds';
import { ShieldCheck, Building2, Layers, Sparkles, Activity, RotateCcw } from 'lucide-react';

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

  // Trạng thái ban đầu khi chưa tải đợt nào: Tiến độ 0%, 0 ảnh
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

export const ClinicPortalPage: React.FC = () => {
  const [batchJob, setBatchJob] = useState<ClinicBatchJob>(getInitialBatchJob);

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
              FR-24 &bull; NFR-2 &bull; NFR-9
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Tiếp nhận thư mục ảnh chụp đáy mắt khối lượng lớn (≥100 ảnh), tự động khử định danh HIPAA SHA-256 HMAC, đưa vào hàng đợi PyTorch AI bất đồng bộ và hỗ trợ lưu trữ liên tục không bị mất dữ liệu khi tải lại.
          </p>
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
