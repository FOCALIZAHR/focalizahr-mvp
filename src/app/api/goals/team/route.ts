// src/app/api/goals/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
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

    // Obtener maxGoals de la cuenta
    const account = await prisma.account.findUnique({
      where: { id: context.accountId },
      select: { maxIndividualGoals: true }
    })
    const maxGoals = account?.maxIndividualGoals ?? 10

    // Obtener niveles de cargo con metas habilitadas
    const eligibleConfigs = await prisma.goalJobConfig.findMany({
      where: { accountId: context.accountId, hasGoals: true },
      select: { standardJobLevel: true },
    })
    const eligibleLevels = new Set(eligibleConfigs.map((c) => c.standardJobLevel))

    // ═══ CHECK 4: /team SIEMPRE filtra por managerId - sin excepción ═══
    const userEmail = request.headers.get('x-user-email') || ''
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        accountId: context.accountId,
        email: userEmail,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    if (!currentEmployee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado', success: false },
        { status: 404 }
      )
    }

    const employeeWhere: any = {
      accountId: context.accountId,
      status: 'ACTIVE',
      managerId: currentEmployee.id,
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
            status: true,
            weight: true,
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

      // assignmentStatus: metas activas (no completadas ni canceladas)
      const activeGoals = visibleGoals.filter(
        (g) => ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'].includes(g.status)
      )
      const totalWeight = activeGoals.reduce((sum, g) => sum + (g.weight || 0), 0)
      const goalCount = activeGoals.length

      let assignmentStatusValue: 'EMPTY' | 'INCOMPLETE' | 'READY' | 'EXCEEDED'
      if (goalCount === 0) {
        assignmentStatusValue = 'EMPTY'
      } else if (totalWeight > 100) {
        assignmentStatusValue = 'EXCEEDED'
      } else if (totalWeight === 100) {
        assignmentStatusValue = 'READY'
      } else {
        assignmentStatusValue = 'INCOMPLETE'
      }

      return {
        id: emp.id,
        fullName: emp.fullName,
        position: emp.position || 'Sin cargo',
        departmentId: emp.departmentId,
        goalsCount,
        avgProgress: Math.round(avgProgress * 10) / 10,
        hasGoalsConfigured,
        hasDirectReports,
        assignmentStatus: {
          totalWeight,
          goalCount,
          maxGoals,
          status: assignmentStatusValue,
          isComplete: totalWeight === 100,
        },
      }
    })

    // Calculate stats
    const total = teamMembers.length
    const noGoalsRequired = teamMembers.filter((m) => !m.hasGoalsConfigured).length
    const withGoals = teamMembers.filter((m) => m.hasGoalsConfigured && m.goalsCount > 0).length
    const withoutGoals = teamMembers.filter(
      (m) => m.hasGoalsConfigured && m.goalsCount === 0
    ).length

    // Calcular teamStats agregados
    const totalEmployees = teamMembers.length
    const completedCount = teamMembers.filter(e => e.assignmentStatus.status === 'READY').length
    const incompleteCount = teamMembers.filter(e => e.assignmentStatus.status === 'INCOMPLETE').length
    const emptyCount = teamMembers.filter(e => e.assignmentStatus.status === 'EMPTY').length
    const exceededCount = teamMembers.filter(e => e.assignmentStatus.status === 'EXCEEDED').length

    const totalWeightSum = teamMembers.reduce((sum, e) => sum + e.assignmentStatus.totalWeight, 0)
    const averageWeight = totalEmployees > 0 ? Math.round(totalWeightSum / totalEmployees) : 0
    const completionRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0

    const teamStats = {
      totalEmployees,
      averageWeight,
      completedCount,
      incompleteCount,
      emptyCount,
      exceededCount,
      completionRate,
    }

    return NextResponse.json({
      data: teamMembers,
      stats: { total, withGoals, withoutGoals, noGoalsRequired },
      teamStats,
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
