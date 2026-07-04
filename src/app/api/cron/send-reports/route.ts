// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/send-reports
// Reportes individuales post-cierre ciclo Performance — vía cola unificada
// Schedule: Diario 9:00 UTC (vercel.json)
// ════════════════════════════════════════════════════════════════════════════
// Gate 3 Arquitectura de Envío (jul-2026, resuelve P2-12): generación separada
// del transporte. Este cron NO envía email — genera el reporte UNA sola vez por
// (cycleId, employeeId) y encola en CommunicationMessage; el envío real, retry
// con backoff y la verdad de entrega (status SENT/FAILED) son del dispatcher.
//
// Flujo por evaluado:
//   1. dedupKey performance_report:{cycleId}:{employeeId} → buscar en cola
//   2. Ya en cola:
//      - SENT/DELIVERED/PENDING/SENDING/CANCELLED → skip
//      - FAILED → re-drive a PENDING (misma fila, update no create) con cota:
//        retryCount >= REDRIVE_RETRY_LIMIT → CANCELLED terminal (visible en
//        GET /api/admin/communication-health), no se reintenta más
//   3. No en cola → generar reporte (o reutilizar token de una corrida previa:
//      FeedbackDeliveryConfirmation es el guard de "generar una sola vez") y
//      encolar PENDING
//   4. Al final, SIEMPRE disparar la cadena del dispatcher (drena lo encolado
//      y los backoffs vencidos; techo 750/corrida = 15 chains × batch 50 —
//      backlog mayor espera a la corrida siguiente, límite conocido, no bug)
//
// Notas de diseño (maestro ARQUITECTURA_ENVIO_MAESTRO_v1 §4 Gate 3):
//   - FeedbackDeliveryConfirmation.sentAt significa "generado", no "enviado"
//     (no se renombra para no migrar schema; alimenta expiración del token).
//   - Guard de generación es findFirst→create sin @@unique de respaldo: dos
//     corridas solapadas podrían dejar una fila de dominio huérfana. Aceptado
//     como límite conocido — el dedupKey @unique de la cola impide doble envío.
//   - Cron global multi-cuenta por diseño (igual que send-reminders).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { IndividualReportService } from '@/lib/services/IndividualReportService'

export const dynamic = 'force-dynamic'
// Next 14 cachea fetches (incluso POST) hechos dentro de Route Handlers GET y
// force-dynamic NO lo evita (verificado en smoke Gate 3: el GET de la cadena se
// sirvió de .next/cache/fetch-cache). force-no-store lo desactiva para todo
// fetch de este handler (el disparo de cadena de fireDispatcherChain).
export const fetchCache = 'force-no-store'
export const maxDuration = 300

// Dedicado (no 'invitation'): sin chase de recordatorios ni espejo EmailLog,
// por construcción — mismo patrón que exit_invitation / onboarding_touch.
const MESSAGE_TYPE = 'performance_report'
const TEMPLATE_SLUG = 'performance-report-ready'

// Cota del re-drive (decisión Victor 2026-07-03): el dispatcher NO incrementa
// retryCount al marcar FAILED terminal, así que cada re-drive produce UN solo
// intento (retryCount ya quedó en MAX_RETRY=3). Este cron incrementa retryCount
// en cada re-drive: 8 = 4 intentos de la corrida inicial + 5 re-drives diarios
// ≈ 5 días antes de CANCELLED. (El "15" de la spec asumía 3 intentos por
// re-drive, que no es el comportamiento real del dispatcher.)
const REDRIVE_RETRY_LIMIT = 8
const CANCELLED_ERROR_MESSAGE =
  'Permanentemente fallido tras 5 re-drives — requiere revisión manual'

function buildDedupKey(cycleId: string, employeeId: string): string {
  return `performance_report:${cycleId}:${employeeId}`
}

// Capa 1 del disparo del dispatcher (mismo patrón que activate/route.ts):
// si faltan env vars, lo encolado espera a la próxima corrida diaria.
function fireDispatcherChain(): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  const cronSecret = process.env.CRON_SECRET

  if (!baseUrl || !cronSecret) {
    console.warn('[SendReports] Sin base URL o CRON_SECRET; drenaje queda para la corrida diaria')
    return
  }

  waitUntil(
    fetch(`${baseUrl}/api/cron/message-dispatcher?chain=0`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    }).catch((err) => {
      console.error('[SendReports] Disparo de cadena falló:', err instanceof Error ? err.message : err)
    })
  )
}

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

    let cyclesProcessed = 0
    let generated = 0    // reportes nuevos (token nuevo)
    let enqueued = 0     // mensajes nuevos en la cola
    let redriven = 0     // FAILED → PENDING (misma fila)
    let cancelled = 0    // FAILED → CANCELLED terminal (cota agotada)
    let skipped = 0      // ya en cola (SENT/DELIVERED/PENDING/SENDING/CANCELLED)
    let sinEmail = 0     // evaluado sin email corporativo
    let errors = 0

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

      cyclesProcessed++

      // Obtener evaluados únicos del ciclo (Employee IDs)
      const evaluatees = await prisma.evaluationAssignment.findMany({
        where: { cycleId: cycle.id },
        select: { evaluateeId: true },
        distinct: ['evaluateeId']
      })

      for (const { evaluateeId } of evaluatees) {
        try {
          const dedupKey = buildDedupKey(cycle.id, evaluateeId)
          const existingMessage = await prisma.communicationMessage.findUnique({
            where: { dedupKey }
          })

          // ── Ya en cola: re-drive si FAILED, skip en cualquier otro estado ──
          if (existingMessage) {
            if (existingMessage.status !== 'FAILED') {
              skipped++
              continue
            }

            if (existingMessage.retryCount >= REDRIVE_RETRY_LIMIT) {
              await prisma.communicationMessage.update({
                where: { id: existingMessage.id },
                data: {
                  status: 'CANCELLED',
                  errorMessage: CANCELLED_ERROR_MESSAGE
                }
              })
              cancelled++
              continue
            }

            // Re-drive: misma fila (update, no create — dedupKey es @unique),
            // retryCount acumula entre re-drives (es la cota, no se resetea).
            await prisma.communicationMessage.update({
              where: { id: existingMessage.id },
              data: {
                status: 'PENDING',
                scheduledAt: now,
                failedAt: null,
                errorMessage: null,
                retryCount: { increment: 1 }
              }
            })
            redriven++
            continue
          }

          // ── No en cola: generar (una sola vez) + encolar ──────────────────
          // Email primero: sin destinatario no se genera nada (evita tokens
          // huérfanos para evaluados sin email corporativo).
          const employee = await prisma.employee.findUnique({
            where: { id: evaluateeId },
            select: { email: true, fullName: true }
          })

          if (!employee?.email) {
            sinEmail++
            continue
          }

          // Guard "generar una sola vez": si ya hay fila de dominio (de una
          // corrida anterior, exitosa o no), se reutiliza token — no se
          // regenera el reporte.
          const existingConfirmation = await prisma.feedbackDeliveryConfirmation.findFirst({
            where: {
              cycleId: cycle.id,
              employeeId: evaluateeId
            }
          })

          let reportToken: string
          if (existingConfirmation) {
            reportToken = existingConfirmation.reportToken
          } else {
            const report = await IndividualReportService.generateReport(
              cycle.id,
              evaluateeId
            )
            reportToken = report.accessToken
            generated++
          }

          const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${reportToken}`

          try {
            await prisma.communicationMessage.create({
              data: {
                accountId: cycle.accountId,
                channel: 'EMAIL',
                templateSlug: TEMPLATE_SLUG,
                messageType: MESSAGE_TYPE,
                toEmail: employee.email,
                employeeId: evaluateeId,
                variables: {
                  employee_name: employee.fullName,
                  cycle_name: cycle.name,
                  report_url: reportUrl,
                  expiration_days: String(cycle.account.reportLinkExpirationDays),
                  company_name: cycle.account.companyName
                },
                dedupKey,
                scheduledAt: now
              }
            })
            enqueued++
          } catch (createError) {
            // Carrera contra dedupKey @unique (corrida solapada ya encoló):
            // tratar como "ya en cola", no como error.
            if (
              createError instanceof Prisma.PrismaClientKnownRequestError &&
              createError.code === 'P2002'
            ) {
              skipped++
              continue
            }
            throw createError
          }

        } catch (evaluateeError) {
          console.error(
            `[SendReports] Error procesando evaluatee ${evaluateeId} en ciclo ${cycle.id}:`,
            evaluateeError instanceof Error ? evaluateeError.message : evaluateeError
          )
          errors++
          // Continuar con el siguiente evaluado
          continue
        }
      }
    }

    // Drenaje: siempre disparar la cadena — además de lo recién encolado,
    // recoge los reintentos con scheduledAt de backoff ya vencido (este cron
    // diario es su red de seguridad; el dispatcher no tiene cron propio en Hobby).
    fireDispatcherChain()

    return NextResponse.json({
      success: true,
      data: {
        cyclesProcessed,
        generated,
        enqueued,
        redriven,
        cancelled,
        skipped,
        sinEmail,
        errors
      }
    })

  } catch (error) {
    console.error('Error en send-reports cron:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
