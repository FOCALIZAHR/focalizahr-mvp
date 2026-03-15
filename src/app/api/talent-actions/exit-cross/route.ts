/**
 * GET /api/talent-actions/exit-cross
 *
 * Matriz exitFactors x riskQuadrant (agregada, SIN nombres individuales)
 * Solo si totalExitsConDatos >= MIN_EXIT_RECORDS (5)
 * Join: ExitRecord.nationalId → Employee.nationalId → PerformanceRating
 *
 * Permiso: talent-actions:exit-cross (sin AREA_MANAGER ni HR_OPERATOR)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'

const MIN_EXIT_RECORDS = 5

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // CAPA 1: Autenticacion
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // CAPA 2: Permisos (sin AREA_MANAGER — volumen insuficiente por area)
    if (!hasPermission(userContext.role, 'talent-actions:exit-cross')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para cruce Exit x Talento' },
        { status: 403 }
      )
    }

    const accountId = userContext.accountId

    // Obtener ciclo activo para PerformanceRating
    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) {
      return NextResponse.json({
        success: true,
        data: { insufficient: true, reason: 'Sin ciclo de evaluacion activo', matrix: null },
        responseTime: Date.now() - startTime
      })
    }

    // Obtener exit records con datos de factores (ultimos 12 meses)
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const exitRecords = await prisma.exitRecord.findMany({
      where: {
        accountId,
        exitDate: { gte: twelveMonthsAgo },
        exitFactors: { isEmpty: false }
      },
      select: {
        nationalId: true,
        exitFactors: true,
        exitFactorsDetail: true
      }
    })

    // InsufficientDataGuard
    if (exitRecords.length < MIN_EXIT_RECORDS) {
      return NextResponse.json({
        success: true,
        data: {
          insufficient: true,
          reason: `Se necesitan al menos ${MIN_EXIT_RECORDS} salidas con factores registrados. Actualmente hay ${exitRecords.length}.`,
          matrix: null,
          totalExits: exitRecords.length,
          minRequired: MIN_EXIT_RECORDS
        },
        responseTime: Date.now() - startTime
      })
    }

    // Obtener nationalIds de los exit records
    const exitNationalIds = exitRecords
      .map(r => r.nationalId)
      .filter((id): id is string => id !== null)

    // Join: nationalId → Employee → PerformanceRating (ultimo ciclo)
    const employees = await prisma.employee.findMany({
      where: {
        accountId,
        nationalId: { in: exitNationalIds }
      },
      select: {
        nationalId: true,
        id: true
      }
    })

    const employeeIdByNationalId = new Map(
      employees.map(e => [e.nationalId, e.id])
    )

    // Buscar ratings del ciclo activo para estos empleados
    const employeeIds = employees.map(e => e.id)

    const ratings = await prisma.performanceRating.findMany({
      where: {
        accountId,
        cycleId,
        employeeId: { in: employeeIds }
      },
      select: {
        employeeId: true,
        riskQuadrant: true
      }
    })

    const quadrantByEmployeeId = new Map(
      ratings.map(r => [r.employeeId, r.riskQuadrant])
    )

    // Construir matriz: factor x quadrant (conteo agregado, SIN nombres)
    const matrix: Record<string, Record<string, number>> = {}
    let matchedCount = 0

    for (const record of exitRecords) {
      if (!record.nationalId) continue

      const employeeId = employeeIdByNationalId.get(record.nationalId)
      if (!employeeId) continue

      const quadrant = quadrantByEmployeeId.get(employeeId)
      if (!quadrant) continue

      matchedCount++

      for (const factor of record.exitFactors) {
        if (!matrix[factor]) {
          matrix[factor] = {}
        }
        matrix[factor][quadrant] = (matrix[factor][quadrant] || 0) + 1
      }
    }

    // Convertir a array ordenado por total menciones
    const matrixArray = Object.entries(matrix)
      .map(([factor, quadrants]) => ({
        factor,
        quadrants,
        totalMentions: Object.values(quadrants).reduce((s, v) => s + v, 0)
      }))
      .sort((a, b) => b.totalMentions - a.totalMentions)

    return NextResponse.json({
      success: true,
      data: {
        insufficient: false,
        matrix: matrixArray,
        totalExits: exitRecords.length,
        matchedWithRating: matchedCount,
        quadrantsUsed: ['FUGA_CEREBROS', 'MOTOR_EQUIPO', 'BURNOUT_RISK', 'BAJO_RENDIMIENTO']
      },
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[TAC exit-cross] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
