// src/components/shared/intelligence/StatusBadge.tsx

'use client';

import { memo } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { AlertStatus, STATUS_COLORS, getStatusLabel } from './types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT: StatusBadge
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Badge reutilizable para mostrar estado de alertas.
 * Funciona para tanto Onboarding como Exit Intelligence.
 * 
 * Estados:
 * - pending: Amarillo, ícono reloj
 * - acknowledged: Azul, ícono ojo (HR vio la alerta)
 * - resolved: Verde, ícono check
 * - dismissed: Gris, ícono X
 * 
 * Usa clases del Design System FocalizaHR (.fhr-badge-*)
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" />
 * <StatusBadge status="resolved" size="lg" showIcon />
 * <StatusBadge status="acknowledged" variant="outline" />
 * ```
 */

// ============================================
// TYPES
// ============================================

interface StatusBadgeProps {
  status: AlertStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'badge' | 'outline' | 'ghost';
  className?: string;
  loading?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const ICONS: Record<AlertStatus, React.ElementType> = {
  pending: Clock,
  acknowledged: Eye,
  resolved: CheckCircle,
  dismissed: XCircle
};

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-0.5 text-[10px]',
    icon: 'w-3 h-3',
    outline: 'px-2 py-0.5 text-[10px] border',
    ghost: 'px-1.5 py-0.5 text-[10px]'
  },
  md: {
    badge: 'px-2.5 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    outline: 'px-2.5 py-1 text-xs border',
    ghost: 'px-2 py-0.5 text-xs'
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    outline: 'px-3 py-1.5 text-sm border',
    ghost: 'px-2.5 py-1 text-sm'
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const StatusBadge = memo(function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  variant = 'badge',
  className = '',
  loading = false
}: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = colors.label;
  const Icon = loading ? Loader2 : ICONS[status];
  const sizeClasses = SIZE_CLASSES[size];
  
  // Variante OUTLINE: borde sin fondo
  if (variant === 'outline') {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${colors.border} ${colors.text} bg-transparent
          ${sizeClasses.outline}
          ${className}
        `}
      >
        {showIcon && (
          <Icon 
            className={`${sizeClasses.icon} ${loading ? 'animate-spin' : ''}`} 
          />
        )}
        {showLabel && <span>{label}</span>}
      </span>
    );
  }
  
  // Variante GHOST: minimalista, solo texto
  if (variant === 'ghost') {
    return (
      <span
        className={`
          inline-flex items-center gap-1 font-medium
          ${colors.text}
          ${sizeClasses.ghost}
          ${className}
        `}
      >
        {showIcon && (
          <Icon 
            className={`${sizeClasses.icon} ${loading ? 'animate-spin' : ''}`} 
          />
        )}
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
        ${className}
      `}
    >
      {showIcon && (
        <Icon 
          className={`${sizeClasses.icon} ${loading ? 'animate-spin' : ''}`} 
        />
      )}
      {showLabel && <span>{label}</span>}
    </span>
  );
});

// ============================================
// VARIANT: StatusIcon
// ============================================

/**
 * Solo muestra el ícono del estado, útil en tablas compactas.
 */
export const StatusIcon = memo(function StatusIcon({
  status,
  size = 'md',
  className = ''
}: Pick<StatusBadgeProps, 'status' | 'size' | 'className'>) {
  const colors = STATUS_COLORS[status];
  const Icon = ICONS[status];
  const sizeClasses = SIZE_CLASSES[size];
  
  return (
    <span 
      className={`${colors.text} ${className}`}
      title={colors.label}
    >
      <Icon className={sizeClasses.icon} />
    </span>
  );
});

// ============================================
// VARIANT: StatusIndicator
// ============================================

/**
 * Indicador visual compacto con punto de color.
 */
export const StatusIndicator = memo(function StatusIndicator({
  status,
  showLabel = true,
  className = ''
}: Pick<StatusBadgeProps, 'status' | 'showLabel' | 'className'>) {
  const colors = STATUS_COLORS[status];
  
  // Mapeo de colores a dots
  const dotColors: Record<AlertStatus, string> = {
    pending: 'bg-amber-400',
    acknowledged: 'bg-blue-400',
    resolved: 'bg-emerald-400',
    dismissed: 'bg-slate-400'
  };
  
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span 
        className={`w-2 h-2 rounded-full ${dotColors[status]} ${status === 'pending' ? 'animate-pulse' : ''}`}
      />
      {showLabel && (
        <span className={`text-xs font-medium ${colors.text}`}>
          {colors.label}
        </span>
      )}
    </span>
  );
});

// ============================================
// HELPERS
// ============================================

/**
 * Exporta configuración para uso en componentes custom.
 */
export function getStatusConfig(status: AlertStatus) {
  return {
    colors: STATUS_COLORS[status],
    label: STATUS_COLORS[status].label,
    Icon: ICONS[status]
  };
}

/**
 * Mapeo de transiciones de estado válidas.
 */
export const STATUS_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  pending: ['acknowledged', 'resolved', 'dismissed'],
  acknowledged: ['resolved', 'dismissed'],
  resolved: [], // Final state
  dismissed: [] // Final state
};

export function canTransitionTo(
  currentStatus: AlertStatus, 
  targetStatus: AlertStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
}

// ============================================
// DEFAULT EXPORT (para compatibilidad)
// ============================================

export default StatusBadge;