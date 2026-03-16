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

export function getPatternLabel(pattern: string | null): string {
  if (!pattern) return 'Sin clasificar'
  return PATTERN_LABELS[pattern] || 'Sin clasificar'
}

export function getQuadrantLabel(quadrant: string): string {
  return QUADRANT_LABELS[quadrant] || quadrant
}
