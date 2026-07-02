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
  // GATE D: escalación de último recurso (email no respondió -> WhatsApp).
  // {{1}}=participant_name, {{2}}=company_name, {{3}}=survey_token (en la URL del botón).
  // Copy: skill focalizahr-whatsapp-templates §4.4. El Content template real lo crea
  // create-whatsapp-templates.mjs; el HX abajo es PLACEHOLDER hasta correr el script y
  // aprobar en Meta (go-live, mismo patrón que Gate C). El smoke D3-2 usa try-first con
  // fallback a un template pre-aprobado de muestra si el sandbox rechaza el custom.
  'survey-escalation': {
    slug: 'survey-escalation',
    contentSid: 'HX_PENDING_SURVEY_ESCALATION',
    variables: ['participant_name', 'company_name', 'survey_token'],
  },
  // GATE E.1: recordatorio WhatsApp del frontline phone-only (ruta 3). Mismo molde
  // que la escalacion. Copy: skill focalizahr-whatsapp-templates §4.3 (survey-reminder,
  // UTILITY, tono recordatorio neutro). {{1}}=participant_name, {{2}}=company_name,
  // {{3}}=days_remaining, {{4}}=survey_token (en la URL del boton). El HX es PLACEHOLDER
  // hasta mintear y aprobar en Meta (go-live, mismo patron que escalacion).
  'survey-reminder': {
    slug: 'survey-reminder',
    contentSid: 'HX_PENDING_SURVEY_REMINDER',
    variables: ['participant_name', 'company_name', 'days_remaining', 'survey_token'],
  },
  // GATE E.2a: invitacion a la encuesta de salida por WhatsApp (ex-empleado sin email).
  // messageType DEDICADO 'exit_invitation' (no 'invitation'): los motores de recordatorio
  // (whatsapp-reminders.ts:120) y escalacion, y el espejo EmailLog (message-dispatcher.ts:228),
  // solo miran 'invitation', asi que Exit NO entra a su radar (no-chase por construccion).
  // Copy: skill focalizahr-whatsapp-templates (invitacion encuesta de salida, tono FocalizaHR).
  // {{1}}=participant_name, {{2}}=company_name, {{3}}=survey_url (en la URL del boton).
  // El HX es PLACEHOLDER hasta mintear y aprobar en Meta (go-live, mismo patron que Gate C/D).
  'exit-invitation-whatsapp': {
    slug: 'exit-invitation-whatsapp',
    contentSid: 'HX_PENDING_EXIT_INVITATION',
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
  // GATE E.2b: toques del journey de Onboarding por WhatsApp (frontline sin email).
  // UN template POR ETAPA (dia 1/7/30/90): la cadencia del journey ancla en hitos, y el
  // copy de cada toque es distinto (Compliance/Clarification/Culture/Connection). El
  // messageType es UNO SOLO ('onboarding_touch', ver ExitRegistrationService/spec): no es
  // 'invitation', asi que los motores de recordatorio/escalacion (whatsapp-reminders.ts:120,
  // message-dispatcher.ts:228) NO lo ven -> no-chase cruzado por construccion. El toque se
  // resuelve por canal en el cron (processAutomationQueue), consent fresco, NO al inscribir.
  // {{1}}=participant_name, {{2}}=company_name, {{3}}=survey_url (en la URL del boton).
  // Los HX son PLACEHOLDER: el copy real + submit a Meta van al track paralelo (go-live),
  // mismo patron que Gate C/D/E.1/E.2a. El sello E.2b es en sandbox con placeholder.
  'onboarding-day1-whatsapp': {
    slug: 'onboarding-day1-whatsapp',
    contentSid: 'HX_PENDING_ONBOARDING_DAY1',
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
  'onboarding-day7-whatsapp': {
    slug: 'onboarding-day7-whatsapp',
    contentSid: 'HX_PENDING_ONBOARDING_DAY7',
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
  'onboarding-day30-whatsapp': {
    slug: 'onboarding-day30-whatsapp',
    contentSid: 'HX_PENDING_ONBOARDING_DAY30',
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
  'onboarding-day90-whatsapp': {
    slug: 'onboarding-day90-whatsapp',
    contentSid: 'HX_PENDING_ONBOARDING_DAY90',
    variables: ['participant_name', 'company_name', 'survey_url'],
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

// Slug canonico de la escalacion WhatsApp (consumido por processSurveyEscalations, Gate D).
export const WHATSAPP_ESCALATION_SLUG = 'survey-escalation';

// Slug canonico del recordatorio WhatsApp (consumido por processWhatsAppReminders, Gate E.1).
export const WHATSAPP_REMINDER_SLUG = 'survey-reminder';

// Slug canonico de la invitacion de salida por WhatsApp (consumido por ExitRegistrationService, Gate E.2a).
export const WHATSAPP_EXIT_INVITATION_SLUG = 'exit-invitation-whatsapp';

// GATE E.2b: mapa templateId de la fila EmailAutomation (slug de la etapa del journey,
// ver OnboardingEnrollmentService.scheduleOnboardingEmails) -> slug del template WhatsApp
// de esa etapa. El cron (processAutomationQueue) lo usa para: (a) IDENTIFICAR que un job
// es un toque de onboarding (solo estos bifurcan por canal; el resto -ej. Exit email-
// queda 100% intacto), y (b) elegir el template WhatsApp correcto por etapa.
export const WHATSAPP_ONBOARDING_TOUCH_SLUGS: Record<string, string> = {
  'onboarding-day-1': 'onboarding-day1-whatsapp',
  'onboarding-day-7': 'onboarding-day7-whatsapp',
  'onboarding-day-30': 'onboarding-day30-whatsapp',
  'onboarding-day-90': 'onboarding-day90-whatsapp',
};

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
