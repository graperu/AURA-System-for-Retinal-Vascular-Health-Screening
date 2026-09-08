import React, { useState } from 'react';
import { Eye, Layers, Sliders, Target, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Heart, BrainCircuit, Activity } from 'lucide-react';
import { AIRiskResult, VesselAnomalyRegion } from '../../types/cds';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';

export interface PatientScreeningResultViewProps {
  result: AIRiskResult;
  selectedEye?: string;
  onOpenReportModal?: () => void;
  onOpenChatModal?: () => void;
}

export const PatientScreeningResultView: React.FC<PatientScreeningResultViewProps> = ({
  result,
  selectedEye = 'OD (Mắt Phải)',
  onOpenReportModal,
  onOpenChatModal,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERLAY' | 'HEATMAP' | 'ORIGINAL'>('OVERLAY');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);

  const rawImage = result.imageUrl || '/assets/images/fundus_original.png';
  const heatmapImg = result.annotatedMap?.heatmapUrl || '/assets/images/fundus_heatmap.png';
  const anomalies = result.annotatedMap?.detectedAnomalies || [];

  return (
    <div className="space-y-6">
      {/* 2-Column Clinical Layout: Left 60% Medical Imaging Viewer + Right 40% Clinical Finding Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 60% (7 cols): High-Contrast Dark Imaging Workstation */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 text-white">
            {/* Viewer Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#22D3EE]" />
                  Ảnh Võng Mạc & Grad-CAM Heatmap
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono-data text-[11px] font-bold border border-slate-700">
                  {selectedEye}
                </span>
              </div>

              {/* Viewer Mode Switcher */}
              <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('OVERLAY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'OVERLAY'
                      ? 'bg-[#0891B2] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lớp phủ AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('HEATMAP')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'HEATMAP'
                      ? 'bg-[#0891B2] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ORIGINAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'ORIGINAL'
                      ? 'bg-[#0891B2] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ảnh gốc
                </button>
              </div>
            </div>

            {/* Viewport Controls */}
            <div className="flex items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-400">Độ mờ:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={heatmapOpacity}
                  onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#0891B2] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono-data text-[11px] w-8 text-right text-cyan-300 font-bold">
                  {(heatmapOpacity * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono-data text-[11px] px-1 text-slate-300">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Đặt lại"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Medical Imaging Canvas */}
            <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[380px] sm:min-h-[440px] border border-slate-800">
              <div
                className="relative transition-transform duration-150 flex items-center justify-center p-2"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Base Fundus Image */}
                <img
                  src={rawImage}
                  alt="Ảnh chụp võng mạc"
                  className="max-h-[380px] w-auto object-contain rounded-lg"
                />

                {/* Heatmap Overlay */}
                {(activeTab === 'OVERLAY' || activeTab === 'HEATMAP') && (
                  <img
                    src={heatmapImg}
                    alt="AI Attention Heatmap"
                    className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none cds-canvas-overlay transition-opacity duration-150"
                    style={{
                      opacity: activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity,
                    }}
                  />
                )}

                {/* Detected Anomalies Pinpoints */}
                {anomalies.map((ano) => (
                  <button
                    key={ano.id}
                    onClick={() => setActiveAnomaly(ano)}
                    className="absolute z-20 flex items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/30 text-white transition-transform hover:scale-125"
                    style={{
                      left: `${ano.coordinates.x}%`,
                      top: `${ano.coordinates.y}%`,
                      width: `${Math.max(22, ano.coordinates.width)}px`,
                      height: `${Math.max(22, ano.coordinates.height)}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={ano.description}
                  >
                    <Target className="w-3 h-3 text-amber-300" />
                  </button>
                ))}
              </div>
            </div>

            {activeAnomaly && (
              <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs flex justify-between items-start">
                <div>
                  <span className="font-bold text-amber-400 block">{activeAnomaly.type}</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">{activeAnomaly.description}</p>
                </div>
                <button
                  onClick={() => setActiveAnomaly(null)}
                  className="text-slate-400 hover:text-white font-bold p-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 40% (5 cols): Clinical Health Summary & Guidance Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider block">
                  Phân Tích AI
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Đánh Giá Nguy Cơ Lâm Sàng
                </h3>
              </div>
              <RiskBadge level={result.cardiovascularRisk.level} size="md" />
            </div>

            {/* Risk Scores Details */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    Nguy cơ Tim Mạch 3 năm
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Phân độ huyết áp: {result.cardiovascularRisk.hypertensionStage}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0891B2]" />
                    Bệnh Võng Mạc ĐTĐ
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.diabeticRetinopathyRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Phân độ ETDRS: {result.diabeticRetinopathyRisk.etdrsGrade}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-amber-500" />
                    Nguy Cơ Đột Quỵ 3 năm
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Ước tính thuật toán vi mạch hoàng điểm
                </span>
              </div>
            </div>

            {/* Retinal Biomarkers 4-Grid */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Chỉ Số Vi Mạch Võng Mạc (Biomarkers)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Tỷ lệ A/V Ratio</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.arteryVeinRatio}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Mật độ vi mạch</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.vesselDensityPercentage}%
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Độ uốn lượn</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.tortuosityIndex}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Tỷ lệ Cup/Disc</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.opticCupToDiscRatio}
                  </span>
                </div>
              </div>
            </div>

            {/* Disclaimer & Actions */}
            <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] text-xs text-[#0891B2] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Kết quả hỗ trợ sàng lọc và quyết định lâm sàng. Luôn tham vấn ý kiến Bác sĩ chuyên khoa.</span>
            </div>

            <div className="flex gap-2 pt-2">
              {onOpenReportModal && (
                <Button variant="primary" size="md" className="flex-1" onClick={onOpenReportModal}>
                  Xem Báo Cáo PDF
                </Button>
              )}
              {onOpenChatModal && (
                <Button variant="secondary" size="md" className="flex-1" onClick={onOpenChatModal}>
                  Tư Vấn Bác Sĩ
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
