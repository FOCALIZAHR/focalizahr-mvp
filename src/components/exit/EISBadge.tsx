// ====================================================================
// EIS BADGE - BADGE DE CLASIFICACIÓN EXIT INTELLIGENCE
// src/components/exit/EISBadge.tsx
// ====================================================================

'use client';

import { memo } from 'react';

// ============================================
// TYPES
// ============================================
type EISClassification = 'healthy' | 'neutral' | 'problematic' | 'toxic' | null;

interface EISBadgeProps {
  classification: EISClassification;
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

// ============================================
// CONSTANTS
// ============================================
const COLORS = {
  healthy: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  neutral: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400'
  },
  problematic: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400'
  },
  toxic: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400'
  },
  unknown: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400'
  }
};

const LABELS = {
  healthy: 'Healthy',
  neutral: 'Neutral',
  problematic: 'Problematic',
  toxic: 'Toxic',
  unknown: 'Sin datos'
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

// ============================================
// COMPONENT
// ============================================
const EISBadge = memo(function EISBadge({
  classification,
  score,
  size = 'md',
  showScore = false
}: EISBadgeProps) {
  
  const cls = classification || 'unknown';
  const colors = COLORS[cls];
  const label = LABELS[cls];
  const sizeClass = SIZE_CLASSES[size];
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-light
        ${colors.bg} ${colors.border} ${colors.text} border
        ${sizeClass}
      `}
    >
      {/* Dot indicator */}
      <span className={`h-1.5 w-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
      
      {/* Label */}
      <span className="tracking-wide">
        {label}
      </span>
      
      {/* Score (opcional) */}
      {showScore && score !== null && score !== undefined && (
        <span className="font-medium ml-0.5">
          {Math.round(score)}
        </span>
      )}
    </span>
  );
});

EISBadge.displayName = 'EISBadge';

export default EISBadge;