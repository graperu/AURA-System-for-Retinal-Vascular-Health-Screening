import React, { useEffect, useState, useRef } from 'react';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

export interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Animated count-up counter with cubic ease-out and SSR / Static Markup transparency.
 * Under Node.js SSR (renderToStaticMarkup) or prefers-reduced-motion, immediately
 * renders the target value so tests and static rendering receive the expected clinical string.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  duration = 1200,
  suffix = '',
  className = '',
}) => {
  const prefersReducedMotion = useAuraReducedMotion();
  const isSSR = typeof window === 'undefined';
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;

  // SSR Transparency: Immediately render target value in SSR or reduced-motion environments
  const [displayValue, setDisplayValue] = useState<number>(() => {
    return isSSR || prefersReducedMotion ? numericValue : 0;
  });

  const prevValueRef = useRef<number>(numericValue);

  useEffect(() => {
    if (isSSR || prefersReducedMotion) {
      setDisplayValue(numericValue);
      prevValueRef.current = numericValue;
      return;
    }

    const startValue = prevValueRef.current;
    const targetValue = numericValue;
    prevValueRef.current = targetValue;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / Math.max(1, duration), 1);

      // Cubic ease-out: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (typeof window !== 'undefined' && animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [numericValue, duration, prefersReducedMotion, isSSR]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toString();

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
