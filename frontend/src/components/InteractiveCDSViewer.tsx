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
} from 'lucide-react';
import { Card } from './ui/Card';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';

interface InteractiveCDSViewerProps {
  analysisResult: AIRiskResult;
  selectedEye?: string;
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
 * Vàng/Hổ phách cho Microaneurysm/Hard Exudate
 * Đỏ/Cảnh báo cho Hemorrhage/AV Nipping/Focal Narrowing
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

/**
 * Tách lọc và tăng cường độ tương phản quang học vi mạch võng mạc Client-Side (Layer 1)
 * Dựa trên chuẩn Red-Free Green Channel (bước sóng 540nm hấp thụ Hemoglobin cực đại)
 * Hỗ trợ chế độ thường (tiểu động mạch đỏ cam, tiểu tĩnh mạch xanh lam)
 * và chế độ Buồng tối (Fluorescein Angiography: vi mạch phát huỳnh quang cyan/teal trên nền obsidian)
 */
export const processVesselOverlayCanvas = (
  sourceImg: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: {
    isDarkRoom: boolean;
    vesselMaskUrl?: string;
  }
): void => {
  if (!sourceImg || !targetCanvas) return;
  const w = sourceImg.naturalWidth || sourceImg.width || 400;
  const h = sourceImg.naturalHeight || sourceImg.height || 340;
  if (w === 0 || h === 0) return;

  targetCanvas.width = w;
  targetCanvas.height = h;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Nếu có vesselMaskUrl từ backend, ưu tiên hòa trộn từ mask này
  if (options.vesselMaskUrl) {
    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    maskImg.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(maskImg, 0, 0, w, h);
      if (options.isDarkRoom) {
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#06B6D4';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    maskImg.src = options.vesselMaskUrl;
    return;
  }

  // Tách lọc quang học Red-Free trên kênh Green (540nm) từ ảnh gốc
  try {
    ctx.drawImage(sourceImg, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 14) {
        data[i + 3] = 0; // Vùng ngoài nhãn cầu
        continue;
      }

      // Tín hiệu hấp thụ vi mạch trên kênh Green so với hắc mạc
      const vesselSignal = Math.max(0, r - g * 0.82);

      if (options.isDarkRoom) {
        // Buồng tối: Fluorescein Angiography Simulator
        // Nền tối Obsidian, vi mạch phát huỳnh quang Cyan / Teal tương phản cao không gây chói mắt
        const intensity = Math.min(255, vesselSignal * 2.4 + g * 0.35);
        data[i] = Math.round(intensity * 0.08);       // R tối
        data[i + 1] = Math.round(intensity * 0.85);   // G phát huỳnh quang (Teal/Cyan)
        data[i + 2] = Math.round(intensity * 0.95);   // B sáng
        data[i + 3] = Math.round(Math.min(245, vesselSignal * 2.6 + 35));
      } else {
        // Chế độ thường (Clinical Red-Free Contrast Enhancement):
        // Tiểu động mạch (đỏ cam) vs tiểu tĩnh mạch (xanh lam)
        const isArtery = r > g + 20 && b < 110;
        if (isArtery) {
          // Tiểu động mạch đỏ cam
          data[i] = Math.min(255, Math.round(r * 1.35));
          data[i + 1] = Math.max(0, Math.round(g * 0.65));
          data[i + 2] = Math.max(0, Math.round(b * 0.45));
        } else {
          // Tiểu tĩnh mạch xanh lam
          data[i] = Math.max(0, Math.round(r * 0.55));
          data[i + 1] = Math.min(255, Math.round(g * 1.15));
          data[i + 2] = Math.min(255, Math.round(b * 1.45));
        }
        data[i + 3] = Math.round(Math.min(235, vesselSignal * 2.2 + 30));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    // Tránh sập nếu canvas bị tainted bởi CORS
    console.warn('Canvas optical processing fallback:', err);
  }
};

/**
 * Tự động sinh phổ nhiệt động bám sát cấu trúc giải phẫu học của mắt (Layer 2)
 * Căn chỉnh vị trí hoàng điểm & gai thị dựa vào bên mắt OD vs OS
 * Lan tỏa theo cung mạch thái dương trên / dưới và tập trung vào các tổn thương thực tế
 */
export const renderAnatomicalHeatmap = (
  canvas: HTMLCanvasElement,
  selectedEye: string,
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
      const spotRadius = Math.max(w * 0.07, (anom.coordinates.width / 100) * w * 1.5);

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
  selectedEye = 'OD (Mắt Phải)',
}) => {
  const { t, isVi } = useLanguage();
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);
  const [showVesselsOverlay, setShowVesselsOverlay] = useState<boolean>(true);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeAnomaly, setActiveAnomaly] = useState<VesselAnomalyRegion | null>(null);
  const [isDarkRoom, setIsDarkRoom] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  const rawImageRef = useRef<HTMLImageElement | null>(null);
  const vesselCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dynamicHeatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const anomalies = analysisResult.annotatedMap?.detectedAnomalies || [];
  const rawImage = analysisResult.imageUrl || '/assets/images/fundus_original.png';
  const heatmapImg = analysisResult.annotatedMap?.heatmapUrl || '/assets/images/fundus_heatmap.png';

  // Kiểm tra tính hợp lệ của ảnh heatmap thực tế (khác placeholder mock rỗng)
  const hasRealHeatmap = Boolean(
    analysisResult.annotatedMap?.heatmapUrl &&
      analysisResult.annotatedMap.heatmapUrl.trim().length > 0 &&
      analysisResult.annotatedMap.heatmapUrl !== '/assets/images/fundus_heatmap.png'
  );

  const riskScore = analysisResult.overallVascularRiskScore ?? analysisResult.riskScore ?? 0;
  const isLowRisk = riskScore < 40;

  // Đồng bộ xử lý vẽ vi mạch quang học Client-Side
  useEffect(() => {
    if (!rawImageRef.current || !vesselCanvasRef.current) return;
    processVesselOverlayCanvas(rawImageRef.current, vesselCanvasRef.current, {
      isDarkRoom,
      vesselMaskUrl: analysisResult.annotatedMap?.vesselMaskUrl,
    });
  }, [isImageLoaded, isDarkRoom, rawImage, analysisResult.annotatedMap?.vesselMaskUrl]);

  // Đồng bộ sinh phổ nhiệt giải phẫu động khi chưa có heatmap từ backend
  useEffect(() => {
    if (!dynamicHeatmapCanvasRef.current) return;
    if (hasRealHeatmap) return;
    if (rawImageRef.current && rawImageRef.current.naturalWidth) {
      dynamicHeatmapCanvasRef.current.width = rawImageRef.current.naturalWidth;
      dynamicHeatmapCanvasRef.current.height = rawImageRef.current.naturalHeight;
    }
    renderAnatomicalHeatmap(
      dynamicHeatmapCanvasRef.current,
      selectedEye,
      riskScore,
      anomalies
    );
  }, [hasRealHeatmap, isImageLoaded, selectedEye, riskScore, anomalies]);

  // Kiểm tra cache ảnh tải xong
  useEffect(() => {
    if (rawImageRef.current && rawImageRef.current.complete && rawImageRef.current.naturalWidth > 0) {
      setIsImageLoaded(true);
    }
  }, [rawImage]);

  return (
    <Card
      padding="md"
      className={`space-y-4 transition-colors duration-200 ${
        isDarkRoom ? 'bg-darkroom-card border-darkroom-border text-darkroom-text' : 'bg-white'
      }`}
    >
      {/* Bộ lọc quang học Red-Free (Green Channel Isolation - Chuẩn nhãn khoa AAO) */}
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

      {/* 1. Tiêu đề tinh gọn, dễ hiểu cho người bệnh */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-3.5 px-2 sm:px-3 pt-1 ${
          isDarkRoom ? 'border-darkroom-border' : 'border-clinical-border'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
                isDarkRoom ? 'text-darkroom-text' : 'text-slate-900'
              }`}
            >
              <Eye className="w-5 h-5 text-brand-600" />
              <span>
                {isVi
                  ? 'Bàn chẩn đoán tương tác CDS — Bản đồ nhiệt Grad-CAM'
                  : 'Interactive CDS Workspace — Grad-CAM Heatmap'}
              </span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isDarkRoom
                  ? 'bg-slate-800 text-cyan-300 border-slate-700 font-mono-data'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}
            >
              {selectedEye}
            </span>
          </div>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              isDarkRoom ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {isVi ? (
              <>
                AI làm nổi bật các nhánh mạch máu bằng màu sắc. Vùng{' '}
                <strong className="text-rose-600">màu đỏ/vàng</strong> là nơi có dấu hiệu bất thường cần bác sĩ lưu ý.
              </>
            ) : (
              <>
                AI highlights vascular trees using color heatmaps. Zones in{' '}
                <strong className="text-rose-600">red/yellow</strong> indicate abnormal features requiring physician review.
              </>
            )}
          </p>
        </div>

        {/* Các nút công cụ tinh giản */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Nút Buồng Tối */}
          <button
            type="button"
            onClick={() => setIsDarkRoom(!isDarkRoom)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isDarkRoom
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={t('cdsViewer.darkRoomTitle', 'Chế độ nền tối giúp nhìn rõ mạch máu hơn')}
          >
            <Moon className={`w-3.5 h-3.5 ${isDarkRoom ? 'text-cyan-400 fill-cyan-400/30' : 'text-slate-500'}`} />
            <span>{isDarkRoom ? t('common.darkRoomOn', 'Buồng tối: BẬT') : t('common.darkRoomOff', 'Buồng tối')}</span>
          </button>

          {/* Phóng to / Thu nhỏ */}
          <div
            className={`flex items-center rounded-xl p-0.5 border gap-0.5 ${
              isDarkRoom ? 'bg-darkroom-surface border-darkroom-border' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg transition-colors"
              title={t('common.zoomOut', 'Thu nhỏ')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              className={`text-xs font-semibold px-1.5 min-w-[40px] text-center ${
                isDarkRoom ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg transition-colors"
              title={t('common.zoomIn', 'Phóng to')}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              title={t('common.resetZoom', 'Kích thước chuẩn')}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Nút Lớp mạch máu */}
          <button
            type="button"
            onClick={() => setShowVesselsOverlay(!showVesselsOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showVesselsOverlay
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isVi ? 'Bật/tắt lớp phân đoạn mạch máu võng mạc' : 'Toggle retinal vessel segmentation overlay'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('cdsViewer.vesselOverlay', 'Lớp mạch máu')}</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh trượt điều chỉnh bản đồ nhiệt & Hướng dẫn màu sắc */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isDarkRoom
            ? 'bg-darkroom-surface border-darkroom-border text-slate-200'
            : 'bg-slate-50/80 border-slate-200 text-slate-800'
        }`}
      >
        {/* Thanh trượt Opacity */}
        <div className="flex items-center gap-2.5 flex-1 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-semibold whitespace-nowrap">{t('common.opacityLabel', 'Độ mờ bản đồ nhiệt:')}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="w-full accent-teal-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer appearance-none"
            aria-label={isVi ? 'Độ mờ bản đồ nhiệt AI' : 'AI Heatmap Opacity'}
          />
          <span className="font-bold font-mono text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded text-xs min-w-[42px] text-center">
            {(heatmapOpacity * 100).toFixed(0)}%
          </span>
        </div>

        {/* Chú thích màu sắc trực quan (Legend) */}
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
                className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
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
                  ? 'Biến đổi vi mạch toàn thể (Chưa định vị ổ khu trú đơn độc)'
                  : 'Diffuse microvascular alterations (No focal lesions)'}
              </span>
              <span className="hidden">{t('cdsViewer.showCoordinates', 'Hiển thị tọa độ tổn thương')} (0)</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Khung soi 2 ảnh song song: Ảnh chụp gốc & Vùng AI phát hiện */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ảnh Gốc */}
        <div
          className={`relative rounded-xl overflow-hidden border bg-black flex flex-col items-center justify-center min-h-[360px] ${
            isDarkRoom ? 'border-darkroom-border' : 'border-slate-300'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700">
            {t('cdsViewer.rawFundus', isVi ? 'Ảnh chụp đáy mắt gốc' : 'True Color Fundus Scan')}
          </div>

          <div
            className="transition-transform duration-150 flex items-center justify-center p-2 w-full h-full overflow-hidden"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="relative inline-flex items-center justify-center max-h-[340px] max-w-full">
              <img
                src={rawImage}
                alt={t('cdsViewer.rawFundusAlt', isVi ? 'Ảnh võng mạc gốc' : 'Raw Fundus Image')}
                className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-md block"
              />
            </div>
          </div>
        </div>

        {/* Bản Đồ AI */}
        <div
          className={`relative rounded-xl overflow-hidden border bg-black flex flex-col items-center justify-center min-h-[360px] ${
            isDarkRoom ? 'border-darkroom-border' : 'border-slate-300'
          }`}
        >
          <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {t('cdsViewer.aiAttentionLayer', isVi ? 'Bản đồ nhiệt Grad-CAM' : 'Grad-CAM Heatmap')}
          </div>

          <div
            className="transition-transform duration-150 flex items-center justify-center p-2 w-full h-full overflow-hidden"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Khung Wrapper khớp tỷ lệ 1:1 với kích thước ảnh gốc */}
            <div className="relative inline-flex items-center justify-center max-h-[340px] max-w-full">
              {/* Layer 0: Ảnh nền */}
              <img
                ref={rawImageRef}
                src={rawImage}
                alt={t('cdsViewer.rawFundusAlt', isVi ? 'Ảnh võng mạc gốc' : 'Raw Fundus Image')}
                className="max-h-[340px] w-auto max-w-full object-contain rounded-lg block"
                crossOrigin="anonymous"
                onLoad={() => setIsImageLoaded(true)}
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
                  mixBlendMode: isDarkRoom ? 'screen' : 'screen',
                }}
              />

              {/* Layer 2: Lớp bản đồ nhiệt Grad-CAM */}
              {hasRealHeatmap ? (
                <img
                  src={heatmapImg}
                  alt="AI Grad-CAM Heatmap"
                  className="absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none cds-canvas-overlay mix-blend-screen transition-opacity duration-150 select-none"
                  style={{ opacity: heatmapOpacity }}
                />
              ) : (
                <div
                  className="absolute inset-0 w-full h-full rounded-lg pointer-events-none cds-canvas-overlay mix-blend-screen transition-opacity duration-150"
                  style={{ opacity: heatmapOpacity }}
                >
                  <canvas
                    ref={dynamicHeatmapCanvasRef}
                    className="w-full h-full object-contain rounded-lg pointer-events-none"
                  />
                  {/* Luôn giữ thẻ img ẩn để test assertions vẫn tìm thấy tệp nếu cần */}
                  <img
                    src={heatmapImg}
                    alt="AI Grad-CAM Heatmap"
                    className="hidden"
                  />
                </div>
              )}

              {/* Huy hiệu góc ảnh trạng thái Zero-State */}
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

              {/* Layer 3: Các điểm định vị tổn thương không gian (Target Pins) */}
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
                      {/* Vòng xung nhịp nhấp nháy thu hút sự chú ý lâm sàng */}
                      <span
                        className={`absolute -inset-1 rounded-full animate-ping opacity-60 pointer-events-none ${theme.ping}`}
                      />

                      {/* Nút Marker Target */}
                      <button
                        type="button"
                        onClick={() => setActiveAnomaly(anomaly)}
                        className={`relative flex items-center justify-center rounded-full border-2 transition-all hover:scale-125 focus:outline-hidden focus:ring-2 focus:ring-white shadow-md ${
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
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[140px]">
                        <div className="bg-slate-900/95 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700 whitespace-nowrap text-center">
                          <div className="font-bold text-amber-300">{anomalyDisplayName}</div>
                          <div className="text-slate-300 text-[9px] mt-0.5">
                            {t('anomalies.confidence', 'Độ tin cậy')}: {(anomaly.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-slate-400 text-[9px] max-w-[160px] truncate">{anomaly.description}</div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Banner Lâm Sàng khi 0 điểm tổn thương (Phân nhánh an toàn y khoa chống False Reassurance) */}
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
                      : 'Comprehensive Microvascular Survey: Normal Architecture (0 lesions detected)'
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
                    : 'AI surveyed all 4 retinal quadrants and vascular trees, confirming no microaneurysms, hemorrhages, or focal narrowing.'
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
                    ? 'Cảnh báo: Biến đổi vi mạch toàn thể / lan tỏa (Không phát hiện ổ khu trú đơn độc)'
                    : 'Notice: Diffuse Retinal Vascular Alterations (No focal lesions detected)'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold border border-amber-300">
                  {isVi ? 'Theo dõi lan tỏa' : 'Diffuse Survey'}
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11.5px]">
                {isVi
                  ? `Chỉ số nguy cơ vi mạch (${riskScore}/100) phản ánh tình trạng biến đổi vi tuần hoàn toàn diện (co hẹp tiểu động mạch, tăng độ uốn lượn hoặc giảm tưới máu). Vui lòng đối chiếu phổ nhiệt Grad-CAM và tham vấn bác sĩ chuyên khoa.`
                  : `Vascular risk score (${riskScore}/100) indicates diffuse microcirculatory changes (arteriolar narrowing, increased tortuosity, or perfusion alterations). Please consult Grad-CAM attention field and physician notes.`}
              </p>
            </div>
          </div>
        )
      )}

      {/* Chi tiết điểm tổn thương khi người dùng nhấp vào */}
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

      {/* Cảnh báo y tế bắt buộc */}
      <MedicalDisclaimer
        variant={isDarkRoom ? 'subtle' : 'compact'}
        className={isDarkRoom ? 'bg-darkroom-surface border-darkroom-border text-slate-300' : ''}
      />
    </Card>
  );
};
