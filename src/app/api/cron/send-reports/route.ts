// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-reports
// Envío automático reportes individuales post-cierre ciclo Performance
// Schedule: Diario 9:00 UTC
// ════════════════════════════════════════════════════════════════════════════
// Flujo:
// 1. Buscar ciclos COMPLETED cuyo endDate + delay ya pasó
// 2. Para cada evaluado único, generar reporte individual
// 3. Enviar email con link al reporte
// 4. Rate limiting: 550ms entre envíos
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IndividualReportService } from '@/lib/services/IndividualReportService'
import { renderEmailTemplate } from '@/lib/templates/email-templates'
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

    // Buscar ciclos COMPLETED que deben enviar reportes
    // No hay closedAt en schema, usamos endDate + reportDeliveryDelayDays
    const cyclesToProcess = await prisma.performanceCycle.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        account: {
          select: {
            companyName: true,
            reportDeliveryDelayDays: true,
            reportLinkExpirationDays: true,
            enableEmployeeReports: true
          }
        }
      }
    })

    const reportsSent: Array<{
      cycleId: string
      employeeId: string
      employeeEmail: string
    }> = []

    for (const cycle of cyclesToProcess) {
      // Verificar feature habilitado
      if (!cycle.account.enableEmployeeReports) {
        continue
      }

      // Verificar que ya pasó el delay post-cierre
      const delayDays = cycle.account.reportDeliveryDelayDays || 7
      const delayMs = delayDays * 24 * 60 * 60 * 1000
      const readyDate = new Date(cycle.endDate.getTime() + delayMs)

      if (now < readyDate) {
        continue // Aún no es momento de enviar
      }

      // Obtener evaluados únicos del ciclo (Employee IDs)
      const evaluatees = await prisma.evaluationAssignment.findMany({
        where: { cycleId: cycle.id },
        select: { evaluateeId: true },
        distinct: ['evaluateeId']
      })

      for (const { evaluateeId } of evaluatees) {
        // Verificar si ya se envió reporte para este evaluado en este ciclo
        const existing = await prisma.feedbackDeliveryConfirmation.findFirst({
          where: {
            cycleId: cycle.id,
            employeeId: evaluateeId
          }
        })

        if (existing) {
          continue // Ya enviado
        }

        try {
          // Generar reporte individual
          const report = await IndividualReportService.generateReport(
            cycle.id,
            evaluateeId
          )

          // Obtener email del empleado (Employee model)
          const employee = await prisma.employee.findUnique({
            where: { id: evaluateeId },
            select: { email: true, fullName: true }
          })

          if (!employee?.email) {
            continue // Sin email, no se puede enviar
          }

          // Renderizar template email
          const { subject, html } = renderEmailTemplate(
            'performance-report-ready',
            {
              employee_name: employee.fullName,
              cycle_name: cycle.name,
              report_url: report.accessUrl,
              expiration_days: String(cycle.account.reportLinkExpirationDays),
              company_name: cycle.account.companyName
            }
          )

          // Enviar email via Resend
          const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: employee.email,
            subject,
            html
          })

          if (!error) {
            reportsSent.push({
              cycleId: cycle.id,
              employeeId: evaluateeId,
              employeeEmail: employee.email
            })
          }

          // Rate limiting: 550ms entre envíos (~1.8 req/s)
          await new Promise(resolve => setTimeout(resolve, 550))

        } catch (reportError) {
          console.error(`Error generando reporte para evaluatee ${evaluateeId} en ciclo ${cycle.id}:`, reportError)
          // Continuar con el siguiente evaluado
          continue
        }
      }
    }

    return NextResponse.json({
      success: true,
      reportsSent: reportsSent.length,
      reports: reportsSent
    })

  } catch (error) {
    console.error('Error en send-reports cron:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
