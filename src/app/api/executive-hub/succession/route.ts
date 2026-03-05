// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - SUCCESSION DETAIL API
// src/app/api/executive-hub/succession/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: cobertura gauge + roles sin sucesor + bench por readiness
// Query params: ?cycleId=X&gerencia=Y (opcional)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerencia = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Gerencia drill-down filter
    if (gerencia) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerencia)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    const data = await SuccessionService.getSuccessionSummary(
      cycleId,
      userContext.accountId,
      departmentIds
    )

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('[Executive Hub Succession] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

async function resolveGerenciaDepts(accountId: string, name: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: { accountId, displayName: name, isActive: true },
    select: { id: true }
  })
  if (!dept) return []
  const childIds = await getChildDepartmentIds(dept.id)
  return [dept.id, ...childIds]
}
