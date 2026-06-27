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
  email?: string | null;
  personalEmail?: string | null;
  phoneNumber?: string | null;
  // Gate E.1 bloque 2: booleano YA DERIVADO del log ConsentEvent (consent-derivation.ts).
  // determineChannel NO consulta la tabla: recibe el booleano resuelto (sigue PURA).
  // Gobierna SOLO el canal personal (WhatsApp). El email corporativo no lo mira.
  canReceivePersonalContent?: boolean;
};

export type ChannelDecision = 'email' | 'whatsapp' | 'none';

// Proposito del mensaje (Gate E.1 bloque 2). DEFAULT 'content' = fail-closed: todo
// caller que no se actualice queda del lado seguro (no manda WhatsApp sin opt-in real).
//   - 'content': encuestas, recordatorios, escalacion, invitaciones. Exige opt-in real.
//   - 'solicitation': el template channel-onboarding que PIDE el consent. Permitido a
//     quien aun no lo dio (admin_loaded / nada), sujeto a la decision legal 21.719.
export type ChannelPurpose = 'content' | 'solicitation';

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
 * Gate de consent (Gate E.1 bloque 2): el canal personal (WhatsApp) exige opt-in real
 * cuando purpose='content' (default fail-closed). El email corporativo es herramienta
 * de trabajo: se manda sin gate. determineChannel es PURA: recibe el booleano ya
 * derivado en `ctx.canReceivePersonalContent`, no consulta ConsentEvent.
 *
 * Orden de evaluacion:
 *   1. preferredChannel -> respetar preferencia (email si hay email; whatsapp solo si
 *      pasa el gate de consent)
 *   2. Email valido (corporativo o personalEmail) -> 'email'
 *   3. Telefono valido Y gate de consent -> 'whatsapp'
 *   4. Nada (o whatsapp sin consent) -> 'none'
 */
export function determineChannel(
  ctx: ChannelContext,
  options?: { purpose?: ChannelPurpose }
): ChannelDecision {
  const purpose: ChannelPurpose = options?.purpose ?? 'content'; // DEFAULT FAIL-CLOSED
  const hasEmail = isValidEmail(ctx.email) || isValidEmail(ctx.personalEmail);
  const hasPhone = isValidPhone(ctx.phoneNumber);

  // Gate de consent para canal PERSONAL (WhatsApp):
  //   - 'solicitation': se permite (pide el consent).
  //   - 'content': exige opt-in real derivado (canReceivePersonalContent === true).
  const whatsappAllowed =
    hasPhone && (purpose === 'solicitation' || ctx.canReceivePersonalContent === true);

  // 1. Preferencia explicita. Email no requiere gate (corporativo). WhatsApp si.
  if (ctx.preferredChannel === 'email' && hasEmail) return 'email';
  if (ctx.preferredChannel === 'whatsapp' && whatsappAllowed) return 'whatsapp';

  // 2. Default email si esta disponible
  if (hasEmail) return 'email';

  // 3. Fallback whatsapp (solo si pasa el gate de consent)
  if (whatsappAllowed) return 'whatsapp';

  // 4. Sin canal valido / sin consent
  return 'none';
}
