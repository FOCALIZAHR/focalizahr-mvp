// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - ALERTS DETAIL API
// src/app/api/executive-hub/alerts/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: Alertas activas + Regretted Attrition + Contador por tipo
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { TalentIntelligenceService } from '@/lib/services/TalentIntelligenceService'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

// Posiciones 9-Box que se consideran "lamentables" si renuncian
const REGRETTED_POSITIONS = ['star', 'high_performer', 'consistent_star', 'growth_potential']

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerenciaParam = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    if (gerenciaParam) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerenciaParam)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    // Fetch paralelo: alertas + regretted attrition
    const [alertsData, regrettedAttrition] = await Promise.all([
      TalentIntelligenceService.getActiveAlerts(
        cycleId,
        userContext.accountId,
        departmentIds
      ),
      getRegrettedAttrition(userContext.accountId, departmentIds)
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...alertsData,
        regrettedAttrition
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Alerts] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REGRETTED ATTRITION
// Cruce: ExitRecord (renuncias voluntarias) × PerformanceRating (nineBoxPosition)
// Si era STAR o HIGH_PERFORMER → regretted = true
// ═══════════════════════════════════════════════════════════════════════

async function getRegrettedAttrition(
  accountId: string,
  departmentIds?: string[]
) {
  // Buscar exit records voluntarios de los últimos 6 meses
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const exitWhere: any = {
    accountId,
    exitReason: 'voluntary',
    exitDate: { gte: sixMonthsAgo }
  }

  if (departmentIds?.length) {
    exitWhere.departmentId = { in: departmentIds }
  }

  const exitRecords = await prisma.exitRecord.findMany({
    where: exitWhere,
    select: {
      id: true,
      nationalId: true,
      exitDate: true,
      departmentId: true
    }
  })

  if (exitRecords.length === 0) {
    return { count: 0, employees: [], message: null }
  }

  // Buscar si estos empleados tenían nineBoxPosition alto
  // Cruce por nationalId → Employee → PerformanceRating
  const nationalIds = exitRecords.map((e: { nationalId: string }) => e.nationalId)

  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      nationalId: { in: nationalIds }
    },
    select: {
      id: true,
      nationalId: true,
      fullName: true,
      department: {
        select: { displayName: true }
      },
      performanceRatings: {
        select: {
          nineBoxPosition: true,
          roleFitScore: true
        },
        orderBy: { calculatedAt: 'desc' },
        take: 1
      }
    }
  })

  // Mapear: nationalId → último nineBoxPosition + datos del empleado
  const employeeMap = new Map<string, {
    nineBoxPosition: string | null
    roleFitScore: number | null
    name: string
    department: string
  }>()
  for (const emp of employees) {
    const lastRating = emp.performanceRatings[0]
    employeeMap.set(emp.nationalId, {
      nineBoxPosition: lastRating?.nineBoxPosition || null,
      roleFitScore: lastRating?.roleFitScore || null,
      name: emp.fullName,
      department: emp.department?.displayName || 'Sin departamento'
    })
  }

  // Filtrar: solo los que eran estrellas/high performers
  const regretted = exitRecords
    .map((exit: typeof exitRecords[number]) => {
      const empInfo = employeeMap.get(exit.nationalId)
      const isRegretted = empInfo?.nineBoxPosition
        ? REGRETTED_POSITIONS.includes(empInfo.nineBoxPosition)
        : false

      return {
        name: empInfo?.name || 'Desconocido',
        department: empInfo?.department || 'Sin departamento',
        exitDate: exit.exitDate,
        nineBoxPosition: empInfo?.nineBoxPosition || null,
        roleFitScore: empInfo?.roleFitScore ? Math.round(empInfo.roleFitScore) : null,
        isRegretted
      }
    })
    .filter((e: { isRegretted: boolean }) => e.isRegretted)

  return {
    count: regretted.length,
    employees: regretted,
    message: regretted.length > 0
      ? `${regretted.length} renuncia${regretted.length > 1 ? 's' : ''} lamentable${regretted.length > 1 ? 's' : ''} en los ultimos 6 meses`
      : null
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
