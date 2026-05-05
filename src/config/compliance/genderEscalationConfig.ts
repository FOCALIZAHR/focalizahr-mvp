// ════════════════════════════════════════════════════════════════════════════
// GENDER ESCALATION PROTOCOL — Configuración escalable por país
// src/config/compliance/genderEscalationConfig.ts
// ════════════════════════════════════════════════════════════════════════════
// Texto del protocolo legal aplicable cuando una alerta de género escala
// automáticamente a Las Señales. Aparece en el footer de la card de
// "Hallazgo de género detectado" (SectionPatrones AlertaGeneroCard).
//
// Agregar un país es UNA línea — mismo patrón canónico que legalBadgeConfig.ts.
// ════════════════════════════════════════════════════════════════════════════

export const GENDER_ESCALATION_PROTOCOL: Record<string, string> = {
  CL: 'protocolo de acción Ley Karin',
  PE: 'protocolo de acoso laboral (Ley 27942)',
  CO: 'protocolo de prevención del acoso laboral (Ley 1010)',
  MX: 'protocolo NOM-035',
  default: 'protocolo legal aplicable',
};

/** Resuelve el texto del protocolo legal de género según el país. Si falta o
 *  no está mapeado, devuelve el texto universal (`default`). */
export function getGenderEscalationProtocol(
  country: string | null | undefined
): string {
  if (!country) return GENDER_ESCALATION_PROTOCOL.default;
  return (
    GENDER_ESCALATION_PROTOCOL[country.toUpperCase()] ??
    GENDER_ESCALATION_PROTOCOL.default
  );
}
