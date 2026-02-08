// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/close
// POST - Cerrar sesión de calibración (COMMIT ATÓMICO de ajustes)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { calculateAdjustmentType } from '@/config/performanceClassification'
import { generateCalibrationAuditPDF } from '@/lib/services/CalibrationAuditPDF'
import { uploadToSupabaseStorage } from '@/lib/services/uploadToSupabaseStorage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    // ═══ CHECK 1: extractUserContext ═══
    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para cerrar sesiones' },
        { status: 403 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: {
        id: sessionId,
        accountId: userContext.accountId  // ← Defense-in-depth
      },
      include: {
        adjustments: {
          where: { status: 'PENDING' }  // Solo los no aplicados
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden cerrar sesiones activas' },
        { status: 400 }
      )
    }

    // Validar distribución forzada si está habilitada
    if (session.enableForcedDistribution && session.distributionTargets) {
      const validation = await validateForcedDistribution(session)

      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'La distribución actual no cumple con los objetivos configurados',
          details: validation.errors
        }, { status: 400 })
      }
    }

    // ═══ COMMIT ATÓMICO: Aplicar todos los ajustes PENDING ═══
    const result = await prisma.$transaction(async (tx) => {
      const applied: string[] = []

      for (const adjustment of session.adjustments) {
        // Construir data de actualización solo con campos que tienen valor
        const ratingUpdateData: any = {
          calibrated: true,
          calibratedAt: new Date(),
          calibratedBy: adjustment.adjustedBy,
          calibrationSessionId: sessionId,
          adjustmentReason: adjustment.justification
        }

        if (adjustment.newFinalScore !== null) {
          ratingUpdateData.finalScore = adjustment.newFinalScore
          ratingUpdateData.finalLevel = adjustment.newFinalLevel
          ratingUpdateData.adjustmentType = calculateAdjustmentType(
            adjustment.previousFinalScore ?? 0,
            adjustment.newFinalScore
          )
        }

        if (adjustment.newPotentialScore !== null) {
          ratingUpdateData.potentialScore = adjustment.newPotentialScore
          ratingUpdateData.potentialLevel = adjustment.newPotentialLevel
        }

        if (adjustment.newNineBox !== null) {
          ratingUpdateData.nineBoxPosition = adjustment.newNineBox
        }

        // Aplicar cambios al PerformanceRating
        await tx.performanceRating.update({
          where: { id: adjustment.ratingId },
          data: ratingUpdateData
        })

        // Marcar ajuste como aplicado
        await tx.calibrationAdjustment.update({
          where: { id: adjustment.id },
          data: {
            status: 'APPLIED',
            appliedAt: new Date()
          }
        })

        applied.push(adjustment.id)
      }

      // Cerrar sesión
      await tx.calibrationSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      })

      return { appliedCount: applied.length }
    })

    // Audit log (fuera de la transacción)
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CLOSED',
        accountId: userContext.accountId,
        entityType: 'calibration_session',
        entityId: sessionId,
        userInfo: {
          email: userEmail,
          sessionName: session.name,
          adjustmentsApplied: result.appliedCount
        }
      }
    })

    // ═══ GENERAR PDF DE AUDITORÍA (Best-effort, no bloquea el cierre) ═══
    let auditPdfUrl: string | null = null
    try {
      // Re-fetch session with applied adjustments for PDF data
      const closedSession = await prisma.calibrationSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: true,
          adjustments: {
            where: { status: 'APPLIED' },
            include: {
              rating: {
                include: { employee: true }
              }
            }
          }
        }
      })

      if (closedSession) {
        const pdfBuffer = await generateCalibrationAuditPDF({
          sessionId: closedSession.id,
          sessionName: closedSession.name,
          closedAt: new Date(),
          facilitator: closedSession.facilitatorId || userEmail,
          participants: closedSession.participants.map(p => p.participantName),
          adjustments: closedSession.adjustments.map(adj => ({
            employeeName: adj.rating.employee.fullName,
            position: adj.rating.employee.position || 'Sin cargo',
            originalScore: adj.previousFinalScore ?? adj.rating.calculatedScore,
            finalScore: adj.newFinalScore ?? adj.rating.calculatedScore,
            originalLevel: adj.previousFinalLevel || adj.rating.calculatedLevel,
            finalLevel: adj.newFinalLevel || adj.rating.calculatedLevel,
            justification: adj.justification
          }))
        })

        const fileName = `calibration-${sessionId}-${Date.now()}.pdf`
        auditPdfUrl = await uploadToSupabaseStorage(fileName, pdfBuffer)

        await prisma.calibrationSession.update({
          where: { id: sessionId },
          data: { auditPdfUrl }
        })
      }
    } catch (pdfError) {
      console.error('[CALIBRATION CLOSE] PDF generation failed (non-blocking):', pdfError)
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        adjustmentsApplied: result.appliedCount,
        closedAt: new Date(),
        auditPdfUrl
      },
      message: `Sesión cerrada. ${result.appliedCount} ajustes aplicados exitosamente.`
    })

  } catch (error) {
    console.error('[API] Error POST close:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper: Validar distribución forzada
async function validateForcedDistribution(session: any) {
  const targets = session.distributionTargets as Record<string, number>
  const tolerance = 5 // +/- 5% de margen

  // Obtener todos los ratings del ciclo
  const ratings = await prisma.performanceRating.findMany({
    where: { cycleId: session.cycleId },
    select: { finalLevel: true, calculatedLevel: true }
  })

  // Calcular distribución actual
  const distribution: Record<string, number> = {}
  const total = ratings.length

  if (total === 0) {
    return { valid: true, errors: [], distribution: {} }
  }

  for (const rating of ratings) {
    const level = rating.finalLevel || rating.calculatedLevel
    distribution[level] = (distribution[level] || 0) + 1
  }

  // Convertir a porcentajes
  const percentDistribution: Record<string, number> = {}
  for (const key in distribution) {
    percentDistribution[key] = Math.round((distribution[key] / total) * 100)
  }

  // Validar cada nivel
  const errors: string[] = []
  for (const [level, target] of Object.entries(targets)) {
    const current = percentDistribution[level] || 0
    const delta = Math.abs(current - target)

    if (delta > tolerance) {
      errors.push(
        `Nivel "${level}": ${current}% (esperado ${target}% ±${tolerance}%)`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    distribution: percentDistribution
  }
}
