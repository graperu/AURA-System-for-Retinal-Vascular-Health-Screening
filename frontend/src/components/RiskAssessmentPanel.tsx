import React from 'react';
import { AIRiskResult } from '../types/cds';
import { Heart, Activity, BrainCircuit, Eye } from 'lucide-react';
import { Card } from './ui/Card';
import { RiskBadge } from './ui/RiskBadge';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';

interface RiskAssessmentPanelProps {
  result: AIRiskResult;
}

const formatHypertensionStage = (stage?: string | null, isVi = true): string => {
  if (!stage) return isVi ? 'Giai đoạn 0 (Huyết áp bình thường)' : 'Stage 0 (Normal)';
  const upper = stage.toUpperCase();
  if (upper === 'LOW' || upper === 'NORMAL' || upper === '0' || upper.includes('STAGE_0') || upper.includes('STAGE 0')) {
    return isVi ? 'Giai đoạn 0 (Huyết áp bình thường)' : 'Stage 0 (Normal)';
  }
  if (upper === 'MODERATE' || upper === 'MEDIUM' || upper.includes('STAGE_1') || upper.includes('STAGE 1')) {
    return isVi ? 'Giai đoạn 1 (Co nhẹ vi mạch)' : 'Stage 1 (Mild Narrowing)';
  }
  if (upper === 'HIGH' || upper.includes('STAGE_2') || upper.includes('STAGE 2')) {
    return isVi ? 'Giai đoạn 2 (Tăng áp rõ)' : 'Stage 2 (Moderate)';
  }
  if (upper === 'CRITICAL' || upper === 'SEVERE' || upper.includes('STAGE_3') || upper.includes('STAGE 3')) {
    return isVi ? 'Giai đoạn 3 (Khẩn cấp / Áp lực cao)' : 'Stage 3 (Crisis)';
  }
  return stage;
};

const formatEtdrsGrade = (grade?: string | null, isVi = true): string => {
  if (!grade) return isVi ? 'Cấp độ 0 (Bình thường)' : 'Grade 0 (Normal)';
  if (grade.toLowerCase().includes('không dr') || grade.toLowerCase().includes('no dr')) {
    return isVi ? 'Cấp độ 0 (Bình thường)' : 'Grade 0 (Normal)';
  }
  return grade;
};

export const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({ result }) => {
  const { isVi } = useLanguage();

  const getGaugeColor = (score: number) => {
    if (score < 30) return '#16A34A';
    if (score < 60) return '#D97706';
    if (score < 80) return '#EA580C';
    return '#DC2626';
  };

  const avRatio = Number(result?.annotatedMap?.arteryVeinRatio) || 0;
  const vesselDensity = Number(result?.annotatedMap?.vesselDensityPercentage) || 0;
  const tortuosity = Number(result?.annotatedMap?.tortuosityIndex) || 0;
  const vcdr = Number(result?.annotatedMap?.opticCupToDiscRatio) || 0;

  return (
    <Card padding="md" className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-clinical-border pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            {isVi
              ? 'Đánh Giá Nguy Cơ Lâm Sàng AI (Tim Mạch • Đột Quỵ • ĐTĐ)'
              : 'AI Clinical Risk Assessment (Cardiovascular • Stroke • DR)'}
          </h2>
          <p className="text-xs text-clinical-text-muted mt-0.5">
            {isVi
              ? 'Định lượng rủi ro Y tế dựa trên phân tích hình thái vi mạch võng mạc kết hợp thuật toán AI.'
              : 'Quantitative medical risk based on retinal microvascular morphology combined with AI algorithms.'}
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-clinical-border text-right font-mono-data">
          <span className="text-[11px] text-clinical-text-muted block font-sans">
            {isVi ? 'Tổng Điểm Nguy Cơ:' : 'Overall Risk Score:'}
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: getGaugeColor(result.overallVascularRiskScore) }}
          >
            {result.overallVascularRiskScore}/100
          </span>
        </div>
      </div>

      {/* 3 Core Risk Pillar Cards: Tim Mạch, Tiểu Đường, Đột Quỵ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Nguy Cơ Tim Mạch */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/70 space-y-3 shadow-2xs hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-600" />
              {isVi ? 'Nguy Cơ Tim Mạch' : 'Cardiovascular Risk'}
            </span>
            <RiskBadge level={result.cardiovascularRisk?.level} size="sm" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.cardiovascularRisk?.score ?? 0}%
            </span>
            <span className="text-[11px] text-clinical-text-muted">
              {formatHypertensionStage(result.cardiovascularRisk?.hypertensionStage, isVi)}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, result.cardiovascularRisk?.score ?? 0)}%`,
                backgroundColor: getGaugeColor(result.cardiovascularRisk?.score ?? 0),
              }}
            />
          </div>
        </div>

        {/* Pillar 2: Nguy Cơ Đột Quỵ */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/70 space-y-3 shadow-2xs hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              {isVi ? 'Nguy Cơ Đột Quỵ' : 'Stroke Risk'}
            </span>
            <RiskBadge level={result.cardiovascularRisk?.level} size="sm" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.cardiovascularRisk?.threeYearStrokeRiskPercent ?? 0}%
            </span>
            <span className="text-[11px] text-clinical-text-muted">
              {isVi ? 'Ước tính nguy cơ 3 năm' : '3-year estimate'}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, result.cardiovascularRisk?.threeYearStrokeRiskPercent ?? 0)}%`,
                backgroundColor: getGaugeColor(result.cardiovascularRisk?.threeYearStrokeRiskPercent ?? 0),
              }}
            />
          </div>
        </div>

        {/* Pillar 3: Nguy Cơ Bệnh Võng Mạc ĐTĐ */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/70 space-y-3 shadow-2xs hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-600" />
              {isVi ? 'Bệnh Võng Mạc ĐTĐ' : 'Diabetic Retinopathy'}
            </span>
            <RiskBadge level={result.diabeticRetinopathyRisk?.level} size="sm" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.diabeticRetinopathyRisk?.score ?? 0}%
            </span>
            <span className="text-[11px] text-clinical-text-muted">
              {formatEtdrsGrade(result.diabeticRetinopathyRisk?.etdrsGrade, isVi)}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, result.diabeticRetinopathyRisk?.score ?? 0)}%`,
                backgroundColor: getGaugeColor(result.diabeticRetinopathyRisk?.score ?? 0),
              }}
            />
          </div>
        </div>
      </div>

      {/* Retinal Biomarkers Data Grid */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-text-muted">
          {isVi
            ? 'Thông Số Sinh Học Vi Mạch Võng Mạc'
            : 'Retinal Microvascular Biomarkers'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Biomarker 1: Tỷ lệ A/V */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block">
                {isVi ? 'Tỷ lệ Động/Tĩnh mạch' : 'A/V Ratio'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${avRatio >= 0.67 || avRatio === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {avRatio >= 0.67 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Co thắt' : 'Constricted')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-cyan-900 block">
              {avRatio ? avRatio.toFixed(2) : '0.67'}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: ≥ 0.67' : 'Ref: ≥ 0.67'}
            </span>
          </div>

          {/* Biomarker 2: Mật độ tưới máu vi mạch */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block">
                {isVi ? 'Mật độ tưới máu' : 'Capillary Density'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${vesselDensity >= 15.5 || vesselDensity === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {vesselDensity >= 15.5 || vesselDensity === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Giảm' : 'Low')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-teal-900 block">
              {vesselDensity ? vesselDensity.toFixed(1) : '18.4'}%
            </span>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: 15.5 - 19.0%' : 'Ref: 15.5 - 19.0%'}
            </span>
          </div>

          {/* Biomarker 3: Độ uốn lượn mạch máu */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block">
                {isVi ? 'Độ uốn lượn' : 'Vascular Tortuosity'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${tortuosity < 1.25 || tortuosity === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {tortuosity < 1.25 || tortuosity === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Uốn lượn' : 'High')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {tortuosity ? tortuosity.toFixed(2) : '1.12'}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: < 1.25' : 'Ref: < 1.25'}
            </span>
          </div>

          {/* Biomarker 4: Tỷ lệ lõm gai thị (C/D) */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block">
                {isVi ? 'Lõm gai thị (C/D)' : 'Cup-to-Disc Ratio'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${vcdr < 0.50 || vcdr === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {vcdr < 0.50 || vcdr === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Lõm rộng' : 'High')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {vcdr ? vcdr.toFixed(2) : '0.32'}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: < 0.50' : 'Ref: < 0.50'}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Medical Safety Disclaimer */}
      <MedicalDisclaimer variant="compact" />
    </Card>
  );
};
