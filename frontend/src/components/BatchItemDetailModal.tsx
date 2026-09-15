import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Eye,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Sliders,
  Download,
  Target,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Check,
  Move,
} from 'lucide-react';
import { ClinicBatchJobItem } from '../types/cds';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';
import { useLanguage } from '../context/LanguageContext';

interface BatchItemDetailModalProps {
  item: ClinicBatchJobItem | null;
  onClose: () => void;
}

interface AnomalyItem {
  id: string;
  type: string;
  label: string;
  svgX: number;
  svgY: number;
  svgW: number;
  svgH: number;
  labelW: number;
  confidence: number;
  description: string;
}

export const BatchItemDetailModal: React.FC<BatchItemDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const { t, isVi } = useLanguage();
  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.70);
  const [viewMode, setViewMode] = useState<'sideBySide' | 'overlay'>('sideBySide');
  const [showRoiBoxes, setShowRoiBoxes] = useState<boolean>(true);
  const [showAnatomyMarkers, setShowAnatomyMarkers] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMovedRef = useRef<boolean>(false);
  const [activeAnomalyId, setActiveAnomalyId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

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

  const ai = item.aiResult;
  const overallRisk = ai?.overallVascularRiskScore ?? item.riskScore ?? 45;
  const cardioScore = ai?.cardiovascularRiskScore ?? Math.min(100, Math.round(overallRisk * 1.1));
  const drScore = ai?.diabeticRetinopathyScore ?? Math.min(100, Math.round(overallRisk * 0.95));
  const strokeRisk = ai?.threeYearStrokeRiskPercent ?? (overallRisk > 70 ? 18.5 : overallRisk > 45 ? 9.2 : 3.4);
  const avRatio = ai?.arteryVeinRatio ?? (overallRisk < 40 ? 0.68 : 0.58);
  const tortuosity = ai?.tortuosityIndex ?? (overallRisk < 40 ? 1.12 : 1.30);
  const vesselDensity = ai?.vesselDensityPercentage ?? (overallRisk < 40 ? 17.2 : 14.8);
  const opticCdr = ai?.opticCupToDiscRatio ?? 0.38;

  const baseImage = item.thumbnailUrl || '/assets/images/fundus_original.png';
  const isOD = item.eye === 'OD';

  // Tọa độ giải phẫu (512x512)
  const discX = isOD ? 375 : 138;
  const discY = 252;
  const maculaX = isOD ? 220 : 292;
  const maculaY = 264;

  // An toàn lâm sàng: Chỉ hiển thị anomalies nếu item.aiResult?.detectedAnomalies thực sự có dữ liệu
  const rawAnomalies = (ai as any)?.detectedAnomalies;
  const anomalies: AnomalyItem[] = Array.isArray(rawAnomalies)
    ? rawAnomalies.map((ano: any, idx: number) => {
        const coords = ano.coordinates || {};
        const isPct = (coords.x || 0) <= 100 && (coords.y || 0) <= 100;
        const svgX = isPct ? ((coords.x ?? 50) / 100) * 512 : (coords.x ?? 256);
        const svgY = isPct ? ((coords.y ?? 50) / 100) * 512 : (coords.y ?? 256);
        const svgW = isPct ? ((coords.width ?? 10) / 100) * 512 : (coords.width ?? 48);
        const svgH = isPct ? ((coords.height ?? 10) / 100) * 512 : (coords.height ?? 44);
        return {
          id: ano.id || `ANO-${idx}`,
          type: ano.type || 'Anomaly',
          label: ano.label || ano.type || (isVi ? 'Tổn thương vi mạch' : 'Microvascular lesion'),
          svgX,
          svgY,
          svgW,
          svgH,
          labelW: 130,
          confidence: ano.confidence ?? 0.9,
          description: ano.description || (isVi ? 'Vùng tổn thương được phát hiện bởi mô hình CDS' : 'Lesion region detected by CDS model'),
        };
      })
    : [];

  // An toàn lâm sàng: Sử dụng heatmap thật nếu có, không tự ý vẽ bản đồ nhiệt Canvas giả lập
  const realHeatmapUrl =
    ai?.heatmapOverlayUrl &&
    ai.heatmapOverlayUrl.trim().length > 0 &&
    ai.heatmapOverlayUrl !== '/assets/images/fundus_heatmap.png'
      ? ai.heatmapOverlayUrl
      : '';

  useEffect(() => {
    setHeatmapDataUrl(realHeatmapUrl);
    setIsGenerating(false);
  }, [realHeatmapUrl]);

  const defaultRationales = useMemo(() => {
    if (overallRisk < 40) {
      return [
        t('clinic.batchDetailModal.defaultRationale1'),
        t('clinic.batchDetailModal.defaultRationale2'),
        t('clinic.batchDetailModal.defaultRationale3'),
      ];
    }
    if (overallRisk < 65) {
      return [
        t('clinic.batchDetailModal.defaultRationaleMod1'),
        t('clinic.batchDetailModal.defaultRationaleMod2'),
      ];
    }
    return [
      t('clinic.batchDetailModal.defaultRationaleHigh1'),
      t('clinic.batchDetailModal.defaultRationaleHigh2'),
      t('clinic.batchDetailModal.defaultRationaleHigh3'),
    ];
  }, [overallRisk, t]);

  const rationales = ai?.xaiRationales && ai.xaiRationales.length > 0
    ? ai.xaiRationales
    : defaultRationales;

  const riskBadgeClass =
    overallRisk >= 75
      ? 'bg-red-50 text-red-700 border-red-200'
      : overallRisk >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const riskTierLabel = overallRisk >= 75
    ? (isVi ? 'Cao' : 'High')
    : overallRisk >= 50
    ? (isVi ? 'Trung Bình' : 'Moderate')
    : (isVi ? 'Thấp' : 'Low');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 512);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 512);
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  const handleDownloadHeatmap = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            // fallback without crossOrigin if CORS is restricted
            const fallbackImg = new Image();
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = (err) => reject(err);
            fallbackImg.src = src;
          };
          img.src = src;
        });
      };

      // 1. Draw base fundus background & photo
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, size, size);

      if (baseImage) {
        try {
          const baseImgEl = await loadImage(baseImage);
          ctx.drawImage(baseImgEl, 0, 0, size, size);
        } catch (e) {
          console.warn('Could not render baseImage onto canvas:', e);
        }
      }

      // 2. Draw Grad-CAM heatmap overlay if present
      if (heatmapDataUrl) {
        try {
          const heatmapImgEl = await loadImage(heatmapDataUrl);
          ctx.globalAlpha = heatmapOpacity;
          ctx.drawImage(heatmapImgEl, 0, 0, size, size);
          ctx.globalAlpha = 1.0;
        } catch (e) {
          console.warn('Could not render heatmap overlay onto canvas:', e);
        }
      }

      // 3. Draw Anatomy Markers if active
      if (showAnatomyMarkers) {
        ctx.save();
        // Optic Disc marker
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(discX, discY, 32, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(isVi ? 'Gai Thị' : 'Optic Disc', discX - 22, discY + 46);

        // Macula marker
        ctx.setLineDash([]);
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(maculaX, maculaY, 26, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(isVi ? 'Hoàng Điểm' : 'Macula', maculaX - 30, maculaY + 40);
        ctx.restore();
      }

      // 4. Draw Lesion Anomaly boxes if present
      if (showRoiBoxes && anomalies.length > 0) {
        ctx.save();
        anomalies.forEach((ano) => {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(ano.svgX, ano.svgY, ano.svgW, ano.svgH);
          const textWidth = ctx.measureText(ano.label).width;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillRect(ano.svgX, Math.max(0, ano.svgY - 16), Math.max(60, textWidth + 8), 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(ano.label, ano.svgX + 4, Math.max(12, ano.svgY - 4));
        });
        ctx.restore();
      }

      // 5. Clinical metadata header / footer
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, size - 26, size, 26);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(
        `AURA Clinical CDS • MRN: ${item.mrn || 'N/A'} • ${item.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'} • Rủi ro: ${overallRisk}%`,
        8,
        size - 9
      );
      ctx.restore();

      // 6. Download PNG
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanMrn = (item.mrn || 'MRN').replace(/[^a-zA-Z0-9-_]/g, '_');
      a.download = `AURA_CDS_${cleanMrn}_${item.eye || 'OD'}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccessNotice(true);
      setTimeout(() => setDownloadSuccessNotice(false), 3000);
    } catch (err) {
      console.error('Error exporting PNG canvas:', err);
      // Fallback: direct download of baseImage or heatmapDataUrl
      const fallbackUrl = heatmapDataUrl || baseImage;
      if (fallbackUrl) {
        const a = document.createElement('a');
        a.href = fallbackUrl;
        a.download = `AURA_Fundus_${item.mrn || 'MRN'}_${item.eye || 'OD'}.png`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadSuccessNotice(true);
        setTimeout(() => setDownloadSuccessNotice(false), 3000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Xác định tên vùng giải phẫu đang rà chuột
  const getAnatomyZone = (x: number, y: number) => {
    const distDisc = Math.hypot(x - discX, y - discY);
    const distMacula = Math.hypot(x - maculaX, y - maculaY);
    if (distDisc < 60) return t('clinic.batchDetailModal.zoneDisc');
    if (distMacula < 70) return t('clinic.batchDetailModal.zoneMacula');
    if (y < 220) return t('clinic.batchDetailModal.zoneSuperiorArcade');
    if (y > 300) return t('clinic.batchDetailModal.zoneInferiorArcade');
    return t('clinic.batchDetailModal.zonePosteriorPole');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-[#CCFBF1] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-modal-enter">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#134E4A] via-[#0E7490] to-[#0891B2] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Eye className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold">{item.patientName}</h3>
                <span className="font-mono-data text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {item.mrn}
                </span>
                <span className="text-[11px] font-mono-data bg-cyan-900/40 text-cyan-200 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  {item.eye === 'OD' ? t('eyeLaterality.rightEye') : t('eyeLaterality.leftEye')}
                </span>
              </div>
              <p className="text-xs text-cyan-100 flex items-center gap-2 mt-0.5">
                <span>{t('clinic.batchDetailModal.deidHipaa')} <strong className="font-mono-data">{item.pseudonymId || 'ANO-PAT-DEID'}</strong></span>
                <span>&bull;</span>
                <span>{t('clinic.batchDetailModal.fileLabel')} <strong className="font-mono-data">{item.fileName}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Top Triage & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className={`p-3.5 rounded-2xl border ${riskBadgeClass} flex flex-col justify-between`}>
              <span className="text-[11px] font-bold uppercase tracking-wider">{t('clinic.batchDetailModal.overallVascularRisk')}</span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-extrabold font-mono-data">{overallRisk}%</span>
                <span className="text-xs font-semibold">
                  {riskTierLabel}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{t('clinic.batchDetailModal.modelName')}</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> {t('clinic.batchDetailModal.cardiovascularRisk')}
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{cardioScore}%</span>
                <span className="text-xs text-slate-500">{t('clinic.batchDetailModal.score2Ai')}</span>
              </div>
              <span className="text-[10px] text-slate-500">{t('clinic.batchDetailModal.arteriolarNarrowing')}</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> {t('clinic.batchDetailModal.drRisk')}
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{drScore}%</span>
                <span className="text-xs text-slate-500">{t('clinic.batchDetailModal.icdrGrade')}</span>
              </div>
              <span className="text-[10px] text-slate-500">{t('clinic.batchDetailModal.microaneurysms')}</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> {t('clinic.batchDetailModal.threeYearStroke')}
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{strokeRisk}%</span>
                <span className="text-xs text-slate-500">{t('clinic.batchDetailModal.strokeProjection')}</span>
              </div>
              <span className="text-[10px] text-slate-500">{t('clinic.batchDetailModal.gunnSign')}</span>
            </div>
          </div>

          {/* Interactive Heatmap Controls Bar */}
          <div className="bg-[#F0FDFA] p-3 rounded-2xl border border-[#CCFBF1] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#134E4A] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0891B2]" />
                {t('clinic.batchDetailModal.heatmapOpacityLabel')}
              </span>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-28 accent-[#0891B2] cursor-pointer"
              />
              <span className="font-mono-data font-bold text-[#0891B2]">
                {Math.round(heatmapOpacity * 100)}%
              </span>
            </div>

            {/* Zoom Controls & Pan Guide */}
            <div className="flex items-center gap-2">
              {zoomLevel > 1.0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-medium">
                  <Move className="w-3 h-3 text-teal-600 shrink-0" />
                  <span>{isVi ? 'Kéo ảnh để di chuyển' : 'Drag to pan'}</span>
                </span>
              )}
              <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleZoomChange((z) => z - 0.2)}
                  className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors cursor-pointer"
                  title={t('clinic.batchDetailModal.zoomOutTitle')}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono-data px-2 font-semibold text-slate-700">
                  {(zoomLevel * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoomChange((z) => z + 0.2)}
                  className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors cursor-pointer"
                  title={t('clinic.batchDetailModal.zoomInTitle')}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1 border-l border-slate-200 pl-1 cursor-pointer"
                  title={t('clinic.batchDetailModal.resetZoomTitle')}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoiBoxes(!showRoiBoxes)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  showRoiBoxes
                    ? 'bg-[#0891B2] text-white border-[#0891B2]'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {t('clinic.batchDetailModal.lesionBoxesRoi')}
              </button>

              <button
                type="button"
                onClick={() => setShowAnatomyMarkers(!showAnatomyMarkers)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  showAnatomyMarkers
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {t('clinic.batchDetailModal.anatomyMarkers')}
              </button>

              <div className="inline-flex bg-slate-200 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('sideBySide')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    viewMode === 'sideBySide'
                      ? 'bg-white text-[#134E4A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('clinic.batchDetailModal.sideBySideView')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('overlay')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    viewMode === 'overlay'
                      ? 'bg-white text-[#134E4A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('clinic.batchDetailModal.directOverlayView')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadHeatmap}
                disabled={isDownloading}
                className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60 ${
                  downloadSuccessNotice
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                }`}
                title={t('clinic.batchDetailModal.downloadPng')}
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#0891B2] animate-spin" />
                ) : downloadSuccessNotice ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#0891B2]" />
                )}
                <span>
                  {isDownloading
                    ? (isVi ? 'Đang xuất...' : 'Exporting...')
                    : downloadSuccessNotice
                    ? (isVi ? 'Đã tải PNG' : 'Downloaded')
                    : t('clinic.batchDetailModal.downloadPng')}
                </span>
              </button>
            </div>
          </div>

          {/* Visual Analysis & Interactive Heatmap Viewport */}
          {viewMode === 'sideBySide' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Pane: Original Uploaded Fundus Photo */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 relative group flex flex-col items-center justify-center p-3 shadow-2xl select-none ${
                  zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1 pointer-events-none">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Eye className="w-3.5 h-3.5" /> {t('clinic.batchDetailModal.nativeFundusTitle')}
                  </span>
                  <span className="text-[10px] font-mono-data text-slate-400">{t('clinic.batchDetailModal.nativeResolution')}</span>
                </div>

                <div
                  className="w-full aspect-square max-w-[380px] rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl relative bg-black flex items-center justify-center"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 150ms ease-out',
                  }}
                >
                  <img
                    src={baseImage}
                    alt="Original fundus"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Anatomy Indicators */}
                  {showAnatomyMarkers && (
                    <>
                      <div
                        className="absolute w-8 h-8 border-2 border-yellow-400/80 rounded-full animate-ping pointer-events-none"
                        style={{
                          left: isOD ? '70%' : '23%',
                          top: '47%',
                        }}
                      />
                      <div
                        className="absolute bg-yellow-400/30 backdrop-blur-xs text-yellow-200 text-[9px] font-mono-data px-1.5 py-0.5 rounded border border-yellow-400/70 z-10 pointer-events-none"
                        style={{
                          left: isOD ? '68%' : '21%',
                          top: '45%',
                        }}
                      >
                        Disc
                      </div>
                      <div
                        className="absolute bg-amber-900/70 backdrop-blur-xs text-amber-200 text-[9px] font-mono-data px-1.5 py-0.5 rounded border border-amber-500/70 z-10 pointer-events-none"
                        style={{
                          left: isOD ? '40%' : '53%',
                          top: '50%',
                        }}
                      >
                        Macula
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full flex items-center justify-between text-[10px] font-mono-data text-slate-400 mt-2 px-2">
                  <span>{item.eye} &bull; Native View</span>
                  <span>{t('clinic.batchDetailModal.formatLabel')} {item.fileName.endsWith('.dcm') ? 'DICOM' : 'High-Res Color'}</span>
                </div>
              </div>

              {/* Right Pane: Individualized Grad-CAM Heatmap Layered Over Patient Image with Hover Effects */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`border border-cyan-800/80 rounded-2xl overflow-hidden bg-slate-950 relative group flex flex-col items-center justify-center p-3 shadow-2xl ring-1 ring-cyan-500/20 select-none ${
                  zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1 pointer-events-none">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {t('clinic.batchDetailModal.heatmapLesionTitle')}
                  </span>
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    {heatmapDataUrl ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {t('clinic.batchDetailModal.heatmapAvailable')}
                      </span>
                    ) : (
                      <span className="text-amber-400">{t('clinic.batchDetailModal.noHeatmap')}</span>
                    )}
                  </span>
                </div>

                <div
                  className="w-full aspect-square max-w-[380px] rounded-full overflow-hidden border-4 border-cyan-600 shadow-2xl relative bg-black flex items-center justify-center cursor-crosshair"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 150ms ease-out',
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Lớp nền ảnh gốc bệnh nhân */}
                  <img
                    src={baseImage}
                    alt="Patient Base"
                    className="w-full h-full object-cover absolute inset-0 select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Lớp nhiệt Grad-CAM nếu có từ mô hình thực tế */}
                  {heatmapDataUrl ? (
                    <img
                      src={heatmapDataUrl}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-cover absolute inset-0 transition-opacity duration-200 select-none pointer-events-none"
                      style={{ opacity: Math.max(0.05, heatmapOpacity) }}
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1.5 shadow-sm pointer-events-none">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('clinic.batchDetailModal.noHeatmapWarning')}</span>
                    </div>
                  )}

                  {/* Lớp tương tác SVG ROI & Hiệu ứng ngắm tọa độ (Crosshair HUD) */}
                  <svg viewBox="0 0 512 512" className="absolute inset-0 w-full h-full pointer-events-auto">
                    {/* Đường ngắm Crosshair Laser khi di chuyển chuột */}
                    {mousePos.active && (
                      <g className="pointer-events-none transition-all duration-75">
                        <line
                          x1="0"
                          y1={mousePos.y}
                          x2="512"
                          y2={mousePos.y}
                          stroke="rgba(6, 182, 212, 0.45)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <line
                          x1={mousePos.x}
                          y1="0"
                          x2={mousePos.x}
                          y2="512"
                          stroke="rgba(6, 182, 212, 0.45)"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <circle
                          cx={mousePos.x}
                          cy={mousePos.y}
                          r="8"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.5"
                          className="animate-pulse"
                        />
                        <circle cx={mousePos.x} cy={mousePos.y} r="2" fill="#ef4444" />
                      </g>
                    )}

                    {/* Các mốc giải phẫu Gai Thị & Hoàng Điểm */}
                    {showAnatomyMarkers && (
                      <g className="pointer-events-none">
                        <circle
                          cx={discX}
                          cy={discY}
                          r="22"
                          fill="none"
                          stroke="#facc15"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          className="animate-ping opacity-60"
                        />
                        <rect
                          x={discX - 22}
                          y={discY - 34}
                          width="44"
                          height="16"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke="#facc15"
                          strokeWidth="1"
                        />
                        <text
                          x={discX}
                          y={discY - 22}
                          textAnchor="middle"
                          fill="#fef08a"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isVi ? 'Gai Thị' : 'Optic Disc'}
                        </text>

                        <circle
                          cx={maculaX}
                          cy={maculaY}
                          r="18"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        <rect
                          x={maculaX - 32}
                          y={maculaY - 30}
                          width="64"
                          height="16"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke="#f59e0b"
                          strokeWidth="1"
                        />
                        <text
                          x={maculaX}
                          y={maculaY - 18}
                          textAnchor="middle"
                          fill="#fde68a"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isVi ? 'Hoàng Điểm' : 'Macula'}
                        </text>
                      </g>
                    )}

                    {/* Các hộp tổn thương ROI với hiệu ứng Hover chuyên nghiệp */}
                    {showRoiBoxes &&
                      anomalies.map((ano) => {
                        const isSelected = activeAnomalyId === ano.id;
                        return (
                          <g
                            key={ano.id}
                            onMouseEnter={() => setActiveAnomalyId(ano.id)}
                            onMouseLeave={() => setActiveAnomalyId(null)}
                            onClick={() => {
                              if (isMovedRef.current) return;
                              setActiveAnomalyId(ano.id);
                            }}
                            className="cursor-pointer group/ano"
                          >
                            <rect
                              x={ano.svgX}
                              y={ano.svgY}
                              width={ano.svgW}
                              height={ano.svgH}
                              fill={isSelected ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.25)'}
                              stroke={isSelected ? '#ef4444' : '#facc15'}
                              strokeWidth={isSelected ? '3' : '2'}
                              strokeDasharray="4 2"
                              rx="4"
                              className="animate-pulse transition-all group-hover/ano:stroke-red-500 group-hover/ano:fill-red-500/40"
                            />
                            {/* Pin đèn định vị */}
                            <circle cx={ano.svgX + 4} cy={ano.svgY + 4} r="3.5" fill="#ef4444" />
                            {/* Khung ngắm Reticle khi rê chuột */}
                            {isSelected && (
                              <>
                                <path
                                  d={`M ${ano.svgX - 5} ${ano.svgY + 6} L ${ano.svgX - 5} ${ano.svgY - 5} L ${ano.svgX + 6} ${ano.svgY - 5}`}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="2.5"
                                />
                                <path
                                  d={`M ${ano.svgX + ano.svgW + 5} ${ano.svgY + 6} L ${ano.svgX + ano.svgW + 5} ${ano.svgY - 5} L ${ano.svgX + ano.svgW - 6} ${ano.svgY - 5}`}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="2.5"
                                />
                                <path
                                  d={`M ${ano.svgX - 5} ${ano.svgY + ano.svgH - 6} L ${ano.svgX - 5} ${ano.svgY + ano.svgH + 5} L ${ano.svgX + 6} ${ano.svgY + ano.svgH + 5}`}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="2.5"
                                />
                                <path
                                  d={`M ${ano.svgX + ano.svgW + 5} ${ano.svgY + ano.svgH - 6} L ${ano.svgX + ano.svgW + 5} ${ano.svgY + ano.svgH + 5} L ${ano.svgX + ano.svgW - 6} ${ano.svgY + ano.svgH + 5}`}
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="2.5"
                                />
                              </>
                            )}
                            {/* Nhãn tổn thương */}
                            <rect
                              x={ano.svgX}
                              y={ano.svgY - 18}
                              width={ano.labelW}
                              height="16"
                              rx="3"
                              fill="rgba(15, 23, 42, 0.95)"
                              stroke={isSelected ? '#ef4444' : '#eab308'}
                              strokeWidth="1"
                            />
                            <text
                              x={ano.svgX + 4}
                              y={ano.svgY - 6}
                              fill="#fef08a"
                              fontSize="9.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {ano.label} ({(ano.confidence * 100).toFixed(0)}%)
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                </div>

                {/* Thanh trạng thái HUD live tracking */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono-data text-slate-400 mt-2 px-2">
                  <span>
                    {mousePos.active
                      ? `HUD: X: ${mousePos.x} | Y: ${mousePos.y} &bull; ${getAnatomyZone(mousePos.x, mousePos.y)}`
                      : t('clinic.batchDetailModal.hudHoverHint')}
                  </span>
                  <span className="text-amber-300">Grad-CAM Overlay</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Large Direct Overlay Mode */
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 p-4 shadow-2xl flex flex-col items-center justify-center select-none ${
                zoomLevel > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
            >
              <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1 pointer-events-none">
                <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <Layers className="w-4 h-4" /> {t('clinic.batchDetailModal.directOverlayTitle')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t('clinic.batchDetailModal.directOverlaySubtitle')}
                </span>
              </div>

              <div
                className="w-full aspect-square max-w-[440px] rounded-full overflow-hidden border-4 border-cyan-600 shadow-2xl relative bg-black flex items-center justify-center cursor-crosshair"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 150ms ease-out',
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={baseImage}
                  alt="Base Fundus"
                  className="w-full h-full object-cover absolute inset-0 select-none pointer-events-none"
                  draggable={false}
                />
                {heatmapDataUrl ? (
                  <img
                    src={heatmapDataUrl}
                    alt="AI Grad-CAM Overlay"
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-200 select-none pointer-events-none"
                    style={{ opacity: heatmapOpacity }}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('clinic.batchDetailModal.noHeatmapWarning')}</span>
                  </div>
                )}
                {/* SVG ROI in overlay mode */}
                <svg viewBox="0 0 512 512" className="absolute inset-0 w-full h-full pointer-events-auto">
                  {showRoiBoxes &&
                    anomalies.map((ano) => (
                      <g
                        key={ano.id}
                        onMouseEnter={() => setActiveAnomalyId(ano.id)}
                        onMouseLeave={() => setActiveAnomalyId(null)}
                        className="cursor-pointer group/ano"
                      >
                        <rect
                          x={ano.svgX}
                          y={ano.svgY}
                          width={ano.svgW}
                          height={ano.svgH}
                          fill={activeAnomalyId === ano.id ? 'rgba(239, 68, 68, 0.35)' : 'rgba(234, 179, 8, 0.25)'}
                          stroke={activeAnomalyId === ano.id ? '#ef4444' : '#facc15'}
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          rx="4"
                          className="animate-pulse transition-all group-hover/ano:stroke-red-500 group-hover/ano:fill-red-500/40"
                        />
                        <circle cx={ano.svgX + 4} cy={ano.svgY + 4} r="3.5" fill="#ef4444" />
                        <rect
                          x={ano.svgX}
                          y={ano.svgY - 18}
                          width={ano.labelW}
                          height="16"
                          rx="3"
                          fill="rgba(15, 23, 42, 0.95)"
                          stroke="#eab308"
                          strokeWidth="1"
                        />
                        <text
                          x={ano.svgX + 4}
                          y={ano.svgY - 6}
                          fill="#fef08a"
                          fontSize="9.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {ano.label} ({(ano.confidence * 100).toFixed(0)}%)
                        </text>
                      </g>
                    ))}
                </svg>
              </div>
            </div>
          )}

          {/* Interactive ROI Anomalies Selection Cards */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider font-mono-data flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#0891B2]" />
                {t('clinic.batchDetailModal.detectedAnomaliesTitle')}
              </h4>
              <span className="text-[11px] text-slate-500">
                {anomalies.length > 0
                  ? t('clinic.batchDetailModal.detectedAnomaliesHint')
                  : t('clinic.batchDetailModal.noFocalLesions')}
              </span>
            </div>

            {anomalies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {anomalies.map((ano) => (
                  <div
                    key={ano.id}
                    onMouseEnter={() => setActiveAnomalyId(ano.id)}
                    onMouseLeave={() => setActiveAnomalyId(null)}
                    onClick={() => setActiveAnomalyId(ano.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      activeAnomalyId === ano.id
                        ? 'bg-[#F0FDFA] border-[#0891B2] ring-2 ring-[#0891B2]/30 shadow-md translate-y-[-2px]'
                        : 'bg-slate-50 border-slate-200 hover:border-[#0891B2] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#134E4A] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#DC2626]" />
                        {ano.label}
                      </span>
                      <span className="text-[11px] font-mono-data font-semibold text-[#0891B2]">
                        Conf: {(ano.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ano.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('clinic.batchDetailModal.noLesionsDesc')}</span>
              </div>
            )}
          </div>

          {/* Quantitative Biomarkers Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0891B2]" />
              {t('clinic.batchDetailModal.biomarkersTitle')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t('clinic.batchDetailModal.avrLabel')}</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{avRatio}</span>
                <span className="text-[9px] text-amber-600 block mt-0.5">{t('clinic.batchDetailModal.avrNormal')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t('clinic.batchDetailModal.tortuosityLabel')}</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{tortuosity}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">{t('clinic.batchDetailModal.tortuosityDesc')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t('clinic.batchDetailModal.vesselDensityLabel')}</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{vesselDensity}%</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">{t('clinic.batchDetailModal.vesselDensityDesc')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t('clinic.batchDetailModal.cdrLabel')}</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{opticCdr}</span>
                <span className="text-[9px] text-emerald-600 block mt-0.5">{t('clinic.batchDetailModal.cdrNormal')}</span>
              </div>
            </div>
          </div>

          {/* AI Explainability Rationales */}
          <div className="border border-cyan-100 bg-[#F0FDFA]/50 rounded-2xl p-4 space-y-1.5">
            <h4 className="text-xs font-bold text-[#134E4A] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0891B2]" />
              {t('clinic.batchDetailModal.rationalesTitle')}
            </h4>
            <ul className="space-y-1 text-xs text-slate-700">
              {rationales.map((rat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{rat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Medical Disclaimer */}
          <MedicalDisclaimer variant="compact" />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{t('clinic.batchDetailModal.processingDuration')} <strong>{item.durationMs || 1420} ms</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            {t('clinic.batchDetailModal.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
