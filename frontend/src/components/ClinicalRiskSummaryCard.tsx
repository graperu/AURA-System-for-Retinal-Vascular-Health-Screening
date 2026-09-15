import React, { useState, useMemo } from 'react';
import { AIRiskResult } from '../types/cds';
import { RiskBadge } from './ui/RiskBadge';
import { Button } from './ui/Button';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';
import {
  Heart,
  Eye,
  Activity,
  FileText,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileBadge,
  Sparkles,
  HelpCircle,
  Clock,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';

export interface ClinicalRiskSummaryCardProps {
  analysisResult: AIRiskResult;
  onOpenFullReport: () => void;
  onConsultDoctor?: () => void;
}

const formatHypertensionStage = (stage?: string | null, isVi = true): string => {
  if (!stage) return isVi ? 'Giai đoạn 0 (Bình thường)' : 'Stage 0 (Normal)';
  const upper = stage.toUpperCase();
  if (upper === 'LOW' || upper === 'NORMAL' || upper.includes('STAGE_0') || upper.includes('STAGE 0')) {
    return isVi ? 'Giai đoạn 0 (Bình thường)' : 'Stage 0 (Normal)';
  }
  if (upper === 'MODERATE' || upper === 'MEDIUM' || upper.includes('STAGE_1') || upper.includes('STAGE 1')) {
    return isVi ? 'Giai đoạn 1 (Co nhẹ vi mạch)' : 'Stage 1 (Mild Arteriolar Constriction)';
  }
  if (upper === 'HIGH' || upper.includes('STAGE_2') || upper.includes('STAGE 2')) {
    return isVi ? 'Giai đoạn 2 (Tăng áp rõ)' : 'Stage 2 (Marked Narrowing)';
  }
  if (upper === 'CRITICAL' || upper === 'SEVERE' || upper.includes('STAGE_3') || upper.includes('STAGE 3')) {
    return isVi ? 'Giai đoạn 3 (Áp lực cao)' : 'Stage 3 (Severe Hypertension)';
  }
  return stage;
};

const formatEtdrsGrade = (grade?: string | null, score?: number, level?: string, isVi = true): string => {
  const s = score ?? 0;
  const l = (level || '').toLowerCase();
  if (s >= 80 || l.includes('critical') || l.includes('severe')) {
    return grade && !grade.toLowerCase().includes('không dr') && !grade.toLowerCase().includes('no dr') && !grade.toLowerCase().includes('theo phân tích')
      ? grade
      : (isVi ? 'Cấp độ 4 (PDR - Tăng sinh)' : 'Grade 4 (PDR - Proliferative)');
  }
  if (s >= 65 || l.includes('high')) {
    return grade && !grade.toLowerCase().includes('không dr') && !grade.toLowerCase().includes('no dr') && !grade.toLowerCase().includes('theo phân tích')
      ? grade
      : (isVi ? 'Cấp độ 3 (NPDR nặng)' : 'Grade 3 (Severe NPDR)');
  }
  if (s >= 40 || l.includes('moderate') || l.includes('medium')) {
    return grade && !grade.toLowerCase().includes('không dr') && !grade.toLowerCase().includes('no dr') && !grade.toLowerCase().includes('theo phân tích')
      ? grade
      : (isVi ? 'Cấp độ 2 (NPDR trung bình)' : 'Grade 2 (Moderate NPDR)');
  }
  if (s >= 25) {
    return grade && !grade.toLowerCase().includes('không dr') && !grade.toLowerCase().includes('no dr') && !grade.toLowerCase().includes('theo phân tích')
      ? grade
      : (isVi ? 'Cấp độ 1 (NPDR nhẹ)' : 'Grade 1 (Mild NPDR)');
  }
  if (grade && !grade.toLowerCase().includes('theo phân tích')) {
    return grade;
  }
  return isVi ? 'Cấp độ 0 (Không DR)' : 'Grade 0 (No DR)';
};

// Helper phân tách nhận định / khuyến nghị thành các ý rõ ràng, giảm tải chữ
const parseClinicalPoints = (text?: string | null, defaultPoints: string[] = []): string[] => {
  if (!text || !text.trim()) return defaultPoints;
  if (text.includes('•')) {
    const bulletParts = text
      .split('•')
      .map((s) => s.trim().replace(/^[-*\d.]\s*/, ''))
      .filter((s) => s.length > 0);
    if (bulletParts.length > 0) return bulletParts;
  }
  if (text.includes('\n')) {
    const lines = text
      .split('\n')
      .map((s) => s.trim().replace(/^[-*•\d.]\s*/, ''))
      .filter((s) => s.length > 0);
    if (lines.length > 0) return lines;
  }
  const sentences = text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  if (sentences.length >= 2) {
    return sentences;
  }
  const clauses = text
    .split(/,\s+(?=[A-ZÀ-Ỹa-zà-ỹ])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (clauses.length >= 2 && clauses.length <= 4) {
    return clauses.map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace(/[.;]$/, ''));
  }
  return [text];
};

// Component thanh dải tham chiếu trực quan (Visual Range Gauge Bar)
interface BiomarkerRangeBarProps {
  value?: number | null;
  min: number;
  max: number;
  targetMin?: number;
  targetMax?: number;
  isNormal: boolean;
}

const BiomarkerRangeBar: React.FC<BiomarkerRangeBarProps> = ({
  value,
  min,
  max,
  targetMin,
  targetMax,
  isNormal,
}) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return (
      <div className="w-full bg-slate-100 h-1.5 rounded-full relative overflow-hidden my-2 border border-dashed border-slate-300">
        <div className="absolute inset-0 bg-slate-200/40" />
      </div>
    );
  }

  const clampedVal = Math.max(min, Math.min(max, value));
  const pct = Math.round(((clampedVal - min) / (max - min)) * 100);
  const displayPct = Math.max(6, Math.min(94, pct));

  const tMin = targetMin !== undefined ? Math.max(min, targetMin) : min;
  const tMax = targetMax !== undefined ? Math.min(max, targetMax) : max;
  const targetLeftPct = Math.round(((tMin - min) / (max - min)) * 100);
  const targetWidthPct = Math.round(((tMax - tMin) / (max - min)) * 100);

  return (
    <div className="w-full bg-slate-100 h-1.5 rounded-full relative my-2">
      {/* Vùng tham chiếu chuẩn màu xanh lá nhạt */}
      <div
        className="absolute top-0 bottom-0 bg-emerald-200/80 rounded-full"
        style={{ left: `${targetLeftPct}%`, width: `${targetWidthPct}%` }}
        title="Dải tham chiếu chuẩn bình thường"
      />
      {/* Con trỏ giá trị đo hiện tại */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-xs transition-all duration-300 ${
          isNormal ? 'bg-emerald-600 ring-1 ring-emerald-400/40' : 'bg-amber-500 ring-1 ring-amber-400/40'
        }`}
        style={{ left: `${displayPct}%` }}
      />
    </div>
  );
};

export const ClinicalRiskSummaryCard: React.FC<ClinicalRiskSummaryCardProps> = ({
  analysisResult,
  onOpenFullReport,
  onConsultDoctor,
}) => {
  const { isVi } = useLanguage();
  const [isBiomarkersOpen, setIsBiomarkersOpen] = useState(true);
  const [biomarkerMode, setBiomarkerMode] = useState<'cards' | 'table'>('cards');

  const score = Math.round(
    analysisResult.overallVascularRiskScore ?? analysisResult.riskScore ?? 0
  );

  const getComputedRiskLevel = (s: number): 'Low' | 'Moderate' | 'High' | 'Critical' => {
    if (s >= 80) return 'Critical';
    if (s >= 65) return 'High';
    if (s >= 40) return 'Moderate';
    return 'Low';
  };

  const riskLevel = getComputedRiskLevel(score);

  const rawCvdScore = analysisResult.cardiovascularRisk?.score ?? 0;
  const cvdLevel = getComputedRiskLevel(rawCvdScore);

  const rawDrScore = analysisResult.diabeticRetinopathyRisk?.score ?? 0;
  const drLevel = getComputedRiskLevel(rawDrScore);
  const hasMacularEdema = analysisResult.diabeticRetinopathyRisk?.macularEdemaPresent ?? (rawDrScore >= 50);

  const isDoctorReviewed =
    analysisResult.status === 'REVIEWED' || Boolean(analysisResult.digitalSignature);

  // Biomarkers data - An toàn lâm sàng: Không tự ý fallback số lý tưởng giả mạo
  const map = analysisResult.annotatedMap;
  const rawAvRatio = map?.arteryVeinRatio;
  const rawVesselDensity = map?.vesselDensityPercentage;
  const rawTortuosity = map?.tortuosityIndex;
  const rawVcdr = map?.opticCupToDiscRatio;

  const hasAvRatio = typeof rawAvRatio === 'number' && !Number.isNaN(rawAvRatio);
  const hasVesselDensity = typeof rawVesselDensity === 'number' && !Number.isNaN(rawVesselDensity);
  const hasTortuosity = typeof rawTortuosity === 'number' && !Number.isNaN(rawTortuosity);
  const hasVcdr = typeof rawVcdr === 'number' && !Number.isNaN(rawVcdr);

  const rawGlaucomaScore = analysisResult.glaucomaRisk?.score ?? 0;
  const glaucomaScore = useMemo(() => {
    if (rawGlaucomaScore > 0) return rawGlaucomaScore;
    if (hasVcdr && typeof rawVcdr === 'number' && rawVcdr > 0) {
      if (rawVcdr >= 0.70) return Math.min(95, Math.round(75 + (rawVcdr - 0.70) * 100));
      if (rawVcdr >= 0.60) return Math.min(74, Math.round(60 + (rawVcdr - 0.60) * 140));
      if (rawVcdr >= 0.50) return Math.min(59, Math.round(40 + (rawVcdr - 0.50) * 190));
      return Math.max(10, Math.round(rawVcdr * 60));
    }
    return 0;
  }, [rawGlaucomaScore, hasVcdr, rawVcdr]);

  const glaucomaLevel =
    analysisResult.glaucomaRisk?.level &&
    analysisResult.glaucomaRisk.level !== 'Low' &&
    rawGlaucomaScore > 0
      ? analysisResult.glaucomaRisk.level
      : getComputedRiskLevel(glaucomaScore);

  const isAvNormal = hasAvRatio ? rawAvRatio >= 0.67 : false;
  const isDensityNormal = hasVesselDensity ? rawVesselDensity >= 15.5 && rawVesselDensity <= 19.0 : false;
  const isTortuosityNormal = hasTortuosity ? rawTortuosity < 1.25 : false;
  const isVcdrNormal = hasVcdr ? rawVcdr < 0.5 : false;

  // Banner color configuration based on risk level
  const bannerBg =
    riskLevel === 'Critical'
      ? 'from-red-950 via-rose-900 to-red-900 text-white'
      : riskLevel === 'High'
      ? 'from-orange-950 via-amber-900 to-orange-900 text-white'
      : riskLevel === 'Moderate'
      ? 'from-amber-900/90 via-yellow-900/80 to-amber-950 text-white'
      : 'from-[#115E59] via-[#0D9488] to-[#0891B2] text-white';

  // Danh sách nhận định và khuyến nghị được phân tách ngắn gọn
  const findingsItems = useMemo(
    () =>
      parseClinicalPoints(
        analysisResult.findings,
        isVi
          ? [
              'Cung mạch thái dương và mạng lưới vi mạch võng mạc phân bố đồng đều.',
              'Không phát hiện dấu hiệu xuất huyết võng mạc hay vi phình mạch.',
              'Chưa ghi nhận biến đổi bệnh lý vi tuần hoàn đáy mắt tại thời điểm ghi hình.',
            ]
          : [
              'Temporal arcades and retinal microvascular network are evenly distributed.',
              'No retinal hemorrhages or microaneurysms detected.',
              'No microcirculatory pathological changes observed at time of imaging.',
            ]
      ),
    [analysisResult.findings, isVi]
  );

  const recommendationItems = useMemo(
    () =>
      parseClinicalPoints(
        analysisResult.recommendations,
        isVi
          ? [
              'Duy trì khám mắt định kỳ 6-12 tháng/lần để theo dõi sức khỏe vi tuần hoàn võng mạc.',
              'Kiểm soát huyết áp và chỉ số đường huyết trong giới hạn bình thường.',
              'Duy trì chế độ dinh dưỡng lành mạnh và lối sống vận động thường xuyên.',
            ]
          : [
              'Maintain routine 6-12 month eye exams to monitor microcirculatory health.',
              'Maintain blood pressure and blood glucose within target normal ranges.',
              'Adhere to a balanced diet and regular physical activity routine.',
            ]
      ),
    [analysisResult.recommendations, isVi]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-medical-card overflow-hidden space-y-6">
      {/* 1. BANNER MỨC ĐỘ NGUY CƠ TỔNG HỢP */}
      <div className={`bg-gradient-to-r ${bannerBg} p-6 sm:p-7 relative overflow-hidden`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                {isVi ? 'Đánh Giá Nguy Cơ Vi Mạch' : 'Microvascular Risk Summary'}
              </span>
              {isDoctorReviewed ? (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 font-bold border border-emerald-400/40 flex items-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  {isVi ? 'Đã Thẩm Định Bởi Bác Sĩ' : 'Doctor Verified'}
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-100 font-bold border border-amber-400/30 flex items-center gap-1.5 backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-200" />
                  {isVi ? 'Chờ Bác Sĩ Thẩm Định' : 'Pending Review'}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isVi ? 'Chỉ Số Nguy Cơ:' : 'Risk Score:'}
              </h2>
              <span className="text-3xl sm:text-4xl font-black font-mono-data">
                {score}
                <span className="text-lg sm:text-xl font-normal opacity-80">/100</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <RiskBadge level={riskLevel} size="lg" className="shadow-xs font-bold" />
              <p className="text-xs text-white/90">
                {riskLevel === 'Low' && (isVi ? 'Mạch máu mắt bình thường, nguy cơ tim mạch thấp.' : 'Normal vessels, low cardiovascular risk.')}
                {riskLevel === 'Moderate' && (isVi ? 'Có dấu hiệu co thắt nhẹ mạch máu mắt.' : 'Mild microvascular narrowing detected.')}
                {riskLevel === 'High' && (isVi ? 'Phát hiện tổn thương mạch máu, nên đi khám sớm.' : 'Significant vascular lesions detected.')}
                {riskLevel === 'Critical' && (isVi ? 'Nguy cơ cao biến chứng mạch máu, cần khám chuyên khoa ngay.' : 'High vascular risk, urgent specialist consult needed.')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="md"
              onClick={onOpenFullReport}
              className="bg-white text-slate-900 hover:bg-slate-50 border-white/60 font-bold shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              {isVi ? 'In Báo Cáo' : 'Print Report'}
            </Button>
            {onConsultDoctor && (
              <Button
                variant="primary"
                size="md"
                onClick={onConsultDoctor}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {isVi ? 'Tư Vấn Bác Sĩ' : 'Consult Doctor'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* 2. 3 THẺ NGUY CƠ THÀNH PHẦN - TRỰC QUAN & TINH GỌN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Cardiovascular */}
          <div className="p-4 rounded-xl border border-rose-200/80 bg-gradient-to-b from-white to-rose-50/20 hover:border-rose-300 transition-all shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <Heart className="w-4 h-4" />
                </div>
                <span>{isVi ? 'Nguy cơ tim mạch' : 'Cardiovascular Risk'}</span>
              </div>
              <RiskBadge level={cvdLevel} size="sm" />
            </div>

            {/* Điểm số & Thanh đo rủi ro */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">{isVi ? 'Điểm nguy cơ:' : 'Risk score:'}</span>
                <span className="text-lg font-black font-mono-data text-slate-900">
                  {rawCvdScore}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rawCvdScore >= 80
                      ? 'bg-[#DC2626]'
                      : rawCvdScore >= 65
                      ? 'bg-[#EA580C]'
                      : rawCvdScore >= 40
                      ? 'bg-[#D97706]'
                      : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, rawCvdScore))}%` }}
                />
              </div>
            </div>

            {/* Hai thông số thành phần dạng chip */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Huyết áp võng mạc' : 'Retinal BP'}</span>
                <strong className="text-slate-800 font-semibold truncate block mt-0.5" title={formatHypertensionStage(analysisResult.cardiovascularRisk?.hypertensionStage, isVi)}>
                  {formatHypertensionStage(analysisResult.cardiovascularRisk?.hypertensionStage, isVi)}
                </strong>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Nguy cơ đột quỵ 3 năm' : '3-Year Stroke'}</span>
                <strong className="text-slate-900 font-black font-mono-data block mt-0.5">
                  {analysisResult.cardiovascularRisk?.threeYearStrokeRiskPercent != null
                    ? `${analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent}%`
                    : (isVi ? 'Chưa xác định' : 'Undetermined')}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Diabetic Retinopathy */}
          <div className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 hover:border-amber-300 transition-all shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Eye className="w-4 h-4" />
                </div>
                <span>{isVi ? 'Võng mạc tiểu đường' : 'Diabetic Retinopathy'}</span>
              </div>
              <RiskBadge level={drLevel} size="sm" />
            </div>

            {/* Điểm số & Thanh đo rủi ro */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">{isVi ? 'Điểm nguy cơ:' : 'Risk score:'}</span>
                <span className="text-lg font-black font-mono-data text-slate-900">
                  {rawDrScore}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rawDrScore >= 80
                      ? 'bg-[#DC2626]'
                      : rawDrScore >= 65
                      ? 'bg-[#EA580C]'
                      : rawDrScore >= 40
                      ? 'bg-[#D97706]'
                      : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, rawDrScore))}%` }}
                />
              </div>
            </div>

            {/* Hai thông số thành phần dạng chip */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Phân độ ETDRS' : 'ETDRS Grade'}</span>
                <strong className="text-slate-800 font-semibold truncate block mt-0.5" title={analysisResult.diabeticRetinopathyRisk?.etdrsGrade}>
                  {formatEtdrsGrade(analysisResult.diabeticRetinopathyRisk?.etdrsGrade, rawDrScore, drLevel, isVi)}
                </strong>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Phù hoàng điểm' : 'Macular Edema'}</span>
                <strong className={`font-semibold block mt-0.5 ${hasMacularEdema ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {hasMacularEdema ? (isVi ? 'Có phát hiện' : 'Detected') : (isVi ? 'Không phát hiện' : 'None')}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 3: Glaucoma */}
          <div className="p-4 rounded-xl border border-teal-200/80 bg-gradient-to-b from-white to-teal-50/20 hover:border-teal-300 transition-all shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                  <Activity className="w-4 h-4" />
                </div>
                <span>{isVi ? 'Tăng nhãn áp' : 'Glaucoma Risk'}</span>
              </div>
              <RiskBadge level={glaucomaLevel} size="sm" />
            </div>

            {/* Điểm số & Thanh đo rủi ro */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">{isVi ? 'Điểm nguy cơ:' : 'Risk score:'}</span>
                <span className="text-lg font-black font-mono-data text-slate-900">
                  {glaucomaScore}
                  <span className="text-xs text-slate-400 font-normal">/100</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    glaucomaScore >= 80
                      ? 'bg-[#DC2626]'
                      : glaucomaScore >= 65
                      ? 'bg-[#EA580C]'
                      : glaucomaScore >= 40
                      ? 'bg-[#D97706]'
                      : 'bg-[#16A34A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, glaucomaScore))}%` }}
                />
              </div>
            </div>

            {/* Hai thông số thành phần dạng chip */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Tỷ lệ lõm gai thị' : 'Cup-to-Disc Ratio'}</span>
                <strong className="text-slate-800 font-mono-data font-semibold block mt-0.5">
                  {hasVcdr ? rawVcdr.toFixed(2) : (isVi ? 'Chưa xác định' : 'Undetermined')}
                </strong>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
                <span className="text-[10px] text-slate-400 block font-medium">{isVi ? 'Trạng thái gai thị' : 'Optic Disc Status'}</span>
                {hasVcdr ? (
                  <strong className={`font-semibold truncate block mt-0.5 ${isVcdrNormal ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isVcdrNormal ? (isVi ? 'Bình thường (< 0.50)' : 'Normal (< 0.50)') : (isVi ? 'Lõm gai rộng' : 'Enlarged')}
                  </strong>
                ) : (
                  <strong className="text-slate-400 font-medium block mt-0.5">{isVi ? 'Chưa đo được' : 'Not measured'}</strong>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. BẢNG CHỈ SỐ SINH HỌC VI MẠCH - CHẾ ĐỘ XEM TRỰC QUAN (Visual Cards) HOẶC BẢNG */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          {/* Header thanh công cụ thông số vi mạch */}
          <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" />
                {isVi ? 'Chỉ Số Vi Mạch' : 'Microvascular Biomarkers'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isVi ? 'Các chỉ số đo lường mạng lưới mạch máu mắt.' : 'Measurements of retinal microvasculature.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Nút chuyển chế độ Trực quan / Bảng */}
              <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setBiomarkerMode('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    biomarkerMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isVi ? 'Chế độ thẻ trực quan' : 'Visual cards mode'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isVi ? 'Trực quan' : 'Visual'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBiomarkerMode('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    biomarkerMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={isVi ? 'Chế độ bảng chi tiết' : 'Detailed table mode'}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isVi ? 'Dạng bảng' : 'Table'}</span>
                </button>
              </div>

              {/* Nút thu gọn / mở rộng */}
              <button
                type="button"
                onClick={() => setIsBiomarkersOpen(!isBiomarkersOpen)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <span>{isBiomarkersOpen ? (isVi ? 'Thu gọn ▲' : 'Collapse ▲') : (isVi ? 'Xem 4 chỉ số ▼' : 'Expand ▼')}</span>
              </button>
            </div>
          </div>

          {/* Nội dung chỉ số khi mở */}
          {isBiomarkersOpen && (
            <div className="p-4 bg-slate-50/40">
              {/* CHẾ ĐỘ 1: THẺ TRỰC QUAN (Visual Metric Cards) */}
              {biomarkerMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Biomarker 1: A/V Ratio */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate" title={isVi ? 'Tỷ lệ Động mạch / Tĩnh mạch' : 'Arteriovenous Ratio'}>
                          {isVi ? 'Tỷ Lệ Động - Tĩnh Mạch' : 'Arteriovenous Ratio'}
                        </span>
                        {hasAvRatio ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 ${
                              isAvNormal
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isAvNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {isAvNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Cần lưu ý' : 'Attention')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {isVi ? 'Chưa đo được' : 'Not measured'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono-data text-slate-900">
                          {hasAvRatio ? rawAvRatio.toFixed(2) : (isVi ? 'Chưa xác định' : 'Undetermined')}
                        </span>
                        <span className="text-[11px] text-slate-400">{isVi ? 'Động / Tĩnh' : 'A / V'}</span>
                      </div>

                      {/* Visual Range Bar */}
                      <BiomarkerRangeBar
                        value={rawAvRatio}
                        min={0.4}
                        max={0.9}
                        targetMin={0.67}
                        targetMax={0.9}
                        isNormal={isAvNormal}
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-data">
                        <span>{isVi ? 'Chuẩn: ≥ 0.67 (2:3)' : 'Ref: ≥ 0.67 (2:3)'}</span>
                        <span className={isAvNormal ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {hasAvRatio ? (isAvNormal ? (isVi ? 'Đạt chuẩn' : 'Normal') : (isVi ? 'Co thắt nhẹ' : 'Mild Constriction')) : '---'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                      {hasAvRatio
                        ? isAvNormal
                          ? (isVi ? 'Lòng mạch phân nhánh đồng đều.' : 'Normal branching vascular pattern.')
                          : (isVi ? 'Hẹp nhẹ tiểu động mạch, nghi do HA.' : 'Mild arteriolar narrowing, hypertension suspected.')
                        : (isVi ? 'Chưa đủ dữ liệu để phân tích tỷ lệ.' : 'Insufficient data for ratio analysis.')}
                    </div>
                  </div>

                  {/* Biomarker 2: Vessel Density */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate" title={isVi ? 'Mật độ mao mạch võng mạc' : 'Capillary Density'}>
                          {isVi ? 'Mật Độ Mao Mạch' : 'Capillary Density'}
                        </span>
                        {hasVesselDensity ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 ${
                              isDensityNormal
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isDensityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {isDensityNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Bất thường' : 'Abnormal')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {isVi ? 'Chưa đo được' : 'Not measured'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono-data text-slate-900">
                          {hasVesselDensity ? `${rawVesselDensity.toFixed(1)}%` : (isVi ? 'Chưa xác định' : 'Undetermined')}
                        </span>
                        <span className="text-[11px] text-slate-400">{isVi ? 'Diện tích' : 'Area'}</span>
                      </div>

                      {/* Visual Range Bar */}
                      <BiomarkerRangeBar
                        value={rawVesselDensity}
                        min={12.0}
                        max={22.0}
                        targetMin={15.5}
                        targetMax={19.0}
                        isNormal={isDensityNormal}
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-data">
                        <span>{isVi ? 'Chuẩn: 15.5% – 19.0%' : 'Ref: 15.5% – 19.0%'}</span>
                        <span className={isDensityNormal ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {hasVesselDensity ? (isDensityNormal ? (isVi ? 'Tưới máu tốt' : 'Normal Perfusion') : (isVi ? 'Ngoài chuẩn' : 'Out of range')) : '---'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                      {hasVesselDensity
                        ? isDensityNormal
                          ? (isVi ? 'Mạng lưới mao mạch tưới máu đầy đủ.' : 'Adequate capillary bed perfusion.')
                          : rawVesselDensity < 15.5
                          ? (isVi ? 'Giảm tưới máu, nghi thiếu máu vi mạch.' : 'Reduced perfusion, ischemia suspected.')
                          : (isVi ? 'Tăng sinh mạch bất thường.' : 'Abnormal vessel proliferation.')
                        : (isVi ? 'Chưa đủ dữ liệu đo lường.' : 'Insufficient measurement data.')}
                    </div>
                  </div>

                  {/* Biomarker 3: Tortuosity Index */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate" title={isVi ? 'Độ uốn lượn vi mạch' : 'Vascular Tortuosity'}>
                          {isVi ? 'Độ Uốn Lượn Vi Mạch' : 'Vascular Tortuosity'}
                        </span>
                        {hasTortuosity ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 ${
                              isTortuosityNormal
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isTortuosityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {isTortuosityNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Uốn lượn' : 'Tortuous')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {isVi ? 'Chưa đo được' : 'Not measured'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono-data text-slate-900">
                          {hasTortuosity ? rawTortuosity.toFixed(2) : (isVi ? 'Chưa xác định' : 'Undetermined')}
                        </span>
                        <span className="text-[11px] text-slate-400">{isVi ? 'Chỉ số uốn' : 'Index'}</span>
                      </div>

                      {/* Visual Range Bar */}
                      <BiomarkerRangeBar
                        value={rawTortuosity}
                        min={1.0}
                        max={1.45}
                        targetMin={1.0}
                        targetMax={1.25}
                        isNormal={isTortuosityNormal}
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-data">
                        <span>{isVi ? 'Chuẩn: < 1.25' : 'Ref: < 1.25'}</span>
                        <span className={isTortuosityNormal ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {hasTortuosity ? (isTortuosityNormal ? (isVi ? 'Đều đặn' : 'Smooth') : (isVi ? 'Xoắn vặn' : 'Tortuous')) : '---'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                      {hasTortuosity
                        ? isTortuosityNormal
                          ? (isVi ? 'Đường đi mạch máu đều, không xoắn vặn.' : 'Smooth vascular course, non-tortuous.')
                          : (isVi ? 'Mạch máu uốn lượn, áp lực thành mạch cao.' : 'Tortuous vessels, high mural tension.')
                        : (isVi ? 'Chưa đủ dữ liệu đo độ uốn.' : 'Insufficient data for tortuosity.')}
                    </div>
                  </div>

                  {/* Biomarker 4: Cup-to-Disc Ratio (VCDR) */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate" title={isVi ? 'Tỷ lệ lõm gai thị' : 'Cup-to-Disc Ratio'}>
                          {isVi ? 'Tỷ Lệ Lõm Gai Thị' : 'Cup-to-Disc Ratio'}
                        </span>
                        {hasVcdr ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 ${
                              isVcdrNormal
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isVcdrNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {isVcdrNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Mở rộng' : 'Enlarged')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {isVi ? 'Chưa đo được' : 'Not measured'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono-data text-slate-900">
                          {hasVcdr ? rawVcdr.toFixed(2) : (isVi ? 'Chưa xác định' : 'Undetermined')}
                        </span>
                        <span className="text-[11px] text-slate-400">{isVi ? 'Lõm / Gai' : 'Cup / Disc'}</span>
                      </div>

                      {/* Visual Range Bar */}
                      <BiomarkerRangeBar
                        value={rawVcdr}
                        min={0.2}
                        max={0.8}
                        targetMin={0.2}
                        targetMax={0.5}
                        isNormal={isVcdrNormal}
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-data">
                        <span>{isVi ? 'Chuẩn: < 0.50 (0.3 - 0.45)' : 'Ref: < 0.50 (0.3 - 0.45)'}</span>
                        <span className={isVcdrNormal ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {hasVcdr ? (isVcdrNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Lõm gai rộng' : 'Enlarged Cup')) : '---'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                      {hasVcdr
                        ? isVcdrNormal
                          ? (isVi ? 'Bờ viền thần kinh võng mạc đều, hồng hào.' : 'Healthy neuroretinal rim, well-perfused.')
                          : (isVi ? 'Lõm gai mở rộng, nghi ngờ tăng nhãn áp sớm.' : 'Enlarged cup, early glaucoma suspicion.')
                        : (isVi ? 'Không định vị được bờ gai thị.' : 'Optic disc boundary not localized.')}
                    </div>
                  </div>
                </div>
              ) : (
                /* CHẾ ĐỘ 2: BẢNG DỮ LIỆU CHI TIẾT (Tabular Mode) */
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-4">{isVi ? 'Chỉ số sinh học' : 'Biomarker'}</th>
                        <th className="py-2.5 px-4 text-center">{isVi ? 'Giá trị' : 'Value'}</th>
                        <th className="py-2.5 px-4 text-center">{isVi ? 'Dải chuẩn' : 'Reference Range'}</th>
                        <th className="py-2.5 px-4">{isVi ? 'Đánh giá lâm sàng' : 'Clinical Evaluation'}</th>
                        <th className="py-2.5 px-4 text-center">{isVi ? 'Trạng thái' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {/* 1. AVR */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <div>{isVi ? 'Tỷ lệ động/tĩnh mạch võng mạc' : 'Retinal Arteriovenous Ratio'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Artery-to-Vein Ratio</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono-data font-bold text-slate-900">
                          {hasAvRatio ? rawAvRatio.toFixed(2) : <span className="text-slate-400 font-normal">{isVi ? 'Chưa xác định' : 'Undetermined'}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono-data">
                          ≥ 0.67 (2:3)
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {hasAvRatio
                            ? isAvNormal
                              ? (isVi ? 'Lòng mạch phân nhánh đồng đều, không thấy co thắt.' : 'Uniform vascular branching, no focal constriction.')
                              : (isVi ? 'Hẹp lòng tiểu động mạch, nghi ngờ ảnh hưởng bởi tăng huyết áp.' : 'Arteriolar narrowing, hypertension effect suspected.')
                            : (isVi ? 'Chưa đủ dữ liệu để phân tích tỷ lệ động/tĩnh mạch.' : 'Insufficient data for arteriovenous ratio analysis.')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hasAvRatio ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                isAvNormal
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isAvNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {isAvNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Cần lưu ý' : 'Attention')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              {isVi ? 'Chưa đo được' : 'Not measured'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* 2. Vessel Density */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <div>{isVi ? 'Mật độ mao mạch võng mạc' : 'Retinal Capillary Density'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Retinal Capillary Density</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono-data font-bold text-slate-900">
                          {hasVesselDensity ? `${rawVesselDensity.toFixed(1)}%` : <span className="text-slate-400 font-normal">{isVi ? 'Chưa xác định' : 'Undetermined'}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono-data">
                          15.5% - 19.0%
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {hasVesselDensity
                            ? isDensityNormal
                              ? (isVi ? 'Mạng lưới mao mạch tưới máu đầy đủ.' : 'Adequate capillary bed perfusion.')
                              : rawVesselDensity < 15.5
                              ? (isVi ? 'Giảm tưới máu mao mạch, dấu hiệu thiếu máu cục bộ võng mạc.' : 'Reduced capillary perfusion, ischemic sign.')
                              : (isVi ? 'Tăng sinh mạch máu bất thường.' : 'Abnormal vascular proliferation.')
                            : (isVi ? 'Chưa đủ dữ liệu để phân tích mật độ mao mạch võng mạc.' : 'Insufficient data for capillary density analysis.')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hasVesselDensity ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                isDensityNormal
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isDensityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {isDensityNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Bất thường' : 'Abnormal')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              {isVi ? 'Chưa đo được' : 'Not measured'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* 3. Tortuosity Index */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <div>{isVi ? 'Độ uốn lượn vi mạch' : 'Vascular Curvature Metric'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Vascular Curvature Metric</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono-data font-bold text-slate-900">
                          {hasTortuosity ? rawTortuosity.toFixed(2) : <span className="text-slate-400 font-normal">{isVi ? 'Chưa xác định' : 'Undetermined'}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono-data">
                          &lt; 1.25
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {hasTortuosity
                            ? isTortuosityNormal
                              ? (isVi ? 'Đường đi mạch máu đều đặn, không bị xoắn vặn quá mức.' : 'Smooth vessel course, no excessive tortuosity.')
                              : (isVi ? 'Mạch máu uốn lượn bất thường, phản ánh áp lực thành mạch cao.' : 'Abnormal tortuosity, reflects high wall tension.')
                            : (isVi ? 'Chưa đủ dữ liệu để đo lường độ cong vi mạch võng mạc.' : 'Insufficient data for retinal vascular curvature.')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hasTortuosity ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                isTortuosityNormal
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isTortuosityNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {isTortuosityNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Uốn lượn' : 'Tortuous')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              {isVi ? 'Chưa đo được' : 'Not measured'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* 4. Optic Cup-to-Disc Ratio */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <div>{isVi ? 'Tỷ lệ lõm gai thị' : 'Vertical Cup-to-Disc Ratio'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Vertical Cup-to-Disc Ratio</div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono-data font-bold text-slate-900">
                          {hasVcdr ? rawVcdr.toFixed(2) : <span className="text-slate-400 font-normal">{isVi ? 'Chưa xác định' : 'Undetermined'}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 font-mono-data">
                          &lt; 0.50 {isVi ? '(Chuẩn 0.30 - 0.45)' : '(Ref: 0.30 - 0.45)'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {hasVcdr
                            ? isVcdrNormal
                              ? (isVi ? 'Gai thị hồng, viền thần kinh võng mạc đều, không tổn hại.' : 'Pink disc, intact neuroretinal rim, no damage.')
                              : (isVi ? 'Lõm gai thị mở rộng, nguy cơ tổn hại sợi thần kinh thị giác trong bệnh tăng nhãn áp.' : 'Enlarged cupping, risk of optic nerve fiber damage in glaucoma.')
                            : (isVi ? 'Gai thị không nằm trong trường nhìn hoặc chưa định vị rõ bờ gai thị.' : 'Optic disc not in field of view or margin undefined.')}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hasVcdr ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                isVcdrNormal
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isVcdrNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {isVcdrNormal ? (isVi ? 'Bình thường' : 'Normal') : (isVi ? 'Nghi ngờ tăng nhãn áp' : 'Glaucoma Suspicion')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                              {isVi ? 'Chưa đo được' : 'Not measured'}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. NHẬN ĐỊNH LÂM SÀNG & KHUYẾN NGHỊ Y KHOA */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Nhận định AI */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                      {isVi ? 'Nhận định lâm sàng từ AI' : 'Clinical AI Findings'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isVi ? 'Đặc điểm mạch máu và đáy mắt' : 'Retinal vascular morphology'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 shrink-0">
                  {isVi ? 'Phân tích ảnh' : 'Image Analysis'}
                </span>
              </div>

              <div className="space-y-2.5 text-sm sm:text-base text-black leading-relaxed">
                {findingsItems.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-300 shadow-2xs hover:border-sky-300 transition-colors"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-600 ring-4 ring-sky-100 shrink-0 mt-1.5" />
                    <span className="leading-relaxed text-black font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Khuyến nghị y khoa */}
            <div className="p-4 sm:p-5 rounded-xl border border-teal-200/80 bg-teal-50/30 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-teal-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-700 shrink-0">
                    <FileBadge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-950 tracking-tight">
                      {isVi ? 'Khuyến nghị y khoa & theo dõi' : 'Advice & Follow-up'}
                    </h4>
                    <p className="text-[11px] text-teal-700/80 mt-0.5">
                      {isVi ? 'Chế độ sinh hoạt và lịch tái khám' : 'Care plan and follow-up'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-teal-100/80 text-teal-800 border border-teal-200/60 shrink-0">
                  {isVi ? 'Khuyến nghị' : 'Recommendation'}
                </span>
              </div>

              <div className="space-y-2.5 text-sm sm:text-base text-black leading-relaxed">
                {recommendationItems.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white border border-teal-300 shadow-2xs hover:border-teal-400 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-black font-medium">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ghi chú thẩm định từ Bác sĩ phụ trách */}
          {analysisResult.doctorNotes && (
            <div className="p-4 sm:p-5 rounded-2xl border border-teal-300 bg-white space-y-2.5 shadow-xs border-l-4 border-l-teal-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                    <UserCheck className="w-4 h-4 text-teal-700" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-teal-950">
                    {isVi ? 'Ghi chú thẩm định từ bác sĩ phụ trách' : 'Doctor Notes'}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-100/80 text-teal-800 border border-teal-200/60 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  {analysisResult.doctorName || (isVi ? 'Bác sĩ chuyên khoa' : 'Attending Specialist')}
                </span>
              </div>
              <p className="text-sm sm:text-base text-black font-medium pl-7 border-l-3 border-teal-500 ml-2 py-1 leading-relaxed whitespace-pre-line">
                "{analysisResult.doctorNotes}"
              </p>
            </div>
          )}
        </div>

        {/* 5. MEDICAL DISCLAIMER BẮT BUỘC (CDS Mandatory Disclaimer) */}
        <MedicalDisclaimer variant="banner" />

        {/* 6. NÚT BẤM HÀNH ĐỘNG CUỐI CARD */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="md"
            onClick={onOpenFullReport}
            className="text-xs font-bold gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4 text-brand-600" />
            {isVi ? 'In Báo Cáo' : 'Print Report'}
          </Button>
          {onConsultDoctor && (
            <Button
              variant="primary"
              size="md"
              onClick={onConsultDoctor}
              className="text-xs font-bold gap-2 shadow-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <MessageSquare className="w-4 h-4" />
              {isVi ? 'Tư Vấn Bác Sĩ' : 'Consult Doctor'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
