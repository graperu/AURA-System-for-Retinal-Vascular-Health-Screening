import React from 'react';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

export interface BiomarkerGaugeBarProps {
  percent: number; // 0 to 100
  colorClass?: string;
  heightClass?: string;
  className?: string;
  minPercent?: number;
  ariaLabel?: string;
}

/**
 * Biomarker Progress Gauge Bar with smooth ease-out transition (700ms)
 * and WCAG 2.1 AA reduced-motion fallback (0.01ms transition).
 */
export const BiomarkerGaugeBar: React.FC<BiomarkerGaugeBarProps> = ({
  percent,
  colorClass = 'bg-[#3478F6]',
  heightClass = 'h-1.5',
  className = '',
  minPercent = 4,
  ariaLabel,
}) => {
  const prefersReducedMotion = useAuraReducedMotion();
  const safePercent = typeof percent === 'number' && !isNaN(percent) ? percent : 0;
  const clampedPercent = Math.min(100, Math.max(minPercent, safePercent));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safePercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={`w-full bg-slate-200/80 rounded-full overflow-hidden ${heightClass} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all ease-out ${colorClass}`}
        style={{
          width: `${clampedPercent}%`,
          transitionDuration: prefersReducedMotion ? '0.01ms' : '700ms',
        }}
      />
    </div>
  );
};

export default BiomarkerGaugeBar;
