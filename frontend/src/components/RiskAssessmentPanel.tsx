import React from 'react';
import { AIRiskResult, RiskLevel } from '../types/cds';
import { Heart, Activity, BrainCircuit, Sparkles, AlertTriangle, ShieldCheck, Eye } from 'lucide-react';

interface RiskAssessmentPanelProps {
  result: AIRiskResult;
}

export const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({ result }) => {
  const getBadgeStyle = (level: RiskLevel) => {
    switch (level) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'High':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Severe':
        return 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse';
    }
  };

  const getGaugeColor = (score: number) => {
    if (score < 30) return '#16A34A';
    if (score < 60) return '#EAB308';
    if (score < 80) return '#F97316';
    return '#DC2626';
  };

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0891B2]" />
            Thanh Đánh Giá Nguy Cơ Lâm Sàng AI (Tim Mạch • Tiểu Đường • Đột Quỵ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Định lượng rủi ro Y tế dựa trên thuật toán ResNet50-VesselNet phân tích cấu trúc vi mạch võng mạc.
          </p>
        </div>
        <div className="bg-[#F0FDFA] px-4 py-2 rounded-xl border border-[#CCFBF1] text-right font-mono-data">
          <span className="text-[11px] text-slate-500 block">Tổng Điểm Rủi Ro Hệ Thống:</span>
          <span className="text-2xl font-bold text-[#DC2626]">{result.overallVascularRiskScore}/100</span>
        </div>
      </div>

      {/* 3 Core Risk Pillar Cards: Tim Mạch, Tiểu Đường, Đột Quỵ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Nguy Cơ Tim Mạch */}
        <div className="p-4 rounded-xl border border-slate-200 bg-[#F0FDFA] space-y-3 relative overflow-hidden shadow-xs hover:border-[#0891B2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#DC2626]" />
              Nguy Cơ Tim Mạch
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(result.cardiovascularRisk.level)}`}>
              Mức {result.cardiovascularRisk.level}
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold font-mono-data text-[#134E4A]">
              {result.cardiovascularRisk.score}%
            </span>
            <span className="text-[11px] text-slate-600 font-medium mb-1">
              Tăng Huyết Áp Giai Đoạn II
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${result.cardiovascularRisk.score}%`,
                backgroundColor: getGaugeColor(result.cardiovascularRisk.score),
              }}
            ></div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono-data flex justify-between pt-1">
            <span>Tỷ lệ A/V Ratio: <strong>{result.annotatedMap.arteryVeinRatio}</strong></span>
            <span>Chỉ số Uốn: <strong>{result.annotatedMap.tortuosityIndex}</strong></span>
          </div>
        </div>

        {/* Pillar 2: Nguy Cơ Tiểu Đường (Diabetic Retinopathy) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-[#F0FDFA] space-y-3 relative overflow-hidden shadow-xs hover:border-[#0891B2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#0891B2]" />
              Võng Mạc Đái Tháo Đường
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(result.diabeticRetinopathyRisk.level)}`}>
              Mức {result.diabeticRetinopathyRisk.level}
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold font-mono-data text-[#134E4A]">
              {result.diabeticRetinopathyRisk.score}%
            </span>
            <span className="text-[11px] text-slate-600 font-medium mb-1">
              Phân loại ETDRS Grade 43
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${result.diabeticRetinopathyRisk.score}%`,
                backgroundColor: getGaugeColor(result.diabeticRetinopathyRisk.score),
              }}
            ></div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono-data flex justify-between pt-1">
            <span>Phù hoàng điểm: <strong>CÓ</strong></span>
            <span>Mật độ mạch: <strong>{result.annotatedMap.vesselDensityPercentage}%</strong></span>
          </div>
        </div>

        {/* Pillar 3: Nguy Cơ Đột Quỵ (3-Year Stroke Risk) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-[#F0FDFA] space-y-3 relative overflow-hidden shadow-xs hover:border-[#0891B2] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-[#9333EA]" />
              Dự Báo Đột Quỵ (3 Năm)
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
              Chỉ số {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold font-mono-data text-[#9333EA]">
              {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
            </span>
            <span className="text-[11px] text-slate-600 font-medium mb-1">
              Nguy cơ biến cố mạch máu não
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 bg-[#9333EA]"
              style={{ width: `${result.cardiovascularRisk.threeYearStrokeRiskPercent * 3}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono-data flex justify-between pt-1">
            <span>Dấu hiệu Gunn Sign: <strong>Co hẹp A/V</strong></span>
            <span>Độ tin cậy AI: <strong>94.2%</strong></span>
          </div>
        </div>
      </div>

      {/* Biomarker Summary Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider mb-3 font-mono-data">
          Thông Số Sinh Học Vi Mạch Võng Mạc Chi Tiết (Retinal Biomarkers):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-200">
          <div className="px-2">
            <span className="text-xs text-slate-500 block">Tỷ lệ Động/Tĩnh mạch A/V</span>
            <span className="text-lg font-bold font-mono-data text-[#DC2626]">
              {result.annotatedMap.arteryVeinRatio}
            </span>
            <span className="text-[10px] text-slate-400 block">(Bình thường ≥ 0.67)</span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 block">Độ Uốn Lượn (Tortuosity)</span>
            <span className="text-lg font-bold font-mono-data text-[#134E4A]">
              {result.annotatedMap.tortuosityIndex}
            </span>
            <span className="text-[10px] text-slate-400 block">(Gia tăng uốn lượn)</span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 block">Tỷ lệ C/D Ratio (Optic Cup)</span>
            <span className="text-lg font-bold font-mono-data text-[#16A34A]">
              {result.annotatedMap.opticCupToDiscRatio}
            </span>
            <span className="text-[10px] text-slate-400 block">(An toàn Glaucoma)</span>
          </div>
          <div className="px-2">
            <span className="text-xs text-slate-500 block">Tổn Thương ROI AI Phát Hiện</span>
            <span className="text-lg font-bold font-mono-data text-[#0891B2]">
              {result.annotatedMap.detectedAnomalies.length} Vùng
            </span>
            <span className="text-[10px] text-slate-400 block">(Chờ Bác sĩ xác nhận)</span>
          </div>
        </div>
      </div>

      {/* XAI Explainability Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0891B2]" />
          <h3 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider font-mono-data">
            Lý Giải Nguy Cơ Bằng AI (Explainable AI - XAI Rationale):
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.xaiExplainability.map((card, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5 hover:border-[#0891B2] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#134E4A]">{card.title}</span>
                <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                  Tác động {card.impact}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{card.clinicalRationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
