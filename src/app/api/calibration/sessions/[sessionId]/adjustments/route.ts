// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/adjustments
// GET - Listar ajustes | POST - Crear ajuste
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import {
  getPerformanceClassification,
  scoreToNineBoxLevel,
  calculate9BoxPosition
} from '@/config/performanceClassification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const adjustments = await prisma.calibrationAdjustment.findMany({
      where: { sessionId },
      include: {
        rating: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                position: true,
                departmentId: true
              }
            }
          }
        }
      },
      orderBy: { adjustedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: adjustments
    })

  } catch (error) {
    console.error('[API] Error GET adjustments:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

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

    // ═══ CHECK 3: Validar que la sesión pertenece al accountId ═══
    const session = await prisma.calibrationSession.findFirst({
      where: {
        id: sessionId,
        accountId: userContext.accountId  // ← Defense-in-depth
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Validar que la sesión está activa
    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Solo se puede calibrar en sesiones activas' },
        { status: 400 }
      )
    }

    // ═══ VALIDACIÓN DE ROL CONTEXTUAL A LA SESIÓN ═══
    // Verificar que el usuario es participante Y tiene rol permitido
    const participant = await prisma.calibrationParticipant.findUnique({
      where: {
        sessionId_participantEmail: {
          sessionId,
          participantEmail: userEmail
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'No eres participante de esta sesión' },
        { status: 403 }
      )
    }

    // Solo FACILITATOR y REVIEWER pueden hacer ajustes
    if (!['FACILITATOR', 'REVIEWER'].includes(participant.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tu rol (${participant.role}) no permite hacer ajustes. Solo FACILITATOR y REVIEWER pueden ajustar.`
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ratingId, newFinalScore, newPotentialScore, justification } = body

    // Validaciones
    if (!ratingId || !justification) {
      return NextResponse.json(
        { success: false, error: 'ratingId y justification son requeridos' },
        { status: 400 }
      )
    }

    if (justification.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'La justificación debe tener al menos 10 caracteres' },
        { status: 400 }
      )
    }

    // ═══ CHECK 3 + 6: Obtener rating CON validación multi-tenant + jerárquica ═══
    const rating = await prisma.performanceRating.findFirst({
      where: {
        id: ratingId,
        accountId: userContext.accountId  // ← CHECK 3: accountId obligatorio
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            departmentId: true
          }
        }
      }
    })

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }

    // ═══ CHECK 4: Si AREA_MANAGER, validar scope departamental ═══
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]

      if (!allowedDepts.includes(rating.employee.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Este empleado está fuera de tu ámbito jerárquico' },
          { status: 403 }
        )
      }
    }

    // Preparar snapshot de valores anteriores
    const previousValues = {
      previousFinalScore: rating.finalScore,
      previousFinalLevel: rating.finalLevel,
      previousPotentialScore: rating.potentialScore,
      previousPotentialLevel: rating.potentialLevel,
      previousNineBox: rating.nineBoxPosition
    }

    // Calcular nuevos valores propuestos con performanceClassification.ts
    let newFinalLevel: string | null = null
    let newPotentialLevel: string | null = null
    let newNineBox: string | null = null

    // Calcular nivel para final score
    if (newFinalScore !== undefined && newFinalScore !== null) {
      const classification = getPerformanceClassification(newFinalScore)
      newFinalLevel = classification.level
    }

    // Calcular nivel para potential score
    if (newPotentialScore !== undefined && newPotentialScore !== null) {
      newPotentialLevel = scoreToNineBoxLevel(newPotentialScore)
    }

    // Recalcular 9-Box si tenemos ambos scores
    const effectiveFinalScore = newFinalScore ?? rating.finalScore ?? rating.calculatedScore
    const effectivePotential = newPotentialScore ?? rating.potentialScore

    if (effectivePotential) {
      const performanceLevel = scoreToNineBoxLevel(effectiveFinalScore)
      const potentialLevel = scoreToNineBoxLevel(effectivePotential)
      newNineBox = calculate9BoxPosition(performanceLevel, potentialLevel)
    }

    // ═══ ESTADO TRANSITORIO: Solo crear adjustment con status PENDING ═══
    // NO se toca PerformanceRating aquí - solo al cerrar sesión
    const adjustment = await prisma.calibrationAdjustment.create({
      data: {
        sessionId,
        ratingId,
        ...previousValues,
        newFinalScore: newFinalScore ?? null,
        newFinalLevel,
        newPotentialScore: newPotentialScore ?? null,
        newPotentialLevel,
        newNineBox,
        justification: justification.trim(),
        adjustedBy: userEmail,
        status: 'PENDING'
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_ADJUSTMENT_CREATED',
        accountId: userContext.accountId,
        entityType: 'calibration_adjustment',
        entityId: adjustment.id,
        oldValues: previousValues,
        newValues: {
          newFinalScore,
          newFinalLevel,
          newPotentialScore,
          newPotentialLevel,
          newNineBox
        },
        userInfo: {
          email: userEmail,
          sessionId,
          ratingId,
          employeeName: rating.employee.fullName,
          justification: justification.trim(),
          delta: newFinalScore ? newFinalScore - (rating.finalScore || rating.calculatedScore) : null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        adjustment,
        preview: {
          currentScore: rating.finalScore ?? rating.calculatedScore,
          proposedScore: newFinalScore,
          currentLevel: rating.finalLevel ?? rating.calculatedLevel,
          proposedLevel: newFinalLevel
        }
      },
      message: 'Ajuste propuesto creado (pendiente de aplicar al cerrar sesión)'
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error POST adjustment:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
