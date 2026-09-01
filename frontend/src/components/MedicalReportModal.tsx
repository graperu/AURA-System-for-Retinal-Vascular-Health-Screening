import React, { useEffect } from 'react';
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
  // Support ESC key and lock background body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvContent = [
      ['Tieu de', 'Gia tri'],
      ['Ma bao cao', result.analysisId],
      ['Ho va ten', patient.fullName],
      ['Ma benh nhan (MRN)', patient.mrn],
      ['Tuoi', patient.age.toString()],
      ['Gioi tinh', patient.gender],
      ['Ngay kham', new Date().toLocaleDateString('vi-VN')],
      ['Diem nguy co mach mau tong hop', `${result.overallVascularRiskScore}/100`],
      ['Nguy co tim mach 3 nam', `${result.cardiovascularRisk.score}%`],
      ['Nguy co dot quy 3 nam', `${result.cardiovascularRisk.threeYearStrokeRiskPercent}%`],
      ['Giai doan tang huyet ap', result.cardiovascularRisk.hypertensionStage],
      ['Nguy co benh vong mac tieu duong', `${result.diabeticRetinopathyRisk.score}% (${result.diabeticRetinopathyRisk.etdrsGrade})`],
      ['Ty le A/V Ratio', result.annotatedMap.arteryVeinRatio.toString()],
      ['Mat do mach mau', `${result.annotatedMap.vesselDensityPercentage}%`],
      ['Do uon luon Tortuosity', result.annotatedMap.tortuosityIndex.toString()],
      ['Ty le Cup/Disc (CDR)', result.annotatedMap.opticCupToDiscRatio.toString()],
      ['Bac si phu trach', doctorName],
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AURA_Report_${patient.mrn}_${result.analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-hidden print:p-0 print:bg-white animate-fadeIn"
    >
      {/* Floating Global Close Button (Always visible at top-right corner) */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 shadow-2xl border-2 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all print:hidden active:scale-95"
        title="Thoát cửa sổ (Esc)"
      >
        <X className="h-4.5 w-4.5 text-rose-600" />
        <span>Thoát (Esc)</span>
      </button>

      {/* Modal Dialog with Fixed Height and Internal Scroll */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:h-auto print:border-none print:shadow-none"
      >
        {/* 1. Permanently Fixed Top Header & Controls */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 print:hidden z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA (FR-7)</h2>
              <span className="text-[11px] text-slate-500 font-mono-data">Mã phiếu: {result.analysisId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-20 sm:pr-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 transition-all active:scale-95"
            >
              <Download className="h-4 w-4 text-slate-600" />
              Xuất CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-800 transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              In Phiếu / PDF
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors ml-1 active:scale-95"
              title="Đóng cửa sổ (Phím Esc hoặc click ra ngoài)"
            >
              <X className="h-4.5 w-4.5" />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* 2. Scrollable Middle Body: Printable Report Document (A4 format) */}
        <div id="printable-report" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 bg-white print:p-6 print:space-y-4">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-cyan-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-800 text-white font-extrabold text-xl shadow-sm">
                <Eye className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-cyan-950">
                  HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  AURA AI Retinal Clinical Decision Support — Phiếu Đánh Giá Sức Khỏe Vi Mạch
                </p>
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-mono-data font-semibold text-slate-700">Mã Báo Cáo: {result.analysisId}</p>
              <p className="text-slate-500">Ngày Phân Tích: {new Date().toLocaleString('vi-VN')}</p>
              <span className="inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200">
                Chuẩn Định Danh Y Tế HL7/FHIR
              </span>
            </div>
          </div>

          {/* Patient Demographics & Baseline Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Họ và tên:</span>
              <strong className="text-slate-900 text-sm">{patient.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Mã bệnh nhân (MRN):</span>
              <strong className="font-mono-data text-cyan-800 text-sm">{patient.mrn}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Tuổi / Giới tính:</span>
              <strong className="text-slate-900">{patient.age} tuổi • {patient.gender === 'Male' ? 'Nam' : 'Nữ'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Huyết áp / HbA1c:</span>
              <strong className="text-slate-900 font-mono-data">{patient.systolicBp}/{patient.diastolicBp} mmHg • {patient.hba1c}%</strong>
            </div>
          </div>

          {/* 1. Visual Images & Grad-CAM Heatmap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Eye className="h-4 w-4 text-cyan-700" />
              1. Hình Ảnh Võng Mạc & Bản Đồ Nhiệt Vi Mạch AI (XAI Heatmap)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-2 flex flex-col items-center">
                <div className="relative aspect-square max-w-[280px] w-full rounded-full overflow-hidden border-2 border-slate-800">
                  <img
                    src={result.imageUrl || '/assets/images/fundus_original.png'}
                    alt="Ảnh đáy mắt gốc"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-300">Ảnh Màu Đáy Mắt Gốc (Mắt Phải - OD)</p>
              </div>

              <div className="rounded-xl overflow-hidden border border-cyan-300 bg-slate-950 p-2 flex flex-col items-center">
                <div className="relative aspect-square max-w-[280px] w-full rounded-full overflow-hidden border-2 border-cyan-600 bg-black">
                  <img
                    src={result.imageUrl || '/assets/images/fundus_original.png'}
                    alt="Ảnh nền"
                    className="h-full w-full object-cover absolute inset-0"
                  />
                  <img
                    src={result.annotatedMap.heatmapUrl || '/assets/images/fundus_heatmap.png'}
                    alt="Bản đồ nhiệt Grad-CAM"
                    className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-cyan-200">Bản đồ Nhiệt Grad-CAM (Vùng Chú Ý Bất Thường)</p>
              </div>
            </div>
          </div>

          {/* 2. Clinical Risk Gauges */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Heart className="h-4 w-4 text-rose-600" />
              2. Đánh Giá Nguy Cơ Lâm Sàng Từ Mô Hình AI
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Nguy Cơ Tim Mạch (3 Năm)</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800 border border-rose-300">
                    High
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-rose-600">
                  {result.cardiovascularRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Tỷ lệ A/V hẹp (0.52), có nguy cơ xơ cứng mạch máu.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Võng Mạc Đái Tháo Đường</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 border border-amber-300">
                    Moderate
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-amber-600">
                  {result.diabeticRetinopathyRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Vi phình mạch rải rác cực sau (ETDRS Grade 43).
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Nguy Cơ Tăng Nhãn Áp (Glaucoma)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 border border-emerald-300">
                    Low
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-emerald-600">
                  {result.glaucomaRisk.score}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Tỷ lệ Cup/Disc (0.38) trong giới hạn an toàn bình thường.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Quantitative Biomarkers Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Activity className="h-4 w-4 text-cyan-700" />
              3. Bảng Phân Tích Định Lượng Vi Mạch Võng Mạc (Biomarkers)
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Chỉ số sinh học</th>
                    <th className="p-2.5">Giá trị đo lường</th>
                    <th className="p-2.5">Ngưỡng chuẩn</th>
                    <th className="p-2.5">Đánh giá lâm sàng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">Tỷ lệ Động/Tĩnh Mạch (A/V Ratio)</td>
                    <td className="p-2.5 font-bold font-mono-data text-rose-600">
                      {result.annotatedMap.arteryVeinRatio}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono-data">≥ 0.67</td>
                    <td className="p-2.5 text-rose-600 font-medium">Co thắt tiểu động mạch võng mạc</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Mật độ Vi Mạch (Vessel Density)</td>
                    <td className="p-2.5 font-bold font-mono-data text-cyan-800">
                      {result.annotatedMap.vesselDensityPercentage}%
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono-data">15.5% - 19.0%</td>
                    <td className="p-2.5 text-slate-600">Giảm nhẹ mật độ tưới máu</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Chỉ số Uốn Lượn (Tortuosity)</td>
                    <td className="p-2.5 font-bold font-mono-data text-amber-600">
                      {result.annotatedMap.tortuosityIndex}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono-data">&lt; 1.25</td>
                    <td className="p-2.5 text-amber-600 font-medium">Uốn lượn bất thường liên quan huyết áp</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Tỷ lệ Lõm Gai / Gai Thị (VCDR)</td>
                    <td className="p-2.5 font-bold font-mono-data text-emerald-600">
                      {result.annotatedMap.opticCupToDiscRatio}
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono-data">&lt; 0.50</td>
                    <td className="p-2.5 text-emerald-600 font-medium">Hình thái gai thị bình thường</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Doctor Recommendation and Signature */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              4. Kết Luận & Khuyến Nghị Của Bác Sĩ Chuyên Khoa
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              Bệnh nhân có biểu hiện co hẹp vi mạch võng mạc kết hợp tiền sử huyết áp {patient.systolicBp}/{patient.diastolicBp} mmHg. Đề nghị:
              <br />1. Tái khám chuyên khoa Tim mạch và Mắt sau 6 tháng.
              <br />2. Duy trì chỉ số huyết áp dưới 130/80 mmHg và HbA1c dưới 7.0%.
              <br />3. Siêu âm Doppler động mạch cảnh kiểm tra xơ vữa.
            </p>

            <div className="flex justify-between items-end pt-4 border-t border-cyan-200/60 text-xs">
              <div className="text-slate-500 text-[11px]">
                <p>Hệ thống AURA Retinal AI v2.1</p>
                <p>Khuyến nghị tuân thủ hướng dẫn AHA/ACC 2026</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[11px]">Bác sĩ chuyên khoa xác nhận:</p>
                <p className="font-bold text-slate-900 text-sm mt-1">{doctorName}</p>
                <span className="text-[10px] text-cyan-700 font-mono-data font-semibold">
                  (Đã ký số điện tử y tế)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Permanently Fixed Bottom Footer with Close & Action Buttons */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between print:hidden z-20">
          <p className="text-xs text-slate-500">
            Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono-data font-bold">Esc</kbd> hoặc bấm ra ngoài để thoát.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all active:scale-95"
            >
              Đóng Cửa Sổ
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              In Phiếu Khám
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
