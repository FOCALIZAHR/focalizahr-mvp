// ════════════════════════════════════════════════════════════════════════════
// GET /api/descriptors/simulator-list
// src/app/api/descriptors/simulator-list/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Lista mínima de descriptors del account para alimentar el dropdown del
// instrumento DescriptorSimulator del Workforce Deck.
//
// Devuelve solo lo necesario para la selección: id, jobTitle, employeeCount,
// status, standardJobLevel.
//
// RBAC: descriptors:view
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'

export interface SimulatorDescriptorListItem {
  id: string
  jobTitle: string
  employeeCount: number
  status: 'DRAFT' | 'CONFIRMED'
  standardJobLevel: string | null
  standardCategory: string | null
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 },
      )
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 },
      )
    }

    // Scope jerárquico para AREA_MANAGER
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    let departmentFilter: { in: string[] } | undefined
    if (
      !hasGlobalAccess &&
      userContext.role === 'AREA_MANAGER' &&
      userContext.departmentId
    ) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentFilter = { in: [userContext.departmentId, ...childIds] }
    }

    const descriptors = await prisma.jobDescriptor.findMany({
      where: {
        accountId: userContext.accountId,
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      },
      select: {
        id: true,
        jobTitle: true,
        employeeCount: true,
        status: true,
        standardJobLevel: true,
        standardCategory: true,
      },
      orderBy: [{ status: 'desc' }, { employeeCount: 'desc' }, { jobTitle: 'asc' }],
    })

    const data: SimulatorDescriptorListItem[] = descriptors.map(d => ({
      id: d.id,
      jobTitle: d.jobTitle,
      employeeCount: d.employeeCount,
      status: d.status as 'DRAFT' | 'CONFIRMED',
      standardJobLevel: d.standardJobLevel,
      standardCategory: d.standardCategory,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[descriptors/simulator-list] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
