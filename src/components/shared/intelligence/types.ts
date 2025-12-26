// src/components/shared/intelligence/types.ts

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPOS COMPARTIDOS BIMODALES - ONBOARDING & EXIT INTELLIGENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Estos tipos permiten crear componentes reutilizables que funcionan
 * tanto para Onboarding Intelligence como para Exit Intelligence.
 * 
 * Filosofía:
 * - Mismos patrones visuales, diferentes narrativas
 * - Componentes adaptan labels/colores según ProductType
 * - Facilita mantenimiento y consistencia UX
 */

import { ReactNode } from 'react';

/**
 * Tipo de producto inteligencia
 */
export type ProductType = 'onboarding' | 'exit';

/**
 * Severidades de alerta (compartidas)
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Estados de alerta (compartidos)
 */
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * Estados de SLA (compartidos)
 */
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACE: AlertBase
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Base común para alertas de ambos productos.
 * Permite crear componentes de alerta genéricos.
 */
export interface AlertBase {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  slaHours: number;
  dueDate: string;
  slaStatus: SLAStatus;
  createdAt: string;
  department: {
    id: string;
    displayName: string;
  };
  // Campos de gestión
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACE: MetricsCardData
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Datos para cards de métricas genéricas.
 * Usable en dashboards de ambos productos.
 */
export interface MetricsCardData {
  label: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
  color?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'red' | 'blue';
  icon?: ReactNode;
  description?: string;
  tooltip?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACE: DepartmentMetricsBase
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Base común para métricas departamentales.
 */
export interface DepartmentMetricsBase {
  departmentId: string;
  departmentName: string;
  standardCategory: string | null;
  pendingAlerts: number;
  criticalAlerts: number;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAPEOS DE CONFIGURACIÓN POR PRODUCTO
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Configuración de colores por severidad
 */
export const SEVERITY_COLORS: Record<AlertSeverity, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badgeClass: string;
}> = {
  critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    badgeClass: 'fhr-badge-error'
  },
  high: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    badgeClass: 'fhr-badge-warning'
  },
  medium: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
    badgeClass: 'fhr-badge-warning'
  },
  low: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
    badgeClass: 'fhr-badge-default'
  }
};

/**
 * Configuración de colores por estado
 */
export const STATUS_COLORS: Record<AlertStatus, {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  label: string;
}> = {
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badgeClass: 'fhr-badge-warning',
    label: 'Pendiente'
  },
  acknowledged: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badgeClass: 'fhr-badge-active',
    label: 'En Gestión'
  },
  resolved: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badgeClass: 'fhr-badge-success',
    label: 'Resuelta'
  },
  dismissed: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    badgeClass: 'fhr-badge-default',
    label: 'Descartada'
  }
};

/**
 * Configuración de colores por SLA
 */
export const SLA_COLORS: Record<SLAStatus, {
  bg: string;
  text: string;
  border: string;
  label: string;
  icon: 'check' | 'clock' | 'alert';
}> = {
  on_track: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'En tiempo',
    icon: 'check'
  },
  at_risk: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'En riesgo',
    icon: 'clock'
  },
  breached: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Vencido',
    icon: 'alert'
  }
};

/**
 * Labels específicos por producto
 */
export const PRODUCT_LABELS: Record<ProductType, {
  scoreLabel: string;
  scoreDescription: string;
  alertTitle: string;
  dashboardTitle: string;
}> = {
  onboarding: {
    scoreLabel: 'EXO Score',
    scoreDescription: 'Experience Onboarding Score',
    alertTitle: 'Alerta Onboarding',
    dashboardTitle: 'Onboarding Intelligence'
  },
  exit: {
    scoreLabel: 'EIS Score',
    scoreDescription: 'Exit Intelligence Score',
    alertTitle: 'Alerta Exit',
    dashboardTitle: 'Exit Intelligence'
  }
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Obtiene el label de severidad en español
 */
export function getSeverityLabel(severity: AlertSeverity): string {
  const labels: Record<AlertSeverity, string> = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  };
  return labels[severity];
}

/**
 * Obtiene el label de estado en español
 */
export function getStatusLabel(status: AlertStatus): string {
  return STATUS_COLORS[status].label;
}

/**
 * Calcula tiempo restante de SLA
 */
export function calculateSLARemaining(dueDate: string): {
  hours: number;
  isOverdue: boolean;
  label: string;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 0) {
    return {
      hours: Math.abs(diffHours),
      isOverdue: true,
      label: `Vencido hace ${Math.abs(diffHours)}h`
    };
  }
  
  if (diffHours < 24) {
    return {
      hours: diffHours,
      isOverdue: false,
      label: `${diffHours}h restantes`
    };
  }
  
  const days = Math.floor(diffHours / 24);
  return {
    hours: diffHours,
    isOverdue: false,
    label: `${days}d restantes`
  };
}