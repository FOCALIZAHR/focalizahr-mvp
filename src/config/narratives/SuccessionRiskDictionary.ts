// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION RISK DICTIONARY — Motor 4
// src/config/narratives/SuccessionRiskDictionary.ts
//
// Versión: 2.0 — Lógica Binaria Enterprise
//
// CONTEXTO:
// Genera el Párrafo 4 de la narrativa maestra del P&L del Talento.
// Evalúa cargos críticos con lógica binaria:
// ¿Hay sucesor listo para asumir HOY (readiness === 'READY_NOW') o no?
//
// 4 COMBINACIONES POSIBLES:
// A: Fit >= 75% + HAY sucesor inmediato  → Blindaje Completo
// B: Fit >= 75% + NO HAY sucesor         → Vulnerabilidad de Dependencia
// C: Fit <  75% + HAY sucesor inmediato  → Riesgo Mitigado
// D: Fit <  75% + NO HAY sucesor         → Máxima Urgencia
//
// TONO:
// — Directo, sin rodeos
// — Usa "tu/tus" — no "la empresa"
// — Siempre recuerda que los cargos críticos son el motor del negocio
// — Cuantifica siempre con números concretos
// — Una idea por oración
// ════════════════════════════════════════════════════════════════════════════

export interface SuccessionMetrics {
  totalCriticalPositions: number    // Total cargos críticos
  avgFitCriticos: number            // RoleFit promedio (0-100)
  withImmediateSuccessor: number    // Cantidad con readiness === 'READY_NOW'
  withoutImmediateSuccessor: number // Cantidad sin sucesor inmediato
}

// ════════════════════════════════════════════════════════════════════════════
// LAS 4 NARRATIVAS DEFINITIVAS
// ════════════════════════════════════════════════════════════════════════════

function buildNarrative(data: SuccessionMetrics): string {
  const {
    avgFitCriticos,
    withImmediateSuccessor,
    withoutImmediateSuccessor,
  } = data

  const fitOk = avgFitCriticos >= 75
  const hayInmediato = withImmediateSuccessor > 0

  // ──────────────────────────────────────────────────────────────────────────
  // A — Fit >= 75% + HAY sucesor inmediato → Blindaje Completo
  // ──────────────────────────────────────────────────────────────────────────
  if (fitOk && hayInmediato) {
    return (
      'Tus cargos críticos, que son el motor de la operación y los resultados, ' +
      'rinden al nivel esperado y cuentan con sucesores listos para asumir hoy. ' +
      'La continuidad del negocio tiene respaldo real.'
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // B — Fit >= 75% + NO HAY sucesor inmediato → Vulnerabilidad de Dependencia
  // ──────────────────────────────────────────────────────────────────────────
  if (fitOk && !hayInmediato) {
    return (
      'Tus cargos críticos, que son el motor de la operación y los resultados, ' +
      'rinden al nivel esperado, pero existe una vulnerabilidad oculta: ' +
      'si alguno sale, no tienes sucesores listos para asumir hoy, ' +
      'dejándote sin respuesta inmediata.'
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // C — Fit < 75% + HAY sucesor inmediato → Riesgo Mitigado
  // ──────────────────────────────────────────────────────────────────────────
  if (!fitOk && hayInmediato) {
    return (
      'Debe ser una alerta prioritaria que tus cargos críticos no estén rindiendo, ' +
      'ya que son el motor de la operación y los resultados. ' +
      `Afortunadamente, para ${withImmediateSuccessor} de estas posiciones ` +
      'tienes un sucesor listo para asumir hoy, ' +
      'lo que permite ejecutar el recambio apenas lo decidas.'
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // D — Fit < 75% + NO HAY sucesor inmediato → Máxima Urgencia
  // ──────────────────────────────────────────────────────────────────────────
  return (
    'Debe ser una alerta prioritaria que tus cargos críticos no estén rindiendo, ' +
    'ya que son el motor de la operación y los resultados. ' +
    `La gravedad se dispara al constatar que ${withoutImmediateSuccessor} de estas posiciones ` +
    'no tienen sucesor inmediato. ' +
    'Reemplazarlos hoy requiere salir al mercado, ' +
    'dejándote sin respuesta preparada para proteger la operación.'
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO EXPORTADO
// ════════════════════════════════════════════════════════════════════════════

export const SUCCESSION_RISK_DICTIONARY = {

  /**
   * Motor 4 completo — lógica binaria enterprise
   * Genera el Párrafo 4 de la narrativa maestra del P&L del Talento
   *
   * @param data — métricas de cargos críticos y sucesión
   *
   * Uso:
   *   const parrafo4 = SUCCESSION_RISK_DICTIONARY.buildFullNarrative({
   *     totalCriticalPositions: 10,
   *     avgFitCriticos: 68,
   *     withImmediateSuccessor: 3,
   *     withoutImmediateSuccessor: 7,
   *   })
   */
  buildFullNarrative: (data: SuccessionMetrics): string => {
    return buildNarrative(data)
  },

  /**
   * Utilidad — detectar combinación activa
   * Útil para el frontend si necesita el tipo para estilos visuales
   */
  getCombinationType: (
    avgFit: number,
    withImmediateSuccessor: number
  ): 'A' | 'B' | 'C' | 'D' => {
    const fitOk = avgFit >= 75
    const hayInmediato = withImmediateSuccessor > 0
    if (fitOk && hayInmediato) return 'A'
    if (fitOk && !hayInmediato) return 'B'
    if (!fitOk && hayInmediato) return 'C'
    return 'D'
  },
}