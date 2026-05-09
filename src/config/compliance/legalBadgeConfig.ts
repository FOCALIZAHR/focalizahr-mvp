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

// ════════════════════════════════════════════════════════════════════════════
// LEGAL EMAIL LABELS — variantes por país para emails de Ambiente Sano
// ════════════════════════════════════════════════════════════════════════════
// 3 variantes (badge corto, greeting completo, preview text) per país.
// Consumidor: caller de renderEmailTemplate en activate/route.ts y
// send-reminders/route.ts. Backward compat: Account.country tiene default
// 'CL' — clientes existentes reciben el mismo email que hoy.
//
// Convivencia: este dictionary es para EMAILS. LEGAL_BADGE_BY_COUNTRY
// (arriba) es para BADGES UI de hallazgos críticos. Distintos contextos,
// distintos copy — no consolidar.
// ════════════════════════════════════════════════════════════════════════════

export interface LegalEmailLabels {
  /** Badge del hero del email — 2-3 palabras visibles. */
  badge: string;
  /** Greeting completo del cuerpo — frase entera (la sustitución reemplaza
   *  el string `greeting` completo del template, no solo un fragmento). */
  greeting: string;
  /** Preview text del email (Gmail/Outlook subtitle bajo el subject). */
  preview: string;
}

export const LEGAL_EMAIL_LABELS: Record<string, LegalEmailLabels> = {
  CL: {
    badge: 'Ley Karin',
    greeting:
      'Como parte de nuestro compromiso con un ambiente laboral saludable y en cumplimiento de la Ley Karin, queremos conocer tu percepción sobre nuestro entorno de trabajo.',
    preview: 'Tu bienestar es nuestra prioridad - Evaluación Ley Karin',
  },
  default: {
    badge: 'Ambiente Sano',
    greeting:
      'Como parte de nuestro compromiso con un ambiente laboral saludable y en cumplimiento de la normativa laboral vigente, queremos conocer tu percepción sobre nuestro entorno de trabajo.',
    preview: 'Tu bienestar es nuestra prioridad - Evaluación Ambiente Sano',
  },
};

/** Resuelve los labels de email por país. Si no hay país o no está mapeado,
 *  devuelve los labels universales (`default`). */
export function getLegalEmailLabels(
  country: string | null | undefined,
): LegalEmailLabels {
  if (!country) return LEGAL_EMAIL_LABELS.default;
  return (
    LEGAL_EMAIL_LABELS[country.toUpperCase()] ?? LEGAL_EMAIL_LABELS.default
  );
}
