import React, { useState, useEffect, useRef } from 'react';
import { Eye, Layers, Sliders, Target, ZoomIn, ZoomOut, RotateCcw, ShieldCheck, Heart, BrainCircuit, Activity, AlertCircle, Move } from 'lucide-react';
import { AIRiskResult, VesselAnomalyRegion } from '../../types/cds';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { Button } from '../../components/ui/Button';
import { MedicalDisclaimer } from '../../components/ui/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { DynamicHeatmapCanvas } from '../../components/DynamicHeatmapCanvas';
import {
  getAnomalyMedicalTheme,
  getAnomalyName,
  processVesselOverlayCanvas,
} from '../../components/InteractiveCDSViewer';
import { realtimeBus } from '../../services/realtimeService';

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
  const [currentResult, setCurrentResult] = useState<AIRiskResult>(result);

  useEffect(() => {
    setCurrentResult(result);
  }, [result]);

  useEffect(() => {
    const unsub = realtimeBus.subscribe(
      ['doctor:reviewed', 'screening:reviewed', 'RESULT_REVIEWED', 'notification:new'],
      (evt) => {
        const data = evt?.data;
        if (
          !data ||
          !data.screeningId ||
          data.screeningId === currentResult.id ||
          data.patientId === currentResult.patientId ||
          evt.type === 'doctor:reviewed'
        ) {
          setCurrentResult((prev) => ({
            ...prev,
            status: 'REVIEWED',
            isReviewed: true,
            doctorNotes: data?.doctorNotes || data?.notes || prev.doctorNotes,
            doctorName: data?.doctorName || data?.reviewerName || prev.doctorName,
            digitalSignature: data?.digitalSignature || prev.digitalSignature,
          }));
        }
      }
    );
    return unsub;
  }, [currentResult.id, currentResult.patientId]);
  const [activeTab, setActiveTab] = useState<'OVERLAY' | 'HEATMAP' | 'ORIGINAL'>('OVERLAY');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [showVesselsOverlay, setShowVesselsOverlay] = useState<boolean>(false);
  const [isRedFreeFilter, setIsRedFreeFilter] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMovedRef = useRef<boolean>(false);
  const rawImageRef = useRef<HTMLImageElement>(null);
  const vesselCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);

  const handleZoomChange = (updater: (prev: number) => number) => {
    setZoomLevel((prev) => {
      const next = updater(prev);
      const clamped = Math.min(2.5, Math.max(0.8, Number(next.toFixed(1))));
      if (clamped <= 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
      return clamped;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (zoomLevel <= 1.0) return;
    setIsDragging(true);
    isMovedRef.current = false;
    dragStartRef.current = { x: clientX, y: clientY };
    startPanRef.current = { ...panOffset };
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!isDragging || zoomLevel <= 1.0) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      isMovedRef.current = true;
    }
    const maxPanX = Math.max(120, (zoomLevel - 1) * 350);
    const maxPanY = Math.max(120, (zoomLevel - 1) * 280);
    const nextX = Math.max(-maxPanX, Math.min(maxPanX, startPanRef.current.x + deltaX));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, startPanRef.current.y + deltaY));
    setPanOffset({ x: nextX, y: nextY });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onWindowMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY);
    };
    const onWindowMouseUp = () => {
      endDrag();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isDragging, zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return;
    if ((e.target as HTMLElement).closest('button, input, a, [role="button"]')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1.0 || e.touches.length !== 1) return;
    if ((e.target as HTMLElement).closest('button, input, a, [role="button"]')) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1.0 || e.touches.length !== 1) return;
    updateDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const displayEye = selectedEye || (isVi ? 'Mắt Phải' : 'Right Eye');
  const rawImage = result.imageUrl || '/assets/images/fundus_original.png';
  const hasCustomHeatmap = Boolean(
    result.annotatedMap?.heatmapUrl &&
      result.annotatedMap.heatmapUrl.trim().length > 0 &&
      result.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png'
  );
  const anomalies = result.annotatedMap?.detectedAnomalies || [];
  const riskScore = result.overallVascularRiskScore ?? result.riskScore ?? 35;

  useEffect(() => {
    if (!rawImageRef.current || !vesselCanvasRef.current) return;
    processVesselOverlayCanvas(rawImageRef.current, vesselCanvasRef.current, {
      isDarkRoom: false,
      vesselMaskUrl: result.annotatedMap?.vesselMaskUrl,
    });
  }, [isImageLoaded, rawImage, result.annotatedMap?.vesselMaskUrl]);

  return (
    <div className="space-y-6">
      {/* 2-Column Clinical Layout: Left 60% Medical Imaging Viewer + Right 40% Clinical Finding Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 60% (7 cols): High-Contrast Dark Imaging Workstation */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 text-white">
            {/* Bộ lọc quang học Red-Free */}
            <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true" focusable="false">
              <defs>
                <filter id="aura-red-free-filter" colorInterpolationFilters="sRGB">
                  <feColorMatrix
                    type="matrix"
                    values="
                      0.0  1.0  0.0  0  0
                      0.0  1.0  0.0  0  0
                      0.0  1.0  0.0  0  0
                      0.0  0.0  0.0  1  0
                    "
                  />
                  <feComponentTransfer>
                    <feFuncR type="linear" slope="1.45" intercept="-0.18" />
                    <feFuncG type="linear" slope="1.45" intercept="-0.18" />
                    <feFuncB type="linear" slope="1.45" intercept="-0.18" />
                  </feComponentTransfer>
                </filter>
              </defs>
            </svg>

            {/* Viewer Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#22D3EE]" />
                  {isVi ? 'Ảnh Võng Mạc & Grad-CAM Heatmap' : 'Retinal Scan & Heatmap'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono-data text-[11px] font-bold border border-slate-700">
                  {displayEye}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Viewer Mode Switcher */}
                <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab('OVERLAY')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'OVERLAY'
                        ? 'bg-[#3478F6] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Chồng lớp' : 'Overlay'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('HEATMAP')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'HEATMAP'
                        ? 'bg-[#3478F6] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Bản đồ nhiệt' : 'Heatmap'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ORIGINAL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'ORIGINAL'
                        ? 'bg-[#3478F6] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isVi ? 'Ảnh gốc' : 'Original'}
                  </button>
                </div>

                {/* Vessel Segmentation Toggle */}
                <button
                  type="button"
                  data-testid="patient-vessel-overlay-toggle-btn"
                  onClick={() => setShowVesselsOverlay(!showVesselsOverlay)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showVesselsOverlay
                      ? 'bg-teal-700 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isVi ? 'Bật/tắt lớp phân đoạn mạch máu võng mạc' : 'Toggle retinal vessel segmentation overlay'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t('cdsViewer.vesselOverlay', 'Lớp mạch máu')}</span>
                </button>

                {/* Optical Red-Free Filter Toggle */}
                <button
                  type="button"
                  data-testid="patient-red-free-toggle-btn"
                  onClick={() => setIsRedFreeFilter(!isRedFreeFilter)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isRedFreeFilter
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isVi ? 'Bật/tắt bộ lọc quang học Red-Free 540nm' : 'Toggle optical Red-Free 540nm filter'}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isRedFreeFilter ? (isVi ? 'Red-Free: BẬT' : 'Red-Free: ON') : (isVi ? 'Bộ lọc Red-Free' : 'Red-Free Filter')}</span>
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
                  className="w-full accent-[#3478F6] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="font-mono-data text-[11px] w-8 text-right text-cyan-300 font-bold">
                  {(heatmapOpacity * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                {zoomLevel > 1.0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800 font-medium">
                    <Move className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{isVi ? 'Kéo để di chuyển' : 'Drag to pan'}</span>
                  </span>
                )}
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleZoomChange((z) => z - 0.2)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={t('common.zoomOut', isVi ? 'Thu nhỏ' : 'Zoom out')}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-data text-[11px] px-1 text-slate-300 min-w-[36px] text-center font-bold">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleZoomChange((z) => z + 0.2)}
                    className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={t('common.zoomIn', isVi ? 'Phóng to' : 'Zoom in')}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={t('common.resetZoom', isVi ? 'Đặt lại' : 'Reset')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Medical Imaging Canvas */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[380px] sm:min-h-[440px] border border-slate-800 select-none ${
                zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
            >
              <div
                className="relative flex items-center justify-center p-2"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 150ms ease-out',
                }}
              >
                {/* Base Fundus Image */}
                <img
                  ref={rawImageRef}
                  src={rawImage}
                  alt={isVi ? 'Ảnh chụp võng mạc' : 'Retinal fundus image'}
                  className="max-h-[380px] w-auto object-contain rounded-lg select-none pointer-events-none"
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    filter: isRedFreeFilter ? 'url(#aura-red-free-filter) contrast(145%) brightness(95%)' : undefined,
                  }}
                  onLoad={() => setIsImageLoaded(true)}
                />

                {/* Vessel Segmentation Canvas */}
                <canvas
                  ref={vesselCanvasRef}
                  data-testid="patient-vessel-canvas"
                  className={`absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none transition-opacity duration-200 ${
                    showVesselsOverlay ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    opacity: showVesselsOverlay ? Math.min(1.0, heatmapOpacity + 0.3) : 0,
                    filter: 'url(#aura-red-free-filter) contrast(165%) brightness(92%)',
                    mixBlendMode: 'screen',
                  }}
                />

                {/* Heatmap Overlay */}
                {(activeTab === 'OVERLAY' || activeTab === 'HEATMAP') &&
                  (hasCustomHeatmap ? (
                    <img
                      src={result.annotatedMap!.heatmapUrl}
                      alt="AI Attention Heatmap"
                      className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none cds-canvas-overlay transition-opacity duration-150 select-none"
                      style={{
                        opacity: activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity,
                      }}
                      draggable={false}
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

                {/* Detected Anomalies Pinpoints with Multi-Class Medical Grading */}
                {anomalies.map((ano) => {
                  const theme = getAnomalyMedicalTheme(ano.type);
                  const anomalyDisplayName = getAnomalyName(ano.type, t);
                  const isSelected = activeAnomaly?.id === ano.id;

                  return (
                    <div
                      key={ano.id}
                      className="absolute z-20 pointer-events-auto"
                      style={{
                        left: `${ano.coordinates.x}%`,
                        top: `${ano.coordinates.y}%`,
                        width: `${Math.max(22, ano.coordinates.width)}px`,
                        height: `${Math.max(22, ano.coordinates.height)}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <button
                        type="button"
                        data-testid={`patient-lesion-pin-${ano.type}`}
                        onClick={(e) => {
                          if (isMovedRef.current) return;
                          e.stopPropagation();
                          setActiveAnomaly(isSelected ? null : ano);
                        }}
                        className={`group relative flex items-center justify-center w-full h-full rounded-full border-2 ${theme.border} ${theme.bg} ${
                          isSelected ? `ring-4 ${theme.pulse} scale-125` : 'hover:scale-125'
                        } transition-all duration-200 cursor-pointer shadow-lg`}
                        title={`${anomalyDisplayName} (${(ano.confidence * 100).toFixed(0)}%): ${ano.description}`}
                      >
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${theme.ping} animate-ping opacity-75`} />
                        <span className={`w-2 h-2 rounded-full ${theme.ping}`} />

                        {/* Interactive hover tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                          <div className="bg-slate-900/95 text-white text-[11px] rounded-lg px-2.5 py-1 shadow-xl border border-slate-700 whitespace-nowrap">
                            <span className="font-bold">{anomalyDisplayName}</span>
                            <span className="text-cyan-300 ml-1.5 font-mono font-bold">{(ano.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeAnomaly && (
              <div
                data-testid="patient-active-anomaly-popup"
                className="p-3 bg-slate-800/95 border border-slate-700 rounded-xl text-xs flex justify-between items-start shadow-xl animate-fade-in"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getAnomalyMedicalTheme(activeAnomaly.type).badgeBg}`}>
                      {getAnomalyName(activeAnomaly.type, t)}
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px] font-bold">
                      {isVi ? 'Độ tin cậy:' : 'Confidence:'} {(activeAnomaly.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{activeAnomaly.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAnomaly(null)}
                  className="text-slate-400 hover:text-white font-bold p-1 ml-2 text-sm cursor-pointer"
                  aria-label={isVi ? 'Đóng' : 'Close'}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 40% (5 cols): Clinical Health Summary & Guidance Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              {isVi ? 'Đánh Giá Sức Khỏe & Nguy Cơ Lâm Sàng' : 'Vascular Health & Clinical Risk'}
            </h2>
          </div>

          {/* 1. Overall Risk Score Banner Card */}
          <Card padding="md" className="space-y-3 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border border-slate-700 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                {isVi ? 'Đánh Giá Nguy Cơ Lâm Sàng' : 'Overall Vascular Risk Score'}
              </span>
              <RiskBadge level={result.cardiovascularRisk.level} size="sm" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono-data text-white">
                  {riskScore}
                </span>
                <span className="text-sm font-semibold text-slate-300 ml-1">/ 100</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 text-teal-200 border border-teal-500/30 font-semibold">
                {currentResult.status === 'REVIEWED' || currentResult.status === 'APPROVED' || (currentResult as any).isReviewed
                  ? (isVi ? 'Đã duyệt' : 'Clinically Reviewed')
                  : (isVi ? 'Chờ thẩm định' : 'Pending Review')}
              </span>
            </div>

            {/* Risk Gauge Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskScore < 40
                      ? 'bg-emerald-400'
                      : riskScore < 65
                      ? 'bg-amber-400'
                      : riskScore < 80
                      ? 'bg-orange-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, riskScore))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono-data pt-0.5">
                <span>0 {isVi ? 'Thấp' : 'Low'}</span>
                <span>40 {isVi ? 'TB' : 'Mod'}</span>
                <span>65 {isVi ? 'Cao' : 'High'}</span>
                <span>100 {isVi ? 'Nguy kịch' : 'Crit'}</span>
              </div>
            </div>
          </Card>

          {/* 2. Four Clinical Risks Grid Card */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isVi ? '4 Phân Tầng Nguy Cơ Lâm Sàng' : '4 Clinical Risk Pillars'}
              </h3>
              <span
                data-testid="patient-model-version-badge"
                className="text-[11px] text-[#3478F6] bg-[#EEF5FF] px-2 py-0.5 rounded border border-[#C7D7FE] font-mono-data font-medium"
              >
                {result.modelVersion || 'Gemini 3.7 Flash High / AURA-Core v2.4'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Risk 1: Cardiovascular */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    {isVi ? '1. Tim Mạch' : '1. Cardio'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate" title={result.cardiovascularRisk.hypertensionStage}>
                  {result.cardiovascularRisk.hypertensionStage}
                </span>
              </div>

              {/* Risk 2: Diabetic Retinopathy */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#3478F6]" />
                    {isVi ? '2. Võng Mạc ĐTĐ' : '2. Diabetes (DR)'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.diabeticRetinopathyRisk.score}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate" title={result.diabeticRetinopathyRisk.etdrsGrade}>
                  {result.diabeticRetinopathyRisk.etdrsGrade}
                </span>
              </div>

              {/* Risk 3: 3-Year Stroke */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-500" />
                    {isVi ? '3. Đột Quỵ 3 Năm' : '3. Stroke 3Y'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {result.cardiovascularRisk.threeYearStrokeRiskPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isVi ? 'Dự báo biến cố não' : 'Cerebrovascular event'}
                </span>
              </div>

              {/* Risk 4: Hypertensive / Microvascular Damage */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    {isVi ? '4. Vi Mạch & Xơ Vữa' : '4. Microvascular'}
                  </span>
                  <span className="font-mono-data font-bold text-slate-900 text-sm">
                    {Math.round((result.cardiovascularRisk.score + (result.overallVascularRiskScore || 35)) / 2)}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  {result.annotatedMap.arteryVeinRatio < 0.65
                    ? (isVi ? 'Co thắt tiểu động mạch' : 'Arteriolar narrowing')
                    : (isVi ? 'Mạch máu ổn định' : 'Stable caliber')}
                </span>
              </div>
            </div>

            {/* Retinal Biomarkers 4-Grid */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {t('patient.results.microvascularBiomarkers', isVi ? 'Chỉ số đo lường vi mạch mắt' : 'Vascular Biomarkers')}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.avr.label', isVi ? 'Tỷ lệ động/tĩnh mạch' : 'Arteriovenous Ratio')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.arteryVeinRatio}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.vesselDensity.label', isVi ? 'Mật độ mạch máu' : 'Vessel Density')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.vesselDensityPercentage}%
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.tortuosity.label', isVi ? 'Độ xoắn mạch máu' : 'Vessel Tortuosity')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.tortuosityIndex}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.cdr.label', isVi ? 'Tỷ lệ lõm gai thị' : 'Cup-to-Disc Ratio')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.opticCupToDiscRatio}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor assessment / notes if any */}
            {(currentResult.doctorNotes || currentResult.findings) && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  {isVi ? 'Nhận định của Bác sĩ chuyên khoa' : 'Attending Specialist Notes'}
                </span>
                <p className="text-teal-950 leading-relaxed font-medium">
                  {currentResult.doctorNotes || currentResult.findings}
                </p>
              </div>
            )}

            {/* Mandatory Medical Safety Disclaimer */}
            <MedicalDisclaimer variant="compact" />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {onOpenReportModal && (
                <Button variant="primary" size="md" className="flex-1" onClick={onOpenReportModal}>
                  {t('patient.results.print', isVi ? 'In kết quả' : 'Print Report')}
                </Button>
              )}
              {onOpenChatModal && (
                <Button variant="secondary" size="md" className="flex-1" onClick={onOpenChatModal}>
                  {t('patient.results.askDoctor', isVi ? 'Nhắn tin Bác sĩ' : 'Consult Doctor')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

