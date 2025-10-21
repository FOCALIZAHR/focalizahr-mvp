// src/components/survey/constants/animations.ts

export const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0
  },
  exit: { opacity: 0, y: -10 }
};

export const scaleIn = {
  initial: { scale: 0.98, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1
  },
  exit: { scale: 0.98, opacity: 0 }
};