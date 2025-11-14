// src/types/onboarding.ts - v3.2.7
/**
 * ============================================
 * TYPES ONBOARDING - FUENTE ÚNICA DE VERDAD
 * Alineado con BACKEND_ONBOARDING_API_DOCS.md v3.2.5
 * ============================================
 * 
 * PROPÓSITO:
 * Centralizar todas las interfaces TypeScript del sistema Onboarding
 * para evitar duplicación y mantener sincronía con backend.
 * 
 * CONSUMIDO POR:
 * - src/hooks/useOnboardingMetrics.ts
 * - src/app/dashboard/onboarding/page.tsx
 * - src/components/onboarding/*
 * 
 * @version 3.2.7
 * @date November 2025
 */

// ============================================================================
// MÉTRICAS INDIVIDUALES (Departamento específico)
// ============================================================================

/**
 * Interfaz completa de métricas de onboarding
 * Refleja modelo Prisma DepartmentOnboardingInsight
 */
export interface OnboardingMetrics {
  // IDs y período
  id: string
  accountId: string
  departmentId: string
  periodStart: string  // ISO date string
  periodEnd: string    // ISO date string
  
  // ========================================
  // MÉTRICAS BASE (5)
  // ========================================
  totalJourneys: number
  activeJourneys: number
  completedJourneys: number
  atRiskJourneys: number
  abandonedJourneys: number
  
  // ========================================
  // SCORES 4C (5)
  // ========================================
  avgComplianceScore: number | null      // Día 1 - Compliance
  avgClarificationScore: number | null   // Día 7 - Clarification
  avgCultureScore: number | null         // Día 30 - Culture
  avgConnectionScore: number | null      // Día 90 - Connection
  avgEXOScore: number | null             // Score global experiencia
  exoScoreTrend: number | null           // Tendencia vs período anterior
  
  // ========================================
  // ALERTAS (3)
  // ========================================
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  
  // ========================================
  // DEMOGRAFÍA (3)
  // ========================================
  avgAge: number | null
  avgSeniority: number | null
  genderDistribution: Record<string, number> | null
  
  // ========================================
  // INSIGHTS (2)
  // ========================================
  topIssues: Array<{
    issue: string
    count: number
  }> | null
  recommendations: string[] | null
  
  // ========================================
  // TIMESTAMPS (2)
  // ========================================
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
  
  // ========================================
  // RELACIÓN DEPARTMENT (Incluida por API)
  // ========================================
  department?: {
    id: string
    displayName: string
    standardCategory: string
  }
}

// ============================================================================
// DASHBOARD AGREGADO (Vista global)
// ============================================================================

/**
 * Interface para respuesta agregada del dashboard
 * v3.2.5 - Nueva estructura con agregaciones globales
 * 
 * ⚠️ CRÍTICO: La propiedad se llama `global`, NO `globalMetrics`
 * (según documentación backend BACKEND_ONBOARDING_API_DOCS.md)
 */
export interface OnboardingDashboardData {
  global: {  // ⚠️ IMPORTANTE: Es "global", no "globalMetrics"
    avgEXOScore: number | null
    totalActiveJourneys: number
    criticalAlerts: number
    period: string
    exoScoreTrend: number | null
  }
  topDepartments: Array<{
    name: string
    avgEXOScore: number
    activeJourneys: number
  }>
  bottomDepartments: Array<{
    name: string
    avgEXOScore: number
    atRiskCount: number
  }>
  insights: {
    topIssues: Array<{ issue: string; count: number }>
    recommendations: string[]
  }
  demographics: {
    byGeneration: Array<{ 
      generation: string
      count: number
      avgEXOScore: number
      atRiskRate: number 
    }>
    byGender: Array<{ 
      gender: string
      count: number
      avgEXOScore: number 
    }>
    bySeniority: Array<{ 
      range: string
      count: number
      avgEXOScore: number 
    }>
  }
  departments: OnboardingMetrics[] // Array original para drill-down
}

// ============================================================================
// TIMELINE 4C BAUER
// ============================================================================

/**
 * Interface para timeline 4C Bauer stages
 * Usado en componente OnboardingTimeline
 */
export interface TimelineStage {
  day: number           // 1, 7, 30, 90
  label: string         // 'Compliance', 'Clarificación', etc.
  score: number | null  // Score convertido a 0-100
  alerts: number        // Conteo de alertas en este stage
  color: string         // Color hex según score
}

// ============================================================================
// RETURN TYPES (Hooks)
// ============================================================================

/**
 * Return type del hook useOnboardingMetrics
 * v3.2.7 - Agregado timelineStages
 */
export interface UseOnboardingMetricsReturn {
  data: OnboardingMetrics | OnboardingDashboardData | null
  loading: boolean
  error: string | null
  refetch: () => void
  timelineStages: TimelineStage[]
}

// ============================================================================
// TYPE GUARDS (Utilidades)
// ============================================================================

/**
 * Type guard para verificar si data es OnboardingDashboardData
 * Útil para discriminar entre dashboard global y vista departamental
 */
export function isGlobalDashboard(
  data: OnboardingMetrics | OnboardingDashboardData | null
): data is OnboardingDashboardData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'global' in data &&
    'topDepartments' in data
  )
}

/**
 * Type guard para verificar si data es OnboardingMetrics individual
 */
export function isDepartmentMetrics(
  data: OnboardingMetrics | OnboardingDashboardData | null
): data is OnboardingMetrics {
  return (
    data !== null &&
    typeof data === 'object' &&
    'departmentId' in data &&
    !('global' in data)
  )
}