// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE NARRATIVE SERVICE
// src/lib/services/ExecutiveNarrativeService.ts
// ════════════════════════════════════════════════════════════════════════════
// Transforma métricas en narrativas ejecutivas contextuales
// Diferenciadas por rol (CEO vs AREA_MANAGER)
// Smart Router: Prioriza la narrativa más urgente
// ════════════════════════════════════════════════════════════════════════════

import {
  getRoleFitClassification,
  RoleFitLevel,
  TALENT_INTELLIGENCE_THRESHOLDS
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ExecutiveNarrative {
  headline: string
  subheadline: string
  level: RoleFitLevel | null
  cta: { label: string; destination: string }
  severity: 'ok' | 'warning' | 'critical'
}

export interface ExecutiveHubData {
  alertas: { criticas: number; altas: number }
  calibracion: { confianza: number; worstDepartment?: string; worstManager?: string }
  capacidades: {
    roleFit: number
    worstLayer?: string
    worstGerencia?: string
  }
  talento?: {
    starsPercent: number
    concentration?: string
  }
  sucesion: { cobertura: number; sinCobertura: string[] }
}

type NarrativeRole = 'CEO' | 'AREA_MANAGER'

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE MAPS
// ════════════════════════════════════════════════════════════════════════════

const ROLE_FIT_EXECUTIVE_NARRATIVES: Record<string, Record<NarrativeRole, { headline: string; subheadline: string }>> = {
  [RoleFitLevel.RISK]: {
    CEO: {
      headline: 'Incompatibilidad estratégica detectada',
      subheadline: 'La estrategia es inejecutable con el talento disponible'
    },
    AREA_MANAGER: {
      headline: 'Tu equipo está en modo supervivencia',
      subheadline: 'No tienes las herramientas mínimas para el cargo'
    }
  },
  [RoleFitLevel.GAP]: {
    CEO: {
      headline: 'Desajuste crítico en capacidades',
      subheadline: 'Riesgo de pérdida de EBITDA por brechas de competencias'
    },
    AREA_MANAGER: {
      headline: 'Brechas significativas en tu equipo',
      subheadline: 'Requiere intervención inmediata de L&D'
    }
  },
  [RoleFitLevel.DEVELOPING]: {
    CEO: {
      headline: 'Operas con el freno de mano puesto',
      subheadline: 'Los objetivos se cumplen a un costo de supervisión altísimo'
    },
    AREA_MANAGER: {
      headline: 'Gastas tiempo corrigiendo brechas básicas',
      subheadline: 'Tu capacidad de escalar procesos es limitada'
    }
  },
  [RoleFitLevel.SOLID]: {
    CEO: {
      headline: 'Zona de confort competitiva',
      subheadline: 'La organización puede absorber nuevos desafíos'
    },
    AREA_MANAGER: {
      headline: 'Equipo autónomo',
      subheadline: 'Puedes delegar y enfocarte en mejoras tácticas'
    }
  },
  [RoleFitLevel.OPTIMAL]: {
    CEO: {
      headline: 'Elite de ejecución',
      subheadline: 'Peligro de fuga por aburrimiento si no hay nuevos desafíos'
    },
    AREA_MANAGER: {
      headline: 'Riesgo de estancamiento',
      subheadline: 'Tus colaboradores necesitan promoción o rotación'
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class ExecutiveNarrativeService {

  // ══════════════════════════════════════════════════════════════════════════
  // ROLE FIT NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  static getRoleFitNarrative(
    score: number,
    role: NarrativeRole,
    context?: { worstLayer?: string; worstGerencia?: string; gap?: number }
  ): ExecutiveNarrative {
    const classification = getRoleFitClassification(score)
    const narrative = ROLE_FIT_EXECUTIVE_NARRATIVES[classification.level]?.[role]
      || ROLE_FIT_EXECUTIVE_NARRATIVES[RoleFitLevel.DEVELOPING][role]

    let severity: 'ok' | 'warning' | 'critical' = 'ok'
    if (classification.level === RoleFitLevel.RISK || classification.level === RoleFitLevel.GAP) {
      severity = 'critical'
    } else if (classification.level === RoleFitLevel.DEVELOPING) {
      severity = 'warning'
    }

    let subheadline = narrative.subheadline
    if (context?.worstLayer && context?.worstGerencia) {
      subheadline += ` ${context.worstLayer} de ${context.worstGerencia} arrastran tu score.`
    }

    return {
      headline: narrative.headline,
      subheadline,
      level: classification.level as RoleFitLevel,
      severity,
      cta: this.getCTAForLevel(classification.level as RoleFitLevel)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ALERT NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  static getAlertNarrative(
    criticalCount: number,
    highCount: number,
    role: NarrativeRole
  ): ExecutiveNarrative {
    const total = criticalCount + highCount

    if (total === 0) {
      return {
        headline: role === 'CEO' ? 'Sin alertas críticas hoy' : 'Tu equipo está estable',
        subheadline: 'No hay situaciones que requieran intervención inmediata',
        level: null,
        severity: 'ok',
        cta: { label: 'Ver Detalle', destination: 'alertas' }
      }
    }

    const headline = role === 'CEO'
      ? `${total} alerta${total > 1 ? 's' : ''} requiere${total > 1 ? 'n' : ''} intervención inmediata`
      : `Tu área tiene ${total} situación${total > 1 ? 'es' : ''} crítica${total > 1 ? 's' : ''} sin resolver`

    const parts: string[] = []
    if (criticalCount > 0) parts.push(`${criticalCount} crítica${criticalCount > 1 ? 's' : ''} (SLA 48h)`)
    if (highCount > 0) parts.push(`${highCount} alta${highCount > 1 ? 's' : ''} (SLA 72h)`)

    return {
      headline,
      subheadline: parts.join(' + '),
      level: null,
      severity: criticalCount > 0 ? 'critical' : 'warning',
      cta: { label: 'Ver Alertas', destination: 'alertas' }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALIBRATION NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  static getCalibrationNarrative(
    confidencePercent: number,
    role: NarrativeRole,
    context?: { worstDepartment?: string; worstManager?: string }
  ): ExecutiveNarrative {
    if (confidencePercent >= 80) {
      return {
        headline: role === 'CEO'
          ? 'Datos válidos para decisiones de talento'
          : 'Tu equipo de evaluadores está calibrado',
        subheadline: `${confidencePercent}% de confianza en los datos`,
        level: null,
        severity: 'ok',
        cta: { label: 'Ver Calibración', destination: 'calibracion' }
      }
    }

    if (confidencePercent >= 60) {
      let subheadline = 'Algunos evaluadores presentan sesgo significativo'
      if (context?.worstManager) {
        subheadline = `Revisa a ${context.worstManager} antes de cerrar calibración`
      } else if (context?.worstDepartment) {
        subheadline = `Revisa a ${context.worstDepartment} antes de cerrar calibración`
      }
      return {
        headline: role === 'CEO'
          ? 'Confianza moderada en datos'
          : 'Revisa antes de decidir',
        subheadline,
        level: null,
        severity: 'warning',
        cta: { label: 'Revisar Calibración', destination: 'calibracion' }
      }
    }

    return {
      headline: role === 'CEO'
        ? 'Datos poco confiables para tomar decisiones'
        : 'Tus evaluadores tienen alto sesgo',
      subheadline: `Solo ${confidencePercent}% de confianza — revisar antes de decidir`,
      level: null,
      severity: 'critical',
      cta: { label: 'Corregir Calibración', destination: 'calibracion' }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TALENT NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  static getTalentNarrative(
    starsPercent: number,
    role: NarrativeRole,
    context?: { concentration?: string }
  ): ExecutiveNarrative {
    let severity: 'ok' | 'warning' | 'critical' = 'ok'
    let headline: string
    let subheadline: string

    if (starsPercent >= 15) {
      headline = role === 'CEO'
        ? `${starsPercent}% estrellas — Pipeline de talento sano`
        : `${starsPercent}% de tu equipo es top talent`
      subheadline = 'Concentración saludable de alto potencial'
    } else if (starsPercent >= 8) {
      severity = 'warning'
      headline = role === 'CEO'
        ? `${starsPercent}% estrellas — Zona de alerta`
        : `Solo ${starsPercent}% de tu equipo destaca`
      subheadline = 'Pipeline de talento en riesgo de debilitarse'
    } else {
      severity = 'critical'
      headline = role === 'CEO'
        ? `Solo ${starsPercent}% estrellas — Riesgo organizacional`
        : `${starsPercent}% — Tu equipo carece de diferenciación`
      subheadline = 'Urgente: fortalecer pipeline de alto potencial'
    }

    if (context?.concentration) {
      subheadline += ` Concentrados en ${context.concentration}.`
    }

    return {
      headline,
      subheadline,
      level: null,
      severity,
      cta: { label: 'Ver 9-Box', destination: 'talento' }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUCCESSION NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  static getSuccessionNarrative(
    coveragePercent: number,
    uncoveredRoles: string[],
    role: NarrativeRole
  ): ExecutiveNarrative {
    if (uncoveredRoles.length === 0 && coveragePercent >= 80) {
      return {
        headline: role === 'CEO'
          ? `${coveragePercent}% de roles críticos cubiertos`
          : 'Tu pipeline de sucesión está saludable',
        subheadline: 'Cobertura adecuada para continuidad operativa',
        level: null,
        severity: 'ok',
        cta: { label: 'Ver Sucesión', destination: 'sucesion' }
      }
    }

    const count = uncoveredRoles.length
    const headline = role === 'CEO'
      ? `${count} rol${count > 1 ? 'es' : ''} crítico${count > 1 ? 's' : ''} sin sucesor`
      : count > 0
        ? `${uncoveredRoles[0]} no tiene reemplazo definido`
        : `Solo ${coveragePercent}% de cobertura`

    return {
      headline,
      subheadline: count > 1
        ? `Incluye: ${uncoveredRoles.slice(0, 3).join(', ')}`
        : 'Plan de desarrollo acelerado requerido',
      level: null,
      severity: count > 2 ? 'critical' : 'warning',
      cta: { label: 'Ver Sucesión', destination: 'sucesion' }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SMART ROUTER: Retorna LA narrativa más urgente
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Prioridad:
   * 1. Alertas críticas (RED)
   * 2. Calibración < 60% (datos no confiables)
   * 3. Roles sin sucesor
   * 4. Role Fit < 75% (bajo SOLID threshold)
   * 5. Default: Role Fit narrativa positiva
   */
  static getMissionNarrative(
    data: ExecutiveHubData,
    role: NarrativeRole
  ): ExecutiveNarrative {

    // PRIORIDAD 1: Alertas críticas
    if (data.alertas.criticas > 0) {
      return this.getAlertNarrative(data.alertas.criticas, data.alertas.altas, role)
    }

    // PRIORIDAD 2: Datos no confiables
    if (data.calibracion.confianza < 60) {
      return this.getCalibrationNarrative(
        data.calibracion.confianza,
        role,
        { worstDepartment: data.calibracion.worstDepartment, worstManager: data.calibracion.worstManager }
      )
    }

    // PRIORIDAD 3: Roles sin sucesor
    if (data.sucesion.sinCobertura.length > 0) {
      return this.getSuccessionNarrative(
        data.sucesion.cobertura,
        data.sucesion.sinCobertura,
        role
      )
    }

    // PRIORIDAD 4: Role Fit bajo (< SOLID threshold)
    if (data.capacidades.roleFit < TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH) {
      return this.getRoleFitNarrative(data.capacidades.roleFit, role, {
        worstLayer: data.capacidades.worstLayer,
        worstGerencia: data.capacidades.worstGerencia
      })
    }

    // PRIORIDAD 5: Talento con concentración riesgosa
    if (data.talento && data.talento.starsPercent < 8) {
      return this.getTalentNarrative(data.talento.starsPercent, role, {
        concentration: data.talento.concentration
      })
    }

    // DEFAULT: Organización saludable (include talent context if available)
    return this.getRoleFitNarrative(data.capacidades.roleFit, role)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  private static getCTAForLevel(level: RoleFitLevel): { label: string; destination: string } {
    switch (level) {
      case RoleFitLevel.RISK:
      case RoleFitLevel.GAP:
        return { label: 'Ver Brechas Críticas', destination: 'capacidades' }
      case RoleFitLevel.DEVELOPING:
        return { label: 'Ver Brechas', destination: 'capacidades' }
      case RoleFitLevel.SOLID:
        return { label: 'Ver Oportunidades', destination: 'capacidades' }
      case RoleFitLevel.OPTIMAL:
        return { label: 'Ver Pipeline', destination: 'sucesion' }
      default:
        return { label: 'Ver Detalle', destination: 'capacidades' }
    }
  }
}

export default ExecutiveNarrativeService
