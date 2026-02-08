// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/job-titles
// GET - Lista de cargos (position/jobTitle) únicos en un ciclo
// Para selector de Familia de Cargos en Wizard Step 2
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

    // Obtener positions únicos de empleados con ratings en este ciclo
    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        performanceRatings: {
          some: { cycleId }
        },
        OR: [
          { position: { not: null } },
          { jobTitle: { not: null } }
        ]
      },
      select: {
        position: true,
        jobTitle: true
      }
    })

    // Collect unique job titles from position and jobTitle fields
    const titleSet = new Set<string>()
    for (const emp of employees) {
      if (emp.position) titleSet.add(emp.position)
      if (emp.jobTitle && emp.jobTitle !== emp.position) titleSet.add(emp.jobTitle)
    }

    const jobTitles = Array.from(titleSet).sort()

    return NextResponse.json({
      success: true,
      jobTitles
    })

  } catch (error) {
    console.error('[API /calibration/job-titles] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo job titles' },
      { status: 500 }
    )
  }
}
