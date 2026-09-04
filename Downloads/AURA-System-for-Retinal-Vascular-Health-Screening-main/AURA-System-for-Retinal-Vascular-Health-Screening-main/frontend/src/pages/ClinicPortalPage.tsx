import React, { useState } from 'react';
import { MockAIService } from '../services/mockAiEngine';
import { ClinicBatchProcessing } from '../components/ClinicBatchProcessing';

export const ClinicPortalPage: React.FC = () => {
  const [batchJob] = useState(MockAIService.getMockBatchJob());

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm">
        <h1 className="text-xl font-extrabold text-[#134E4A]">Cổng Quản Lý Chiến Dịch Sàng Lọc Hàng Loạt (Clinic Portal)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hỗ trợ tải lên danh sách ảnh võng mạc khối lượng lớn (≥100 ảnh), tự động xử lý hàng đợi PyTorch AI, phân công bác sĩ thẩm định và theo dõi hạn mức credit.
        </p>
      </div>

      <ClinicBatchProcessing batchJob={batchJob} />
    </div>
  );
};
