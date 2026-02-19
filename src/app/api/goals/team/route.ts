// src/app/api/goals/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get employees with their goals count and avg progress
    const employees = await prisma.employee.findMany({
      where: {
        accountId: context.accountId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        departmentId: true,
        acotadoGroup: true,
        goals: {
          where: {
            level: 'INDIVIDUAL',
            status: { notIn: ['CANCELLED'] },
          },
          select: {
            id: true,
            progress: true,
          }
        }
      },
      orderBy: { fullName: 'asc' },
    })

    // Transform into team members with stats
    const teamMembers = employees.map(emp => {
      const goalsCount = emp.goals.length
      const avgProgress = goalsCount > 0
        ? emp.goals.reduce((sum, g) => sum + g.progress, 0) / goalsCount
        : 0

      // Cargos operativos/auxiliares typically don't have business goals
      const hasGoalsConfigured = emp.acotadoGroup !== 'base_operativa'

      return {
        id: emp.id,
        fullName: emp.fullName,
        position: emp.position || 'Sin cargo',
        departmentId: emp.departmentId,
        goalsCount,
        avgProgress: Math.round(avgProgress * 10) / 10,
        hasGoalsConfigured,
      }
    })

    // Calculate stats
    const total = teamMembers.length
    const noGoalsRequired = teamMembers.filter(m => !m.hasGoalsConfigured).length
    const withGoals = teamMembers.filter(m => m.hasGoalsConfigured && m.goalsCount > 0).length
    const withoutGoals = teamMembers.filter(m => m.hasGoalsConfigured && m.goalsCount === 0).length

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
