// ════════════════════════════════════════════════════════════════════════════
// API: /api/performance-ratings/[id]/potential
// POST - Asignar rating de potencial (para 9-Box)
// GET - Obtener datos de potencial
// DELETE - Eliminar rating de potencial
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    // Validar autenticación
    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CAPA 1: PERMISO FUNCIONAL CENTRALIZADO (AuthorizationService)
    // ════════════════════════════════════════════════════════════════════════════
    if (!hasPermission(userContext.role, 'potential:assign')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para asignar potencial' },
        { status: 403 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SECURITY: Validar que el rating pertenece a la cuenta
    // ════════════════════════════════════════════════════════════════════════════
    const rating = await prisma.performanceRating.findFirst({
      where: {
        id: ratingId,
        accountId: userContext.accountId  // SECURITY: Multi-tenant
      },
      include: {
        employee: { select: { id: true, departmentId: true, managerId: true } }
      }
    })

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado o sin acceso' },
        { status: 404 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CAPA 2: LÓGICA DE NEGOCIO - JEFE DIRECTO
    // Admins del sistema pueden asignar a cualquiera.
    // Otros roles solo a sus reportes directos.
    // ════════════════════════════════════════════════════════════════════════════
    const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
      .includes(userContext.role || '')

    if (!isSystemAdmin) {
      // Si es AREA_MANAGER, primero validar scope departamental
      if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
        const childIds = await getChildDepartmentIds(userContext.departmentId)
        const allowedDepts = [userContext.departmentId, ...childIds]

        if (!rating.employee?.departmentId || !allowedDepts.includes(rating.employee.departmentId)) {
          return NextResponse.json(
            { success: false, error: 'Sin acceso - empleado fuera de su ámbito jerárquico' },
            { status: 403 }
          )
        }
      }

      // Buscar Employee del usuario logueado para verificar jefe directo
      const loggedInEmployee = await prisma.employee.findFirst({
        where: {
          accountId: userContext.accountId,
          email: userEmail,
          isActive: true
        },
        select: { id: true }
      })

      // Verificar que es jefe directo
      const isDirectManager = loggedInEmployee &&
        rating.employee?.managerId === loggedInEmployee.id

      if (!isDirectManager) {
        return NextResponse.json(
          { success: false, error: 'Solo el jefe directo puede asignar potencial a este colaborador' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { potentialScore, notes, aspiration, ability, engagement } = body

    // Validar: debe venir score directo O los 3 factores AAE
    const hasAllFactors = aspiration !== undefined && ability !== undefined && engagement !== undefined

    if (potentialScore === undefined && !hasAllFactors) {
      return NextResponse.json(
        { success: false, error: 'Se requiere potentialScore o los 3 factores (aspiration, ability, engagement)' },
        { status: 400 }
      )
    }

    // Validar factores AAE (cada uno debe ser 1, 2 o 3)
    if (hasAllFactors) {
      const validLevels = [1, 2, 3]
      if (!validLevels.includes(aspiration) || !validLevels.includes(ability) || !validLevels.includes(engagement)) {
        return NextResponse.json(
          { success: false, error: 'Cada factor (aspiration, ability, engagement) debe ser 1, 2 o 3' },
          { status: 400 }
        )
      }
    }

    // Validar score directo (backward compatible)
    if (potentialScore !== undefined && !hasAllFactors) {
      if (typeof potentialScore !== 'number' || potentialScore < 1 || potentialScore > 5) {
        return NextResponse.json(
          { success: false, error: 'potentialScore debe ser un número entre 1 y 5' },
          { status: 400 }
        )
      }
    }

    // Asignar potencial usando el service
    const updated = await PerformanceRatingService.ratePotential({
      ratingId,
      potentialScore: hasAllFactors ? undefined : potentialScore,
      aspiration: hasAllFactors ? aspiration : undefined,
      ability: hasAllFactors ? ability : undefined,
      engagement: hasAllFactors ? engagement : undefined,
      notes: notes || undefined,
      ratedBy: userEmail
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        potentialScore: updated.potentialScore,
        potentialLevel: updated.potentialLevel,
        nineBoxPosition: updated.nineBoxPosition,
        potentialRatedBy: updated.potentialRatedBy,
        potentialRatedAt: updated.potentialRatedAt,
        potentialAspiration: updated.potentialAspiration,
        potentialAbility: updated.potentialAbility,
        potentialEngagement: updated.potentialEngagement
      },
      message: `Potencial asignado: ${updated.potentialLevel} → Posición 9-Box: ${updated.nineBoxPosition}`
    })

  } catch (error) {
    console.error('[API] Error en POST /api/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // SECURITY FIX: Validar accountId
    const rating = await prisma.performanceRating.findFirst({
      where: {
        id: ratingId,
        accountId: userContext.accountId  // SECURITY: Multi-tenant
      },
      select: {
        id: true,
        calculatedScore: true,
        calculatedLevel: true,
        finalScore: true,
        finalLevel: true,
        potentialScore: true,
        potentialLevel: true,
        potentialRatedBy: true,
        potentialRatedAt: true,
        potentialNotes: true,
        nineBoxPosition: true,
        potentialAspiration: true,
        potentialAbility: true,
        potentialEngagement: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
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

    // SECURITY: Si es AREA_MANAGER, validar scope
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]

      if (!rating.employee?.departmentId || !allowedDepts.includes(rating.employee.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Sin acceso a este rating' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: rating
    })

  } catch (error) {
    console.error('[API] Error en GET /api/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CAPA 1: PERMISO FUNCIONAL CENTRALIZADO
    // ════════════════════════════════════════════════════════════════════════════
    if (!hasPermission(userContext.role, 'potential:assign')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar potencial' },
        { status: 403 }
      )
    }

    // SECURITY: Validar que el rating pertenece a la cuenta
    const rating = await prisma.performanceRating.findFirst({
      where: {
        id: ratingId,
        accountId: userContext.accountId  // SECURITY: Multi-tenant
      },
      include: {
        employee: { select: { id: true, departmentId: true, managerId: true } }
      }
    })

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado o sin acceso' },
        { status: 404 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CAPA 2: LÓGICA DE NEGOCIO - JEFE DIRECTO
    // ════════════════════════════════════════════════════════════════════════════
    const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
      .includes(userContext.role || '')

    if (!isSystemAdmin) {
      // Si es AREA_MANAGER, validar scope departamental
      if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
        const childIds = await getChildDepartmentIds(userContext.departmentId)
        const allowedDepts = [userContext.departmentId, ...childIds]

        if (!rating.employee?.departmentId || !allowedDepts.includes(rating.employee.departmentId)) {
          return NextResponse.json(
            { success: false, error: 'Sin acceso - empleado fuera de su ámbito jerárquico' },
            { status: 403 }
          )
        }
      }

      // Verificar jefe directo
      const loggedInEmployee = await prisma.employee.findFirst({
        where: {
          accountId: userContext.accountId,
          email: userEmail,
          isActive: true
        },
        select: { id: true }
      })

      const isDirectManager = loggedInEmployee &&
        rating.employee?.managerId === loggedInEmployee.id

      if (!isDirectManager) {
        return NextResponse.json(
          { success: false, error: 'Solo el jefe directo puede eliminar el potencial de este colaborador' },
          { status: 403 }
        )
      }
    }

    // Limpiar campos de potencial (incluye factores AAE)
    const cleared = await prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        potentialScore: null,
        potentialLevel: null,
        potentialRatedBy: null,
        potentialRatedAt: null,
        potentialNotes: null,
        nineBoxPosition: null,
        potentialAspiration: null,
        potentialAbility: null,
        potentialEngagement: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: cleared.id },
      message: 'Rating de potencial eliminado'
    })

  } catch (error) {
    console.error('[API] Error en DELETE /api/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
