// ════════════════════════════════════════════════════════════════════════════
// GOALS SYNTHESIS ENGINE — Motor de diagnóstico diferencial
// src/lib/services/GoalsSynthesisEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// Selecciona el diagnóstico más severo para el cierre de la Cascada.
// Patrón: ExecutiveSynthesisEngine de P&L Talent.
// Narrativas: verificadas contra 6 Reglas de Oro (skill focalizahr-narrativas).
// ════════════════════════════════════════════════════════════════════════════

import type { GoalsCorrelationDataV2 } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type GoalsDiagnosticType =
  | 'CONCENTRACION'
  | 'EVALUADOR'
  | 'ESTRELLAS_EN_RIESGO'
  | 'FRAMEWORK'
  | 'ALINEADO'
  | 'DESALINEAMIENTO_GENERALIZADO'

export interface GoalsSynthesis {
  diagnosticType: GoalsDiagnosticType
  trigger: string
  classification: string
  implication: string
  path: string
  accountability: string
}

// ════════════════════════════════════════════════════════════════════════════
// THRESHOLDS
// ════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  CONCENTRACION_DISCONNECTION: 50, // disconnectionRate > 50%
  EVALUADOR_MIN_GERENCIAS: 2,      // ≥2 gerencias con confidenceLevel=red
  ESTRELLAS_MIN_TOTAL: 3,          // mínimo 3 estrellas para evaluar
  ESTRELLAS_RISK_PCT: 80,          // <80% cumplimiento = riesgo
  FRAMEWORK_PEARSON_LOW: 0.3,      // r < 0.3 = desalineado
}

// ════════════════════════════════════════════════════════════════════════════
// ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class GoalsSynthesisEngine {

  /**
   * Genera el diagnóstico diferencial para el cierre de la Cascada.
   * Prioridad: EVALUADOR > CONCENTRACION > ESTRELLAS > FRAMEWORK > GENERALIZADO
   */
  static generate(data: GoalsCorrelationDataV2): GoalsSynthesis {
    const { byGerencia, stars, totals, quadrantCounts } = data

    const pctDesalineamiento = totals.totalEvaluados > 0
      ? Math.round(
          ((quadrantCounts.perceptionBias +
            quadrantCounts.hiddenPerformer +
            quadrantCounts.doubleRisk) /
            totals.totalEvaluados) *
            100
        )
      : 0

    // ── EVALUADOR (prioridad 1) ──
    const gerenciasRed = byGerencia.filter(g => g.confidenceLevel === 'red')
    if (gerenciasRed.length >= THRESHOLDS.EVALUADOR_MIN_GERENCIAS) {
      return {
        diagnosticType: 'EVALUADOR',
        trigger: `${gerenciasRed.length} gerencias con evaluaciones que no coinciden con resultados`,
        classification:
          'Este no es un problema de las personas. Es un problema de quién las evalúa.',
        implication:
          `El patrón se repite bajo el mismo liderazgo. Evaluaciones altas, metas bajas — en más de una gerencia. ` +
          `O el evaluador no diferencia entre quienes rinden y quienes no. ` +
          `O el sistema no le exige hacerlo.`,
        path:
          'El problema tiene nombre. La conversación también.',
        accountability:
          'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      }
    }

    // ── CONCENTRACION (prioridad 2) ──
    const worstGerencia = byGerencia[0]
    if (
      worstGerencia &&
      worstGerencia.confidenceLevel === 'red' &&
      worstGerencia.disconnectionRate > THRESHOLDS.CONCENTRACION_DISCONNECTION
    ) {
      return {
        diagnosticType: 'CONCENTRACION',
        trigger: `${worstGerencia.gerenciaName} con ${worstGerencia.disconnectionRate}% de desconexión`,
        classification:
          'Este no es un problema de toda la organización. Es un problema con gerencia identificada.',
        implication:
          `${worstGerencia.gerenciaName} concentra el mayor desalineamiento. ` +
          `Su equipo tiene evaluaciones que no coinciden con sus resultados — ` +
          `y eso contamina las decisiones de compensación, promoción y sucesión de toda esa unidad.`,
        path:
          `El problema tiene gerencia identificada. Y tiene datos.`,
        accountability:
          'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      }
    }

    // ── ESTRELLAS EN RIESGO (prioridad 3) ──
    if (
      stars.total >= THRESHOLDS.ESTRELLAS_MIN_TOTAL &&
      stars.percentage < THRESHOLDS.ESTRELLAS_RISK_PCT
    ) {
      return {
        diagnosticType: 'ESTRELLAS_EN_RIESGO',
        trigger: `Solo ${stars.percentage}% de las estrellas respalda su clasificación con resultados`,
        classification:
          'Este no es un problema de rendimiento general. Es un problema de cómo defines tu mejor talento.',
        implication:
          `Solo el ${stars.percentage}% de tus estrellas respalda su clasificación con resultados. ` +
          `Las decisiones de sucesión y compensación se construyen sobre una base que el negocio no confirma.`,
        path:
          'La pregunta no es quiénes son tus estrellas. Es qué criterio usaste para definirlas — y si el negocio lo confirma.',
        accountability:
          'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      }
    }

    // ── FRAMEWORK (prioridad 4) ──
    const worstPearson = byGerencia
      .filter(g => g.pearsonRoleFitGoals !== null)
      .sort((a, b) => (a.pearsonRoleFitGoals ?? 1) - (b.pearsonRoleFitGoals ?? 1))[0]

    if (
      worstPearson &&
      worstPearson.pearsonRoleFitGoals !== null &&
      worstPearson.pearsonRoleFitGoals < THRESHOLDS.FRAMEWORK_PEARSON_LOW
    ) {
      return {
        diagnosticType: 'FRAMEWORK',
        trigger: `Las competencias no predicen resultados en ${worstPearson.gerenciaName}`,
        classification:
          'Este no es un problema de ejecución. Es un problema de lo que se mide.',
        implication:
          `Las competencias que se evalúan no predicen los resultados que se entregan ` +
          `en ${worstPearson.gerenciaName}. Lo que el sistema exige no corresponde a lo que el negocio necesita.`,
        path:
          'Antes de intervenir personas, la pregunta es si lo que se mide corresponde a lo que el negocio necesita de ese rol.',
        accountability:
          'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      }
    }

    // ── ALINEADO — cuando la organización está saludable ──
    if (pctDesalineamiento <= 15 && gerenciasRed.length === 0) {
      return {
        diagnosticType: 'ALINEADO',
        trigger: `${100 - pctDesalineamiento}% de coherencia entre evaluación y resultados`,
        classification:
          'La evaluación y los resultados cuentan la misma historia.',
        implication:
          `El ${100 - pctDesalineamiento}% de la organización muestra coherencia entre lo que se evalúa y lo que se entrega. ` +
          `Eso no es casualidad — refleja un sistema de gestión que funciona y evaluadores que conocen a su gente.`,
        path:
          'La base es confiable para tomar decisiones de compensación. El desafío ahora es proteger a quienes sostienen este resultado — ' +
          'y no asumir que el paquete estándar alcanza para retenerlos.',
        accountability:
          'El próximo ciclo confirmará si esta coherencia se mantiene o se erosiona.',
      }
    }

    // ── DESALINEAMIENTO GENERALIZADO (default) ──
    return {
      diagnosticType: 'DESALINEAMIENTO_GENERALIZADO',
      trigger: `${pctDesalineamiento}% de desalineamiento sin factor dominante`,
      classification:
        'El desalineamiento está distribuido sin un factor dominante claro.',
      implication:
        `El ${pctDesalineamiento}% de la organización muestra una contradicción entre capacidad y resultados. ` +
        `No se concentra en una gerencia ni en un evaluador — es un patrón sistémico.`,
      path:
        'El desalineamiento no tiene un solo origen. Las causas se distribuyen entre cómo se evalúa, cómo se miden los resultados, y cómo se conectan ambos.',
      accountability:
        'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
    }
  }
}
