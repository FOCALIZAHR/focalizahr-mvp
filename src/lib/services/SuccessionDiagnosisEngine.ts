// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION DIAGNOSIS ENGINE v2.0 - Motor de 10 Casos con Inteligencia
// src/lib/services/SuccessionDiagnosisEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// Genera el "Acto 1" del Succession Statement: diagnostico AI basado en
// 10 casos priorizados que integran riskQuadrant, mobilityQuadrant,
// nineBoxPosition, engagement y flight risk.
//
// REGLA: el PRIMER caso que matchea gana. Orden = prioridad de urgencia.
// ════════════════════════════════════════════════════════════════════════════

import { formatDisplayName } from '@/lib/utils/formatName'

export type ImmediateAction =
  | 'RETENTION_TALK'
  | 'CRITICAL_PROJECT'
  | 'BOARD_EXPOSURE'
  | 'LATERAL_ROTATION'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'NORMAL'

export interface DiagnosisInput {
  candidateName: string
  targetPositionTitle: string
  targetJobLevel: string
  readinessLevel: string          // READY_NOW | READY_1_2_YEARS | READY_3_PLUS | NOT_VIABLE
  matchPercent: number
  currentRoleFit: number
  gapsCriticalCount: number
  estimatedMonths: number | null
  // Talent intelligence
  nineBoxPosition: string | null  // star | high_performer | growth_potential | ...
  riskQuadrant: string | null     // FUGA_CEREBROS | BURNOUT_RISK | MOTOR_EQUIPO | BAJO_RENDIMIENTO
  mobilityQuadrant: string | null // SUCESOR_NATURAL | EXPERTO_ANCLA | AMBICIOSO_PREMATURO | EN_DESARROLLO
  flightRisk: string | null       // HIGH | MEDIUM | LOW
  engagement: number | null       // 1-3 (AAE) or null
  aspirationLevel: number | null  // 1-3 (AAE) or null
  // Gap detail (for narrative)
  topGaps: Array<{ competencyName: string; rawGap: number }>
  topStrengths: Array<{ competencyName: string; fitPercent: number }>
}

export interface DiagnosisOutput {
  aiDiagnostic: string
  urgency: UrgencyLevel
  suggestedAction: ImmediateAction
  estimatedReadinessMonths: number
  caseId: number                  // 1-10 para traceability
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function displayName(full: string): string {
  return formatDisplayName(full, 'short') || 'El candidato'
}

function isStarOrHighPotential(nb: string | null): boolean {
  if (!nb) return false
  const lower = nb.toLowerCase()
  return lower === 'star' || lower === 'high_performer' || lower === 'growth_potential'
}

function gapNames(gaps: Array<{ competencyName: string }>, max = 2): string {
  const names = gaps.slice(0, max).map(g => g.competencyName)
  return names.length > 0 ? names.join(' y ') : 'competencias clave'
}

function strengthNames(strengths: Array<{ competencyName: string }>, max = 2): string {
  const names = strengths.slice(0, max).map(s => s.competencyName)
  return names.length > 0 ? names.join(' y ') : 'areas clave'
}

function estimateMonths(readiness: string, matchPercent: number, existing: number | null): number {
  if (existing && existing > 0) return existing
  if (readiness === 'READY_NOW') return matchPercent >= 90 ? 0 : 3
  if (readiness === 'READY_1_2_YEARS') return matchPercent >= 75 ? 12 : 18
  if (readiness === 'READY_3_PLUS') return matchPercent >= 60 ? 30 : 36
  return 48
}

// ════════════════════════════════════════════════════════════════════════════
// CASE DEFINITIONS (ordered by priority - first match wins)
// ════════════════════════════════════════════════════════════════════════════

interface CaseResult {
  caseId: number
  urgency: UrgencyLevel
  diagnostic: string
  action: ImmediateAction
}

type CaseEvaluator = (i: DiagnosisInput, fn: string, pos: string) => CaseResult | null

const CASES: CaseEvaluator[] = [

  // ── CASO 1: FUGA DE CEREBROS ────────────────────────────────────────────
  (i, fn, pos) => {
    if (i.riskQuadrant !== 'FUGA_CEREBROS') return null
    return {
      caseId: 1,
      urgency: 'CRITICAL',
      action: 'RETENTION_TALK',
      diagnostic:
        `${fn} tiene la capacidad pero no el compromiso. ` +
        `Los datos muestran que probablemente ya esta evaluando opciones afuera. ` +
        `Con ${Math.round(i.matchPercent)}% de match para ${pos}, tiene con que irse a la competencia. ` +
        `Esto no se resuelve con desarrollo — se resuelve con una conversacion honesta esta semana.`,
    }
  },

  // ── CASO 2: Estrella lista + flight risk ────────────────────────────────
  (i, fn, pos) => {
    if (!isStarOrHighPotential(i.nineBoxPosition)) return null
    if (i.matchPercent < 85 || i.gapsCriticalCount > 0) return null
    if (i.flightRisk !== 'HIGH' && i.riskQuadrant !== 'FUGA_CEREBROS') return null
    return {
      caseId: 2,
      urgency: 'CRITICAL',
      action: 'RETENTION_TALK',
      diagnostic:
        `${fn} ya domina lo que ${pos} necesita — ${Math.round(i.matchPercent)}% de match, sin brechas tecnicas. ` +
        `El problema no es preparacion, es retencion. ` +
        `Alguien con este perfil y sin movimiento visible es candidato a irse. ` +
        `Agenda la conversacion esta semana, no el proximo trimestre.`,
    }
  },

  // ── CASO 3: Estrella + engagement bajo ──────────────────────────────────
  (i, fn, pos) => {
    if (!isStarOrHighPotential(i.nineBoxPosition)) return null
    if (i.matchPercent < 85 || i.gapsCriticalCount > 0) return null
    if (i.engagement == null || i.engagement >= 2) return null
    return {
      caseId: 3,
      urgency: 'HIGH',
      action: 'RETENTION_TALK',
      diagnostic:
        `${fn} es tecnicamente impecable para ${pos} — ${Math.round(i.matchPercent)}% de match, sin brechas. ` +
        `Pero el engagement esta en zona de riesgo. ` +
        `El talento desenganchado no se va por una oferta mejor — se va porque dejo de importarle. ` +
        `Necesita saber que hay un plan concreto para su carrera, no promesas genericas.`,
    }
  },

  // ── CASO 4: BURNOUT RISK ────────────────────────────────────────────────
  (i, fn, pos) => {
    if (i.riskQuadrant !== 'BURNOUT_RISK') return null
    return {
      caseId: 4,
      urgency: 'HIGH',
      action: 'LATERAL_ROTATION',
      diagnostic:
        `${fn} pone todo de si, pero esta al limite. ` +
        `Promoverlo a ${pos} ahora podria quebrarlo — no por falta de voluntad, sino por sobrecarga. ` +
        `Match de ${Math.round(i.matchPercent)}% con ${i.gapsCriticalCount} brecha${i.gapsCriticalCount !== 1 ? 's' : ''} critica${i.gapsCriticalCount !== 1 ? 's' : ''}. ` +
        `Necesita ampliar capacidad sin aumentar presion. ` +
        `El peor error seria premiarlo con mas responsabilidad cuando ya esta estirado.`,
    }
  },

  // ── CASO 5: SUCESOR NATURAL ─────────────────────────────────────────────
  (i, fn, pos) => {
    if (i.mobilityQuadrant !== 'SUCESOR_NATURAL') return null
    return {
      caseId: 5,
      urgency: 'NORMAL',
      action: i.matchPercent >= 85 ? 'BOARD_EXPOSURE' : 'CRITICAL_PROJECT',
      diagnostic:
        `${fn} tiene el talento y la disposicion para ${pos}. ` +
        `${Math.round(i.matchPercent)}% de match` +
        (i.topStrengths.length > 0 ? ` con fortalezas en ${strengthNames(i.topStrengths)}` : '') + `. ` +
        `Lo que falta es exposicion ejecutiva y visibilidad en el nivel correcto. ` +
        (i.gapsCriticalCount > 0
          ? `Tiene ${i.gapsCriticalCount} brecha${i.gapsCriticalCount !== 1 ? 's' : ''} que se ${i.gapsCriticalCount === 1 ? 'cierra' : 'cierran'} con practica, no con cursos. `
          : '') +
        `La ruta es clara: dale el escenario y demuestra que la organizacion lo ve.`,
    }
  },

  // ── CASO 6: EXPERTO ANCLA / aspiracion baja ────────────────────────────
  (i, fn, pos) => {
    if (i.mobilityQuadrant !== 'EXPERTO_ANCLA' && i.aspirationLevel !== 1) return null
    return {
      caseId: 6,
      urgency: 'NORMAL',
      action: 'RETENTION_TALK',
      diagnostic:
        `${fn} es valioso exactamente donde esta — y probablemente lo sabe. ` +
        `Domina su rol actual pero no ha mostrado interes en ascender. ` +
        `Antes de invertir en prepararlo para ${pos}, ` +
        `preguntale directamente si realmente quiere el cargo. ` +
        `Forzar una sucesion sobre alguien que no la desea es perder dos posiciones: la que deja y la que no llena.`,
    }
  },

  // ── CASO 7: AMBICIOSO PREMATURO ─────────────────────────────────────────
  (i, fn, pos) => {
    if (i.mobilityQuadrant !== 'AMBICIOSO_PREMATURO') return null
    return {
      caseId: 7,
      urgency: 'NORMAL',
      action: i.gapsCriticalCount >= 2 ? 'LATERAL_ROTATION' : 'CRITICAL_PROJECT',
      diagnostic:
        `${fn} quiere ${pos} — pero las competencias aun no lo acompanan. ` +
        `Match de ${Math.round(i.matchPercent)}% con ${i.gapsCriticalCount} brecha${i.gapsCriticalCount !== 1 ? 's' : ''} critica${i.gapsCriticalCount !== 1 ? 's' : ''}` +
        (i.topGaps.length > 0 ? ` en ${gapNames(i.topGaps)}` : '') + `. ` +
        `El riesgo es frustracion: si no ve progreso tangible, se desconecta o se va. ` +
        `Necesita un plan con hitos visibles, no una promesa a 3 anos.`,
    }
  },

  // ── CASO 8: Muchas brechas criticas ─────────────────────────────────────
  (i, fn, pos) => {
    if (i.gapsCriticalCount < 3) return null
    return {
      caseId: 8,
      urgency: 'NORMAL',
      action: 'LATERAL_ROTATION',
      diagnostic:
        `${fn} tiene ${i.gapsCriticalCount} brechas criticas para ${pos}` +
        (i.topGaps.length > 0 ? `: ${gapNames(i.topGaps, 3)}` : '') + `. ` +
        `Esto no se cierra con capacitacion — necesita experiencia real en contextos distintos. ` +
        `Match de ${Math.round(i.matchPercent)}% indica que hay base, pero la distancia es seria. ` +
        `Rotacion lateral + mentoring ejecutivo, minimo ${estimateMonths(i.readinessLevel, i.matchPercent, i.estimatedMonths)} meses.`,
    }
  },

  // ── CASO 9: READY_NOW sin senales especiales ────────────────────────────
  (i, fn, pos) => {
    if (i.readinessLevel !== 'READY_NOW') return null
    return {
      caseId: 9,
      urgency: 'NORMAL',
      action: i.gapsCriticalCount === 0 ? 'BOARD_EXPOSURE' : 'CRITICAL_PROJECT',
      diagnostic:
        `${fn} esta listo para ${pos}. ` +
        `${Math.round(i.matchPercent)}% de match` +
        (i.topStrengths.length > 0 ? `, dominio solido en ${strengthNames(i.topStrengths)}` : '') +
        (i.gapsCriticalCount > 0
          ? `, ${i.gapsCriticalCount} brecha${i.gapsCriticalCount !== 1 ? 's' : ''} menor${i.gapsCriticalCount !== 1 ? 'es' : ''} que se ${i.gapsCriticalCount === 1 ? 'cierra' : 'cierran'} en la practica`
          : ', sin brechas bloqueantes') + `. ` +
        `La pregunta no es si esta preparado — es que te detiene para moverlo.`,
    }
  },

  // ── CASO 10: Default — en desarrollo ────────────────────────────────────
  (i, fn, pos) => {
    const months = estimateMonths(i.readinessLevel, i.matchPercent, i.estimatedMonths)
    return {
      caseId: 10,
      urgency: 'NORMAL',
      action: i.matchPercent >= 70 ? 'CRITICAL_PROJECT' : 'LATERAL_ROTATION',
      diagnostic:
        `${fn} esta en desarrollo para ${pos}. ` +
        `Match actual de ${Math.round(i.matchPercent)}%` +
        (i.topStrengths.length > 0 ? ` con base en ${strengthNames(i.topStrengths)}` : '') + `. ` +
        (i.gapsCriticalCount > 0
          ? `${i.gapsCriticalCount} brecha${i.gapsCriticalCount !== 1 ? 's' : ''} critica${i.gapsCriticalCount !== 1 ? 's' : ''}` +
            (i.topGaps.length > 0 ? ` en ${gapNames(i.topGaps)}` : '') + ` requieren plan estructurado. `
          : '') +
        `Horizonte realista: ${months} meses con acompanamiento activo y hitos trimestrales.`,
    }
  },
]

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

export class SuccessionDiagnosisEngine {
  static diagnose(input: DiagnosisInput): DiagnosisOutput {
    const fn = displayName(input.candidateName)
    const pos = input.targetPositionTitle

    // Run cases in priority order — first match wins
    let result: CaseResult | null = null
    for (const evaluate of CASES) {
      result = evaluate(input, fn, pos)
      if (result) break
    }

    // Should never happen (case 10 is catch-all), but safety net
    if (!result) {
      result = {
        caseId: 10,
        urgency: 'NORMAL',
        action: 'CRITICAL_PROJECT',
        diagnostic: `${fn} esta en desarrollo para ${pos}. Revisar plan de sucesion.`,
      }
    }

    return {
      aiDiagnostic: result.diagnostic,
      urgency: result.urgency,
      suggestedAction: result.action,
      estimatedReadinessMonths: estimateMonths(input.readinessLevel, input.matchPercent, input.estimatedMonths),
      caseId: result.caseId,
    }
  }
}
