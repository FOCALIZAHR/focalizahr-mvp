// src/components/shared/intelligence/SeverityBadge.tsx

'use client';

import { memo } from 'react';
import { AlertTriangle, AlertCircle, Info, Flame } from 'lucide-react';
import { AlertSeverity, SEVERITY_COLORS, getSeverityLabel } from './types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT: SeverityBadge
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Badge reutilizable para mostrar severidad de alertas.
 * Funciona para tanto Onboarding como Exit Intelligence.
 * 
 * Usa clases del Design System FocalizaHR (.fhr-badge-*)
 * 
 * @example
 * ```tsx
 * <SeverityBadge severity="critical" />
 * <SeverityBadge severity="high" size="lg" showIcon />
 * <SeverityBadge severity="medium" variant="dot" />
 * ```
 */

// ============================================
// TYPES
// ============================================

interface SeverityBadgeProps {
  severity: AlertSeverity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'badge' | 'dot' | 'pill';
  className?: string;
  animated?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const ICONS: Record<AlertSeverity, React.ElementType> = {
  critical: Flame,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info
};

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-0.5 text-[10px]',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
    pill: 'px-2 py-0.5 text-[10px]'
  },
  md: {
    badge: 'px-2.5 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
    pill: 'px-3 py-1 text-xs'
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
    pill: 'px-4 py-1.5 text-sm'
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SeverityBadge = memo(function SeverityBadge({
  severity,
  size = 'md',
  showIcon = true,
  showLabel = true,
  variant = 'badge',
  className = '',
  animated = false
}: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  const label = getSeverityLabel(severity);
  const Icon = ICONS[severity];
  const sizeClasses = SIZE_CLASSES[size];
  
  // Variante DOT: solo muestra un punto de color
  if (variant === 'dot') {
    return (
      <span 
        className={`
          inline-block rounded-full ${colors.dot} ${sizeClasses.dot}
          ${animated && severity === 'critical' ? 'animate-pulse' : ''}
          ${className}
        `}
        title={label}
      />
    );
  }
  
  // Variante PILL: más compacta, sin borde
  if (variant === 'pill') {
    return (
      <span
        className={`
          inline-flex items-center gap-1 rounded-full font-medium
          ${colors.bg} ${colors.text}
          ${sizeClasses.pill}
          ${animated && severity === 'critical' ? 'animate-pulse' : ''}
          ${className}
        `}
      >
        {showIcon && <Icon className={sizeClasses.icon} />}
        {showLabel && <span>{label}</span>}
      </span>
    );
  }
  
  // Variante BADGE (default): usa clases .fhr-badge-*
  return (
    <span
      className={`
        fhr-badge ${colors.badgeClass}
        inline-flex items-center gap-1.5 font-medium
        ${sizeClasses.badge}
        ${animated && severity === 'critical' ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {showIcon && <Icon className={sizeClasses.icon} />}
      {showLabel && <span>{label}</span>}
    </span>
  );
});

// ============================================
// VARIANT: SeverityDot
// ============================================

/**
 * Componente simplificado para uso en tablas/listas compactas.
 */
export const SeverityDot = memo(function SeverityDot({
  severity,
  size = 'md',
  animated = false,
  className = ''
}: Pick<SeverityBadgeProps, 'severity' | 'size' | 'animated' | 'className'>) {
  return (
    <SeverityBadge
      severity={severity}
      size={size}
      variant="dot"
      showIcon={false}
      showLabel={false}
      animated={animated}
      className={className}
    />
  );
});

// ============================================
// HELPER EXPORT
// ============================================

/**
 * Exporta configuración para uso en componentes custom.
 */
export function getSeverityConfig(severity: AlertSeverity) {
  return {
    colors: SEVERITY_COLORS[severity],
    label: getSeverityLabel(severity),
    Icon: ICONS[severity]
  };
}

// ============================================
// DEFAULT EXPORT (para compatibilidad)
// ============================================

export default SeverityBadge;