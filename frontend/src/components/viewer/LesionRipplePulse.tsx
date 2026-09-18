import React from 'react';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

export interface LesionRipplePulseProps {
  type: string; // 'Microaneurysm' | 'Hemorrhage' | etc.
  isSelected?: boolean;
  className?: string;
}

/**
 * High-tech Dual Concentric Expanding Ripple Waves for Microvascular Lesions
 * (Microaneurysms: Amber #F59E0B, Hemorrhages: Crimson #EF4444).
 * Pointer-events are strictly disabled so clinician pinpoint interaction is 100% unimpeded.
 * Respects WCAG 2.1 AA prefers-reduced-motion by falling back to a static halo.
 */
export const LesionRipplePulse: React.FC<LesionRipplePulseProps> = ({
  type,
  isSelected = false,
  className = '',
}) => {
  const prefersReducedMotion = useAuraReducedMotion();

  const normalizedType = (type || '').toLowerCase();
  const isMicroaneurysm =
    normalizedType.includes('microaneurysm') || normalizedType === 'ma';
  const isHemorrhage =
    normalizedType.includes('hemorrhage') ||
    normalizedType.includes('bleed') ||
    normalizedType.includes('xuat_huyet');

  // Only microvascular capillary dilatations & hemorrhages trigger high-acuity ripple waves
  if (!isMicroaneurysm && !isHemorrhage) {
    return null;
  }

  const ringColor = isHemorrhage
    ? 'rgba(239, 68, 68, 0.6)'
    : 'rgba(245, 158, 11, 0.6)';

  if (prefersReducedMotion) {
    return (
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full pointer-events-none ${
          isHemorrhage ? 'ring-2 ring-rose-500/40' : 'ring-2 ring-amber-400/40'
        } ${isSelected ? 'ring-4' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
    >
      {/* Concentric expanding ripple ring 1 (Primary wavefront) */}
      <span
        className="aura-lesion-ripple-ring absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: `2px solid ${ringColor}`,
          animation: 'aura-lesion-ripple 2.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
          boxShadow: isSelected
            ? `0 0 8px ${ringColor}`
            : undefined,
        }}
      />

      {/* Concentric expanding ripple ring 2 (Secondary wavefront, 0.8s phase delay) */}
      <span
        className="aura-lesion-ripple-ring absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: `1.5px solid ${ringColor}`,
          animation: 'aura-lesion-ripple 2.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.8s infinite',
        }}
      />
    </div>
  );
};

export default LesionRipplePulse;
