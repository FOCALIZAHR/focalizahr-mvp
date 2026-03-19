// ════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE: Alertas TAC (Talent Action Center)
// src/lib/templates/tac-alert-template.ts
//
// ARQUITECTURA: Separado de PREMIUM_EMAIL_TEMPLATES (campaigns)
// Razón: Las alertas ejecutivas son diferentes a invitaciones de encuestas
// - Trigger: Clic humano condicional (no cron)
// - Audiencia: 1-5 stakeholders internos (no nómina completa)
// - Propósito: Notificar patrón detectado + acción requerida
//
// FUENTE ÚNICA DE NARRATIVAS: GerenciaPatternNarratives.ts
// — label, coachingTip, actions.notificar.tooltip
// ════════════════════════════════════════════════════════════════════════════

import {
  EmailHeader,
  EmailHero,
  EmailContentSection,
  EmailHighlightBox,
  EmailFooter,
  EMAIL_FOUNDATION
} from './email-components'

import {
  getGerenciaPatternNarrative,
  type GerenciaPattern
} from '@/config/GerenciaPatternNarratives'

const { colors, fonts, spacing } = EMAIL_FOUNDATION

// ════════════════════════════════════════════════════════════════════════════
// SEVERITY por patrón (solo para el email, no contamina GerenciaPatternNarratives)
// ════════════════════════════════════════════════════════════════════════════

const PATTERN_SEVERITY: Record<string, 'critical' | 'high' | 'medium'> = {
  QUEMADA: 'critical',
  FRAGIL: 'high',
  RIESGO_OCULTO: 'high',
  ESTANCADA: 'medium',
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface TACAlertEmailVariables {
  company_name: string
  department_name: string
  pattern: string           // FRAGIL | QUEMADA | ESTANCADA | RIESGO_OCULTO
  manager_name: string      // Quien tomó la acción
  action_date: string       // Fecha formateada
  action_code: string       // NOTIFY_HRBP | SCHEDULE_COMMITTEE | FLAG_FOR_REVIEW
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Crear estructura base HTML (mismo patrón que email-templates.ts)
// ════════════════════════════════════════════════════════════════════════════

function createEmailHTML(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fhr-button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.slate50}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${colors.slate50};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: ${colors.white}; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ════════════════════════════════════════════════════════════════════════════
// ACTION CODE → Labels legibles
// ════════════════════════════════════════════════════════════════════════════

const ACTION_LABELS: Record<string, string> = {
  NOTIFY_HRBP: 'Notificar al equipo de RRHH',
  SCHEDULE_COMMITTEE: 'Agendar comité de riesgo',
  FLAG_FOR_REVIEW: 'Marcar para revisión trimestral'
}

// ════════════════════════════════════════════════════════════════════════════
// RENDER FUNCTION
// ════════════════════════════════════════════════════════════════════════════

export function renderTACAlertEmail(
  variables: TACAlertEmailVariables
): { subject: string; html: string } {

  // Fuente única: GerenciaPatternNarratives
  const VALID_PATTERNS: GerenciaPattern[] = ['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO']
  const isValidPattern = VALID_PATTERNS.includes(variables.pattern as GerenciaPattern)

  const narrative = isValidPattern
    ? getGerenciaPatternNarrative(variables.pattern as GerenciaPattern)
    : null

  const label = narrative?.label || 'Patrón Detectado'
  const coachingTip = narrative?.coachingTip || 'Se ha detectado un patrón de riesgo que requiere atención.'
  const actionContext = narrative?.actions.notificar.tooltip || 'Se requiere coordinación con el equipo de gestión de talento.'
  const severity = PATTERN_SEVERITY[variables.pattern] || 'medium'
  const actionLabel = ACTION_LABELS[variables.action_code] || 'Acción ejecutiva'

  const bodyContent = [
    EmailHeader({ companyName: variables.company_name }),

    EmailHero({
      title: `Alerta: ${label}`,
      subtitle: `Se requiere atención en ${variables.department_name}`,
      badge: 'Acción Requerida'
    }),

    EmailContentSection({
      greeting: `${variables.manager_name} ha activado el protocolo de intervención para ${variables.department_name}.`,
      paragraphs: [
        `<strong>Patrón detectado:</strong> ${label}`,
        `<strong>Acción solicitada:</strong> ${actionLabel}`,
        `<strong>Fecha:</strong> ${variables.action_date}`
      ]
    }),

    EmailHighlightBox({
      icon: 'alert',
      title: '¿Qué significa este patrón?',
      text: coachingTip,
      variant: severity === 'critical' ? 'warning' : 'info'
    }),

    EmailContentSection({
      greeting: '',
      paragraphs: [
        actionContext,
        'Se recomienda coordinar con el gerente de área para definir próximos pasos dentro de las siguientes 48-72 horas.'
      ]
    }),

    EmailFooter()
  ].join('\n')

  const html = createEmailHTML(bodyContent)
  const subject = `⚠️ Alerta TAC: ${variables.department_name} — ${label}`

  return { subject, html }
}

// ════════════════════════════════════════════════════════════════════════════
// PILAR 2: MASS ACTION EMAILS — CEO → Gerente de Área
//
// El CEO revisó el mapa de talento, seleccionó personas en un cuadrante
// y el sistema envía este email en nombre del CEO al gerente del área.
// 1 email por gerente, agrupando las personas de su departamento.
//
// TONO: Primera persona del CEO. No es un sistema automatizado.
// ════════════════════════════════════════════════════════════════════════════

export interface TACMassActionEmailVariables {
  ceo_name: string
  manager_name: string
  company_name: string
  department_name: string
  people_list: string       // HTML de personas (cada una como <p>)
  people_count: number
}

// Narrativas por cuadrante — tono CEO, primera persona
const MASS_ACTION_NARRATIVES: Record<string, {
  subject: (vars: TACMassActionEmailVariables) => string
  greeting: (vars: TACMassActionEmailVariables) => string
  context: (vars: TACMassActionEmailVariables) => string
  request: string
  alertColor: string
}> = {
  FUGA_CEREBROS: {
    subject: (v) => `Quiero que revisemos ${v.people_count} persona(s) de ${v.department_name}`,
    greeting: (v) => `Revisé el panel de talento de ${v.department_name} y hay algunas personas que me generan atención. El sistema está detectando señales de compromiso crítico en perfiles que dominan bien su cargo — y eso es justamente la combinación que más me preocupa.`,
    context: () => 'No tengo más contexto que los datos — tú lo tienes. Por eso te escribo.',
    request: 'Lo que te pido es que puedas tener una conversación de escucha con cada una de estas personas — no de evaluación, solo de escucha. Entender cómo están, qué están viviendo, qué necesitan ver para seguir proyectándose aquí.',
    alertColor: colors.error,
  },
  BURNOUT_RISK: {
    subject: (v) => `Revisemos la carga de ${v.people_count} persona(s) en ${v.department_name}`,
    greeting: (v) => `Al revisar el panel de ${v.department_name}, hay personas con una combinación que me genera una pregunta: compromiso alto pero con dominio por debajo del umbral esperado para su cargo. Energía que no se está convirtiendo en resultado.`,
    context: () => 'Puede haber varias razones — carga excesiva, rol que no calza bien, o simplemente un momento de transición. Tú tienes el contexto que el sistema no tiene.',
    request: 'Te pido que puedas revisar la carga real de estas personas y evaluar si el rol y el momento son los correctos para cada una. No es urgente en el sentido inmediato, pero sí es importante hacerlo dentro de los procesos normales de tu gestión.',
    alertColor: colors.warning,
  },
  BAJO_RENDIMIENTO: {
    subject: (v) => `Hay casos en ${v.department_name} que necesitan tu atención`,
    greeting: (v) => `Revisé el panel de ${v.department_name} y hay personas que el sistema está marcando con señales de bajo dominio y bajo compromiso simultáneamente. Es una combinación que no quiero dejar pasar sin que alguien con contexto la mire de cerca.`,
    context: () => 'Puede haber un contexto que el dato no captura — personal, de ajuste, de momento. O puede ser algo que ya requiere una conversación más directa. Tú sabes mejor que nadie cuál es el caso.',
    request: 'Lo que te pido es que puedas revisar cada caso y tener una conversación de contexto — antes de cualquier otra acción. Entender qué está pasando es el primer paso.',
    alertColor: colors.error,
  },
  MOTOR_EQUIPO: {
    subject: (v) => `Reconozcamos a ${v.people_count} pilar(es) de ${v.department_name}`,
    greeting: (v) => `Revisé el panel de ${v.department_name} y quiero destacar algo positivo: hay personas que el sistema está marcando como pilares del equipo — alto dominio y alto compromiso simultáneamente. Eso no es común y vale la pena reconocerlo.`,
    context: () => 'Los perfiles con esta combinación son los más valiosos y, paradójicamente, los que más fácil se pierden cuando la organización no los gestiona activamente.',
    request: 'Te pido dos cosas concretas: que puedas reconocerles explícitamente — no tiene que ser formal, solo tiene que ser honesto — y que te asegures de que cada una de estas personas tiene visibilidad de hacia dónde puede crecer desde donde está hoy.',
    alertColor: colors.success,
  },
}

/**
 * Renderiza email de acción masiva del CEO al gerente de área.
 *
 * @param quadrant  — Cuadrante de talento (FUGA_CEREBROS, BURNOUT_RISK, etc.)
 * @param variables — Datos del email
 *
 * Uso:
 *   const { subject, html } = renderTACMassActionEmail('FUGA_CEREBROS', {
 *     ceo_name: 'Carlos Martínez',
 *     manager_name: 'María López',
 *     company_name: 'Empresa S.A.',
 *     department_name: 'Tecnología',
 *     people_count: 3,
 *     people_list: '<p style="...">Ana Silva — Analista Senior</p>...'
 *   })
 */
export function renderTACMassActionEmail(
  quadrant: string,
  variables: TACMassActionEmailVariables
): { subject: string; html: string } {

  const narrative = MASS_ACTION_NARRATIVES[quadrant]
  if (!narrative) {
    throw new Error(`[TAC] Template de mass action no encontrado para cuadrante: ${quadrant}`)
  }

  const bodyContent = [
    EmailHeader({ companyName: variables.company_name }),

    // Saludo + narrativa del CEO
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.lg} ${spacing.lg} ${spacing.md} ${spacing.lg};">
          <p style="margin: 0 0 ${spacing.sm} 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate600};">
            Hola ${variables.manager_name},
          </p>
          <p style="margin: 0 0 ${spacing.sm} 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate700};">
            ${narrative.greeting(variables)}
          </p>
          <p style="margin: 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate700};">
            ${narrative.context(variables)}
          </p>
        </td>
      </tr>
    </table>`,

    // Lista de personas
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: 0 ${spacing.lg} ${spacing.lg} ${spacing.lg};">
          <div style="background: rgba(34,211,238,0.03); border: 1px solid rgba(34,211,238,0.12); border-left: 3px solid ${narrative.alertColor}; border-radius: 8px; padding: ${spacing.md};">
            <p style="margin: 0 0 12px 0; font-family: ${fonts.primary}; font-size: 12px; font-weight: 600; color: ${colors.slate500}; text-transform: uppercase; letter-spacing: 0.05em;">
              Personas identificadas en tu área
            </p>
            ${variables.people_list}
          </div>
        </td>
      </tr>
    </table>`,

    // Pedido concreto
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: 0 ${spacing.lg} ${spacing.md} ${spacing.lg};">
          <p style="margin: 0 0 ${spacing.sm} 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate700};">
            ${narrative.request}
          </p>
          <p style="margin: 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate700};">
            Si necesitas apoyo de RRHH para esto, están disponibles.
          </p>
        </td>
      </tr>
    </table>`,

    // Firma CEO
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding: ${spacing.md} ${spacing.lg} ${spacing.lg} ${spacing.lg};">
          <p style="margin: 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate600};">
            Quedo atento a cómo evoluciona esto.
          </p>
          <p style="margin: ${spacing.sm} 0 0 0; font-family: ${fonts.primary}; font-size: 15px; line-height: 1.6; color: ${colors.slate800}; font-weight: 500;">
            ${variables.ceo_name}
          </p>
          <p style="margin: 4px 0 0 0; font-family: ${fonts.primary}; font-size: 13px; color: ${colors.slate500};">
            ${variables.company_name}
          </p>
        </td>
      </tr>
    </table>`,

    EmailFooter()
  ].join('\n')

  const html = createEmailHTML(bodyContent)
  const subject = narrative.subject(variables)

  return { subject, html }
}
