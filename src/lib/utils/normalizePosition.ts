// ════════════════════════════════════════════════════════════════════════════
// NORMALIZE POSITION TEXT — Single Source of Truth
// src/lib/utils/normalizePosition.ts
// ════════════════════════════════════════════════════════════════════════════
// Normaliza texto de cargo para matching consistente contra
// `occupation_mappings.position_text`. TODO escritor y lector de mappings
// SOC debe usar esta función — mantener una sola fuente evita el bug de
// normalizaciones divergentes (ver historial `TASK_FIX_POSITION_TEXT_NORMALIZATION`).
//
// Reglas:
//   · lowercase + trim
//   · remueve acentos (NFD + combining marks)
//   · paréntesis + su contenido → espacio
//     ("kinesiólogo(a) coordinador(a)" → "kinesiologo coordinador")
//     Los marcadores de género son ruido semántico para matching SOC,
//     no deben absorberse como caracteres adyacentes.
//   · paréntesis sueltos sobrevivientes → espacio (defensa en profundidad)
//   · `_` → espacio
//   · remueve cualquier char fuera de [a-z0-9 espacio - / & .]
//   · colapsa múltiples espacios a uno
// ════════════════════════════════════════════════════════════════════════════

export function normalizePositionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/[^a-z0-9\s\-\/&.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
