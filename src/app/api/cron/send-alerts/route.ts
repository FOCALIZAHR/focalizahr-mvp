// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-alerts
// Alertas automáticas a admin por baja tasa de respuesta en ciclos Performance
// Schedule: Diario 12:00 UTC
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    // Validar CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Buscar ciclos ACTIVE que cierran en 3 días y tienen baja respuesta
    const cyclesAtRisk = await prisma.performanceCycle.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: {
        account: {
          select: {
            adminEmail: true,
            companyName: true
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      }
    })

    const alertsSent: Array<{
      cycleId: string
      cycleName: string
      completionRate: string
      adminEmail: string
    }> = []

    for (const cycle of cyclesAtRisk) {
      // Contar evaluaciones completadas
      const completed = await prisma.evaluationAssignment.count({
        where: {
          cycleId: cycle.id,
          status: 'COMPLETED'
        }
      })

      const total = cycle._count.assignments
      const completionRate = total > 0 ? (completed / total) * 100 : 100

      // Alerta si < 50%
      if (completionRate < 50) {
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: cycle.account.adminEmail,
          subject: `🚨 Alerta: Baja Tasa de Respuesta en ${cycle.name}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #EF444420; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #991B1B;">
                  <strong>🚨 ALERTA AUTOMÁTICA - BAJA PARTICIPACIÓN</strong>
                </p>
              </div>

              <h2 style="color: #1E293B;">Ciclo con Riesgo de Incumplimiento</h2>

              <p style="color: #64748B;">
                El ciclo <strong>${cycle.name}</strong> cierra en aproximadamente
                <strong style="color: #F59E0B;">3 días</strong> y presenta baja tasa de respuesta:
              </p>

              <div style="background: linear-gradient(135deg, #EF444420, #F59E0B20); padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 36px; color: #EF4444; font-weight: 700; text-align: center;">
                  ${completionRate.toFixed(0)}%
                </p>
                <p style="margin: 5px 0 0 0; text-align: center; color: #64748B; font-size: 14px;">
                  ${completed} de ${total} evaluaciones completadas
                </p>
              </div>

              <p style="color: #64748B;">
                <strong>Acciones recomendadas:</strong>
              </p>
              <ul style="color: #64748B;">
                <li>Revisar quiénes no han completado</li>
                <li>Enviar recordatorios personalizados</li>
                <li>Considerar extensión de plazo si es necesario</li>
              </ul>

              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/admin/performance-cycles/${cycle.id}"
                 style="display: inline-block; background: #EF4444; color: #FFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600;">
                Ver Detalle del Ciclo
              </a>
            </div>
          `
        })

        if (!error) {
          alertsSent.push({
            cycleId: cycle.id,
            cycleName: cycle.name,
            completionRate: completionRate.toFixed(1),
            adminEmail: cycle.account.adminEmail
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      alertsSent: alertsSent.length,
      alerts: alertsSent
    })

  } catch (error) {
    console.error('Error en send-alerts cron:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
