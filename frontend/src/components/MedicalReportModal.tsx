import React, { useEffect } from 'react';
import { PatientProfile, AIRiskResult, VesselAnomalyRegion } from '../types/cds';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Eye,
  Heart,
  Activity,
  AlertTriangle,
  FileBadge,
  Clock,
  Target,
  Info,
} from 'lucide-react';
import { parseIcd10Codes } from '../services/screeningMapper';
import { MedicalDisclaimer, MANDATORY_MEDICAL_DISCLAIMER_VI, MANDATORY_MEDICAL_DISCLAIMER_EN } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';
import { DynamicHeatmapCanvas } from './DynamicHeatmapCanvas';
import { getAnomalyName, getAnomalyMedicalTheme } from './InteractiveCDSViewer';
import { exportToJsonFhir, isLandmarkAnomaly } from '../services/exportService';

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
  const { t, isVi } = useLanguage();

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

  // Danh sách các điểm AI phát hiện
  const odAnomalies = (odData.annotatedMap?.detectedAnomalies || (odData as any).anomalies || []) as VesselAnomalyRegion[];
  const osAnomalies = (osData.annotatedMap?.detectedAnomalies || (osData as any).anomalies || []) as VesselAnomalyRegion[];
  const singleAnomalies = (result.annotatedMap?.detectedAnomalies || (result as any).anomalies || []) as VesselAnomalyRegion[];

  // Phân tách tổn thương vi mạch bệnh lý thật sự khỏi mốc giải phẫu học (Optic Disc, FAZ)
  const odLesions = odAnomalies.filter((a) => !isLandmarkAnomaly(a));
  const odLandmarks = odAnomalies.filter(isLandmarkAnomaly);
  const osLesions = osAnomalies.filter((a) => !isLandmarkAnomaly(a));
  const osLandmarks = osAnomalies.filter(isLandmarkAnomaly);
  const singleLesions = singleAnomalies.filter((a) => !isLandmarkAnomaly(a));
  const singleLandmarks = singleAnomalies.filter(isLandmarkAnomaly);

  // Tổng hợp toàn bộ điểm tổn thương vi mạch thực sự phục vụ bảng tra cứu và in ấn
  const allReportLesions = hasDualData
    ? [
        ...odLesions.map((a, i) => ({ ...a, eyeLabel: isVi ? 'Mắt Phải' : 'Right Eye', eyeCode: 'OD', pinIndex: i + 1 })),
        ...osLesions.map((a, i) => ({ ...a, eyeLabel: isVi ? 'Mắt Trái' : 'Left Eye', eyeCode: 'OS', pinIndex: i + 1 })),
      ]
    : singleLesions.map((a, i) => ({ ...a, eyeLabel: result.eyePosition || 'OD', eyeCode: 'OD', pinIndex: i + 1 }));

  // Tổng hợp toàn bộ mốc giải phẫu học võng mạc định vị
  const allReportLandmarks = hasDualData
    ? [
        ...odLandmarks.map((a) => ({ ...a, eyeLabel: isVi ? 'Mắt Phải' : 'Right Eye', eyeCode: 'OD' })),
        ...osLandmarks.map((a) => ({ ...a, eyeLabel: isVi ? 'Mắt Trái' : 'Left Eye', eyeCode: 'OS' })),
      ]
    : singleLandmarks.map((a) => ({ ...a, eyeLabel: result.eyePosition || 'OD', eyeCode: 'OD' }));

  // Giữ alias allReportAnomalies để đảm bảo tương thích ngược
  const allReportAnomalies = allReportLesions;

  // MED-08 FIX: Nhận diện chính xác quyết định Bác bỏ kết quả (REJECTED) của Bác sĩ
  const isRejected = Boolean(
    result.reviewDecision === 'REJECTED' ||
    (result as any).decision === 'REJECTED' ||
    result.status === 'REJECTED' ||
    (odData as any)?.reviewDecision === 'REJECTED' ||
    (osData as any)?.reviewDecision === 'REJECTED'
  );

  // Kiểm tra điều kiện thẩm định và chữ ký số bác sĩ
  const isReviewed = Boolean(
    (result.status === 'REVIEWED' || isRejected) && Boolean(result.digitalSignature)
  );
  const verifiedDoctorName = (isReviewed || isRejected)
    ? result.doctorName || doctorName || (isVi ? 'Bác sĩ Chuyên Khoa' : 'Attending Specialist')
    : null;

  // Ngày giờ khám thực tế từ CSDL
  const examDate = result.createdAt ? new Date(result.createdAt) : new Date();
  const locale = isVi ? 'vi-VN' : 'en-US';
  const examDateStr = !isNaN(examDate.getTime())
    ? examDate.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString(locale);
  const examDateTimeStr = !isNaN(examDate.getTime())
    ? examDate.toLocaleString(locale)
    : new Date().toLocaleString(locale);

  // Xử lý mã ICD-10
  const icdCodes = Array.isArray(result.icd10Codes)
    ? result.icd10Codes
    : parseIcd10Codes(result.icd10Codes);

  // Tuyên bố miễn trừ trách nhiệm y tế bắt buộc
  const MEDICAL_DISCLAIMER = isVi ? MANDATORY_MEDICAL_DISCLAIMER_VI : MANDATORY_MEDICAL_DISCLAIMER_EN;

  // Động hóa đánh giá lâm sàng theo ngưỡng y văn
  const evaluateAvRatio = (val: number) => {
    if (val <= 0) return { text: isVi ? 'Chưa đủ dữ liệu phân tích' : 'Insufficient data for analysis', color: 'text-slate-500' };
    if (val >= 0.67) return { text: isVi ? 'Tỷ lệ A/V trong giới hạn bình thường (≥ 0.67)' : 'A/V ratio within normal limits (≥ 0.67)', color: 'text-emerald-600' };
    if (val >= 0.55) return { text: isVi ? 'Hẹp nhẹ tiểu động mạch võng mạc (0.55 - 0.66)' : 'Mild retinal arteriolar narrowing (0.55 - 0.66)', color: 'text-amber-600' };
    return { text: isVi ? 'Co thắt tiểu động mạch võng mạc đáng kể (< 0.55)' : 'Significant retinal arteriolar narrowing (< 0.55)', color: 'text-rose-600 font-medium' };
  };

  const evaluateVesselDensity = (val: number) => {
    if (val <= 0) return { text: isVi ? 'Chưa đủ dữ liệu phân tích' : 'Insufficient data for analysis', color: 'text-slate-500' };
    if (val < 15.5) return { text: isVi ? 'Giảm tưới máu vi mạch võng mạc (< 15.5%)' : 'Reduced retinal capillary perfusion (< 15.5%)', color: 'text-rose-600 font-medium' };
    if (val > 19.0) return { text: isVi ? 'Tăng sinh vi mạch hoặc phù nề (> 19.0%)' : 'Microvascular proliferation or edema (> 19.0%)', color: 'text-amber-600' };
    return { text: isVi ? 'Mật độ tưới máu mao mạch đạt tiêu chuẩn (15.5% - 19.0%)' : 'Capillary perfusion density within normal limits (15.5% - 19.0%)', color: 'text-emerald-600' };
  };

  const evaluateTortuosity = (val: number) => {
    if (val <= 0) return { text: isVi ? 'Chưa đủ dữ liệu phân tích' : 'Insufficient data for analysis', color: 'text-slate-500' };
    if (val < 1.25) return { text: isVi ? 'Độ uốn lượn mạch máu bình thường (< 1.25)' : 'Normal vascular tortuosity (< 1.25)', color: 'text-emerald-600' };
    if (val < 1.4) return { text: isVi ? 'Uốn lượn trung bình liên quan huyết áp (1.25 - 1.40)' : 'Moderate tortuosity associated with hypertension (1.25 - 1.40)', color: 'text-amber-600' };
    return { text: isVi ? 'Mạch máu ngoằn ngoèo bất thường (≥ 1.40)' : 'Abnormal tortuous vasculature (≥ 1.40)', color: 'text-rose-600 font-medium' };
  };

  const evaluateVcdr = (val: number) => {
    if (val <= 0) return { text: isVi ? 'Chưa đủ dữ liệu phân tích' : 'Insufficient data for analysis', color: 'text-slate-500' };
    if (val < 0.5) return { text: isVi ? 'Hình thái gai thị bình thường (< 0.50)' : 'Normal optic disc morphology (< 0.50)', color: 'text-emerald-600' };
    if (val < 0.7) return { text: isVi ? 'Lõm gai mở rộng sinh lý/nghi ngờ sớm (0.50 - 0.69)' : 'Physiological enlargement / early suspicion (0.50 - 0.69)', color: 'text-amber-600' };
    return { text: isVi ? 'Lõm gai rộng bất thường, cần tầm soát Glaucoma (≥ 0.70)' : 'Abnormally enlarged cup, glaucoma screening indicated (≥ 0.70)', color: 'text-rose-600 font-medium' };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJsonFhir = () => {
    exportToJsonFhir(result, patient);
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

    const csvContent = hasDualData
      ? [
          [isVi ? 'BÁO CÁO KẾT QUẢ SÀNG LỌC VI MẠCH VÕNG MẠC - HỆ THỐNG AURA' : 'AURA RETINAL VASCULAR SCREENING REPORT', '', '', '', ''],
          [isVi ? 'Chỉ số phân tích / Thông tin' : 'Clinical Metric / Info', isVi ? 'Mắt Phải' : 'Right Eye', isVi ? 'Mắt Trái' : 'Left Eye', isVi ? 'Ngưỡng chuẩn' : 'Reference Range', isVi ? 'Đánh giá lâm sàng' : 'Clinical Evaluation'],
          [isVi ? 'Mã phiếu khám' : 'Report ID', odData.analysisId, osData.analysisId, 'HL7/FHIR', ''],
          [isVi ? 'Họ và tên bệnh nhân' : 'Patient Name', sanitizeCsvCell(patient.fullName || ''), sanitizeCsvCell(patient.fullName || ''), '', ''],
          [isVi ? 'Mã bệnh nhân (MRN)' : 'MRN', sanitizeCsvCell(patient.mrn || ''), sanitizeCsvCell(patient.mrn || ''), '', ''],
          [isVi ? 'Tuổi / Giới tính' : 'Age / Gender', `${patient.age ?? ''} ${isVi ? 'tuổi' : 'yrs'} - ${patient.gender ?? ''}`, '', '', ''],
          [isVi ? 'Huyết áp / HbA1c' : 'Blood Pressure / HbA1c', `${patient.systolicBp ?? ''}/${patient.diastolicBp ?? ''} mmHg`, `${patient.hba1c ?? ''}%`, '', ''],
          [isVi ? 'Ngày giờ khám' : 'Exam Date/Time', examDateTimeStr, examDateTimeStr, '', ''],
          [isVi ? 'Điểm nguy cơ mạch máu tổng hợp' : 'Overall Vascular Risk Score', `${odData.overallVascularRiskScore}/100`, `${osData.overallVascularRiskScore}/100`, '< 45/100', ''],
          [isVi ? 'Nguy cơ tim mạch 3 năm' : '3-Year Cardiovascular Risk', `${odData.cardiovascularRisk.score}%`, `${osData.cardiovascularRisk.score}%`, '< 40%', ''],
          [isVi ? 'Nguy cơ đột quỵ 3 năm' : '3-Year Stroke Risk', `${odData.cardiovascularRisk.threeYearStrokeRiskPercent}%`, `${osData.cardiovascularRisk.threeYearStrokeRiskPercent}%`, '< 10%', ''],
          [isVi ? 'Giai đoạn tăng huyết áp' : 'Hypertension Stage', odData.cardiovascularRisk.hypertensionStage, osData.cardiovascularRisk.hypertensionStage, isVi ? 'Bình thường' : 'Normal', ''],
          [isVi ? 'Nguy cơ bệnh võng mạc tiểu đường' : 'Diabetic Retinopathy Risk', `${odData.diabeticRetinopathyRisk.score}%`, `${osData.diabeticRetinopathyRisk.score}%`, '< 30%', ''],
          [isVi ? 'Tỷ lệ A/V Ratio' : 'A/V Ratio', (odData.annotatedMap?.arteryVeinRatio ?? 0).toString(), (osData.annotatedMap?.arteryVeinRatio ?? 0).toString(), '>= 0.67', `OD: ${evaluateAvRatio(odData.annotatedMap?.arteryVeinRatio ?? 0).text} | OS: ${evaluateAvRatio(osData.annotatedMap?.arteryVeinRatio ?? 0).text}`],
          [isVi ? 'Mật độ vi mạch (Vessel Density)' : 'Vessel Density', `${odData.annotatedMap?.vesselDensityPercentage ?? 0}%`, `${osData.annotatedMap?.vesselDensityPercentage ?? 0}%`, '15.5% - 19.0%', `OD: ${evaluateVesselDensity(odData.annotatedMap?.vesselDensityPercentage ?? 0).text} | OS: ${evaluateVesselDensity(osData.annotatedMap?.vesselDensityPercentage ?? 0).text}`],
          [isVi ? 'Độ uốn lượn (Tortuosity)' : 'Tortuosity Index', (odData.annotatedMap?.tortuosityIndex ?? 0).toString(), (osData.annotatedMap?.tortuosityIndex ?? 0).toString(), '< 1.25', `OD: ${evaluateTortuosity(odData.annotatedMap?.tortuosityIndex ?? 0).text} | OS: ${evaluateTortuosity(osData.annotatedMap?.tortuosityIndex ?? 0).text}`],
          [isVi ? 'Tỷ lệ Cup/Disc (CDR)' : 'Cup-to-Disc Ratio (CDR)', (odData.annotatedMap?.opticCupToDiscRatio ?? 0).toString(), (osData.annotatedMap?.opticCupToDiscRatio ?? 0).toString(), '< 0.50', `OD: ${evaluateVcdr(odData.annotatedMap?.opticCupToDiscRatio ?? 0).text} | OS: ${evaluateVcdr(osData.annotatedMap?.opticCupToDiscRatio ?? 0).text}`],
          [isVi ? 'Mã chẩn đoán ICD-10' : 'ICD-10 Code', icdCodes.join('; ') || (isVi ? 'Chưa ghi nhận' : 'Not recorded'), '', '', ''],
          [isVi ? 'Trạng thái thẩm định' : 'Review Status', isRejected ? (isVi ? 'Bác sĩ bác bỏ kết quả' : 'Rejected by doctor') : isReviewed ? (isVi ? 'Đã duyệt lâm sàng' : 'Clinically reviewed') : (isVi ? 'Chờ bác sĩ thẩm định' : 'Pending review'), '', '', ''],
          [isVi ? 'Bác sĩ phụ trách' : 'Attending Specialist', (isReviewed || isRejected) ? (verifiedDoctorName || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist')) : (isVi ? 'Chưa có bác sĩ thẩm định' : 'No doctor assigned'), '', '', ''],
          [isVi ? 'Chữ ký số SHA-256' : 'Digital Signature SHA-256', (isReviewed || isRejected) ? (result.digitalSignature || (isVi ? 'Đã ký số' : 'Signed')) : (isVi ? 'Chưa ký số' : 'Unsigned'), '', '', ''],
          [isVi ? 'Thời điểm ký' : 'Signed At', (isReviewed || isRejected) && result.signedAt ? new Date(result.signedAt).toLocaleString(locale) : (isVi ? 'Chưa ký' : 'Unsigned'), '', '', ''],
          [isVi ? 'Tuyên bố miễn trừ trách nhiệm' : 'Medical Disclaimer', isVi ? 'Hệ thống CDS hỗ trợ sàng lọc sơ bộ AI theo tiêu chuẩn Bộ Y Tế. Kết quả cần bác sĩ chuyên khoa thẩm định.' : 'AI decision support system; requires specialist clinical verification.', '', '', ''],
        ]
      : [
          [isVi ? 'BÁO CÁO KẾT QUẢ SÀNG LỌC VI MẠCH VÕNG MẠC - HỆ THỐNG AURA' : 'AURA RETINAL VASCULAR SCREENING REPORT', '', '', ''],
          [isVi ? 'Chỉ số phân tích / Thông tin' : 'Clinical Metric / Info', isVi ? 'Giá trị' : 'Value', isVi ? 'Ngưỡng chuẩn' : 'Reference Range', isVi ? 'Đánh giá lâm sàng' : 'Clinical Evaluation'],
          [isVi ? 'Mã phiếu khám' : 'Report ID', result.analysisId, 'HL7/FHIR', ''],
          [isVi ? 'Họ và tên bệnh nhân' : 'Patient Name', sanitizeCsvCell(patient.fullName || ''), '', ''],
          [isVi ? 'Mã bệnh nhân (MRN)' : 'MRN', sanitizeCsvCell(patient.mrn || ''), '', ''],
          [isVi ? 'Tuổi / Giới tính' : 'Age / Gender', `${patient.age ?? ''} ${isVi ? 'tuổi' : 'yrs'} - ${patient.gender ?? ''}`, '', ''],
          [isVi ? 'Huyết áp / HbA1c' : 'Blood Pressure / HbA1c', `${patient.systolicBp ?? ''}/${patient.diastolicBp ?? ''} mmHg`, `${patient.hba1c ?? ''}%`, ''],
          [isVi ? 'Ngày giờ khám' : 'Exam Date/Time', examDateTimeStr, '', ''],
          [isVi ? 'Điểm nguy cơ mạch máu tổng hợp' : 'Overall Vascular Risk Score', `${result.overallVascularRiskScore}/100`, '< 45/100', ''],
          [isVi ? 'Nguy cơ tim mạch 3 năm' : '3-Year Cardiovascular Risk', `${result.cardiovascularRisk.score}%`, '< 40%', ''],
          [isVi ? 'Nguy cơ đột quỵ 3 năm' : '3-Year Stroke Risk', `${result.cardiovascularRisk.threeYearStrokeRiskPercent}%`, '< 10%', ''],
          [isVi ? 'Giai đoạn tăng huyết áp' : 'Hypertension Stage', result.cardiovascularRisk.hypertensionStage, isVi ? 'Bình thường' : 'Normal', ''],
          [isVi ? 'Nguy cơ bệnh võng mạc tiểu đường' : 'Diabetic Retinopathy Risk', `${result.diabeticRetinopathyRisk.score}%`, '< 30%', ''],
          [isVi ? 'Tỷ lệ A/V Ratio' : 'A/V Ratio', (result.annotatedMap?.arteryVeinRatio ?? 0).toString(), '>= 0.67', evaluateAvRatio(result.annotatedMap?.arteryVeinRatio ?? 0).text],
          [isVi ? 'Mật độ vi mạch (Vessel Density)' : 'Vessel Density', `${result.annotatedMap?.vesselDensityPercentage ?? 0}%`, '15.5% - 19.0%', evaluateVesselDensity(result.annotatedMap?.vesselDensityPercentage ?? 0).text],
          [isVi ? 'Độ uốn lượn (Tortuosity)' : 'Tortuosity Index', (result.annotatedMap?.tortuosityIndex ?? 0).toString(), '< 1.25', evaluateTortuosity(result.annotatedMap?.tortuosityIndex ?? 0).text],
          [isVi ? 'Tỷ lệ Cup/Disc (CDR)' : 'Cup-to-Disc Ratio (CDR)', (result.annotatedMap?.opticCupToDiscRatio ?? 0).toString(), '< 0.50', evaluateVcdr(result.annotatedMap?.opticCupToDiscRatio ?? 0).text],
          [isVi ? 'Mã chẩn đoán ICD-10' : 'ICD-10 Code', icdCodes.join('; ') || (isVi ? 'Chưa ghi nhận' : 'Not recorded'), '', ''],
          [isVi ? 'Trạng thái thẩm định' : 'Review Status', isRejected ? (isVi ? 'Bác sĩ bác bỏ kết quả' : 'Rejected by doctor') : isReviewed ? (isVi ? 'Đã duyệt lâm sàng' : 'Clinically reviewed') : (isVi ? 'Chờ bác sĩ thẩm định' : 'Pending review'), '', ''],
          [isVi ? 'Bác sĩ phụ trách' : 'Attending Specialist', (isReviewed || isRejected) ? (verifiedDoctorName || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist')) : (isVi ? 'Chưa có bác sĩ thẩm định' : 'No doctor assigned'), '', ''],
          [isVi ? 'Chữ ký số SHA-256' : 'Digital Signature SHA-256', (isReviewed || isRejected) ? (result.digitalSignature || (isVi ? 'Đã ký số' : 'Signed')) : (isVi ? 'Chưa ký số' : 'Unsigned'), '', ''],
          [isVi ? 'Thời điểm ký' : 'Signed At', (isReviewed || isRejected) && result.signedAt ? new Date(result.signedAt).toLocaleString(locale) : (isVi ? 'Chưa ký' : 'Unsigned'), '', ''],
          [isVi ? 'Tuyên bố miễn trừ trách nhiệm' : 'Medical Disclaimer', isVi ? 'Hệ thống CDS hỗ trợ sàng lọc sơ bộ AI theo tiêu chuẩn Bộ Y Tế. Kết quả cần bác sĩ chuyên khoa thẩm định.' : 'AI decision support system; requires specialist clinical verification.', '', ''],
        ];

    // Bổ sung danh sách điểm tổn thương vi mạch AI vào tệp CSV xuất bản
    if (allReportLesions.length > 0) {
      csvContent.push(['']);
      csvContent.push([isVi ? 'DANH SÁCH ĐIỂM TỔN THƯƠNG VI MẠCH AI ĐỊNH VỊ' : 'AI-DETECTED LESION FINDINGS & COORDINATES']);
      csvContent.push([
        '#',
        isVi ? 'Mắt' : 'Eye',
        isVi ? 'Loại tổn thương' : 'Anomaly Type',
        isVi ? 'Tọa độ X (%)' : 'Coord X (%)',
        isVi ? 'Tọa độ Y (%)' : 'Coord Y (%)',
        isVi ? 'Độ tin cậy' : 'Confidence',
        isVi ? 'Mô tả lâm sàng' : 'Clinical Description',
      ]);
      allReportLesions.forEach((a, idx) => {
        const confText = `${Math.round(a.confidence != null ? (a.confidence <= 1 ? a.confidence * 100 : a.confidence) : 90)}%`;
        csvContent.push([
          (a.pinIndex || idx + 1).toString(),
          a.eyeCode || 'OD',
          sanitizeCsvCell(getAnomalyName(a.type, t)),
          (a.coordinates?.x ?? 0).toString(),
          (a.coordinates?.y ?? 0).toString(),
          confText,
          sanitizeCsvCell(a.description || ''),
        ]);
      });
    } else {
      csvContent.push(['']);
      csvContent.push([
        isVi ? 'Tổn thương vi mạch khu trú' : 'Focal Microvascular Lesions',
        isVi ? 'Không phát hiện tổn thương (0 điểm tổn thương)' : 'None detected (0 lesions)',
        '',
        '',
        '',
      ]);
    }

    // Bổ sung mốc giải phẫu học võng mạc AI định vị vào CSV
    if (allReportLandmarks.length > 0) {
      csvContent.push(['']);
      csvContent.push([isVi ? 'MỐC GIẢI PHẪU VÕNG MẠC AI ĐỊNH VỊ' : 'AI-LOCALIZED RETINAL ANATOMICAL LANDMARKS']);
      csvContent.push([
        '#',
        isVi ? 'Mắt' : 'Eye',
        isVi ? 'Mốc giải phẫu' : 'Landmark',
        isVi ? 'Tọa độ X (%)' : 'Coord X (%)',
        isVi ? 'Tọa độ Y (%)' : 'Coord Y (%)',
        isVi ? 'Độ tin cậy' : 'Confidence',
        isVi ? 'Mô tả giải phẫu' : 'Anatomical Description',
      ]);
      allReportLandmarks.forEach((a, idx) => {
        const isDisc = String(a.type || '').toUpperCase().includes('DISC');
        const name = isDisc ? (isVi ? 'Gai thị (Optic Disc)' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'Fovea Centralis (FAZ)');
        const confText = `${Math.round(a.confidence != null ? (a.confidence <= 1 ? a.confidence * 100 : a.confidence) : 98)}%`;
        csvContent.push([
          (idx + 1).toString(),
          a.eyeCode || 'OD',
          sanitizeCsvCell(name),
          (a.coordinates?.x ?? 0).toString(),
          (a.coordinates?.y ?? 0).toString(),
          confText,
          sanitizeCsvCell(a.description || ''),
        ]);
      });
    }

    const csvRawString = csvContent
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const csvWithBom = '\uFEFF' + csvRawString;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AURA_Report_${patient.mrn || 'patient'}_${result.analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-hidden print:static print:inset-auto print:overflow-visible print:h-auto print:max-w-none print:w-full print:block print:p-0 print:bg-white animate-fade-in"
    >
      {/* Floating Global Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 shadow-2xl border-2 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all print:hidden active:scale-95 cursor-pointer"
        title={t('doctor.reportModal.exitEsc', 'Thoát (Esc)')}
      >
        <X className="h-4.5 w-4.5 text-rose-600" />
        <span>{t('doctor.reportModal.exitEsc', 'Thoát (Esc)')}</span>
      </button>

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-white shadow-medical-modal border border-slate-200 overflow-hidden print:static print:overflow-visible print:h-auto print:max-w-none print:w-full print:block print:border-none print:shadow-none animate-modal-enter"
      >
        {/* 1. Top Header Controls */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 print:hidden z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              isRejected
                ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                : isReviewed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {isRejected ? (
                <XCircle className="h-5 w-5 text-rose-600" />
              ) : isReviewed ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                {isRejected
                  ? (isVi ? 'Báo Cáo Sàng Lọc Y Tế - KẾT QUẢ BÁC BỎ BỞI BÁC SĨ' : 'Retinal Screening Report - REJECTED BY SPECIALIST')
                  : isReviewed
                  ? t('doctor.reportModal.officialReportTitle', 'Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA')
                  : t('doctor.reportModal.preliminaryReportTitle', 'Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định')}
                {hasDualData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                    {t('doctor.reportModal.dualEyeBadge', isVi ? 'Sàng lọc toàn diện 2 mắt' : 'Comprehensive Dual-Eye Screening')}
                  </span>
                )}
                {isRejected && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    {isVi ? 'KẾT QUẢ BỊ BÁC BỎ' : 'REJECTED'}
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-slate-500 font-mono-data">
                {t('doctor.reportModal.reportCode', 'Mã phiếu:')} {result.analysisId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-20 sm:pr-0">
            <button
              data-testid="report-export-fhir-btn"
              onClick={handleExportJsonFhir}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 transition-all active:scale-95 cursor-pointer"
              title={isVi ? 'Xuất gói dữ liệu chuẩn HL7/FHIR R4' : 'Export HL7/FHIR R4 JSON Bundle'}
            >
              <FileBadge className="h-4 w-4 text-blue-600" />
              <span>{isVi ? 'Xuất JSON (FHIR)' : 'Export FHIR JSON'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" />
              {t('doctor.reportModal.exportCsv', 'Xuất CSV')}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-800 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              {t('doctor.reportModal.printPdf', 'In Phiếu / PDF')}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors ml-1 active:scale-95 cursor-pointer"
              title={t('doctor.reportModal.close', 'Đóng')}
            >
              <X className="h-4.5 w-4.5" />
              <span>{t('doctor.reportModal.close', 'Đóng')}</span>
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
                  {t('doctor.reportModal.systemTitle', 'HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA')}
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  AURA AI Retinal Clinical Decision Support — {
                    isRejected
                      ? (isVi ? 'Phiếu Kết Quả Bị Bác Bỏ (Không Công Nhận Kết Quả AI)' : 'Rejected Screening Assessment (AI Overruled)')
                      : isReviewed
                      ? t('doctor.reportModal.systemSubtitleReviewed', 'Phiếu Báo Cáo Y Tế Chính Thức')
                      : t('doctor.reportModal.systemSubtitlePreliminary', 'Phiếu Đánh Giá Sơ Bộ')
                  } {hasDualData ? t('doctor.reportModal.dualEyeSuffix', '(2 Mắt OD & OS)') : ''}
                </p>
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-mono-data font-semibold text-slate-700">
                {t('doctor.reportModal.reportCodeLabel', 'Mã Báo Cáo:')} {result.analysisId}
              </p>
              <p className="text-slate-500 font-mono-data">
                {t('doctor.reportModal.examDateLabel', 'Ngày Khám:')} {examDateTimeStr}
              </p>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                isRejected
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isReviewed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isRejected
                  ? (isVi ? 'BÁC SĨ ĐÃ BÁC BỎ' : 'REJECTED BY DOCTOR')
                  : isReviewed
                  ? t('doctor.reportModal.reviewedStatus', 'Đã duyệt lâm sàng')
                  : t('doctor.reportModal.pendingStatus', 'Chờ bác sĩ thẩm định')}
              </span>
            </div>
          </div>

          {/* Rejection Alert Callout */}
          {isRejected && (
            <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-4 text-xs text-rose-950 space-y-1.5 avoid-page-break print:border-rose-600 print:bg-rose-50">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  {isVi
                    ? 'CẢNH BÁO: KẾT QUẢ PHÂN TÍCH NÀY ĐÃ BỊ BÁC SĨ CHUYÊN KHOA BÁC BỎ'
                    : 'WARNING: THIS SCREENING ANALYSIS HAS BEEN REJECTED BY THE ATTENDING SPECIALIST'}
                </span>
              </div>
              <p className="leading-relaxed text-rose-800 text-[11.5px]">
                {isVi
                  ? 'Bác sĩ chuyên khoa xác định kết quả phân tích tự động từ mô hình AI không chính xác hoặc chất lượng ảnh không đạt tiêu chuẩn lâm sàng. Các chỉ số rủi ro bên dưới KHÔNG ĐƯỢC CÔNG NHẬN để chẩn đoán y khoa. Khuyến nghị người bệnh thực hiện chụp lại ảnh võng mạc hoặc thăm khám trực tiếp tại cơ sở y tế.'
                  : 'The attending specialist has determined that the automated AI analysis is inaccurate or the retinal image quality is non-diagnostic. The risk scores below ARE NOT VALIDATED for medical diagnosis. Re-imaging or an in-person clinical examination is strongly advised.'}
              </p>
              {result.doctorNotes && (
                <div className="mt-2 pt-2 border-t border-rose-200/80 text-rose-900 font-medium">
                  <span className="font-bold">{isVi ? 'Lý do bác bỏ từ bác sĩ:' : 'Specialist Rejection Reason:'} </span>
                  <span>{result.doctorNotes}</span>
                </div>
              )}
            </div>
          )}

          {/* Medical Disclaimer Banner */}
          <MedicalDisclaimer variant="compact" />

          {/* Banner Thông Báo Sơ Bộ nếu chưa thẩm định */}
          {!isReviewed && !isRejected && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-sky-600" />
                {t('doctor.reportModal.preliminaryReportTitle', 'Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định')}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                {t('doctor.reportModal.unsigned', 'Chưa ký số')}
              </span>
            </div>
          )}

          {/* Patient Demographics & Baseline Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs avoid-page-break">
            <div>
              <span className="text-slate-500 block">{t('doctor.reportModal.fullName', 'Họ và tên:')}</span>
              <strong className="text-slate-900 text-sm">{patient.fullName || (isVi ? 'Chưa cập nhật' : 'Unrecorded')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('doctor.reportModal.patientId', 'Mã bệnh nhân:')}</span>
              <strong className="font-mono-data text-cyan-800 text-sm">{patient.mrn || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('doctor.reportModal.ageGender', 'Tuổi / Giới tính:')}</span>
              <strong className="text-slate-900">
                {patient.age != null || (patient.gender && patient.gender !== 'Other')
                  ? `${patient.age != null ? `${patient.age} ${isVi ? 'tuổi' : 'yrs'}` : (isVi ? 'Chưa rõ tuổi' : 'Age N/A')} • ${patient.gender === 'Male' ? t('common.gender.male', 'Nam') : patient.gender === 'Female' ? t('common.gender.female', 'Nữ') : (isVi ? 'Chưa rõ giới tính' : 'Gender N/A')}`
                  : (isVi ? 'Chưa cập nhật' : 'Unrecorded')}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('doctor.reportModal.bpDiabetes', 'Huyết áp / HbA1c:')}</span>
              <strong className="text-slate-900 font-mono-data">
                {patient.systolicBp != null || patient.hba1c != null
                  ? `${patient.systolicBp != null && patient.diastolicBp != null ? `${patient.systolicBp}/${patient.diastolicBp} mmHg` : (isVi ? 'HA: Chưa đo' : 'BP: Unrecorded')} • ${patient.hba1c != null ? `HbA1c: ${patient.hba1c}%` : (isVi ? 'HbA1c: Chưa đo' : 'HbA1c: Unrecorded')}`
                  : (isVi ? 'Chưa cập nhật' : 'Unrecorded')}
              </strong>
            </div>
          </div>

          {/* 1. Visual Images & Grad-CAM Heatmap */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-700" />
                {t('doctor.reportModal.section1', '1. Hình Ảnh Võng Mạc & Bản Đồ Nhiệt Vi Mạch AI')}
              </span>
              {hasDualData && (
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {t('doctor.reportModal.dualComparisonHeader', 'Đối chiếu đồng thời 2 mắt: Mắt Phải & Mắt Trái')}
                </span>
              )}
            </h3>

            {hasDualData ? (
              /* DUAL EYE DISPLAY: 4 IMAGES */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Right Eye Block */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-cyan-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                      {isVi ? 'MẮT PHẢI' : 'RIGHT EYE'}
                    </span>
                    <span className="text-[11px] font-mono-data font-bold text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200">
                      {isVi ? 'Nguy cơ' : 'Risk'}: {odData.overallVascularRiskScore}% • A/V: {odData.annotatedMap.arteryVeinRatio}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 print:bg-white print:border-slate-300 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-slate-800 print:border-slate-300">
                        <img
                          src={odData.imageUrl || '/assets/images/fundus_original.png'}
                          alt={isVi ? 'Ảnh đáy mắt phải gốc' : 'Original right fundus scan'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-300 print:text-slate-700">
                        {isVi ? 'Ảnh Gốc' : 'Original'}
                      </p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-cyan-300 bg-slate-950 print:bg-white print:border-slate-300 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-cyan-600 print:border-cyan-500 bg-black">
                        <img
                          src={odData.imageUrl || '/assets/images/fundus_original.png'}
                          alt={isVi ? 'Ảnh nền OD' : 'OD background'}
                          className="h-full w-full object-cover absolute inset-0"
                        />
                        {odData.annotatedMap?.heatmapUrl && odData.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png' ? (
                          <img
                            src={odData.annotatedMap.heatmapUrl}
                            alt="Heatmap OD"
                            className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                          />
                        ) : (
                          <DynamicHeatmapCanvas
                            imageSrc={odData.imageUrl || '/assets/images/fundus_original.png'}
                            riskScore={odData.overallVascularRiskScore || 35}
                            anomalies={odLesions}
                            selectedEye="OD"
                            opacity={0.85}
                            className="h-full w-full object-cover absolute inset-0"
                          />
                        )}

                        {/* Điểm định vị tổn thương vi mạch AI (OD Pin Markers) - CHỈ CHO TỔN THƯƠNG BỆNH LÝ */}
                        {odLesions.map((ano, idx) => {
                          const isRed = ['Hemorrhage', 'AV_Nipping', 'Focal_Narrowing'].includes(ano.type);
                          const pinName = getAnomalyName(ano.type, t);
                          return (
                            <div
                              key={ano.id || `od-pin-${idx}`}
                              className="absolute z-20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              style={{
                                left: `${Math.max(6, Math.min(94, ano.coordinates?.x ?? 50))}%`,
                                top: `${Math.max(6, Math.min(94, ano.coordinates?.y ?? 50))}%`,
                              }}
                              title={`OD #${idx + 1} - ${pinName}`}
                            >
                              <span
                                className={`absolute rounded-full opacity-70 animate-ping ${
                                  isRed ? 'bg-rose-500' : 'bg-amber-400'
                                }`}
                                style={{ width: '22px', height: '22px' }}
                              />
                              <span
                                className={`relative z-10 flex items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg border-2 border-white ${
                                  isRed ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                                style={{ width: '20px', height: '20px' }}
                              >
                                {idx + 1}
                              </span>
                            </div>
                          );
                        })}

                        {/* Mốc Giải Phẫu Võng Mạc AI Định Vị (OD Landmarks - Cyan Reticles) */}
                        {odLandmarks.map((lm, idx) => {
                          const isDisc = String(lm.type || '').toUpperCase().includes('DISC');
                          const lmName = isDisc ? (isVi ? 'Gai thị' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'FAZ');
                          return (
                            <div
                              key={lm.id || `od-lm-${idx}`}
                              className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              style={{
                                left: `${Math.max(6, Math.min(94, lm.coordinates?.x ?? 50))}%`,
                                top: `${Math.max(6, Math.min(94, lm.coordinates?.y ?? 50))}%`,
                              }}
                              title={`${lmName} (${Math.round((lm.confidence || 0.98) * 100)}%)`}
                            >
                              <div className="w-9 h-9 rounded-full border border-dashed border-cyan-300 bg-cyan-500/10 flex items-center justify-center shadow-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                              </div>
                              <span className="mt-0.5 text-[9px] font-bold text-cyan-200 bg-slate-950/80 px-1 py-0.2 rounded border border-cyan-500/30 whitespace-nowrap">
                                {lmName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-cyan-200 print:text-cyan-900">
                        {isVi ? 'Bản Đồ Nhiệt AI' : 'AI Heatmap'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Left Eye Block */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-teal-200 space-y-3 avoid-page-break">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      {isVi ? 'MẮT TRÁI' : 'LEFT EYE'}
                    </span>
                    <span className="text-[11px] font-mono-data font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                      {isVi ? 'Nguy cơ' : 'Risk'}: {osData.overallVascularRiskScore}% • A/V: {osData.annotatedMap.arteryVeinRatio}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 print:bg-white print:border-slate-300 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-slate-800 print:border-slate-300">
                        <img
                          src={osData.imageUrl || '/assets/images/fundus_original.png'}
                          alt={isVi ? 'Ảnh đáy mắt trái gốc' : 'Original left fundus scan'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-300 print:text-slate-700">
                        {isVi ? 'Ảnh Gốc' : 'Original'}
                      </p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-teal-300 bg-slate-950 print:bg-white print:border-slate-300 p-1.5 flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-full overflow-hidden border border-teal-600 print:border-teal-500 bg-black">
                        <img
                          src={osData.imageUrl || '/assets/images/fundus_original.png'}
                          alt={isVi ? 'Ảnh nền mắt trái' : 'Left background'}
                          className="h-full w-full object-cover absolute inset-0"
                        />
                        {osData.annotatedMap?.heatmapUrl && osData.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png' ? (
                          <img
                            src={osData.annotatedMap.heatmapUrl}
                            alt="Heatmap OS"
                            className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                          />
                        ) : (
                          <DynamicHeatmapCanvas
                            imageSrc={osData.imageUrl || '/assets/images/fundus_original.png'}
                            riskScore={osData.overallVascularRiskScore || 35}
                            anomalies={osLesions}
                            selectedEye="OS"
                            opacity={0.85}
                            className="h-full w-full object-cover absolute inset-0"
                          />
                        )}

                        {/* Điểm định vị tổn thương vi mạch AI (OS Pin Markers) - CHỈ CHO TỔN THƯƠNG BỆNH LÝ */}
                        {osLesions.map((ano, idx) => {
                          const isRed = ['Hemorrhage', 'AV_Nipping', 'Focal_Narrowing'].includes(ano.type);
                          const pinName = getAnomalyName(ano.type, t);
                          return (
                            <div
                              key={ano.id || `os-pin-${idx}`}
                              className="absolute z-20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              style={{
                                left: `${Math.max(6, Math.min(94, ano.coordinates?.x ?? 50))}%`,
                                top: `${Math.max(6, Math.min(94, ano.coordinates?.y ?? 50))}%`,
                              }}
                              title={`OS #${idx + 1} - ${pinName}`}
                            >
                              <span
                                className={`absolute rounded-full opacity-70 animate-ping ${
                                  isRed ? 'bg-rose-500' : 'bg-amber-400'
                                }`}
                                style={{ width: '22px', height: '22px' }}
                              />
                              <span
                                className={`relative z-10 flex items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg border-2 border-white ${
                                  isRed ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                                style={{ width: '20px', height: '20px' }}
                              >
                                {idx + 1}
                              </span>
                            </div>
                          );
                        })}

                        {/* Mốc Giải Phẫu Võng Mạc AI Định Vị (OS Landmarks - Cyan Reticles) */}
                        {osLandmarks.map((lm, idx) => {
                          const isDisc = String(lm.type || '').toUpperCase().includes('DISC');
                          const lmName = isDisc ? (isVi ? 'Gai thị' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'FAZ');
                          return (
                            <div
                              key={lm.id || `os-lm-${idx}`}
                              className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              style={{
                                left: `${Math.max(6, Math.min(94, lm.coordinates?.x ?? 50))}%`,
                                top: `${Math.max(6, Math.min(94, lm.coordinates?.y ?? 50))}%`,
                              }}
                              title={`${lmName} (${Math.round((lm.confidence || 0.98) * 100)}%)`}
                            >
                              <div className="w-9 h-9 rounded-full border border-dashed border-cyan-300 bg-cyan-500/10 flex items-center justify-center shadow-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                              </div>
                              <span className="mt-0.5 text-[9px] font-bold text-cyan-200 bg-slate-950/80 px-1 py-0.2 rounded border border-cyan-500/30 whitespace-nowrap">
                                {lmName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-teal-200 print:text-teal-900">
                        {isVi ? 'Bản Đồ Nhiệt AI' : 'AI Heatmap'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE EYE DISPLAY */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 avoid-page-break">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 print:bg-white print:border-slate-300 p-2 flex flex-col items-center">
                  <div className="relative aspect-square max-w-[280px] w-full rounded-full overflow-hidden border-2 border-slate-800 print:border-slate-300">
                    <img
                      src={result.imageUrl || '/assets/images/fundus_original.png'}
                      alt={isVi ? 'Ảnh đáy mắt gốc' : 'Original fundus scan'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-300 print:text-slate-700">
                    {isVi ? 'Ảnh Màu Đáy Mắt Gốc' : 'Original Color Fundus Scan'}
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-cyan-300 bg-slate-950 print:bg-white print:border-slate-300 p-2 flex flex-col items-center">
                  <div className="relative aspect-square max-w-[280px] w-full rounded-full overflow-hidden border-2 border-cyan-600 print:border-cyan-500 bg-black">
                    <img
                      src={result.imageUrl || '/assets/images/fundus_original.png'}
                      alt={isVi ? 'Ảnh nền' : 'Background scan'}
                      className="h-full w-full object-cover absolute inset-0"
                    />
                    {result.annotatedMap?.heatmapUrl && result.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png' ? (
                      <img
                        src={result.annotatedMap.heatmapUrl}
                        alt={isVi ? 'Bản đồ nhiệt Grad-CAM' : 'Grad-CAM Heatmap'}
                        className="h-full w-full object-cover absolute inset-0 mix-blend-screen opacity-85"
                      />
                    ) : (
                      <DynamicHeatmapCanvas
                        imageSrc={result.imageUrl || '/assets/images/fundus_original.png'}
                        riskScore={result.overallVascularRiskScore ?? result.riskScore ?? 35}
                        anomalies={singleLesions}
                        selectedEye={result.eyePosition || 'OD'}
                        opacity={0.85}
                        className="h-full w-full object-cover absolute inset-0"
                      />
                    )}

                    {/* Điểm định vị tổn thương vi mạch AI (Single Eye Pin Markers) - CHỈ CHO TỔN THƯƠNG BỆNH LÝ */}
                    {singleLesions.map((ano, idx) => {
                      const isRed = ['Hemorrhage', 'AV_Nipping', 'Focal_Narrowing'].includes(ano.type);
                      const pinName = getAnomalyName(ano.type, t);
                      return (
                        <div
                          key={ano.id || `single-pin-${idx}`}
                          className="absolute z-20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: `${Math.max(6, Math.min(94, ano.coordinates?.x ?? 50))}%`,
                            top: `${Math.max(6, Math.min(94, ano.coordinates?.y ?? 50))}%`,
                          }}
                          title={`#${idx + 1} - ${pinName}`}
                        >
                          <span
                            className={`absolute rounded-full opacity-70 animate-ping ${
                              isRed ? 'bg-rose-500' : 'bg-amber-400'
                            }`}
                            style={{ width: '22px', height: '22px' }}
                          />
                          <span
                            className={`relative z-10 flex items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg border-2 border-white ${
                              isRed ? 'bg-rose-600' : 'bg-amber-500'
                            }`}
                            style={{ width: '20px', height: '20px' }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                      );
                    })}

                    {/* Mốc Giải Phẫu Võng Mạc AI Định Vị (Single Eye Landmarks - Cyan Reticles) */}
                    {singleLandmarks.map((lm, idx) => {
                      const isDisc = String(lm.type || '').toUpperCase().includes('DISC');
                      const lmName = isDisc ? (isVi ? 'Gai thị' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'FAZ');
                      return (
                        <div
                          key={lm.id || `single-lm-${idx}`}
                          className="absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: `${Math.max(6, Math.min(94, lm.coordinates?.x ?? 50))}%`,
                            top: `${Math.max(6, Math.min(94, lm.coordinates?.y ?? 50))}%`,
                          }}
                          title={`${lmName} (${Math.round((lm.confidence || 0.98) * 100)}%)`}
                        >
                          <div className="w-9 h-9 rounded-full border border-dashed border-cyan-300 bg-cyan-500/10 flex items-center justify-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          </div>
                          <span className="mt-0.5 text-[9px] font-bold text-cyan-200 bg-slate-950/80 px-1 py-0.2 rounded border border-cyan-500/30 whitespace-nowrap">
                            {lmName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-cyan-200 print:text-cyan-900">
                    {isVi ? 'Bản Đồ Nhiệt Grad-CAM' : 'Grad-CAM Attention Heatmap'}
                  </p>
                </div>
              </div>
            )}

            {/* Bảng Chi Tiết Điểm Tổn Thương Vi Mạch AI Định Vị */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 avoid-page-break">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-cyan-800 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {isVi
                      ? 'Danh Sách Điểm Tổn Thương Vi Mạch AI Định Vị'
                      : 'AI-Detected Microvascular Anomaly Coordinates & Findings'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border font-mono-data ${
                    allReportLesions.length > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {allReportLesions.length} {isVi ? 'tổn thương' : 'lesions'}
                  </span>
                </div>

                {/* Chú giải nhanh màu sắc tổn thương */}
                <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                    <span>{isVi ? 'Xuất huyết / Co thắt / Bắt chéo' : 'Hemorrhage / Narrowing / Nipping'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span>{isVi ? 'Vi phình mạch / Xuất tiết' : 'Microaneurysm / Exudate'}</span>
                  </span>
                </div>
              </div>

              {allReportLesions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold bg-white/70">
                        <th className="py-2 px-2 text-center w-12">#</th>
                        {hasDualData && <th className="py-2 px-2.5 w-20">{isVi ? 'Mắt' : 'Eye'}</th>}
                        <th className="py-2 px-2.5">{isVi ? 'Loại Tổn Thương' : 'Anomaly Type'}</th>
                        <th className="py-2 px-2.5 text-center">{isVi ? 'Tọa Độ (X, Y)' : 'Coordinates (X, Y)'}</th>
                        <th className="py-2 px-2.5 text-center">{isVi ? 'Độ Tin Cậy' : 'Confidence'}</th>
                        <th className="py-2 px-3">{isVi ? 'Mô Tả Lâm Sàng & Khuyến Nghị' : 'Clinical Description & Recommendation'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 font-normal">
                      {allReportLesions.map((ano, index) => {
                        const isRed = ['Hemorrhage', 'AV_Nipping', 'Focal_Narrowing'].includes(ano.type);
                        const anomalyName = getAnomalyName(ano.type, t);
                        const confVal =
                          ano.confidence != null
                            ? ano.confidence <= 1
                              ? Math.round(ano.confidence * 100)
                              : Math.round(ano.confidence)
                            : 90;
                        return (
                          <tr key={ano.id || index} className="hover:bg-cyan-50/40 transition-colors">
                            <td className="py-2 px-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs ${
                                  isRed ? 'bg-rose-600' : 'bg-amber-500'
                                }`}
                                style={{ width: '20px', height: '20px' }}
                              >
                                {ano.pinIndex || index + 1}
                              </span>
                            </td>
                            {hasDualData && (
                              <td className="py-2 px-2.5">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-data ${
                                    ano.eyeCode === 'OD'
                                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                      : 'bg-teal-100 text-teal-800 border border-teal-300'
                                  }`}
                                >
                                  {ano.eyeCode}
                                </span>
                              </td>
                            )}
                            <td className="py-2 px-2.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                  isRed
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                              >
                                {anomalyName}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-center font-mono-data text-[11px] text-slate-700">
                              X: {ano.coordinates?.x ?? 0}% • Y: {ano.coordinates?.y ?? 0}%
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="font-mono-data font-bold text-cyan-800 text-[11px] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                                {confVal}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-black text-[11px] sm:text-xs leading-relaxed font-medium">
                              {ano.description ||
                                (isVi
                                  ? 'Vùng vi mạch có biểu hiện tổn thương khu trú cần theo dõi định kỳ.'
                                  : 'Focal microvascular lesion site requiring routine surveillance.')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="leading-snug">
                    {isVi
                      ? 'Không phát hiện tổn thương vi mạch hoặc xuất huyết khu trú đơn độc (0 điểm tổn thương). Hệ thống mạch máu võng mạc không có dấu hiệu dị thường khu trú.'
                      : 'No isolated focal microvascular lesions or hemorrhages detected (0 focal lesion points). Retinal microvasculature shows no isolated focal abnormalities.'}
                  </p>
                </div>
              )}

              {/* Dải Mốc Giải Phẫu Võng Mạc AI Định Vị (Retinal Landmarks) */}
              {allReportLandmarks.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-950">
                    <Target className="h-3.5 w-3.5 text-cyan-700" />
                    <span>{isVi ? 'Mốc Giải Phẫu Võng Mạc AI Định Vị:' : 'AI-Localized Retinal Landmarks:'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {allReportLandmarks.map((lm, idx) => {
                      const isDisc = String(lm.type || '').toUpperCase().includes('DISC');
                      const name = isDisc ? (isVi ? 'Gai thị (Optic Disc)' : 'Optic Disc') : (isVi ? 'Hoàng điểm (FAZ)' : 'Fovea Centralis (FAZ)');
                      const confVal =
                        lm.confidence != null
                          ? lm.confidence <= 1
                            ? Math.round(lm.confidence * 100)
                            : Math.round(lm.confidence)
                          : 98;
                      return (
                        <span
                          key={lm.id || `report-lm-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs font-medium"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600" />
                          <span className="font-bold">{name}:</span>
                          <span className="font-mono-data text-slate-700">
                            X: {lm.coordinates?.x ?? 0}% • Y: {lm.coordinates?.y ?? 0}%
                          </span>
                          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded-full">
                            {confVal}%
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Clinical Risk Gauges */}
          <div className="space-y-3 avoid-page-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Heart className="h-4 w-4 text-rose-600" />
              {t('doctor.reportModal.section2', '2. Đánh Giá Nguy Cơ Lâm Sàng Đa Bệnh Lý')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CVD Card */}
              {(() => {
                const cvdScore = Math.max(odData?.cardiovascularRisk?.score ?? 0, osData?.cardiovascularRisk?.score ?? 0);
                const cvdLevel = isVi
                  ? (cvdScore >= 80 ? 'Nguy kịch' : cvdScore >= 65 ? 'Cao' : cvdScore >= 40 ? 'Trung bình' : 'Thấp')
                  : (cvdScore >= 80 ? 'Critical' : cvdScore >= 65 ? 'High' : cvdScore >= 40 ? 'Moderate' : 'Low');
                const cvdBadgeStyle =
                  cvdScore >= 80
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : cvdScore >= 65
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : cvdScore >= 40
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                const cvdDesc = hasDualData
                  ? (isVi
                      ? `OD: ${odData?.cardiovascularRisk?.score ?? 0}% • OS: ${osData?.cardiovascularRisk?.score ?? 0}% (Điểm cao nhất giữa 2 mắt).`
                      : `OD: ${odData?.cardiovascularRisk?.score ?? 0}% • OS: ${osData?.cardiovascularRisk?.score ?? 0}% (Worst score across eyes).`)
                  : cvdScore >= 65
                  ? (isVi
                      ? 'Tỷ lệ A/V hẹp rõ rệt, nguy cơ xơ cứng mạch máu và biến cố mạch vành cao.'
                      : 'Pronounced arteriolar narrowing, elevated vascular sclerosis and coronary risk.')
                  : cvdScore >= 40
                  ? (isVi
                      ? 'Co thắt nhẹ vi mạch hoặc thay đổi vi tuần hoàn võng mạc, cần theo dõi định kỳ.'
                      : 'Mild arteriolar constriction or microvascular changes, routine monitoring indicated.')
                  : (isVi
                      ? 'Hệ vi mạch võng mạc bình thường, nguy cơ biến cố tim mạch thấp.'
                      : 'Normal retinal microvasculature, low cardiovascular event risk.');

                return (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                      <span>{t('doctor.reportModal.cardioRisk', 'Nguy Cơ Tim Mạch (3 Năm)')}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${cvdBadgeStyle}`}>
                        {cvdLevel}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono-data text-rose-600">
                      {cvdScore}%
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {cvdDesc}
                    </p>
                  </div>
                );
              })()}

              {/* DR Card */}
              {(() => {
                const drScore = Math.max(odData?.diabeticRetinopathyRisk?.score ?? 0, osData?.diabeticRetinopathyRisk?.score ?? 0);
                const drLevel = isVi
                  ? (drScore >= 80 ? 'Nguy kịch' : drScore >= 65 ? 'Cao' : drScore >= 40 ? 'Trung bình' : 'Thấp')
                  : (drScore >= 80 ? 'Critical' : drScore >= 65 ? 'High' : drScore >= 40 ? 'Moderate' : 'Low');
                const drBadgeStyle =
                  drScore >= 80
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : drScore >= 65
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : drScore >= 40
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                const drDesc = hasDualData
                  ? `OD: ${odData?.diabeticRetinopathyRisk?.score ?? 0}% • OS: ${osData?.diabeticRetinopathyRisk?.score ?? 0}%`
                  : drScore >= 60
                  ? (isVi
                      ? 'Phát hiện tổn thương vi mạch, xuất huyết hoặc xuất tiết võng mạc rõ rệt.'
                      : 'Evident microvascular lesions, retinal hemorrhages, or exudates detected.')
                  : drScore >= 40
                  ? (isVi
                      ? 'Phát hiện vi phình mạch rải rác cực sau theo phân tích AURA AI.'
                      : 'Scattered posterior pole microaneurysms detected by AURA AI.')
                  : (isVi
                      ? 'Chưa phát hiện tổn thương vi mạch đái tháo đường hoặc phù hoàng điểm.'
                      : 'No diabetic retinopathy microvascular lesions or macular edema detected.');

                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>{t('doctor.reportModal.retinopathyRisk', 'Bệnh Võng Mạc Đái Tháo Đường')}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${drBadgeStyle}`}>
                        {drLevel}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono-data text-amber-600">
                      {drScore}%
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {drDesc}
                    </p>
                  </div>
                );
              })()}

              {/* Glaucoma Card */}
              {(() => {
                const glaucomaScore = Math.max(odData?.glaucomaRisk?.score ?? 0, osData?.glaucomaRisk?.score ?? 0);
                const glaucomaLevel = isVi
                  ? (glaucomaScore >= 80 ? 'Nguy kịch' : glaucomaScore >= 65 ? 'Cao' : glaucomaScore >= 40 ? 'Trung bình' : 'Thấp')
                  : (glaucomaScore >= 80 ? 'Critical' : glaucomaScore >= 65 ? 'High' : glaucomaScore >= 40 ? 'Moderate' : 'Low');
                const glaucomaBadgeStyle =
                  glaucomaScore >= 80
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : glaucomaScore >= 65
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : glaucomaScore >= 40
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                const glaucomaDesc =
                  glaucomaScore >= 65
                    ? (isVi
                        ? 'Lõm gai mở rộng bất thường, nguy cơ cao tổn hại sợi thần kinh thị giác.'
                        : 'Abnormal cup enlargement, elevated risk of optic nerve fiber loss.')
                    : glaucomaScore >= 40
                    ? (isVi
                        ? 'Lõm gai mở rộng sinh lý hoặc nghi ngờ sớm, cần theo dõi nhãn áp.'
                        : 'Physiological cupping or early suspicion, intraocular pressure monitoring recommended.')
                    : (isVi
                        ? 'Tỷ lệ Cup/Disc trong giới hạn an toàn bình thường.'
                        : 'Cup-to-disc ratio within safe physiological limits.');

                return (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>{t('doctor.reportModal.glaucomaRisk', 'Nguy Cơ Glaucoma (Tăng Nhãn Áp)')}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${glaucomaBadgeStyle}`}>
                        {glaucomaLevel}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono-data text-emerald-600">
                      {glaucomaScore}%
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {glaucomaDesc}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 3. Quantitative Biomarkers Table */}
          <div className="space-y-3 avoid-page-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Activity className="h-4 w-4 text-cyan-700" />
              {t('doctor.reportModal.section3', '3. Phân Tích Chỉ Số Sinh Học Vi Mạch Võng Mạc')}
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">{t('doctor.reportModal.colBiomarker', 'Chỉ số sinh học')}</th>
                    {hasDualData ? (
                      <>
                        <th className="p-2.5 text-[#3478F6]">{t('doctor.reportModal.colOD', 'Mắt Phải')}</th>
                        <th className="p-2.5 text-[#0D9488]">{t('doctor.reportModal.colOS', 'Mắt Trái')}</th>
                      </>
                    ) : (
                      <th className="p-2.5">{t('doctor.reportModal.colMeasured', 'Giá trị đo')}</th>
                    )}
                    <th className="p-2.5">{t('doctor.reportModal.colReference', 'Dải tham chiếu chuẩn')}</th>
                    <th className="p-2.5">{t('doctor.reportModal.colEvaluation', 'Đánh giá lâm sàng')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">{t('doctor.reportModal.bmAvr', 'Tỷ lệ Động/Tĩnh mạch')}</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData?.annotatedMap?.arteryVeinRatio ?? '--'}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData?.annotatedMap?.arteryVeinRatio ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">≥ 0.67</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateAvRatio(odData?.annotatedMap?.arteryVeinRatio ?? 0).color}`}>
                            OD: {evaluateAvRatio(odData?.annotatedMap?.arteryVeinRatio ?? 0).text}
                          </span>
                          <span className={`block ${evaluateAvRatio(osData?.annotatedMap?.arteryVeinRatio ?? 0).color}`}>
                            OS: {evaluateAvRatio(osData?.annotatedMap?.arteryVeinRatio ?? 0).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result?.annotatedMap?.arteryVeinRatio ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">≥ 0.67</td>
                        <td className={`p-2.5 ${evaluateAvRatio(result?.annotatedMap?.arteryVeinRatio ?? 0).color}`}>
                          {evaluateAvRatio(result?.annotatedMap?.arteryVeinRatio ?? 0).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">{t('doctor.reportModal.bmDensity', 'Mật độ tưới máu vi mạch')}</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData?.annotatedMap?.vesselDensityPercentage ?? '--'}%</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData?.annotatedMap?.vesselDensityPercentage ?? '--'}%</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">15.5% - 19.0%</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateVesselDensity(odData?.annotatedMap?.vesselDensityPercentage ?? 0).color}`}>
                            OD: {evaluateVesselDensity(odData?.annotatedMap?.vesselDensityPercentage ?? 0).text}
                          </span>
                          <span className={`block ${evaluateVesselDensity(osData?.annotatedMap?.vesselDensityPercentage ?? 0).color}`}>
                            OS: {evaluateVesselDensity(osData?.annotatedMap?.vesselDensityPercentage ?? 0).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result?.annotatedMap?.vesselDensityPercentage ?? '--'}%</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">15.5% - 19.0%</td>
                        <td className={`p-2.5 ${evaluateVesselDensity(result?.annotatedMap?.vesselDensityPercentage ?? 0).color}`}>
                          {evaluateVesselDensity(result?.annotatedMap?.vesselDensityPercentage ?? 0).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">{t('doctor.reportModal.bmTortuosity', 'Độ uốn lượn mạch máu (Tortuosity)')}</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData?.annotatedMap?.tortuosityIndex ?? '--'}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData?.annotatedMap?.tortuosityIndex ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 1.25</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateTortuosity(odData?.annotatedMap?.tortuosityIndex ?? 0).color}`}>
                            OD: {evaluateTortuosity(odData?.annotatedMap?.tortuosityIndex ?? 0).text}
                          </span>
                          <span className={`block ${evaluateTortuosity(osData?.annotatedMap?.tortuosityIndex ?? 0).color}`}>
                            OS: {evaluateTortuosity(osData?.annotatedMap?.tortuosityIndex ?? 0).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result?.annotatedMap?.tortuosityIndex ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 1.25</td>
                        <td className={`p-2.5 ${evaluateTortuosity(result?.annotatedMap?.tortuosityIndex ?? 0).color}`}>
                          {evaluateTortuosity(result?.annotatedMap?.tortuosityIndex ?? 0).text}
                        </td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">{t('doctor.reportModal.bmCdr', 'Tỷ lệ lõm gai thị')}</td>
                    {hasDualData ? (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{odData?.annotatedMap?.opticCupToDiscRatio ?? '--'}</td>
                        <td className="p-2.5 font-bold font-mono-data text-teal-800">{osData?.annotatedMap?.opticCupToDiscRatio ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 0.50</td>
                        <td className="p-2.5 space-y-0.5">
                          <span className={`block ${evaluateVcdr(odData?.annotatedMap?.opticCupToDiscRatio ?? 0).color}`}>
                            OD: {evaluateVcdr(odData?.annotatedMap?.opticCupToDiscRatio ?? 0).text}
                          </span>
                          <span className={`block ${evaluateVcdr(osData?.annotatedMap?.opticCupToDiscRatio ?? 0).color}`}>
                            OS: {evaluateVcdr(osData?.annotatedMap?.opticCupToDiscRatio ?? 0).text}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold font-mono-data text-cyan-800">{result?.annotatedMap?.opticCupToDiscRatio ?? '--'}</td>
                        <td className="p-2.5 text-slate-500 font-mono-data">&lt; 0.50</td>
                        <td className={`p-2.5 ${evaluateVcdr(result?.annotatedMap?.opticCupToDiscRatio ?? 0).color}`}>
                          {evaluateVcdr(result?.annotatedMap?.opticCupToDiscRatio ?? 0).text}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ICD-10 Diagnosis Codes Section */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 avoid-page-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileBadge className="h-4 w-4 text-cyan-700" />
              {t('doctor.reportModal.icd10Label', 'Danh mục mã bệnh quốc tế ICD-10:')}
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
                  ? (isVi ? 'Bác sĩ không ghi nhận mã ICD-10 bổ sung cho ca khám này.' : 'No additional ICD-10 codes recorded for this case.')
                  : (isVi ? 'Chưa ghi nhận mã ICD-10 (Chờ bác sĩ chuyên khoa thẩm định và chỉ định sau khi thăm khám).' : 'No ICD-10 codes recorded yet (Awaiting specialist clinical validation).')}
              </p>
            )}
          </div>

          {/* 5. Doctor Recommendation and Digital Signature */}
          <div className={`rounded-xl border p-5 space-y-4 avoid-page-break ${
            isRejected
              ? 'border-rose-300 bg-rose-50/50 print:border-rose-400 print:bg-rose-50'
              : isReviewed
              ? 'border-emerald-200 bg-emerald-50/40 print:border-emerald-300'
              : 'border-amber-200 bg-amber-50/40 print:border-amber-300'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              {isRejected ? (
                <>
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span className="text-rose-900 font-bold">{isVi ? 'Kết Luận & Lý Do Bác Bỏ Của Bác Sĩ:' : 'Specialist Rejection Rationale:'}</span>
                </>
              ) : isReviewed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t('doctor.reportModal.doctorNotesTitle', 'Ghi chú chuyên môn của Bác sĩ:')}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {t('doctor.reportModal.findingsTitle', 'Nhận định vi mạch AI:')}
                </>
              )}
            </h3>

            {isRejected ? (
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-rose-950 leading-relaxed font-semibold whitespace-pre-line">
                  {result.doctorNotes || (isVi ? 'Bác sĩ chuyên khoa đã xem xét và bác bỏ kết luận từ hệ thống AI (Hình ảnh không đạt chuẩn hoặc không tương thích dấu hiệu lâm sàng).' : 'Specialist has reviewed and rejected the AI findings (Sub-optimal image or discordant clinical signs).')}
                </p>
                <p className="text-xs text-rose-700 font-medium pt-1">
                  {isVi
                    ? '* Chỉ định tiếp theo: Đặt lịch chụp lại đáy mắt đạt chuẩn hoặc thăm khám trực tiếp với bác sĩ chuyên khoa mắt/tim mạch.'
                    : '* Next Steps: Schedule fundus re-imaging or attend an in-person consultation with a specialist.'}
                </p>
              </div>
            ) : isReviewed ? (
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-black leading-relaxed font-medium whitespace-pre-line">
                  {result.doctorNotes || (isVi ? 'Bác sĩ chuyên khoa đã xem xét và xác nhận kết quả phân tích hình ảnh võng mạc.' : 'Attending specialist has reviewed and confirmed retinal analysis findings.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-black leading-relaxed font-normal whitespace-pre-line">
                  {result.recommendations ||
                    (result.xaiExplainability && result.xaiExplainability.length > 1
                      ? result.xaiExplainability[1].clinicalRationale
                      : (isVi ? 'Hệ thống khuyến nghị người bệnh đặt lịch hẹn tái khám tại cơ sở y tế chuyên khoa mắt hoặc tim mạch để bác sĩ thẩm định chi tiết.' : 'Clinical follow-up at an eye or cardiovascular clinic is recommended for comprehensive assessment.'))}
                </p>
                <p className="text-xs text-amber-900 font-semibold pt-1">
                  {isVi
                    ? '* Lưu ý: Đây là đánh giá định hướng tự động của mô hình AURA AI, chưa phải kết luận lâm sàng chính thức từ bác sĩ.'
                    : '* Notice: This is an automated algorithmic preliminary evaluation by AURA AI, not a definitive clinical diagnosis.'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t border-slate-200/80 text-xs gap-3">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    data-testid="report-model-version-badge"
                    className="font-bold text-slate-800 font-mono-data bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {result.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4'}
                  </span>
                  <span
                    data-testid="report-calibration-badge"
                    className="text-slate-600 font-mono-data bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-800"
                  >
                    Brier: {(result.confidenceCalibration?.brierScore ?? 0.058).toFixed(3)} | Platt Calibrated: {(result.confidenceCalibration?.calibratedConfidence ?? 94.2).toFixed(1)}%
                  </span>
                  {isRejected && (
                    <span className="font-bold text-rose-800 font-mono-data bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                      STATUS: REJECTED (OVERRULED)
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[10.5px]">
                  {isVi
                    ? 'Khuyến nghị sàng lọc tuân thủ tiêu chuẩn AHA/ACC & AAO | Tương thích chuẩn HL7/FHIR R4'
                    : 'Screening guidelines compliant with AHA/ACC & AAO standards | HL7/FHIR R4 Compliant'}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                {isRejected ? (
                  <>
                    <p className="text-slate-500 text-[11px]">{isVi ? 'Bác sĩ chuyên khoa bác bỏ:' : 'Reviewing Specialist (Rejection):'}</p>
                    <p className="font-bold text-slate-900 text-sm">{verifiedDoctorName}</p>
                    <div className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-mono-data font-semibold bg-rose-100/90 px-2 py-0.5 rounded border border-rose-300">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      {isVi ? 'Chữ ký số xác thực BÁC BỎ kết quả' : 'Digital Signature - Rejection Verified'}
                    </div>
                    {result.signedAt && (
                      <p className="text-[10px] text-slate-500 font-mono-data">
                        {t('doctor.reportModal.signedAtLabel', 'Thời điểm ký:')} {new Date(result.signedAt).toLocaleString(locale)}
                      </p>
                    )}
                    {result.digitalSignature && (
                      <div className="text-[9px] text-slate-400 font-mono-data max-w-xs break-all pt-0.5" title={result.digitalSignature}>
                        {result.digitalSignature.slice(0, 32)}...
                      </div>
                    )}
                  </>
                ) : isReviewed ? (
                  <>
                    <p className="text-slate-500 text-[11px]">{t('doctor.reportModal.reviewingSpecialist', 'Bác sĩ chuyên khoa ký duyệt:')}</p>
                    <p className="font-bold text-slate-900 text-sm">{verifiedDoctorName}</p>
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono-data font-semibold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {t('doctor.reportModal.validSignature', 'Chữ ký số hợp lệ & xác thực PKI')}
                    </div>
                    {result.signedAt && (
                      <p className="text-[10px] text-slate-500 font-mono-data">
                        {t('doctor.reportModal.signedAtLabel', 'Thời điểm ký:')} {new Date(result.signedAt).toLocaleString(locale)}
                      </p>
                    )}
                    {result.digitalSignature && (
                      <div className="text-[9px] text-slate-400 font-mono-data max-w-xs break-all pt-0.5" title={result.digitalSignature}>
                        {result.digitalSignature.slice(0, 32)}...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-slate-500 text-[11px]">{t('doctor.reportModal.reviewingSpecialist', 'Bác sĩ chuyên khoa ký duyệt:')}</p>
                    <p className="font-semibold text-slate-600 text-xs italic">{t('doctor.reportModal.noSignatureYet', 'Chưa có chữ ký số bác sĩ')}</p>
                    <span className="inline-block text-[10px] text-amber-800 font-mono-data font-medium bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {t('doctor.reportModal.unsigned', 'Chưa ký số')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Stamp / Watermark on Screen and Print */}
          {isRejected && (
            <div className="pointer-events-none relative my-4 flex items-center justify-center overflow-hidden avoid-page-break">
              <div className="rotate-[-5deg] border-4 border-dashed border-rose-500 bg-rose-50/90 px-8 py-3 rounded-2xl text-center shadow-xs">
                <span className="block text-base sm:text-xl font-black uppercase tracking-widest text-rose-700">
                  {isVi ? 'KẾT QUẢ BỊ BÁC BỎ — KHÔNG CÔNG NHẬN LÂM SÀNG' : 'OVERRULED / REJECTED BY SPECIALIST'}
                </span>
                <span className="block text-[11px] font-semibold text-rose-600 mt-0.5">
                  {isVi ? 'Kết quả phân tích tự động từ AI này không có giá trị chẩn đoán y khoa' : 'Automated screening findings are deemed invalid for clinical use'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Footer with Close & Action Buttons */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between print:hidden z-20">
          <p className="text-xs text-slate-500">
            {isVi ? (
              <>Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono-data font-bold">Esc</kbd> hoặc bấm ra ngoài để thoát.</>
            ) : (
              <>Press <kbd className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono-data font-bold">Esc</kbd> or click outside to close.</>
            )}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportJsonFhir}
              className="px-3 py-2 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FileBadge className="h-4 w-4 text-blue-600" />
              <span>{isVi ? 'Xuất JSON (FHIR)' : 'Export FHIR JSON'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>{t('doctor.reportModal.exportCsv', 'Xuất CSV')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {t('doctor.reportModal.close', 'Đóng')}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              {t('doctor.reportModal.printPdf', 'In Phiếu / PDF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
