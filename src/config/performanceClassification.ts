// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CLASSIFICATION CONFIG
// src/config/performanceClassification.ts
// ════════════════════════════════════════════════════════════════════════════
// Fuente única de verdad para clasificación de performance
// Configurable por cliente, con defaults de FocalizaHR
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════════════════════════════════════════

export enum PerformanceLevel {
  EXCEPTIONAL = 'exceptional',
  EXCEEDS = 'exceeds_expectations',
  MEETS = 'meets_expectations',
  DEVELOPING = 'developing',
  NEEDS_IMPROVEMENT = 'needs_improvement'
}

export enum RoleFitLevel {
  OPTIMAL = 'optimal',
  SOLID = 'solid',
  DEVELOPING = 'developing',
  GAP = 'gap',
  RISK = 'risk'
}

export enum PotentialLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum NineBoxPosition {
  STAR = 'star',
  GROWTH_POTENTIAL = 'growth_potential',
  POTENTIAL_GEM = 'potential_gem',
  HIGH_PERFORMER = 'high_performer',
  CORE_PLAYER = 'core_player',
  INCONSISTENT = 'inconsistent',
  TRUSTED_PROFESSIONAL = 'trusted_professional',
  AVERAGE_PERFORMER = 'average_performer',
  UNDERPERFORMER = 'underperformer'
}

export enum SuccessionReadiness {
  READY_NOW = 'ready_now',
  READY_1_2_YEARS = 'ready_1_2_years',
  NEEDS_DEVELOPMENT = 'needs_development',
  NOT_SUITABLE = 'not_suitable'
}

export enum AdjustmentType {
  NO_CHANGE = 'no_change',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade'
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface PerformanceLevelConfig {
  level: string
  label: string
  labelShort: string
  minScore: number
  maxScore: number
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  description: string
  distributionTarget?: number
}

export interface RoleFitLevelConfig {
  level: RoleFitLevel
  minScore: number
  label: string
  labelShort: string
  question: string
  description: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
}

export interface PerformanceRatingConfigData {
  scaleType: 'three_level' | 'five_level' | 'custom'
  levels: PerformanceLevelConfig[]
}

export interface NineBoxPositionConfig {
  position: NineBoxPosition
  performance: 'high' | 'medium' | 'low'
  potential: 'high' | 'medium' | 'low'
  label: string
  labelShort: string
  color: string
  bgClass: string
  textClass: string
  description: string
}

/**
 * Ponderacion de evaluadores para calculo de score
 * Patron Enterprise: Workday, SuccessFactors, Lattice
 */
export interface EvaluatorWeights {
  self: number      // % peso autoevaluacion
  manager: number   // % peso evaluacion jefe
  peer: number      // % peso evaluacion pares
  upward: number    // % peso evaluacion subordinados
}

// ════════════════════════════════════════════════════════════════════════════
// PONDERACION DEFAULT FOCALIZAHR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Nivel 0: Default FocalizaHR (codigo)
 * Todos los tipos de evaluador tienen el mismo peso
 */
export const FOCALIZAHR_DEFAULT_WEIGHTS: EvaluatorWeights = {
  self: 25,
  manager: 25,
  peer: 25,
  upward: 25
}

/**
 * Ejemplo: Ponderacion tipica Enterprise
 * Manager tiene mas peso, self menos (reduce sesgo)
 */
export const ENTERPRISE_TYPICAL_WEIGHTS: EvaluatorWeights = {
  self: 15,
  manager: 40,
  peer: 30,
  upward: 15
}

// ════════════════════════════════════════════════════════════════════════════
// THRESHOLDS
// ════════════════════════════════════════════════════════════════════════════

export const PERFORMANCE_THRESHOLDS = {
  EXCEPTIONAL: 4.5,
  EXCEEDS: 4.0,
  MEETS: 3.5,
  DEVELOPING: 2.5,
  NEEDS_IMPROVEMENT: 0
} as const

export const NINE_BOX_THRESHOLDS = {
  HIGH: 4.0,
  MEDIUM: 3.0,
  LOW: 0
} as const

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION DEFAULT FOCALIZAHR - 5 NIVELES
// ════════════════════════════════════════════════════════════════════════════

export const FOCALIZAHR_DEFAULT_CONFIG: PerformanceRatingConfigData = {
  scaleType: 'five_level',
  levels: [
    {
      level: PerformanceLevel.EXCEPTIONAL,
      label: 'Excepcional',
      labelShort: 'Exc',
      minScore: 4.5,
      maxScore: 5.0,
      color: '#10B981',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      description: 'Supera consistentemente todas las expectativas. Modelo a seguir.',
      distributionTarget: 10
    },
    {
      level: PerformanceLevel.EXCEEDS,
      label: 'Supera Expectativas',
      labelShort: 'Sup',
      minScore: 4.0,
      maxScore: 4.49,
      color: '#22D3EE',
      bgClass: 'bg-cyan-500/10',
      textClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/30',
      description: 'Frecuentemente excede las expectativas del rol.',
      distributionTarget: 20
    },
    {
      level: PerformanceLevel.MEETS,
      label: 'Cumple Expectativas',
      labelShort: 'Cum',
      minScore: 3.5,
      maxScore: 3.99,
      color: '#A78BFA',
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/30',
      description: 'Cumple solidamente con los requisitos del rol.',
      distributionTarget: 40
    },
    {
      level: PerformanceLevel.DEVELOPING,
      label: 'En Desarrollo',
      labelShort: 'Des',
      minScore: 2.5,
      maxScore: 3.49,
      color: '#F59E0B',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      description: 'En proceso de desarrollo. Necesita apoyo adicional.',
      distributionTarget: 20
    },
    {
      level: PerformanceLevel.NEEDS_IMPROVEMENT,
      label: 'Requiere Atencion',
      labelShort: 'Req',
      minScore: 0,
      maxScore: 2.49,
      color: '#EF4444',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30',
      description: 'Requiere plan de mejora inmediato.',
      distributionTarget: 10
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION ROLE FIT - 5 NIVELES (Diagnóstico Radical Candor)
// ════════════════════════════════════════════════════════════════════════════

export const ROLE_FIT_DEFAULT_CONFIG: RoleFitLevelConfig[] = [
  {
    level: RoleFitLevel.OPTIMAL,
    minScore: 90,
    label: 'Ajuste Óptimo',
    labelShort: 'Óptimo',
    question: '¿Cómo podemos expandir su alcance e influencia hoy?',
    description: 'Dominio total del perfil. Actúa como referente técnico y cultural, con capacidad de mentorear a otros y liderar proyectos de alta complejidad.',
    color: '#22D3EE',
    bgClass: 'fhr-bg-elevated',
    textClass: 'fhr-text-accent',
    borderClass: 'border-cyan-400/30'
  },
  {
    level: RoleFitLevel.SOLID,
    minScore: 75,
    label: 'Ajuste Sólido',
    labelShort: 'Sólido',
    question: '¿Qué pequeños ajustes llevarían este desempeño al siguiente nivel?',
    description: 'Ajuste consistente. Ejecución sólida con oportunidades de optimización en competencias secundarias para alcanzar la excelencia en el rol.',
    color: '#94A3B8',
    bgClass: 'fhr-bg-elevated',
    textClass: 'fhr-text',
    borderClass: 'border-slate-500/30'
  },
  {
    level: RoleFitLevel.DEVELOPING,
    minScore: 60,
    label: 'Potencial Activo',
    labelShort: 'Potencial',
    question: '¿Estamos acelerando su aprendizaje a la velocidad correcta?',
    description: 'Fase de aceleración. Presenta brechas en competencias clave que requieren un enfoque de desarrollo dirigido para asegurar el ajuste operativo.',
    color: '#A78BFA',
    bgClass: 'fhr-bg-elevated',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30'
  },
  {
    level: RoleFitLevel.GAP,
    minScore: 40,
    label: 'Desajuste Crítico',
    labelShort: 'Crítico',
    question: '¿Es este el rol donde sus fortalezas pueden brillar realmente?',
    description: 'Las brechas en competencias fundamentales impactan la calidad del output. Requiere intervención inmediata del líder y un plan de acción prioritario.',
    color: '#F59E0B',
    bgClass: 'fhr-bg-elevated',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30'
  },
  {
    level: RoleFitLevel.RISK,
    minScore: 0,
    label: 'Incompatibilidad Estratégica',
    labelShort: 'Riesgo',
    question: '¿Cuál es el costo de mantener este desajuste para el equipo?',
    description: 'El perfil actual no se alinea con las exigencias críticas del cargo. Se requiere una auditoría urgente de la posición y decisiones de estructura inmediatas.',
    color: '#EF4444',
    bgClass: 'fhr-bg-elevated',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30'
  }
]

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION ALTERNATIVA - 3 NIVELES
// ════════════════════════════════════════════════════════════════════════════

export const THREE_LEVEL_CONFIG: PerformanceRatingConfigData = {
  scaleType: 'three_level',
  levels: [
    {
      level: 'exceeds',
      label: 'Supera Expectativas',
      labelShort: 'Sup',
      minScore: 4.0,
      maxScore: 5.0,
      color: '#10B981',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      description: 'Desempeno superior al esperado.',
      distributionTarget: 20
    },
    {
      level: 'meets',
      label: 'Cumple Expectativas',
      labelShort: 'Cum',
      minScore: 3.0,
      maxScore: 3.99,
      color: '#22D3EE',
      bgClass: 'bg-cyan-500/10',
      textClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/30',
      description: 'Cumple con lo esperado del rol.',
      distributionTarget: 60
    },
    {
      level: 'below',
      label: 'Bajo Expectativas',
      labelShort: 'Baj',
      minScore: 0,
      maxScore: 2.99,
      color: '#EF4444',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30',
      description: 'No alcanza las expectativas del rol.',
      distributionTarget: 20
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACION 9-BOX
// ════════════════════════════════════════════════════════════════════════════

export const NINE_BOX_POSITIONS: Record<NineBoxPosition, NineBoxPositionConfig> = {
  [NineBoxPosition.STAR]: {
    position: NineBoxPosition.STAR,
    performance: 'high',
    potential: 'high',
    label: 'Estrella',
    labelShort: 'EST',
    color: '#10B981',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    description: 'Alto desempeno + Alto potencial. Candidato a promocion acelerada.'
  },
  [NineBoxPosition.GROWTH_POTENTIAL]: {
    position: NineBoxPosition.GROWTH_POTENTIAL,
    performance: 'medium',
    potential: 'high',
    label: 'Alto Potencial',
    labelShort: 'APO',
    color: '#22D3EE',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    description: 'Potencial alto, desempeno en desarrollo. Invertir en desarrollo.'
  },
  [NineBoxPosition.POTENTIAL_GEM]: {
    position: NineBoxPosition.POTENTIAL_GEM,
    performance: 'low',
    potential: 'high',
    label: 'Diamante en Bruto',
    labelShort: 'DIA',
    color: '#A78BFA',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    description: 'Alto potencial pero bajo desempeno actual. Investigar barreras.'
  },
  [NineBoxPosition.HIGH_PERFORMER]: {
    position: NineBoxPosition.HIGH_PERFORMER,
    performance: 'high',
    potential: 'medium',
    label: 'Alto Desempeno',
    labelShort: 'ADE',
    color: '#3B82F6',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    description: 'Excelente desempeno, potencial moderado. Retener y reconocer.'
  },
  [NineBoxPosition.CORE_PLAYER]: {
    position: NineBoxPosition.CORE_PLAYER,
    performance: 'medium',
    potential: 'medium',
    label: 'Jugador Clave',
    labelShort: 'JCL',
    color: '#64748B',
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    description: 'Columna vertebral de la organizacion. Mantener engagement.'
  },
  [NineBoxPosition.INCONSISTENT]: {
    position: NineBoxPosition.INCONSISTENT,
    performance: 'low',
    potential: 'medium',
    label: 'Inconsistente',
    labelShort: 'INC',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    description: 'Potencial no realizado. Requiere coaching intensivo.'
  },
  [NineBoxPosition.TRUSTED_PROFESSIONAL]: {
    position: NineBoxPosition.TRUSTED_PROFESSIONAL,
    performance: 'high',
    potential: 'low',
    label: 'Profesional Confiable',
    labelShort: 'PCO',
    color: '#06B6D4',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-400',
    description: 'Experto en su rol actual. Valorar contribucion tecnica.'
  },
  [NineBoxPosition.AVERAGE_PERFORMER]: {
    position: NineBoxPosition.AVERAGE_PERFORMER,
    performance: 'medium',
    potential: 'low',
    label: 'Desempeno Promedio',
    labelShort: 'DPR',
    color: '#94A3B8',
    bgClass: 'bg-slate-400/20',
    textClass: 'text-slate-300',
    description: 'Cumple minimos. Evaluar fit con el rol.'
  },
  [NineBoxPosition.UNDERPERFORMER]: {
    position: NineBoxPosition.UNDERPERFORMER,
    performance: 'low',
    potential: 'low',
    label: 'Bajo Desempeno',
    labelShort: 'BDE',
    color: '#EF4444',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    description: 'Requiere intervencion inmediata. Evaluar continuidad.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION READINESS CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const SUCCESSION_READINESS_CONFIG: Record<SuccessionReadiness, {
  label: string
  labelShort: string
  color: string
  bgClass: string
  textClass: string
  description: string
}> = {
  [SuccessionReadiness.READY_NOW]: {
    label: 'Listo Ahora',
    labelShort: 'Ahora',
    color: '#10B981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    description: 'Puede asumir el rol inmediatamente'
  },
  [SuccessionReadiness.READY_1_2_YEARS]: {
    label: 'Listo en 1-2 Anos',
    labelShort: '1-2 anos',
    color: '#22D3EE',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    description: 'Requiere desarrollo adicional antes de asumir'
  },
  [SuccessionReadiness.NEEDS_DEVELOPMENT]: {
    label: 'Necesita Desarrollo',
    labelShort: 'Desarrollo',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    description: 'Potencial identificado pero requiere desarrollo significativo'
  },
  [SuccessionReadiness.NOT_SUITABLE]: {
    label: 'No Apto',
    labelShort: 'No apto',
    color: '#64748B',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    description: 'No es candidato para este rol'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES HELPER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene clasificacion por score usando config del cliente o default
 */
export function getPerformanceClassification(
  score: number,
  config: PerformanceRatingConfigData = FOCALIZAHR_DEFAULT_CONFIG
): PerformanceLevelConfig {
  const sortedLevels = [...config.levels].sort((a, b) => b.minScore - a.minScore)

  for (const level of sortedLevels) {
    if (score >= level.minScore) {
      return level
    }
  }

  return config.levels[config.levels.length - 1]
}

/**
 * Obtiene solo el nivel (string) para guardar en DB
 */
export function getPerformanceLevel(
  score: number,
  config: PerformanceRatingConfigData = FOCALIZAHR_DEFAULT_CONFIG
): string {
  return getPerformanceClassification(score, config).level
}

/**
 * Mapea score numerico a nivel 9-box (high/medium/low)
 */
export function scoreToNineBoxLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= NINE_BOX_THRESHOLDS.HIGH) return 'high'
  if (score >= NINE_BOX_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Calcula posicion 9-Box basado en performance y potential
 */
export function calculate9BoxPosition(
  performanceLevel: 'high' | 'medium' | 'low',
  potentialLevel: 'high' | 'medium' | 'low'
): NineBoxPosition {
  const mapping: Record<string, NineBoxPosition> = {
    'high-high': NineBoxPosition.STAR,
    'medium-high': NineBoxPosition.GROWTH_POTENTIAL,
    'low-high': NineBoxPosition.POTENTIAL_GEM,
    'high-medium': NineBoxPosition.HIGH_PERFORMER,
    'medium-medium': NineBoxPosition.CORE_PLAYER,
    'low-medium': NineBoxPosition.INCONSISTENT,
    'high-low': NineBoxPosition.TRUSTED_PROFESSIONAL,
    'medium-low': NineBoxPosition.AVERAGE_PERFORMER,
    'low-low': NineBoxPosition.UNDERPERFORMER
  }

  const key = `${performanceLevel}-${potentialLevel}`
  return mapping[key] || NineBoxPosition.CORE_PLAYER
}

/**
 * Obtiene config de posicion 9-Box
 */
export function getNineBoxPositionConfig(position: NineBoxPosition): NineBoxPositionConfig {
  return NINE_BOX_POSITIONS[position]
}

/**
 * Calcula tipo de ajuste en calibracion
 */
export function calculateAdjustmentType(
  originalScore: number,
  newScore: number
): AdjustmentType {
  if (Math.abs(newScore - originalScore) < 0.01) return AdjustmentType.NO_CHANGE
  if (newScore > originalScore) return AdjustmentType.UPGRADE
  return AdjustmentType.DOWNGRADE
}

/**
 * Valida que una config de niveles sea valida
 */
export function validateLevelsConfig(levels: PerformanceLevelConfig[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (levels.length < 3) {
    errors.push('Debe haber al menos 3 niveles')
  }

  if (levels.length > 7) {
    errors.push('No puede haber mas de 7 niveles')
  }

  const sortedByMin = [...levels].sort((a, b) => a.minScore - b.minScore)
  if (sortedByMin[0].minScore > 0) {
    errors.push('El nivel mas bajo debe comenzar en 0')
  }

  const sortedByMax = [...levels].sort((a, b) => b.maxScore - a.maxScore)
  if (sortedByMax[0].maxScore < 5) {
    errors.push('El nivel mas alto debe llegar hasta 5')
  }

  const hasTargets = levels.some(l => l.distributionTarget !== undefined)
  if (hasTargets) {
    const sum = levels.reduce((acc, l) => acc + (l.distributionTarget || 0), 0)
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`Distribution targets deben sumar 100% (actual: ${sum}%)`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE PONDERACION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Valida que los pesos de evaluadores sumen 100
 */
export function validateEvaluatorWeights(weights: EvaluatorWeights): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const sum = weights.self + weights.manager + weights.peer + weights.upward

  if (Math.abs(sum - 100) > 0.01) {
    errors.push(`Los pesos deben sumar 100% (actual: ${sum}%)`)
  }

  if (weights.self < 0 || weights.manager < 0 || weights.peer < 0 || weights.upward < 0) {
    errors.push('Los pesos no pueden ser negativos')
  }

  if (weights.self > 100 || weights.manager > 100 || weights.peer > 100 || weights.upward > 100) {
    errors.push('Ningun peso puede ser mayor a 100%')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Resuelve pesos de evaluadores usando jerarquia Enterprise
 * Patron: cycle.override ?? account.config ?? FOCALIZAHR_DEFAULT
 */
export function resolveEvaluatorWeights(
  cycleWeights?: EvaluatorWeights | null,
  accountWeights?: EvaluatorWeights | null
): EvaluatorWeights {
  if (cycleWeights) {
    return cycleWeights
  }

  if (accountWeights) {
    return accountWeights
  }

  return FOCALIZAHR_DEFAULT_WEIGHTS
}

/**
 * Calcula score ponderado basado en pesos de evaluadores
 */
export function calculateWeightedScore(
  scores: {
    self: number | null
    manager: number | null
    peer: number | null
    upward: number | null
  },
  weights: EvaluatorWeights
): number {
  let totalWeight = 0
  let weightedSum = 0

  if (scores.self !== null) {
    weightedSum += scores.self * weights.self
    totalWeight += weights.self
  }

  if (scores.manager !== null) {
    weightedSum += scores.manager * weights.manager
    totalWeight += weights.manager
  }

  if (scores.peer !== null) {
    weightedSum += scores.peer * weights.peer
    totalWeight += weights.peer
  }

  if (scores.upward !== null) {
    weightedSum += scores.upward * weights.upward
    totalWeight += weights.upward
  }

  if (totalWeight === 0) {
    return 0
  }

  // Promedio ponderado normalizado
  // (ajusta los pesos proporcionalmente si faltan evaluadores)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES ROLE FIT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene la clasificación de Role Fit basada en porcentaje
 * @param roleFitScore - Porcentaje 0-100
 * @param config - Configuración personalizada (opcional)
 */
export function getRoleFitClassification(
  roleFitScore: number,
  config: RoleFitLevelConfig[] = ROLE_FIT_DEFAULT_CONFIG
): RoleFitLevelConfig {
  const sortedConfig = [...config].sort((a, b) => b.minScore - a.minScore)
  const found = sortedConfig.find(level => roleFitScore >= level.minScore)
  return found || sortedConfig[sortedConfig.length - 1]
}

/**
 * Obtiene solo el nivel (enum) de Role Fit
 */
export function getRoleFitLevel(
  roleFitScore: number,
  config: RoleFitLevelConfig[] = ROLE_FIT_DEFAULT_CONFIG
): RoleFitLevel {
  return getRoleFitClassification(roleFitScore, config).level
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS DEFAULT
// ════════════════════════════════════════════════════════════════════════════

export default {
  FOCALIZAHR_DEFAULT_CONFIG,
  THREE_LEVEL_CONFIG,
  PERFORMANCE_THRESHOLDS,
  NINE_BOX_THRESHOLDS,
  NINE_BOX_POSITIONS,
  SUCCESSION_READINESS_CONFIG,
  ROLE_FIT_DEFAULT_CONFIG,

  FOCALIZAHR_DEFAULT_WEIGHTS,
  ENTERPRISE_TYPICAL_WEIGHTS,

  getPerformanceClassification,
  getPerformanceLevel,
  getRoleFitClassification,
  getRoleFitLevel,
  scoreToNineBoxLevel,
  calculate9BoxPosition,
  getNineBoxPositionConfig,
  calculateAdjustmentType,
  validateLevelsConfig,

  validateEvaluatorWeights,
  resolveEvaluatorWeights,
  calculateWeightedScore
}
