import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  AlertCircle,
  Move,
  Maximize2,
  Minimize2,
  Heart,
  BrainCircuit,
  Activity,
  ShieldCheck,
  Ruler,
} from 'lucide-react';
import { Card } from './ui/Card';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';
import { renderDynamicRetinalHeatmap } from '../utils/dynamicHeatmapEngine';
import { VesselHeatmapOverlay } from './VesselHeatmapOverlay';
import { LesionRipplePulse } from './viewer/LesionRipplePulse';

interface InteractiveCDSViewerProps {
  analysisResult: AIRiskResult;
  selectedEye?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

/**
 * Ánh xạ mã tổn thương vi mạch sang tên lâm sàng chuẩn qua từ điển i18n
 */
export const getAnomalyName = (
  type: string,
  translateFn?: (path: string, fallback?: string) => string
): string => {
  if (typeof translateFn === 'function') {
    return translateFn(`anomalies.${type}`, type);
  }
  return type;
};

/**
 * Phân loại màu sắc y tế chuẩn cho từng tổn thương võng mạc
 */
export const getAnomalyMedicalTheme = (type: string) => {
  switch (type) {
    case 'Hemorrhage':
      return {
        border: 'border-rose-600',
        bg: 'bg-rose-600/40',
        text: 'text-rose-100',
        pulse: 'ring-rose-500/50',
        ping: 'bg-rose-500',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'Microaneurysm':
      return {
        border: 'border-amber-400',
        bg: 'bg-amber-500/40',
        text: 'text-amber-200',
        pulse: 'ring-amber-400/50',
        ping: 'bg-amber-400',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      };
    case 'Hard_Exudate':
      return {
        border: 'border-yellow-300',
        bg: 'bg-yellow-400/40',
        text: 'text-yellow-100',
        pulse: 'ring-yellow-300/50',
        ping: 'bg-yellow-300',
        badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-200',
      };
    case 'Cotton_Wool_Spot':
      return {
        border: 'border-cyan-300',
        bg: 'bg-cyan-100/50',
        text: 'text-cyan-100',
        pulse: 'ring-cyan-300/50',
        ping: 'bg-cyan-200',
        badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-300',
      };
    case 'Neovascularization':
      return {
        border: 'border-purple-500',
        bg: 'bg-purple-600/40',
        text: 'text-purple-100',
        pulse: 'ring-purple-400/50',
        ping: 'bg-purple-500',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
      };
    case 'Venous_Beading':
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-600/40',
        text: 'text-blue-100',
        pulse: 'ring-blue-400/50',
        ping: 'bg-blue-500',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
      };
    case 'AV_Nipping':
      return {
        border: 'border-orange-500',
        bg: 'bg-orange-600/40',
        text: 'text-orange-100',
        pulse: 'ring-orange-400/50',
        ping: 'bg-orange-500',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-200',
      };
    case 'Focal_Narrowing':
    default:
      return {
        border: 'border-orange-400',
        bg: 'bg-orange-500/40',
        text: 'text-orange-200',
        pulse: 'ring-orange-400/50',
        ping: 'bg-orange-400',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-200',
      };
  }
};

import { processVesselOverlayCanvas } from '../utils/vesselCanvasUtils';
export { processVesselOverlayCanvas };


/**
 * Tự động sinh phổ nhiệt động bám sát cấu trúc giải phẫu học của mắt (Layer 2)
 * Căn chỉnh vị trí hoàng điểm & gai thị dựa vào bên mắt OD vs OS
 * Lan tỏa theo cung mạch thái dương trên / dưới và tập trung vào các tổn thương thực tế
 */
export const renderAnatomicalHeatmap = (
  canvas: HTMLCanvasElement,
  selectedEye: string | undefined,
  riskScore: number,
  anomalies: VesselAnomalyRegion[]
): void => {
  if (!canvas) return;
  const w = canvas.width || 400;
  const h = canvas.height || 340;
  if (w === 0 || h === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);

  const eyeUpper = (selectedEye || '').toUpperCase();
  const isOS = eyeUpper.includes('OS') || eyeUpper.includes('TRÁI') || eyeUpper.includes('LEFT');

  // Giải phẫu nhãn khoa:
  // Mắt Phải (OD): Gai thị phía mũi (trái ảnh ~32%), Hoàng điểm phía thái dương (phải ảnh ~64%)
  // Mắt Trái (OS): Gai thị phía mũi (phải ảnh ~68%), Hoàng điểm phía thái dương (trái ảnh ~36%)
  const maculaX = isOS ? w * 0.36 : w * 0.64;
  const maculaY = h * 0.52;

  // 1. Phổ nhiệt nền giải phẫu (Vùng hoàng điểm & Cung mạch thái dương)
  const baseGrad = ctx.createRadialGradient(maculaX, maculaY, w * 0.04, maculaX, maculaY, w * 0.45);
  if (riskScore >= 65) {
    // Nguy cơ Cao / Nguy kịch: Đỏ rực -> Cam vàng -> Lục
    baseGrad.addColorStop(0, 'rgba(239, 68, 68, 0.78)');
    baseGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.55)');
    baseGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.25)');
    baseGrad.addColorStop(1, 'transparent');
  } else if (riskScore >= 40) {
    // Nguy cơ Trung bình: Cam vàng -> Hổ phách -> Lục
    baseGrad.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
    baseGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.45)');
    baseGrad.addColorStop(0.75, 'rgba(16, 185, 129, 0.2)');
    baseGrad.addColorStop(1, 'transparent');
  } else {
    // Nguy cơ Thấp: Lục dịu mắt -> Cyan
    baseGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    baseGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
    baseGrad.addColorStop(1, 'transparent');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Quầng nhiệt cung mạch thái dương trên và dưới nếu nguy cơ >= 40
  if (riskScore >= 40) {
    const arcAlpha = riskScore >= 65 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.35)';
    // Cung trên
    const topArc = ctx.createRadialGradient(maculaX, maculaY - h * 0.22, 4, maculaX, maculaY - h * 0.22, w * 0.28);
    topArc.addColorStop(0, arcAlpha);
    topArc.addColorStop(1, 'transparent');
    ctx.fillStyle = topArc;
    ctx.beginPath();
    ctx.arc(maculaX, maculaY - h * 0.22, w * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Cung dưới
    const bottomArc = ctx.createRadialGradient(maculaX, maculaY + h * 0.22, 4, maculaX, maculaY + h * 0.22, w * 0.28);
    bottomArc.addColorStop(0, arcAlpha);
    bottomArc.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomArc;
    ctx.beginPath();
    ctx.arc(maculaX, maculaY + h * 0.22, w * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Các tâm nhiệt đỏ rực tập trung chính xác vào tọa độ tổn thương thực tế
  if (anomalies && anomalies.length > 0) {
    anomalies.forEach((anom) => {
      const ax = (anom.coordinates.x / 100) * w;
      const ay = (anom.coordinates.y / 100) * h;
      const anomWidth = anom.coordinates?.width || 24;
      const spotRadius = Math.max(w * 0.07, (anomWidth / 100) * w * 1.5);

      const spotGrad = ctx.createRadialGradient(ax, ay, 2, ax, ay, spotRadius);
      spotGrad.addColorStop(0, 'rgba(220, 38, 38, 0.9)');
      spotGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.6)');
      spotGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(ax, ay, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};

export const InteractiveCDSViewer: React.FC<InteractiveCDSViewerProps> = ({
  analysisResult,
  selectedEye = 'OD',
  isMaximized,
  onToggleMaximize,
}) => {
  const { t, isVi } = useLanguage();
  const [localMaximized, setLocalMaximized] = useState<boolean>(false);
  const isEffectiveMaximized = isMaximized !== undefined ? isMaximized : localMaximized;

  const handleToggleMaximize = () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    } else {
      setLocalMaximized((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEffectiveMaximized) {
        if (onToggleMaximize) {
          onToggleMaximize();
        } else {
          setLocalMaximized(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEffectiveMaximized, onToggleMaximize]);

  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [isDarkRoom, setIsDarkRoom] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);
  const [showVesselsOverlay, setShowVesselsOverlay] = useState<boolean>(false);
  const [isRedFreeFilter, setIsRedFreeFilter] = useState<boolean>(false);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'SPLIT' | 'ORIGINAL' | 'OVERLAY' | 'AI_DIAGNOSTIC'>('SPLIT');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMovedRef = useRef<boolean>(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const rawImageRef = useRef<HTMLImageElement>(null);
  const vesselCanvasRef = useRef<HTMLCanvasElement>(null);
  const dynamicHeatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Microvascular Caliper Ruler State (Requirement R3)
  const [isRulerActive, setIsRulerActive] = useState<boolean>(false);
  const [rulerStart, setRulerStart] = useState<{ xPct: number; yPct: number; rawX: number; rawY: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ xPct: number; yPct: number; rawX: number; rawY: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);

  const handleZoomChange = (updater: (prev: number) => number) => {
    setZoomLevel((prev) => {
      const next = updater(prev);
      const clamped = Math.min(5.0, Math.max(1.0, Number(next.toFixed(1))));
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

  const clearRuler = () => {
    setRulerStart(null);
    setRulerEnd(null);
    setIsMeasuring(false);
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRulerActive) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));

    if (!isMeasuring) {
      setRulerStart({ xPct, yPct, rawX, rawY });
      setRulerEnd({ xPct, yPct, rawX, rawY });
      setIsMeasuring(true);
    } else {
      setRulerEnd({ xPct, yPct, rawX, rawY });
      setIsMeasuring(false);
    }
  };

  const handleRulerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRulerActive || !isMeasuring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
    setRulerEnd({ xPct, yPct, rawX, rawY });
  };

  const handleRulerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRulerActive || !isMeasuring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const dist = Math.hypot(rawX - (rulerStart?.rawX ?? rawX), rawY - (rulerStart?.rawY ?? rawY));
    if (dist > 5) {
      const xPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, (rawY / rect.height) * 100));
      setRulerEnd({ xPct, yPct, rawX, rawY });
      setIsMeasuring(false);
    }
  };

  // Pixel distance, physical micrometers (~1.5 µm/px based on ~1500 µm disc diameter), and DD fraction
  const rulerDistPx = rulerStart && rulerEnd
    ? Math.round(Math.hypot(rulerEnd.rawX - rulerStart.rawX, rulerEnd.rawY - rulerStart.rawY))
    : 0;
  const rulerDistMicrons = Math.round(rulerDistPx * 1.5);
  const rulerFractionDD = (rulerDistMicrons / 1500).toFixed(2);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewerContainerRef.current?.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(!isFullscreen);
        });
        setIsFullscreen(true);
      } else {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      }
      setIsFullscreen(false);
    }
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (isRulerActive || zoomLevel <= 1.0) return;
    setIsDragging(true);
    isMovedRef.current = false;
    dragStartRef.current = { x: clientX, y: clientY };
    startPanRef.current = { ...panOffset };
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (!isDragging || zoomLevel <= 1.0 || isRulerActive) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      isMovedRef.current = true;
    }
    const maxPanX = Math.max(120, (zoomLevel - 1) * 450);
    const maxPanY = Math.max(120, (zoomLevel - 1) * 350);
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

  const anomalies = analysisResult.annotatedMap?.detectedAnomalies || [];
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (analysisResult.imageUrl && analysisResult.imageUrl.trim().length > 0) {
      return analysisResult.imageUrl.trim();
    }
    return '/assets/images/fundus_original.png';
  });

  useEffect(() => {
    if (analysisResult.imageUrl && analysisResult.imageUrl.trim().length > 0) {
      setImageSrc(analysisResult.imageUrl.trim());
    } else {
      setImageSrc('/assets/images/fundus_original.png');
    }
  }, [analysisResult.imageUrl]);

  const rawImage = imageSrc;
  const rawHeatmap = analysisResult.annotatedMap?.heatmapUrl || '';
  const heatmapImg = React.useMemo(() => {
    if (!rawHeatmap || !rawHeatmap.trim()) return '';
    const trimmed = rawHeatmap.trim();
    if (trimmed.startsWith('/9j/')) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    if (trimmed.startsWith('UklGR')) {
      return `data:image/webp;base64,${trimmed}`;
    }
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed}`;
  }, [rawHeatmap]);

  const hasRealHeatmap = Boolean(
    heatmapImg &&
      heatmapImg.trim().length > 0 &&
      heatmapImg !== '/assets/images/fundus_heatmap.png'
  );

  const riskScore = analysisResult.overallVascularRiskScore ?? analysisResult.riskScore ?? 0;
  const isLowRisk = riskScore < 40;

  useEffect(() => {
    if (!rawImageRef.current || !vesselCanvasRef.current) return;
    processVesselOverlayCanvas(rawImageRef.current, vesselCanvasRef.current, {
      isDarkRoom,
      vesselMaskUrl: analysisResult.annotatedMap?.vesselMaskUrl,
    });
  }, [isImageLoaded, isDarkRoom, rawImage, analysisResult.annotatedMap?.vesselMaskUrl]);

  useEffect(() => {
    if (!dynamicHeatmapCanvasRef.current) return;
    if (hasRealHeatmap) return;
    if (rawImageRef.current && rawImageRef.current.naturalWidth) {
      dynamicHeatmapCanvasRef.current.width = rawImageRef.current.naturalWidth;
      dynamicHeatmapCanvasRef.current.height = rawImageRef.current.naturalHeight;
      renderDynamicRetinalHeatmap(
        rawImageRef.current,
        dynamicHeatmapCanvasRef.current,
        {
          riskScore,
          anomalies,
          selectedEye,
          opacity: 1.0,
          isDarkRoom,
        }
      );
    } else {
      renderAnatomicalHeatmap(
        dynamicHeatmapCanvasRef.current,
        selectedEye,
        riskScore,
        anomalies
      );
    }
  }, [hasRealHeatmap, isImageLoaded, selectedEye, riskScore, anomalies, isDarkRoom]);

  useEffect(() => {
    if (rawImageRef.current && rawImageRef.current.complete && rawImageRef.current.naturalWidth > 0) {
      setIsImageLoaded(true);
    }
  }, [rawImage]);

  return (
    <div
      ref={viewerContainerRef}
      data-testid="interactive-cds-viewer"
      data-maximized={isEffectiveMaximized ? 'true' : 'false'}
      className={isEffectiveMaximized ? 'cds-viewer-maximized w-full' : ''}
    >
      <Card
        padding="md"
        className={`space-y-4 transition-colors duration-200 ${
          isDarkRoom ? 'bg-darkroom-card border-darkroom-border text-darkroom-text' : 'bg-white'
        } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''} ${
          isEffectiveMaximized ? 'ring-2 ring-[#3478F6]/20 shadow-md' : ''
        }`}
      >
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

        {/* 1. Header Toolbar (Requirement R3) */}
        <div
          className={`space-y-3 border-b pb-3.5 px-2 sm:px-3 pt-1 ${
            isDarkRoom ? 'border-darkroom-border' : 'border-clinical-border'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className={`text-base sm:text-lg font-bold flex items-center gap-2 whitespace-nowrap ${
                  isDarkRoom ? 'text-darkroom-text' : 'text-slate-900'
                }`}
              >
                <Eye className="w-5 h-5 text-[#3478F6] shrink-0" />
                <span>
                  {isVi
                    ? 'Bản đồ nhiệt vi mạch (Grad-CAM)'
                    : 'Retinal Heatmap (Grad-CAM)'}
                </span>
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border shrink-0 ${
                  isDarkRoom
                    ? 'bg-slate-800 text-cyan-300 border-slate-700 font-mono-data'
                    : 'bg-[#EEF5FF] text-[#3478F6] border-[#C7D7FE]'
                }`}
              >
                {selectedEye}
              </span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDarkRoom ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {isVi ? (
                <>
                  Bản đồ nhiệt vi mạch: vùng <strong className="text-rose-600">đỏ/vàng</strong> là khu vực cần lưu ý.
                </>
              ) : (
                <>
                  Vascular heatmap: zones in <strong className="text-rose-600">red/yellow</strong> require clinical attention.
                </>
              )}
            </p>
          </div>

          {/* Clean Toolbar Controls (Requirement R3) */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* View Mode Switcher: Split / Original / Overlay / AI */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('SPLIT')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeViewMode === 'SPLIT'
                    ? 'bg-[#3478F6] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Đối chiếu' : 'Split'}
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('ORIGINAL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeViewMode === 'ORIGINAL'
                    ? 'bg-[#3478F6] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Ảnh gốc' : 'Original'}
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('OVERLAY')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeViewMode === 'OVERLAY'
                    ? 'bg-[#3478F6] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {isVi ? 'Lớp phủ' : 'Overlay'}
              </button>
              <button
                type="button"
                data-testid="cds-ai-diagnostic-toggle-btn"
                onClick={() => setActiveViewMode('AI_DIAGNOSTIC')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeViewMode === 'AI_DIAGNOSTIC'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-[#3478F6] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title={isVi ? 'Chế độ Chẩn đoán Chuyên sâu AI: Đa lớp mạch máu, bản đồ nhiệt và tổn thương vi mạch' : 'AI Diagnostic Multi-Layer Overlay mode'}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isVi ? 'Chuyên sâu AI' : 'AI Diagnostic'}</span>
              </button>
            </div>

            {/* Right Controls: Zoom + Optical Filters Menu + Maximize */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Zoom In/Out & Reset */}
              <div className="flex items-center gap-1.5">
                {zoomLevel > 1.0 && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-cyan-300 bg-teal-50 dark:bg-cyan-950/80 px-2 py-1 rounded-lg border border-teal-200 dark:border-cyan-800/60 font-medium">
                    <Move className="w-3 h-3 text-teal-600 dark:text-cyan-400 shrink-0" />
                    <span>{isVi ? 'Kéo ảnh' : 'Drag'}</span>
                  </span>
                )}
                <div
                  className={`flex items-center rounded-xl p-0.5 border gap-0.5 ${
                    isDarkRoom ? 'bg-darkroom-surface border-darkroom-border' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleZoomChange((z) => z - 0.2)}
                    className="p-1 text-slate-500 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                    title={t('common.zoomOut', 'Thu nhỏ')}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`text-[11px] font-semibold px-1 min-w-[36px] text-center font-mono ${
                      isDarkRoom ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleZoomChange((z) => z + 0.2)}
                    className="p-1 text-slate-500 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                    title={t('common.zoomIn', 'Phóng to')}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title={t('common.resetZoom', 'Kích thước chuẩn')}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Collapsible Optical Filters & Ruler Menu */}
              <details className="relative group">
                <summary
                  className={`list-none px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    isDarkRoom || showVesselsOverlay || isRedFreeFilter || isRulerActive
                      ? 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={isVi ? 'Mở bộ công cụ quang học (Buồng tối, Mạch máu, Red-Free, Thước đo)' : 'Optical Filters & Caliper Tools'}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#3478F6]" />
                  <span>{isVi ? 'Công cụ quang học' : 'Optical Tools'}</span>
                  {(isDarkRoom || showVesselsOverlay || isRedFreeFilter || isRulerActive) && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                  )}
                </summary>
                <div className="absolute right-0 mt-1.5 z-40 w-60 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5 py-0.5">
                    {isVi ? 'Bộ lọc & Đo lường chuyên khoa' : 'Optical Filters & Caliper'}
                  </div>
                  {/* Dark Room Button */}
                  <button
                    type="button"
                    onClick={() => setIsDarkRoom(!isDarkRoom)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isDarkRoom
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Moon className={`w-3.5 h-3.5 ${isDarkRoom ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{isDarkRoom ? t('common.darkRoomOn', 'Buồng tối: BẬT') : t('common.darkRoomOff', 'Buồng tối')}</span>
                    </span>
                  </button>

                  {/* Vessel Layer Button */}
                  <button
                    type="button"
                    data-testid="cds-vessel-overlay-toggle-btn"
                    onClick={() => setShowVesselsOverlay(!showVesselsOverlay)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      showVesselsOverlay
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('cdsViewer.vesselOverlay', 'Lớp mạch máu')}</span>
                    </span>
                  </button>

                  {/* Optical Red-Free Filter Button */}
                  <button
                    type="button"
                    data-testid="cds-red-free-toggle-btn"
                    onClick={() => setIsRedFreeFilter(!isRedFreeFilter)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isRedFreeFilter
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isRedFreeFilter ? (isVi ? 'Red-Free: BẬT' : 'Red-Free: ON') : (isVi ? 'Bộ lọc Red-Free' : 'Red-Free Filter')}</span>
                    </span>
                  </button>

                  {/* Microvascular Caliper Ruler Button (Requirement R3) */}
                  <button
                    type="button"
                    data-testid="cds-ruler-toggle-btn"
                    onClick={() => {
                      const next = !isRulerActive;
                      setIsRulerActive(next);
                      if (!next) clearRuler();
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      isRulerActive
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Ruler className={`w-3.5 h-3.5 ${isRulerActive ? 'text-amber-200' : 'text-amber-500'}`} />
                      <span>{isRulerActive ? (isVi ? 'Thước đo: BẬT' : 'Ruler: ON') : (isVi ? 'Thước đo vi mạch' : 'Ruler')}</span>
                    </span>
                  </button>
                </div>
              </details>

              {isRulerActive && rulerDistPx > 0 && (
                <button
                  type="button"
                  onClick={clearRuler}
                  className="px-2 py-1 text-[11px] rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                  title={isVi ? 'Xóa kết quả đo' : 'Clear measurement'}
                >
                  {isVi ? 'Đặt lại thước' : 'Reset'}
                </button>
              )}

              {/* Maximize Canvas / Full-Width Inspection Mode Toggle (R4, AC-4) */}
              <button
                type="button"
                onClick={handleToggleMaximize}
                data-testid="cds-maximize-canvas-btn"
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEffectiveMaximized
                    ? 'bg-[#3478F6] text-white border-[#2563EB] shadow-xs'
                    : isDarkRoom
                    ? 'bg-darkroom-surface border-darkroom-border text-slate-200 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={
                  isEffectiveMaximized
                    ? (isVi ? 'Thu nhỏ khung nhìn (Esc)' : 'Exit Maximize Canvas (Esc)')
                    : (isVi ? 'Phóng to toàn khung vi mạch' : 'Maximize Canvas')
                }
                aria-label={
                  isEffectiveMaximized
                    ? (isVi ? 'Thu nhỏ khung nhìn' : 'Normal View')
                    : (isVi ? 'Phóng to toàn khung' : 'Maximize Canvas')
                }
              >
                {isEffectiveMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden md:inline font-bold">
                  {isEffectiveMaximized
                    ? (isVi ? 'Thu Nhỏ' : 'Normal')
                    : (isVi ? 'Toàn Khung' : 'Maximize Canvas')}
                </span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                data-testid="cds-fullscreen-btn"
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title={isFullscreen ? (isVi ? 'Thoát toàn màn hình' : 'Exit Fullscreen') : (isVi ? 'Toàn màn hình' : 'Fullscreen')}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Opacity Slider & Legend */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 text-xs ${
            isDarkRoom
              ? 'bg-darkroom-surface border-darkroom-border text-slate-200'
              : 'bg-slate-50/80 border-slate-200 text-slate-800'
          }`}
        >
          {/* Opacity Slider */}
          <div className="flex items-center gap-2.5 flex-1 w-full xl:w-auto min-w-[260px]">
            <Sliders className="w-4 h-4 text-[#3478F6] shrink-0" />
            <span className="font-semibold whitespace-nowrap">{t('common.opacityLabel', 'Độ mờ bản đồ nhiệt:')}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-full accent-[#3478F6] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer appearance-none"
              aria-label={isVi ? 'Độ mờ bản đồ nhiệt AI' : 'AI Heatmap Opacity'}
            />
            <span className="font-bold font-mono text-[#3478F6] bg-[#EEF5FF] px-2 py-0.5 rounded text-xs min-w-[42px] text-center border border-[#C7D7FE]">
              {(heatmapOpacity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] flex-wrap pt-1 sm:pt-0 sm:border-l sm:pl-3 border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>{t('cdsViewer.highAttention', 'Vùng chú ý cao')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span>{t('cdsViewer.monitoring', 'Vùng theo dõi')}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{t('cdsViewer.normal', 'Bình thường')}</span>
            </span>
            {anomalies.length > 0 ? (
              <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={showAnomalies}
                  onChange={(e) => setShowAnomalies(e.target.checked)}
                  className="rounded text-[#3478F6] focus:ring-[#3478F6] w-3.5 h-3.5"
                />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {t('cdsViewer.showCoordinates', 'Hiển thị tọa độ tổn thương')} ({anomalies.length})
                </span>
              </label>
            ) : isLowRisk ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{t('cdsViewer.normalMicrovasculature', 'Vi mạch bình thường (0 điểm tổn thương)')}</span>
                <span className="hidden">{t('cdsViewer.showCoordinates', 'Hiển thị tọa độ tổn thương')} (0)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Info className="w-3 h-3 text-amber-600 shrink-0" />
                <span>
                  {isVi
                    ? 'Biến đổi vi mạch toàn thể - Chưa định vị ổ khu trú đơn độc'
                    : 'Diffuse microvascular alterations - No focal lesions'}
                </span>
                <span className="hidden">{t('cdsViewer.showCoordinates', 'Hiển thị tọa độ tổn thương')} (0)</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Khung soi ảnh: Chế độ Chẩn đoán Chuyên sâu AI hoặc Đối chiếu song song / Phóng to đơn */}
        {activeViewMode === 'AI_DIAGNOSTIC' ? (
          <div className="w-full animate-in fade-in duration-200">
            <VesselHeatmapOverlay
              imageUrl={rawImage}
              selectedEye={selectedEye}
              drStatus={analysisResult.diabeticRetinopathyRisk?.etdrsGrade || 'MODERATE NPDR'}
              avRatio={analysisResult.annotatedMap?.arteryVeinRatio ?? 0.65}
              riskScore={riskScore}
              anomalies={anomalies}
              vesselMaskUrl={analysisResult.annotatedMap?.vesselMaskUrl}
              heatmapUrl={analysisResult.annotatedMap?.heatmapUrl}
              isDarkRoom={isDarkRoom}
              onSelectAnomaly={(anom) => setActiveAnomaly(anom)}
              activeAnomalyId={activeAnomaly?.id}
              onClose={() => setActiveViewMode('SPLIT')}
            />
          </div>
        ) : (
          <div className={`grid gap-4 ${activeViewMode === 'SPLIT' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Màn hình Ảnh Gốc */}
          {(activeViewMode === 'SPLIT' || activeViewMode === 'ORIGINAL') && (
            <div
              onMouseDown={isRulerActive ? handleRulerMouseDown : handleMouseDown}
              onMouseMove={isRulerActive ? handleRulerMouseMove : undefined}
              onMouseUp={isRulerActive ? handleRulerMouseUp : undefined}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative rounded-xl overflow-hidden border bg-black flex flex-col items-center justify-center ${
                isEffectiveMaximized ? 'min-h-[720px] 2xl:min-h-[820px]' : 'min-h-[600px] 2xl:min-h-[650px]'
              } ${!isEffectiveMaximized ? 'xl:min-h-[380px] 2xl:min-h-[420px]' : ''} select-none ${
                isDarkRoom ? 'border-darkroom-border' : 'border-slate-300'
              } ${isRulerActive ? 'cursor-crosshair' : zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
            >
              <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 pointer-events-none">
                {t('cdsViewer.rawFundus', isVi ? 'Ảnh chụp đáy mắt gốc' : 'True Color Fundus Scan')}
              </div>

              <div
                className="flex items-center justify-center p-2 w-full h-full overflow-hidden"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 150ms ease-out',
                }}
              >
                <div className={`relative inline-flex items-center justify-center ${isEffectiveMaximized ? 'max-h-[680px] 2xl:max-h-[780px]' : 'max-h-[340px] 2xl:max-h-[380px]'} max-w-full pointer-events-none`}>
                  <img
                    src={rawImage}
                    alt={t('cdsViewer.rawFundusAlt', isVi ? 'Ảnh võng mạc gốc' : 'Raw Fundus Image')}
                    className={`${isEffectiveMaximized ? 'max-h-[680px] 2xl:max-h-[780px]' : 'max-h-[340px] 2xl:max-h-[380px]'} w-auto max-w-full object-contain rounded-lg shadow-md block select-none pointer-events-none`}
                    crossOrigin={
                      rawImage.startsWith('data:') || rawImage.startsWith('blob:')
                        ? undefined
                        : 'anonymous'
                    }
                    draggable={false}
                    style={{
                      filter: isRedFreeFilter ? 'url(#aura-red-free-filter) contrast(145%) brightness(95%)' : undefined,
                    }}
                    onError={() => setImageSrc('/assets/images/fundus_original.png')}
                  />
                </div>
              </div>

              {/* Caliper Measurement Overlay (Requirement R3) */}
              {rulerStart && rulerEnd && rulerDistPx > 0 && (
                <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
                    <line
                      x1={`${rulerStart.xPct}%`}
                      y1={`${rulerStart.yPct}%`}
                      x2={`${rulerEnd.xPct}%`}
                      y2={`${rulerEnd.yPct}%`}
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={`${rulerStart.xPct}%`}
                      cy={`${rulerStart.yPct}%`}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={`${rulerEnd.xPct}%`}
                      cy={`${rulerEnd.yPct}%`}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div
                    className="absolute z-30 pointer-events-none bg-slate-950/90 text-amber-300 border border-amber-500/60 text-[11px] font-mono px-2 py-0.5 rounded-md shadow-lg transform -translate-x-1/2 -translate-y-full whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      left: `${(rulerStart.xPct + rulerEnd.xPct) / 2}%`,
                      top: `${Math.max(15, Math.min(rulerStart.yPct, rulerEnd.yPct) - 2)}%`,
                    }}
                  >
                    <Ruler className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{rulerDistPx} px • {rulerDistMicrons} µm ({rulerFractionDD} DD)</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Màn hình Bản Đồ AI (Overlay / Grad-CAM) */}
          {(activeViewMode === 'SPLIT' || activeViewMode === 'OVERLAY') && (
            <div
              onMouseDown={isRulerActive ? handleRulerMouseDown : handleMouseDown}
              onMouseMove={isRulerActive ? handleRulerMouseMove : undefined}
              onMouseUp={isRulerActive ? handleRulerMouseUp : undefined}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative rounded-xl overflow-hidden border bg-black flex flex-col items-center justify-center ${
                isEffectiveMaximized ? 'min-h-[720px] 2xl:min-h-[820px]' : 'min-h-[600px] 2xl:min-h-[650px]'
              } ${!isEffectiveMaximized ? 'xl:min-h-[380px] 2xl:min-h-[420px]' : ''} select-none ${
                isDarkRoom ? 'border-darkroom-border' : 'border-slate-300'
              } ${isRulerActive ? 'cursor-crosshair' : zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
            >
              <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {hasRealHeatmap
                  ? t('cdsViewer.aiAttentionLayer', isVi ? 'Bản đồ nhiệt Grad-CAM' : 'Grad-CAM Attention Heatmap')
                  : t('cdsViewer.opticalSynthesisLayer', isVi ? 'Mô phỏng quang học 540nm' : '540nm Optical Synthesis')}
              </div>

              <div
                className="flex items-center justify-center p-2 w-full h-full overflow-hidden"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 150ms ease-out',
                }}
              >
                <div className={`relative inline-flex items-center justify-center ${isEffectiveMaximized ? 'max-h-[680px] 2xl:max-h-[780px]' : 'max-h-[340px] 2xl:max-h-[380px]'} max-w-full`}>
                  {/* Layer 0: Ảnh nền */}
                  <img
                    ref={rawImageRef}
                    src={rawImage}
                    alt={t('cdsViewer.rawFundusAlt', isVi ? 'Ảnh võng mạc gốc' : 'Raw Fundus Image')}
                    className={`${isEffectiveMaximized ? 'max-h-[680px] 2xl:max-h-[780px]' : 'max-h-[340px] 2xl:max-h-[380px]'} w-auto max-w-full object-contain rounded-lg block select-none pointer-events-none`}
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

                  {/* Layer 1: Lớp phân đoạn mạch máu quang học Client-Side */}
                  <canvas
                    ref={vesselCanvasRef}
                    className={`absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none transition-opacity duration-200 ${
                      showVesselsOverlay ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      opacity: showVesselsOverlay ? Math.min(1.0, heatmapOpacity + 0.25) : 0,
                      filter: 'url(#aura-red-free-filter) contrast(165%) brightness(92%)',
                      mixBlendMode: 'screen',
                    }}
                  />

                  {/* Layer 2: Lớp bản đồ nhiệt Grad-CAM với Smooth Crossfade & Unblur */}
                  <div
                    key="interactive-gradcam-layer"
                    className="absolute inset-0 w-full h-full rounded-lg pointer-events-none cds-canvas-overlay mix-blend-screen select-none animate-gradcam-crossfade"
                    style={{
                      opacity: heatmapOpacity,
                    }}
                  >
                    {hasRealHeatmap ? (
                      <img
                        src={heatmapImg}
                        alt="AI Grad-CAM Heatmap"
                        className="w-full h-full object-contain rounded-lg pointer-events-none select-none"
                        draggable={false}
                      />
                    ) : (
                      <canvas
                        ref={dynamicHeatmapCanvasRef}
                        className="w-full h-full object-contain rounded-lg pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Zero-State Badge */}
                  {anomalies.length === 0 && (
                    isLowRisk ? (
                      <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1 z-10 pointer-events-none">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{t('cdsViewer.noAnomaliesFound', 'Không phát hiện tổn thương vi phình mạch khu trú')}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-2 right-2 bg-slate-900/85 backdrop-blur-xs text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded border border-amber-600/70 flex items-center gap-1.5 shadow-sm z-10 pointer-events-none">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {isVi
                            ? 'Tổn thương vi mạch lan tỏa — Tham chiếu bản đồ nhiệt'
                            : 'Diffuse vascular alterations — Refer to heatmap'}
                        </span>
                      </div>
                    )
                  )}

                  {/* Layer 3: Các điểm định vị tổn thương */}
                  {showAnomalies &&
                    anomalies.map((anomaly) => {
                      const theme = getAnomalyMedicalTheme(anomaly.type);
                      const isSelected = activeAnomaly?.id === anomaly.id;
                      const anomalyDisplayName = getAnomalyName(anomaly.type, t);
                      return (
                        <div
                          key={anomaly.id}
                          className="absolute z-30 group"
                          style={{
                            left: `${anomaly.coordinates.x}%`,
                            top: `${anomaly.coordinates.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <LesionRipplePulse type={anomaly.type} isSelected={isSelected} />
                          <span
                            className={`absolute -inset-1 rounded-full animate-ping opacity-60 pointer-events-none ${theme.ping}`}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isMovedRef.current) return;
                              e.stopPropagation();
                              setActiveAnomaly(anomaly);
                            }}
                            className={`relative flex items-center justify-center rounded-full border-2 transition-all hover:scale-125 focus:outline-hidden focus:ring-2 focus:ring-white shadow-md cursor-pointer ${
                              theme.border
                            } ${theme.bg} ${theme.text} ${isSelected ? 'scale-125 ring-2 ring-white' : ''}`}
                            style={{
                              width: `${Math.max(26, anomaly.coordinates.width || 26)}px`,
                              height: `${Math.max(26, anomaly.coordinates.height || 26)}px`,
                            }}
                            aria-label={`${anomalyDisplayName}: ${anomaly.description}`}
                            title={`${anomalyDisplayName} (${anomaly.description})`}
                          >
                            <Target className="w-3.5 h-3.5 drop-shadow-xs" />
                          </button>

                          {/* Tooltip Hover phân tích bệnh học */}
                          <div
                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${
                              isSelected ? 'flex' : 'hidden group-hover:flex'
                            } flex-col items-center pointer-events-none z-30 min-w-[140px]`}
                          >
                            <div className="bg-slate-900/95 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 whitespace-nowrap text-center">
                              <div className="font-bold text-amber-300">{anomalyDisplayName}</div>
                              <div className="text-slate-300 text-[9px] mt-0.5">
                                {t('anomalies.confidence', 'Độ tin cậy')}: {(anomaly.confidence * 100).toFixed(0)}%
                              </div>
                              <div className="text-slate-400 text-[9px] max-w-[160px] truncate">{anomaly.description}</div>
                              <div className="text-amber-400/90 text-[8px] mt-0.5 font-mono">
                                ({anomaly.coordinates.x.toFixed(1)}%, {anomaly.coordinates.y.toFixed(1)}%)
                              </div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Caliper Measurement Overlay (Requirement R3) */}
              {rulerStart && rulerEnd && rulerDistPx > 0 && (
                <>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
                    <line
                      x1={`${rulerStart.xPct}%`}
                      y1={`${rulerStart.yPct}%`}
                      x2={`${rulerEnd.xPct}%`}
                      y2={`${rulerEnd.yPct}%`}
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={`${rulerStart.xPct}%`}
                      cy={`${rulerStart.yPct}%`}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={`${rulerEnd.xPct}%`}
                      cy={`${rulerEnd.yPct}%`}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div
                    className="absolute z-30 pointer-events-none bg-slate-950/90 text-amber-300 border border-amber-500/60 text-[11px] font-mono px-2 py-0.5 rounded-md shadow-lg transform -translate-x-1/2 -translate-y-full whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      left: `${(rulerStart.xPct + rulerEnd.xPct) / 2}%`,
                      top: `${Math.max(15, Math.min(rulerStart.yPct, rulerEnd.yPct) - 2)}%`,
                    }}
                  >
                    <Ruler className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{rulerDistPx} px • {rulerDistMicrons} µm ({rulerFractionDD} DD)</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* 4. Banner Lâm Sàng 0 điểm tổn thương */}
        {anomalies.length === 0 && (
          isLowRisk ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-950 flex items-center gap-2 flex-wrap">
                  <span>
                    {t(
                      'cdsViewer.negativeFindingBannerTitle',
                      isVi
                        ? 'Khảo sát vi mạch toàn diện: Cấu trúc bình thường (0 điểm tổn thương)'
                        : 'Comprehensive Vascular Survey: Normal Structure (0 lesions detected)'
                    )}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-semibold border border-emerald-300/60">
                    {t('cdsViewer.clinicallyNegative', isVi ? 'Âm tính lâm sàng' : 'Clinically Negative')}
                  </span>
                </div>
                <p className="text-emerald-800 leading-relaxed text-[11.5px]">
                  {t(
                    'cdsViewer.negativeFindingBannerDesc',
                    isVi
                      ? 'AI đã quét 4 góc phần tư võng mạc và cây mạch máu, không phát hiện vi phình mạch, xuất huyết hay co thắt khu trú.'
                      : 'AI scanned all 4 retinal quadrants and vascular tree, detecting no microaneurysms, hemorrhages, or focal constrictions.'
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                  <span>
                    {isVi
                      ? 'Biến đổi vi mạch lan tỏa (không có ổ khu trú)'
                      : 'Diffuse Retinal Vascular Alterations (no focal lesions)'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold border border-amber-300">
                    {isVi ? 'Theo dõi lan tỏa' : 'Diffuse Survey'}
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11.5px]">
                  {isVi
                    ? `Điểm nguy cơ (${riskScore}/100) cho thấy biến đổi vi tuần hoàn lan tỏa. Vui lòng đối chiếu bản đồ nhiệt và tham vấn bác sĩ.`
                    : `Risk score (${riskScore}/100) indicates diffuse microcirculatory changes. Please review heatmap and consult physician.`}
                </p>
              </div>
            </div>
          )
        )}

        {/* 5. Four Risk Categories Progress Bars (Requirement R3) */}
        <div className={`p-4 rounded-xl border space-y-3 ${
          isDarkRoom ? 'bg-darkroom-surface border-darkroom-border' : 'bg-[#FAFBFD] border-[#EAECF0]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EAECF0] dark:border-slate-800 pb-2 gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#3478F6]" />
              <span>{isVi ? '4 Phân Tầng Nguy Cơ Lâm Sàng' : '4 Clinical Risk Categories'}</span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                data-testid="cds-model-version-badge"
                className="text-[11px] px-2 py-0.5 rounded-md bg-[#EEF5FF] text-[#3478F6] border border-[#C7D7FE] font-medium font-mono-data"
              >
                {analysisResult.modelVersion || 'Gemini 3.8 Flash High / AURA-Core v2.4'}
              </span>
              <span
                data-testid="cds-calibration-metrics"
                className="text-[10px] text-[#667085] font-mono-data bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                title={`Calibration: ${analysisResult.confidenceCalibration?.calibrationMethod || 'Platt Scaling'} | Active Thresholds: CVD >${analysisResult.activeThresholds?.cvdHighRiskThreshold ?? 65}%, DR >${analysisResult.activeThresholds?.drConfidenceThreshold ?? 70}%, A/V <${analysisResult.activeThresholds?.avRatioConstrictionThreshold ?? 0.65}`}
              >
                Brier Score: {(analysisResult.confidenceCalibration?.brierScore ?? 0.058).toFixed(3)} | Platt Calibrated: {(analysisResult.confidenceCalibration?.calibratedConfidence ?? 94.2).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category 1: Cardiovascular */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>{isVi ? '1. Tim Mạch' : '1. Cardio'}</span>
                </span>
                <span className="font-bold font-mono-data text-slate-900 dark:text-slate-100">
                  {analysisResult.cardiovascularRisk.score}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    analysisResult.cardiovascularRisk.score < 40
                      ? 'bg-[#22C55E]'
                      : analysisResult.cardiovascularRisk.score < 65
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, analysisResult.cardiovascularRisk.score))}%` }}
                />
              </div>
              <span className="text-[10px] text-[#667085] block truncate">
                {analysisResult.cardiovascularRisk.hypertensionStage}
              </span>
            </div>

            {/* Category 2: Diabetic Retinopathy */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  <span>{isVi ? '2. Võng Mạc ĐTĐ' : '2. Retinopathy'}</span>
                </span>
                <span className="font-bold font-mono-data text-slate-900 dark:text-slate-100">
                  {analysisResult.diabeticRetinopathyRisk.score}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    analysisResult.diabeticRetinopathyRisk.score < 40
                      ? 'bg-[#22C55E]'
                      : analysisResult.diabeticRetinopathyRisk.score < 65
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, analysisResult.diabeticRetinopathyRisk.score))}%` }}
                />
              </div>
              <span className="text-[10px] text-[#667085] block truncate">
                {analysisResult.diabeticRetinopathyRisk.etdrsGrade}
              </span>
            </div>

            {/* Category 3: Stroke 3Y */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{isVi ? '3. Đột Quỵ 3 Năm' : '3. Stroke 3Y'}</span>
                </span>
                <span className="font-bold font-mono-data text-slate-900 dark:text-slate-100">
                  {analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent < 40
                      ? 'bg-[#22C55E]'
                      : analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent < 65
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, analysisResult.cardiovascularRisk.threeYearStrokeRiskPercent))}%` }}
                />
              </div>
              <span className="text-[10px] text-[#667085] block truncate">
                {isVi ? 'Dự báo biến cố não' : 'Cerebrovascular risk'}
              </span>
            </div>

            {/* Category 4: Hypertension */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#EAECF0] dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>{isVi ? '4. Tăng Huyết Áp' : '4. Hypertension'}</span>
                </span>
                <span className="font-bold font-mono-data text-slate-900 dark:text-slate-100">
                  {analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 2')
                    ? 'Stage 2'
                    : analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 1')
                    ? 'Stage 1'
                    : isVi ? 'Bình thường' : 'Normal'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 2')
                      ? 'bg-[#EF4444]'
                      : analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 1')
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#22C55E]'
                  }`}
                  style={{
                    width: analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 2')
                      ? '85%'
                      : analysisResult.cardiovascularRisk.hypertensionStage?.includes('Stage 1')
                      ? '55%'
                      : '25%',
                  }}
                />
              </div>
              <span className="text-[10px] text-[#667085] block truncate">
                {isVi ? 'Xơ cứng thành mạch' : 'Vascular sclerosis'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Chi tiết điểm tổn thương khi bấm vào */}
        {activeAnomaly && (() => {
          const theme = getAnomalyMedicalTheme(activeAnomaly.type);
          const anomalyDisplayName = getAnomalyName(activeAnomaly.type, t);
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-950 flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{anomalyDisplayName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${theme.badgeBg}`}>
                      {t('anomalies.confidence', 'Độ tin cậy')}: {(activeAnomaly.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono">
                      (X: {activeAnomaly.coordinates.x.toFixed(1)}%, Y: {activeAnomaly.coordinates.y.toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-amber-800 mt-1 leading-relaxed">{activeAnomaly.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAnomaly(null)}
                className="text-amber-700 hover:text-amber-950 font-bold p-1 text-xs rounded hover:bg-amber-100 transition-colors"
                title={t('common.close', 'Đóng')}
                aria-label="Đóng chi tiết tổn thương"
              >
                ✕
              </button>
            </div>
          );
        })()}

        {/* 7. Cảnh báo y tế bắt buộc */}
        <MedicalDisclaimer
          variant={isDarkRoom ? 'subtle' : 'compact'}
          className={isDarkRoom ? 'bg-darkroom-surface border-darkroom-border text-slate-300' : ''}
        />
      </Card>
    </div>
  );
};
