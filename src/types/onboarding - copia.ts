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
  // 🌟 AGREGAR ESTO AQUÍ:
 accumulated: {
    globalExoScore: number | null
    totalJourneys: number
    periodCount: number
    lastUpdated: Date | null
    departments: Array<{
      id: string
      displayName: string
      standardCategory: string | null
      accumulatedExoScore: number
      accumulatedExoJourneys: number
      accumulatedPeriodCount: number
      accumulatedLastUpdated: Date | null
    }>
    
    // 🌟 NUEVO: Balance Departamental
    departmentImpact: {
      topInfluencer: {
        departmentId: string
        departmentName: string
        score: number
        journeys: number
        contribution: number
      }
      bottomImpact: {
        departmentId: string
        departmentName: string
        score: number
        journeys: number
        contribution: number
      }
    } | null
  } 
  // ============================================================================
// ACTUALIZACIÓN TIPO TYPESCRIPT
// Archivo: src/types/onboarding.ts
// Ubicación en archivo: Dentro de OnboardingDashboardData interface
// ============================================================================

// ✅ REEMPLAZAR ESTE BLOQUE (líneas ~190-205):

complianceEfficiency: Array<{
  departmentId: string
  departmentName: string
  compliance: number
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral'
  responded: number
  overdue: number
  pending: number
  employeeDetail: Array<{  // ✅ CAMBIO: De stuckEmployees a employeeDetail
    id: string
    fullName: string
    currentStage: number
    daysSinceHire: number
    complianceStatus: 'completed' | 'overdue' | 'pending'  // ✅ NUEVO
    daysOverdue?: number  // ✅ NUEVO
  }>
}>
}    // ← Cierre de OnboardingDashboardData

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

// ============================================================================
// BENCHMARK SYSTEM (v1.0)
// ============================================================================

/**
 * Percentiles de benchmark
 */
export interface BenchmarkPercentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

/**
 * Datos de benchmark de mercado
 * Retornado por /api/benchmarks
 */
export interface BenchmarkData {
  metricType: string;            // 'onboarding_exo'
  country: string;               // 'CL', 'AR', 'ALL'
  industry: string;              // 'tecnologia', 'retail', 'ALL'
  companySizeRange: string;      // '51-200', '201-1000', 'ALL'
  category: string;              // 'personas', 'tecnologia', etc.
  dimension: string;             // 'GLOBAL'
  segment: string;               // 'ALL'
  avgScore: number;              // Promedio mercado
  medianScore: number;           // Mediana
  percentiles: BenchmarkPercentiles;
  stdDeviation: number;
  sampleSize: number;            // # departamentos
  companyCount: number;          // # empresas
  period: string;                // 'YYYY-MM'
  lastUpdated: string;           // ISO timestamp
}

/**
 * Comparación departamento vs benchmark
 */
export interface BenchmarkComparison {
  departmentScore: number;
  difference: number;
  percentageGap: number;
  percentileRank: number;
  status: 'above' | 'at' | 'below';
  message: string;
}

/**
 * Response completo de benchmark
 * Usado por useBenchmark hook
 */
export interface BenchmarkResponse {
  benchmark: BenchmarkData | null;
  comparison: BenchmarkComparison | null;
}

/**
 * Return type del hook useBenchmark
 */
export interface UseBenchmarkReturn {
  data: BenchmarkResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
// ============================================================================
// PIPELINE KANBAN - TYPES (Pegar al final de src/types/onboarding.ts)
// ============================================================================

export interface JourneyDepartment {
  id: string;
  displayName: string;
  standardCategory: string | null;
  accumulatedExoScore: number | null;
}

export interface JourneyAlert {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface JourneyParticipant {
  id: string;
  hasResponded: boolean;
  responseDate: string | null;
}

export interface Journey {
  id: string;
  accountId: string;
  nationalId: string;
  fullName: string;
  participantEmail: string | null;
  phoneNumber: string | null;
  departmentId: string;
  position: string | null;
  hireDate: string;
  stage1ParticipantId: string | null;
  stage2ParticipantId: string | null;
  stage3ParticipantId: string | null;
  stage4ParticipantId: string | null;
  complianceScore: number | null;
  clarificationScore: number | null;
  cultureScore: number | null;
  connectionScore: number | null;
  exoScore: number | null;
  stage1CompletedAt: string | null;
  stage2CompletedAt: string | null;
  stage3CompletedAt: string | null;
  stage4CompletedAt: string | null;
  currentStage: number;
  status: 'active' | 'completed' | 'abandoned';
  retentionRisk: 'critical' | 'high' | 'medium' | 'low' | 'pending' | null;
  createdAt: string;
  updatedAt: string;
  department: JourneyDepartment;
  alerts: JourneyAlert[];
  stage1Participant: JourneyParticipant | null;
  stage2Participant: JourneyParticipant | null;
  stage3Participant: JourneyParticipant | null;
  stage4Participant: JourneyParticipant | null;
}

export interface StageStats {
  stage0: number;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
}

export interface RiskStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  pending: number;
}

export interface JourneysStats {
  byStage: StageStats;
  byRisk: RiskStats;
  totalActive: number;
  totalCompleted: number;
  totalAbandoned: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UseOnboardingJourneysOptions {
  status?: 'active' | 'completed' | 'abandoned';
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  departmentId?: string;
  stage?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseOnboardingJourneysReturn {
  journeys: Journey[];
  journeysByStage: Map<number, Journey[]>;
  stats: JourneysStats | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}