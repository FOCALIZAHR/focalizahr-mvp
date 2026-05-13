// ════════════════════════════════════════════════════════════════════════════
// SECTION CIERRE (C4 — Plan Global) — CONSTANTES Y COPY APROBADO
// _shared/constants.ts
// ════════════════════════════════════════════════════════════════════════════
// Single source of truth de:
//   - ORIGIN_GROUPS:   mapping triggerType → grupo ejecutivo C1/C2/C3/Alertas
//   - ORIGIN_LABELS:   copy del header de cada bloque
//   - ORIGIN_ACCENT:   color del accent por origen (cyan para C1-C3, amber para alertas)
//   - ORIGIN_ORDER:    orden canónico de render (espeja el recorrido del CEO)
//   - FRANCOTIRADOR:   copy del empty state cuando planActions.length === 0
//
// Reglas:
//   - Las narrativas son APROBADAS por el usuario. NO modificar sin instrucción
//     explícita.
// ════════════════════════════════════════════════════════════════════════════

import type { TriggerType } from '@/lib/services/compliance/InterventionEngine';

// ─── Origen ejecutivo ───────────────────────────────────────────────────────
// Cada CompliancePlanAction cae en exactamente uno de estos 4 grupos
// según su triggerType. Los grupos espejan el recorrido del CEO por el módulo:
//   C1 (dimensiones) → C2 (patrones) → C3 (convergencia) → Alertas.

export type OriginKey = 'dimensiones' | 'patrones' | 'convergencia' | 'alertas';

export const ORIGIN_BY_TRIGGER_TYPE: Record<TriggerType, OriginKey> = {
  dimension_low: 'dimensiones',
  patron:        'patrones',
  convergencia:  'convergencia',
  alert:         'alertas',
};

export const ORIGIN_LABELS: Record<OriginKey, string> = {
  dimensiones:  'Dimensiones',
  patrones:     'Patrones',
  convergencia: 'Convergencia',
  alertas:      'Alertas',
};

// Accent del header de cada bloque.
//   - cyan para C1/C2/C3 (lectura de ambiente)
//   - amber para alertas (lenguaje legal, riesgo formal)
export const ORIGIN_ACCENT: Record<OriginKey, 'cyan' | 'amber'> = {
  dimensiones:  'cyan',
  patrones:     'cyan',
  convergencia: 'cyan',
  alertas:      'amber',
};

// Orden canónico de render del Plan Global — espejo del Rail.
export const ORIGIN_ORDER: readonly OriginKey[] = [
  'dimensiones',
  'patrones',
  'convergencia',
  'alertas',
] as const;

// ─── Francotirador — empty state ────────────────────────────────────────────
// Copy aprobado por el usuario (2026-05-12). Se renderiza cuando NO hay
// CompliancePlanAction registradas en el ciclo. CTA navega al simulador para
// dar al CEO la última oportunidad de registrar acciones antes del cierre.

export const FRANCOTIRADOR_COPY = {
  eyebrow: 'Cierre del ciclo · Sin decisiones registradas',
  body: [
    'El instrumento leyó. La acción no se registró.',
    'Lo no decidido también es decisión.',
    'El próximo ciclo arrancará con la misma lectura',
    '— sin poder decir que no estuvo a la vista.',
  ],
  cta: 'Revisar señales pendientes',
} as const;

// ─── Header del bloque consolidado ──────────────────────────────────────────
// Eyebrow + título cuando SÍ hay acciones registradas.

export const PLAN_GLOBAL_COPY = {
  eyebrow: 'Plan de este ciclo',
  /** Construye el subtítulo singular/plural según el conteo de acciones. */
  subtitle: (count: number): string =>
    count === 1
      ? '1 acción registrada en este ciclo.'
      : `${count} acciones registradas en este ciclo.`,
  exportLabel: 'Exportar plan del ciclo',
  exportTooltip: 'Exportación disponible en Fase 6',
} as const;
