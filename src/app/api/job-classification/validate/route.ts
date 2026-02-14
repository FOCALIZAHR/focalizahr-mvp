/**
 * GET /api/job-classification/validate
 *
 * Pre-check antes de generar un ciclo de desempeno.
 * Retorna si la cuenta puede proceder y cuantos pendientes hay.
 *
 * Response:
 * {
 *   canProceed: boolean,
 *   pendingCount: number,
 *   anomalyCount: number,
 *   message: string
 * }
 *
 * Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER'
]

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
        { success: false, error: 'Sin permisos para validar clasificacion' },
        { status: 403 }
      )
    }

    // RBAC
    const isFocalizahrAdmin = userRole === 'FOCALIZAHR_ADMIN'
    const targetAccountId = isFocalizahrAdmin
      ? (request.nextUrl.searchParams.get('accountId') || accountId)
      : accountId

    // Contar empleados sin clasificar (con position pero sin standardJobLevel)
    const pendingCount = await prisma.employee.count({
      where: {
        accountId: targetAccountId,
        status: 'ACTIVE',
        standardJobLevel: null,
        position: { not: null }
      }
    })

    // Contar anomalias (COLABORADOR con reportes directos activos)
    const anomalyCount = await prisma.employee.count({
      where: {
        accountId: targetAccountId,
        status: 'ACTIVE',
        trackHasAnomaly: true
      }
    })

    // Puede proceder si no hay pendientes ni anomalias
    const canProceed = pendingCount === 0 && anomalyCount === 0

    let message: string
    if (canProceed) {
      message = 'Todos los empleados estan clasificados. Puede generar el ciclo.'
    } else {
      const parts: string[] = []
      if (pendingCount > 0) parts.push(`${pendingCount} cargos sin clasificar`)
      if (anomalyCount > 0) parts.push(`${anomalyCount} con anomalias`)
      message = `Hay ${parts.join(' y ')}`
    }

    return NextResponse.json({
      success: true,
      canProceed,
      pendingCount,
      anomalyCount,
      message
    })
  } catch (error: unknown) {
    console.error('[Job Classification Validate] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
