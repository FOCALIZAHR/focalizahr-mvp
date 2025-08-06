// ====================================================================
// FOCALIZAHR COUNT-UP ANIMATION - NÚCLEO PREDICTIVO PREMIUM
// src/components/monitor/cockpit/CountUpAnimation.tsx
// Chat 2: Animación números para efecto WOW Tesla-level
// ====================================================================

"use client";

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface CountUpAnimationProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  delay?: number;
}

export function CountUpAnimation({ 
  value, 
  duration = 1.5, 
  className = "",
  suffix = "",
  delay = 0
}: CountUpAnimationProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(count, value, {
        duration,
        ease: "easeOut"
      });
      
      return controls.stop;
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [count, value, duration, delay]);

  return (
    <motion.span 
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: delay + 0.2, 
        type: "spring", 
        stiffness: 200,
        damping: 12
      }}
    >
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}