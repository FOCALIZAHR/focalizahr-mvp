// ═══════════════════════════════════════════════════════════════════════════
// src/config/tacLabels.ts
// Fuente unica de verdad para labels del TAC Cinema Mode
// ═══════════════════════════════════════════════════════════════════════════

export const PATTERN_LABELS: Record<string, string> = {
  FRAGIL: 'Conocimiento en riesgo critico',
  QUEMADA: 'Equipo en sobrecarga',
  ESTANCADA: 'Equipo sin desarrollo',
  RIESGO_OCULTO: 'Riesgo invisible',
  EN_TRANSICION: 'Equipo en rotacion',
  SALUDABLE: 'Equipo modelo · Fabrica de Talento',
}

export const QUADRANT_LABELS: Record<string, string> = {
  FUGA_CEREBROS: 'Talento en riesgo de irse',
  BURNOUT_RISK: 'Equipo sobrecargado',
  MOTOR_EQUIPO: 'Pilar del equipo',
  BAJO_RENDIMIENTO: 'Requiere conversacion',
  EN_DESARROLLO: 'En formacion',
}

// Narrativa corta por cuadrante — lenguaje CEO, una línea
export const QUADRANT_NARRATIVES: Record<string, string> = {
  FUGA_CEREBROS: 'Dominan su cargo pero estan desconectados.',
  BURNOUT_RISK: 'Alta energia que no se convierte en resultado.',
  BAJO_RENDIMIENTO: 'Necesitan una conversacion antes de cualquier otra accion.',
  MOTOR_EQUIPO: 'Los mas valiosos — y los que mas facil se pierden si no se gestionan.',
  EN_DESARROLLO: 'En camino, necesitan tiempo y direccion.',
}

export function getQuadrantNarrative(quadrant: string): string {
  return QUADRANT_NARRATIVES[quadrant] || 'Señal detectada.'
}

/**
 * Narrativa CEO del ADN Organizacional.
 * Toma los datos del backend (topStrength, topDevelopment) y genera texto ejecutivo.
 */
export function getOrgDNANarrative(
  topStrength: { competency: string; avgTarget: number; expected?: number; gap?: number } | null,
  topDevelopment: { competency: string; avgTarget: number; expected?: number; gap?: number } | null
): string {
  // ESTADO 1 — Sin datos
  if (!topStrength && !topDevelopment) {
    return 'Sin evaluaciones suficientes para determinar el ADN organizacional.'
  }

  // ESTADO 2 — Fortaleza + Oportunidad (caso más común)
  if (topStrength && topDevelopment) {
    if (topStrength.gap !== undefined && topDevelopment.gap !== undefined) {
      const gapPositivo = topStrength.gap.toFixed(1)
      const gapNegativo = Math.abs(topDevelopment.gap).toFixed(1)
      return `Tu organizacion supera lo esperado en ${topStrength.competency} — ` +
             `el equipo rinde ${gapPositivo} puntos sobre el estandar. ` +
             `La brecha mas critica está en ${topDevelopment.competency}: ` +
             `${gapNegativo} puntos bajo lo que el cargo exige. ` +
             `Cerrar esta brecha impacta a toda la operacion.`
    }
    return `Tu organizacion destaca en ${topStrength.competency}. ` +
           `Tu mayor oportunidad es ${topDevelopment.competency} — ` +
           `cerrar esta brecha impacta a toda la operacion.`
  }

  // ESTADO 3 — Solo Oportunidad (ninguna competencia supera el estándar)
  if (!topStrength && topDevelopment) {
    if (topDevelopment.gap !== undefined) {
      const gapNegativo = Math.abs(topDevelopment.gap).toFixed(1)
      return `Ninguna competencia supera el estandar esperado aun. ` +
             `La brecha mas urgente está en ${topDevelopment.competency}: ` +
             `${gapNegativo} puntos bajo lo que el cargo exige. ` +
             `Es el punto de partida antes de hablar de fortalezas.`
    }
    return `La prioridad es ${topDevelopment.competency} — ` +
           `el rendimiento actual no alcanza el estandar esperado.`
  }

  // ESTADO 4 — Solo Fortaleza (sin oportunidad identificada)
  if (topStrength && !topDevelopment) {
    if (topStrength.gap !== undefined) {
      const gapPositivo = topStrength.gap.toFixed(1)
      return `Tu organizacion supera lo esperado en ${topStrength.competency} — ` +
             `${gapPositivo} puntos sobre el estandar. ` +
             `Sin brechas criticas identificadas en este ciclo.`
    }
    return `Tu organizacion destaca en ${topStrength.competency}. ` +
           `Sin brechas criticas identificadas en este ciclo.`
  }

  return 'Sin datos suficientes para determinar el ADN organizacional.'
}

/**
 * Versión short: solo gap + consecuencia, sin nombres de competencia.
 * Para usar cuando el título hero ya muestra los nombres.
 */
export function getOrgDNANarrativeShort(
  topStrength: { competency: string; avgTarget: number; expected?: number; gap?: number } | null,
  topDevelopment: { competency: string; avgTarget: number; expected?: number; gap?: number } | null
): string {
  if (!topStrength && !topDevelopment) {
    return 'Sin evaluaciones suficientes.'
  }

  if (topStrength && topDevelopment) {
    if (topStrength.gap !== undefined && topDevelopment.gap !== undefined) {
      const gapPositivo = topStrength.gap.toFixed(1)
      const gapNegativo = Math.abs(topDevelopment.gap).toFixed(1)
      return `El equipo supera el estandar en ${gapPositivo} puntos. ` +
             `La brecha de oportunidad está${gapNegativo} puntos bajo lo exigido. ` +
             `Cerrar esa diferencia impacta a toda la operacion.`
    }
    return 'Cerrar la brecha impacta a toda la operacion.'
  }

  if (!topStrength && topDevelopment) {
    if (topDevelopment.gap !== undefined) {
      const gapNegativo = Math.abs(topDevelopment.gap).toFixed(1)
      return `Ninguna competencia supera el estandar aun. ` +
             `La brecha mas urgente está${gapNegativo} puntos bajo lo que el cargo exige. ` +
             `Es el punto de partida antes de hablar de fortalezas.`
    }
    return 'El rendimiento actual no alcanza el estandar esperado.'
  }

  if (topStrength && !topDevelopment) {
    if (topStrength.gap !== undefined) {
      const gapPositivo = topStrength.gap.toFixed(1)
      return `El equipo supera el estandar en ${gapPositivo} puntos. ` +
             `Sin brechas criticas identificadas en este ciclo.`
    }
    return 'Sin brechas criticas identificadas en este ciclo.'
  }

  return ''
}

export function getPatternLabel(pattern: string | null): string {
  if (!pattern) return 'Sin clasificar'
  return PATTERN_LABELS[pattern] || 'Sin clasificar'
}

export function getQuadrantLabel(quadrant: string): string {
  return QUADRANT_LABELS[quadrant] || quadrant
}
