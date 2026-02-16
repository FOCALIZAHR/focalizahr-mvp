// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/pdi/[id]/change-status
// Transiciones de estado del PDI con validación de roles
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const ChangeStatusSchema = z.object({
  action: z.enum(['SUBMIT_FOR_REVIEW', 'AGREE', 'START', 'COMPLETE', 'CANCEL'])
})

// Transiciones permitidas: [estadoActual][acción] → nuevoEstado
const ALLOWED_TRANSITIONS: Record<string, Record<string, string>> = {
  'DRAFT':          { 'SUBMIT_FOR_REVIEW': 'PENDING_REVIEW', 'CANCEL': 'CANCELLED' },
  'PENDING_REVIEW': { 'AGREE': 'AGREED', 'CANCEL': 'CANCELLED' },
  'AGREED':         { 'START': 'IN_PROGRESS', 'CANCEL': 'CANCELLED' },
  'IN_PROGRESS':    { 'COMPLETE': 'COMPLETED', 'CANCEL': 'CANCELLED' }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    const pdi = await prisma.developmentPlan.findUnique({
      where: { id }
    })

    if (!pdi) {
      return NextResponse.json({ success: false, error: 'PDI no encontrado' }, { status: 404 })
    }

    // Verificar acceso
    const isManager = pdi.managerId === currentEmployee.id
    const isEmployee = pdi.employeeId === currentEmployee.id

    if (!isManager && !isEmployee) {
      return NextResponse.json({ success: false, error: 'Sin acceso a este PDI' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = ChangeStatusSchema.parse(body)

    // Verificar quién puede hacer cada acción
    const managerOnlyActions = ['SUBMIT_FOR_REVIEW', 'CANCEL']
    const employeeOnlyActions = ['AGREE']

    if (managerOnlyActions.includes(action) && !isManager) {
      return NextResponse.json(
        { success: false, error: 'Solo el manager puede realizar esta acción' },
        { status: 403 }
      )
    }
    if (employeeOnlyActions.includes(action) && !isEmployee) {
      return NextResponse.json(
        { success: false, error: 'Solo el colaborador puede realizar esta acción' },
        { status: 403 }
      )
    }

    // Verificar transición válida
    const currentStatus = pdi.status
    const allowedForStatus = ALLOWED_TRANSITIONS[currentStatus]

    if (!allowedForStatus || !allowedForStatus[action]) {
      return NextResponse.json(
        { success: false, error: `No se puede realizar '${action}' desde estado '${currentStatus}'` },
        { status: 400 }
      )
    }

    const newStatus = allowedForStatus[action]

    // Actualizar con campos adicionales según la acción
    const updateData: any = { status: newStatus }

    if (action === 'AGREE') {
      updateData.agreedAt = new Date()
    }
    if (action === 'COMPLETE') {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.developmentPlan.update({
      where: { id },
      data: updateData,
      include: {
        goals: true,
        employee: { select: { fullName: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Estado cambiado de ${currentStatus} a ${newStatus}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Acción inválida', details: error.errors }, { status: 400 })
    }
    console.error('[API] Error POST /api/pdi/[id]/change-status:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
