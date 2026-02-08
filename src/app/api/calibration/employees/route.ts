// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/employees
// GET - Búsqueda de empleados evaluados en un ciclo (para selector manual)
// Para EmployeePickerSelector en Wizard Step 2
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
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId')
    const acotadoGroup = searchParams.get('acotadoGroup')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId requerido' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      accountId: userContext.accountId,
      isActive: true,
      performanceRatings: {
        some: {
          cycleId,
          calculatedScore: { gt: 0 }
        }
      }
    }

    // Search por nombre
    if (search.length >= 2) {
      whereClause.fullName = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Filtros opcionales
    if (departmentId) {
      whereClause.departmentId = departmentId
    }

    if (acotadoGroup) {
      whereClause.acotadoGroup = acotadoGroup
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        position: true,
        standardJobLevel: true,
        acotadoGroup: true,
        department: {
          select: { displayName: true }
        }
      },
      take: 50,
      orderBy: { fullName: 'asc' }
    })

    const formatted = employees.map(emp => ({
      id: emp.id,
      fullName: emp.fullName,
      position: emp.position || 'Sin cargo',
      standardJobLevel: emp.standardJobLevel || null,
      acotadoGroup: emp.acotadoGroup || null,
      departmentName: emp.department?.displayName || 'Sin departamento'
    }))

    return NextResponse.json({
      success: true,
      employees: formatted
    })

  } catch (error) {
    console.error('[API /calibration/employees] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error buscando empleados' },
      { status: 500 }
    )
  }
}
