// ════════════════════════════════════════════════════════════════════════════
// src/config/nineBoxLabels.ts
// Fuente única de verdad para labels y narrativas del 9-Box
//
// CONSUMIDORES:
// - Executive Hub: TalentMini9Box (distribución)
// - Performance: NineBoxGrid (vista interactiva)
// - Calibración: useCalibrationFeed (chat en vivo), useCalibrationRules
// - Sucesión: CandidateIntelligenceStory, SuccessionWizard
//
// NOTA: Soporta tanto snake_case (DB/API) como UPPER_CASE
// ════════════════════════════════════════════════════════════════════════════

export type NineBoxPosition =
  | 'star'
  | 'growth_potential'
  | 'potential_gem'
  | 'high_performer'
  | 'core_player'
  | 'inconsistent'
  | 'trusted_professional'
  | 'average_performer'
  | 'underperformer'

export interface NineBoxPositionConfig {
  // Label corto (para grids, badges, feeds)
  label: string
  // Subtítulo descriptivo (para hover, tooltips)
  subtitle: string
  // Narrativa CEO — qué significa esta posición para el negocio
  narrative: string
  // Zona: top talent, core, desarrollo, riesgo
  zone: 'top' | 'core' | 'development' | 'risk'
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR POSICIÓN
// ════════════════════════════════════════════════════════════════════════════

export const NINE_BOX_CONFIG: Record<string, NineBoxPositionConfig> = {
  // ── Fila superior: Alto Potencial ──
  star: {
    label: 'Estrella',
    subtitle: 'Top Talent',
    narrative: 'Alto desempeño y alto potencial. El talento que sostiene y proyecta tu organizacion.',
    zone: 'top',
  },
  growth_potential: {
    label: 'Alto Potencial',
    subtitle: 'Listo para crecer',
    narrative: 'Potencial alto pero aun consolidando desempeño. Invertir en desarrollo acelera su contribucion.',
    zone: 'top',
  },
  potential_gem: {
    label: 'Diamante',
    subtitle: 'Diamante en bruto',
    narrative: 'Potencial excepcional con desempeño en construccion. Necesita desafios y mentoría.',
    zone: 'top',
  },

  // ── Fila media: Core ──
  high_performer: {
    label: 'High Performer',
    subtitle: 'Alto rendimiento',
    narrative: 'Desempeño solido con potencial medio. Columna vertebral de la operacion.',
    zone: 'core',
  },
  core_player: {
    label: 'Core',
    subtitle: 'Motor de la empresa',
    narrative: 'Desempeño y potencial en equilibrio. Confiables y consistentes.',
    zone: 'core',
  },
  inconsistent: {
    label: 'Inconsistente',
    subtitle: 'Rendimiento variable',
    narrative: 'Potencial medio pero desempeño bajo lo esperado. Explorar que lo frena.',
    zone: 'development',
  },

  // ── Fila inferior: Atención ──
  trusted_professional: {
    label: 'Experto',
    subtitle: 'Profesional confiable',
    narrative: 'Domina su cargo pero sin potencial de crecimiento. Valorar su contribucion actual.',
    zone: 'core',
  },
  average_performer: {
    label: 'Efectivo',
    subtitle: 'Rendimiento promedio',
    narrative: 'Cumple pero no destaca. Definir si el rol es el correcto.',
    zone: 'development',
  },
  underperformer: {
    label: 'Riesgo',
    subtitle: 'Requiere atencion',
    narrative: 'Bajo desempeño y bajo potencial. Conversacion urgente sobre continuidad.',
    zone: 'risk',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// MAPEO UPPER_CASE → snake_case (para compatibilidad)
// ════════════════════════════════════════════════════════════════════════════

const UPPER_TO_SNAKE: Record<string, string> = {
  STAR: 'star',
  GROWTH_POTENTIAL: 'growth_potential',
  POTENTIAL_GEM: 'potential_gem',
  HIGH_PERFORMER: 'high_performer',
  CORE_PLAYER: 'core_player',
  INCONSISTENT: 'inconsistent',
  TRUSTED_PROFESSIONAL: 'trusted_professional',
  AVERAGE_PERFORMER: 'average_performer',
  UNDERPERFORMER: 'underperformer',
}

function normalize(position: string): string {
  return UPPER_TO_SNAKE[position] || position.toLowerCase()
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Label corto para badges, grids, feeds.
 * Ej: getNineBoxLabel('star') → "Estrella"
 */
export function getNineBoxLabel(position: string | null): string {
  if (!position) return '—'
  return NINE_BOX_CONFIG[normalize(position)]?.label || position
}

/**
 * Subtítulo descriptivo para hover/tooltips.
 * Ej: getNineBoxSubtitle('core_player') → "Motor de la empresa"
 */
export function getNineBoxSubtitle(position: string | null): string {
  if (!position) return ''
  return NINE_BOX_CONFIG[normalize(position)]?.subtitle || ''
}

/**
 * Narrativa CEO — qué significa para el negocio.
 * Ej: getNineBoxNarrative('star') → "Alto desempeño y alto potencial..."
 */
export function getNineBoxNarrative(position: string | null): string {
  if (!position) return ''
  return NINE_BOX_CONFIG[normalize(position)]?.narrative || ''
}

/**
 * Zona de la posición para agrupación visual.
 * Ej: getNineBoxZone('star') → 'top'
 */
export function getNineBoxZone(position: string | null): NineBoxPositionConfig['zone'] | null {
  if (!position) return null
  return NINE_BOX_CONFIG[normalize(position)]?.zone || null
}

/**
 * Config completa de una posición.
 */
export function getNineBoxConfig(position: string | null): NineBoxPositionConfig | null {
  if (!position) return null
  return NINE_BOX_CONFIG[normalize(position)] || null
}
