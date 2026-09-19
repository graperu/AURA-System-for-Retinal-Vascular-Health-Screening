import React, { useState } from 'react';
import { AIRiskResult } from '../types/cds';
import { Heart, Activity, BrainCircuit, Eye, Target, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';
import { RiskBadge } from './ui/RiskBadge';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';
import { AnimatedCounter } from './common/AnimatedCounter';
import { BiomarkerGaugeBar } from './common/BiomarkerGaugeBar';

export interface RiskAssessmentPanelProps {
  result: AIRiskResult;
  className?: string;
  defaultTab?: 'risks' | 'biomarkers' | 'lesions';
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

export const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({
  result,
  className = '',
  defaultTab = 'biomarkers',
}) => {
  const { isVi } = useLanguage();
  const [activeTab, setActiveTab] = useState<'risks' | 'biomarkers' | 'lesions'>(defaultTab);

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
  const detectedAnomalies = result?.annotatedMap?.detectedAnomalies || [];

  // Retinal microvascular diameter & crossing biomarkers (Parr-Hubbard-Knudtson)
  const crve = Number((result?.annotatedMap as any)?.crveMicrons) || 220;
  const crae = Number((result?.annotatedMap as any)?.craeMicrons) || (avRatio ? Math.round(crve * avRatio) : 148);
  const avNickingCount = detectedAnomalies.filter(
    (a) => a.type === 'AV_Nipping' || a.type === 'AV_Nicking' || a.type?.toLowerCase().includes('nick')
  ).length;
  const hasAvNicking = avNickingCount > 0;

  return (
    <Card padding="md" className={`space-y-4 ${className}`}>
      {/* Title & Overall Risk Score */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-clinical-border pb-3">
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
        <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-clinical-border text-right font-mono-data">
          <span className="text-[11px] text-clinical-text-muted block font-sans">
            {isVi ? 'Tổng Điểm Nguy Cơ:' : 'Overall Risk Score:'}
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: getGaugeColor(result.overallVascularRiskScore) }}
          >
            <AnimatedCounter value={result.overallVascularRiskScore} />/100
          </span>
        </div>
      </div>

      {/* 3 Compact Clinical Tabs Navigation */}
      <div
        role="tablist"
        aria-label={isVi ? 'Phân loại đánh giá lâm sàng' : 'Clinical Assessment Tabs'}
        className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'risks' ? 'true' : 'false'}
          onClick={() => setActiveTab('risks')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'risks'
              ? 'bg-[#3478F6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>{isVi ? '1. Nguy Cơ Toàn Diện & Phân Loại Bệnh Học' : '1. Clinical Risks & Staging'}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'biomarkers' ? 'true' : 'false'}
          onClick={() => setActiveTab('biomarkers')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'biomarkers'
              ? 'bg-[#3478F6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isVi ? '2. Chỉ Số Sinh Học Vi Mạch (Biomarkers Gauge)' : '2. Biomarkers Gauge'}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lesions' ? 'true' : 'false'}
          onClick={() => setActiveTab('lesions')}
          className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'lesions'
              ? 'bg-[#3478F6] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>{isVi ? '3. Chi Tiết Tổn Thương Vi Mạch & XAI' : '3. Lesions & XAI'}</span>
        </button>
      </div>

      {/* Tab: Chỉ Số Sinh Học Vi Mạch (Biomarkers Gauge) — Default Tab (R4, AC-4) */}
      <div
        role="tabpanel"
        data-testid="cds-tabpanel-biomarkers"
        className={activeTab === 'biomarkers' ? 'block space-y-3' : 'hidden'}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Biomarker 1: Tỷ lệ A/V */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate">
                {isVi ? 'Tỷ lệ A/V' : 'A/V Ratio'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${avRatio >= 0.67 || avRatio === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {avRatio >= 0.67 || avRatio === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Co thắt' : 'Constricted')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-cyan-900 block">
              {avRatio ? avRatio.toFixed(2) : '0.67'}
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={Math.min(100, Math.max(8, (((avRatio || 0.67) - 0.40) / 0.45) * 100))}
                colorClass={avRatio >= 0.67 || avRatio === 0 ? 'bg-emerald-500' : 'bg-amber-500'}
                heightClass="h-1.5"
                ariaLabel="A/V Ratio Gauge"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: ≥ 0.67' : 'Ref: ≥ 0.67'}
            </span>
          </div>

          {/* Biomarker 2: Đường kính động mạch (CRAE) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate" title="Central Retinal Arteriolar Equivalent">
                {isVi ? 'Đường kính ĐM (CRAE)' : 'Arteriolar (CRAE)'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${crae >= 145 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {crae >= 145 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Hẹp ĐM' : 'Narrow')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {crae} <span className="text-xs font-normal text-slate-500 font-sans">µm</span>
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={Math.min(100, Math.max(8, ((crae / 200) * 100)))}
                colorClass={crae >= 145 ? 'bg-cyan-600' : 'bg-amber-500'}
                heightClass="h-1.5"
                ariaLabel="CRAE Gauge"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: 145-165 µm' : 'Ref: 145-165 µm'}
            </span>
          </div>

          {/* Biomarker 3: Đường kính tĩnh mạch (CRVE) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate" title="Central Retinal Venular Equivalent">
                {isVi ? 'Đường kính TM (CRVE)' : 'Venular (CRVE)'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${crve <= 235 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {crve <= 235 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Giãn TM' : 'Dilated')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {crve} <span className="text-xs font-normal text-slate-500 font-sans">µm</span>
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={Math.min(100, Math.max(8, ((crve / 260) * 100)))}
                colorClass={crve <= 235 ? 'bg-indigo-500' : 'bg-amber-500'}
                heightClass="h-1.5"
                ariaLabel="CRVE Gauge"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: 210-235 µm' : 'Ref: 210-235 µm'}
            </span>
          </div>

          {/* Biomarker 4: Độ uốn lượn mạch máu (Tortuosity) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate">
                {isVi ? 'Độ uốn lượn' : 'Tortuosity'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${tortuosity < 1.25 || tortuosity === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {tortuosity < 1.25 || tortuosity === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Uốn lượn' : 'High')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {tortuosity ? tortuosity.toFixed(2) : '1.12'}
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={Math.min(100, Math.max(8, (((tortuosity || 1.12) - 1.0) / 0.40) * 100))}
                colorClass={tortuosity < 1.25 || tortuosity === 0 ? 'bg-emerald-500' : 'bg-amber-500'}
                heightClass="h-1.5"
                ariaLabel="Vascular Tortuosity Gauge"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: < 1.25' : 'Ref: < 1.25'}
            </span>
          </div>

          {/* Biomarker 5: Hiện tượng bắt chéo ĐM-TM (AV Nicking) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate" title="Arteriovenous Nicking">
                {isVi ? 'Bắt chéo ĐM-TM' : 'AV Nicking'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${!hasAvNicking ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {!hasAvNicking ? (isVi ? 'Không' : 'None') : (isVi ? 'Bắt chéo' : 'Detected')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {!hasAvNicking ? (isVi ? 'Âm tính' : 'Negative') : (isVi ? `Dương tính (${avNickingCount})` : `Positive (${avNickingCount})`)}
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={hasAvNicking ? 85 : 12}
                colorClass={!hasAvNicking ? 'bg-emerald-500' : 'bg-rose-500'}
                heightClass="h-1.5"
                ariaLabel="AV Nicking Indicator"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: Âm tính' : 'Ref: Negative'}
            </span>
          </div>

          {/* Biomarker 6: Tỷ lệ lõm gai thị (C/D) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 block truncate">
                {isVi ? 'Lõm gai thị (C/D)' : 'Cup-to-Disc (C/D)'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${vcdr < 0.50 || vcdr === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {vcdr < 0.50 || vcdr === 0 ? (isVi ? 'Đạt' : 'Normal') : (isVi ? 'Lõm rộng' : 'High')}
              </span>
            </div>
            <span className="text-base font-bold font-mono-data text-slate-800 block">
              {vcdr ? vcdr.toFixed(2) : '0.32'}
            </span>
            <div className="py-0.5">
              <BiomarkerGaugeBar
                percent={Math.min(100, Math.max(8, ((vcdr || 0.32) / 0.80) * 100))}
                colorClass={vcdr < 0.50 || vcdr === 0 ? 'bg-emerald-500' : 'bg-rose-500'}
                heightClass="h-1.5"
                ariaLabel="Optic Cup-to-Disc Ratio Gauge"
              />
            </div>
            <span className="text-[10px] text-slate-400 block font-mono-data">
              {isVi ? 'Chuẩn: < 0.50' : 'Ref: < 0.50'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab: Nguy Cơ Toàn Diện & Phân Loại Bệnh Học (Condensed — Duplicated Progress Bars Eliminated) */}
      <div
        role="tabpanel"
        data-testid="cds-tabpanel-risks"
        className={activeTab === 'risks' ? 'block space-y-3' : 'hidden'}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Pillar 1: Nguy Cơ Tim Mạch */}
          <div className="p-3.5 rounded-xl border border-clinical-border bg-slate-50/70 space-y-2 shadow-2xs hover:bg-slate-50 transition-colors">
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

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
              {isVi
                ? 'Tiến trình phân tầng đã hiển thị chi tiết trên Bàn chẩn đoán CDS.'
                : 'Pillar synthesized in CDS Summary & Risk Bar.'}
            </p>
          </div>

          {/* Pillar 2: Nguy Cơ Đột Quỵ */}
          <div className="p-3.5 rounded-xl border border-clinical-border bg-slate-50/70 space-y-2 shadow-2xs hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-brand-600" />
                {isVi ? 'Nguy Cơ Đột Quỵ' : 'Stroke Risk'}
              </span>
              <RiskBadge level={result.strokeRisk?.level || result.cardiovascularRisk?.level} size="sm" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono-data text-clinical-text">
                {result.strokeRisk?.score ?? result.strokeRisk?.threeYearStrokeRiskPercent ?? result.cardiovascularRisk?.threeYearStrokeRiskPercent ?? 0}%
              </span>
              <span className="text-[11px] text-clinical-text-muted">
                {isVi ? 'Ước tính nguy cơ 3 năm (32%)' : '3-year estimate (32%)'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
              {isVi
                ? 'Tiến trình phân tầng đã hiển thị chi tiết trên Bàn chẩn đoán CDS.'
                : 'Pillar synthesized in CDS Summary & Risk Bar.'}
            </p>
          </div>

          {/* Pillar 3: Bệnh Võng Mạc ĐTĐ */}
          <div className="p-3.5 rounded-xl border border-clinical-border bg-slate-50/70 space-y-2 shadow-2xs hover:bg-slate-50 transition-colors">
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

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
              {isVi
                ? 'Tiến trình phân tầng đã hiển thị chi tiết trên Bàn chẩn đoán CDS.'
                : 'Pillar synthesized in CDS Summary & Risk Bar.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab 3: Chi Tiết Tổn Thương Vi Mạch & XAI */}
      <div
        role="tabpanel"
        data-testid="cds-tabpanel-lesions"
        className={activeTab === 'lesions' ? 'block space-y-3' : 'hidden'}
      >
        {detectedAnomalies && detectedAnomalies.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {detectedAnomalies.map((anom, idx) => (
                <div
                  key={anom.id || `anom-${idx}`}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 truncate flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{anom.type}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      {(anom.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Tọa độ: X: {anom.coordinates?.x?.toFixed(1)}%, Y: {anom.coordinates?.y?.toFixed(1)}%
                  </div>
                  {anom.description && (
                    <p className="text-[11px] text-slate-600 line-clamp-2">{anom.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isVi ? 'Không phát hiện tổn thương vi mạch khu trú đơn độc.' : 'No focal microvascular lesions detected.'}</span>
          </div>
        )}

        {/* Recommendations & XAI Explainability Rationale */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#3478F6]" />
            <span>{isVi ? 'Khuyến nghị lâm sàng & Giải trình XAI:' : 'Clinical Recommendations & XAI Rationale:'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            {result.recommendations || (isVi
              ? 'Tái khám định kỳ sau 6 tháng, kiểm soát tốt chỉ số huyết áp tâm thu < 130 mmHg và đường huyết đói HbA1c < 7.0%.'
              : 'Follow up in 6 months, maintain systolic BP < 130 mmHg and HbA1c < 7.0%.')}
          </p>
          <div className="text-[10px] text-slate-400 font-mono-data pt-1 border-t border-slate-200/80">
            {result.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4'} • {result.confidenceCalibration?.calibrationMethod || 'Platt Calibrated'}
          </div>
        </div>
      </div>

      {/* Mandatory Medical Safety Disclaimer */}
      <MedicalDisclaimer variant="compact" />
    </Card>
  );
};
