// GET /api/descriptors/org-tree — Jerarquía departamental + cargos con status
// Para visualización ReactFlow del Org Explorer

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // RBAC: scope jerárquico para AREA_MANAGER
    let departmentIds: string[] | undefined
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

    if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // 1. Departments
    const deptWhere: any = { accountId: userContext.accountId, isActive: true }
    if (departmentIds) deptWhere.id = { in: departmentIds }

    const departments = await prisma.department.findMany({
      where: deptWhere,
      select: {
        id: true,
        displayName: true,
        parentId: true,
        standardCategory: true,
        level: true,
      },
      orderBy: [{ level: 'asc' }, { displayName: 'asc' }],
    })

    // 2. Employees grouped by position + departmentId
    const empWhere: any = {
      accountId: userContext.accountId,
      isActive: true,
      status: 'ACTIVE',
      position: { not: null },
    }
    if (departmentIds) empWhere.departmentId = { in: departmentIds }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: {
        id: true,
        fullName: true,
        position: true,
        departmentId: true,
        department: { select: { displayName: true } },
      },
    })

    // Group by position + departmentId
    const positionMap = new Map<string, {
      jobTitle: string
      departmentId: string
      departmentName: string
      employees: Array<{ id: string; fullName: string }>
    }>()

    for (const emp of employees) {
      if (!emp.position || !emp.departmentId) continue
      const key = `${emp.position}__${emp.departmentId}`
      if (!positionMap.has(key)) {
        positionMap.set(key, {
          jobTitle: emp.position,
          departmentId: emp.departmentId,
          departmentName: emp.department?.displayName ?? '',
          employees: [],
        })
      }
      positionMap.get(key)!.employees.push({ id: emp.id, fullName: emp.fullName })
    }

    // 3. Join with JobDescriptor for status
    const jobTitles = [...new Set([...positionMap.values()].map(p => p.jobTitle))]
    const descriptors = await prisma.jobDescriptor.findMany({
      where: {
        accountId: userContext.accountId,
        jobTitle: { in: jobTitles },
      },
      select: {
        id: true,
        jobTitle: true,
        status: true,
        socCode: true,
      },
    })

    const descriptorMap = new Map<string, { id: string; status: string; socCode: string | null }>()
    for (const d of descriptors) {
      descriptorMap.set(d.jobTitle, { id: d.id, status: d.status, socCode: d.socCode })
    }

    // Build positions array
    const positions = [...positionMap.values()].map(p => {
      const desc = descriptorMap.get(p.jobTitle)
      return {
        jobTitle: p.jobTitle,
        departmentId: p.departmentId,
        departmentName: p.departmentName,
        employeeCount: p.employees.length,
        descriptorStatus: (desc?.status as 'CONFIRMED' | 'DRAFT') ?? 'NONE',
        descriptorId: desc?.id ?? null,
        socCode: desc?.socCode ?? null,
        employees: p.employees,
      }
    })

    // 4. Company name for root node
    const account = await prisma.account.findUnique({
      where: { id: userContext.accountId },
      select: { companyName: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        companyName: account?.companyName ?? 'Empresa',
        departments,
        positions,
      },
    })
  } catch (error: any) {
    console.error('[descriptors/org-tree] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
