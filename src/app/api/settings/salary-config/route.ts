// ════════════════════════════════════════════════════════════════════════════
// src/app/api/settings/salary-config/route.ts
// API para configuración salarial de cuenta
// Soporta ?accountId=xxx para modo admin (FOCALIZAHR_ADMIN)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { validateHeadcountDistribution } from '@/config/SalaryConfig'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

/**
 * Resuelve el accountId a usar:
 * - Si viene ?accountId en query y el usuario es FOCALIZAHR_ADMIN, usa ese
 * - Si no, usa el accountId del JWT del usuario
 */
function resolveAccountId(request: NextRequest, userContext: { accountId: string; role: string | null }): string | null {
  const queryAccountId = request.nextUrl.searchParams.get('accountId')

  if (queryAccountId && userContext.role === 'FOCALIZAHR_ADMIN') {
    return queryAccountId
  }

  return userContext.accountId || null
}

// ════════════════════════════════════════════════════════════════════════════
// GET: Obtener configuración actual
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId && !request.nextUrl.searchParams.get('accountId')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'salary-config:view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver configuración salarial' },
        { status: 403 }
      )
    }

    const targetAccountId = resolveAccountId(request, userContext)
    if (!targetAccountId) {
      return NextResponse.json({ error: 'Account ID requerido' }, { status: 400 })
    }

    const config = await SalaryConfigService.getAccountSalaryConfig(targetAccountId)

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        defaults: SalaryConfigService.getChileDefaults(),
        distribution: SalaryConfigService.getChileDistribution(),
        methodology: SalaryConfigService.getMethodologyConstants(),
        metadata: SalaryConfigService.getConfigMetadata()
      }
    })
  } catch (error) {
    console.error('[API ERROR] GET salary-config:', error)
    return NextResponse.json(
      { error: 'Error obteniendo configuración', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST: Actualizar configuración
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId && !request.nextUrl.searchParams.get('accountId')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'salary-config:edit')) {
      return NextResponse.json(
        { error: 'Sin permisos para editar configuración salarial' },
        { status: 403 }
      )
    }

    const targetAccountId = resolveAccountId(request, userContext)
    if (!targetAccountId) {
      return NextResponse.json({ error: 'Account ID requerido' }, { status: 400 })
    }

    const body = await request.json()

    // Validar distribución si se envía
    if (body.headcountDistribution) {
      if (!validateHeadcountDistribution(body.headcountDistribution)) {
        return NextResponse.json(
          { error: 'La distribución de dotación debe sumar 100%', success: false },
          { status: 400 }
        )
      }
    }

    // Validar salarios positivos
    if (body.salaryByJobLevel) {
      const levels = body.salaryByJobLevel
      if (
        levels.alta_gerencia < 0 ||
        levels.mandos_medios < 0 ||
        levels.profesionales < 0 ||
        levels.base_operativa < 0
      ) {
        return NextResponse.json(
          { error: 'Los salarios deben ser positivos', success: false },
          { status: 400 }
        )
      }
    }

    await SalaryConfigService.updateAccountSalaryConfig(targetAccountId, {
      averageMonthlySalary: body.averageMonthlySalary,
      salaryByJobLevel: body.salaryByJobLevel,
      headcountDistribution: body.headcountDistribution,
      turnoverBaselineRate: body.turnoverBaselineRate,
      headcount: body.headcount,
      newHiresPerYear: body.newHiresPerYear
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración salarial actualizada'
    })
  } catch (error) {
    console.error('[API ERROR] POST salary-config:', error)
    return NextResponse.json(
      { error: 'Error actualizando configuración', success: false },
      { status: 500 }
    )
  }
}
