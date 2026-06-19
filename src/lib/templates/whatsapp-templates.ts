// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP TEMPLATES - Plantillas Twilio Content API (Gate B v3.0)
// src/lib/templates/whatsapp-templates.ts
// ════════════════════════════════════════════════════════════════════════════
// Espejo conceptual de email-templates.ts, pero para WhatsApp. A diferencia del
// email (HTML renderizado en runtime), WhatsApp usa Content Templates aprobados por
// Meta e identificados por contentSid (HX...). En Gate B el contentSid es un
// placeholder (HX_PENDIENTE_META): la aprobacion de Meta llega en Gate C. El modo
// simulation del whatsapp-service no necesita un contentSid real.
//
// Spec: .claude/tasks/SPEC_GATE_B_COMUNICACIONES_v3.md seccion 4.2.
// ════════════════════════════════════════════════════════════════════════════

export type WhatsAppTemplate = {
  slug: string;
  // contentSid de Twilio (aprobado por Meta). Placeholder hasta Gate C.
  contentSid: string;
  // Nombres de variables que el template espera, en orden.
  variables: string[];
};

// Placeholder hasta aprobacion Meta (Gate C). El modo simulation no lo usa.
const CONTENT_SID_PENDING = 'HX_PENDIENTE_META';

// Registro de templates. Estructura lista para sumar recordatorios / escalacion
// (Gate D) y metas (Gate E) sin cambiar la forma del modulo.
const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  'campaign-invitation-whatsapp': {
    slug: 'campaign-invitation-whatsapp',
    contentSid: CONTENT_SID_PENDING,
    variables: ['participant_name', 'company_name', 'survey_url'],
  },
};

/**
 * Obtiene el template WhatsApp por slug. Retorna null si no existe (el caller
 * decide que hacer: en Gate B el encolador usa siempre el slug de invitacion).
 */
export function getWhatsAppTemplate(slug: string): WhatsAppTemplate | null {
  return WHATSAPP_TEMPLATES[slug] ?? null;
}

// Slug canonico de la invitacion a encuesta por WhatsApp (consumido por activate).
export const WHATSAPP_INVITATION_SLUG = 'campaign-invitation-whatsapp';
