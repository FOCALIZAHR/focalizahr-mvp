// ════════════════════════════════════════════════════════════════════════════
// CHANNEL SELECTOR - Regla Cero (Gate A v3.0)
// src/lib/services/channel-selector.ts
// ════════════════════════════════════════════════════════════════════════════
// Funcion pura: determina el canal de comunicacion para un destinatario.
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 3.2
//
// CONTRATO CRITICO: NUNCA lanza throw. Retorna 'none' cuando no hay contacto
// valido. El llamador decide que hacer (acumular en breakdown). Un throw en
// encolado masivo de 500 participantes corta el flujo completo: ese es el
// anti-patron del briefing v2.3.3 que este servicio corrige.
//
// Sin BD: recibe todo por contexto. Testeable como funcion pura.
// ════════════════════════════════════════════════════════════════════════════

export type ChannelContext = {
  preferredChannel?: string | null;
  channelConsentAt?: Date | null;
  email?: string | null;
  personalEmail?: string | null;
  phoneNumber?: string | null;
};

export type ChannelDecision = 'email' | 'whatsapp' | 'none';

// Validacion email: simple y suficiente para encolado.
// El throw de Resend al despachar atrapa malformaciones residuales.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Telefono internacional E.164 lax: + opcional, 8 a 15 digitos,
// no empieza con 0. Limpia espacios y guiones antes de validar.
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_REGEX.test(value.trim());
}

function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[\s-]/g, '');
  return PHONE_REGEX.test(cleaned);
}

// ════════════════════════════════════════════════════════════════════════════
// CONSENT: opt-in REAL vs proxy (Gate E.1 bloque 1)
// ════════════════════════════════════════════════════════════════════════════
// channelConsentAt se setea con la MISMA semántica por dos clases de método:
//   - PROXY: 'admin_loaded' (empleador declara al inscribir) | 'imported'. NO es opt-in
//     de la persona: solo habilita la PRIMERA solicitud (template channel-onboarding).
//   - REAL: 'whatsapp_button' | 'whatsapp_text' | 'self_service'. La persona respondió:
//     habilita contenido posterior (encuestas, escalación, recordatorios, invitaciones).
// El gate (Gate E.1 bloque 2) clasifica con isRealOptIn; NO se inventa un valor nuevo.

// Métodos que SÍ representan un opt-in explícito de la persona.
export const REAL_OPT_IN_METHODS = ['whatsapp_button', 'whatsapp_text', 'self_service'] as const;

/**
 * ¿El método de consent es un opt-in REAL de la persona (no un proxy del empleador)?
 * null / 'admin_loaded' / 'imported' / cualquier desconocido -> false (fail-closed).
 */
export function isRealOptIn(method: string | null | undefined): boolean {
  if (!method) return false;
  return (REAL_OPT_IN_METHODS as readonly string[]).includes(method);
}

/**
 * Determina el canal de comunicacion segun los datos disponibles del destinatario.
 *
 * Orden de evaluacion:
 *   1. Si preferredChannel + channelConsentAt -> respetar preferencia
 *      (solo si el canal correspondiente tiene dato valido)
 *   2. Email valido (corporativo o personalEmail) -> 'email'
 *   3. Telefono valido -> 'whatsapp'
 *   4. Nada -> 'none'
 */
export function determineChannel(ctx: ChannelContext): ChannelDecision {
  const hasEmail = isValidEmail(ctx.email) || isValidEmail(ctx.personalEmail);
  const hasPhone = isValidPhone(ctx.phoneNumber);

  // 1. Preferencia explicita con consentimiento registrado
  if (ctx.preferredChannel && ctx.channelConsentAt) {
    if (ctx.preferredChannel === 'email' && hasEmail) return 'email';
    if (ctx.preferredChannel === 'whatsapp' && hasPhone) return 'whatsapp';
    // Si la preferencia no tiene dato valido, caer al fallback por canal disponible
  }

  // 2. Default email si esta disponible
  if (hasEmail) return 'email';

  // 3. Fallback whatsapp
  if (hasPhone) return 'whatsapp';

  // 4. Sin contacto valido
  return 'none';
}
