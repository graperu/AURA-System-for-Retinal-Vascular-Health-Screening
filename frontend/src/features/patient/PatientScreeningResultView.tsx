import React, { useState } from 'react';
import { Eye, Layers, Sliders, Target, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Heart, BrainCircuit, Activity, AlertCircle } from 'lucide-react';
import { AIRiskResult, VesselAnomalyRegion } from '../../types/cds';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { DynamicHeatmapCanvas } from '../../components/DynamicHeatmapCanvas';

export interface PatientScreeningResultViewProps {
  result: AIRiskResult;
  selectedEye?: string;
  onOpenReportModal?: () => void;
  onOpenChatModal?: () => void;
}

export const PatientScreeningResultView: React.FC<PatientScreeningResultViewProps> = ({
  result,
  selectedEye,
  onOpenReportModal,
  onOpenChatModal,
}) => {
  const { t, isVi } = useLanguage();
  const [activeTab, setActiveTab] = useState<'OVERLAY' | 'HEATMAP' | 'ORIGINAL'>('OVERLAY');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);

  const displayEye = selectedEye || (isVi ? 'OD (Mắt Phải)' : 'OD (Right Eye)');
  const rawImage = result.imageUrl || '/assets/images/fundus_original.png';
  const hasCustomHeatmap = Boolean(
    result.annotatedMap?.heatmapUrl &&
      result.annotatedMap.heatmapUrl.trim().length > 0 &&
      result.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png'
  );
  const anomalies = result.annotatedMap?.detectedAnomalies || [];
  const riskScore = result.overallVascularRiskScore ?? result.riskScore ?? 35;

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
                  {isVi ? 'Ảnh Võng Mạc & Grad-CAM Heatmap' : 'Retinal Scan & Grad-CAM Heatmap'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono-data text-[11px] font-bold border border-slate-700">
                  {displayEye}
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
                  {isVi ? 'Lớp phủ AI' : 'AI Overlay'}
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
                  {isVi ? 'Ảnh gốc' : 'Original'}
                </button>
              </div>
            </div>

            {/* Viewport Controls */}
            <div className="flex items-center justify-between gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-400">{isVi ? 'Độ mờ:' : 'Opacity:'}</span>
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
                  title={t('common.zoomOut', isVi ? 'Thu nhỏ' : 'Zoom out')}
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
                  title={t('common.zoomIn', isVi ? 'Phóng to' : 'Zoom in')}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title={t('common.resetZoom', isVi ? 'Đặt lại' : 'Reset')}
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
                  alt={isVi ? 'Ảnh chụp võng mạc' : 'Retinal fundus image'}
                  className="max-h-[380px] w-auto object-contain rounded-lg"
                />

                {/* Heatmap Overlay */}
                {(activeTab === 'OVERLAY' || activeTab === 'HEATMAP') &&
                  (hasCustomHeatmap ? (
                    <img
                      src={result.annotatedMap!.heatmapUrl}
                      alt="AI Attention Heatmap"
                      className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none cds-canvas-overlay transition-opacity duration-150"
                      style={{
                        opacity: activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity,
                      }}
                    />
                  ) : (
                    <DynamicHeatmapCanvas
                      imageSrc={rawImage}
                      riskScore={riskScore}
                      anomalies={anomalies}
                      selectedEye={displayEye}
                      opacity={activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity}
                      className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none"
                    />
                  ))}

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
                  {isVi ? 'Phân Tích AI' : 'AI Analysis'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {isVi ? 'Đánh Giá Nguy Cơ Lâm Sàng' : 'Clinical Risk Assessment'}
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
                    {isVi ? 'Nguy cơ Tim Mạch 3 năm' : '3-Year Cardiovascular Risk'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isVi ? 'Phân độ huyết áp' : 'Hypertension stage'}: {result.cardiovascularRisk.hypertensionStage}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0891B2]" />
                    {isVi ? 'Bệnh Võng Mạc ĐTĐ' : 'Diabetic Retinopathy'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.diabeticRetinopathyRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isVi ? 'Phân độ ETDRS' : 'ETDRS Grade'}: {result.diabeticRetinopathyRisk.etdrsGrade}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-amber-500" />
                    {isVi ? 'Nguy Cơ Đột Quỵ 3 năm' : '3-Year Stroke Risk'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isVi ? 'Ước tính thuật toán vi mạch hoàng điểm' : 'Macular microvascular algorithmic estimate'}
                </span>
              </div>
            </div>

            {/* Retinal Biomarkers 4-Grid */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {t('patient.results.microvascularBiomarkers', isVi ? 'Chỉ số sinh học vi mạch võng mạc' : 'Retinal Microvascular Biomarkers')}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.avr.label', isVi ? 'Tỷ lệ động-tĩnh mạch (A/V)' : 'Arteriovenous Ratio (A/V)')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.arteryVeinRatio}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.vesselDensity.label', isVi ? 'Mật độ vi mạch' : 'Vessel Density')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.vesselDensityPercentage}%
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.tortuosity.label', isVi ? 'Độ uốn lượn' : 'Vessel Tortuosity')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.tortuosityIndex}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.cdr.label', isVi ? 'Tỷ lệ Cup/Disc' : 'Optic Cup-to-Disc Ratio (CDR)')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.opticCupToDiscRatio}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Medical Safety Disclaimer */}
            <MedicalDisclaimer variant="compact" />

            <div className="flex gap-2 pt-2">
              {onOpenReportModal && (
                <Button variant="primary" size="md" className="flex-1" onClick={onOpenReportModal}>
                  {t('patient.results.print', isVi ? 'Xem Báo Cáo PDF' : 'View PDF Report')}
                </Button>
              )}
              {onOpenChatModal && (
                <Button variant="secondary" size="md" className="flex-1" onClick={onOpenChatModal}>
                  {t('patient.results.askDoctor', isVi ? 'Tư Vấn Bác Sĩ' : 'Consult Doctor')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
