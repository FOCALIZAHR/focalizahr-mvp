// ════════════════════════════════════════════════════════════════════════════
// HOOK: useCalibrationRules - "Árbitro de Calidad" v2.0
// src/components/calibration/hooks/useCalibrationRules.ts
// ════════════════════════════════════════════════════════════════════════════
// Arquitectura de 2 Capas:
//   Capa 1: Perfil AAE por cuadrante (validación bidireccional)
//   Capa 2: Riesgos específicos de negocio
// ════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import type { CinemaEmployee } from './useCalibrationRoom'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type RuleSeverity = 'critical' | 'warning' | 'info'

export interface AAEGap {
  factor: 'aspiration' | 'ability' | 'engagement'
  label: string
  currentValue: 1 | 2 | 3 | null
  requiredValue: number
  gap: number
  message: string
}

export interface SpecificRisk {
  ruleId: string
  severity: RuleSeverity
  title: string
  message: string
  recommendation: string
}

export interface ValidationResult {
  // Estado general
  isValid: boolean
  hasWarning: boolean

  // Capa 1: Perfil AAE
  direction: 'upgrade' | 'downgrade' | 'lateral'
  profileGaps: AAEGap[]
  gapSummary: string

  // Capa 2: Riesgo específico
  specificRisk?: SpecificRisk

  // Para el modal
  severity: RuleSeverity
  ruleId?: string
  title?: string
  message?: string
  recommendation?: string

  // Backward compat con ConsistencyAlertModal (derivado de profileGaps)
  affectedFactors?: Array<{
    factor: 'aspiration' | 'ability' | 'engagement'
    label: string
    value: 1 | 2 | 3 | null
    expected: string
    actual: string
    isConflict: boolean
  }>
}

// ════════════════════════════════════════════════════════════════════════════
// MAPEO 9-BOX - Estructura real de la matriz
// ════════════════════════════════════════════════════════════════════════════
//
//         DESEMPEÑO →
//         Bajo(1)   Medio(2)  Alto(3)
//       ┌─────────┬─────────┬─────────┐
// Alto  │ q7      │ q8      │ q9 ⭐   │  Potencial
// (3)   │Diamante │AltoPot  │Estrella │  Alto
//       ├─────────┼─────────┼─────────┤
// Medio │ q4      │ q5      │ q6      │  Potencial
// (2)   │Inconsis │ Core    │AltoDes  │  Medio
//       ├─────────┼─────────┼─────────┤
// Bajo  │ q1 ⚠️   │ q2      │ q3      │  Potencial
// (1)   │Riesgo   │Efectivo │Experto  │  Bajo
//       └─────────┴─────────┴─────────┘

export const POTENTIAL_ROW: Record<string, number> = {
  q1: 1, q2: 1, q3: 1,
  q4: 2, q5: 2, q6: 2,
  q7: 3, q8: 3, q9: 3,
}

export const PERFORMANCE_COL: Record<string, number> = {
  q1: 1, q4: 1, q7: 1,
  q2: 2, q5: 2, q8: 2,
  q3: 3, q6: 3, q9: 3,
}

export const QUADRANT_NAMES: Record<string, string> = {
  q1: 'Riesgo',
  q2: 'Efectivo',
  q3: 'Experto',
  q4: 'Inconsistente',
  q5: 'Core',
  q6: 'Alto Desempeño',
  q7: 'Diamante en Bruto',
  q8: 'Alto Potencial',
  q9: 'Estrellas',
}

// ════════════════════════════════════════════════════════════════════════════
// PERFILES AAE POR CUADRANTE (Capa 1)
// Requisitos mínimos: A = Aspiración, C = Capacidad, E = Engagement
// ════════════════════════════════════════════════════════════════════════════

export const QUADRANT_AAE_PROFILE: Record<string, {
  A: number; C: number; E: number; description: string
}> = {
  // Fila Alto Potencial
  q9: { A: 2, C: 2, E: 2, description: 'Estrella: quiere crecer, puede hacerlo, comprometido' },
  q8: { A: 2, C: 2, E: 2, description: 'Alto Potencial: quiere, puede, comprometido' },
  q7: { A: 2, C: 1, E: 2, description: 'Diamante en Bruto: quiere pero aún desarrollando capacidad' },

  // Fila Potencial Medio
  q6: { A: 1, C: 2, E: 2, description: 'Alto Desempeño: puede y comprometido' },
  q5: { A: 1, C: 1, E: 1, description: 'Core: sin requisitos estrictos' },
  q4: { A: 1, C: 1, E: 1, description: 'Inconsistente: sin requisitos estrictos' },

  // Fila Bajo Potencial
  q3: { A: 1, C: 2, E: 1, description: 'Experto: puede pero no busca crecer' },
  q2: { A: 1, C: 1, E: 1, description: 'Efectivo: sin requisitos estrictos' },
  q1: { A: 1, C: 1, E: 1, description: 'Riesgo: sin requisitos estrictos' },
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getJumpMagnitude(fromQuadrant: string, toQuadrant: string): number {
  const potentialDiff = Math.abs(POTENTIAL_ROW[fromQuadrant] - POTENTIAL_ROW[toQuadrant])
  const performanceDiff = Math.abs(PERFORMANCE_COL[fromQuadrant] - PERFORMANCE_COL[toQuadrant])
  return potentialDiff + performanceDiff
}

function getMovementDirection(
  fromQuadrant: string,
  targetQuadrant: string
): 'upgrade' | 'downgrade' | 'lateral' {
  const potentialDiff = POTENTIAL_ROW[targetQuadrant] - POTENTIAL_ROW[fromQuadrant]
  const performanceDiff = PERFORMANCE_COL[targetQuadrant] - PERFORMANCE_COL[fromQuadrant]

  // Si sube en cualquier eje = upgrade
  if (potentialDiff > 0 || performanceDiff > 0) return 'upgrade'
  // Si baja en cualquier eje = downgrade
  if (potentialDiff < 0 || performanceDiff < 0) return 'downgrade'
  return 'lateral'
}

// ════════════════════════════════════════════════════════════════════════════
// MENSAJES HUMANIZADOS POR FACTOR
// ════════════════════════════════════════════════════════════════════════════

function getAspirationMessage(value: 1 | 2 | 3): string {
  switch (value) {
    case 1: return 'No busca roles de mayor responsabilidad'
    case 2: return 'Aspiración moderada'
    case 3: return 'Alta aspiración de crecimiento'
  }
}

function getAbilityMessage(value: 1 | 2 | 3): string {
  switch (value) {
    case 1: return 'Capacidad en desarrollo'
    case 2: return 'Capacidad demostrada'
    case 3: return 'Capacidad excepcional'
  }
}

function getEngagementMessage(value: 1 | 2 | 3): string {
  switch (value) {
    case 1: return 'Bajo nivel de compromiso'
    case 2: return 'Compromiso estable'
    case 3: return 'Altamente comprometido'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CAPA 1: VALIDACIÓN DE PERFIL AAE
// ════════════════════════════════════════════════════════════════════════════

function validateAAEForUpgrade(
  employee: CinemaEmployee,
  targetQuadrant: string
): AAEGap[] {
  const profile = QUADRANT_AAE_PROFILE[targetQuadrant]
  if (!profile) return []

  // Sin datos AAE → no podemos validar (se captura en Capa 2 MISSING_AAE_DATA)
  if (employee.aspiration === null && employee.ability === null && employee.engagement === null) {
    return []
  }

  const gaps: AAEGap[] = []

  if (employee.aspiration !== null && employee.aspiration < profile.A) {
    gaps.push({
      factor: 'aspiration',
      label: 'Aspiración',
      currentValue: employee.aspiration,
      requiredValue: profile.A,
      gap: profile.A - employee.aspiration,
      message: getAspirationMessage(employee.aspiration),
    })
  }

  if (employee.ability !== null && employee.ability < profile.C) {
    gaps.push({
      factor: 'ability',
      label: 'Capacidad',
      currentValue: employee.ability,
      requiredValue: profile.C,
      gap: profile.C - employee.ability,
      message: getAbilityMessage(employee.ability),
    })
  }

  if (employee.engagement !== null && employee.engagement < profile.E) {
    gaps.push({
      factor: 'engagement',
      label: 'Compromiso',
      currentValue: employee.engagement,
      requiredValue: profile.E,
      gap: profile.E - employee.engagement,
      message: getEngagementMessage(employee.engagement),
    })
  }

  return gaps
}

function validateAAEForDowngrade(
  employee: CinemaEmployee,
  _fromQuadrant: string,
  _targetQuadrant: string
): AAEGap[] {
  // Sin datos AAE → no alertamos
  if (employee.aspiration === null && employee.ability === null && employee.engagement === null) {
    return []
  }

  const gaps: AAEGap[] = []

  // Alertar sobre factores ALTOS que se "desperdician" al bajar
  if (employee.aspiration === 3) {
    gaps.push({
      factor: 'aspiration',
      label: 'Aspiración',
      currentValue: employee.aspiration,
      requiredValue: 0,
      gap: 0,
      message: 'Quiere crecer - degradarlo puede frustrarlo',
    })
  }

  if (employee.ability === 3) {
    gaps.push({
      factor: 'ability',
      label: 'Capacidad',
      currentValue: employee.ability,
      requiredValue: 0,
      gap: 0,
      message: 'Tiene alta capacidad - ¿por qué bajarlo?',
    })
  }

  if (employee.engagement === 3) {
    gaps.push({
      factor: 'engagement',
      label: 'Compromiso',
      currentValue: employee.engagement,
      requiredValue: 0,
      gap: 0,
      message: 'Muy comprometido - riesgo de desmotivación',
    })
  }

  return gaps
}

// ════════════════════════════════════════════════════════════════════════════
// CAPA 2: RIESGOS ESPECÍFICOS DE NEGOCIO
// ════════════════════════════════════════════════════════════════════════════

function findSpecificRisk(
  employee: CinemaEmployee,
  fromQuadrant: string,
  targetQuadrant: string
): SpecificRisk | null {
  const name = employee.name

  // CRITICAL: Mover a Riesgo (q1)
  if (targetQuadrant === 'q1' && fromQuadrant !== 'q1') {
    return {
      ruleId: 'MOVE_TO_RISK_QUADRANT',
      severity: 'critical',
      title: 'Movimiento a Zona de Riesgo',
      message: `Estás clasificando a ${name} como "Riesgo" (bajo desempeño + bajo potencial). Esta es una decisión significativa.`,
      recommendation: 'Asegúrate de tener evidencia documentada y un plan de mejora o salida.',
    }
  }

  // CRITICAL: Top Talent con bajo engagement = fuga
  if (targetQuadrant === 'q9' && employee.engagement === 1) {
    return {
      ruleId: 'TOP_TALENT_LOW_ENGAGEMENT',
      severity: 'critical',
      title: 'Riesgo de Fuga Detectado',
      message: `ALERTA: ${name} tiene Compromiso BAJO (1/3). Clasificarlo como Estrella sin abordar esto primero es riesgoso.`,
      recommendation: 'Antes de confirmar, considera una conversación de retención urgente.',
    }
  }

  // WARNING: Salto masivo (≥3 posiciones)
  const magnitude = getJumpMagnitude(fromQuadrant, targetQuadrant)
  if (magnitude >= 3) {
    return {
      ruleId: 'MASSIVE_JUMP',
      severity: 'warning',
      title: 'Salto Extremo Detectado',
      message: `Movimiento de ${magnitude} posiciones en la matriz.`,
      recommendation: 'Asegúrate de documentar las razones de un cambio tan drástico.',
    }
  }

  // INFO: Datos AAE incompletos para cuadrantes de alto potencial
  if (['q7', 'q8', 'q9'].includes(targetQuadrant)) {
    const missing: string[] = []
    if (employee.aspiration === null) missing.push('Aspiración')
    if (employee.ability === null) missing.push('Capacidad')
    if (employee.engagement === null) missing.push('Compromiso')

    if (missing.length > 0) {
      return {
        ruleId: 'MISSING_AAE_DATA',
        severity: 'info',
        title: 'Evaluación AAE Incompleta',
        message: `Faltan datos de: ${missing.join(', ')}.`,
        recommendation: 'Puedes proceder, pero considera solicitar la evaluación completa.',
      }
    }
  }

  return null
}

// ════════════════════════════════════════════════════════════════════════════
// SEVERIDAD Y MENSAJES COMBINADOS
// ════════════════════════════════════════════════════════════════════════════

function determineSeverity(gaps: AAEGap[], risk: SpecificRisk | null): RuleSeverity {
  // Severidad por gaps
  let gapSeverity: RuleSeverity = 'info'
  if (gaps.length >= 2) gapSeverity = 'critical'
  else if (gaps.length === 1) gapSeverity = 'warning'

  // Severidad por riesgo específico
  const riskSeverity: RuleSeverity = risk?.severity || 'info'

  // Tomar la más severa
  const order: RuleSeverity[] = ['critical', 'warning', 'info']
  return order[Math.min(order.indexOf(gapSeverity), order.indexOf(riskSeverity))]
}

function buildCombinedMessage(
  employee: CinemaEmployee,
  targetQuadrant: string,
  direction: 'upgrade' | 'downgrade' | 'lateral',
  gaps: AAEGap[],
  risk: SpecificRisk | null
): { title: string; message: string; recommendation?: string } {
  const name = employee.name
  const quadrantName = QUADRANT_NAMES[targetQuadrant]

  // Riesgo crítico prioriza título, pero incluye gaps en mensaje
  if (risk && risk.severity === 'critical') {
    let message = risk.message
    if (gaps.length > 0) {
      const gapList = gaps.map(g => `• ${g.label}: ${g.currentValue}/3 → ${g.message}`).join('\n')
      message = `${risk.message}\n\nAdemás, el perfil AAE muestra:\n${gapList}`
    }
    return { title: risk.title, message, recommendation: risk.recommendation }
  }

  // Gaps de perfil AAE
  if (gaps.length > 0) {
    const gapList = gaps.map(g => `• ${g.label}: ${g.currentValue}/3 → ${g.message}`).join('\n')

    if (direction === 'upgrade') {
      return {
        title: `Perfil AAE Insuficiente para "${quadrantName}"`,
        message: `${name} no cumple ${gaps.length} de 3 factores requeridos:\n\n${gapList}`,
        recommendation: risk?.recommendation || 'Considera si el movimiento está justificado con evidencia adicional.',
      }
    } else {
      return {
        title: 'Indicadores Fuertes en Riesgo',
        message: `${name} tiene indicadores AAE positivos que podrían verse afectados:\n\n${gapList}`,
        recommendation: risk?.recommendation || 'Si decides proceder, comunica claramente las razones para evitar desmotivación.',
      }
    }
  }

  // Solo riesgo específico sin gaps
  if (risk) {
    return { title: risk.title, message: risk.message, recommendation: risk.recommendation }
  }

  // Fallback
  return {
    title: 'Movimiento Requiere Justificación',
    message: `Moviendo a ${name} hacia "${quadrantName}".`,
    recommendation: 'Por favor proporciona una justificación.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BACKWARD COMPAT: profileGaps → affectedFactors
// ════════════════════════════════════════════════════════════════════════════

function gapsToAffectedFactors(gaps: AAEGap[]): ValidationResult['affectedFactors'] {
  if (gaps.length === 0) return undefined
  return gaps.map(g => ({
    factor: g.factor,
    label: g.label,
    value: g.currentValue,
    expected: g.requiredValue > 0 ? `≥${g.requiredValue}/3` : 'N/A',
    actual: g.currentValue !== null ? `${g.currentValue}/3` : 'Sin evaluar',
    isConflict: true,
  }))
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL - ARQUITECTURA 2 CAPAS
// ════════════════════════════════════════════════════════════════════════════

function validateMove(
  employee: CinemaEmployee,
  targetQuadrant: string
): ValidationResult {
  const fromQuadrant = employee.quadrant

  // Determinar dirección del movimiento
  const direction = getMovementDirection(fromQuadrant, targetQuadrant)

  // ═══════════════════════════════════════════════════════════════════════
  // CAPA 1: Validar perfil AAE según dirección
  // ═══════════════════════════════════════════════════════════════════════

  let profileGaps: AAEGap[] = []

  if (direction === 'upgrade') {
    profileGaps = validateAAEForUpgrade(employee, targetQuadrant)
  } else if (direction === 'downgrade') {
    profileGaps = validateAAEForDowngrade(employee, fromQuadrant, targetQuadrant)
  }
  // lateral: no valida perfil AAE (mismo nivel de exigencia)

  // ═══════════════════════════════════════════════════════════════════════
  // CAPA 2: Buscar riesgos específicos de negocio
  // ═══════════════════════════════════════════════════════════════════════

  const specificRisk = findSpecificRisk(employee, fromQuadrant, targetQuadrant)

  // ═══════════════════════════════════════════════════════════════════════
  // Combinar resultados
  // ═══════════════════════════════════════════════════════════════════════

  const hasGaps = profileGaps.length > 0
  const hasRisk = specificRisk !== null
  const hasWarning = hasGaps || hasRisk

  if (!hasWarning) {
    return {
      isValid: true,
      hasWarning: false,
      direction,
      profileGaps: [],
      gapSummary: '',
      severity: 'info',
    }
  }

  const severity = determineSeverity(profileGaps, specificRisk)
  const { title, message, recommendation } = buildCombinedMessage(
    employee, targetQuadrant, direction, profileGaps, specificRisk
  )

  return {
    isValid: true,
    hasWarning: true,
    direction,
    profileGaps,
    gapSummary: profileGaps.length > 0
      ? `${profileGaps.length} de 3 factores ${direction === 'upgrade' ? 'no cumplen' : 'en riesgo'}`
      : '',
    specificRisk: specificRisk || undefined,
    severity,
    ruleId: specificRisk?.ruleId || (profileGaps.length > 0 ? 'AAE_PROFILE_MISMATCH' : undefined),
    title,
    message,
    recommendation,
    affectedFactors: gapsToAffectedFactors(profileGaps),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useCalibrationRules() {
  const validate = useCallback(
    (employee: CinemaEmployee, targetQuadrant: string): ValidationResult => {
      return validateMove(employee, targetQuadrant)
    },
    []
  )

  return { validateMove: validate }
}
