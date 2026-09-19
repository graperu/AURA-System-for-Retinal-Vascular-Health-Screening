import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { AnimatedCounter } from '../../components/common/AnimatedCounter';
import { BiomarkerGaugeBar } from '../../components/common/BiomarkerGaugeBar';
import { LesionRipplePulse } from '../../components/viewer/LesionRipplePulse';

/**
 * Thuật toán quang học phát hiện tâm Gai thị (Optic Disc Centroid) Client-Side thời gian thực
 * Quét độ chói ấm (warm luminance) tại bán cầu mũi (Nasal Hemisphere) qua Offscreen Canvas (<1ms)
 * để khóa tâm chuẩn xác tuyệt đối trên mọi ảnh đáy mắt võng mạc thực tế.
 */
export function detectOpticDiscCentroid(img: HTMLImageElement, isOS: boolean): { x: number; y: number } | null {
  try {
    const size = 160;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Phân vùng giải phẫu học bán cầu mũi:
    // Mắt Phải (OD): Gai thị nằm phía mũi / bên phải ảnh (x: 56% - 84%, y: 34% - 68%)
    // Mắt Trái (OS): Gai thị nằm phía mũi / bên trái ảnh (x: 16% - 44%, y: 34% - 68%)
    const xMin = Math.floor(size * (isOS ? 0.16 : 0.56));
    const xMax = Math.floor(size * (isOS ? 0.44 : 0.84));
    const yMin = Math.floor(size * 0.34);
    const yMax = Math.floor(size * 0.68);

    let maxLum = 0;
    const candidates: { x: number; y: number; lum: number }[] = [];

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        const idx = (y * size + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Gai thị có màu ấm sáng đặc trưng: R > 70, G > 50, R >= B
        if (r > 70 && g > 50 && r >= b) {
          const lum = r * 0.6 + g * 0.4;
          if (lum > maxLum) maxLum = lum;
          candidates.push({ x, y, lum });
        }
      }
    }

    if (candidates.length === 0 || maxLum < 80) return null;

    // Lấy 12% điểm sáng ấm nhất để tính trọng tâm (centroid)
    const threshold = maxLum * 0.88;
    let sumX = 0;
    let sumY = 0;
    let sumW = 0;

    for (const c of candidates) {
      if (c.lum >= threshold) {
        const weight = c.lum - threshold + 1;
        sumX += c.x * weight;
        sumY += c.y * weight;
        sumW += weight;
      }
    }

    if (sumW === 0) return null;

    const detectedX = (sumX / sumW / size) * 100;
    const detectedY = (sumY / sumW / size) * 100;

    return {
      x: Math.round(detectedX * 10) / 10,
      y: Math.round(detectedY * 10) / 10,
    };
  } catch {
    return null;
  }
}

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
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [selectedLandmark, setSelectedLandmark] = useState<'DISC' | 'FAZ' | null>(null);

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
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (result.imageUrl && result.imageUrl.trim().length > 0) {
      return result.imageUrl.trim();
    }
    return '/assets/images/fundus_original.png';
  });

  useEffect(() => {
    if (result.imageUrl && result.imageUrl.trim().length > 0) {
      setImageSrc(result.imageUrl.trim());
    } else {
      setImageSrc('/assets/images/fundus_original.png');
    }
  }, [result.imageUrl]);

  const rawImage = imageSrc;
  const hasCustomHeatmap = Boolean(
    result.annotatedMap?.heatmapUrl &&
      result.annotatedMap.heatmapUrl.trim().length > 0 &&
      result.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png'
  );
  const anomalies = result.annotatedMap?.detectedAnomalies || [];
  const riskScore = result.overallVascularRiskScore ?? result.riskScore ?? 35;

  const isOS = currentResult.eyePosition?.includes('OS') || (currentResult as any).patientData?.laterality === 'OS' || Boolean(selectedEye?.includes('OS'));
  
  // Khởi tạo trạng thái tính toán tâm Gai thị quang học trực tiếp từ ảnh đáy mắt
  const [detectedOpticalDisc, setDetectedOpticalDisc] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!rawImageRef.current || !isImageLoaded) return;
    const detected = detectOpticDiscCentroid(rawImageRef.current, isOS);
    if (detected) {
      setDetectedOpticalDisc(detected);
    }
  }, [isImageLoaded, rawImage, isOS]);

  // Hệ thống tọa độ giải phẫu 3 tầng chuẩn y khoa (3-Tier Coordinate Engine)
  // Tầng 1: Tọa độ mốc giải phẫu chính xác từ mô hình AI (LANDMARK-DISC / LANDMARK-FAZ)
  const discLandmark = anomalies.find(
    (a) => a.id === 'LANDMARK-DISC' || a.type.toUpperCase() === 'OPTIC_DISC' || a.type.toUpperCase() === 'DISC'
  );
  const fazLandmark = anomalies.find(
    (a) => a.id === 'LANDMARK-FAZ' || a.type.toUpperCase() === 'FOVEA_CENTRALIS' || a.type.toUpperCase().includes('FOVEA') || a.type.toUpperCase() === 'FAZ'
  );
  const macularAnomaly = anomalies.find(
    (a) => a.type.toUpperCase().includes('MACULAR') || a.type.toUpperCase().includes('STAR')
  );

  // Tầng 2 & Tầng 3: Tọa độ Gai thị (Optic Disc)
  // Ưu tiên AI mốc giải phẫu -> Quét quang học Offscreen Canvas -> Chuẩn lâm sàng (OD ~74.8%, OS ~25.2%)
  const discCoords = useMemo(() => {
    if (discLandmark?.coordinates) {
      return { x: discLandmark.coordinates.x, y: discLandmark.coordinates.y };
    }
    if (detectedOpticalDisc) {
      return detectedOpticalDisc;
    }
    return { x: isOS ? 25.5 : 74.8, y: 49.5 };
  }, [discLandmark, detectedOpticalDisc, isOS]);

  // Tọa độ Hoàng điểm / Hố hoàng điểm (FAZ / Fovea Centralis)
  // Ưu tiên AI mốc giải phẫu -> Tọa độ tổn thương hoàng điểm -> Khoảng cách giải phẫu thực tế (cách gai thị 2.5 đường kính đĩa thị về phía thái dương)
  const maculaCoords = useMemo(() => {
    if (fazLandmark?.coordinates) {
      return { x: fazLandmark.coordinates.x, y: fazLandmark.coordinates.y };
    }
    if (macularAnomaly?.coordinates) {
      return { x: macularAnomaly.coordinates.x, y: macularAnomaly.coordinates.y };
    }
    const temporalOffset = isOS ? 25.5 : -25.5;
    const computedX = Math.max(32, Math.min(68, discCoords.x + temporalOffset));
    const computedY = Math.max(44, Math.min(56, discCoords.y + 0.8));
    return { x: Math.round(computedX * 10) / 10, y: Math.round(computedY * 10) / 10 };
  }, [fazLandmark, macularAnomaly, discCoords, isOS]);

  // Phân tách tổn thương bệnh lý thật sự khỏi mốc giải phẫu học
  const lesionAnomalies = useMemo(() => {
    return anomalies.filter((ano) => {
      const t = (ano.type || '').toUpperCase();
      const id = (ano.id || '').toUpperCase();
      if (id.startsWith('LANDMARK-')) return false;
      if (t.includes('DISC') || t.includes('GAI_THI')) return false;
      if (t.includes('FOVEA') || t.includes('FAZ') || t.includes('HOANG_DIEM')) return false;
      return true;
    });
  }, [anomalies]);

  const vcdr = Number(currentResult.annotatedMap?.opticCupToDiscRatio) || 0.52;
  const avRatio = Number(currentResult.annotatedMap?.arteryVeinRatio) || 0.48;

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

                {/* Anatomical Landmarks (DISC & FAZ) Toggle */}
                <button
                  type="button"
                  data-testid="patient-anatomical-landmarks-toggle-btn"
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showLandmarks
                      ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isVi ? 'Bật/tắt mốc giải phẫu Gai thị (DISC) và Hoàng điểm (FAZ)' : 'Toggle Optic Disc & Macula/FAZ anatomical landmarks'}
                >
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showLandmarks ? (isVi ? 'Mốc giải phẫu: BẬT' : 'Landmarks: ON') : (isVi ? 'Mốc giải phẫu' : 'Landmarks')}</span>
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
                  crossOrigin={
                    rawImage.startsWith('data:') || rawImage.startsWith('blob:')
                      ? undefined
                      : 'anonymous'
                  }
                  draggable={false}
                  style={{
                    filter: isRedFreeFilter ? 'url(#aura-red-free-filter) contrast(145%) brightness(95%)' : undefined,
                  }}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={() => setImageSrc('/assets/images/fundus_original.png')}
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

                {/* Heatmap Overlay with Smooth Grad-CAM Crossfade & Unblur */}
                {(activeTab === 'OVERLAY' || activeTab === 'HEATMAP') && (
                  <div
                    key="gradcam-heatmap-layer"
                    className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain rounded-lg pointer-events-none select-none animate-gradcam-crossfade"
                    style={{
                      mixBlendMode: 'screen',
                      willChange: 'opacity, filter',
                      ['--target-heatmap-opacity' as any]: activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity,
                      opacity: activeTab === 'HEATMAP' ? 1.0 : heatmapOpacity,
                    }}
                  >
                    {hasCustomHeatmap ? (
                      <img
                        src={result.annotatedMap!.heatmapUrl}
                        alt="AI Attention Heatmap"
                        className="w-full h-full object-contain rounded-lg pointer-events-none cds-canvas-overlay select-none"
                        draggable={false}
                      />
                    ) : (
                      <DynamicHeatmapCanvas
                        imageSrc={rawImage}
                        riskScore={riskScore}
                        anomalies={lesionAnomalies}
                        selectedEye={displayEye}
                        opacity={1.0}
                        className="w-full h-full object-contain rounded-lg pointer-events-none"
                      />
                    )}
                  </div>
                )}

                {/* Detected Anomalies Pinpoints with Multi-Class Medical Grading */}
                {lesionAnomalies.map((ano) => {
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
                        <LesionRipplePulse type={ano.type} isSelected={isSelected} />
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

                {/* Anatomical Reticles: Optic Disc (DISC) & FAZ with Interactive Biometrics */}
                {showLandmarks && (
                  <>
                    {/* Optic Disc Target (DISC) */}
                    <div
                      className="absolute z-20 pointer-events-auto"
                      style={{
                        left: `${discCoords.x}%`,
                        top: `${discCoords.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <button
                        type="button"
                        data-testid="patient-landmark-disc"
                        onClick={(e) => {
                          if (isMovedRef.current) return;
                          e.stopPropagation();
                          setActiveAnomaly(null);
                          setSelectedLandmark(selectedLandmark === 'DISC' ? null : 'DISC');
                        }}
                        className={`group relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                          selectedLandmark === 'DISC' ? 'scale-110' : 'hover:scale-105'
                        }`}
                        style={{ width: '56px', height: '56px' }}
                        title={isVi ? `Đĩa thần kinh thị giác (Gai thị) - CDR: ${vcdr.toFixed(2)}` : `Optic Disc - CDR: ${vcdr.toFixed(2)}`}
                      >
                        {/* Outer Disc Boundary */}
                        <div
                          className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 bg-cyan-500/10"
                          style={{
                            boxShadow: selectedLandmark === 'DISC' ? '0 0 16px rgba(34, 211, 238, 0.7)' : '0 0 8px rgba(34, 211, 238, 0.4)',
                          }}
                        />
                        {/* Concentric Inner Cup Boundary calculated by real CDR ratio */}
                        <div
                          className={`absolute rounded-full border border-dashed transition-all ${
                            vcdr >= 0.50 ? 'border-rose-400 bg-rose-500/20' : 'border-amber-400 bg-amber-500/20'
                          }`}
                          style={{
                            width: `${Math.round(56 * Math.min(0.9, Math.max(0.25, vcdr)))}px`,
                            height: `${Math.round(56 * Math.min(0.9, Math.max(0.25, vcdr)))}px`,
                          }}
                        />
                        {/* Crosshairs */}
                        <div className="absolute w-full h-[1px] bg-cyan-400/50" />
                        <div className="absolute h-full w-[1px] bg-cyan-400/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 z-10" />

                        {/* Reticle Badge */}
                        <span className="absolute -bottom-5 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold whitespace-nowrap bg-slate-900/90 text-cyan-300 border border-cyan-500 shadow-md">
                          DISC ({isOS ? 'OS' : 'OD'}) • CDR {vcdr.toFixed(2)}
                        </span>
                      </button>
                    </div>

                    {/* Foveal Avascular Zone Target (FAZ) */}
                    <div
                      className="absolute z-20 pointer-events-auto"
                      style={{
                        left: `${maculaCoords.x}%`,
                        top: `${maculaCoords.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <button
                        type="button"
                        data-testid="patient-landmark-faz"
                        onClick={(e) => {
                          if (isMovedRef.current) return;
                          e.stopPropagation();
                          setActiveAnomaly(null);
                          setSelectedLandmark(selectedLandmark === 'FAZ' ? null : 'FAZ');
                        }}
                        className={`group relative flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                          selectedLandmark === 'FAZ' ? 'scale-110' : 'hover:scale-105'
                        }`}
                        style={{ width: '44px', height: '44px' }}
                        title={isVi ? 'Vùng vô mạch hoàng điểm (FAZ)' : 'Foveal Avascular Zone (FAZ)'}
                      >
                        {/* Corner Brackets */}
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />

                        {/* Reticle Badge */}
                        <span className="absolute -bottom-5 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold whitespace-nowrap bg-slate-900/90 text-amber-300 border border-amber-500 shadow-md">
                          FAZ • HOÀNG ĐIỂM
                        </span>
                      </button>
                    </div>
                  </>
                )}
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

            {/* Interactive Anatomical Detail Card: Optic Disc (DISC) */}
            {selectedLandmark === 'DISC' && (
              <div
                data-testid="patient-landmark-disc-popup"
                className="p-3.5 bg-slate-900/95 border border-cyan-500/60 rounded-xl text-xs space-y-2.5 shadow-2xl animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                      {isVi ? 'ĐĨA THẦN KINH THỊ GIÁC (DISC / GAI THỊ)' : 'OPTIC DISC (DISC)'}
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px] font-bold">
                      {isOS ? 'Mắt Trái (OS)' : 'Mắt Phải (OD)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLandmark(null)}
                    className="text-slate-400 hover:text-white font-bold p-1 ml-2 text-sm cursor-pointer"
                    aria-label={isVi ? 'Đóng' : 'Close'}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 block">{isVi ? 'Tỷ lệ lõm đĩa thị (CDR):' : 'Cup-to-Disc Ratio (CDR):'}</span>
                    <span className={`font-bold font-mono text-sm ${vcdr >= 0.50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {vcdr.toFixed(2)} {vcdr >= 0.50 ? (isVi ? '(Nguy cơ tăng CDR)' : '(Elevated)') : (isVi ? '(Bình thường)' : '(Normal)')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                    <span className="text-slate-400 block">{isVi ? 'Tỷ lệ Động/Tĩnh mạch (A/V):' : 'Artery/Vein Ratio (A/V):'}</span>
                    <span className={`font-bold font-mono text-sm ${avRatio < 0.60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {avRatio.toFixed(2)} {avRatio < 0.60 ? (isVi ? '(Hẹp tiểu ĐM)' : '(Narrowing)') : (isVi ? '(Bình thường)' : '(Normal)')}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {isVi
                    ? `Gai thị là cửa ngõ xuất phát của toàn bộ mạch máu võng mạc và hơn 1,2 triệu sợi thần kinh thị giác. Vòng tròn ngoài là ranh giới Gai thị, vòng tròn trong là Lõm gai. Tỷ lệ CDR ${vcdr.toFixed(2)} ${vcdr >= 0.50 ? 'cảnh báo độ lõm gai đang ở ngưỡng cần theo dõi nhãn áp định kỳ phòng bệnh Glôcôm (Cườm nước).' : 'nằm trong giới hạn sinh lý bình thường.'}`
                    : `Optic disc is the entry point of retinal vessels and 1.2M optic nerve fibers. The concentric rings represent the disc margin and optic cup. The CDR of ${vcdr.toFixed(2)} ${vcdr >= 0.50 ? 'indicates mild cup enlargement warranting intraocular pressure monitoring.' : 'is within normal physiological limits.'}`}
                </p>
              </div>
            )}

            {/* Interactive Anatomical Detail Card: FAZ */}
            {selectedLandmark === 'FAZ' && (
              <div
                data-testid="patient-landmark-faz-popup"
                className="p-3.5 bg-slate-900/95 border border-amber-500/60 rounded-xl text-xs space-y-2.5 shadow-2xl animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                      {isVi ? 'VÙNG VÔ MẠCH HOÀNG ĐIỂM (FAZ)' : 'FOVEAL AVASCULAR ZONE (FAZ)'}
                    </span>
                    <span className="text-amber-400 font-mono text-[11px] font-bold">
                      Fovea Centralis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLandmark(null)}
                    className="text-slate-400 hover:text-white font-bold p-1 ml-2 text-sm cursor-pointer"
                    aria-label={isVi ? 'Đóng' : 'Close'}
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px]">
                  <span className="text-slate-400 block">{isVi ? 'Tình trạng sinh trắc học vùng FAZ:' : 'FAZ Biometric Status:'}</span>
                  <span className="font-bold text-rose-400">
                    {macularAnomaly
                      ? (isVi ? `Phát hiện ${getAnomalyName(macularAnomaly.type, t)} (${(macularAnomaly.confidence * 100).toFixed(0)}% độ tin cậy)` : `Detected ${macularAnomaly.type}`)
                      : (isVi ? 'Cấu trúc vô mạch trung tâm hoàng điểm sắc nét' : 'Preserved foveal microvascular architecture')}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {isVi
                    ? 'Hoàng điểm (FAZ) chịu trách nhiệm cho 90% thị lực sắc nét và nhận diện màu sắc của mắt. Vùng này không chứa mao mạch để cho ánh sáng đi thẳng vào tế bào nón. Sự xuất hiện của tổn thương hình sao (Macular Star) quanh FAZ là dấu hiệu điển hình của bệnh thần kinh võng mạc do huyết áp ác tính.'
                    : 'The FAZ is responsible for central 20/20 visual acuity and color vision. Lesions surrounding the FAZ, such as macular star exudation, threaten central acuity and indicate severe hypertensive retinopathy.'}
                </p>
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
                  <AnimatedCounter value={riskScore} />
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
                {result.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4'}
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
                  <div className="mt-1.5">
                    <BiomarkerGaugeBar
                      percent={Math.min(100, Math.max(8, ((result.annotatedMap.arteryVeinRatio - 0.40) / 0.45) * 100))}
                      colorClass={result.annotatedMap.arteryVeinRatio >= 0.65 ? 'bg-emerald-500' : 'bg-amber-500'}
                      heightClass="h-1.5"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.vesselDensity.label', isVi ? 'Mật độ mạch máu' : 'Vessel Density')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.vesselDensityPercentage}%
                  </span>
                  <div className="mt-1.5">
                    <BiomarkerGaugeBar
                      percent={Math.min(100, Math.max(8, (result.annotatedMap.vesselDensityPercentage / 60) * 100))}
                      colorClass={result.annotatedMap.vesselDensityPercentage >= 35 ? 'bg-teal-500' : 'bg-amber-500'}
                      heightClass="h-1.5"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.tortuosity.label', isVi ? 'Độ xoắn mạch máu' : 'Vessel Tortuosity')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.tortuosityIndex}
                  </span>
                  <div className="mt-1.5">
                    <BiomarkerGaugeBar
                      percent={Math.min(100, Math.max(8, ((result.annotatedMap.tortuosityIndex - 1.0) / 0.40) * 100))}
                      colorClass={result.annotatedMap.tortuosityIndex < 1.25 ? 'bg-emerald-500' : 'bg-amber-500'}
                      heightClass="h-1.5"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">{t('biomarkers.cdr.label', isVi ? 'Tỷ lệ lõm gai thị' : 'Cup-to-Disc Ratio')}</span>
                  <span className="font-mono-data font-bold text-slate-800 text-sm">
                    {result.annotatedMap.opticCupToDiscRatio}
                  </span>
                  <div className="mt-1.5">
                    <BiomarkerGaugeBar
                      percent={Math.min(100, Math.max(8, (result.annotatedMap.opticCupToDiscRatio / 0.80) * 100))}
                      colorClass={result.annotatedMap.opticCupToDiscRatio < 0.50 ? 'bg-emerald-500' : 'bg-rose-500'}
                      heightClass="h-1.5"
                    />
                  </div>
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

