// Mapeo técnico → ejecutivo de alertType.
// Plan UI sec "Labels ejecutivos para términos técnicos".
//
// Reglas:
//   - Nunca renderizar nombres técnicos al CEO (liderazgo_toxico, etc.)
//   - Las labels ejecutivas son sustantivas, breves, no clínicas.
//   - Sin emojis. Sin signos de exclamación.

import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

export const ALERT_LABELS: Record<ComplianceAlertType, string> = {
  liderazgo_toxico: 'Liderazgo en riesgo',
  riesgo_convergente: 'Riesgo convergente',
  silencio_organizacional: 'Silencio organizacional',
  deterioro_sostenido: 'Deterioro sostenido',
  senal_ignorada: 'Señal sin gestión',
  silencio_con_voz_externa: 'Señales sin medición',
};

/**
 * Resuelve el label de un alertType. Defensive: si recibe un alertType
 * desconocido, retorna el string crudo (mejor que crashear).
 */
export function resolveAlertLabel(alertType: string): string {
  return (ALERT_LABELS as Record<string, string>)[alertType] ?? alertType;
}

// ────────────────────────────────────────────────────────────────────
// Labels para amplificadores Motor B (Onboarding/Salidas)
// ────────────────────────────────────────────────────────────────────

export const AMPLIFICADOR_LABELS = {
  onboarding: {
    base: 'Onboarding',
    intensidad: {
      atencion: 'atención',
      critico: 'crítico',
    },
  },
  salidas: {
    base: 'Salidas',
    intensidad: {
      atencion: 'atención',
      critico: 'críticas',
    },
  },
} as const;
