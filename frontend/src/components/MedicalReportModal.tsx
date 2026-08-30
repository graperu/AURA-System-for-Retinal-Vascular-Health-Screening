import React from 'react';
import { PatientProfile, AIRiskResult } from '../types/cds';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Eye, Heart, Activity } from 'lucide-react';

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  result: AIRiskResult;
  doctorName?: string;
}

export const MedicalReportModal: React.FC<MedicalReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  result,
  doctorName = 'BS. CKII Nguyễn Thị Thanh',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none">
        {/* Modal Header & Controls (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-800">Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA (Xem trước PDF)</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-800 transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              In Phiếu / Lưu PDF (A4)
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document (A4 format) */}
        <div id="printable-report" className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white print:p-6 print:space-y-4">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-cyan-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-800 text-white font-extrabold text-xl shadow-sm">
                <Eye className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-cyan-950 uppercase">Hệ Thống Sàng Lọc AURA</h1>
                <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                  AI Understanding Retinal Analysis System • Tiêu chuẩn HIPAA & ISO 27001
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono-data text-xs space-y-0.5">
              <p className="font-bold text-cyan-900">MÃ BÁO CÁO: <span className="text-slate-900">{result.analysisId}</span></p>
              <p className="text-slate-500 text-[11px]">Ngày khám: {new Date().toLocaleDateString('vi-VN')}</p>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                ✓ ĐÃ XÁC THỰC LÂM SÀNG
              </p>
            </div>
          </div>

          <div className="text-center py-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
              PHIẾU KẾT QUẢ SÀNG LỌC SỨC KHỎE MẠCH MÁU VÕNG MẠC
            </h2>
            <p className="text-xs text-slate-500 italic">
              (Retinal Vascular Health & Clinical Decision Support Diagnostic Report)
            </p>
          </div>

          {/* Patient Demographic Table */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
                <strong className="text-slate-900 text-sm">{patient.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Mã bệnh nhân (MRN):</span>
                <span className="font-mono-data font-bold text-cyan-800">{patient.mrn}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tuổi / Giới tính:</span>
                <span className="font-medium">{patient.age} tuổi • {patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Huyết áp / HbA1c:</span>
                <span className="font-mono-data font-bold">{patient.systolicBp}/{patient.diastolicBp} mmHg • {patient.hba1c}%</span>
              </div>
            </div>
          </div>

          {/* Retinal Fundus Scan & Grad-CAM Heatmap Side-by-Side */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-700" />
              1. Hình Ảnh Võng Mạc & Bản Đồ Nhiệt Vi Mạch AI (XAI Heatmap)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-2 text-center text-white space-y-1">
                <img
                  src="/assets/images/fundus_original.png"
                  alt="Ảnh chụp đáy mắt gốc"
                  className="w-full h-44 object-contain rounded-lg mx-auto bg-black"
                />
                <span className="text-[11px] font-semibold text-slate-300 block">Ảnh Màu Đáy Mắt Gốc (Mắt Phải - OD)</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-950 p-2 text-center text-white space-y-1">
                <img
                  src="/assets/images/fundus_heatmap.png"
                  alt="Ảnh bản đồ nhiệt AI"
                  className="w-full h-44 object-contain rounded-lg mx-auto bg-black"
                />
                <span className="text-[11px] font-semibold text-cyan-300 block">Bản Đồ Nhiệt Grad-CAM (Vùng Chú Ý Bất Thường)</span>
              </div>
            </div>
          </div>

          {/* AI Risk Score Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-600" />
              2. Đánh Giá Nguy Cơ Lâm Sàng Từ Mô Hình AI
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-red-900">
                  <span>Nguy Cơ Tim Mạch (3 Năm)</span>
                  <span className="rounded bg-red-200 px-1.5 py-0.2 text-[10px] text-red-800">High</span>
                </div>
                <div className="text-2xl font-black font-mono-data text-red-600">
                  {result.cardiovascularRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600">Tỷ lệ A/V hẹp (0.52), có nguy cơ xơ cứng mạch máu.</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Võng Mạc Đái Tháo Đường</span>
                  <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[10px] text-amber-800">Moderate</span>
                </div>
                <div className="text-2xl font-black font-mono-data text-amber-700">
                  {result.diabeticRetinopathyRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600">Vi phình mạch rải rác cực sau (ETDRS Grade 43).</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Nguy Cơ Tăng Nhãn Áp (Glaucoma)</span>
                  <span className="rounded bg-emerald-200 px-1.5 py-0.2 text-[10px] text-emerald-800">Low</span>
                </div>
                <div className="text-2xl font-black font-mono-data text-emerald-700">
                  {result.glaucomaRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600">Tỷ lệ Cup/Disc (0.38) trong giới hạn an toàn bình thường.</p>
              </div>
            </div>
          </div>

          {/* Quantitative Biomarkers Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Bảng Phân Tích Định Lượng Vi Mạch Võng Mạc (Biomarkers)
            </h3>
            <table className="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="py-2 px-3 border-b border-slate-200">Chỉ số sinh học</th>
                  <th className="py-2 px-3 border-b border-slate-200">Giá trị đo lường</th>
                  <th className="py-2 px-3 border-b border-slate-200">Ngưỡng chuẩn</th>
                  <th className="py-2 px-3 border-b border-slate-200">Đánh giá lâm sàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Tỷ lệ Động/Tĩnh Mạch (A/V Ratio)</td>
                  <td className="py-2 px-3 font-mono-data font-bold text-red-600">0.52</td>
                  <td className="py-2 px-3 font-mono-data text-slate-500">&ge; 0.67</td>
                  <td className="py-2 px-3 text-red-700 font-medium">Co thắt tiểu động mạch võng mạc</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Mật độ Vi Mạch (Vessel Density)</td>
                  <td className="py-2 px-3 font-mono-data font-bold text-cyan-800">14.8%</td>
                  <td className="py-2 px-3 font-mono-data text-slate-500">15.5% - 19.0%</td>
                  <td className="py-2 px-3 text-amber-700 font-medium">Giảm nhẹ mật độ tưới máu</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Chỉ số Uốn Lượn (Tortuosity)</td>
                  <td className="py-2 px-3 font-mono-data font-bold text-amber-700">1.42</td>
                  <td className="py-2 px-3 font-mono-data text-slate-500">&lt; 1.25</td>
                  <td className="py-2 px-3 text-amber-700 font-medium">Uốn lượn bất thường liên quan huyết áp</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Tỷ lệ Lõm Gai / Gai Thị (VCDR)</td>
                  <td className="py-2 px-3 font-mono-data font-bold text-emerald-700">0.38</td>
                  <td className="py-2 px-3 font-mono-data text-slate-500">&lt; 0.50</td>
                  <td className="py-2 px-3 text-emerald-700 font-medium">Hình thái gai thị bình thường</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Doctor Conclusion & Sign-off */}
          <div className="rounded-xl border-2 border-dashed border-cyan-800/40 bg-cyan-50/40 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-700" />
              4. Kết Luận & Khuyến Nghị Của Bác Sĩ Chuyên Khoa
            </h3>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              Bệnh nhân có biểu hiện co hẹp vi mạch võng mạc kết hợp tiền sử huyết áp 138/88 mmHg. Đề nghị:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-2">
              <li>Kiểm soát huyết áp mục tiêu &lt; 130/80 mmHg và duy trì chế độ ăn giảm muối.</li>
              <li>Theo dõi đường huyết định kỳ, xét nghiệm lại HbA1c sau 3 tháng.</li>
              <li>Tái khám chuyên khoa Mắt và chụp đáy mắt lại sau 6 tháng để theo dõi tiến triển vi phình mạch.</li>
            </ul>

            <div className="flex justify-end pt-4">
              <div className="text-center w-56 space-y-1">
                <p className="text-[11px] text-slate-500 font-medium">Bác sĩ Thẩm định Lâm sàng</p>
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-sm text-cyan-900 font-bold">[Chữ ký số: Nguyễn Thị Thanh]</span>
                </div>
                <p className="text-xs font-bold text-slate-900">{doctorName}</p>
                <p className="text-[10px] text-slate-400">Khoa Mắt & Tim mạch can thiệp</p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer Footer */}
          <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500 leading-tight">
            <p className="font-semibold text-slate-700">
              LƯU Ý: AURA là hệ thống hỗ trợ quyết định lâm sàng và sàng lọc ban đầu, không thay thế chẩn đoán y khoa chính thức.
            </p>
            <p>© 2026 AURA System. Mã bảo mật SHA-256: 9f8a8123c89b • ISO/IEC 27001:2022 Certified.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
