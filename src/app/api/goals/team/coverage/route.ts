// src/app/api/goals/team/coverage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    // Obtener empleado actual por email del header
    const userEmail = request.headers.get('x-user-email')
    const employee = userEmail
      ? await prisma.employee.findFirst({
          where: {
            accountId: context.accountId,
            email: userEmail,
            status: 'ACTIVE',
          },
        })
      : null

    if (!employee) {
      return NextResponse.json({
        data: { total: 0, withGoals: 0, percentage: 0 },
        success: true,
      })
    }

    // Contar subordinados directos
    const directReports = await prisma.employee.findMany({
      where: {
        managerId: employee.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        goals: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
    })

    const total = directReports.length
    const withGoals = directReports.filter((e) => e.goals.length > 0).length
    const percentage = total > 0 ? Math.round((withGoals / total) * 100) : 0

    return NextResponse.json({
      data: { total, withGoals, percentage },
      success: true,
    })
  } catch (error: unknown) {
    console.error('[API goals/team/coverage]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo cobertura', success: false },
      { status: 500 }
    )
  }
}
