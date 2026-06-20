// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES - Plantillas Twilio Content API (Gate C v3.0)
// src/lib/templates/whatsapp-templates.ts
// ════════════════════════════════════════════════════════════════════════════
// Espejo conceptual de email-templates.ts, pero para WhatsApp. A diferencia del
// email (HTML renderizado en runtime), WhatsApp usa Content Templates aprobados por
// Meta e identificados por contentSid (HX...). El BODY/botones de cada template
// VIVEN en Twilio (los crea el script create-whatsapp-templates.mjs del track Meta);
// aqui solo se referencia el contentSid + el ORDEN de las variables.
//
// IMPORTANTE (Gate C): Twilio/Meta exigen variables POSICIONALES ('1','2',...),
// no nombres. El sistema interno trabaja con nombres legibles (snake_case); el
// mapeo named -> posicional lo hace buildContentVariables() segun el orden
// declarado en cada template. Esa es la fuente de verdad del mapeo.
//
// Spec: .claude/tasks/SPEC_GATE_C_COMUNICACIONES_v3.md seccion 4.1 + skill seccion 5.
// ════════════════════════════════════════════════════════════════════════════

export type WhatsAppTemplate = {
  slug: string;
  // contentSid de Twilio (aprobado por Meta, formato HX + 32 hex).
  contentSid: string;
  // Nombres internos de variables EN ORDEN. El indice + 1 es la posicion Meta
  // ({{1}}, {{2}}, ...). Fuente de verdad del mapeo named -> posicional.
  variables: string[];
};

// Registro de templates. Estructura lista para sumar recordatorios / escalacion
// (Gate D) y metas (Gate E) sin cambiar la forma del modulo.
const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  // Invitacion a encuesta (slug interno historico; Content template real aprobado).
  // {{1}}=participant_name, {{2}}=company_name, {{3}}=survey_url.
  // NOTA Gate C: la reconciliacion de estas variables con las posiciones del
  // template aprobado (skill: 1=firstName, 2=company, 3=daysRemaining, 4=token)
  // se difiere a Gate D. No es requisito del sello C.
  'campaign-invitation-whatsapp': {
    slug: 'campaign-invitation-whatsapp',
    contentSid: 'HX78f16046e9cc2d37b2ae3cb2411160e4',
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
  // Primer contacto / consentimiento de canal (CRITICO Gate C).
  // {{1}}=participant_name, {{2}}=company_name. Botones quick-reply WhatsApp/Email
  // viven en el Content template de Twilio.
  'channel-onboarding': {
    slug: 'channel-onboarding',
    contentSid: 'HXe75294cea427de80c8756167457b045c',
    variables: ['participant_name', 'company_name'],
  },
};

/**
 * Obtiene el template WhatsApp por slug. Retorna null si no existe (el caller
 * decide que hacer).
 */
export function getWhatsAppTemplate(slug: string): WhatsAppTemplate | null {
  return WHATSAPP_TEMPLATES[slug] ?? null;
}

/**
 * Mapea variables con nombre interno -> contentVariables posicional de Twilio.
 * Usa el ORDEN declarado en template.variables: el primer nombre es la posicion
 * '1', el segundo '2', etc. Omite los valores ausentes (null/undefined).
 *
 * @example
 * buildContentVariables(channelOnboarding, { participant_name: 'Maria', company_name: 'Cencosud' })
 *   -> { '1': 'Maria', '2': 'Cencosud' }
 */
export function buildContentVariables(
  template: WhatsAppTemplate,
  named: Record<string, unknown>
): Record<string, string> {
  const positional: Record<string, string> = {};
  template.variables.forEach((name, index) => {
    const value = named[name];
    if (value !== null && value !== undefined) {
      positional[String(index + 1)] = String(value);
    }
  });
  return positional;
}

// Slug canonico de la invitacion a encuesta por WhatsApp (consumido por activate).
export const WHATSAPP_INVITATION_SLUG = 'campaign-invitation-whatsapp';

// Slug canonico del onboarding de canal (consumido por el disparador 4.3a/4.3b).
export const WHATSAPP_ONBOARDING_SLUG = 'channel-onboarding';

// ════════════════════════════════════════════════════════════════════════════
// REQUEST_EMAIL_BODY - Mensaje LIBRE (session message), NO es template Meta.
// ════════════════════════════════════════════════════════════════════════════
// Se envia dentro de la ventana 24h cuando el usuario elige "Prefiero email" en el
// channel-onboarding. Va como Body de texto plano (sin contentSid, sin aprobacion
// Meta).
//
// TODO COPY PENDIENTE (Studio IA): este texto es un PLACEHOLDER. El copy final lo
// entrega Studio IA y se pega antes de produccion. Para el smoke C4 el placeholder
// basta. Reglas: es-CL, tuteo, sin em dash, sin jerga.
export const REQUEST_EMAIL_BODY =
  '[PENDIENTE copy Studio IA] Para recibir las comunicaciones por correo, responde a este mensaje con tu email.';
