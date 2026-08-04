// src/lib/constants/climaBitacoraContent.ts
// ════════════════════════════════════════════════════════════════════════════
// Copy de la Bitácora de Acciones de Clima. CERO literal en el componente.
//
// Reglas aplicadas (skill focalizahr-narrativas):
//  - Español neutro con TUTEO. Nunca voseo ("Registra", no "Registrá").
//  - Sin em dash, sin emojis.
//  - Verbos vetados fuera: "Guardar", "Confirmar", "Enviar". El CTA nombra el
//    resultado, no la operación.
//  - Regla 3 (consecuencia, no instrucción): el aviso de duplicado dice el HECHO
//    y nada más. "Revisa antes de escribir" sería una instrucción.
//
// DECISIÓN DE PRODUCTO (Victor, 2026-08-03) — la intro NO explica cómo se evalúa
// el registro. Un jefe que entiende que no escribir cuenta en su contra escribe
// cualquier cosa para no quedar mal, y el registro deja de ser honesto. La
// pantalla dice qué es y nada más.
//
// Copy PROVISIONAL en el mismo régimen que el resto de clima: lo confirma
// Victor/Studio IA antes del lanzamiento.
// ════════════════════════════════════════════════════════════════════════════

/** Límite de la columna `ClimaActionLogEntry.text` (VarChar(200)). No inventar otro. */
export const BITACORA_TEXT_MAX = 200;

/** Entradas visibles antes de "Ver anteriores". Espeja ENTRIES_PREVIEW del endpoint. */
export const BITACORA_ENTRIES_PREVIEW = 3;

/** Ventana del aviso de registro reciente, en horas. */
export const BITACORA_RECENT_HOURS = 24;

export const BITACORA_SCREEN = {
  kicker: 'Clima · Tu equipo',
  titleWhite: 'Bitácora de',
  titleGradient: 'acciones',
  intro: 'Los focos de clima de tu equipo. Registra lo que hiciste con cada uno.',

  loading: 'Cargando tus focos',

  error: {
    title: 'No se pudieron cargar tus focos',
    description: 'Vuelve a intentarlo en un momento.',
    retry: 'Reintentar',
  },

  /**
   * Estado vacío ÚNICO. Hoy cubre dos causas que el usuario no distingue ni le
   * importan: el vínculo con la nómina sin poblar, o simplemente no tener focos.
   *
   * Dice la verdad sin jerga: nada de "employeeId", nada de nombres de proyectos
   * internos, nada de "en construcción". La segunda frase existe para que el jefe
   * no se quede pensando que hizo algo mal ni que el sistema está roto.
   */
  empty: {
    title: 'Los focos de tu equipo',
    description:
      'Esta vista reúne los focos de clima de tu equipo para que registres qué hiciste con cada uno.',
    insight: 'Todavía no está disponible: falta conectar los usuarios con la nómina.',
  },
} as const;

export const BITACORA_PLAN = {
  stepsLabel: 'Pasos acordados',
  notesLabel: 'Nota de RRHH',
} as const;

export const BITACORA_FORM = {
  placeholder: '¿Qué hiciste con esto?',
  submit: 'Registrar intervención en bitácora',
  /** Variante corta para 320px: el CTA largo se trunca. Mismo significado. */
  submitShort: 'Registrar en bitácora',
  submitting: 'Registrando',
} as const;

export const BITACORA_HISTORY = {
  /** No repite el título de la pantalla: nombra el CONTENIDO de la columna. */
  label: 'Lo que se registró',
  empty: 'Todavía no hay registros en este foco.',
  loadingMore: 'Cargando',
} as const;

export const BITACORA_TOAST = {
  success: 'Registro agregado a la bitácora.',
  error: 'No se pudo registrar. El texto sigue en el campo.',
} as const;

// ── Helpers de texto con datos ──────────────────────────────────────────────

/** Contador fijo de la barra de píldoras. Visible en 320px sin recorrer la barra. */
export function bitacoraCounter(index: number, total: number): string {
  return `${index + 1} de ${total}`;
}

/** Píldora: dimensión + cuántos registros lleva. `Liderazgo · 2` */
export function bitacoraPill(dimension: string, registros: number): string {
  return `${dimension} · ${registros}`;
}

/** "Ver anteriores (5)" cuando hay más de las visibles. */
export function bitacoraSeeAll(total: number): string {
  return `Ver anteriores (${total})`;
}

/** Disclosure de la bitácora en mobile. */
export function bitacoraDisclosure(total: number): string {
  if (total === 0) return 'Sin registros';
  return total === 1 ? '1 registro' : `${total} registros`;
}

/**
 * Aviso de registro reciente. Dice el HECHO, sin instrucción (Regla 3).
 * `hace` ya viene formateado ("3 horas", "40 minutos").
 */
export function bitacoraRecentNotice(nombre: string, hace: string): string {
  return `${nombre} registró hace ${hace}.`;
}
