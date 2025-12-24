// ============================================================================
// TIPOS BENCHMARK SYSTEM v2.0
// src/types/benchmark.ts
// ============================================================================
//
// Tipos centralizados para el sistema de benchmark cross-producto.
// Soporta: onboarding, exit, nps, pulse, experience.
//
// MIGRADO DESDE: src/types/onboarding.ts (sección BENCHMARK SYSTEM)
// AGREGADO: InsightItem, InsightContext, MetricType configs
//
// ============================================================================

// ============================================================================
// INSIGHT TYPES
// ============================================================================

/**
 * Item de insight generado por InsightEngine
 */
export interface InsightItem {
  type: 'positive' | 'neutral' | 'improvement' | 'critical';
  title: string;
  description: string;
  priority: number;       // 1-10 (mayor = más importante)
  action?: string | null; // Recomendación accionable
}

/**
 * Contexto para evaluación de reglas de InsightEngine
 */
export interface InsightContext {
  // Identificación
  metricType: string;
  entityName: string;
  entityType: 'department' | 'company' | 'team';
  
  // Scores
  entityScore: number;
  benchmarkAvg: number;
  benchmarkMedian: number;
  
  // Comparación calculada
  difference: number;        // entityScore - benchmarkAvg
  percentageGap: number;     // (difference / benchmarkAvg) * 100
  percentileRank: number;    // 15, 35, 65, 85, 95
  status: 'excellent' | 'above' | 'at' | 'below' | 'critical';
  
  // Metadata benchmark
  sampleSize: number;
  companyCount: number;
  category: string;          // standardCategory usado
  country: string;
  industry: string;
  
  // Nivel de especificidad alcanzado en cascada
  specificityLevel: 1 | 2 | 3 | 4;
}

// ============================================================================
// BENCHMARK DATA TYPES
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
  // Identificación
  metricType: string;            // 'onboarding_exo', 'exit_retention_risk', etc.
  
  // Segmentación usada
  country: string;               // 'CL', 'AR', 'ALL'
  industry: string;              // 'tecnologia', 'retail', 'ALL'
  companySizeRange: string;      // '51-200', '201-1000', 'ALL'
  category: string;              // standardCategory: 'personas', 'tecnologia', 'ALL'
  dimension: string;             // 'GLOBAL' (futuro: 'GENDER', 'GENERATION')
  segment: string;               // 'ALL' (futuro: 'MALE', 'FEMALE', 'GEN_Z')
  
  // Estadísticas
  avgScore: number;              // Promedio ponderado mercado
  medianScore: number;           // Mediana (P50)
  percentiles: BenchmarkPercentiles;
  stdDeviation: number;
  
  // Metadata
  sampleSize: number;            // # departamentos/entidades
  companyCount: number;          // # empresas
  period: string;                // 'YYYY-MM'
  lastUpdated: string;           // ISO timestamp
  
  // Nivel de especificidad alcanzado (1=más específico, 4=más general)
  specificityLevel?: 1 | 2 | 3 | 4;
}

/**
 * Comparación entidad vs benchmark
 */
export interface BenchmarkComparison {
  // Entidad comparada
  entityName: string;
  entityScore: number;
  
  // Backward compatibility aliases
  departmentName?: string;       // Alias de entityName
  departmentScore?: number;      // Alias de entityScore
  
  // Benchmark usado
  marketAverage: number;
  
  // Cálculos
  difference: number;            // entityScore - marketAverage
  percentageGap: number;         // (difference / marketAverage) * 100
  percentileRank: number;        // 15, 35, 65, 85, 95
  
  // Status
  status: 'excellent' | 'above' | 'at' | 'below' | 'critical';
  message: string;               // Mensaje interpretativo
}

/**
 * Response completo de benchmark con insights
 */
export interface BenchmarkResponseWithInsights {
  benchmark: BenchmarkData | null;
  comparison: BenchmarkComparison | null;
  insights: InsightItem[];
}

/**
 * Response de benchmark (sin insights - compatibilidad)
 */
export interface BenchmarkResponse {
  benchmark: BenchmarkData | null;
  comparison: BenchmarkComparison | null;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type del hook useBenchmark
 */
export interface UseBenchmarkReturn {
  data: BenchmarkResponseWithInsights | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Opciones para useBenchmark
 */
export interface UseBenchmarkOptions {
  dimension?: string;
  segment?: string;
  country?: string;
  industry?: string;
  companySizeRange?: string;
  enabled?: boolean;
  includeInsights?: boolean;  // Default: true
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Query params para GET /api/benchmarks
 */
export interface BenchmarkQueryParams {
  metricType: string;           // Requerido
  standardCategory: string;     // Requerido
  dimension?: string;           // Default: 'GLOBAL'
  departmentId?: string;        // Para calcular comparación
  country?: string;             // Sobrescribe country del account
  includeInsights?: boolean;    // Default: true
}

/**
 * Response de API /api/benchmarks
 */
export interface BenchmarkAPIResponse {
  success: boolean;
  message?: string;
  data?: BenchmarkResponseWithInsights;
}

// ============================================================================
// METRIC TYPES (Productos soportados)
// ============================================================================

/**
 * Tipos de métricas soportadas por el sistema de benchmark
 */
export type MetricType = 
  | 'onboarding_exo'          // EXO Score de Onboarding
  | 'exit_retention_risk'     // Riesgo de retención (Exit Intelligence)
  | 'nps_score'               // Net Promoter Score
  | 'pulse_climate'           // Clima organizacional (Pulso)
  | 'experience_satisfaction' // Satisfacción experiencia (Experiencia Full)
  ;

/**
 * Configuración por tipo de métrica
 */
export interface MetricTypeConfig {
  metricType: MetricType;
  label: string;
  description: string;
  unit: string;
  higherIsBetter: boolean;
  thresholds: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

/**
 * Configuraciones predefinidas por producto
 */
export const METRIC_CONFIGS: Record<MetricType, MetricTypeConfig> = {
  onboarding_exo: {
    metricType: 'onboarding_exo',
    label: 'EXO Score',
    description: 'Índice de Experiencia de Onboarding',
    unit: 'pts',
    higherIsBetter: true,
    thresholds: { excellent: 80, good: 65, average: 50, poor: 35 }
  },
  exit_retention_risk: {
    metricType: 'exit_retention_risk',
    label: 'Índice de Riesgo',
    description: 'Riesgo de Retención',
    unit: '%',
    higherIsBetter: false, // Menor es mejor
    thresholds: { excellent: 20, good: 35, average: 50, poor: 65 }
  },
  nps_score: {
    metricType: 'nps_score',
    label: 'eNPS',
    description: 'Employee Net Promoter Score',
    unit: '',
    higherIsBetter: true,
    thresholds: { excellent: 50, good: 20, average: 0, poor: -20 }
  },
  pulse_climate: {
    metricType: 'pulse_climate',
    label: 'Pulso Clima',
    description: 'Índice de Clima Organizacional',
    unit: '%',
    higherIsBetter: true,
    thresholds: { excellent: 80, good: 65, average: 50, poor: 35 }
  },
  experience_satisfaction: {
    metricType: 'experience_satisfaction',
    label: 'Satisfacción',
    description: 'Satisfacción de Experiencia Empleado',
    unit: '%',
    higherIsBetter: true,
    thresholds: { excellent: 85, good: 70, average: 55, poor: 40 }
  }
};

// ============================================================================
// UI HELPER CONSTANTS
// ============================================================================

/**
 * Status de comparación con colores (Design System FocalizaHR)
 */
export const STATUS_COLORS: Record<BenchmarkComparison['status'], string> = {
  excellent: '#10B981', // Green
  above: '#22D3EE',     // Cyan (corporativo)
  at: '#F59E0B',        // Yellow
  below: '#F97316',     // Orange
  critical: '#EF4444'   // Red
};

/**
 * Status de comparación con labels
 */
export const STATUS_LABELS: Record<BenchmarkComparison['status'], string> = {
  excellent: 'Excelente',
  above: 'Sobre promedio',
  at: 'En línea',
  below: 'Bajo promedio',
  critical: 'Crítico'
};

/**
 * Status de insight con colores
 */
export const INSIGHT_TYPE_COLORS: Record<InsightItem['type'], string> = {
  positive: '#10B981',    // Green
  neutral: '#22D3EE',     // Cyan
  improvement: '#F59E0B', // Yellow
  critical: '#EF4444'     // Red
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard para verificar si response tiene insights
 */
export function hasInsights(
  response: BenchmarkResponse | BenchmarkResponseWithInsights
): response is BenchmarkResponseWithInsights {
  return 'insights' in response && Array.isArray(response.insights);
}

/**
 * Type guard para verificar status válido
 */
export function isValidStatus(status: string): status is BenchmarkComparison['status'] {
  return ['excellent', 'above', 'at', 'below', 'critical'].includes(status);
}

/**
 * Type guard para verificar metricType válido
 */
export function isValidMetricType(type: string): type is MetricType {
  return Object.keys(METRIC_CONFIGS).includes(type);
}