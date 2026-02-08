// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/publish
// POST - Publica sesión DRAFT → IN_PROGRESS + programa/envía emails
// ════════════════════════════════════════════════════════════════════════════
// Flujo:
// 1. Valida sesión existe, está en DRAFT, tiene participantes
// 2. Transición DRAFT → IN_PROGRESS
// 3. Si scheduledAt <= ahora: envía emails inmediatamente
// 4. Si scheduledAt > ahora: cron los enviará cuando llegue la fecha
// 5. Registra AuditLog
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { Resend } from 'resend'
import { renderCalibrationInviteTemplate } from '@/lib/templates/calibration-invite-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || 'unknown'
    const { sessionId } = await params

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // 1. Validar sesión
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId, accountId: userContext.accountId },
      include: {
        participants: true,
        cycle: true,
        account: { select: { companyName: true } }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'La sesión ya fue publicada' },
        { status: 400 }
      )
    }

    if (session.participants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'La sesión no tiene participantes' },
        { status: 400 }
      )
    }

    // 2. Transición DRAFT → IN_PROGRESS
    await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    })

    // 3. Determinar si enviar emails ahora o programar para cron
    const scheduledFor = session.scheduledAt || new Date()
    const now = new Date()
    const sendImmediately = scheduledFor <= now

    let emailsSent = 0
    const emailErrors: string[] = []

    if (sendImmediately) {
      // Enviar emails inmediatamente
      const sessionUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.focalizahr.cl'}/dashboard/performance/calibration/sessions/${sessionId}`

      for (const participant of session.participants) {
        try {
          const { subject, html } = renderCalibrationInviteTemplate({
            participantName: participant.participantName,
            sessionName: session.name,
            sessionUrl,
            scheduledDate: scheduledFor,
            companyName: session.account.companyName
          })

          const { error: resendError } = await resend.emails.send({
            from: 'FocalizaHR <noreply@focalizahr.cl>',
            to: participant.participantEmail,
            subject,
            html
          })

          if (resendError) {
            emailErrors.push(`${participant.participantEmail}: ${resendError.message}`)
            continue
          }

          emailsSent++

          // Rate limit: 550ms entre emails (protocolo Resend)
          await new Promise(resolve => setTimeout(resolve, 550))
        } catch (err: any) {
          emailErrors.push(`${participant.participantEmail}: ${err.message}`)
        }
      }

      // Registrar que emails fueron enviados
      await prisma.auditLog.create({
        data: {
          accountId: session.accountId,
          action: 'calibration_emails_sent',
          entityType: 'calibration_session',
          entityId: sessionId,
          userInfo: {
            sentBy: userEmail,
            emailsSent,
            emailErrors: emailErrors.length,
            sentAt: new Date().toISOString()
          }
        }
      })
    }

    // 4. Audit log de publicación
    await prisma.auditLog.create({
      data: {
        accountId: session.accountId,
        action: 'calibration_session_published',
        entityType: 'calibration_session',
        entityId: sessionId,
        userInfo: {
          publishedBy: userEmail,
          participantsCount: session.participants.length,
          emailsSentImmediately: sendImmediately ? emailsSent : 0,
          scheduledFor: scheduledFor.toISOString(),
          sendImmediately
        }
      }
    })

    return NextResponse.json({
      success: true,
      sessionId,
      emailsScheduled: session.participants.length,
      emailsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
      emailScheduledFor: scheduledFor.toISOString(),
      sendImmediately
    })

  } catch (error) {
    console.error('[API POST /calibration/sessions/publish] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error publicando sesión' },
      { status: 500 }
    )
  }
}
