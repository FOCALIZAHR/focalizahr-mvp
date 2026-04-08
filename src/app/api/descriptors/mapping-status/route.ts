// GET /api/descriptors/mapping-status — Estado de mapeo SOC por cargo
// Retorna cargos agrupados por confidence (HIGH, MEDIUM, LOW/UNCLASSIFIED)
// Solo HR_ADMIN y HR_MANAGER

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { SOC_TITLES_ES } from '@/config/OnetOccupationConfig'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const accountId = userContext.accountId

    // 1. Unique positions from employees
    const employees = await prisma.employee.findMany({
      where: { accountId, isActive: true, status: 'ACTIVE', position: { not: null } },
      select: { position: true },
    })

    const uniquePositions = [...new Set(employees.map(e => e.position!).filter(Boolean))]

    // 2. Existing mappings
    const mappings = await prisma.occupationMapping.findMany({
      where: { accountId },
      select: {
        positionText: true,
        socCode: true,
        confidence: true,
        source: true,
        correctedBy: true,
      },
    })

    const mappingMap = new Map(mappings.map(m => [m.positionText.toLowerCase().trim(), m]))

    // 3. Employee counts per position
    const countMap = new Map<string, number>()
    for (const e of employees) {
      if (!e.position) continue
      const key = e.position.toLowerCase().trim()
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }

    // 4. Build response grouped by status
    interface PositionMapping {
      positionText: string
      employeeCount: number
      socCode: string | null
      occupationTitle: string | null
      confidence: string
      source: string | null
    }

    const high: PositionMapping[] = []
    const medium: PositionMapping[] = []
    const unmapped: PositionMapping[] = []

    for (const pos of uniquePositions) {
      const key = pos.toLowerCase().trim()
      const mapping = mappingMap.get(key)
      const empCount = countMap.get(key) ?? 0

      const item: PositionMapping = {
        positionText: pos,
        employeeCount: empCount,
        socCode: mapping?.socCode ?? null,
        occupationTitle: mapping?.socCode ? (SOC_TITLES_ES[mapping.socCode] ?? null) : null,
        confidence: mapping?.confidence ?? 'UNCLASSIFIED',
        source: mapping?.source ?? null,
      }

      if (mapping?.confidence === 'HIGH') {
        high.push(item)
      } else if (mapping?.confidence === 'MEDIUM') {
        medium.push(item)
      } else {
        unmapped.push(item)
      }
    }

    // Sort by employee count desc
    high.sort((a, b) => b.employeeCount - a.employeeCount)
    medium.sort((a, b) => b.employeeCount - a.employeeCount)
    unmapped.sort((a, b) => b.employeeCount - a.employeeCount)

    return NextResponse.json({
      success: true,
      data: {
        total: uniquePositions.length,
        mapped: high.length + medium.length,
        high,
        medium,
        unmapped,
        summary: {
          highCount: high.length,
          mediumCount: medium.length,
          unmappedCount: unmapped.length,
          mappingRate: uniquePositions.length > 0
            ? Math.round(((high.length + medium.length) / uniquePositions.length) * 100)
            : 0,
        },
      },
    })
  } catch (error: any) {
    console.error('[descriptors/mapping-status] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
