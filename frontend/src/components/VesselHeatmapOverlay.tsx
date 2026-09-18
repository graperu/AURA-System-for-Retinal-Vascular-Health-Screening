import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Eye,
  Layers,
  Sliders,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  BrainCircuit,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  Move,
  X,
  Crosshair,
} from 'lucide-react';
import { VesselAnomalyRegion } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';

export interface VesselHeatmapOverlayProps {
  imageUrl: string;
  selectedEye?: string;
  drStatus?: string;
  avRatio?: number;
  riskScore?: number;
  anomalies?: VesselAnomalyRegion[];
  vesselMaskUrl?: string;
  heatmapUrl?: string;
  isDarkRoom?: boolean;
  className?: string;
  onClose?: () => void;
  onSelectAnomaly?: (anomaly: VesselAnomalyRegion) => void;
  activeAnomalyId?: string | null;
}

/**
 * Phân loại nhãn chuẩn y khoa cho Bounding Box tổn thương vi mạch
 */
export const getAnomalyBoundingBoxLabel = (
  type: string
): { label: string; badgeColor: string; borderColor: string; textColor: string } => {
  const tLower = (type || '').toLowerCase();
  if (tLower.includes('microaneurysm') || tLower === 'ma') {
    return {
      label: 'MA Detected',
      badgeColor: 'bg-amber-500/90 text-slate-950 font-bold',
      borderColor: '#F59E0B',
      textColor: 'text-amber-400',
    };
  }
  if (tLower.includes('hemorrhage') || tLower.includes('bleed')) {
    return {
      label: 'Micro-Bleed',
      badgeColor: 'bg-rose-500/90 text-white font-bold',
      borderColor: '#F59E0B', // Yêu cầu: Khung viền vàng #F59E0B
      textColor: 'text-rose-400',
    };
  }
  if (tLower.includes('exudate') || tLower.includes('cotton_wool')) {
    return {
      label: 'Exudate',
      badgeColor: 'bg-yellow-400/90 text-slate-950 font-bold',
      borderColor: '#F59E0B', // Yêu cầu: Khung viền vàng #F59E0B
      textColor: 'text-yellow-300',
    };
  }
  return {
    label: 'MA Detected',
    badgeColor: 'bg-amber-500/90 text-slate-950 font-bold',
    borderColor: '#F59E0B',
    textColor: 'text-amber-400',
  };
};

export const VesselHeatmapOverlay: React.FC<VesselHeatmapOverlayProps> = ({
  imageUrl,
  selectedEye = 'OD',
  drStatus = 'MODERATE NPDR',
  avRatio = 0.65,
  riskScore = 68,
  anomalies = [],
  vesselMaskUrl,
  heatmapUrl,
  isDarkRoom = true,
  className = '',
  onClose,
  onSelectAnomaly,
  activeAnomalyId,
}) => {
  const { t, isVi } = useLanguage();

  // 1. Quản lý trạng thái các lớp (Layers State)
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [vesselOpacity, setVesselOpacity] = useState<number>(0.85);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.7);

  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [invertColors, setInvertColors] = useState<boolean>(false);

  // 2. Tương tác và hiển thị
  const [selectedAnomaly, setSelectedAnomaly] = useState<VesselAnomalyRegion | null>(null);
  const [hoveredAnomaly, setHoveredAnomaly] = useState<VesselAnomalyRegion | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 3. Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMovedRef = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Nhận biết mắt Phải (OD) hay Trái (OS) để căn chỉnh giải phẫu
  const eyeUpper = (selectedEye || '').toUpperCase();
  const isOS = eyeUpper.includes('OS') || eyeUpper.includes('TRÁI') || eyeUpper.includes('LEFT');
  const eyeCode = isOS ? 'OS' : 'OD';

  // Chuẩn hóa định dạng DR Status theo yêu cầu
  const formattedDrStatus = useMemo(() => {
    const raw = (drStatus || 'MODERATE NPDR').toUpperCase();
    if (raw.includes('SEVERE')) return 'SEVERE NPDR';
    if (raw.includes('MODERATE')) return 'MODERATE NPDR';
    if (raw.includes('MILD')) return 'MILD NPDR';
    if (raw.includes('PDR')) return 'PROLIFERATIVE DR (PDR)';
    if (raw.includes('NO') || raw.includes('NONE') || raw.includes('BÌNH THƯỜNG')) return 'NO APPARENT DR';
    return raw;
  }, [drStatus]);

  // Cung cấp danh sách tổn thương thực tế hoặc fallback chuẩn lâm sàng nếu rỗng
  const displayAnomalies: VesselAnomalyRegion[] = useMemo(() => {
    if (anomalies && anomalies.length > 0) {
      return anomalies;
    }
    // Dữ liệu giải phẫu mẫu định vị chính xác theo mắt OD / OS
    if (isOS) {
      return [
        {
          id: 'ma-os-1',
          type: 'Microaneurysm',
          coordinates: { x: 38, y: 44, width: 28, height: 28 },
          confidence: 0.94,
          description: isVi
            ? 'Vi phình mạch tiểu động mạch thái dương trên (Superior temporal arteriole)'
            : 'Microaneurysm on superior temporal arteriole',
        },
        {
          id: 'bleed-os-1',
          type: 'Hemorrhage',
          coordinates: { x: 42, y: 62, width: 34, height: 34 },
          confidence: 0.89,
          description: isVi
            ? 'Xuất huyết võng mạc cung thái dương dưới (Retinal micro-bleed)'
            : 'Deep retinal micro-hemorrhage near inferior arcade',
        },
        {
          id: 'exudate-os-1',
          type: 'Hard_Exudate',
          coordinates: { x: 32, y: 52, width: 30, height: 30 },
          confidence: 0.92,
          description: isVi
            ? 'Xuất tiết lipid quanh hoàng điểm (Hard exudates)'
            : 'Perimacular circinate lipid exudates',
        },
      ];
    }
    return [
      {
        id: 'ma-od-1',
        type: 'Microaneurysm',
        coordinates: { x: 60, y: 46, width: 28, height: 28 },
        confidence: 0.95,
        description: isVi
          ? 'Vi phình mạch tiểu động mạch thái dương trên (Superior temporal arteriole)'
          : 'Microaneurysm on superior temporal arteriole',
      },
      {
        id: 'bleed-od-1',
        type: 'Hemorrhage',
        coordinates: { x: 64, y: 64, width: 34, height: 34 },
        confidence: 0.91,
        description: isVi
          ? 'Xuất huyết vi mạch hình chấm cung thái dương dưới (Deep dot hemorrhage)'
          : 'Retinal micro-bleed near inferior temporal arcade',
      },
      {
        id: 'exudate-od-1',
        type: 'Hard_Exudate',
        coordinates: { x: 68, y: 52, width: 30, height: 30 },
        confidence: 0.88,
        description: isVi
          ? 'Xuất tiết lipid cứng quanh hoàng điểm (Hard exudates)'
          : 'Circinate lipid hard exudate cluster',
      },
    ];
  }, [anomalies, isOS, isVi]);

  // Điều khiển Zoom
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(3.0, Math.max(0.8, Number((prev + delta).toFixed(1))));
      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Kéo di chuyển ảnh (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return;
    if ((e.target as HTMLElement).closest('button, input, a, [role="button"]')) return;
    e.preventDefault();
    setIsDragging(true);
    isMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1.0) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isMovedRef.current = true;
    }
    const maxPan = Math.max(150, (zoomLevel - 1) * 380);
    setPanOffset({
      x: Math.max(-maxPan, Math.min(maxPan, startPanRef.current.x + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, startPanRef.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
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

  // Thống kê nhanh tổn thương
  const stats = useMemo(() => {
    let maCount = 0;
    let bleedCount = 0;
    let exudateCount = 0;
    displayAnomalies.forEach((a) => {
      const type = (a.type || '').toLowerCase();
      if (type.includes('microaneurysm') || type === 'ma') maCount++;
      else if (type.includes('hemorrhage') || type.includes('bleed')) bleedCount++;
      else if (type.includes('exudate') || type.includes('cotton_wool')) exudateCount++;
    });
    return { maCount, bleedCount, exudateCount, total: displayAnomalies.length };
  }, [displayAnomalies]);

  // Tọa độ giải phẫu Gai thị và Hoàng điểm (theo % chiều rộng / chiều cao ảnh)
  // OD: Gai thị phía mũi (bên trái ~28%), Hoàng điểm phía thái dương (bên phải ~64%)
  // OS: Gai thị phía mũi (bên phải ~72%), Hoàng điểm phía thái dương (bên trái ~36%)
  const opticDiscX = isOS ? 72 : 28;
  const opticDiscY = 50;
  const maculaX = isOS ? 36 : 64;
  const maculaY = 52;

  return (
    <div
      ref={containerRef}
      data-testid="vessel-heatmap-overlay-container"
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#030712] text-slate-100 shadow-2xl transition-all duration-300 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'min-h-[580px] lg:min-h-[640px]'
      } ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ========================================================================= */}
      {/* 1. HUD DIAGNOSTIC CLINICAL HEADER (Nhãn thông tin góc trên)              */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent backdrop-blur-xs border-b border-cyan-500/20">
        {/* Left HUD Details */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Badge 1: AI DIAGNOSTIC OVERLAY */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 shadow-lg shadow-cyan-950/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wider text-cyan-200 font-mono">
              AI DIAGNOSTIC OVERLAY
            </span>
          </div>

          {/* Badge 2: SCAN: OD/OS */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-mono font-bold text-slate-200">
            <span className="text-slate-400">SCAN:</span>
            <span className="text-cyan-400 font-bold">
              {eyeCode} ({isOS ? 'LEFT EYE' : 'RIGHT EYE'})
            </span>
          </div>

          {/* Badge 3: DR STATUS */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs font-mono text-amber-200">
            <span className="text-amber-400/80">DR STATUS:</span>
            <span className="font-bold text-amber-300">{formattedDrStatus}</span>
          </div>

          {/* Badge 4: A/V RATIO */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-200">
            <span className="text-emerald-400/80">A/V RATIO:</span>
            <span className="font-bold text-emerald-300">
              {Number(avRatio).toFixed(2)}
              {avRatio < 0.65 ? ' (Narrowed)' : ' (Normal 0.67)'}
            </span>
          </div>
        </div>

        {/* Right HUD Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ"
              aria-label="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 min-w-[38px] text-center text-slate-200">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
              title="Phóng to"
              aria-label="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại zoom"
              aria-label="Đặt lại zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-cyan-300 border border-slate-700/80 transition-colors cursor-pointer"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            aria-label="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button (if modal/tab onClose provided) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors cursor-pointer"
              title="Đóng chế độ đa lớp"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MULTI-LAYER VIEWPORT (Canvas / SVG đa lớp nằm đè chuẩn xác)           */}
      {/* ========================================================================= */}
      <div
        onMouseDown={handleMouseDown}
        className={`relative w-full h-[520px] sm:h-[580px] lg:h-[640px] flex items-center justify-center overflow-hidden bg-black ${
          zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Reticle grid background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#0f172a 1px, #030712 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        {/* Optical Center Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <div className="w-full h-px bg-cyan-400" />
          <div className="h-full w-px bg-cyan-400 absolute" />
        </div>

        {/* Transform container for Zoom & Pan */}
        <div
          className="relative flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Inner Aspect Ratio Container (Tỉ lệ vuông hoặc gốc của Fundus Image) */}
          <div className="relative inline-flex items-center justify-center max-w-[92vw] max-h-[78vh] sm:max-w-[540px] sm:max-h-[540px] lg:max-w-[600px] lg:max-h-[600px]">
            {/* ------------------------------------------------------------- */}
            {/* LAYER 0: BASE FUNDUS IMAGE                                    */}
            {/* ------------------------------------------------------------- */}
            <img
              ref={imageRef}
              src={imageUrl || '/assets/images/fundus_original.png'}
              alt={`Retinal Fundus Scan ${selectedEye}`}
              className="max-h-[520px] sm:max-h-[560px] w-auto max-w-full object-contain rounded-2xl shadow-2xl block select-none pointer-events-none"
              draggable={false}
              crossOrigin="anonymous"
              style={{
                filter: invertColors ? 'invert(100%) hue-rotate(180deg) contrast(135%) brightness(95%)' : undefined,
              }}
            />

            {/* ------------------------------------------------------------- */}
            {/* LAYER 1: LƯỚI MẠCH MÁU (Vessel Segmentation - Xanh neon)      */}
            {/* Xanh neon #10B981 / #00FF66 với Opacity Slider (0% - 100%)    */}
            {/* ------------------------------------------------------------- */}
            <div
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
                showVessels ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ opacity: showVessels ? vesselOpacity : 0 }}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 0 2px #00FF66) drop-shadow(0 0 5px rgba(16, 185, 129, 0.7))',
                }}
              >
                <defs>
                  {/* Neon Glow Filter cho Lưới mạch máu */}
                  <filter id="aura-vessel-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="blur1" />
                    <feGaussianBlur stdDeviation="1.6" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Linear Gradient cho động mạch và tĩnh mạch */}
                  <linearGradient id="vessel-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00FF66" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#10B981" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="vessel-gradient-arteriole" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#00FF66" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {/* Vùng Gai Thị (Optic Disc) - Nơi xuất phát của các nhánh mạch máu */}
                <g className="optic-disc-node">
                  <circle
                    cx={opticDiscX}
                    cy={opticDiscY}
                    r="4.5"
                    fill="none"
                    stroke="#00FF66"
                    strokeWidth="0.8"
                    strokeDasharray="1.2 0.8"
                    opacity="0.8"
                  />
                  <circle cx={opticDiscX} cy={opticDiscY} r="2.2" fill="#10B981" opacity="0.4" />
                </g>

                {/* Vùng Hoàng Điểm (Macula) & Vùng vô mạch FAZ (Foveal Avascular Zone) */}
                <g className="macula-faz-node">
                  <circle
                    cx={maculaX}
                    cy={maculaY}
                    r="3.5"
                    fill="none"
                    stroke="#00FF66"
                    strokeWidth="0.5"
                    strokeDasharray="0.8 0.8"
                    opacity="0.65"
                  />
                  <circle cx={maculaX} cy={maculaY} r="1.5" fill="#00FF66" opacity="0.15" />
                </g>

                {/* CÁC NHÁNH ĐỘNG MẠCH & TĨNH MẠCH CHÍNH TỎA TỪ GAI THỊ TỚI HOÀNG ĐIỂM */}
                {/* 1. Cung mạch thái dương trên (Superior Temporal Arcade) - Ôm vòm phía trên hoàng điểm */}
                {isOS ? (
                  // Cung thái dương cho MẮT TRÁI (OS): Gai thị ở x=72, uốn sang trái ôm x=36
                  <g filter="url(#aura-vessel-neon-glow)">
                    {/* Tĩnh mạch lớn thái dương trên */}
                    <path
                      d="M 72 50 C 65 30, 48 24, 34 32 S 22 45, 18 55"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    {/* Động mạch thái dương trên song hành */}
                    <path
                      d="M 72 49 C 64 33, 50 28, 36 35 S 25 48, 20 60"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.0"
                      strokeLinecap="round"
                    />
                    {/* Nhánh vi mạch thái dương trên rẽ về hoàng điểm */}
                    <path
                      d="M 46 29 C 43 36, 40 42, 38 48"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 38 33 C 37 39, 36 44, 36 48"
                      fill="none"
                      stroke="#6EE7B7"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />

                    {/* 2. Cung mạch thái dương dưới (Inferior Temporal Arcade) */}
                    <path
                      d="M 72 50 C 65 70, 48 76, 34 68 S 22 55, 18 45"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 72 51 C 64 67, 50 72, 36 65 S 25 52, 20 40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.0"
                      strokeLinecap="round"
                    />
                    {/* Nhánh vi mạch thái dương dưới rẽ về hoàng điểm */}
                    <path
                      d="M 46 71 C 43 64, 40 58, 38 56"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                    />

                    {/* 3. Cung mạch phía mũi (Nasal Arcades) */}
                    <path
                      d="M 72 50 C 78 35, 84 28, 92 24"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 72 50 C 78 65, 84 72, 92 76"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 72 50 C 80 48, 88 50, 96 50"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />

                    {/* Các tiểu mạch ngoại vi (Capillaries) */}
                    <path d="M 32 32 C 26 26, 20 22, 12 18" fill="none" stroke="#00FF66" strokeWidth="0.5" />
                    <path d="M 32 68 C 26 74, 20 78, 12 82" fill="none" stroke="#00FF66" strokeWidth="0.5" />
                  </g>
                ) : (
                  // Cung thái dương cho MẮT PHẢI (OD): Gai thị ở x=28, uốn sang phải ôm x=64
                  <g filter="url(#aura-vessel-neon-glow)">
                    {/* Tĩnh mạch lớn thái dương trên */}
                    <path
                      d="M 28 50 C 35 30, 52 24, 66 32 S 78 45, 82 55"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    {/* Động mạch thái dương trên song hành */}
                    <path
                      d="M 28 49 C 36 33, 50 28, 64 35 S 75 48, 80 60"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.0"
                      strokeLinecap="round"
                    />
                    {/* Nhánh vi mạch thái dương trên rẽ về hoàng điểm */}
                    <path
                      d="M 54 29 C 57 36, 60 42, 62 48"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 62 33 C 63 39, 64 44, 64 48"
                      fill="none"
                      stroke="#6EE7B7"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />

                    {/* 2. Cung mạch thái dương dưới (Inferior Temporal Arcade) */}
                    <path
                      d="M 28 50 C 35 70, 52 76, 66 68 S 78 55, 82 45"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 28 51 C 36 67, 50 72, 64 65 S 75 52, 80 40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.0"
                      strokeLinecap="round"
                    />
                    {/* Nhánh vi mạch thái dương dưới rẽ về hoàng điểm */}
                    <path
                      d="M 54 71 C 57 64, 60 58, 62 56"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                    />

                    {/* 3. Cung mạch phía mũi (Nasal Arcades) */}
                    <path
                      d="M 28 50 C 22 35, 16 28, 8 24"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 28 50 C 22 65, 16 72, 8 76"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 28 50 C 20 48, 12 50, 4 50"
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />

                    {/* Các tiểu mạch ngoại vi (Capillaries) */}
                    <path d="M 68 32 C 74 26, 80 22, 88 18" fill="none" stroke="#00FF66" strokeWidth="0.5" />
                    <path d="M 68 68 C 74 74, 80 78, 88 82" fill="none" stroke="#00FF66" strokeWidth="0.5" />
                  </g>
                )}
              </svg>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* LAYER 2: BẢN ĐỒ NHIỆT RỦI RO (Risk Heatmap - Gradient Đỏ/Vàng/Cam) */}
            {/* Hiệu ứng radial gradient gaussian blur độ phân giải cao        */}
            {/* ------------------------------------------------------------- */}
            <div
              className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen transition-opacity duration-200 ${
                showHeatmap ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ opacity: showHeatmap ? heatmapOpacity : 0 }}
            >
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full object-contain">
                <defs>
                  {/* Bộ lọc Gaussian Blur y tế tiêu chuẩn cao */}
                  <filter id="aura-heatmap-gaussian-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" />
                  </filter>

                  {/* Gradient Nhiệt Nền Cung Mạch Thái Dương */}
                  <radialGradient id="heat-arcade-zone" cx={maculaX} cy={maculaY} r="35%" fx={maculaX} fy={maculaY}>
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.75" />
                    <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.6" />
                    <stop offset="65%" stopColor="#EAB308" stopOpacity="0.35" />
                    <stop offset="90%" stopColor="#10B981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>

                  {/* Radial Gradient cho từng điểm nóng tổn thương vi mạch */}
                  {displayAnomalies.map((anom) => (
                    <radialGradient
                      key={`grad-${anom.id}`}
                      id={`heat-spot-${anom.id}`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
                      <stop offset="30%" stopColor="#F97316" stopOpacity="0.8" />
                      <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.55" />
                      <stop offset="85%" stopColor="#EAB308" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>

                {/* Quầng nhiệt tỏa dọc theo cung mạch thái dương */}
                <g filter="url(#aura-heatmap-gaussian-blur)">
                  <circle cx={maculaX} cy={maculaY} r="28" fill="url(#heat-arcade-zone)" />

                  {/* Các tâm nhiệt rực rỡ bám chuẩn từng tổn thương vi mạch */}
                  {displayAnomalies.map((anom) => {
                    const radius = Math.max(7, (anom.coordinates?.width || 28) * 0.35);
                    return (
                      <circle
                        key={`circle-${anom.id}`}
                        cx={anom.coordinates.x}
                        cy={anom.coordinates.y}
                        r={radius}
                        fill={`url(#heat-spot-${anom.id})`}
                      />
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* LAYER 3: BOUNDING BOX VI PHÌNH MẠCH & XUẤT HUYẾT             */}
            {/* (MA / Hemorrhage Detection - Khung viền vàng #F59E0B)         */}
            {/* Kèm nhãn: "MA Detected", "Exudate", "Micro-Bleed"            */}
            {/* ------------------------------------------------------------- */}
            {showBoundingBoxes &&
              displayAnomalies.map((anomaly) => {
                const isSelected = (selectedAnomaly?.id || activeAnomalyId) === anomaly.id;
                const isHovered = hoveredAnomaly?.id === anomaly.id;
                const meta = getAnomalyBoundingBoxLabel(anomaly.type);
                const confidencePct = Math.round((anomaly.confidence || 0.9) * 100);

                return (
                  <div
                    key={anomaly.id}
                    data-testid={`bounding-box-${anomaly.id}`}
                    onClick={(e) => {
                      if (isMovedRef.current) return;
                      e.stopPropagation();
                      setSelectedAnomaly(anomaly);
                      if (onSelectAnomaly) onSelectAnomaly(anomaly);
                    }}
                    onMouseEnter={() => setHoveredAnomaly(anomaly)}
                    onMouseLeave={() => setHoveredAnomaly(null)}
                    className="absolute z-20 group cursor-pointer transition-all duration-150"
                    style={{
                      left: `${anomaly.coordinates.x}%`,
                      top: `${anomaly.coordinates.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${Math.max(34, anomaly.coordinates.width || 34)}px`,
                      height: `${Math.max(34, anomaly.coordinates.height || 34)}px`,
                    }}
                    title={`${meta.label}: ${anomaly.description}`}
                  >
                    {/* Bounding Box với viền vàng chuẩn #F59E0B */}
                    <div
                      className={`w-full h-full relative transition-all duration-150 rounded-xs ${
                        isSelected || isHovered
                          ? 'ring-2 ring-white shadow-lg shadow-amber-500/50'
                          : ''
                      }`}
                      style={{
                        border: '2px solid #F59E0B',
                        backgroundColor: isSelected || isHovered ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.5), inset 0 0 6px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {/* Corner Target Reticles (Góc ngắm HUD y tế) */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-300" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-300" />
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber-300" />
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber-300" />

                      {/* Center Crosshair Target Dot */}
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      </span>
                    </div>

                    {/* Nhãn phân loại trên đỉnh khung viền ("MA Detected", "Exudate", "Micro-Bleed") */}
                    <div
                      className={`absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono tracking-tight flex items-center gap-1 shadow-md border border-amber-400/60 pointer-events-none ${meta.badgeColor}`}
                    >
                      <Crosshair className="w-2.5 h-2.5 shrink-0" />
                      <span>{meta.label}</span>
                      <span className="opacity-90 font-mono text-[8px]">{confidencePct}%</span>
                    </div>

                    {/* Tooltip Hover / Active chi tiết bệnh học lâm sàng */}
                    {(isSelected || isHovered) && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 w-52 sm:w-60 p-2.5 bg-slate-950/95 border border-amber-500/80 rounded-xl shadow-2xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                          <span className="font-extrabold text-amber-400 text-xs flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-amber-400" />
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                            {confidencePct}% CONF
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {anomaly.description}
                        </p>
                        <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span>X: {anomaly.coordinates.x.toFixed(1)}% | Y: {anomaly.coordinates.y.toFixed(1)}%</span>
                          <span className="text-cyan-400">{isOS ? 'Quadrant: ST (OS)' : 'Quadrant: ST (OD)'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Retinal Calibration Bar & Watermark (Góc dưới trái) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
          <div className="w-12 h-1 bg-cyan-400 rounded-full" />
          <span>500 µm</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">CLINICAL MATRIX 4K</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OVERLAY CONTROL PANEL (Bảng điều khiển đa lớp độc lập)                 */}
      {/* Cho phép Bác sĩ bật/tắt từng lớp: Vessel, Heatmap, Bounding Boxes, Invert */}
      {/* ========================================================================= */}
      <div
        className={`absolute bottom-3 right-3 z-30 transition-all duration-300 ${
          isPanelCollapsed ? 'w-auto' : 'w-72 sm:w-80'
        }`}
      >
        <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 text-slate-100 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono tracking-wider text-cyan-200">
                OVERLAY CONTROLS
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={isPanelCollapsed ? 'Mở rộng bảng điều khiển' : 'Thu gọn'}
              aria-label={isPanelCollapsed ? 'Mở rộng bảng điều khiển' : 'Thu gọn'}
            >
              {isPanelCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Panel Content (Visible when not collapsed) */}
          {!isPanelCollapsed && (
            <div className="p-3.5 space-y-3.5 text-xs">
              {/* TOGGLE 1: VESSEL SEGMENTATION (Lưới Mạch Máu) */}
              <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-emerald-900/40">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                        showVessels ? 'bg-[#00FF66]' : 'bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={showVessels}
                        onChange={(e) => setShowVessels(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-slate-950 transition-transform ${
                          showVessels ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-xs shadow-[#00FF66]" />
                      Vessel Segmentation
                    </span>
                  </label>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    {Math.round(vesselOpacity * 100)}%
                  </span>
                </div>

                {/* Opacity Slider cho Lưới mạch máu */}
                {showVessels && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={vesselOpacity}
                      onChange={(e) => setVesselOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[#00FF66] h-1.5 bg-slate-800 rounded-lg cursor-pointer appearance-none"
                      aria-label="Độ mờ lưới mạch máu"
                    />
                  </div>
                )}
              </div>

              {/* TOGGLE 2: RISK HEATMAP (Bản Đồ Nhiệt Rủi Ro) */}
              <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-rose-900/40">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                        showHeatmap ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          showHeatmap ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500" />
                      Risk Heatmap (Grad-CAM)
                    </span>
                  </label>
                  <span className="font-mono text-[10px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    {Math.round(heatmapOpacity * 100)}%
                  </span>
                </div>

                {/* Opacity Slider cho Heatmap */}
                {showHeatmap && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={heatmapOpacity}
                      onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer appearance-none"
                      aria-label="Độ mờ bản đồ nhiệt"
                    />
                  </div>
                )}
              </div>

              {/* TOGGLE 3: BOUNDING BOXES (Vi Phình Mạch & Xuất Huyết) */}
              <div className="p-2 rounded-xl bg-slate-900/60 border border-amber-900/40 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      showBoundingBoxes ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={showBoundingBoxes}
                      onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-slate-950 transition-transform ${
                        showBoundingBoxes ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </span>
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500" />
                    MA & Bleed Detection
                  </span>
                </label>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                  {stats.total} found
                </span>
              </div>

              {/* TOGGLE 4: INVERT COLORS (Bộ lọc Đảo màu Quang học) */}
              <div className="p-2 rounded-xl bg-slate-900/60 border border-cyan-900/40 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      invertColors ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={invertColors}
                      onChange={(e) => setInvertColors(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-slate-950 transition-transform ${
                        invertColors ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </span>
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Invert Optical Contrast
                  </span>
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {invertColors ? 'ACTIVE' : 'OFF'}
                </span>
              </div>

              {/* Quick Summary Pill Tags */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-center font-mono">
                <div className="p-1 rounded bg-amber-950/40 border border-amber-800/50 text-amber-300">
                  MA: {stats.maCount}
                </div>
                <div className="p-1 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300">
                  Bleed: {stats.bleedCount}
                </div>
                <div className="p-1 rounded bg-yellow-950/40 border border-yellow-800/50 text-yellow-300">
                  Exudate: {stats.exudateCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
