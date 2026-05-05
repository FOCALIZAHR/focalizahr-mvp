// ════════════════════════════════════════════════════════════════════════════
// LEGAL BADGE — Configuración escalable por país
// src/config/compliance/legalBadgeConfig.ts
// ════════════════════════════════════════════════════════════════════════════
// Texto del badge ámbar de exposición legal que aparece en hallazgos de
// dimensiones críticas (score < 2.0). Agregar un país es UNA línea.
// ════════════════════════════════════════════════════════════════════════════

export const LEGAL_BADGE_BY_COUNTRY: Record<string, string> = {
  CL: 'Riesgo directo de fiscalización bajo Ley Karin / SUSESO',
  PE: 'Riesgo de incumplimiento normativo laboral',
  CO: 'Riesgo de incumplimiento normativo laboral',
  MX: 'Riesgo de incumplimiento normativo laboral',
  default: 'Riesgo crítico de incumplimiento normativo',
};

/** Resuelve el texto del badge legal según el país. Si falta o no está
 *  mapeado, devuelve el texto universal (`default`). */
export function getLegalBadgeText(country: string | null | undefined): string {
  if (!country) return LEGAL_BADGE_BY_COUNTRY.default;
  return (
    LEGAL_BADGE_BY_COUNTRY[country.toUpperCase()] ??
    LEGAL_BADGE_BY_COUNTRY.default
  );
}
