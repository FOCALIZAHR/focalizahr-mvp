/**
 * GET /api/job-classification/review
 *
 * Lista empleados sin clasificar (standardJobLevel = NULL),
 * agrupados por position, con sugerencias del PositionAdapter.
 * Incluye deteccion de anomalias (COLABORADOR con reportes directos).
 *
 * RBAC:
 * - FOCALIZAHR_ADMIN puede especificar ?accountId=xxx
 * - Clientes solo ven su propia cuenta
 *
 * Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PositionAdapter } from '@/lib/services/PositionAdapter'

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER'
]

interface UnclassifiedGroup {
  position: string
  employeeCount: number
  employeeIds: string[]
  suggestedLevel: string | null
  suggestedAcotado: string | null
  suggestedTrack: string
}

interface AnomalyEntry {
  employeeId: string
  fullName: string
  position: string | null
  currentTrack: string
  directReportsCount: number
  anomalyType: string
}

export async function GET(request: NextRequest) {
  try {
    // Auth
    const accountId = request.headers.get('x-account-id')
    const userRole = request.headers.get('x-user-role') || ''

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para clasificar cargos' },
        { status: 403 }
      )
    }

    // RBAC: admin puede especificar otra cuenta
    const isFocalizahrAdmin = userRole === 'FOCALIZAHR_ADMIN'
    const queryAccountId = isFocalizahrAdmin
      ? (request.nextUrl.searchParams.get('accountId') || accountId)
      : accountId

    // Total empleados activos
    const totalEmployees = await prisma.employee.count({
      where: { accountId: queryAccountId, status: 'ACTIVE' }
    })

    // Empleados sin clasificar, agrupados por position
    const unclassifiedRaw = await prisma.employee.groupBy({
      by: ['position'],
      where: {
        accountId: queryAccountId,
        status: 'ACTIVE',
        standardJobLevel: null,
        position: { not: null }
      },
      _count: { id: true }
    })

    // Obtener IDs de empleados por cada position sin clasificar
    const unclassifiedPositions = unclassifiedRaw.map(r => r.position).filter(Boolean) as string[]

    let employeesByPosition: Record<string, string[]> = {}
    if (unclassifiedPositions.length > 0) {
      const employees = await prisma.employee.findMany({
        where: {
          accountId: queryAccountId,
          status: 'ACTIVE',
          standardJobLevel: null,
          position: { in: unclassifiedPositions }
        },
        select: { id: true, position: true }
      })

      for (const emp of employees) {
        const pos = emp.position || ''
        if (!employeesByPosition[pos]) employeesByPosition[pos] = []
        employeesByPosition[pos].push(emp.id)
      }
    }

    // Enriquecer con sugerencias de PositionAdapter
    const unclassified: UnclassifiedGroup[] = unclassifiedRaw.map(item => {
      const position = item.position || ''
      const classification = PositionAdapter.classifyPosition(position)
      return {
        position,
        employeeCount: item._count.id,
        employeeIds: employeesByPosition[position] || [],
        suggestedLevel: classification.standardJobLevel,
        suggestedAcotado: classification.acotadoGroup,
        suggestedTrack: classification.performanceTrack
      }
    })

    // Deteccion de anomalias: COLABORADOR con reportes directos
    const collaboratorsWithReports = await prisma.employee.findMany({
      where: {
        accountId: queryAccountId,
        status: 'ACTIVE',
        performanceTrack: 'COLABORADOR',
        directReports: { some: { status: 'ACTIVE' } }
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        performanceTrack: true,
        _count: { select: { directReports: true } }
      }
    })

    const withAnomalies: AnomalyEntry[] = collaboratorsWithReports.map(emp => ({
      employeeId: emp.id,
      fullName: emp.fullName,
      position: emp.position,
      currentTrack: emp.performanceTrack || 'COLABORADOR',
      directReportsCount: emp._count.directReports,
      anomalyType: 'colaborador_with_reports'
    }))

    // Clasificados
    const classified = await prisma.employee.count({
      where: {
        accountId: queryAccountId,
        status: 'ACTIVE',
        standardJobLevel: { not: null }
      }
    })

    // Distribucion por track
    const trackDistribution = await prisma.employee.groupBy({
      by: ['performanceTrack'],
      where: {
        accountId: queryAccountId,
        status: 'ACTIVE',
        performanceTrack: { not: null }
      },
      _count: { id: true }
    })

    const byTrack = {
      ejecutivo: trackDistribution.find(t => t.performanceTrack === 'EJECUTIVO')?._count.id ?? 0,
      manager: trackDistribution.find(t => t.performanceTrack === 'MANAGER')?._count.id ?? 0,
      colaborador: trackDistribution.find(t => t.performanceTrack === 'COLABORADOR')?._count.id ?? 0
    }

    const unclassifiedCount = totalEmployees - classified
    const classificationRate = totalEmployees > 0
      ? Math.round((classified / totalEmployees) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        unclassified,
        withAnomalies
      },
      byTrack,
      summary: {
        totalEmployees,
        classified,
        unclassified: unclassifiedCount,
        withAnomalies: withAnomalies.length,
        classificationRate
      }
    })
  } catch (error: unknown) {
    console.error('[Job Classification Review] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
