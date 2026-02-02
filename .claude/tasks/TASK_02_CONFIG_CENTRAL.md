# TASK 02: CONFIG CENTRALIZADA - PERFORMANCE CLASSIFICATION

## 🎯 OBJETIVO
Crear archivo de configuración centralizada con enums, tipos, constantes y funciones helper.

## 📁 ARCHIVO A CREAR
`src/config/performanceClassification.ts`

## 📋 INSTRUCCIONES

### PASO 1: Crear el archivo

Crea el archivo `src/config/performanceClassification.ts` con este contenido completo:

```typescript
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
 * Ponderación de evaluadores para cálculo de score
 * Patrón Enterprise: Workday, SuccessFactors, Lattice
 */
export interface EvaluatorWeights {
  self: number      // % peso autoevaluación
  manager: number   // % peso evaluación jefe
  peer: number      // % peso evaluación pares
  upward: number    // % peso evaluación subordinados
}

// ════════════════════════════════════════════════════════════════════════════
// PONDERACIÓN DEFAULT FOCALIZAHR
// ════════════════════════════════════════════════════════════════════════════

/**
 * Nivel 0: Default FocalizaHR (código)
 * Todos los tipos de evaluador tienen el mismo peso
 */
export const FOCALIZAHR_DEFAULT_WEIGHTS: EvaluatorWeights = {
  self: 25,
  manager: 25,
  peer: 25,
  upward: 25
}

/**
 * Ejemplo: Ponderación típica Enterprise
 * Manager tiene más peso, self menos (reduce sesgo)
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
// CONFIGURACIÓN DEFAULT FOCALIZAHR - 5 NIVELES
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
      description: 'Cumple sólidamente con los requisitos del rol.',
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
      label: 'Requiere Atención',
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
// CONFIGURACIÓN ALTERNATIVA - 3 NIVELES
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
      description: 'Desempeño superior al esperado.',
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
// CONFIGURACIÓN 9-BOX
// ════════════════════════════════════════════════════════════════════════════

export const NINE_BOX_POSITIONS: Record<NineBoxPosition, NineBoxPositionConfig> = {
  [NineBoxPosition.STAR]: {
    position: NineBoxPosition.STAR,
    performance: 'high',
    potential: 'high',
    label: 'Estrella',
    labelShort: '⭐',
    color: '#10B981',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    description: 'Alto desempeño + Alto potencial. Candidato a promoción acelerada.'
  },
  [NineBoxPosition.GROWTH_POTENTIAL]: {
    position: NineBoxPosition.GROWTH_POTENTIAL,
    performance: 'medium',
    potential: 'high',
    label: 'Alto Potencial',
    labelShort: '🚀',
    color: '#22D3EE',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    description: 'Potencial alto, desempeño en desarrollo. Invertir en desarrollo.'
  },
  [NineBoxPosition.POTENTIAL_GEM]: {
    position: NineBoxPosition.POTENTIAL_GEM,
    performance: 'low',
    potential: 'high',
    label: 'Diamante en Bruto',
    labelShort: '💎',
    color: '#A78BFA',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    description: 'Alto potencial pero bajo desempeño actual. Investigar barreras.'
  },
  [NineBoxPosition.HIGH_PERFORMER]: {
    position: NineBoxPosition.HIGH_PERFORMER,
    performance: 'high',
    potential: 'medium',
    label: 'Alto Desempeño',
    labelShort: '📈',
    color: '#3B82F6',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    description: 'Excelente desempeño, potencial moderado. Retener y reconocer.'
  },
  [NineBoxPosition.CORE_PLAYER]: {
    position: NineBoxPosition.CORE_PLAYER,
    performance: 'medium',
    potential: 'medium',
    label: 'Jugador Clave',
    labelShort: '🎯',
    color: '#64748B',
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    description: 'Columna vertebral de la organización. Mantener engagement.'
  },
  [NineBoxPosition.INCONSISTENT]: {
    position: NineBoxPosition.INCONSISTENT,
    performance: 'low',
    potential: 'medium',
    label: 'Inconsistente',
    labelShort: '📊',
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
    labelShort: '🏆',
    color: '#06B6D4',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-400',
    description: 'Experto en su rol actual. Valorar contribución técnica.'
  },
  [NineBoxPosition.AVERAGE_PERFORMER]: {
    position: NineBoxPosition.AVERAGE_PERFORMER,
    performance: 'medium',
    potential: 'low',
    label: 'Desempeño Promedio',
    labelShort: '➡️',
    color: '#94A3B8',
    bgClass: 'bg-slate-400/20',
    textClass: 'text-slate-300',
    description: 'Cumple mínimos. Evaluar fit con el rol.'
  },
  [NineBoxPosition.UNDERPERFORMER]: {
    position: NineBoxPosition.UNDERPERFORMER,
    performance: 'low',
    potential: 'low',
    label: 'Bajo Desempeño',
    labelShort: '⚠️',
    color: '#EF4444',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    description: 'Requiere intervención inmediata. Evaluar continuidad.'
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
    label: 'Listo en 1-2 Años',
    labelShort: '1-2 años',
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
 * Obtiene clasificación por score usando config del cliente o default
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
 * Mapea score numérico a nivel 9-box (high/medium/low)
 */
export function scoreToNineBoxLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= NINE_BOX_THRESHOLDS.HIGH) return 'high'
  if (score >= NINE_BOX_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Calcula posición 9-Box basado en performance y potential
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
 * Obtiene config de posición 9-Box
 */
export function getNineBoxPositionConfig(position: NineBoxPosition): NineBoxPositionConfig {
  return NINE_BOX_POSITIONS[position]
}

/**
 * Calcula tipo de ajuste en calibración
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
 * Valida que una config de niveles sea válida
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
    errors.push('No puede haber más de 7 niveles')
  }
  
  const sortedByMin = [...levels].sort((a, b) => a.minScore - b.minScore)
  if (sortedByMin[0].minScore > 0) {
    errors.push('El nivel más bajo debe comenzar en 0')
  }
  
  const sortedByMax = [...levels].sort((a, b) => b.maxScore - a.maxScore)
  if (sortedByMax[0].maxScore < 5) {
    errors.push('El nivel más alto debe llegar hasta 5')
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
// FUNCIONES DE PONDERACIÓN
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
    errors.push('Ningún peso puede ser mayor a 100%')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Resuelve pesos de evaluadores usando jerarquía Enterprise
 * Patrón: cycle.override ?? account.config ?? FOCALIZAHR_DEFAULT
 * 
 * @param cycleWeights - Override a nivel de ciclo (Nivel 2)
 * @param accountWeights - Config a nivel de cuenta (Nivel 1)
 * @returns Pesos resueltos
 */
export function resolveEvaluatorWeights(
  cycleWeights?: EvaluatorWeights | null,
  accountWeights?: EvaluatorWeights | null
): EvaluatorWeights {
  // Nivel 2: Override de ciclo tiene prioridad
  if (cycleWeights) {
    return cycleWeights
  }
  
  // Nivel 1: Config de cuenta
  if (accountWeights) {
    return accountWeights
  }
  
  // Nivel 0: Default FocalizaHR
  return FOCALIZAHR_DEFAULT_WEIGHTS
}

/**
 * Calcula score ponderado basado en pesos de evaluadores
 * 
 * @param scores - Scores por tipo de evaluador
 * @param weights - Pesos a aplicar
 * @returns Score ponderado (1.0-5.0)
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
  
  // Solo considerar scores que existen
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
  
  // Si no hay scores, retornar 0
  if (totalWeight === 0) {
    return 0
  }
  
  // Calcular promedio ponderado normalizado
  // (ajusta los pesos proporcionalmente si faltan evaluadores)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS DEFAULT
// ════════════════════════════════════════════════════════════════════════════

export default {
  // Clasificación
  FOCALIZAHR_DEFAULT_CONFIG,
  THREE_LEVEL_CONFIG,
  PERFORMANCE_THRESHOLDS,
  NINE_BOX_THRESHOLDS,
  NINE_BOX_POSITIONS,
  SUCCESSION_READINESS_CONFIG,
  
  // Ponderación
  FOCALIZAHR_DEFAULT_WEIGHTS,
  ENTERPRISE_TYPICAL_WEIGHTS,
  
  // Funciones clasificación
  getPerformanceClassification,
  getPerformanceLevel,
  scoreToNineBoxLevel,
  calculate9BoxPosition,
  getNineBoxPositionConfig,
  calculateAdjustmentType,
  validateLevelsConfig,
  
  // Funciones ponderación
  validateEvaluatorWeights,
  resolveEvaluatorWeights,
  calculateWeightedScore
}
```

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# Verificar que compila
npx tsc src/config/performanceClassification.ts --noEmit
```

- [ ] Archivo creado en `src/config/performanceClassification.ts`
- [ ] Sin errores de TypeScript
- [ ] Todos los enums exportados
- [ ] Todas las funciones helper exportadas
- [ ] FOCALIZAHR_DEFAULT_CONFIG tiene 5 niveles
- [ ] THREE_LEVEL_CONFIG tiene 3 niveles
- [ ] NINE_BOX_POSITIONS tiene 9 posiciones

## 🧪 TEST RÁPIDO

Crea un archivo temporal `test-config.ts`:

```typescript
import { 
  getPerformanceClassification, 
  FOCALIZAHR_DEFAULT_CONFIG 
} from './src/config/performanceClassification'

// Test
console.log(getPerformanceClassification(4.7)) // Debería ser "Excepcional"
console.log(getPerformanceClassification(3.2)) // Debería ser "En Desarrollo"
console.log(getPerformanceClassification(2.0)) // Debería ser "Requiere Atención"
```

## ➡️ SIGUIENTE TAREA
`TASK_03_RATING_SERVICE.md`
