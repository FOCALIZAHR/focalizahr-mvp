// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/managers
// GET - Lista de managers con reportes directos evaluados en un ciclo
// Para selector "Por Reportes de Manager" en Wizard Step 2
// ════════════════════════════════════════════════════════════════════════════

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

    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId requerido' },
        { status: 400 }
      )
    }

    // Managers con al menos 1 reporte directo activo evaluado en el ciclo
    const managers = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        directReports: {
          some: {
            isActive: true,
            performanceRatings: {
              some: {
                cycleId,
                calculatedScore: { gt: 0 }
              }
            }
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        standardJobLevel: true,
        acotadoGroup: true,
        department: {
          select: { displayName: true }
        },
        _count: {
          select: {
            directReports: {
              where: {
                isActive: true,
                performanceRatings: {
                  some: {
                    cycleId,
                    calculatedScore: { gt: 0 }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    const managersFormatted = managers.map(m => ({
      id: m.id,
      fullName: m.fullName,
      position: m.position || 'Sin cargo',
      standardJobLevel: m.standardJobLevel || null,
      acotadoGroup: m.acotadoGroup || null,
      departmentName: m.department?.displayName || 'Sin departamento',
      directReportsCount: m._count.directReports
    }))

    return NextResponse.json({
      success: true,
      managers: managersFormatted
    })

  } catch (error) {
    console.error('[API /calibration/managers] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo managers' },
      { status: 500 }
    )
  }
}
