import React, { useEffect, useState } from 'react';
import { ClinicBatchJob } from '../types/cds';
import { CreditPurchaseModal } from './CreditPurchaseModal';
import { UploadCloud, Building2, CreditCard, Play, Pause, CheckCircle2, Clock, AlertTriangle, Search, Download, FileSpreadsheet } from 'lucide-react';
import { billingApi } from '../services/api';

interface ClinicBatchProcessingProps {
  batchJob: ClinicBatchJob;
}

export const ClinicBatchProcessing: React.FC<ClinicBatchProcessingProps> = ({ batchJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [clinicCredits, setClinicCredits] = useState(0);

  useEffect(() => {
    billingApi.mySubscriptions().then((response) => {
      if (response.success && Array.isArray(response.data)) {
        setClinicCredits(response.data.reduce((total: number, item: any) =>
          total + (item.status === 'ACTIVE' ? Number(item.remainingCredits || 0) : 0), 0));
      }
    });
  }, []);

  const filteredItems = batchJob.items.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const percentComplete = Math.round((batchJob.processedCount / batchJob.totalImages) * 100);

  const handleExportCSV = () => {
    const headers = ['STT', 'Ma_MRN', 'Ho_Ten_Benh_Nhan', 'Mat_Kham', 'File_Anh', 'Trang_Thai_AI', 'Muc_Rui_Ro', 'Diem_Rui_Ro_Phan_Tram'];
    const rows = batchJob.items.map((it, idx) => [
      idx + 1,
      `"${it.mrn}"`,
      `"${it.patientName}"`,
      `"${it.eye}"`,
      `"${it.fileName}"`,
      `"${it.status}"`,
      `"${it.riskLevel || 'N/A'}"`,
      it.riskScore || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AURA_Clinic_Screening_Report_${batchJob.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Clinic Campaign Metrics & Credit Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clinic Info & Campaign */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#134E4A]">{batchJob.clinicName}</h3>
            <span className="text-xs text-slate-500 block">Mã Chiến Dịch: {batchJob.batchId}</span>
            <span className="text-[11px] text-[#16A34A] font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái: {batchJob.status}
            </span>
          </div>
        </div>

        {/* Batch Queue Real-Time Progress */}
        <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-md space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#134E4A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0891B2]" /> Tiến Độ Xử Lý Hàng Loạt (Bulk Job)
            </span>
            <span className="font-mono-data font-bold text-[#0891B2]">{percentComplete}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0891B2] h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-data">
            <span>Đã xong: <strong>{batchJob.processedCount}/{batchJob.totalImages}</strong> ảnh</span>
            <span>Thời gian còn lại: <strong>~{(batchJob.estimatedTimeRemainingSec / 60).toFixed(1)} phút</strong></span>
          </div>
        </div>

        {/* Screening Credits Management */}
        <div className="bg-gradient-to-br from-[#0891B2] to-[#134E4A] text-white rounded-2xl p-5 shadow-medical-md space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Quản Lý Gói Credit Screening
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono-data">Dữ liệu API</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono-data">{clinicCredits.toLocaleString()}</span>
            <span className="text-xs text-cyan-200">lượt AI còn lại</span>
          </div>
          <div className="text-[11px] text-cyan-100 flex justify-between items-center pt-1">
            <span>Lấy từ subscription đang hoạt động</span>
            <button
              onClick={() => setIsCreditModalOpen(true)}
              className="bg-white text-[#0891B2] hover:bg-cyan-50 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              + Mua Thêm Credit
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-4 shadow-medical-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bệnh nhân theo tên, Mã MRN hoặc tên file ảnh..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#0891B2]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="DONE">Đã Xử Lý AI (Done)</option>
              <option value="PROCESSING">Đang Thực Thi (Processing)</option>
              <option value="PENDING">Đang Chờ (Pending)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo CSV
            </button>
            <button className="px-4 py-2 bg-[#0891B2] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#0E7490] transition-colors flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> Tải Lên Tập Hàng Loạt (≥100 Ảnh DICOM)
            </button>
          </div>
        </div>

        {/* Batch Queue Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono-data">
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Bệnh Nhân & Mã MRN</th>
                <th className="py-3 px-4">Mắt Chụp</th>
                <th className="py-3 px-4">File Ảnh DICOM</th>
                <th className="py-3 px-4">Trạng Thái AI</th>
                <th className="py-3 px-4">Mức Nguy Cơ AI</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredItems.slice(0, 15).map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#F0FDFA]/60 transition-colors">
                  <td className="py-3 px-4 font-mono-data text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#134E4A]">{item.patientName}</div>
                    <div className="text-[11px] font-mono-data text-slate-400">{item.mrn}</div>
                  </td>
                  <td className="py-3 px-4 font-mono-data">{item.eye}</td>
                  <td className="py-3 px-4 font-mono-data text-slate-600">{item.fileName}</td>
                  <td className="py-3 px-4">
                    {item.status === 'DONE' && (
                      <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Thành công
                      </span>
                    )}
                    {item.status === 'PROCESSING' && (
                      <span className="inline-flex items-center gap-1 text-[#0891B2] font-semibold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 text-[11px] animate-pulse">
                        <Clock className="w-3 h-3 animate-spin" /> Đang chạy PyTorch
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        Đang chờ queue
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.riskLevel ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono-data ${
                          item.riskLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.riskLevel === 'Moderate'
                            ? 'bg-amber-100 text-amber-900'
                            : item.riskLevel === 'High'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-red-100 text-red-900 font-bold'
                        }`}
                      >
                        {item.riskLevel} ({item.riskScore}%)
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[#0891B2] hover:text-[#0E7490] font-semibold text-xs">
                      Xem CDS &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreditPurchaseModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        userRole="clinic"
        currentCredit={clinicCredits}
        onSuccess={(added) => setClinicCredits((prev) => prev + added)}
      />
    </div>
  );
};
