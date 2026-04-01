// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - GOALS CORRELATION API
// src/app/api/executive-hub/goals-correlation/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: Correlación Metas × Performance para Insight #7
// Datos para 3 tabs: Narrativas ($$$), Análisis (scatter), Gerencias (heatmap)
// Patrón: Mismo RBAC + departmentIds que /calibration
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

export async function GET(request: NextRequest) {
  try {
    // 1. EXTRAER CONTEXTO (viene del middleware)
    const userContext = extractUserContext(request)

    // 2. VALIDAR AUTENTICACIÓN
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 3. PARSEAR QUERY PARAMS
    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerenciaParam = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    // 4. FILTRADO JERÁRQUICO SEGÚN ROL
    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // 5. DRILL-DOWN POR GERENCIA (opcional)
    if (gerenciaParam) {
      const gerenciaDepts = await prisma.department.findMany({
        where: {
          accountId: userContext.accountId,
          isActive: true,
          OR: [
            { displayName: gerenciaParam },
            { parent: { displayName: gerenciaParam } },
          ],
        },
        select: { id: true },
      })
      const gIds = gerenciaDepts.map(d => d.id)
      if (gIds.length > 0) {
        departmentIds = departmentIds
          ? departmentIds.filter(id => gIds.includes(id))
          : gIds
      }
    }

    // 6. LLAMAR SERVICIO (toda la lógica en GoalsDiagnosticService)
    const data = await GoalsDiagnosticService.getCorrelationDetail(
      cycleId,
      userContext.accountId,
      departmentIds
    )

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('[Goals Correlation] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
