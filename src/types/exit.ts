// ═══════════════════════════════════════════════════════════════════════════
// EXIT INTELLIGENCE - TIPOS TYPESCRIPT
// ═══════════════════════════════════════════════════════════════════════════
// Archivo: src/types/exit.ts
// Fecha: Diciembre 2025
// Versión: 1.0
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Razones de salida válidas (13 opciones para análisis "Hipótesis RRHH vs Realidad")
 */
export const EXIT_REASONS = {
  MEJOR_OPORTUNIDAD: 'mejor_oportunidad',
  COMPENSACION: 'compensacion',
  CRECIMIENTO_CARRERA: 'crecimiento_carrera',
  BALANCE_VIDA_TRABAJO: 'balance_vida_trabajo',
  MAL_CLIMA: 'mal_clima',
  PROBLEMAS_LIDERAZGO: 'problemas_liderazgo',
  RELOCALIZACION: 'relocalizacion',
  MOTIVOS_PERSONALES: 'motivos_personales',
  ESTUDIOS: 'estudios',
  SALUD: 'salud',
  ABANDONO_TRABAJO: 'abandono_trabajo',
  JUBILACION: 'jubilacion',
  OTRO: 'otro'
} as const;

export type ExitReason = typeof EXIT_REASONS[keyof typeof EXIT_REASONS];

/**
 * Clasificación de talento (llenado por RRHH al registrar salida)
 */
export const TALENT_CLASSIFICATIONS = {
  KEY_TALENT: 'key_talent',
  MEETS_EXPECTATIONS: 'meets_expectations',
  POOR_FIT: 'poor_fit'
} as const;

export type TalentClassification = typeof TALENT_CLASSIFICATIONS[keyof typeof TALENT_CLASSIFICATIONS];

/**
 * Labels UX para clasificación de talento
 */
export const TALENT_CLASSIFICATION_LABELS: Record<TalentClassification, string> = {
  'key_talent': '🔴 Talento Clave / Alto Potencial',
  'meets_expectations': '🟡 Buen Desempeño / Cumple',
  'poor_fit': '🟢 Bajo Ajuste / Error de Contratación'
};

/**
 * Descripciones para UI
 */
export const TALENT_CLASSIFICATION_DESCRIPTIONS: Record<TalentClassification, string> = {
  'key_talent': 'Impacto crítico en el negocio',
  'meets_expectations': 'Cumple expectativas del rol',
  'poor_fit': 'No alcanzó el nivel esperado'
};

/**
 * Labels en español para UI
 */
export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  'mejor_oportunidad': 'Mejor oportunidad laboral',
  'compensacion': 'Compensación / Sueldo',
  'crecimiento_carrera': 'Falta de crecimiento profesional',
  'balance_vida_trabajo': 'Balance vida-trabajo',
  'mal_clima': 'Mal clima laboral',
  'problemas_liderazgo': 'Problemas con liderazgo',
  'relocalizacion': 'Relocalización geográfica',
  'motivos_personales': 'Motivos personales',
  'estudios': 'Estudios / Formación',
  'salud': 'Motivos de salud',
  'abandono_trabajo': 'Abandono de trabajo',
  'jubilacion': 'Jubilación',
  'otro': 'Otro motivo'
};

/**
 * Clasificación EIS (Exit Intelligence Score)
 * Basado en escala 0-100
 */
export const EIS_CLASSIFICATIONS = {
  HEALTHY: 'healthy',        // ≥80: Salida sana, buen embajador
  NEUTRAL: 'neutral',        // ≥60: Salida neutral, sin rencores
  PROBLEMATIC: 'problematic', // ≥40: Salida problemática, issues detectados
  TOXIC: 'toxic'             // <40: Salida tóxica, red flags múltiples
} as const;

export type EISClassification = typeof EIS_CLASSIFICATIONS[keyof typeof EIS_CLASSIFICATIONS];

/**
 * Umbrales de clasificación EIS
 */
export const EIS_THRESHOLDS = {
  HEALTHY: 80,
  NEUTRAL: 60,
  PROBLEMATIC: 40
} as const;

/**
 * Pesos de la fórmula EIS (validados científicamente)
 */
export const EIS_WEIGHTS = {
  SATISFACTION: 0.20,  // P1: 20%
  LEADERSHIP: 0.25,    // P4: 25% (predictor #1)
  DEVELOPMENT: 0.20,   // P5: 20%
  SAFETY: 0.25,        // P6: 25% (Ley Karin)
  AUTONOMY: 0.10       // P7: 10%
} as const;

/**
 * Tipos de alerta Exit
 */
export const EXIT_ALERT_TYPES = {
  LEY_KARIN: 'ley_karin',
  LIDERAZGO_CONCENTRACION: 'liderazgo_concentracion',
  NPS_CRITICO: 'nps_critico',
  TOXIC_EXIT_DETECTED: 'toxic_exit_detected',
  DEPARTMENT_EXIT_PATTERN: 'department_exit_pattern',
  ONBOARDING_EXIT_CORRELATION: 'onboarding_exit_correlation'
} as const;

export type ExitAlertType = typeof EXIT_ALERT_TYPES[keyof typeof EXIT_ALERT_TYPES];

/**
 * Severidades de alerta
 */
export const EXIT_ALERT_SEVERITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type ExitAlertSeverity = typeof EXIT_ALERT_SEVERITIES[keyof typeof EXIT_ALERT_SEVERITIES];

/**
 * Estados de alerta
 */
export const EXIT_ALERT_STATUSES = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
} as const;

export type ExitAlertStatus = typeof EXIT_ALERT_STATUSES[keyof typeof EXIT_ALERT_STATUSES];

/**
 * Estados SLA
 */
export const SLA_STATUSES = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  BREACHED: 'breached'
} as const;

export type SLAStatus = typeof SLA_STATUSES[keyof typeof SLA_STATUSES];

/**
 * Factores de salida (P2 multi-select)
 * 13 opciones validadas metodológicamente
 */
export const EXIT_FACTORS = [
  'Liderazgo de Apoyo',
  'Oportunidades de Crecimiento',
  'Flexibilidad y Equilibrio',
  'Autonomía y Confianza',
  'Reconocimiento y Valoración',
  'Compensación y Beneficios',
  'Relación con Compañeros',
  'Carga de Trabajo',
  'Claridad de Rol',
  'Herramientas y Recursos',
  'Cultura Organizacional',
  'Seguridad Laboral',
  'Ubicación/Traslado'
] as const;

export type ExitFactor = typeof EXIT_FACTORS[number];

/**
 * Tipos de período para agregación
 */
export const PERIOD_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
} as const;

export type PeriodType = typeof PERIOD_TYPES[keyof typeof PERIOD_TYPES];


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Datos para registrar una salida
 */
export interface ExitRegistrationData {
  accountId: string;
  departmentId: string;
  nationalId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  exitDate: Date;
  exitReason?: ExitReason;
  talentClassification?: TalentClassification;
}

/**
 * Resultado del registro de salida
 */
export interface ExitRegistrationResult {
  success: boolean;
  exitRecordId?: string;
  participantId?: string;
  surveyToken?: string;
  message?: string;
  error?: string;
  emailScheduledFor?: string;  // ← NUEVO: ISO date del email programado
}

/**
 * Scores extraídos de las respuestas Exit
 */
export interface ExitScores {
  satisfaction: number | null;      // P1 (1-5 → normalizado 0-100)
  factorsDetail: Record<string, number> | null;  // P3 matrix
  leadership: number | null;        // P4 (1-5 → normalizado 0-100)
  development: number | null;       // P5 (1-5 → normalizado 0-100)
  safety: number | null;            // P6 (1-5 → normalizado 0-100)
  autonomy: number | null;          // P7 (1-5 → normalizado 0-100)
  nps: number | null;               // P8 (0-10, sin normalizar)
}

/**
 * Resultado del cálculo EIS
 */
export interface EISCalculationResult {
  score: number | null;
  classification: EISClassification | null;
  factorsAvg: number | null;
  safetyScore: number | null;
  npsScore: number | null;
  breakdown: {
    satisfaction: { raw: number | null; weighted: number };
    leadership: { raw: number | null; weighted: number };
    development: { raw: number | null; weighted: number };
    safety: { raw: number | null; weighted: number };
    autonomy: { raw: number | null; weighted: number };
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES CORRELACIÓN ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resultado de búsqueda de correlación con Onboarding
 */
export interface OnboardingCorrelation {
  found: boolean;
  journeyId?: string;
  exoScore?: number | null;
  alertsCount?: number;
  ignoredAlerts?: number;
  managedAlerts?: number;
  hireDate?: Date;
  tenureMonths?: number;
  retentionRisk?: string;
}

/**
 * Análisis de correlación departamental
 */
export interface DepartmentOnboardingCorrelation {
  departmentId: string;
  departmentName: string;
  totalExits: number;
  exitsWithOnboarding: number;
  exitsWithAlerts: number;
  exitsWithIgnoredAlerts: number;
  conservationIndex: number | null;
  alertPredictionRate: number | null;
  avgOnboardingEXO: number | null;
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES P2 + P3 (CAUSAS RAÍZ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resultado del procesamiento de factores P2+P3
 */
export interface ExitFactorsResult {
  exitFactors: string[];
  exitFactorsDetail: Record<string, number>;
  exitFactorsAvg: number | null;
}

/**
 * Factor priorizado para análisis
 */
export interface FactorPriority {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
  priority: number;
  trend?: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Análisis de factores agregado
 */
export interface FactorsAnalysis {
  topFactors: FactorPriority[];
  totalMentions: number;
  avgFactorsPerExit: number;
  criticalFactors: FactorPriority[]; // avgSeverity < 2.5
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES ALERTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Datos para crear una alerta Exit
 */
export interface ExitAlertData {
  exitRecordId?: string;
  accountId: string;
  departmentId: string;
  alertType: ExitAlertType;
  severity: ExitAlertSeverity;
  title: string;
  description: string;
  triggerScore?: number;
  exitCount?: number;
  triggerFactor?: string;
  avgScore?: number;
  enpsValue?: number;
  periodStart?: Date;
  periodEnd?: Date;
  slaHours?: number;
}

/**
 * Regla de generación de alerta
 */
export interface AlertRule {
  type: ExitAlertType;
  condition: (data: AlertRuleContext) => boolean;
  severity: ExitAlertSeverity;
  titleTemplate: string;
  descriptionTemplate: string;
  slaHours: number;
}

/**
 * Contexto para evaluar reglas de alerta
 */
export interface AlertRuleContext {
  exitRecord?: ExitRecordWithRelations;
  departmentExits?: ExitRecordWithRelations[];
  departmentMetrics?: {
    headcountAvg?: number;
    turnoverRate?: number;
  };
  period?: {
    start: Date;
    end: Date;
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES MÉTRICAS Y AGREGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Métricas Exit para dashboard
 */
export interface ExitMetrics {
  // Período
  period: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Básicas
  totalExits: number;
  surveysCompleted: number;
  completionRate: number;
  
  // Por razón
  byReason: {
    voluntary: number;
    termination: number;
    contractEnd: number;
    retirement: number;
    other: number;
  };
  
  // EIS
  avgEIS: number | null;
  eisClassification: EISClassification | null;
  eisTrend: number | null;
  eisDistribution: {
    healthy: number;
    neutral: number;
    problematic: number;
    toxic: number;
  };
  
  // eNPS
  enps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  
  // Top Factores
  topFactors: FactorPriority[];
  
  // Correlación Onboarding
  conservationIndex: number | null;
  alertPredictionRate: number | null;
  exitsWithOnboarding: number;
  exitsWithIgnoredAlerts: number;
  
  // Alertas
  pendingAlerts: number;
  criticalAlerts: number;
}

/**
 * Insight generado del análisis Exit
 */
export interface ExitInsight {
  type: 'factor_frecuente' | 'severidad_critica' | 'correlacion_onboarding' | 'tendencia' | 'benchmark' | 'ley_karin';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  data: Record<string, unknown>;
  recommendation: string;
  actionUrl?: string;
}

/**
 * Resumen ejecutivo Exit
 */
export interface ExitExecutiveSummary {
  period: string;
  metrics: ExitMetrics;
  insights: ExitInsight[];
  trends: {
    eis: { current: number | null; previous: number | null; delta: number | null };
    enps: { current: number | null; previous: number | null; delta: number | null };
    exits: { current: number; previous: number; delta: number };
  };
  topDepartments: {
    highest: { id: string; name: string; avgEIS: number; exits: number }[];
    lowest: { id: string; name: string; avgEIS: number; exits: number }[];
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES API RESPONSES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response paginada de ExitRecords
 */
export interface ExitRecordListResponse {
  success: boolean;
  data: ExitRecordWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * ExitRecord con relaciones expandidas
 */
export interface ExitRecordWithRelations {
  id: string;
  nationalId: string;
  exitDate: Date;
  exitReason: string | null;
  eis: number | null;
  eisClassification: string | null;
  exitFactors: string[];
  exitFactorsDetail: Record<string, number> | null;
  exitFactorsAvg: number | null;
  hadOnboarding: boolean;
  onboardingJourneyId: string | null;
  onboardingEXOScore: number | null;
  onboardingAlertsCount: number;
  onboardingIgnoredAlerts: number;
  tenureMonths: number | null;
  hasLeyKarinAlert: boolean;
  createdAt: Date;
  department: {
    id: string;
    displayName: string;
    standardCategory: string | null;
  };
  participant: {
    id: string;
    name: string | null;
    email: string | null;
    hasResponded: boolean;
    responseDate: Date | null;
  };
  alerts?: ExitAlertSummary[];
}

/**
 * Resumen de alerta para listados
 */
export interface ExitAlertSummary {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  createdAt: Date;
}

/**
 * Response de alertas Exit
 */
export interface ExitAlertsResponse {
  success: boolean;
  data: ExitAlertWithRelations[];
  metrics: {
    total: number;
    pending: number;
    acknowledged: number;
    resolved: number;
    critical: number;
    high: number;
    byType: Record<string, number>;
  };
}

/**
 * ExitAlert con relaciones expandidas
 */
export interface ExitAlertWithRelations {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  slaStatus: string | null;
  slaHours: number | null;      // ← AGREGAR ESTE CAMPO
  dueDate: Date | null;
  triggerScore: number | null;
  exitCount: number | null;
  triggerFactor: string | null;
  avgScore: number | null;
  enpsValue: number | null;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: Date;
  department: {
    id: string;
    displayName: string;
  };
  exitRecord?: {
    id: string;
    nationalId: string;
    exitDate: Date;
  };
}

/**
 * Response de métricas Exit
 */
export interface ExitMetricsResponse {
  success: boolean;
  data: ExitMetrics;
  insights: ExitInsight[];
  generatedAt: Date;
}

/**
 * Response de DepartmentExitInsight
 */
export interface DepartmentExitInsightResponse {
  success: boolean;
  data: DepartmentExitInsightWithRelations;
}

/**
 * DepartmentExitInsight con relaciones
 */
export interface DepartmentExitInsightWithRelations {
  id: string;
  period: string;
  periodType: string;
  periodStart: Date;
  periodEnd: Date;
  totalExits: number;
  voluntaryExits: number;
  involuntaryExits: number;
  surveysCompleted: number;
  avgSatisfaction: number | null;
  avgFactorsScore: number | null;
  avgLeadership: number | null;
  avgDevelopment: number | null;
  avgSafety: number | null;
  avgAutonomy: number | null;
  avgNPS: number | null;
  avgEIS: number | null;
  eisTrend: number | null;
  enps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  topExitFactors: FactorPriority[] | null;
  exitsWithOnboarding: number;
  exitsWithOnboardingAlerts: number;
  exitsWithIgnoredAlerts: number;
  avgOnboardingEXOOfExits: number | null;
  conservationIndex: number | null;
  alertPredictionRate: number | null;
  alertsGenerated: number;
  calculatedAt: Date;
  department: {
    id: string;
    displayName: string;
    standardCategory: string | null;
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PARA GESTIÓN DE ALERTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Payload para acknowledge de alerta
 */
export interface AcknowledgeAlertPayload {
  acknowledgedBy: string;
}

/**
 * Payload para resolver alerta
 */
export interface ResolveAlertPayload {
  resolvedBy: string;
  resolutionNotes?: string;
}

/**
 * Payload para dismiss alerta
 */
export interface DismissAlertPayload {
  dismissedBy: string;
  reason?: string;
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PARA BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Payload para registro masivo de salidas
 */
export interface BatchExitRegistrationPayload {
  accountId: string;
  exits: ExitRegistrationData[];
}

/**
 * Resultado de registro masivo
 */
export interface BatchExitRegistrationResult {
  success: boolean;
  total: number;
  processed: number;
  failed: number;
  results: Array<{
    nationalId: string;
    success: boolean;
    exitRecordId?: string;
    error?: string;
  }>;
}


// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PARA FILTROS Y QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Filtros para listar ExitRecords
 */
export interface ExitRecordFilters {
  accountId: string;
  departmentId?: string;
  departmentIds?: string[];
  exitDateFrom?: Date;
  exitDateTo?: Date;
  exitReason?: ExitReason;
  eisClassification?: EISClassification;
  hasLeyKarinAlert?: boolean;
  hadOnboarding?: boolean;
  hasResponded?: boolean;
  search?: string; // Buscar por nationalId o nombre
}

/**
 * Filtros para listar alertas
 */
export interface ExitAlertFilters {
  accountId: string;
  departmentId?: string;
  departmentIds?: string[];
  alertType?: ExitAlertType;
  severity?: ExitAlertSeverity;
  status?: ExitAlertStatus;
  slaStatus?: SLAStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}


// ═══════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper para extraer EIS Classification de un score
 */
export function getEISClassification(score: number | null): EISClassification | null {
  if (score === null) return null;
  if (score >= EIS_THRESHOLDS.HEALTHY) return EIS_CLASSIFICATIONS.HEALTHY;
  if (score >= EIS_THRESHOLDS.NEUTRAL) return EIS_CLASSIFICATIONS.NEUTRAL;
  if (score >= EIS_THRESHOLDS.PROBLEMATIC) return EIS_CLASSIFICATIONS.PROBLEMATIC;
  return EIS_CLASSIFICATIONS.TOXIC;
}

/**
 * Helper para normalizar rating 1-5 a escala 0-100
 */
export function normalizeRating(rating: number | null): number | null {
  if (rating === null) return null;
  return ((rating - 1) / 4) * 100;
}

/**
 * Helper para calcular EIS score
 */
export function calculateEIS(scores: ExitScores): number | null {
  const { satisfaction, leadership, development, safety, autonomy } = scores;
  
  // Normalizar ratings 1-5 a 0-100
  const normSatisfaction = normalizeRating(satisfaction);
  const normLeadership = normalizeRating(leadership);
  const normDevelopment = normalizeRating(development);
  const normSafety = normalizeRating(safety);
  const normAutonomy = normalizeRating(autonomy);
  
  // Necesitamos al menos 3 dimensiones para calcular
  const validScores = [normSatisfaction, normLeadership, normDevelopment, normSafety, normAutonomy]
    .filter(s => s !== null);
  
  if (validScores.length < 3) return null;
  
  // Calcular con pesos, usando 0 para dimensiones faltantes
  const eis = (
    (normSatisfaction ?? 0) * EIS_WEIGHTS.SATISFACTION +
    (normLeadership ?? 0) * EIS_WEIGHTS.LEADERSHIP +
    (normDevelopment ?? 0) * EIS_WEIGHTS.DEVELOPMENT +
    (normSafety ?? 0) * EIS_WEIGHTS.SAFETY +
    (normAutonomy ?? 0) * EIS_WEIGHTS.AUTONOMY
  );
  
  return Math.round(eis * 10) / 10;
}

/**
 * Helper para calcular eNPS
 */
export function calculateENPS(responses: number[]): {
  enps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
} {
  if (responses.length === 0) {
    return { enps: null, promoters: 0, passives: 0, detractors: 0 };
  }
  
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  
  responses.forEach(score => {
    if (score >= 9) promoters++;
    else if (score >= 7) passives++;
    else detractors++;
  });
  
  const total = responses.length;
  const enps = Math.round(((promoters - detractors) / total) * 100);
  
  return { enps, promoters, passives, detractors };
}

/**
 * Helper para calcular tenure en meses
 */
export function calculateTenureMonths(hireDate: Date, exitDate: Date): number {
  const diffTime = exitDate.getTime() - hireDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.round(diffDays / 30);
}
// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES PARA DASHBOARD EXIT (Gold Cache + Computed)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Métricas de un departamento para dashboard
 * Retornado por ExitAggregationService.getDepartmentRanking()
 */
export interface DepartmentExitMetrics {
  departmentId: string;
  departmentName: string;
  standardCategory: string | null;
  level: number;
  parentId: string | null;

  // Métricas Gold Cache
  totalExits: number;
  avgEIS: number | null;
  conservationIndex: number | null;
  topFactors: FactorPriority[] | null;
  enps: number | null;
  voluntaryRate: number | null;

  // Alertas (computed)
  pendingAlerts: number;
  criticalAlerts: number;
}

/**
 * Resumen global Exit para dashboard
 * Retornado por ExitAggregationService.getGlobalMetrics()
 */
export interface ExitMetricsSummary {
  totalDepartments: number;
  totalExits: number;
  globalAvgEIS: number | null;
  topFactorsGlobal: FactorPriority[] | null;
  alerts: {
    pending: number;
    critical: number;
    leyKarin: number;
  };
}

/**
 * Response completa del API /api/exit/metrics
 */
export interface ExitMetricsData {
  departments: DepartmentExitMetrics[];
  summary: ExitMetricsSummary;
  source: 'GLOBAL' | 'DEPARTMENT';
  responseTime: number;
}