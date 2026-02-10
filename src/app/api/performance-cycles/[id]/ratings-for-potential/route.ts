// src/app/api/performance-cycles/[id]/ratings-for-potential/route.ts
// Endpoint para la página Cinema Mode de asignación de potencial
// Retorna ratings con score > 0 para un ciclo, filtrado por permisos

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Permiso funcional: necesita potential:assign o potential:view
    if (!hasPermission(userContext.role, 'potential:assign') && !hasPermission(userContext.role, 'potential:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // Validar ciclo pertenece a la cuenta
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: cycleId,
        accountId: userContext.accountId
      },
      select: { id: true, name: true, accountId: true }
    })

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      )
    }

    // Determinar filtro: admins ven todo, managers ven solo sus reportes
    const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
      .includes(userContext.role || '')

    const where: any = {
      cycleId,
      accountId: userContext.accountId,
      calculatedScore: { gt: 0 }  // Solo evaluados
    }

    // Si no es admin, filtrar por jefe directo
    if (!isSystemAdmin) {
      const loggedInEmployee = await prisma.employee.findFirst({
        where: {
          accountId: userContext.accountId,
          email: userEmail,
          isActive: true
        },
        select: { id: true }
      })

      if (!loggedInEmployee) {
        return NextResponse.json({
          success: true,
          cycleName: cycle.name,
          ratings: []
        })
      }

      // Solo empleados donde soy el manager
      where.employee = { managerId: loggedInEmployee.id }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: {
              select: { displayName: true }
            }
          }
        }
      },
      orderBy: [
        { potentialScore: 'asc' },  // null (pendientes) primero
        { employee: { fullName: 'asc' } }
      ]
    })

    const mapped = ratings.map(r => ({
      id: r.employee.id,
      ratingId: r.id,
      fullName: r.employee.fullName,
      position: r.employee.position || 'Sin cargo',
      department: r.employee.department?.displayName || 'Sin departamento',
      performanceScore: r.finalScore ?? r.calculatedScore,
      performanceLevel: r.finalLevel ?? r.calculatedLevel,
      potentialScore: r.potentialScore,
      potentialAspiration: r.potentialAspiration,
      potentialAbility: r.potentialAbility,
      potentialEngagement: r.potentialEngagement,
      potentialNotes: r.potentialNotes,
      nineBoxPosition: r.nineBoxPosition
    }))

    return NextResponse.json({
      success: true,
      cycleName: cycle.name,
      ratings: mapped
    })

  } catch (error) {
    console.error('[API ERROR] ratings-for-potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
