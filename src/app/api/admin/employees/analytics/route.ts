/**
 * GET /api/admin/employees/analytics
 *
 * Analytics profundo de dotación para modal:
 * - Breakdown por 7 niveles jerárquicos
 * - Estructura de liderazgo (ratio, health)
 * - Tendencias (últimos 3 imports)
 * - Insights automáticos
 *
 * Roles: employees:read
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JOB_LEVEL_LABELS } from '@/lib/services/PositionAdapter'

const JOB_LEVEL_ORDER = [
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
]

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // SEGURIDAD
    // ═══════════════════════════════════════════════════════════════
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      )
    }

    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para analytics' },
        { status: 403 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. OBTENER EMPLEADOS ACTIVOS CON MANAGER DATA
    // ═══════════════════════════════════════════════════════════════
    const activeEmployees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'ON_LEAVE'] }
      },
      include: {
        directReports: {
          where: {
            status: { in: ['ACTIVE', 'ON_LEAVE'] }
          }
        }
      }
    })

    const totalActive = activeEmployees.length
    const now = new Date()

    // ═══════════════════════════════════════════════════════════════
    // 2. BREAKDOWN POR 7 NIVELES JERÁRQUICOS
    // ═══════════════════════════════════════════════════════════════
    const levelStats: Record<string, {
      count: number
      withTeam: number
      tenures: number[]
      directReportCounts: number[]
    }> = {}

    for (const level of JOB_LEVEL_ORDER) {
      levelStats[level] = {
        count: 0,
        withTeam: 0,
        tenures: [],
        directReportCounts: []
      }
    }

    for (const emp of activeEmployees) {
      const level = emp.standardJobLevel || 'profesional_analista'

      if (levelStats[level]) {
        levelStats[level].count++

        if (emp.directReports.length > 0) {
          levelStats[level].withTeam++
          levelStats[level].directReportCounts.push(emp.directReports.length)
        }

        if (emp.hireDate) {
          const years = (now.getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
          levelStats[level].tenures.push(years)
        }
      }
    }

    const byLevel = JOB_LEVEL_ORDER.map(level => {
      const stats = levelStats[level]
      const avgTenure = stats.tenures.length > 0
        ? Math.round((stats.tenures.reduce((sum, t) => sum + t, 0) / stats.tenures.length) * 10) / 10
        : 0

      const avgDirectReports = stats.directReportCounts.length > 0
        ? Math.round((stats.directReportCounts.reduce((sum, c) => sum + c, 0) / stats.directReportCounts.length) * 10) / 10
        : 0

      return {
        level,
        label: JOB_LEVEL_LABELS[level] || level,
        count: stats.count,
        percentage: Math.round((stats.count / totalActive) * 100) || 0,
        withTeam: stats.withTeam,
        withoutTeam: stats.count - stats.withTeam,
        avgTenure,
        avgDirectReports
      }
    })

    // ═══════════════════════════════════════════════════════════════
    // 3. ESTRUCTURA DE LIDERAZGO
    // ═══════════════════════════════════════════════════════════════
    const managers = activeEmployees.filter(e => e.directReports.length > 0)
    const contributors = activeEmployees.filter(e => e.directReports.length === 0)

    const totalManagers = managers.length
    const totalContributors = contributors.length

    const allDirectReports = managers.map(m => m.directReports.length)
    const avgDirectReports = allDirectReports.length > 0
      ? Math.round((allDirectReports.reduce((sum, c) => sum + c, 0) / allDirectReports.length) * 10) / 10
      : 0

    const managerWithMostReports = managers.reduce((max, m) =>
      m.directReports.length > (max?.directReports.length || 0) ? m : max,
      managers[0]
    )

    const maxDirectReports = managerWithMostReports
      ? {
          name: managerWithMostReports.fullName,
          count: managerWithMostReports.directReports.length
        }
      : { name: 'N/A', count: 0 }

    const ratio = totalManagers > 0
      ? `1:${Math.round((totalContributors / totalManagers) * 10) / 10}`
      : '1:0'

    // Health status basado en ratio
    const ratioValue = totalContributors / (totalManagers || 1)
    let healthStatus: 'OK' | 'WARNING' | 'CRITICAL'
    if (ratioValue >= 5 && ratioValue <= 8) {
      healthStatus = 'OK'
    } else if (ratioValue < 3 || ratioValue > 10) {
      healthStatus = 'CRITICAL'
    } else {
      healthStatus = 'WARNING'
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. TENDENCIAS (últimos 3 imports)
    // ═══════════════════════════════════════════════════════════════
    const imports = await prisma.employeeImport.findMany({
      where: {
        accountId: userContext.accountId,
        status: 'COMPLETED'
      },
      orderBy: { startedAt: 'desc' },
      take: 3,
      select: {
        totalInFile: true,
        startedAt: true,
        created: true,
        updated: true,
        rehired: true
      }
    })

    const months = imports.reverse().map((imp, idx) => {
      const previousCount = idx > 0 ? imports[idx - 1].totalInFile : imp.totalInFile
      return {
        period: new Date(imp.startedAt).toISOString().slice(0, 7),
        count: imp.totalInFile,
        delta: imp.totalInFile - previousCount
      }
    })

    // Último mes (si existe)
    const lastImport = imports[imports.length - 1]
    const lastMonth = lastImport ? {
      hires: lastImport.created,
      terminations: 0,
      transfers: 0,
      promotions: 0
    } : {
      hires: 0,
      terminations: 0,
      transfers: 0,
      promotions: 0
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. GENERAR INSIGHTS AUTOMÁTICOS
    // ═══════════════════════════════════════════════════════════════
    const insights: Array<{ type: 'success' | 'warning' | 'info'; text: string }> = []

    // Insight: Ratio liderazgo
    if (healthStatus === 'CRITICAL') {
      insights.push({
        type: 'warning',
        text: `Alto ratio manager:colaborador (${ratio}) sugiere estructura muy plana`
      })
    } else if (healthStatus === 'OK') {
      insights.push({
        type: 'success',
        text: `Ratio liderazgo saludable (${ratio}) dentro de benchmark industria`
      })
    }

    // Insight: Antigüedad
    const avgGlobalTenure = totalActive > 0
      ? byLevel.reduce((sum, l) => sum + (l.avgTenure * l.count), 0) / totalActive
      : 0

    if (avgGlobalTenure >= 2 && avgGlobalTenure <= 5) {
      insights.push({
        type: 'success',
        text: `Antigüedad saludable (promedio ${Math.round(avgGlobalTenure * 10) / 10} años)`
      })
    }

    // Insight: Crecimiento
    if (months.length >= 2) {
      const totalGrowth = months[months.length - 1].count - months[0].count
      const growthPercent = months[0].count > 0
        ? Math.round((totalGrowth / months[0].count) * 100)
        : 0
      if (totalGrowth > 0) {
        insights.push({
          type: 'success',
          text: `Crecimiento sostenido últimos ${months.length} meses (+${growthPercent}% total)`
        })
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. RESPONSE
    // ═══════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      analytics: {
        byLevel,
        leadership: {
          totalManagers,
          totalContributors,
          avgDirectReports,
          maxDirectReports,
          leadershipRatio: ratio,
          industryBenchmark: '1:5-8',
          healthStatus
        },
        trends: {
          months,
          lastMonth
        },
        insights
      }
    })

  } catch (error) {
    console.error('[API] Error en /api/admin/employees/analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
