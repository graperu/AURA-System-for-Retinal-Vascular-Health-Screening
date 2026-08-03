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
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

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

  const anomalies = analysisResult.annotatedMap.detectedAnomalies;

  return (
    <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0891B2]" />
              Bàn Chẩn Đoán Tương Tác CDS (Side-by-Side Fundus & Heatmap Viewer)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F0FDFA] text-[#0891B2] font-semibold border border-[#99F6E4]">
              {selectedEye}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh trực quan ảnh võng mạc gốc và lớp phủ AI Heatmap phân đoạn phân nhánh động-tĩnh mạch.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-data px-2 font-semibold text-slate-700">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1 border-l border-slate-200 pl-1.5"
              title="Đặt lại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Layers */}
          <button
            onClick={() => setShowVesselsOverlay(!showVesselsOverlay)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showVesselsOverlay
                ? 'bg-[#0891B2] text-white border-[#0891B2]'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mạch Máu Red/Blue
          </button>
        </div>
      </div>

      {/* Heatmap Opacity & Controls Bar */}
      <div className="bg-[#F0FDFA] p-3 rounded-xl border border-[#CCFBF1] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <Sliders className="w-4 h-4 text-[#0891B2]" />
          <span className="font-semibold text-[#134E4A]">Độ mờ AI Heatmap Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="w-36 accent-[#0891B2] cursor-pointer"
          />
          <span className="font-mono-data font-bold text-[#0891B2]">
            {Math.round(heatmapOpacity * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-[#DC2626]">
            <span className="w-3 h-1 bg-[#DC2626] rounded-full inline-block"></span> Động mạch (Artery)
          </span>
          <span className="flex items-center gap-1.5 text-[#2563EB]">
            <span className="w-3 h-1 bg-[#2563EB] rounded-full inline-block"></span> Tĩnh mạch (Vein)
          </span>
          <span className="flex items-center gap-1.5 text-[#EAB308]">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#EAB308] inline-block"></span> Tổn thương ROI
          </span>
        </div>
      </div>

      {/* Side-by-Side Viewer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Pane: Original Fundus Image */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 relative group min-h-[380px] flex items-center justify-center">
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md border border-slate-700 font-semibold z-10">
            Ảnh Gốc Fundus (RGB Original)
          </div>

          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* SVG Simulated Fundus Retina Visualization */}
            <svg viewBox="0 0 400 400" className="w-full max-w-[380px] h-auto rounded-full shadow-2xl">
              <defs>
                <radialGradient id="retinaBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c84b2c" />
                  <stop offset="70%" stopColor="#8a2712" />
                  <stop offset="100%" stopColor="#4a1005" />
                </radialGradient>
                <radialGradient id="macula" cx="42%" cy="50%" r="12%">
                  <stop offset="0%" stopColor="#3d1408" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8a2712" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Retina Base */}
              <circle cx="200" cy="200" r="185" fill="url(#retinaBg)" />
              {/* Macula */}
              <circle cx="160" cy="200" r="28" fill="url(#macula)" />
              {/* Optic Disc */}
              <ellipse cx="270" cy="200" rx="22" ry="26" fill="#fde68a" opacity="0.9" />
              <ellipse cx="270" cy="200" rx="10" ry="12" fill="#fef08a" />

              {/* Natural Vessels */}
              <path d="M 270 200 Q 230 140 160 110 T 80 80" fill="none" stroke="#ef4444" strokeWidth="3" />
              <path d="M 270 200 Q 220 260 140 290 T 70 320" fill="none" stroke="#ef4444" strokeWidth="3.5" />
              <path d="M 270 200 Q 210 180 140 180 T 60 190" fill="none" stroke="#3b82f6" strokeWidth="4" />
              <path d="M 270 200 Q 240 270 180 320 T 110 360" fill="none" stroke="#3b82f6" strokeWidth="4.5" />
            </svg>
          </div>
        </div>

        {/* Right Pane: AI Heatmap & Vessel Segmentation Overlay */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 relative group min-h-[380px] flex items-center justify-center">
          <div className="absolute top-3 left-3 bg-[#0891B2]/90 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md border border-cyan-400 font-semibold z-10 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Lớp Phủ AI Vessel Segmentation & Heatmap
          </div>

          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg viewBox="0 0 400 400" className="w-full max-w-[380px] h-auto rounded-full shadow-2xl">
              <defs>
                <radialGradient id="retinaBg2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c84b2c" />
                  <stop offset="70%" stopColor="#8a2712" />
                  <stop offset="100%" stopColor="#4a1005" />
                </radialGradient>

                {/* AI Risk Heatmap Overlay (Red-Yellow-Green gradient) */}
                <radialGradient id="aiHeatmap" cx="45%" cy="48%" r="40%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity={heatmapOpacity} />
                  <stop offset="45%" stopColor="#eab308" stopOpacity={heatmapOpacity * 0.75} />
                  <stop offset="85%" stopColor="#16a34a" stopOpacity={heatmapOpacity * 0.3} />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Retina Base */}
              <circle cx="200" cy="200" r="185" fill="url(#retinaBg2)" />

              {/* Heatmap Layer */}
              <circle cx="180" cy="195" r="140" fill="url(#aiHeatmap)" />

              {/* Optic Disc */}
              <ellipse cx="270" cy="200" rx="22" ry="26" fill="#fde68a" opacity="0.8" />

              {/* Segmentation Vessels Overlays */}
              {showVesselsOverlay && (
                <g>
                  {/* Arteries (Red/Pink highlight) */}
                  <path d="M 270 200 Q 230 140 160 110 T 80 80" fill="none" stroke="#f43f5e" strokeWidth="4" />
                  <path d="M 270 200 Q 220 260 140 290 T 70 320" fill="none" stroke="#f43f5e" strokeWidth="4" />
                  {/* Veins (Blue/Cyan highlight) */}
                  <path d="M 270 200 Q 210 180 140 180 T 60 190" fill="none" stroke="#06b6d4" strokeWidth="5" />
                  <path d="M 270 200 Q 240 270 180 320 T 110 360" fill="none" stroke="#06b6d4" strokeWidth="5.5" />
                </g>
              )}

              {/* ROI Anomalies Highlights */}
              {showAnomalies &&
                anomalies.map((ano) => (
                  <g
                    key={ano.id}
                    onClick={() => setActiveAnomaly(ano)}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    <rect
                      x={ano.coordinates.x * 3.5}
                      y={ano.coordinates.y * 3.5}
                      width={ano.coordinates.width * 4}
                      height={ano.coordinates.height * 4}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-pulse"
                    />
                    <circle
                      cx={ano.coordinates.x * 3.5 + 4}
                      cy={ano.coordinates.y * 3.5 + 4}
                      r="3"
                      fill="#ef4444"
                    />
                  </g>
                ))}
            </svg>
          </div>
        </div>
      </div>

      {/* ROI Anomalies Selection Cards */}
      <div className="pt-2">
        <h4 className="text-xs font-bold text-[#134E4A] mb-2 uppercase tracking-wider font-mono-data">
          Các Vùng Bất Thường Phát Hiện Bởi AI (Detected ROI Anomalies):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {anomalies.map((ano) => (
            <div
              key={ano.id}
              onClick={() => setActiveAnomaly(ano)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                activeAnomaly?.id === ano.id
                  ? 'bg-[#F0FDFA] border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-[#0891B2]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#134E4A] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#DC2626]" />
                  {ano.type}
                </span>
                <span className="text-[11px] font-mono-data font-semibold text-[#0891B2]">
                  Conf: {(ano.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{ano.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
