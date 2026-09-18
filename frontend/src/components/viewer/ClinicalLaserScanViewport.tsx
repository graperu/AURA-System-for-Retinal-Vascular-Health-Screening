import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Crosshair, Eye, Layers, ShieldCheck, Zap } from 'lucide-react';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';
import { useLanguage } from '../../context/LanguageContext';

export interface ClinicalLaserScanViewportProps {
  imageSrc?: string;
  previewUrl?: string;
  selectedEye?: 'Right_OD' | 'Left_OS' | 'OD' | 'OS' | string;
  scanType?: 'Fundus_Macula' | 'Fundus_OpticDisc' | 'OCT_Scan' | string;
  currentStepIndex?: number; // 0 to 4 (matching realStages)
  progressPercent?: number;  // 0 to 100
  isAnalyzing?: boolean;
  statusText?: string;
  patientName?: string | null;
  mrn?: string | null;
  className?: string;
}

interface StepOpticalConfig {
  nameVi: string;
  nameEn: string;
  beamColor: string;
  glowColor: string;
  speedSec: number;
  protocolVi: string;
  protocolEn: string;
}

const OPTICAL_STAGE_CONFIGS: StepOpticalConfig[] = [
  {
    nameVi: 'Khởi tạo cảm biến & Căn chỉnh lưới',
    nameEn: 'Optical Calibration & Sensor Lock',
    beamColor: '#38BDF8', // Sky Blue
    glowColor: 'rgba(56, 189, 248, 0.45)',
    speedSec: 2.6,
    protocolVi: 'QUANG HỌC: HIỆU CHUẨN ĐA TẦNG',
    protocolEn: 'OPTICAL: SENSOR CALIBRATION',
  },
  {
    nameVi: 'Tách kênh quang học 540nm (Red-Free)',
    nameEn: '540nm Green Channel Optical Separation',
    beamColor: '#10B981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.45)',
    speedSec: 2.0,
    protocolVi: 'QUANG HỌC: TÁCH KÊNH 540nm RED-FREE',
    protocolEn: 'OPTICAL: 540nm RED-FREE FILTER',
  },
  {
    nameVi: 'Phân tích vi mạch Gemini 3.8 VLM',
    nameEn: 'Gemini 3.8 VLM Neural Inference',
    beamColor: '#22D3EE', // Cyan Neon
    glowColor: 'rgba(34, 211, 238, 0.55)',
    speedSec: 1.4,
    protocolVi: 'MẠNG NƠ-RON: PHÂN TÍCH VI MẠCH GEMINI 3.8',
    protocolEn: 'NEURAL: GEMINI 3.8 VLM INFERENCE',
  },
  {
    nameVi: 'Định lượng 4 phân tầng nguy cơ lâm sàng',
    nameEn: 'Synthesizing 4 Clinical Risk Pillars',
    beamColor: '#F59E0B', // Amber Neon
    glowColor: 'rgba(245, 158, 11, 0.50)',
    speedSec: 1.8,
    protocolVi: 'LÂM SÀNG: ĐỊNH LƯỢNG RỦI RO & TỔN THƯƠNG',
    protocolEn: 'CLINICAL: LESION SYNTHESIS',
  },
  {
    nameVi: 'Hoàn tất bản ghi & Đồng bộ bác sĩ',
    nameEn: 'Finalizing Record & Doctor Worklist Sync',
    beamColor: '#00FF66', // Neon Green
    glowColor: 'rgba(0, 255, 102, 0.60)',
    speedSec: 2.4,
    protocolVi: 'ĐỒNG BỘ: KẾT THÚC & LƯU HỒ SƠ CDS',
    protocolEn: 'SYNCHRONIZE: CDS RECORD FINALIZED',
  },
];

export const ClinicalLaserScanViewport: React.FC<ClinicalLaserScanViewportProps> = ({
  imageSrc,
  previewUrl,
  selectedEye = 'Right_OD',
  scanType = 'Fundus_Macula',
  currentStepIndex,
  progressPercent = 0,
  isAnalyzing = true,
  statusText,
  patientName,
  mrn,
  className = '',
}) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const prefersReducedMotion = useAuraReducedMotion();

  // Resolve source image
  const displayImage = previewUrl || imageSrc;

  // Determine eye laterality & anatomical coordinates
  const isOS = selectedEye === 'Left_OS' || selectedEye === 'OS';
  const eyeLabel = isOS ? 'OS (Mắt Trái)' : 'OD (Mắt Phải)';
  const eyeShortLabel = isOS ? 'OS' : 'OD';

  // OD: Optic Disc at nasal side (left of image x~28%), Macula at temporal side (right of image x~64%)
  // OS: Optic Disc at nasal side (right of image x~72%), Macula at temporal side (left of image x~36%)
  const opticDiscX = isOS ? 72 : 28;
  const opticDiscY = 50;
  const maculaX = isOS ? 36 : 64;
  const maculaY = 52;

  // Derive active stage index from prop or progress percent
  const resolvedStepIndex = useMemo(() => {
    if (typeof currentStepIndex === 'number' && currentStepIndex >= 0 && currentStepIndex < 5) {
      return currentStepIndex;
    }
    if (progressPercent < 20) return 0;
    if (progressPercent < 40) return 1;
    if (progressPercent < 65) return 2;
    if (progressPercent < 85) return 3;
    return 4;
  }, [currentStepIndex, progressPercent]);

  const currentStage = OPTICAL_STAGE_CONFIGS[resolvedStepIndex] || OPTICAL_STAGE_CONFIGS[0];

  return (
    <div
      role="region"
      aria-label={isVi ? 'Bàn quét quang học laser phân tích đáy mắt' : 'Clinical AI Optical Laser Scan Viewport'}
      className={`relative w-full aspect-square max-h-[440px] sm:max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl flex flex-col justify-between select-none ${className}`}
      style={{
        boxShadow: `0 0 30px -10px ${currentStage.glowColor}, 0 20px 25px -5px rgba(0, 0, 0, 0.7)`,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* LAYER 0: BASE FUNDUS SCAN IMAGE                               */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center p-3 sm:p-5">
        {displayImage ? (
          <img
            src={displayImage}
            alt={isVi ? 'Ảnh chụp đáy mắt đang phân tích' : 'Fundus scan under analysis'}
            className="w-full h-full object-contain rounded-xl transition-transform duration-700 pointer-events-none"
            style={{
              filter: isAnalyzing && resolvedStepIndex >= 1
                ? 'contrast(115%) brightness(96%)'
                : 'none',
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-slate-900/80 border border-dashed border-slate-800 text-slate-500">
            <Eye className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
            <span className="text-xs font-mono tracking-wider">
              {isVi ? 'ĐANG CHỜ TÍN HIỆU QUANG HỌC' : 'AWAITING OPTICAL FEED'}
            </span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: PULSE GRID MATRIX (32px cyan grid, breathing opacity) */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none laser-pulse-grid"
        style={{
          opacity: prefersReducedMotion ? 0.2 : undefined,
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* LAYER 2: ANATOMICAL TARGETING RETICLES (OD / OS AWARE)         */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Optic Disc Reticle */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
          style={{ left: `${opticDiscX}%`, top: `${opticDiscY}%` }}
        >
          <div
            className={`w-14 h-14 rounded-full border border-dashed flex items-center justify-center transition-colors duration-500 ${
              prefersReducedMotion ? '' : 'animate-reticle-pulse'
            }`}
            style={{
              borderColor: currentStage.beamColor,
              boxShadow: `0 0 12px ${currentStage.glowColor}`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentStage.beamColor }}
            />
            {/* Crosshair lines */}
            <div
              className="absolute w-20 h-[1px] opacity-60"
              style={{ backgroundColor: currentStage.beamColor }}
            />
            <div
              className="absolute h-20 w-[1px] opacity-60"
              style={{ backgroundColor: currentStage.beamColor }}
            />
          </div>
          <span
            className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold border backdrop-blur-xs shadow-xs"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: currentStage.beamColor,
              color: currentStage.beamColor,
            }}
          >
            {isOS ? 'DISC (OS)' : 'DISC (OD)'}
          </span>
        </div>

        {/* Macula & FAZ Reticle */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
          style={{ left: `${maculaX}%`, top: `${maculaY}%` }}
        >
          <div
            className="relative w-12 h-12 flex items-center justify-center"
            style={{ color: currentStage.beamColor }}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor: currentStage.beamColor }} />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor: currentStage.beamColor }} />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor: currentStage.beamColor }} />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor: currentStage.beamColor }} />
            {/* Tiny center FAZ dot */}
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentStage.beamColor }} />
          </div>
          <span
            className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold border backdrop-blur-xs shadow-xs"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: currentStage.beamColor,
              color: currentStage.beamColor,
            }}
          >
            FAZ
          </span>
        </div>

        {/* Central Convergent Pulse Ripple (When reaching final phase) */}
        {resolvedStepIndex >= 4 && !prefersReducedMotion && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${maculaX}%`, top: `${maculaY}%` }}
          >
            <div
              className="w-16 h-16 rounded-full border border-emerald-400/80 animate-lesion-ripple"
              style={{ boxShadow: '0 0 20px #00FF66' }}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 3: VERTICAL OPTICAL LASER SCAN SWEEP BEAM               */}
      {/* ------------------------------------------------------------- */}
      {isAnalyzing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {prefersReducedMotion ? (
            // Static accessible HUD guide beam across center
            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] transition-colors duration-500"
              style={{
                backgroundColor: currentStage.beamColor,
                boxShadow: `0 0 16px ${currentStage.beamColor}, 0 0 32px ${currentStage.glowColor}`,
              }}
            >
              <div
                className="absolute inset-x-0 -top-6 h-12 pointer-events-none opacity-40"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${currentStage.glowColor}, transparent)`,
                }}
              />
            </div>
          ) : (
            // Animated vertical sweep line with trailing optical beam glow
            <motion.div
              key={resolvedStepIndex}
              className="absolute inset-x-0 pointer-events-none"
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{
                duration: currentStage.speedSec * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ willChange: 'top' }}
            >
              {/* Laser Core Line */}
              <div
                className="h-[2px] w-full transition-colors duration-500"
                style={{
                  backgroundColor: currentStage.beamColor,
                  boxShadow: `0 0 14px ${currentStage.beamColor}, 0 0 28px ${currentStage.beamColor}, 0 0 45px ${currentStage.glowColor}`,
                }}
              />
              {/* Trailing Optical Glow */}
              <div
                className="h-20 w-full transition-colors duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${currentStage.glowColor} 0%, rgba(34, 211, 238, 0.05) 60%, transparent 100%)`,
                }}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LAYER 4: CORNER VIEWFINDER BRACKETS (L-MARKERS)                */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* HUD HEADER: PROTOCOL & CALIBRATION METADATA                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 p-3 sm:p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent flex items-center justify-between gap-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full animate-ping shrink-0"
            style={{ backgroundColor: currentStage.beamColor }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold font-mono tracking-wider text-slate-200 uppercase">
                {isVi ? 'QUÉT LASER AI:' : 'AI LASER SCAN:'} {eyeShortLabel}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono">
                λ 540nm
              </span>
              {scanType && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300 border border-slate-700/80 font-mono hidden sm:inline-block">
                  {scanType.replace('Fundus_', '')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              {isVi ? currentStage.protocolVi : currentStage.protocolEn}
            </p>
          </div>
        </div>

        {/* Phase Badge */}
        <div className="text-right shrink-0">
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border backdrop-blur-xs inline-block"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderColor: currentStage.beamColor,
              color: currentStage.beamColor,
            }}
          >
            {isVi ? `BƯỚC ${resolvedStepIndex + 1}/5` : `STEP ${resolvedStepIndex + 1}/5`}
          </span>
          <div className="text-[10px] font-mono-data text-slate-400 mt-0.5">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HUD FOOTER: LIVE SENSOR TELEMETRY READOUT                     */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 p-2.5 sm:p-3 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <span className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">FREQ:</span> 60Hz
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Cpu className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden md:inline">TENSOR:</span> GEMINI 3.8
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>~42ms</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isAnalyzing ? currentStage.beamColor : '#10B981' }}
          />
          <span className="text-[10px] text-slate-200 font-semibold tracking-wide uppercase">
            {isAnalyzing
              ? isVi
                ? 'ĐANG THU NHẬN TÍN HIỆU'
                : 'ACQUIRING SIGNAL'
              : isVi
              ? 'HOÀN THÀNH'
              : 'COMPLETED'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClinicalLaserScanViewport;
