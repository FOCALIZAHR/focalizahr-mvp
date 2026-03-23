// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - P&L TALENT API
// src/app/api/executive-hub/pl-talent/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET: Brecha Productiva + Semáforo Legal
// POST: Crear IntelligenceInsight para revisión legal
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PLTalentService } from '@/lib/services/PLTalentService'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

// ════════════════════════════════════════════════════════════════════════════
// GET — Brecha Productiva + Semáforo Legal
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'pl-talent:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerencia = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    // RBAC: department filtering
    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    if (gerencia) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerencia)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    const [brecha, semaforo] = await Promise.all([
      PLTalentService.getBrechaProductiva(cycleId, userContext.accountId, departmentIds),
      PLTalentService.getSemaforoLegal(cycleId, userContext.accountId, departmentIds),
    ])

    return NextResponse.json({ success: true, data: { brecha, semaforo } })

  } catch (error: any) {
    console.error('[Executive Hub P&L Talent] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST — Legal Review (IntelligenceInsight)
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'pl-talent:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { employeeId, employeeName, yearsOfService, targetType, actionCode, gapMonthly } = body

    const resolvedActionCode = actionCode || 'LEGAL_REVIEW'
    const resolvedTargetType = targetType || 'EMPLOYEE'
    const resolvedTargetId = employeeId

    if (!resolvedTargetId || !employeeName) {
      return NextResponse.json({ error: 'employeeId y employeeName requeridos' }, { status: 400 })
    }

    // Deduplication check
    const existing = await prisma.intelligenceInsight.findFirst({
      where: {
        accountId: userContext.accountId,
        sourceModule: 'EXECUTIVE_HUB',
        targetType: resolvedTargetType,
        targetId: resolvedTargetId,
        actionCode: resolvedActionCode,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una acción activa', insightId: existing.id },
        { status: 409 }
      )
    }

    // Build action text based on action code
    const actionTaken = resolvedActionCode === 'BRECHA_PRODUCTIVA'
      ? `Revisión ejecutiva solicitada para ${employeeName}. Brecha mensual: ${gapMonthly ? `$${Math.round(gapMonthly / 1000)}K` : 'N/A'}.`
      : `Consulta ejecutiva: ¿Tiene un plan de mejora activo o se está evaluando otra decisión? Hoy tiene ${yearsOfService} años en la empresa.`

    const title = resolvedActionCode === 'BRECHA_PRODUCTIVA'
      ? `Brecha Productiva — ${employeeName}`
      : `Revisión Legal — ${employeeName}`

    // Create IntelligenceInsight
    const insight = await prisma.intelligenceInsight.create({
      data: {
        accountId: userContext.accountId,
        category: 'REACTIVE',
        resolutionMode: 'MANUAL',
        sourceModule: 'EXECUTIVE_HUB',
        sourceType: 'INSIGHT',
        targetType: resolvedTargetType,
        targetId: resolvedTargetId,
        actionCode: resolvedActionCode,
        title,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userContext.userId || 'unknown',
        actionTaken,
      },
    })

    return NextResponse.json({ success: true, insightId: insight.id })

  } catch (error: any) {
    console.error('[Executive Hub P&L Talent POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function resolveGerenciaDepts(accountId: string, name: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: { accountId, displayName: name, isActive: true },
    select: { id: true },
  })
  if (!dept) return []
  const childIds = await getChildDepartmentIds(dept.id)
  return [dept.id, ...childIds]
}
