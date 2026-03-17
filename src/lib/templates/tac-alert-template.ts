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

const { colors } = EMAIL_FOUNDATION

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
