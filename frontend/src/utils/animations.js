// src/utils/animations.js

/**
 * Framer Motion animation variants
 */

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Fade in up animation
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Fade in down animation
export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Scale animation
export const scale = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

// Slide in from left
export const slideInLeft = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

// Slide in from right
export const slideInRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
};

// Stagger children animation
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Hover scale effect
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

// Hover glow effect
export const hoverGlow = {
  boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)',
  transition: { duration: 0.3 },
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

// Modal animation
export const modalAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

// Backdrop animation
export const backdropAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Card flip animation
export const cardFlip = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  transition: { duration: 0.6 },
};

// Bounce animation
export const bounce = {
  y: [0, -10, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    repeatDelay: 1,
  },
};

// Pulse animation
export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
  },
};

// Shake animation
export const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 },
};

// Rotate animation
export const rotate = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// Spring animation config
export const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Smooth animation config
export const smoothConfig = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Fast animation config
export const fastConfig = {
  type: 'tween',
  duration: 0.15,
};

// Export all as default
export default {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scale,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  hoverScale,
  hoverGlow,
  pageTransition,
  modalAnimation,
  backdropAnimation,
  cardFlip,
  bounce,
  pulse,
  shake,
  rotate,
  springConfig,
  smoothConfig,
  fastConfig,
};