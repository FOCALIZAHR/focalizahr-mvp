/**
 * POST /api/job-classification/assign
 *
 * Asigna un standardJobLevel a TODOS los empleados activos con un cargo dado.
 * Actualiza Employee + guarda en JobMappingHistory para feedback loop.
 *
 * Body:
 * {
 *   position: string          - Cargo a clasificar
 *   accountId?: string        - Solo para FOCALIZAHR_ADMIN
 *   standardJobLevel: string  - Nivel asignado (7 niveles validos)
 * }
 *
 * Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PositionAdapter } from '@/lib/services/PositionAdapter'

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER'
]

const VALID_JOB_LEVELS = [
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
] as const

interface AssignBody {
  position: string
  accountId?: string
  standardJobLevel: string
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const headerAccountId = request.headers.get('x-account-id')
    const userRole = request.headers.get('x-user-role') || ''
    const userEmail = request.headers.get('x-user-email') || ''

    if (!headerAccountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para clasificar cargos' },
        { status: 403 }
      )
    }

    // Parse body
    let body: AssignBody & { mode?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON invalido' },
        { status: 400 }
      )
    }

    // Bloquear modo client: debe usar /batch-assign
    if (body.mode === 'client') {
      return NextResponse.json(
        {
          success: false,
          error: 'En modo cliente, use POST /api/job-classification/batch-assign',
          hint: 'Las clasificaciones del wizard deben guardarse todas juntas'
        },
        { status: 403 }
      )
    }

    // Validaciones
    const errors: string[] = []
    if (!body.position) errors.push('position es requerido')
    if (!body.standardJobLevel) errors.push('standardJobLevel es requerido')

    if (body.standardJobLevel && !VALID_JOB_LEVELS.includes(body.standardJobLevel as typeof VALID_JOB_LEVELS[number])) {
      errors.push(`Nivel invalido: ${body.standardJobLevel}. Valores validos: ${VALID_JOB_LEVELS.join(', ')}`)
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Errores de validacion', details: errors },
        { status: 400 }
      )
    }

    // RBAC: admin puede especificar otra cuenta
    const isFocalizahrAdmin = userRole === 'FOCALIZAHR_ADMIN'
    const targetAccountId = isFocalizahrAdmin
      ? (body.accountId || headerAccountId)
      : headerAccountId

    // Derivar acotadoGroup y performanceTrack
    const acotadoGroup = PositionAdapter.getAcotadoGroup(body.standardJobLevel)
    const performanceTrack = PositionAdapter.mapToTrack(body.standardJobLevel)

    // Actualizar TODOS los empleados activos con ese cargo
    const updated = await prisma.employee.updateMany({
      where: {
        accountId: targetAccountId,
        position: { equals: body.position, mode: 'insensitive' },
        status: 'ACTIVE'
      },
      data: {
        standardJobLevel: body.standardJobLevel,
        acotadoGroup,
        performanceTrack,
        jobLevelMethod: 'manual',
        jobLevelMappedAt: new Date(),
        trackMappedAt: new Date(),
        trackHasAnomaly: false
      }
    })

    // Guardar en historico para feedback loop
    await PositionAdapter.saveToHistory(
      targetAccountId,
      body.position,
      body.standardJobLevel,
      userEmail || undefined
    )

    return NextResponse.json({
      success: true,
      updated: updated.count,
      mapping: {
        position: body.position,
        standardJobLevel: body.standardJobLevel,
        acotadoGroup,
        performanceTrack
      }
    })
  } catch (error: unknown) {
    console.error('[Job Classification Assign] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
