// src/app/api/goals/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver equipo', success: false },
        { status: 403 }
      )
    }

    // Obtener niveles de cargo con metas habilitadas
    const eligibleConfigs = await prisma.goalJobConfig.findMany({
      where: { accountId: context.accountId, hasGoals: true },
      select: { standardJobLevel: true },
    })
    const eligibleLevels = new Set(eligibleConfigs.map((c) => c.standardJobLevel))

    // ═══ CHECK 4: Filtrado jerárquico ═══
    const employeeWhere: any = {
      accountId: context.accountId,
      status: 'ACTIVE',
    }

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)

    if (!hasGlobalAccess) {
      if (context.role === 'AREA_MANAGER' && context.departmentId) {
        const childIds = await getChildDepartmentIds(context.departmentId)
        const allowedDepts = [context.departmentId, ...childIds]
        employeeWhere.departmentId = { in: allowedDepts }
      } else if (context.role === 'EVALUATOR') {
        const userEmail = request.headers.get('x-user-email') || ''
        const currentEmployee = await prisma.employee.findFirst({
          where: { accountId: context.accountId, email: userEmail, status: 'ACTIVE' },
          select: { id: true }
        })
        if (currentEmployee) {
          // EVALUATOR solo ve subordinados directos
          employeeWhere.managerId = currentEmployee.id
        } else {
          // Sin empleado, no ve nada
          employeeWhere.id = 'no-access'
        }
      }
    }

    // Get employees with their goals count and avg progress
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        fullName: true,
        position: true,
        departmentId: true,
        standardJobLevel: true,
        acotadoGroup: true,
        _count: { select: { directReports: true } },
        goals: {
          where: {
            level: 'INDIVIDUAL',
            status: { notIn: ['CANCELLED'] },
          },
          select: {
            id: true,
            progress: true,
            isLeaderGoal: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    // Transform into team members with stats
    const teamMembers = employees.map((emp) => {
      const hasDirectReports = emp._count.directReports > 0

      // Filtrar metas líder si no es líder
      const visibleGoals = emp.goals.filter(
        (g) => !g.isLeaderGoal || hasDirectReports
      )

      const goalsCount = visibleGoals.length
      const avgProgress =
        goalsCount > 0
          ? visibleGoals.reduce((sum, g) => sum + g.progress, 0) / goalsCount
          : 0

      // Elegibilidad: usar GoalJobConfig si hay configs, fallback a acotadoGroup
      const hasGoalsConfigured =
        eligibleLevels.size > 0
          ? emp.standardJobLevel
            ? eligibleLevels.has(emp.standardJobLevel)
            : false
          : emp.acotadoGroup !== 'base_operativa'

      return {
        id: emp.id,
        fullName: emp.fullName,
        position: emp.position || 'Sin cargo',
        departmentId: emp.departmentId,
        goalsCount,
        avgProgress: Math.round(avgProgress * 10) / 10,
        hasGoalsConfigured,
        hasDirectReports,
      }
    })

    // Calculate stats
    const total = teamMembers.length
    const noGoalsRequired = teamMembers.filter((m) => !m.hasGoalsConfigured).length
    const withGoals = teamMembers.filter((m) => m.hasGoalsConfigured && m.goalsCount > 0).length
    const withoutGoals = teamMembers.filter(
      (m) => m.hasGoalsConfigured && m.goalsCount === 0
    ).length

    return NextResponse.json({
      data: teamMembers,
      stats: { total, withGoals, withoutGoals, noGoalsRequired },
      success: true,
    })
  } catch (error: any) {
    console.error('[API Goals Team]:', error)
    return NextResponse.json(
      { error: error.message || 'Error obteniendo equipo', success: false },
      { status: 500 }
    )
  }
}
