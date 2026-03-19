// ════════════════════════════════════════════════════════════════════════════
// UTILS - CalibrationHealth
// src/app/dashboard/executive-hub/components/CalibrationHealth/CalibrationHealth.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import type { CalibrationData, PortadaNarrative, DistBucket, ChartDataPoint, GerenciaCalibrationStats, TooltipColumn, TooltipData } from './CalibrationHealth.types'

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE ENGINE
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrative(data: CalibrationData): PortadaNarrative {
  const integrity = data.integrityScore

  // Fuente unificada: getCalibrationAlert → DIAGNOSTICS (misma que Tab card)
  const alert = getCalibrationAlert(data.byGerencia || [])

  // PRIORIDAD 1: Sesgo detectado via DIAGNOSTICS
  if (alert.biasType) {
    const diagnostic = DIAGNOSTICS[alert.biasType] || DIAGNOSTICS.SALUDABLE
    return {
      highlight: diagnostic.short,
      suffix: ` en ${alert.entityName}.`,
      ctaLabel: 'Revisar Evaluadores',
      ctaVariant: 'cyan',
      coachingTip: diagnostic.body
    }
  }

  // PRIORIDAD 2: Integridad LOW (incluye penalizaciones por varianza)
  if (integrity && integrity.level === 'LOW') {
    return {
      prefix: 'Solo ',
      highlight: `${integrity.score}% de integridad`,
      suffix: '. ' + integrity.narrative,
      ctaLabel: 'Ver Detalles',
      ctaVariant: 'cyan',
      coachingTip: integrity.penalties.variance?.reason || integrity.penalties.bias?.reason
        || 'Integridad < 50% indica que los datos no son aptos para decisiones de promoción o bono.'
    }
  }

  // PRIORIDAD 3: Integridad MEDIUM
  if (integrity && integrity.level === 'MEDIUM') {
    return {
      statusBadge: { label: `${integrity.score}% Integridad` },
      highlight: `${integrity.score}% de integridad`,
      suffix: '. ' + integrity.narrative,
      ctaLabel: 'Revisar Sesgos',
      ctaVariant: 'cyan',
      coachingTip: integrity.penalties.bias?.reason || integrity.penalties.variance?.reason
        || 'Revisa los sesgos detectados antes de ejecutar presupuesto.'
    }
  }

  // DEFAULT: Todo saludable (HIGH integrity) - usa DIAGNOSTICS.SALUDABLE
  const score = integrity?.score ?? data.overallConfidence
  const diagnostic = DIAGNOSTICS.SALUDABLE
  return {
    statusBadge: { label: `${score}% Integridad`, showCheck: true },
    highlight: diagnostic.short,
    suffix: '. ' + diagnostic.body,
    ctaLabel: 'Revisar Matriz 9-Box',
    ctaVariant: 'cyan',
    coachingTip: 'Con datos calibrados puedes definir promociones y bonos con confianza.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CALCULATIONS
// ════════════════════════════════════════════════════════════════════════════

export function calculateDistributionStats(buckets: DistBucket[], total: number) {
  if (total === 0) return { avg: 0, stdDev: 0 }
  const totalWeighted = buckets.reduce((sum, b) => sum + b.level * b.actualCount, 0)
  const avg = totalWeighted / total
  const variance = buckets.reduce((sum, b) => sum + b.actualCount * Math.pow(b.level - avg, 2), 0) / total
  return {
    avg: Math.round(avg * 100) / 100,
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100
  }
}

export function bucketsToChartData(buckets: DistBucket[]): ChartDataPoint[] {
  return buckets.map(b => ({
    label: b.label,
    target: b.idealPercent,
    real: b.actualPercent,
    count: b.actualCount,
    deviation: b.deviation
  }))
}

export function getStdDevDescription(stdDev: number): string {
  if (stdDev < 0.8) return 'Distribución concentrada. Poca diferenciación.'
  if (stdDev < 1.2) return 'Distribución saludable. Buena diferenciación.'
  return 'Alta dispersión. Revisa criterios de evaluación.'
}

export function getDominantStatus(biasType: string | null | undefined): string {
  if (biasType === 'LENIENCY' || biasType === 'LENIENCY_BIAS') return 'INDULGENTE'
  if (biasType === 'SEVERITY' || biasType === 'SEVERITY_BIAS') return 'SEVERA'
  if (biasType === 'CENTRAL_TENDENCY') return 'CENTRAL'
  return 'OPTIMA'
}

// ════════════════════════════════════════════════════════════════════════════
// SMART FEEDBACK
// ════════════════════════════════════════════════════════════════════════════

export function getSmartFeedback(data: CalibrationData): string {
  const totalEval = Object.values(data.byStatus).reduce((a, b) => a + b, 0)
  const optCount = data.byStatus['OPTIMA'] || 0
  const optPct = totalEval > 0 ? Math.round((optCount / totalEval) * 100) : 0

  const bt = data.bias?.type
  if (bt === 'LENIENCY' || bt === 'LENIENCY_BIAS') {
    return `El ${data.orgDistribution?.buckets?.find(b => b.level >= 4)?.actualPercent || '?'}% de evaluaciones sobre 4.0. Sin diferenciación, el 9-Box colapsa. Calibra antes de decidir.`
  }
  if (bt === 'SEVERITY' || bt === 'SEVERITY_BIAS') {
    return 'Promedio bajo. Verifica si los estándares son realistas o si hay un problema de clima que sesga hacia abajo.'
  }
  if (bt === 'CENTRAL_TENDENCY') {
    return 'Los evaluadores evitan extremos. Esto oculta estrellas y underperformers. Necesitas calibración activa.'
  }
  if (optPct >= 70) {
    return `${optPct}% de evaluadores con distribución óptima. Datos confiables para promoción, bono y desarrollo.`
  }
  return `${totalEval} evaluadores analizados. Revisa gerencias con clasificación SEVERA o INDULGENTE antes de cerrar.`
}

// ════════════════════════════════════════════════════════════════════════════
// DIAGNOSTICS FOCALIZA®
// ════════════════════════════════════════════════════════════════════════════

export interface DiagnosticEntry {
  title: string
  body: string
  short: string
  icon?: 'alert' | 'warning' | 'success' | 'blind' | 'neutral'
  severity?: 'critical' | 'warning' | 'info' | 'success' | 'neutral'
  actionType?: 'view_evaluator' | 'notify_manager' | null
  actionLabel?: string | null
}

export const DIAGNOSTICS: Record<string, DiagnosticEntry> = {
  // ═══════════════════════════════════════════════════════════════════════
  // ORIGINALES — Portada + Tab Card (org-level)
  // ═══════════════════════════════════════════════════════════════════════
  INDULGENTE: {
    title: 'Erosión de la Meritocracia',
    body: 'La mano blanda diluye tu capital estratégico y compromete la objetividad de futuras promociones y beneficios al premiar la complacencia sobre el impacto real.',
    short: 'Erosión de Meritocracia'
  },
  SEVERA: {
    title: 'Asfixia de Talento Estrella',
    body: 'Un estándar de hierro está fracturando el compromiso, elevando el riesgo de fuga inminente de tus perfiles con mayor potencial de ejecución y valor de mercado.',
    short: 'Asfixia de Talento'
  },
  CENTRAL: {
    title: 'Pérdida de Resolución en Liderazgo',
    body: 'La zona gris invisibiliza el mérito, impidiendo distinguir la excelencia y ocultando brechas críticas que frenan la velocidad y el desarrollo de tu organización.',
    short: 'Pérdida de Resolución'
  },
  SALUDABLE: {
    title: 'Calibración Ejecutiva Validada',
    body: 'Tus evaluadores están diferenciando talento con criterios consistentes. Los datos son confiables para ejecutar decisiones de compensación, promoción y desarrollo.',
    short: 'Calibración Validada'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TAB 2 — Diagnósticos por Gerencia (granulares)
  // ═══════════════════════════════════════════════════════════════════════
  SEVERA_PARCIAL: {
    title: 'Evaluador Severo Detectado',
    body: '{count} de {total} evalúa con estándar muy alto. Su equipo puede estar subvalorado.',
    short: '{count} severo',
    icon: 'warning',
    severity: 'warning',
    actionType: 'view_evaluator',
    actionLabel: 'Ver quién es'
  },
  ASFIXIA_TOTAL: {
    title: 'Asfixia de Talento',
    body: 'Todos los evaluadores tienen estándares muy altos. El equipo completo puede estar subvalorado.',
    short: 'Todos severos',
    icon: 'alert',
    severity: 'critical',
    actionType: 'view_evaluator',
    actionLabel: 'Ver evaluadores'
  },
  INDULGENTE_PARCIAL: {
    title: 'Evaluador Indulgente Detectado',
    body: '{count} de {total} da notas muy altas. Puede estar inflando resultados.',
    short: '{count} indulgente',
    icon: 'warning',
    severity: 'warning',
    actionType: 'view_evaluator',
    actionLabel: 'Ver quién es'
  },
  TODOS_APRUEBAN: {
    title: 'Todos Aprueban',
    body: 'Todos los evaluadores dan notas muy altas. No se distingue quién realmente destaca.',
    short: 'Todos indulgentes',
    icon: 'alert',
    severity: 'critical',
    actionType: 'view_evaluator',
    actionLabel: 'Ver evaluadores'
  },
  PUNTO_CIEGO: {
    title: 'Punto Ciego',
    body: 'Sin evaluaciones en este ciclo. No hay datos para validar justicia en esta área.',
    short: 'Sin datos',
    icon: 'blind',
    severity: 'neutral',
    actionType: 'notify_manager',
    actionLabel: 'Notificar Gerente'
  },
  ZONA_GRIS: {
    title: 'Zona Gris',
    body: 'Evaluaciones concentradas en el medio. Poca diferenciación entre alto y bajo desempeño.',
    short: 'Tendencia central',
    icon: 'neutral',
    severity: 'info',
    actionType: 'view_evaluator',
    actionLabel: 'Ver detalle'
  },
  CALIBRACION_SANA: {
    title: 'Calibración Sana',
    body: 'Los evaluadores diferencian bien el desempeño. Distribución saludable.',
    short: 'Saludable',
    icon: 'success',
    severity: 'success',
    actionType: null,
    actionLabel: null
  },
  DISTRIBUCION_MIXTA: {
    title: 'Distribución Mixta',
    body: 'Hay variedad en los estilos de evaluación.',
    short: 'Mixto',
    icon: 'neutral',
    severity: 'info',
    actionType: 'view_evaluator',
    actionLabel: 'Ver detalle'
  }
}

export function getDiagnosticNarrative(
  biasType: string | null,
  entityName: string
): { title: string; body: string; short: string } {
  const key = biasType === 'LENIENCY' || biasType === 'LENIENCY_BIAS' ? 'INDULGENTE' :
              biasType === 'SEVERITY' || biasType === 'SEVERITY_BIAS' ? 'SEVERA' :
              biasType === 'CENTRAL_TENDENCY' ? 'CENTRAL' :
              biasType || 'SALUDABLE'

  const diagnostic = DIAGNOSTICS[key] || DIAGNOSTICS.SALUDABLE

  return {
    title: key === 'SALUDABLE'
      ? `Diagnóstico Focaliza\u00AE: ${diagnostic.title}`
      : `Diagnóstico Focaliza\u00AE: ${diagnostic.title} en ${entityName}`,
    body: diagnostic.body,
    short: key === 'SALUDABLE'
      ? diagnostic.short
      : `${diagnostic.short} en ${entityName}`
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ALERT HIERARCHY
// ════════════════════════════════════════════════════════════════════════════

export interface CalibrationAlert {
  priority: 1 | 2 | 3
  level: 'gerencia' | 'departamento' | 'healthy'
  entityName: string
  parentName?: string
  biasType: 'SEVERA' | 'INDULGENTE' | 'CENTRAL' | null
  narrative: { title: string; body: string; short: string }
}

export function getCalibrationAlert(
  byGerencia: GerenciaCalibrationStats[]
): CalibrationAlert {

  const severityOrder: Record<string, number> = {
    SEVERA: 3, SEVERITY: 3,
    INDULGENTE: 2, LENIENCY: 2,
    CENTRAL: 1, CENTRAL_TENDENCY: 1
  }

  // PRIORIDAD 1: gerencia con sesgo
  const gerenciasConSesgo = byGerencia
    .filter(g => g.status && g.status !== 'OPTIMA' && g.evaluatorCount > 0)
    .sort((a, b) => (severityOrder[b.status!] || 0) - (severityOrder[a.status!] || 0))

  if (gerenciasConSesgo.length > 0) {
    const peor = gerenciasConSesgo[0]
    const biasType = peor.status as 'SEVERA' | 'INDULGENTE' | 'CENTRAL'
    return {
      priority: 1,
      level: 'gerencia',
      entityName: peor.gerenciaName,
      biasType,
      narrative: getDiagnosticNarrative(biasType, peor.gerenciaName)
    }
  }

  // PRIORIDAD 2: departamento con sesgo en gerencia saludable
  for (const gerencia of byGerencia) {
    if (!gerencia.departments || gerencia.evaluatorCount === 0) continue

    const deptsConSesgo = gerencia.departments
      .filter(d => d.status && d.status !== 'OPTIMA' && d.evaluatorCount > 0)
      .sort((a, b) => (severityOrder[b.status!] || 0) - (severityOrder[a.status!] || 0))

    if (deptsConSesgo.length > 0) {
      const peor = deptsConSesgo[0]
      const biasType = peor.status as 'SEVERA' | 'INDULGENTE' | 'CENTRAL'
      return {
        priority: 2,
        level: 'departamento',
        entityName: peor.departmentName,
        parentName: gerencia.gerenciaName,
        biasType,
        narrative: getDiagnosticNarrative(biasType, peor.departmentName)
      }
    }
  }

  // PRIORIDAD 3: todo saludable
  return {
    priority: 3,
    level: 'healthy',
    entityName: 'Organización',
    biasType: null,
    narrative: getDiagnosticNarrative(null, '')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA DIAGNOSTIC (Tab 2)
// ════════════════════════════════════════════════════════════════════════════

export interface GerenciaDiagnosticResult {
  key: string
  title: string
  body: string
  short: string
  icon: 'alert' | 'warning' | 'success' | 'blind' | 'neutral'
  severity: 'critical' | 'warning' | 'info' | 'success' | 'neutral'
  action: {
    type: 'view_evaluator' | 'notify_manager'
    label: string
  } | null
}

/**
 * Determina el diagnóstico correcto para una gerencia basado en sus datos.
 * Prioridad: Sin datos > Severos > Indulgentes > Central > Mixto > Sano
 */
export function getGerenciaDiagnostic(data: GerenciaCalibrationStats): GerenciaDiagnosticResult {
  const { counts, evaluatorCount } = data

  const buildResult = (key: string): GerenciaDiagnosticResult => {
    const d = DIAGNOSTICS[key] || DIAGNOSTICS.DISTRIBUCION_MIXTA
    return {
      key,
      title: d.title,
      body: d.body
        .replace('{count}', String(counts.SEVERA || counts.INDULGENTE))
        .replace('{total}', String(evaluatorCount)),
      short: d.short
        .replace('{count}', String(counts.SEVERA || counts.INDULGENTE)),
      icon: d.icon || 'neutral',
      severity: d.severity || 'info',
      action: d.actionType ? { type: d.actionType, label: d.actionLabel! } : null
    }
  }

  // CASO 1: Sin datos
  if (evaluatorCount === 0) return buildResult('PUNTO_CIEGO')

  // CASO 2: Tiene evaluadores SEVEROS
  if (counts.SEVERA > 0) {
    return buildResult(counts.SEVERA === evaluatorCount ? 'ASFIXIA_TOTAL' : 'SEVERA_PARCIAL')
  }

  // CASO 3: Tiene evaluadores INDULGENTES
  if (counts.INDULGENTE > 0) {
    return buildResult(counts.INDULGENTE === evaluatorCount ? 'TODOS_APRUEBAN' : 'INDULGENTE_PARCIAL')
  }

  // CASO 4: Mayoría CENTRAL
  if (counts.CENTRAL > counts.OPTIMA) return buildResult('ZONA_GRIS')

  // CASO 5: Mayoría ÓPTIMA (>=80%)
  if (counts.OPTIMA >= evaluatorCount * 0.8) return buildResult('CALIBRACION_SANA')

  // CASO 6: Mixto (default)
  return buildResult('DISTRIBUCION_MIXTA')
}

/**
 * Genera resumen ejecutivo para el header del Tab 2
 */
export function getTabSummary(gerencias: GerenciaCalibrationStats[]): {
  alertCount: number
  blindCount: number
  healthyCount: number
  headline: string
} {
  const withData = gerencias.filter(g => g.evaluatorCount > 0)
  const blindCount = gerencias.filter(g => g.evaluatorCount === 0).length

  const alertCount = withData.filter(g =>
    g.counts.SEVERA > 0 || g.counts.INDULGENTE > 0
  ).length

  const healthyCount = withData.filter(g =>
    g.counts.OPTIMA >= g.evaluatorCount * 0.8
  ).length

  let headline = ''
  if (alertCount > 0 && blindCount > 0) {
    headline = `${alertCount} con alertas · ${blindCount} sin datos`
  } else if (alertCount > 0) {
    headline = `${alertCount} gerencia${alertCount > 1 ? 's' : ''} requiere${alertCount > 1 ? 'n' : ''} atención`
  } else if (blindCount > 0) {
    headline = `${blindCount} gerencia${blindCount > 1 ? 's' : ''} sin evaluaciones`
  } else {
    headline = 'Todas las gerencias con calibración saludable'
  }

  return { alertCount, blindCount, healthyCount, headline }
}

// ════════════════════════════════════════════════════════════════════════════
// CELL TOOLTIP (Tab 2 — por celda)
// ════════════════════════════════════════════════════════════════════════════

export function getTooltipForCell(
  col: TooltipColumn,
  gerencia: GerenciaCalibrationStats
): TooltipData {
  const { counts, evaluatorCount, gerenciaName } = gerencia
  const total = evaluatorCount

  if (col === 'EMPTY') {
    const d = DIAGNOSTICS.PUNTO_CIEGO
    return {
      title: d.title,
      body: `${gerenciaName} no tiene evaluadores asignados en este ciclo.`,
      action: d.actionType ? { label: d.actionLabel!, type: d.actionType } : undefined
    }
  }

  if (col === 'SALUD') {
    const pct = Math.round((counts.OPTIMA / total) * 100)
    if (pct >= 80) {
      return { title: DIAGNOSTICS.CALIBRACION_SANA.title, body: `${counts.OPTIMA} de ${total} evaluadores diferencian bien el desempeño.` }
    }
    if (pct >= 50) {
      return { title: 'Atención Requerida', body: `Solo ${counts.OPTIMA} de ${total} evalúan con precisión óptima. Revisa los sesgos detectados.`, action: { label: 'Revisar Sesgos', type: 'view_evaluator' } }
    }
    return { title: 'Calibración Crítica', body: `${counts.OPTIMA} de ${total} evalúan correctamente. La mayoría presenta sesgos.`, action: { label: 'Calibrar Urgente', type: 'view_evaluator' } }
  }

  if (col === 'OPTIMA') {
    return { title: 'Evaluación Óptima', body: `${counts.OPTIMA} de ${total} diferencian bien entre alto y bajo desempeño.` }
  }

  if (col === 'CENTRAL') {
    if (counts.CENTRAL === 0) return { title: 'Sin Tendencia Central', body: 'Ningún evaluador agrupa notas excesivamente en el medio.' }
    const d = DIAGNOSTICS.ZONA_GRIS
    return { title: d.title, body: `${counts.CENTRAL} de ${total} ${counts.CENTRAL === 1 ? 'asigna' : 'asignan'} notas similares a todos.`, action: { label: 'Ver quién es', type: 'view_evaluator' } }
  }

  if (col === 'SEVERA') {
    if (counts.SEVERA === 0) return { title: 'Sin Sesgo de Severidad', body: 'Ningún evaluador concentra notas en el rango inferior.' }
    const d = DIAGNOSTICS.SEVERA_PARCIAL
    return {
      title: d.title,
      body: d.body.replace('{count}', String(counts.SEVERA)).replace('{total}', String(total)),
      action: d.actionType ? { label: d.actionLabel!, type: d.actionType } : undefined
    }
  }

  if (col === 'INDULGENTE') {
    if (counts.INDULGENTE === 0) return { title: 'Sin Sesgo de Indulgencia', body: 'Ningún evaluador presenta sobrevaloración sistemática.' }
    const d = DIAGNOSTICS.INDULGENTE_PARCIAL
    return {
      title: d.title,
      body: d.body.replace('{count}', String(counts.INDULGENTE)).replace('{total}', String(total)),
      action: d.actionType ? { label: d.actionLabel!, type: d.actionType } : undefined
    }
  }

  return { title: '', body: '' }
}

export function getTeslaLineColor(
  evaluatorCount: number,
  healthPct: number | null,
  hasAlert: boolean
): string {
  if (evaluatorCount === 0 || healthPct === null) return 'bg-slate-600'
  if (healthPct >= 80) return 'bg-emerald-500'
  if (healthPct >= 50 || hasAlert) return 'bg-amber-500'
  return 'bg-red-500'
}
