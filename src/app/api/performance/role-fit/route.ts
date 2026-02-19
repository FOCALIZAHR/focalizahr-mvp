import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'
import { prisma } from '@/lib/prisma'

// GET /api/performance/role-fit?employeeId=xxx&cycleId=yyy
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)

  if (!userContext.accountId || !hasPermission(userContext.role, 'evaluations:view')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const cycleId = searchParams.get('cycleId')

  if (!employeeId || !cycleId) {
    return NextResponse.json(
      { success: false, error: 'employeeId y cycleId son requeridos' },
      { status: 400 }
    )
  }

  try {
    // Verify employee belongs to same account
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, accountId: userContext.accountId },
      select: { id: true, performanceTrack: true }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    const roleFit = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)

    if (!roleFit) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo calcular Role Fit (sin targets o sin evaluación)'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...roleFit,
        performanceTrack: employee.performanceTrack || 'COLABORADOR'
      }
    })
  } catch (err) {
    console.error('[RoleFit API] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Error calculando Role Fit' },
      { status: 500 }
    )
  }
}
