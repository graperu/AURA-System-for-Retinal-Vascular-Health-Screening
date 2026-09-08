import React from 'react';
import { AIRiskResult, RiskLevel } from '../types/cds';
import { Heart, Activity, BrainCircuit, ShieldCheck, Eye } from 'lucide-react';
import { Card } from './ui/Card';
import { RiskBadge } from './ui/RiskBadge';

interface RiskAssessmentPanelProps {
  result: AIRiskResult;
}

export const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({ result }) => {
  const getGaugeColor = (score: number) => {
    if (score < 30) return '#16A34A';
    if (score < 60) return '#D97706';
    if (score < 80) return '#EA580C';
    return '#DC2626';
  };

  return (
    <Card padding="md" className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-clinical-border pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-clinical-text flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            Đánh Giá Nguy Cơ Lâm Sàng AI (Tim Mạch • Đột Quỵ • ĐTĐ)
          </h2>
          <p className="text-xs text-clinical-text-muted mt-0.5">
            Định lượng rủi ro Y tế dựa trên phân tích hình thái vi mạch võng mạc kết hợp thuật toán AI.
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-clinical-border text-right font-mono-data">
          <span className="text-[11px] text-clinical-text-muted block font-sans">Tổng Điểm Rủi Ro:</span>
          <span className="text-xl font-bold text-red-600">{result.overallVascularRiskScore}/100</span>
        </div>
      </div>

      {/* 3 Core Risk Pillar Cards: Tim Mạch, Tiểu Đường, Đột Quỵ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Nguy Cơ Tim Mạch */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-600" />
              Nguy Cơ Tim Mạch
            </span>
            <RiskBadge level={result.cardiovascularRisk.level} size="sm" />
          </div>

          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.cardiovascularRisk.score}%
            </span>
            <span className="text-[11px] text-clinical-text-muted mb-0.5">
              Tăng Huyết Áp {result.cardiovascularRisk.hypertensionStage}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${result.cardiovascularRisk.score}%`,
                backgroundColor: getGaugeColor(result.cardiovascularRisk.score),
              }}
            />
          </div>
        </div>

        {/* Pillar 2: Nguy Cơ Đột Quỵ */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              Nguy Cơ Đột Quỵ
            </span>
            <RiskBadge level={result.cardiovascularRisk.level} size="sm" />
          </div>

          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
            </span>
            <span className="text-[11px] text-clinical-text-muted mb-0.5">
              Ước tính trong 3 năm
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${result.cardiovascularRisk.threeYearStrokeRiskPercent}%`,
                backgroundColor: getGaugeColor(result.cardiovascularRisk.threeYearStrokeRiskPercent),
              }}
            />
          </div>
        </div>

        {/* Pillar 3: Nguy Cơ Bệnh Võng Mạc ĐTĐ */}
        <div className="p-4 rounded-xl border border-clinical-border bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-teal-600" />
              Bệnh Võng Mạc ĐTĐ
            </span>
            <RiskBadge level={result.diabeticRetinopathyRisk.level} size="sm" />
          </div>

          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono-data text-clinical-text">
              {result.diabeticRetinopathyRisk.score}%
            </span>
            <span className="text-[11px] text-clinical-text-muted mb-0.5">
              Phân độ: {result.diabeticRetinopathyRisk.etdrsGrade}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${result.diabeticRetinopathyRisk.score}%`,
                backgroundColor: getGaugeColor(result.diabeticRetinopathyRisk.score),
              }}
            />
          </div>
        </div>
      </div>

      {/* Retinal Biomarkers Data Grid */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-text-muted">
          Thông Số Sinh Học Vi Mạch Võng Mạc (Retinal Biomarkers)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-lg border border-clinical-border">
            <span className="text-[11px] text-clinical-text-muted block">Tỷ lệ Động-Tĩnh mạch (AVR)</span>
            <span className="text-sm font-bold font-mono-data text-clinical-text">
              {result.annotatedMap.arteryVeinRatio}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Chuẩn: ≥ 0.67</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-clinical-border">
            <span className="text-[11px] text-clinical-text-muted block">Mật độ vi mạch (Density)</span>
            <span className="text-sm font-bold font-mono-data text-clinical-text">
              {result.annotatedMap.vesselDensityPercentage}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Chuẩn: 15.5 - 19.0%</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-clinical-border">
            <span className="text-[11px] text-clinical-text-muted block">Độ uốn lượn (Tortuosity)</span>
            <span className="text-sm font-bold font-mono-data text-clinical-text">
              {result.annotatedMap.tortuosityIndex}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Chuẩn: &lt; 1.25</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-clinical-border">
            <span className="text-[11px] text-clinical-text-muted block">Tỷ lệ Cup/Disc (CDR)</span>
            <span className="text-sm font-bold font-mono-data text-clinical-text">
              {result.annotatedMap.opticCupToDiscRatio}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Chuẩn: &lt; 0.50</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
