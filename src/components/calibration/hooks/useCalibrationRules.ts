// ════════════════════════════════════════════════════════════════════════════
// HOOK: useCalibrationRules - "Árbitro de Calidad"
// src/components/calibration/hooks/useCalibrationRules.ts
// ════════════════════════════════════════════════════════════════════════════
// Valida movimientos en la 9-Box contra datos AAE (Aspiración, Ability, Engagement).
// 8 reglas: 3 critical, 4 warning, 1 info.
// Evalúa en orden de severidad (critical primero, info último).
// ════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import type { CinemaEmployee } from './useCalibrationRoom'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type RuleSeverity = 'critical' | 'warning' | 'info'

export interface ValidationResult {
  isValid: boolean
  hasWarning: boolean
  severity?: RuleSeverity
  ruleId?: string
  title?: string
  message?: string
  recommendation?: string
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

// Fila de potencial (1=bajo, 2=medio, 3=alto)
export const POTENTIAL_ROW: Record<string, number> = {
  q1: 1, q2: 1, q3: 1,
  q4: 2, q5: 2, q6: 2,
  q7: 3, q8: 3, q9: 3,
}

// Columna de desempeño (1=bajo, 2=medio, 3=alto)
export const PERFORMANCE_COL: Record<string, number> = {
  q1: 1, q4: 1, q7: 1,
  q2: 2, q5: 2, q8: 2,
  q3: 3, q6: 3, q9: 3,
}

// Nombres de cuadrantes
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

// Agrupaciones por zona
const HIGH_POTENTIAL_QUADRANTS = ['q7', 'q8', 'q9']
const HIGH_PERFORMANCE_QUADRANTS = ['q3', 'q6', 'q9']
const TOP_TALENT_QUADRANTS = ['q9']
const RISK_QUADRANTS = ['q1']

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function isRealDowngrade(fromQuadrant: string, toQuadrant: string): boolean {
  const fromPotential = POTENTIAL_ROW[fromQuadrant]
  const toPotential = POTENTIAL_ROW[toQuadrant]
  const fromPerformance = PERFORMANCE_COL[fromQuadrant]
  const toPerformance = PERFORMANCE_COL[toQuadrant]

  return toPotential < fromPotential || toPerformance < fromPerformance
}

function getJumpMagnitude(fromQuadrant: string, toQuadrant: string): number {
  const potentialDiff = Math.abs(POTENTIAL_ROW[fromQuadrant] - POTENTIAL_ROW[toQuadrant])
  const performanceDiff = Math.abs(PERFORMANCE_COL[fromQuadrant] - PERFORMANCE_COL[toQuadrant])
  return potentialDiff + performanceDiff
}

const FACTOR_LABELS: Record<string, string> = {
  aspiration: 'Aspiración',
  ability: 'Capacidad',
  engagement: 'Compromiso',
}

// ════════════════════════════════════════════════════════════════════════════
// REGLAS DE VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

function validateMove(
  employee: CinemaEmployee,
  targetQuadrant: string
): ValidationResult {
  const fromQuadrant = employee.quadrant
  const name = employee.name

  // ── CRITICAL 1: MOVE_TO_RISK_QUADRANT ──────────────────────────────────
  if (RISK_QUADRANTS.includes(targetQuadrant) && fromQuadrant !== targetQuadrant) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'critical',
      ruleId: 'MOVE_TO_RISK_QUADRANT',
      title: 'Movimiento a Zona de Riesgo',
      message: `Estás clasificando a ${name} como "Riesgo" (bajo desempeño + bajo potencial). Esta es una decisión significativa.`,
      recommendation: 'Asegúrate de tener evidencia documentada y un plan de mejora o salida.',
    }
  }

  // ── CRITICAL 2: HIGH_POTENTIAL_LOW_ASPIRATION ──────────────────────────
  if (
    HIGH_POTENTIAL_QUADRANTS.includes(targetQuadrant) &&
    employee.aspiration === 1
  ) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'critical',
      ruleId: 'HIGH_POTENTIAL_LOW_ASPIRATION',
      title: 'Incoherencia en Aspiración',
      message: `Estás clasificando a ${name} como "${QUADRANT_NAMES[targetQuadrant]}", pero su Aspiración es BAJA (1/3). Esto indica que NO busca roles de mayor responsabilidad.`,
      recommendation: 'Considera si esta persona realmente quiere asumir desafíos de liderazgo.',
      affectedFactors: [{
        factor: 'aspiration',
        label: FACTOR_LABELS.aspiration,
        value: employee.aspiration,
        expected: 'Alta (2-3)',
        actual: 'Baja (1/3)',
        isConflict: true,
      }],
    }
  }

  // ── CRITICAL 3: TOP_TALENT_LOW_ENGAGEMENT ──────────────────────────────
  if (
    TOP_TALENT_QUADRANTS.includes(targetQuadrant) &&
    employee.engagement === 1
  ) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'critical',
      ruleId: 'TOP_TALENT_LOW_ENGAGEMENT',
      title: 'Riesgo de Fuga Detectado',
      message: `ALERTA: ${name} tiene Compromiso BAJO (1/3). Clasificarlo como Top Talent sin abordar esto primero es riesgoso.`,
      recommendation: 'Antes de confirmar, considera una conversación de retención urgente.',
      affectedFactors: [{
        factor: 'engagement',
        label: FACTOR_LABELS.engagement,
        value: employee.engagement,
        expected: 'Alto (2-3)',
        actual: 'Bajo (1/3)',
        isConflict: true,
      }],
    }
  }

  // ── WARNING 4: HIGH_POTENTIAL_LOW_ABILITY ───────────────────────────────
  if (
    (targetQuadrant === 'q8' || targetQuadrant === 'q9') &&
    employee.ability === 1
  ) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'warning',
      ruleId: 'HIGH_POTENTIAL_LOW_ABILITY',
      title: 'Capacidad Insuficiente',
      message: `${name} tiene Capacidad BAJA (1/3). La posición "${QUADRANT_NAMES[targetQuadrant]}" requiere capacidad demostrada.`,
      recommendation: 'Considera si necesita un plan de desarrollo primero.',
      affectedFactors: [{
        factor: 'ability',
        label: FACTOR_LABELS.ability,
        value: employee.ability,
        expected: 'Media-Alta (2-3)',
        actual: 'Baja (1/3)',
        isConflict: true,
      }],
    }
  }

  // ── WARNING 5: HIGH_PERFORMANCE_LOW_ABILITY ────────────────────────────
  if (
    HIGH_PERFORMANCE_QUADRANTS.includes(targetQuadrant) &&
    employee.ability === 1
  ) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'warning',
      ruleId: 'HIGH_PERFORMANCE_LOW_ABILITY',
      title: 'Inconsistencia de Datos',
      message: `${name} tiene Capacidad BAJA (1/3), pero lo clasificas en alto desempeño. Verifica si la evaluación AAE está actualizada.`,
      recommendation: 'Revisa si los datos de capacidad reflejan la realidad actual.',
      affectedFactors: [{
        factor: 'ability',
        label: FACTOR_LABELS.ability,
        value: employee.ability,
        expected: 'Media-Alta (2-3)',
        actual: 'Baja (1/3)',
        isConflict: true,
      }],
    }
  }

  // ── WARNING 6: DOWNGRADE_HIGH_ENGAGEMENT ───────────────────────────────
  if (
    isRealDowngrade(fromQuadrant, targetQuadrant) &&
    employee.engagement === 3
  ) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'warning',
      ruleId: 'DOWNGRADE_HIGH_ENGAGEMENT',
      title: 'Riesgo de Desmotivación',
      message: `${name} tiene Compromiso ALTO (3/3). Degradarlo podría impactar negativamente su motivación.`,
      recommendation: 'Si decides proceder, comunica claramente las razones.',
      affectedFactors: [{
        factor: 'engagement',
        label: FACTOR_LABELS.engagement,
        value: employee.engagement,
        expected: 'N/A (downgrade)',
        actual: 'Alto (3/3)',
        isConflict: true,
      }],
    }
  }

  // ── WARNING 7: MASSIVE_JUMP ────────────────────────────────────────────
  const magnitude = getJumpMagnitude(fromQuadrant, targetQuadrant)
  if (magnitude >= 3) {
    return {
      isValid: true,
      hasWarning: true,
      severity: 'warning',
      ruleId: 'MASSIVE_JUMP',
      title: 'Salto Extremo Detectado',
      message: `Estás moviendo a ${name} de "${QUADRANT_NAMES[fromQuadrant]}" a "${QUADRANT_NAMES[targetQuadrant]}". Este es un cambio significativo de ${magnitude} posiciones.`,
      recommendation: 'Asegúrate de documentar las razones de un cambio tan drástico.',
    }
  }

  // ── INFO 8: MISSING_AAE_DATA ───────────────────────────────────────────
  if (HIGH_POTENTIAL_QUADRANTS.includes(targetQuadrant)) {
    const missing: Array<{
      factor: 'aspiration' | 'ability' | 'engagement'
      label: string
      value: 1 | 2 | 3 | null
      expected: string
      actual: string
      isConflict: boolean
    }> = []

    if (employee.aspiration == null) {
      missing.push({
        factor: 'aspiration',
        label: FACTOR_LABELS.aspiration,
        value: null,
        expected: 'Dato requerido',
        actual: 'Sin evaluar',
        isConflict: false,
      })
    }
    if (employee.ability == null) {
      missing.push({
        factor: 'ability',
        label: FACTOR_LABELS.ability,
        value: null,
        expected: 'Dato requerido',
        actual: 'Sin evaluar',
        isConflict: false,
      })
    }
    if (employee.engagement == null) {
      missing.push({
        factor: 'engagement',
        label: FACTOR_LABELS.engagement,
        value: null,
        expected: 'Dato requerido',
        actual: 'Sin evaluar',
        isConflict: false,
      })
    }

    if (missing.length > 0) {
      const missingNames = missing.map(m => m.label).join(', ')
      return {
        isValid: true,
        hasWarning: true,
        severity: 'info',
        ruleId: 'MISSING_AAE_DATA',
        title: 'Evaluación Incompleta',
        message: `${name} no tiene evaluación AAE completa. Faltan: ${missingNames}.`,
        recommendation: 'Puedes proceder, pero considera solicitar la evaluación completa.',
        affectedFactors: missing,
      }
    }
  }

  // ── Sin alertas ────────────────────────────────────────────────────────
  return { isValid: true, hasWarning: false }
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
