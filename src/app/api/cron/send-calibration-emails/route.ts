// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-calibration-emails
// Envío automático de invitaciones a sesiones de calibración programadas
// Schedule: Cada hora (0 * * * *)
// ════════════════════════════════════════════════════════════════════════════
// Flujo:
// 1. Busca CalibrationSessions con status=IN_PROGRESS y scheduledAt <= NOW
// 2. Verifica que no exista AuditLog con action='calibration_emails_sent'
// 3. Envía emails a todos los participantes
// 4. Registra AuditLog con resultado
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { renderCalibrationInviteTemplate } from '@/lib/templates/calibration-invite-template'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const allErrors: string[] = []
    const processedSessions: string[] = []

    for (const session of sessions) {
      // 2. Verificar que no se hayan enviado emails ya
      const existingEmailLog = await prisma.auditLog.findFirst({
        where: {
          entityType: 'calibration_session',
          entityId: session.id,
          action: 'calibration_emails_sent'
        }
      })

      if (existingEmailLog) {
        continue // Ya se enviaron emails para esta sesión
      }

      // 3. Enviar emails a participantes
      const sessionUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.focalizahr.cl'}/dashboard/performance/calibration/sessions/${session.id}`
      let sessionSent = 0
      const sessionErrors: string[] = []

      for (const participant of session.participants) {
        try {
          const { subject, html } = renderCalibrationInviteTemplate({
            participantName: participant.participantName,
            sessionName: session.name,
            sessionUrl,
            scheduledDate: session.scheduledAt || new Date(),
            companyName: session.account.companyName
          })

          const { error: resendError } = await resend.emails.send({
            from: 'FocalizaHR <noreply@focalizahr.cl>',
            to: participant.participantEmail,
            subject,
            html
          })

          if (resendError) {
            sessionErrors.push(`${participant.participantEmail}: ${resendError.message}`)
            continue
          }

          sessionSent++

          // Rate limit: 550ms entre emails (protocolo Resend)
          await new Promise(resolve => setTimeout(resolve, 550))
        } catch (err: any) {
          sessionErrors.push(`${participant.participantEmail}: ${err.message}`)
        }
      }

      // 4. Registrar AuditLog
      await prisma.auditLog.create({
        data: {
          accountId: session.accountId,
          action: 'calibration_emails_sent',
          entityType: 'calibration_session',
          entityId: session.id,
          userInfo: {
            sentByCron: true,
            emailsSent: sessionSent,
            emailErrors: sessionErrors.length,
            errors: sessionErrors.length > 0 ? sessionErrors : undefined,
            sentAt: new Date().toISOString()
          }
        }
      })

      totalSent += sessionSent
      allErrors.push(...sessionErrors)
      processedSessions.push(session.id)
    }

    return NextResponse.json({
      success: true,
      sessionsProcessed: processedSessions.length,
      totalEmailsSent: totalSent,
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
