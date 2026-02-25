// src/app/api/config/goals-impact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'goals:config')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const accountId = userContext.accountId

    // Contar empleados elegibles (cargos con hasGoals = true)
    const eligibleJobLevels = await prisma.goalJobConfig.findMany({
      where: { accountId, hasGoals: true },
      select: { standardJobLevel: true }
    })
    const eligibleEmployees = await prisma.employee.count({
      where: {
        accountId,
        status: 'ACTIVE',
        standardJobLevel: {
          in: eligibleJobLevels.map(c => c.standardJobLevel)
        }
      }
    })

    // Contar grupos activos
    const activeGroups = await prisma.goalGroup.count({
      where: { accountId }
    })

    // Contar reglas de cascada
    const cascadeRules = await prisma.goalCascadeRule.count({
      where: { accountId }
    })

    // Estimar metas (elegibles * promedio reglas activas, máx 3 por persona)
    const estimatedGoals = Math.min(eligibleEmployees * Math.max(cascadeRules, 1), eligibleEmployees * 3)

    return NextResponse.json({
      success: true,
      data: {
        eligibleEmployees,
        activeGroups,
        cascadeRules,
        estimatedGoals,
      }
    })
  } catch (error) {
    console.error('[API goals-impact]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
