import React, { useState } from 'react';
import { AIRiskResult, VesselAnomalyRegion } from '../types/cds';
import {
  Eye,
  Sliders,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Info,
  Moon,
} from 'lucide-react';
import { Card } from './ui/Card';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';

interface InteractiveCDSViewerProps {
  analysisResult: AIRiskResult;
  selectedEye?: string;
}

export const InteractiveCDSViewer: React.FC<InteractiveCDSViewerProps> = ({
  analysisResult,
  selectedEye = 'OD (Mắt Phải)',
}) => {
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [showVesselsOverlay, setShowVesselsOverlay] = useState<boolean>(true);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);
  const [isDarkRoom, setIsDarkRoom] = useState<boolean>(false);

  const anomalies = analysisResult.annotatedMap.detectedAnomalies || [];
  const rawImage = analysisResult.imageUrl || '/assets/images/fundus_original.png';
  const heatmapImg = analysisResult.annotatedMap.heatmapUrl || '/assets/images/fundus_heatmap.png';

  return (
    <Card
      padding="md"
      className={`space-y-4 transition-colors duration-200 ${
        isDarkRoom ? 'bg-darkroom-card border-darkroom-border text-darkroom-text' : 'bg-white'
      }`}
    >
      {/* Header Toolbar */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 ${
          isDarkRoom ? 'border-darkroom-border' : 'border-clinical-border'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
                isDarkRoom ? 'text-darkroom-text' : 'text-clinical-text'
              }`}
            >
              <Eye className="w-5 h-5 text-brand-600" />
              Bàn Chẩn Đoán Tương Tác CDS (Fundus & Grad-CAM Heatmap Viewer)
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isDarkRoom
                  ? 'bg-slate-800 text-cyan-300 border-slate-700 font-mono-data'
                  : 'bg-slate-100 text-slate-700 border-clinical-border'
              }`}
            >
              {selectedEye}
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 ${
              isDarkRoom ? 'text-slate-400' : 'text-clinical-text-muted'
            }`}
          >
            Bản đồ chú ý AI (Grad-CAM) làm nổi bật các vùng ảnh ảnh hưởng nhiều đến dự đoán vi mạch võng mạc.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dark Room Ophthalmology Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDarkRoom(!isDarkRoom)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isDarkRoom
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-clinical-border hover:bg-slate-100'
            }`}
            title="Chuyển đổi Buồng Tối khám mắt (Dark Room Mode - Nền Obsidian chống lóa)"
          >
            <Moon className={`w-4 h-4 ${isDarkRoom ? 'text-cyan-400 fill-cyan-400/30' : 'text-slate-500'}`} />
            <span>{isDarkRoom ? 'Buồng Tối: BẬT' : 'Buồng Tối (Dark Room)'}</span>
          </button>

          {/* Zoom Controls */}
          <div
            className={`flex items-center rounded-lg p-1 border ${
              isDarkRoom ? 'bg-darkroom-surface border-darkroom-border' : 'bg-slate-50 border-clinical-border'
            }`}
          >
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className={`p-1 transition-colors ${
                isDarkRoom ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-600 hover:text-brand-600'
              }`}
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span
              className={`text-xs font-mono-data px-2 font-semibold ${
                isDarkRoom ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className={`p-1 transition-colors ${
                isDarkRoom ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-600 hover:text-brand-600'
              }`}
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className={`p-1 ml-1 border-l pl-1.5 transition-colors ${
                isDarkRoom
                  ? 'border-darkroom-border text-slate-500 hover:text-slate-300'
                  : 'border-clinical-border text-slate-400 hover:text-slate-700'
              }`}
              title="Đặt lại zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Layers */}
          <button
            onClick={() => setShowVesselsOverlay(!showVesselsOverlay)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showVesselsOverlay
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : isDarkRoom
                ? 'bg-darkroom-surface text-slate-300 border-darkroom-border'
                : 'bg-slate-50 text-slate-600 border-clinical-border'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mạch Máu Red/Blue
          </button>
        </div>
      </div>

      {/* Heatmap Opacity & Controls Bar */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs ${
          isDarkRoom
            ? 'bg-darkroom-surface border-darkroom-border text-slate-200'
            : 'bg-slate-50 border-clinical-border text-clinical-text'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <Sliders className={`w-4 h-4 ${isDarkRoom ? 'text-cyan-400' : 'text-brand-600'}`} />
          <span className="font-semibold whitespace-nowrap">Độ Mờ Heatmap:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="w-full accent-brand-600 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <span
            className={`font-mono-data font-bold w-10 text-right ${
              isDarkRoom ? 'text-cyan-300' : 'text-slate-700'
            }`}
          >
            {(heatmapOpacity * 100).toFixed(0)}%
          </span>
        </div>

        <div
          className={`flex items-center gap-4 text-[11px] border-l pl-4 ${
            isDarkRoom
              ? 'border-darkroom-border text-slate-300'
              : 'border-clinical-border text-clinical-text-secondary'
          }`}
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(e) => setShowAnomalies(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-medium">Hiển thị tọa độ tổn thương ({anomalies.length})</span>
          </label>
        </div>
      </div>

      {/* Dual Side-by-Side Canvas Viewport (Obsidian #030712) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Original Fundus Retinal Image */}
        <div
          className={`relative rounded-xl overflow-hidden border bg-darkroom-bg flex flex-col items-center justify-center min-h-[380px] ${
            isDarkRoom ? 'border-darkroom-border' : 'border-clinical-border'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700">
            Ảnh Gốc Võng Mạc (True Color Fundus)
          </div>

          <div
            className="transition-transform duration-150 overflow-hidden flex items-center justify-center p-2"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={rawImage}
              alt="Ảnh võng mạc gốc"
              className="max-h-[350px] w-auto object-contain rounded-lg shadow-md"
            />
          </div>
        </div>

        {/* Right: AI Heatmap & Vessel Anomaly Overlay */}
        <div
          className={`relative rounded-xl overflow-hidden border bg-darkroom-bg flex flex-col items-center justify-center min-h-[380px] ${
            isDarkRoom ? 'border-darkroom-border' : 'border-clinical-border'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Lớp Phủ AI Attention (Grad-CAM XAI)
          </div>

          <div
            className="relative transition-transform duration-150 overflow-hidden flex items-center justify-center p-2"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Base Image */}
            <img
              src={rawImage}
              alt="Lớp nền võng mạc"
              className="max-h-[350px] w-auto object-contain rounded-lg"
            />

            {/* Heatmap Overlay */}
            <img
              src={heatmapImg}
              alt="AI Grad-CAM Heatmap"
              className="absolute inset-0 m-auto max-h-[350px] w-auto object-contain rounded-lg pointer-events-none cds-canvas-overlay transition-opacity duration-150"
              style={{ opacity: heatmapOpacity }}
            />

            {/* Detected Anomaly Markers */}
            {showAnomalies &&
              anomalies.map((anomaly) => (
                <button
                  key={anomaly.id}
                  onClick={() => setActiveAnomaly(anomaly)}
                  className="absolute z-20 flex items-center justify-center rounded-full border-2 border-amber-500 bg-amber-500/40 text-white transition-transform hover:scale-125 focus:outline-none"
                  style={{
                    left: `${anomaly.coordinates.x}%`,
                    top: `${anomaly.coordinates.y}%`,
                    width: `${Math.max(24, anomaly.coordinates.width)}px`,
                    height: `${Math.max(24, anomaly.coordinates.height)}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${anomaly.type} (${anomaly.description})`}
                >
                  <Target className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Anomaly Detail Drawer / Info Box */}
      {activeAnomaly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-2">
                <span>{anomalyNameMap(activeAnomaly.type)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold uppercase">
                  Độ tin cậy AI: {(activeAnomaly.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-amber-800 mt-0.5">{activeAnomaly.description}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveAnomaly(null)}
            className="text-amber-700 hover:text-amber-950 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mandatory Medical Safety Disclaimer */}
      <MedicalDisclaimer
        variant={isDarkRoom ? 'subtle' : 'compact'}
        className={isDarkRoom ? 'bg-darkroom-surface border-darkroom-border text-slate-300' : ''}
      />
    </Card>
  );
};

function anomalyNameMap(type: string): string {
  switch (type) {
    case 'Microaneurysm':
      return 'Vi phình mạch (Microaneurysm)';
    case 'Hemorrhage':
      return 'Xuất huyết võng mạc (Hemorrhage)';
    case 'Hard_Exudate':
      return 'Xuất tiết cứng (Hard Exudate)';
    case 'AV_Nipping':
      return 'Dấu hiệu bắt chéo Động-Tĩnh mạch (A/V Nipping)';
    case 'Focal_Narrowing':
      return 'Hẹp động mạch cục bộ (Focal Narrowing)';
    default:
      return type;
  }
}
