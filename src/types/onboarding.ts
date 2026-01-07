// src/types/onboarding.ts - v3.2.8 MEJORADO
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
 * @version 3.2.8 - REFACTOR: Interfaces extraídas para mejor legibilidad
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
    standardCategory: string              // ← SIN CAMBIO
    // Campos jerárquicos (opcionales, incluidos por backend)
    level?: number                        // 2 = gerencia, 3 = departamento
    parentId?: string | null              // ID de gerencia padre
    unitType?: string                     // 'gerencia' | 'departamento'
    parent?: {                            // Relación al padre (si se incluye)
      id: string
      displayName: string
      level?: number
    } | null
  }
}

// ============================================================================
// COMPLIANCE EFFICIENCY SYSTEM (Interfaces Extraídas)
// ============================================================================

/**
 * Detalle individual de empleado en auditoría compliance
 * Usado en ComplianceEfficiencyMatrix component
 */
export interface ComplianceEmployeeDetail {
  id: string
  fullName: string
  currentStage: number
  daysSinceHire: number
  complianceStatus: 'completed' | 'overdue' | 'pending'
  daysOverdue?: number
  stages?: Array<{                           // ← AGREGAR ESTO
    stage: 1 | 2 | 3 | 4
    label: 'D1' | 'D7' | 'D30' | 'D90'
    status: 'responded' | 'overdue' | 'not_sent'
  }>
}

/**
 * Métricas de compliance por departamento
 * Retornado por OnboardingAggregationService.getComplianceEfficiency()
 */
export interface ComplianceEfficiencyData {
  departmentId: string
  departmentName: string
  compliance: number
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral'
  responded: number
  overdue: number
  pending: number
  employeeDetail: ComplianceEmployeeDetail[]
}

// ============================================================================
// DASHBOARD AGREGADO (Vista global)
// ============================================================================

/**
 * Interface para respuesta agregada del dashboard
 * v3.2.8 - Refactorizada con interfaces extraídas
 * 
 * ⚠️ CRÍTICO: La propiedad se llama `global`, NO `globalMetrics`
 * (según documentación backend BACKEND_ONBOARDING_API_DOCS.md)
 */
export interface OnboardingDashboardData {
  global: {
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
  departments: OnboardingMetrics[]
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
      // ✅ AGREGAR ESTOS 3:
      level?: number
      parentId?: string | null
      unitType?: string
    }>
    
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
  
  // ✅ REFACTORIZADO: Una línea limpia en lugar de 25 líneas anidadas
  complianceEfficiency: ComplianceEfficiencyData[]
  
  // ✅ METADATA RBAC (agregado para scope jerárquico)
  meta?: {
    canDrillDown: string[]           
    scope: 'company' | 'filtered'    
    userRole: string                 
    userDepartmentId: string | null  
  }
  
  // ✅ LENTE 3: Métricas en vivo
  live?: {
    period: string
    avgEXOScore: number | null
    totalJourneys: number
    activeJourneys: number
    completedJourneys: number
    atRiskJourneys: number
    criticalAlerts: number
    daysElapsed: number
    daysInMonth: number
    isPartial: boolean
  }
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
 * v3.2.8 - Agregado timelineStages
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
// PIPELINE KANBAN - TYPES
// ============================================================================

// REEMPLAZAR CON:
export interface JourneyDepartment {
  id: string;
  displayName: string;
  standardCategory: string | null;
  accumulatedExoScore: number | null;
  // Campos jerárquicos
  level?: number;
  parentId?: string | null;
  unitType?: string;
  parent?: {
    id: string;
    displayName: string;
    level?: number;
  } | null;
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
// ============================================================================
// ALERT STATISTICS (V2.0 - Trend + History)
// ============================================================================

/**
 * Dirección de tendencia de alertas
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Tendencia mensual de alertas (actual vs anterior)
 */
export interface AlertTrend {
  value: number;                    // Porcentaje de cambio: +12, -8, 0
  direction: TrendDirection;        // "up" | "down" | "stable"
  absolute: number;                 // Cambio absoluto: +5, -3
  current: number;                  // Total mes actual: 45
  previous: number;                 // Total mes anterior: 40
  comparison: string;               // "12% más que 2025-10"
}

/**
 * Punto histórico en serie temporal (1 mes)
 */
export interface AlertHistoryPoint {
  period: string;                   // "2025-11"
  totalAlerts: number;              // 45
  managedCount: number;             // 30
  ignoredCount: number;             // 15
  managedRetentionRate: number;     // 0.75
  retentionDelta: number;           // 55
}

/**
 * Respuesta completa de getAlertStatistics()
 * Incluye contadores actuales + trend + historia 12 meses
 */
export interface AlertStatistics {
  // Contadores por estado
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  dismissed: number;
  
  // Contadores por severidad
  critical: number;
  high: number;
  medium: number;
  low: number;
  
  // Contadores por SLA
  breached: number;
  atRisk: number;
  onTime: number;
  
  // 🆕 V2.0: Tendencia + Historia
  trend: AlertTrend | null;         // null si < 2 meses de data
  history: AlertHistoryPoint[];     // Array ordenado: [más antiguo → más reciente]
}

// ============================================================================
// RESOLUTIONMODAL
// ============================================================================
export interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (notes: string) => Promise<void>;
  alertType: string;
  employeeName: string;
  businessCase: any;
}
// ============================================================================
// PASO 1A: AGREGAR AL FINAL DE src/types/onboarding.ts
// ============================================================================
// Acción: Copiar este bloque AL FINAL del archivo existente
// NO reemplazar nada, solo agregar después de la última línea
// ============================================================================

/**
 * Detalle de stage individual para timeline visual
 * Colores UI: 🔵 cyan (responded), 🟠 amber (overdue), ⚫ slate (not_sent)
 */
export interface StageDetail {
  stage: 1 | 2 | 3 | 4
  label: 'D1' | 'D7' | 'D30' | 'D90'
  status: 'responded' | 'overdue' | 'not_sent'
}

/**
 * Extensión de ComplianceEfficiencyData con métricas V2
 * Extiende la interface existente, todos campos nuevos son OPCIONALES
 * para backward compatibility
 */
export interface ComplianceEfficiencyDataV2 extends ComplianceEfficiencyData {
  // ═══════════════════════════════════════════════════════════════════
  // CAMPOS JERÁRQUICOS (opcionales)
  // ═══════════════════════════════════════════════════════════════════
  level?: number                              // 2=gerencia, 3=departamento
  parentId?: string | null                    // ID gerencia padre
  parentName?: string | null                  // ← AGREGAR ESTA LÍNEA - Nombre gerencia padre
  unitType?: 'gerencia' | 'departamento'
  
  // ═══════════════════════════════════════════════════════════════════
  // MÉTRICAS DE PROCESO (opcionales)
  // ═══════════════════════════════════════════════════════════════════
  participation?: number                      // (respondidas/enviadas) * 100
  efficiency?: number                         // (a tiempo/respondidas) * 100
  
  // ═══════════════════════════════════════════════════════════════════
  // SCORES 4C (opcionales) - Escala 0-5, frontend convierte a 0-100
  // ═══════════════════════════════════════════════════════════════════
  avgComplianceScore?: number | null
  avgClarificationScore?: number | null
  avgCultureScore?: number | null
  avgConnectionScore?: number | null
  avgEXOScore?: number | null                 // Ya en 0-100
  
  // ═══════════════════════════════════════════════════════════════════
  // NPS (opcional)
  // ═══════════════════════════════════════════════════════════════════
  npsScore?: number | null                    // -100 a +100
  
  // ═══════════════════════════════════════════════════════════════════
  // CONTEOS ADICIONALES (opcionales)
  // ═══════════════════════════════════════════════════════════════════
  totalJourneys?: number
  atRiskJourneys?: number
  alertsPercentage?: number                   // (atRisk/total) * 100
}

/**
 * Extensión de ComplianceEmployeeDetail con timeline de stages
 */
export interface ComplianceEmployeeDetailV2 extends ComplianceEmployeeDetail {
  stages?: StageDetail[]
}

/**
 * Helper para calcular dimensión 4C más débil
 */
export interface WeakestDimension {
  name: 'Compliance' | 'Clarificación' | 'Cultura' | 'Conexión'
  score: number                               // 0-100 normalizado
  day: 1 | 7 | 30 | 90
}

/**
 * Narrativas 4C para UI - Constantes
 */
export const NARRATIVES_4C: Record<string, { desc: string; impact: string }> = {
  Compliance: {
    desc: "Todo listo para trabajar día 1: equipo, accesos, bienvenida",
    impact: "Score <50 → 2.3x más renuncia en primeros 30 días"
  },
  Clarificación: {
    desc: "Entiende su rol, responsabilidades y expectativas",
    impact: "45% renuncias citan 'rol diferente al esperado'"
  },
  Cultura: {
    desc: "Se siente parte del equipo y conectado con valores",
    impact: "Desajuste cultural → 3x rotación año 1"
  },
  Conexión: {
    desc: "Ve futuro en la organización, tiene relaciones significativas",
    impact: "Score <60 → 78% probabilidad renuncia en 6 meses"
  }
}