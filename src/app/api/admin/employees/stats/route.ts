/**
 * GET /api/admin/employees/stats
 *
 * Stats básicas de dotación para panel principal:
 * - totalActive + delta vs import anterior
 * - Breakdown por performanceTrack (ejecutivo/manager/colaborador)
 * - Mini insights (antigüedad, nivel dominante)
 *
 * Roles: employees:read
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JOB_LEVEL_LABELS } from '@/lib/services/PositionAdapter'

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // SEGURIDAD: Verificar autenticación y permisos
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
        { success: false, error: 'Sin permisos para ver estadísticas' },
        { status: 403 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. OBTENER EMPLEADOS ACTIVOS
    // ═══════════════════════════════════════════════════════════════
    const activeEmployees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'ON_LEAVE'] }
      },
      select: {
        id: true,
        performanceTrack: true,
        standardJobLevel: true,
        hireDate: true,
        _count: {
          select: {
            directReports: true
          }
        }
      }
    })

    const totalActive = activeEmployees.length

    // ═══════════════════════════════════════════════════════════════
    // 2. CALCULAR DELTA (vs import anterior)
    // ═══════════════════════════════════════════════════════════════
    const imports = await prisma.employeeImport.findMany({
      where: {
        accountId: userContext.accountId,
        status: 'COMPLETED'
      },
      orderBy: { startedAt: 'desc' },
      take: 2,
      select: {
        totalInFile: true,
        startedAt: true
      }
    })

    let delta: number | null = null
    if (imports.length >= 2) {
      delta = imports[0].totalInFile - imports[1].totalInFile
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. BREAKDOWN POR PERFORMANCE TRACK
    // ═══════════════════════════════════════════════════════════════
    const trackStats = {
      ejecutivo: { count: 0 },
      manager: { count: 0 },
      colaborador: { count: 0 }
    }

    for (const emp of activeEmployees) {
      const track = (emp.performanceTrack || 'COLABORADOR').toLowerCase() as 'ejecutivo' | 'manager' | 'colaborador'

      if (trackStats[track]) {
        trackStats[track].count++
      }
    }

    const byTrack = {
      ejecutivo: {
        count: trackStats.ejecutivo.count,
        percentage: Math.round((trackStats.ejecutivo.count / totalActive) * 100) || 0
      },
      manager: {
        count: trackStats.manager.count,
        percentage: Math.round((trackStats.manager.count / totalActive) * 100) || 0
      },
      colaborador: {
        count: trackStats.colaborador.count,
        percentage: Math.round((trackStats.colaborador.count / totalActive) * 100) || 0
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CALCULAR INSIGHTS
    // ═══════════════════════════════════════════════════════════════

    // Antigüedad promedio
    const now = new Date()
    const tenures = activeEmployees
      .filter(e => e.hireDate)
      .map(e => {
        const years = (now.getTime() - new Date(e.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
        return years
      })

    const avgTenure = tenures.length > 0
      ? Math.round((tenures.reduce((sum, t) => sum + t, 0) / tenures.length) * 10) / 10
      : 0

    // Nivel jerárquico dominante
    const levelCounts: Record<string, number> = {}
    for (const emp of activeEmployees) {
      if (emp.standardJobLevel) {
        levelCounts[emp.standardJobLevel] = (levelCounts[emp.standardJobLevel] || 0) + 1
      }
    }

    const dominantLevelCode = Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'profesional_analista'

    const dominantLevel = JOB_LEVEL_LABELS[dominantLevelCode] || 'Sin Clasificar'

    // ═══════════════════════════════════════════════════════════════
    // 5. RESPONSE
    // ═══════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      stats: {
        totalActive,
        delta,
        byTrack,
        insights: {
          avgTenure,
          dominantLevel
        }
      }
    })

  } catch (error) {
    console.error('[API] Error en /api/admin/employees/stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
