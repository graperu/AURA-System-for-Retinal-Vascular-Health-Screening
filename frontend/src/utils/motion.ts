import type { Transition, Variants } from 'framer-motion';

/**
 * SSR-safe browser environment check.
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Clinical spring physics presets.
 * Balanced for high responsiveness, zero perceptible lag, and organic physical feedback.
 */
export const clinicalSpring: Transition = {
  type: 'spring',
  damping: 28,
  stiffness: 350,
  mass: 0.8,
};

export const drawerSpring: Transition = {
  type: 'spring',
  damping: 30,
  stiffness: 320,
  mass: 0.9,
};

export const quickSpring: Transition = {
  type: 'spring',
  damping: 22,
  stiffness: 400,
  mass: 0.6,
};

export const smoothFadeTransition: Transition = {
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1],
};

/**
 * Universal Modal Animation Variants
 */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0, transition: clinicalSpring },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.12, ease: 'easeIn' } },
};

/**
 * Drawer Animation Variants (Right & Left Slide-over)
 */
export const drawerRightVariants: Variants = {
  initial: { x: '100%', opacity: 0.8 },
  animate: { x: 0, opacity: 1, transition: drawerSpring },
  exit: { x: '100%', opacity: 0.8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

export const drawerLeftVariants: Variants = {
  initial: { x: '-100%', opacity: 0.8 },
  animate: { x: 0, opacity: 1, transition: drawerSpring },
  exit: { x: '-100%', opacity: 0.8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

/**
 * Page & Tab Crossfade Transition Variants (< 160ms)
 */
const initialPageTransition: any = (reduced?: boolean) =>
  reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 };
initialPageTransition.opacity = 0;

const exitPageTransition: any = (reduced?: boolean) =>
  reduced
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: -6, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } };
exitPageTransition.opacity = 0;

export const pageTransitionVariants: Variants = {
  initial: initialPageTransition,
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
  exit: exitPageTransition,
};

/**
 * Micro-Interaction Hover & Press Physics (< 200ms)
 */
export const buttonHoverPhysics = {
  scale: 1.015,
  y: -0.5,
  transition: { duration: 0.12, ease: 'easeOut' },
};

export const buttonTapPhysics = {
  scale: 0.97,
  transition: { duration: 0.08, ease: 'easeOut' },
};

export const kpiCardHoverPhysics = {
  y: -3,
  transition: { duration: 0.16, ease: 'easeOut' },
};

export const tableRowHoverPhysics = {
  backgroundColor: 'rgba(243, 244, 246, 0.65)',
  transition: { duration: 0.1 },
};

export const tableRowTapPhysics = {
  scale: 0.998,
  transition: { duration: 0.06 },
};

export const queueCardHoverPhysics = {
  x: 3,
  transition: { duration: 0.14, ease: 'easeOut' },
};

export const queueCardTapPhysics = {
  scale: 0.985,
  transition: { duration: 0.08 },
};
