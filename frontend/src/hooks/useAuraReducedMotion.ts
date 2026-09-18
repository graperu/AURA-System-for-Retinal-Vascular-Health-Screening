import { useState, useEffect } from 'react';

/**
 * SSR-safe hook to detect if the user prefers reduced motion (WCAG 2.1 AA).
 * In Node.js / SSR / static rendering environments (e.g. renderToStaticMarkup),
 * gracefully defaults to false without throwing ReferenceError: window is not defined.
 */
export function useAuraReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return false;
    }
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return;
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else {
          mediaQuery.removeListener(listener);
        }
      };
    } catch {
      // Graceful fallback in environments where matchMedia is mocked or unsupported
    }
  }, []);

  return prefersReducedMotion;
}

export default useAuraReducedMotion;
