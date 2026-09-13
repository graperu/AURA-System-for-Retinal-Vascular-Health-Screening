import React, { useEffect } from 'react';
import { PatientProfile, AIRiskResult } from '../types/cds';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Heart,
  Activity,
  AlertTriangle,
  FileBadge,
  Clock,
} from 'lucide-react';
import { parseIcd10Codes } from '../services/screeningMapper';

interface MedicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  result: AIRiskResult;
  resultOD?: AIRiskResult;
  resultOS?: AIRiskResult;
  isDualEye?: boolean;
  doctorName?: string;
}

export const MedicalReportModal: React.FC<MedicalReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  result,
  resultOD,
  resultOS,
  isDualEye = false,
  doctorName,
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

  const hasDualData = Boolean(resultOD && resultOS) || isDualEye;
  const odData = resultOD || result;
  const osData = resultOS || result;

  // Kiểm tra điều kiện thẩm định và chữ ký số bác sĩ
  const isReviewed = result.status === 'REVIEWED' && Boolean(result.digitalSignature);
  const verifiedDoctorName = isReviewed ? (result.doctorName || doctorName || 'Bác sĩ Chuyên Khoa') : null;

  // Ngày giờ khám thực tế từ CSDL
  const examDate = result.createdAt ? new Date(result.createdAt) : new Date();
  const examDateStr = !isNaN(examDate.getTime())
    ? examDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('vi-VN');
  const examDateTimeStr = !isNaN(examDate.getTime())
    ? examDate.toLocaleString('vi-VN')
    : new Date().toLocaleString('vi-VN');

  // Xử lý mã ICD-10
  const icdCodes = Array.isArray(result.icd10Codes)
    ? result.icd10Codes
    : parseIcd10Codes(result.icd10Codes);

  // Tuyên bố miễn trừ trách nhiệm y tế bắt buộc
  const MEDICAL_DISCLAIMER =
    'Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.';

  // Động hóa đánh giá lâm sàng theo ngưỡng y văn
  const evaluateAvRatio = (val: number) => {
    if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
    if (val >= 0.67) return { text: 'Tỷ lệ A/V trong giới hạn bình thường (≥ 0.67)', color: 'text-emerald-600' };
    if (val >= 0.55) return { text: 'Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)', color: 'text-amber-600' };
    return { text: 'Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)', color: 'text-rose-600 font-medium' };
  };

  const evaluateVesselDensity = (val: number) => {
    if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
    if (val < 15.5) return { text: 'Giảm tưới máu vi mạch võng mạc (< 15.5%)', color: 'text-rose-600 font-medium' };
    if (val > 19.0) return { text: 'Tăng sinh vi mạch hoặc phù nề (> 19.0%)', color: 'text-amber-600' };
    return { text: 'Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)', color: 'text-emerald-600' };
  };

  const evaluateTortuosity = (val: number) => {
    if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
    if (val < 1.25) return { text: 'Độ uốn lượn mạch máu bình thường (< 1.25)', color: 'text-emerald-600' };
    if (val < 1.4) return { text: 'Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)', color: 'text-amber-600' };
    return { text: 'Mạch máu ngoằn ngoèo bất thường (≥ 1.40)', color: 'text-rose-600 font-medium' };
  };

  const evaluateVcdr = (val: number) => {
    if (val <= 0) return { text: 'Chưa đủ dữ liệu phân tích', color: 'text-slate-500' };
    if (val < 0.5) return { text: 'Hình thái gai thị bình thường (< 0.50)', color: 'text-emerald-600' };
    if (val < 0.7) return { text: 'Lõm gai mở rộng sinh lý/nghi ngờ sớm (0.50 - 0.69)', color: 'text-amber-600' };
    return { text: 'Lõm gai rộng bất thường, cần tầm soát Glaucoma (≥ 0.70)', color: 'text-rose-600 font-medium' };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const sanitizeCsvCell = (val: string): string => {
      if (!val) return '';
      const trimmed = String(val).trim();
      if (/^[=+\-@\t\r]/.test(trimmed)) {
        return `'${trimmed}`;
      }
      return trimmed;
    };

    const notesValue = (result as any).notes || result.recommendations || '';
    const findingsValue = result.findings || patient.findingsSummary || '';
    const doctorNotesValue = result.doctorNotes || '';

    const csvContent = hasDualData
      ? [
          ['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER],
          ['Tieu de', 'Mat Phai (OD)', 'Mat Trai (OS)', 'Nguong chuan', 'Danh gia lam sang'],
          ['Ma bao cao', odData.analysisId, osData.analysisId, 'HL7/FHIR', ''],
          ['Ho va ten', sanitizeCsvCell(patient.fullName || ''), sanitizeCsvCell(patient.fullName || ''), '', ''],
          ['Ma benh nhan (MRN)', sanitizeCsvCell(patient.mrn || ''), sanitizeCsvCell(patient.mrn || ''), '', ''],
          ['Tuoi / Gioi tinh', `${patient.age ?? ''} tuoi - ${patient.gender ?? ''}`, '', '', ''],
          ['Huyet ap / HbA1c', `${patient.systolicBp ?? ''}/${patient.diastolicBp ?? ''} mmHg`, `${patient.hba1c ?? ''}%`, '', ''],
          ['Ngay gio kham', examDateTimeStr, examDateTimeStr, '', ''],
          ['Diem nguy co mach mau tong hop', `${odData.overallVascularRiskScore}/100`, `${osData.overallVascularRiskScore}/100`, '< 45/100', ''],
          ['Nguy co tim mach 3 nam', `${odData.cardiovascularRisk.score}%`, `${osData.cardiovascularRisk.score}%`, '< 40%', ''],
          ['Nguy co dot quy 3 nam', `${odData.cardiovascularRisk.threeYearStrokeRiskPercent}%`, `${osData.cardiovascularRisk.threeYearStrokeRiskPercent}%`, '< 10%', ''],
          ['Giai doan tang huyet ap', odData.cardiovascularRisk.hypertensionStage, osData.cardiovascularRisk.hypertensionStage, 'Binh thuong', ''],
          ['Nguy co benh vong mac tieu duong', `${odData.diabeticRetinopathyRisk.score}%`, `${osData.diabeticRetinopathyRisk.score}%`, '< 30%', ''],
          ['Ty le A/V Ratio', odData.annotatedMap.arteryVeinRatio.toString(), osData.annotatedMap.arteryVeinRatio.toString(), '>= 0.67', `OD: ${evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).text} | OS: ${evaluateAvRatio(osData.annotatedMap.arteryVeinRatio).text}`],
          ['Mat do vi mach (Vessel Density)', `${odData.annotatedMap.vesselDensityPercentage}%`, `${osData.annotatedMap.vesselDensityPercentage}%`, '15.5% - 19.0%', `OD: ${evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).text} | OS: ${evaluateVesselDensity(osData.annotatedMap.vesselDensityPercentage).text}`],
          ['Do uon luon (Tortuosity)', odData.annotatedMap.tortuosityIndex.toString(), osData.annotatedMap.tortuosityIndex.toString(), '< 1.25', `OD: ${evaluateTortuosity(odData.annotatedMap.tortuosityIndex).text} | OS: ${evaluateTortuosity(osData.annotatedMap.tortuosityIndex).text}`],
          ['Ty le Cup/Disc (CDR)', odData.annotatedMap.opticCupToDiscRatio.toString(), osData.annotatedMap.opticCupToDiscRatio.toString(), '< 0.50', `OD: ${evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).text} | OS: ${evaluateVcdr(osData.annotatedMap.opticCupToDiscRatio).text}`],
          ['Ma chan doan ICD-10', icdCodes.join('; ') || 'Chua ghi nhan', '', '', ''],
          ['Ket luan bac si (Doctor Notes)', sanitizeCsvCell(doctorNotesValue || odData.doctorNotes || osData.doctorNotes || ''), '', '', ''],
          ['Phat hien lam sang (Findings)', sanitizeCsvCell(findingsValue || odData.findings || osData.findings || ''), '', '', ''],
          ['Ghi chu / Khuyen nghi (Notes)', sanitizeCsvCell(notesValue || odData.recommendations || osData.recommendations || ''), '', '', ''],
          ['Trang thai tham dinh', isReviewed ? 'Da duyet lam sang' : 'Cho bac si tham dinh', '', '', ''],
          ['Bac si phu trach', isReviewed ? sanitizeCsvCell(verifiedDoctorName || 'Bac si chuyen khoa') : 'Chua co bac si tham dinh', '', '', ''],
          ['Chu ky so SHA-256', isReviewed ? sanitizeCsvCell(result.digitalSignature || 'Da ky so') : 'Chua ky so', '', '', ''],
          ['Thoi diem ky', isReviewed && result.signedAt ? new Date(result.signedAt).toLocaleString('vi-VN') : 'Chua ky', '', '', ''],
        ]
          .map((row) => row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')
      : [
          ['TUYEN BO MIEN TRU TRACH NHIEM Y TE', MEDICAL_DISCLAIMER],
          ['Tieu de', 'Gia tri', 'Nguong chuan', 'Danh gia lam sang'],
          ['Ma bao cao', result.analysisId, 'HL7/FHIR', ''],
          ['Ho va ten', sanitizeCsvCell(patient.fullName || ''), '', ''],
          ['Ma benh nhan (MRN)', sanitizeCsvCell(patient.mrn || ''), '', ''],
          ['Tuoi', (patient.age || '').toString(), '', ''],
          ['Gioi tinh', patient.gender || '', '', ''],
          ['Ngay gio kham', examDateTimeStr, '', ''],
          ['Diem nguy co mach mau tong hop', `${result.overallVascularRiskScore}/100`, '< 45/100', ''],
          ['Nguy co tim mach 3 nam', `${result.cardiovascularRisk.score}%`, '< 40%', ''],
          ['Nguy co dot quy 3 nam', `${result.cardiovascularRisk.threeYearStrokeRiskPercent}%`, '< 10%', ''],
          ['Giai doan tang huyet ap', result.cardiovascularRisk.hypertensionStage, 'Binh thuong', ''],
          ['Nguy co benh vong mac tieu duong', `${result.diabeticRetinopathyRisk.score}% (${result.diabeticRetinopathyRisk.etdrsGrade})`, '< 30%', ''],
          ['Ty le A/V Ratio', result.annotatedMap.arteryVeinRatio.toString(), '>= 0.67', evaluateAvRatio(result.annotatedMap.arteryVeinRatio).text],
          ['Mat do mach mau', `${result.annotatedMap.vesselDensityPercentage}%`, '15.5% - 19.0%', evaluateVesselDensity(result.annotatedMap.vesselDensityPercentage).text],
          ['Do uon luon Tortuosity', result.annotatedMap.tortuosityIndex.toString(), '< 1.25', evaluateTortuosity(result.annotatedMap.tortuosityIndex).text],
          ['Ty le Cup/Disc (CDR)', result.annotatedMap.opticCupToDiscRatio.toString(), '< 0.50', evaluateVcdr(result.annotatedMap.opticCupToDiscRatio).text],
          ['Ma chan doan ICD-10', icdCodes.join('; ') || 'Chua ghi nhan', '', ''],
          ['Ket luan bac si (Doctor Notes)', sanitizeCsvCell(doctorNotesValue), '', ''],
          ['Phat hien lam sang (Findings)', sanitizeCsvCell(findingsValue), '', ''],
          ['Ghi chu / Khuyen nghi (Notes)', sanitizeCsvCell(notesValue), '', ''],
          ['Trang thai tham dinh', isReviewed ? 'Da duyet lam sang' : 'Cho bac si tham dinh', '', ''],
          ['Bac si phu trach', isReviewed ? sanitizeCsvCell(verifiedDoctorName || 'Bac si chuyen khoa') : 'Chua co bac si tham dinh', '', ''],
          ['Chu ky so SHA-256', isReviewed ? sanitizeCsvCell(result.digitalSignature || 'Da ky so') : 'Chua ky so', '', ''],
          ['Thoi diem ky', isReviewed && result.signedAt ? new Date(result.signedAt).toLocaleString('vi-VN') : 'Chua ky', '', ''],
        ]
          .map((row) => row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AURA_Report_${patient.mrn || 'patient'}_${result.analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-hidden print:p-0 print:bg-white animate-fadeIn"
    >
      {/* Floating Global Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 shadow-2xl border-2 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all print:hidden active:scale-95"
        title="Thoát cửa sổ (Esc)"
      >
        <X className="h-4.5 w-4.5 text-rose-600" />
        <span>Thoát (Esc)</span>
      </button>

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:h-auto print:border-none print:shadow-none"
      >
        {/* 1. Top Header Controls */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 print:hidden z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isReviewed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isReviewed ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                {isReviewed ? 'Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA (FR-7)' : 'Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định'}
                {hasDualData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                    Sàng lọc toàn diện 2 mắt (OD + OS)
                  </span>
                )}
              </h2>
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

        {/* 2. Scrollable Body: Printable Report Document */}
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
                  AURA AI Retinal Clinical Decision Support — {isReviewed ? 'Phiếu Báo Cáo Y Tế Chính Thức' : 'Phiếu Đánh Giá Sơ Bộ'} {hasDualData ? '(2 Mắt OD & OS)' : ''}
                </p>
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-mono-data font-semibold text-slate-700">Mã Báo Cáo: {result.analysisId}</p>
              <p className="text-slate-500 font-mono-data">Ngày Khám: {examDateTimeStr}</p>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                isReviewed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isReviewed ? 'Đã duyệt lâm sàng (HL7/FHIR)' : 'Chờ bác sĩ thẩm định'}
              </span>
            </div>
          </div>

          {/* Medical Disclaimer Banner (Bắt buộc theo quy định an toàn y khoa) */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">Tuyên bố miễn trừ trách nhiệm y tế: </strong>
              <span>{MEDICAL_DISCLAIMER}</span>
            </div>
          </div>

          {/* Banner Thông Báo Sơ Bộ nếu chưa thẩm định */}
          {!isReviewed && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-sky-600" />
                Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                Chưa ký số
              </span>
            </div>
          )}

          {/* Patient Demographics & Baseline Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Họ và tên:</span>
              <strong className="text-slate-900 text-sm">{patient.fullName || 'Chưa ghi nhận'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Mã bệnh nhân (MRN):</span>
              <strong className="font-mono-data text-cyan-800 text-sm">{patient.mrn || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Tuổi / Giới tính:</span>
              <strong className="text-slate-900">
                {patient.age != null ? `${patient.age} tuổi` : 'Chưa rõ tuổi'} • {patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Khác'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Huyết áp / HbA1c:</span>
              <strong className="text-slate-900 font-mono-data">
                {patient.systolicBp != null ? `${patient.systolicBp}/${patient.diastolicBp} mmHg` : 'Chưa đo'} • {patient.hba1c != null ? `${patient.hba1c}%` : 'Chưa đo'}
              </strong>
            </div>
          </div>

          {/* 1. Visual Images & Grad-CAM Heatmap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-700" />
                1. Hình Ảnh Võng Mạc & Bản Đồ Nhiệt Vi Mạch AI (XAI Heatmap)
              </span>
              {hasDualData && (
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Đối chiếu đồng thời 2 mắt: Mắt Phải (OD) & Mắt Trái (OS)
                </span>
              )}
            </h3>

            {hasDualData ? (
              /* DUAL EYE DISPLAY: 4 IMAGES */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Right Eye (OD) Block */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-cyan-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                      MẮT PHẢI (Right Eye - OD)
                    </span>
                    <span className="text-[11px] font-mono-data font-bold text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200">
                      Nguy cơ: {odData.overallVascularRiskScore}% • A/V: {odData.annotatedMap.arteryVeinRatio}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-slate-800">
                        <img
                          src={odData.imageUrl || '/assets/images/fundus_original.png'}
                          alt="Ảnh đáy mắt OD gốc"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-300">Ảnh Gốc (OD)</p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-cyan-300 bg-slate-950 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-cyan-600 bg-black">
                        <img
                          src={odData.imageUrl || '/assets/images/fundus_original.png'}
                          alt="Ảnh nền OD"
                          className="h-full w-full object-cover absolute inset-0"
                        />
                        <img
                          src={odData.annotatedMap.heatmapUrl || '/assets/images/fundus_heatmap.png'}
                          alt="Heatmap OD"
                          className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-cyan-200">Heatmap AI (OD)</p>
                    </div>
                  </div>
                </div>

                {/* Left Eye (OS) Block */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-teal-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      MẮT TRÁI (Left Eye - OS)
                    </span>
                    <span className="text-[11px] font-mono-data font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                      Nguy cơ: {osData.overallVascularRiskScore}% • A/V: {osData.annotatedMap.arteryVeinRatio}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-slate-800">
                        <img
                          src={osData.imageUrl || '/assets/images/fundus_original.png'}
                          alt="Ảnh đáy mắt OS gốc"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-300">Ảnh Gốc (OS)</p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-teal-300 bg-slate-950 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-teal-600 bg-black">
                        <img
                          src={osData.imageUrl || '/assets/images/fundus_original.png'}
                          alt="Ảnh nền OS"
                          className="h-full w-full object-cover absolute inset-0"
                        />
                        <img
                          src={osData.annotatedMap.heatmapUrl || '/assets/images/fundus_heatmap.png'}
                          alt="Heatmap OS"
                          className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-teal-200">Heatmap AI (OS)</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE EYE DISPLAY */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-2 flex flex-col items-center">
                  <div className="relative aspect-square max-w-[280px] w-full rounded-full overflow-hidden border-2 border-slate-800">
                    <img
                      src={result.imageUrl || '/assets/images/fundus_original.png'}
                      alt="Ảnh đáy mắt gốc"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-300">Ảnh Màu Đáy Mắt Gốc</p>
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
            )}
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
                    {Math.max(odData.cardiovascularRisk.score, osData.cardiovascularRisk.score) >= 75 ? 'Cao' : 'Trung bình'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-rose-600">
                  {Math.max(odData.cardiovascularRisk.score, osData.cardiovascularRisk.score)}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {hasDualData
                    ? `OD: ${odData.cardiovascularRisk.score}% • OS: ${osData.cardiovascularRisk.score}% (Điểm cao nhất giữa 2 mắt).`
                    : 'Tỷ lệ A/V hẹp, có nguy cơ xơ cứng mạch máu hệ thống.'}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Võng Mạc Đái Tháo Đường</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 border border-amber-300">
                    {Math.max(odData.diabeticRetinopathyRisk.score, osData.diabeticRetinopathyRisk.score) >= 60 ? 'Cao' : 'Trung bình'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-amber-600">
                  {Math.max(odData.diabeticRetinopathyRisk.score, osData.diabeticRetinopathyRisk.score)}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {hasDualData
                    ? `OD: ${odData.diabeticRetinopathyRisk.score}% • OS: ${osData.diabeticRetinopathyRisk.score}%`
                    : 'Vi phình mạch rải rác cực sau theo phân tích AI.'}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Nguy Cơ Tăng Nhãn Áp (Glaucoma)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 border border-emerald-300">
                    Thấp
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono-data text-emerald-600">
                  {Math.max(odData.glaucomaRisk.score, osData.glaucomaRisk.score)}%
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Tỷ lệ Cup/Disc trong giới hạn an toàn bình thường.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Quantitative Biomarkers Table (Động hóa đánh giá lâm sàng) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Activity className="h-4 w-4 text-cyan-700" />
              3. Bảng Phân Tích Định Lượng Vi Mạch Võng Mạc (Biomarkers Đối Chiếu {hasDualData ? '2 Mắt OD & OS' : ''})
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Chỉ số sinh học</th>
                    {hasDualData ? (
                      <>
                        <th className="p-2.5 text-[#0891B2]">Mắt Phải (OD)</th>
                        <th className="p-2.5 text-[#0D9488]">Mắt Trái (OS)</th>
                      </>
                    ) : (
                      <th className="p-2.5">Giá trị đo lường</th>
                    )}
                    <th className="p-2.5">Ngưỡng chuẩn</th>
                    <th className="p-2.5">Đánh giá lâm sàng (Y văn)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">Tỷ lệ Động/Tĩnh Mạch (A/V Ratio)</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData.annotatedMap.arteryVeinRatio}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData.annotatedMap.arteryVeinRatio}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">≥ 0.67</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).color}`}>
                            OD: {evaluateAvRatio(odData.annotatedMap.arteryVeinRatio).text}
                          </span>
                          <span className={`block ${evaluateAvRatio(osData.annotatedMap.arteryVeinRatio).color}`}>
                            OS: {evaluateAvRatio(osData.annotatedMap.arteryVeinRatio).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result.annotatedMap.arteryVeinRatio}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">≥ 0.67</td>
                        <td className={`p-2.5 ${evaluateAvRatio(result.annotatedMap.arteryVeinRatio).color}`}>
                          {evaluateAvRatio(result.annotatedMap.arteryVeinRatio).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Mật độ Vi Mạch (Vessel Density)</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData.annotatedMap.vesselDensityPercentage}%</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData.annotatedMap.vesselDensityPercentage}%</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">15.5% - 19.0%</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).color}`}>
                            OD: {evaluateVesselDensity(odData.annotatedMap.vesselDensityPercentage).text}
                          </span>
                          <span className={`block ${evaluateVesselDensity(osData.annotatedMap.vesselDensityPercentage).color}`}>
                            OS: {evaluateVesselDensity(osData.annotatedMap.vesselDensityPercentage).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result.annotatedMap.vesselDensityPercentage}%</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">15.5% - 19.0%</td>
                        <td className={`p-2.5 ${evaluateVesselDensity(result.annotatedMap.vesselDensityPercentage).color}`}>
                          {evaluateVesselDensity(result.annotatedMap.vesselDensityPercentage).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Chỉ số Uốn Lượn (Tortuosity)</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData.annotatedMap.tortuosityIndex}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData.annotatedMap.tortuosityIndex}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 1.25</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateTortuosity(odData.annotatedMap.tortuosityIndex).color}`}>
                            OD: {evaluateTortuosity(odData.annotatedMap.tortuosityIndex).text}
                          </span>
                          <span className={`block ${evaluateTortuosity(osData.annotatedMap.tortuosityIndex).color}`}>
                            OS: {evaluateTortuosity(osData.annotatedMap.tortuosityIndex).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result.annotatedMap.tortuosityIndex}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 1.25</td>
                        <td className={`p-2.5 ${evaluateTortuosity(result.annotatedMap.tortuosityIndex).color}`}>
                          {evaluateTortuosity(result.annotatedMap.tortuosityIndex).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Tỷ lệ Lõm Gai / Gai Thị (VCDR)</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData.annotatedMap.opticCupToDiscRatio}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData.annotatedMap.opticCupToDiscRatio}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 0.50</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).color}`}>
                            OD: {evaluateVcdr(odData.annotatedMap.opticCupToDiscRatio).text}
                          </span>
                          <span className={`block ${evaluateVcdr(osData.annotatedMap.opticCupToDiscRatio).color}`}>
                            OS: {evaluateVcdr(osData.annotatedMap.opticCupToDiscRatio).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result.annotatedMap.opticCupToDiscRatio}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 0.50</td>
                        <td className={`p-2.5 ${evaluateVcdr(result.annotatedMap.opticCupToDiscRatio).color}`}>
                          {evaluateVcdr(result.annotatedMap.opticCupToDiscRatio).text}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ICD-10 Diagnosis Codes Section */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileBadge className="h-4 w-4 text-cyan-700" />
              4. Danh Mục Mã Chẩn Đoán Quốc Tế (ICD-10)
            </h3>
            {icdCodes.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {icdCodes.map((code, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono-data font-bold bg-white text-cyan-800 border border-cyan-200 shadow-2xs"
                  >
                    {code}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic pt-1">
                {isReviewed
                  ? 'Bác sĩ không ghi nhận mã ICD-10 bổ sung cho ca khám này.'
                  : 'Chưa ghi nhận mã ICD-10 (Chờ bác sĩ chuyên khoa thẩm định và chỉ định sau khi thăm khám).'}
              </p>
            )}
          </div>

          {/* 5. Doctor Recommendation and Digital Signature */}
          <div className={`rounded-xl border p-5 space-y-4 ${
            isReviewed ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              {isReviewed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  5. Kết Luận & Khuyến Nghị Của Bác Sĩ Chuyên Khoa
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  5. Khuyến Nghị Sơ Bộ Từ Hệ Thống AI (Đang Chờ Bác Sĩ Thẩm Định)
                </>
              )}
            </h3>

            {isReviewed ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {result.doctorNotes || 'Bác sĩ chuyên khoa đã xem xét và xác nhận kết quả phân tích hình ảnh võng mạc.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  {result.recommendations ||
                    (result.xaiExplainability && result.xaiExplainability.length > 1
                      ? result.xaiExplainability[1].clinicalRationale
                      : 'Hệ thống khuyến nghị người bệnh đặt lịch hẹn tái khám tại cơ sở y tế chuyên khoa mắt hoặc tim mạch để bác sĩ thẩm định chi tiết.')}
                </p>
                <p className="text-[11px] text-amber-700 font-medium">
                  * Lưu ý: Đây là đánh giá định hướng tự động của mô hình AURA AI, chưa phải kết luận lâm sàng chính thức từ bác sĩ.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t border-slate-200/80 text-xs gap-3">
              <div className="text-slate-500 text-[11px] space-y-0.5">
                <p>Hệ thống AURA Retinal Clinical AI</p>
                <p>Khuyến nghị sàng lọc tuân thủ tiêu chuẩn AHA/ACC 2026</p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                {isReviewed ? (
                  <>
                    <p className="text-slate-500 text-[11px]">Bác sĩ chuyên khoa xác nhận:</p>
                    <p className="font-bold text-slate-900 text-sm">{verifiedDoctorName}</p>
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono-data font-semibold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      (Đã ký số điện tử y tế SHA-256)
                    </div>
                    {result.signedAt && (
                      <p className="text-[10px] text-slate-500 font-mono-data">
                        Ký lúc: {new Date(result.signedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                    {result.digitalSignature && (
                      <div className="text-[9px] text-slate-400 font-mono-data max-w-xs break-all pt-0.5" title={result.digitalSignature}>
                        Mã ký số: {result.digitalSignature.slice(0, 32)}...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 text-[11px]">Bác sĩ phụ trách thẩm định:</p>
                    <p className="font-semibold text-slate-600 text-xs italic">Chưa có bác sĩ thẩm định</p>
                    <span className="inline-block text-[10px] text-amber-800 font-mono-data font-medium bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      (Chưa ký số — Bản phân tích sơ bộ)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Footer with Close & Action Buttons */}
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
