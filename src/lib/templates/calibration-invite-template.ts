// ════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE: Invitación a Sesión de Calibración
// src/lib/templates/calibration-invite-template.ts
// Usa el Design System de email enterprise de FocalizaHR
// ════════════════════════════════════════════════════════════════════════════

import {
  EmailHeader,
  EmailHero,
  EmailContentSection,
  EmailFeatureList,
  EmailCTASection,
  EmailFooter,
  EmailHighlightBox,
  EMAIL_FOUNDATION
} from './email-components'

const { colors } = EMAIL_FOUNDATION

interface CalibrationInviteVariables {
  participantName: string
  sessionName: string
  sessionUrl: string
  scheduledDate: Date
  companyName?: string
}

export function renderCalibrationInviteTemplate(
  variables: CalibrationInviteVariables
): { subject: string; html: string } {

  const formattedDate = new Date(variables.scheduledDate).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const companyName = variables.companyName || 'Tu Empresa'

  const bodyContent = [
    EmailHeader({ companyName }),

    EmailHero({
      title: 'Sesión de Calibración',
      subtitle: `Has sido invitado/a como panelista a "${variables.sessionName}"`,
      badge: 'Calibración'
    }),

    EmailContentSection({
      greeting: `Hola <strong>${variables.participantName}</strong>,`,
      paragraphs: [
        'Has sido seleccionado/a para participar como <strong>panelista</strong> en una sesión de calibración de desempeño.',
        'Tu criterio profesional es fundamental para asegurar equidad y objetividad en las evaluaciones del equipo.'
      ],
      highlight: {
        icon: 'clock',
        title: 'Fecha programada',
        text: formattedDate,
        variant: 'info'
      }
    }),

    EmailFeatureList({
      features: [
        {
          icon: 'target',
          title: 'Revisar evaluaciones',
          description: 'Analiza los resultados de desempeño de los colaboradores asignados'
        },
        {
          icon: 'users',
          title: 'Proponer ajustes',
          description: 'Sugiere modificaciones cuando identifiques oportunidades de mejora'
        },
        {
          icon: 'check',
          title: 'Asegurar equidad',
          description: 'Contribuye a que las evaluaciones sean justas y consistentes'
        }
      ]
    }),

    EmailCTASection({
      buttonText: 'Ingresar a Sesión',
      buttonUrl: variables.sessionUrl
    }),

    EmailHighlightBox({
      icon: 'alert',
      title: 'Importante',
      text: 'Esta sesión estará disponible hasta su cierre oficial. Se recomienda revisar con antelación.',
      variant: 'warning'
    }),

    EmailFooter()
  ].join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.slate50}; -webkit-font-smoothing: antialiased;">
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

  return {
    subject: `Invitación Calibración: ${variables.sessionName}`,
    html
  }
}
