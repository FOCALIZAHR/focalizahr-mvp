// src/components/shared/intelligence/index.ts

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHARED INTELLIGENCE COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Componentes bimodales para Onboarding & Exit Intelligence.
 * Exporta todo desde un solo punto para imports limpios.
 * 
 * @example
 * ```tsx
 * import { 
 *   SeverityBadge, 
 *   StatusBadge, 
 *   SEVERITY_COLORS,
 *   type AlertSeverity 
 * } from '@/components/shared/intelligence';
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
export type {
  ProductType,
  AlertSeverity,
  AlertStatus,
  SLAStatus,
  AlertBase,
  MetricsCardData,
  DepartmentMetricsBase
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & COLORS
// ═══════════════════════════════════════════════════════════════════════════
export {
  SEVERITY_COLORS,
  STATUS_COLORS,
  SLA_COLORS,
  PRODUCT_LABELS
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
export {
  getSeverityLabel,
  getStatusLabel,
  calculateSLARemaining
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS: SEVERITY
// ═══════════════════════════════════════════════════════════════════════════
export { 
  SeverityBadge,
  SeverityDot,
  getSeverityConfig
} from './SeverityBadge';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS: STATUS
// ═══════════════════════════════════════════════════════════════════════════
export { 
  StatusBadge,
  StatusIcon,
  StatusIndicator,
  getStatusConfig,
  STATUS_TRANSITIONS,
  canTransitionTo
} from './StatusBadge';