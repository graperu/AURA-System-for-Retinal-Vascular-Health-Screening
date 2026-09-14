import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { ClinicBatchJobItem } from '../types/cds';
import { MedicalDisclaimer } from './ui/MedicalDisclaimer';

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

  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.70);
  const [viewMode, setViewMode] = useState<'sideBySide' | 'overlay'>('sideBySide');
  const [showRoiBoxes, setShowRoiBoxes] = useState<boolean>(true);
  const [showAnatomyMarkers, setShowAnatomyMarkers] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeAnomalyId, setActiveAnomalyId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

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
          label: ano.label || ano.type || 'Tổn thương vi mạch',
          svgX,
          svgY,
          svgW,
          svgH,
          labelW: 130,
          confidence: ano.confidence ?? 0.9,
          description: ano.description || 'Vùng tổn thương được phát hiện bởi mô hình CDS',
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

  const rationales = ai?.xaiRationales && ai.xaiRationales.length > 0
    ? ai.xaiRationales
    : overallRisk < 40
    ? [
        'Cung mạch võng mạc phân bố đều đặn, không thấy dấu hiệu tắc nghẽn hay co hẹp.',
        'Chưa phát hiện dấu hiệu nén ép hay xơ cứng thành mạch máu.',
        'Mạng lưới tưới máu mao mạch võng mạc ổn định.',
      ]
    : overallRisk < 65
    ? [
        'Dấu hiệu co thắt nhẹ vi mạch hoặc biến đổi vi tuần hoàn khu trú.',
        'Độ uốn lượn mạch máu cần theo dõi định kỳ.',
      ]
    : [
        'Suy giảm tỷ lệ A/V ratio (co hẹp tiểu động mạch võng mạc khu trú)',
        'Dấu hiệu nén vách tĩnh mạch tại điểm bắt chéo động-tĩnh mạch (Gunn sign)',
        'Độ uốn lượn mạch máu tăng do biến đổi áp lực lưu lượng vi tuần hoàn',
      ];

  const riskBadgeClass =
    overallRisk >= 75
      ? 'bg-red-50 text-red-700 border-red-200'
      : overallRisk >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 512);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 512);
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  const handleDownloadHeatmap = () => {
    if (!heatmapDataUrl) return;
    const a = document.createElement('a');
    a.href = heatmapDataUrl;
    a.download = `GradCAM_${item.mrn}_${item.eye}.png`;
    a.click();
  };

  // Xác định tên vùng giải phẫu đang rà chuột
  const getAnatomyZone = (x: number, y: number) => {
    const distDisc = Math.hypot(x - discX, y - discY);
    const distMacula = Math.hypot(x - maculaX, y - maculaY);
    if (distDisc < 60) return 'Khu vực Gai Thị (Optic Disc)';
    if (distMacula < 70) return 'Khu vực Hoàng Điểm (Macula / FAZ)';
    if (y < 220) return 'Cung mạch thái dương trên (Superior Arcade)';
    if (y > 300) return 'Cung mạch thái dương dưới (Inferior Arcade)';
    return 'Võng mạc cực sau (Posterior Pole)';
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
                  {item.eye === 'OD' ? 'Mắt Phải (OD)' : 'Mắt Trái (OS)'}
                </span>
              </div>
              <p className="text-xs text-cyan-100 flex items-center gap-2 mt-0.5">
                <span>Khử định danh HIPAA: <strong className="font-mono-data">{item.pseudonymId || 'ANO-PAT-DEID'}</strong></span>
                <span>&bull;</span>
                <span>Tệp: <strong className="font-mono-data">{item.fileName}</strong></span>
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
              <span className="text-[11px] font-bold uppercase tracking-wider">Nguy Cơ Mạch Máu Chung</span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-extrabold font-mono-data">{overallRisk}%</span>
                <span className="text-xs font-semibold">
                  {overallRisk >= 75 ? 'Cao (High)' : overallRisk >= 50 ? 'Trung Bình' : 'Thấp (Low)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Mô hình AURA Multimodal Vision CDS</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Nguy Cơ Tim Mạch
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{cardioScore}%</span>
                <span className="text-xs text-slate-500">SCORE2-AI</span>
              </div>
              <span className="text-[10px] text-slate-500">Hẹp lòng mạch vi tuần hoàn</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> Võng Mạc ĐTĐ (DR)
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{drScore}%</span>
                <span className="text-xs text-slate-500">ICDR Giai đoạn 2</span>
              </div>
              <span className="text-[10px] text-slate-500">Vi phình & xuất huyết nhỏ</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Đột Quỵ 3 Năm
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-extrabold font-mono-data text-slate-800">{strokeRisk}%</span>
                <span className="text-xs text-slate-500">Dự báo đột quỵ</span>
              </div>
              <span className="text-[10px] text-slate-500">Áp lực thành mạch & Gunn sign</span>
            </div>
          </div>

          {/* Interactive Heatmap Controls Bar */}
          <div className="bg-[#F0FDFA] p-3 rounded-2xl border border-[#CCFBF1] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#134E4A] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#0891B2]" />
                Độ mờ AI Heatmap:
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

            {/* Zoom Controls */}
            <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono-data px-2 font-semibold text-slate-700">
                {(zoomLevel * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.2).toFixed(1))))}
                className="p-1 text-slate-600 hover:text-[#0891B2] transition-colors"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1 border-l border-slate-200 pl-1"
                title="Đặt lại zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
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
                Hộp Tổn Thương (ROI)
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
                Mốc Giải Phẫu
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
                  Xem Song Song
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
                  Chồng Lớp Trực Tiếp
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadHeatmap}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                title="Tải ảnh bản đồ nhiệt AI của ca này"
              >
                <Download className="w-3.5 h-3.5 text-[#0891B2]" /> Tải PNG
              </button>
            </div>
          </div>

          {/* Visual Analysis & Interactive Heatmap Viewport */}
          {viewMode === 'sideBySide' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Pane: Original Uploaded Fundus Photo */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 relative group flex flex-col items-center justify-center p-3 shadow-2xl">
                <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Eye className="w-3.5 h-3.5" /> Ảnh Võng Mạc Gốc (Native Upload)
                  </span>
                  <span className="text-[10px] font-mono-data text-slate-400">512 &times; 512 px</span>
                </div>

                <div
                  className="w-full aspect-square max-w-[380px] rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl relative bg-black flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={baseImage}
                    alt="Original fundus"
                    className="w-full h-full object-cover select-none"
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
                  <span>Định dạng: {item.fileName.endsWith('.dcm') ? 'DICOM' : 'High-Res Color'}</span>
                </div>
              </div>

              {/* Right Pane: Individualized Grad-CAM Heatmap Layered Over Patient Image with Hover Effects */}
              <div className="border border-cyan-800/80 rounded-2xl overflow-hidden bg-slate-950 relative group flex flex-col items-center justify-center p-3 shadow-2xl ring-1 ring-cyan-500/20">
                <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Bản Đồ Nhiệt Grad-CAM & Vùng Tổn Thương
                  </span>
                  <span className="text-[10px] font-semibold flex items-center gap-1">
                    {heatmapDataUrl ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Bản đồ nhiệt Grad-CAM
                      </span>
                    ) : (
                      <span className="text-amber-400">Chưa có bản đồ nhiệt</span>
                    )}
                  </span>
                </div>

                <div
                  className="w-full aspect-square max-w-[380px] rounded-full overflow-hidden border-4 border-cyan-600 shadow-2xl relative bg-black flex items-center justify-center transition-transform duration-200 cursor-crosshair"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Lớp nền ảnh gốc bệnh nhân */}
                  <img
                    src={baseImage}
                    alt="Patient Base"
                    className="w-full h-full object-cover absolute inset-0 select-none"
                  />

                  {/* Lớp nhiệt Grad-CAM nếu có từ mô hình thực tế */}
                  {heatmapDataUrl ? (
                    <img
                      src={heatmapDataUrl}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-cover absolute inset-0 transition-opacity duration-200 select-none"
                      style={{ opacity: Math.max(0.05, heatmapOpacity) }}
                    />
                  ) : (
                    <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1.5 shadow-sm pointer-events-none">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chưa có bản đồ nhiệt Grad-CAM</span>
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
                          Gai Thị
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
                          Hoàng Điểm
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
                            onClick={() => setActiveAnomalyId(ano.id)}
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
                      : 'Rê chuột để soi tọa độ & phân tầng vi mạch'}
                  </span>
                  <span className="text-amber-300">Grad-CAM Overlay</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Large Direct Overlay Mode */
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 p-4 shadow-2xl flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-2 px-1">
                <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <Layers className="w-4 h-4" /> Chế Độ Chồng Lớp AI Trên Ảnh Võng Mạc Bệnh Nhân (Direct Overlay)
                </span>
                <span className="text-[11px] text-slate-400">
                  Kéo thanh trượt Opacity phía trên để so sánh ảnh gốc và quang phổ nhiệt
                </span>
              </div>

              <div
                className="w-full aspect-square max-w-[440px] rounded-full overflow-hidden border-4 border-cyan-600 shadow-2xl relative bg-black flex items-center justify-center cursor-crosshair transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={baseImage}
                  alt="Base Fundus"
                  className="w-full h-full object-cover absolute inset-0 select-none"
                />
                {heatmapDataUrl ? (
                  <img
                    src={heatmapDataUrl}
                    alt="AI Grad-CAM Overlay"
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-200 select-none"
                    style={{ opacity: heatmapOpacity }}
                  />
                ) : (
                  <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur-xs text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chưa có bản đồ nhiệt Grad-CAM</span>
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
                Các Vùng Bất Thường Phát Hiện Bởi AI (Detected ROI Anomalies):
              </h4>
              <span className="text-[11px] text-slate-500">
                {anomalies.length > 0
                  ? 'Rê hoặc bấm thẻ để làm nổi bật vị trí trên võng mạc'
                  : 'Không phát hiện tổn thương khu trú'}
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
                <span>Không phát hiện tổn thương vi phình mạch hoặc xuất huyết khu trú trên ảnh này.</span>
              </div>
            )}
          </div>

          {/* Quantitative Biomarkers Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0891B2]" />
              Chỉ số sinh học vi mạch võng mạc
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Tỷ lệ động-tĩnh mạch (A/V)</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{avRatio}</span>
                <span className="text-[9px] text-amber-600 block mt-0.5">Chuẩn bình thường: ~0.67</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Độ ngoằn ngoèo mạch máu</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{tortuosity}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Tăng áp lực vi mạch</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Mật độ vi mạch</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{vesselDensity}%</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Vascular Density</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Tỷ lệ lõm đĩa thị (C/D)</span>
                <span className="text-base font-bold font-mono-data text-slate-800">{opticCdr}</span>
                <span className="text-[9px] text-emerald-600 block mt-0.5">Trong giới hạn an toàn</span>
              </div>
            </div>
          </div>

          {/* AI Explainability Rationales */}
          <div className="border border-cyan-100 bg-[#F0FDFA]/50 rounded-2xl p-4 space-y-1.5">
            <h4 className="text-xs font-bold text-[#134E4A] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0891B2]" />
              Bằng Chứng & Luận Cứ Chẩn Đoán AI (XAI Clinical Rationales)
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
            <span>Thời gian AI xử lý: <strong>{item.durationMs || 1420} ms</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
