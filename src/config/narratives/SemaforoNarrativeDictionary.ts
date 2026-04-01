// ════════════════════════════════════════════════════════════════════════════
// SEMÁFORO NARRATIVE DICTIONARY — Zona Legal × Antigüedad
// src/config/narratives/SemaforoNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Narrativas para personas en BAJO_RENDIMIENTO (low fit + low engagement)
// Contexto: CEO evaluando costo de inacción en zona legal
// Tono: Directo, financiero, sin rodeos — McKinsey para directorio
// 3 tramos × 1 cuadrante = 3 narrativas
// Sincronizado con TenureRoleFitDictionary umbrales 12/36
// ════════════════════════════════════════════════════════════════════════════

import { type TenureTrend } from './TenureRoleFitDictionary'

export interface SemaforoNarrative {
  headline: string
  context: string
  action: string
}

export const SEMAFORO_NARRATIVE_DICTIONARY: Record<TenureTrend, SemaforoNarrative> = {

  // ──────────────────────────────────────────────────────────────────────────
  // A1: < 12 meses — Error de selección
  // ──────────────────────────────────────────────────────────────────────────
  A1: {
    headline: 'Error de selección',
    context:
      'No rinde y no está comprometido. ' +
      'Cuando ambas señales son negativas antes del primer año, ' +
      'el proceso de selección trajo el perfil equivocado o el onboarding no existió. ' +
      'Cada mes adicional es inversión sin validación.',
    action:
      'Definir salida antes de que acumule antigüedad. ' +
      'El costo de actuar hoy es el más bajo que va a tener.',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // A2: 12-36 meses — Oportunidad agotada
  // ──────────────────────────────────────────────────────────────────────────
  A2: {
    headline: 'Oportunidad agotada',
    context:
      'Ya pasó la curva de aprendizaje. No rinde y no quiere. ' +
      'Si hubo plan de desarrollo, no funcionó. Si no lo hubo, la organización no hizo su parte. ' +
      'En ambos casos, el resultado es el mismo: esta persona no va a cambiar sin una intervención que hasta ahora no ha ocurrido.',
    action:
      'La conversación ya no es sobre desarrollo. Es sobre continuidad. ' +
      '¿Hay evidencia de que algo cambió desde la última evaluación? Si no la hay, postergar es acumular costo.',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // A3: > 36 meses — Costo acumulado de no decidir
  // ──────────────────────────────────────────────────────────────────────────
  A3: {
    headline: 'Costo acumulado de no decidir',
    context:
      'Años de bajo rendimiento y bajo compromiso. ' +
      'El finiquito crece cada mes, las vacaciones se acumulan como pasivo, ' +
      'y el mensaje a la organización es claro: aquí se puede estar años sin rendir y sin querer, y no pasa nada.',
    action:
      'Definir salida con plan de transición. Cada mes de postergación aumenta el costo final ' +
      'y normaliza el estándar bajo para quienes sí están comprometidos.',
  },
}
