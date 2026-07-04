// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-calibration-emails
// Envío automático de invitaciones a sesiones de calibración programadas
// Schedule: Diario 13:00 UTC (vercel.json)
// ════════════════════════════════════════════════════════════════════════════
// Gate 4 Arquitectura de Envío (jul-2026):
//   - Hobby: 1x/día por límite de plan. Al pasar a Vercel Pro (target ~ago 2026),
//     subir la cadencia a */5 * * * * en vercel.json — cambio de una línea, sin código.
//   - La ventana de "horario hábil" para crons del sistema es política transversal
//     delegada al proyecto Comunicaciones v3.0 (maestro §5) — no se implementa acá.
//   - Dedup POR PARTICIPANTE, no por sesión: el skip-set de una sesión es la unión
//     de userInfo.sentEmails de todos sus AuditLog 'calibration_emails_sent'
//     (append-only: cada corrida agrega un log con SUS éxitos, nunca se edita uno
//     previo). Un batch con éxito parcial reintenta solo a los fallidos en la
//     corrida siguiente, sin doble envío a los exitosos.
//   - Compat formato viejo: un log SIN sentEmails (pre-Gate 4) marca la sesión
//     como completamente enviada (comportamiento histórico, cero doble-envío).
//   - Límite conocido (aceptado): un email permanentemente inválido reintenta
//     1x/día para siempre, visible en los errors del log. Si Calibración escala,
//     un flag por CalibrationParticipant sería más limpio que el JSON del log.
//
// Flujo:
// 1. Busca CalibrationSessions con status=IN_PROGRESS y scheduledAt <= NOW
// 2. Calcula pendientes = participantes − skip-set (unión de sentEmails)
// 3. Envía solo a pendientes
// 4. Registra AuditLog nuevo con los éxitos de ESTA corrida
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderCalibrationInviteTemplate } from '@/lib/templates/calibration-invite-template'
import { sendEmail } from '@/lib/services/email-service'

export const dynamic = 'force-dynamic'
// Next 14 cachea fetch() (incluso POST a Resend) dentro de Route Handlers GET y
// force-dynamic no lo evita — un retry con body idéntico daría falso éxito con
// respuesta cacheada (verificado en smoke Gate 3). force-no-store lo desactiva.
export const fetchCache = 'force-no-store'

/**
 * Skip-set de una sesión: unión de sentEmails (lowercase) de todos sus logs.
 * Retorna null si hay un log de formato viejo (sin sentEmails) → sesión completa.
 */
function buildSkipSet(logs: { userInfo: unknown }[]): Set<string> | null {
  const sentSet = new Set<string>()
  for (const log of logs) {
    const info = log.userInfo as { sentEmails?: unknown } | null
    const sentEmails = Array.isArray(info?.sentEmails) ? info?.sentEmails : null
    if (sentEmails === null) {
      return null // formato pre-Gate 4: la sesión ya se dio por enviada
    }
    for (const email of sentEmails) {
      if (typeof email === 'string') sentSet.add(email.toLowerCase())
    }
  }
  return sentSet
}

export async function GET(request: NextRequest) {
  // Validar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // 1. Buscar sesiones IN_PROGRESS con scheduledAt ya pasado
    const sessions = await prisma.calibrationSession.findMany({
      where: {
        status: 'IN_PROGRESS',
        scheduledAt: { lte: new Date() }
      },
      include: {
        participants: true,
        account: { select: { companyName: true } }
      }
    })

    let totalSent = 0
    let totalSkipped = 0
    const allErrors: string[] = []
    const processedSessions: string[] = []

    for (const session of sessions) {
      // 2. Skip-set por participante (unión de sentEmails de todos los logs)
      const emailLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'calibration_session',
          entityId: session.id,
          action: 'calibration_emails_sent'
        },
        select: { userInfo: true }
      })

      const skipSet = buildSkipSet(emailLogs)
      if (skipSet === null) {
        continue // log formato viejo: sesión ya enviada completa
      }

      const pending = session.participants.filter(
        (p) => !skipSet.has(p.participantEmail.toLowerCase())
      )

      if (pending.length === 0) {
        totalSkipped += session.participants.length
        continue // todos los participantes ya recibieron — sin log nuevo, sin spam
      }

      totalSkipped += session.participants.length - pending.length

      // 3. Enviar solo a los pendientes
      const sessionUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.focalizahr.cl'}/dashboard/performance/calibration/sessions/${session.id}`
      const sentEmails: string[] = []
      const sessionErrors: string[] = []

      for (const participant of pending) {
        try {
          const { subject, html } = renderCalibrationInviteTemplate({
            participantName: participant.participantName,
            sessionName: session.name,
            sessionUrl,
            scheduledDate: session.scheduledAt || new Date(),
            companyName: session.account.companyName
          })

          const sendResult = await sendEmail({
            to: participant.participantEmail,
            subject,
            html
          })

          if (!sendResult.success) {
            sessionErrors.push(`${participant.participantEmail}: ${sendResult.error}`)
            continue
          }

          sentEmails.push(participant.participantEmail)

          // Rate limit: 550ms entre emails (protocolo Resend)
          await new Promise(resolve => setTimeout(resolve, 550))
        } catch (err: any) {
          sessionErrors.push(`${participant.participantEmail}: ${err.message}`)
        }
      }

      // 4. Registrar AuditLog de ESTA corrida (append-only; los éxitos de corridas
      // anteriores viven en sus propios logs). Los fallidos NO van en sentEmails →
      // la corrida siguiente los reintenta.
      await prisma.auditLog.create({
        data: {
          accountId: session.accountId,
          action: 'calibration_emails_sent',
          entityType: 'calibration_session',
          entityId: session.id,
          userInfo: {
            sentByCron: true,
            emailsSent: sentEmails.length,
            emailErrors: sessionErrors.length,
            sentEmails,
            errors: sessionErrors.length > 0 ? sessionErrors : undefined,
            sentAt: new Date().toISOString()
          }
        }
      })

      totalSent += sentEmails.length
      allErrors.push(...sessionErrors)
      processedSessions.push(session.id)
    }

    return NextResponse.json({
      success: true,
      sessionsProcessed: processedSessions.length,
      totalEmailsSent: totalSent,
      totalSkipped,
      totalErrors: allErrors.length,
      errors: allErrors.length > 0 ? allErrors : undefined
    })

  } catch (error) {
    console.error('[CRON send-calibration-emails] Error:', error)
    return NextResponse.json(
      { error: 'Error processing calibration emails' },
      { status: 500 }
    )
  }
}
