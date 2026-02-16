// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/pdi/[id]/check-ins
// Registrar check-in de seguimiento + actualizar progreso de goals
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const CheckInSchema = z.object({
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  managerNotes: z.string().optional(),
  employeeNotes: z.string().optional(),
  goalProgress: z.array(z.object({
    goalId: z.string(),
    previousPercent: z.number().min(0).max(100),
    newPercent: z.number().min(0).max(100),
    notes: z.string().optional()
  })).optional(),
  actionItems: z.array(z.object({
    action: z.string(),
    dueDate: z.string().datetime().optional(),
    owner: z.enum(['MANAGER', 'EMPLOYEE']),
    completed: z.boolean().default(false)
  })).optional(),
  nextCheckInDate: z.string().datetime().optional()
})

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
      where: { id },
      include: { goals: true }
    })

    if (!pdi) {
      return NextResponse.json({ success: false, error: 'PDI no encontrado' }, { status: 404 })
    }

    // Verificar acceso: manager o empleado
    const hasAccess =
      pdi.managerId === currentEmployee.id ||
      pdi.employeeId === currentEmployee.id

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Sin acceso a este PDI' }, { status: 403 })
    }

    // Solo se puede hacer check-in en AGREED o IN_PROGRESS
    if (!['AGREED', 'IN_PROGRESS'].includes(pdi.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se puede hacer check-in en PDIs acordados o en progreso' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = CheckInSchema.parse(body)

    // Crear check-in y actualizar progreso en transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear check-in
      const checkIn = await tx.pDICheckIn.create({
        data: {
          planId: id,
          scheduledDate: new Date(data.scheduledDate),
          completedDate: data.completedDate ? new Date(data.completedDate) : new Date(),
          status: 'COMPLETED',
          managerNotes: data.managerNotes,
          employeeNotes: data.employeeNotes,
          goalProgress: data.goalProgress as any,
          actionItems: data.actionItems as any,
          nextCheckInDate: data.nextCheckInDate ? new Date(data.nextCheckInDate) : null
        }
      })

      // 2. Actualizar progreso de cada goal
      if (data.goalProgress) {
        for (const progress of data.goalProgress) {
          await tx.developmentGoal.update({
            where: { id: progress.goalId },
            data: {
              progressPercent: progress.newPercent,
              status: progress.newPercent >= 100 ? 'COMPLETED' :
                      progress.newPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
            }
          })
        }
      }

      // 3. Si el PDI estaba en AGREED, pasarlo a IN_PROGRESS
      if (pdi.status === 'AGREED') {
        await tx.developmentPlan.update({
          where: { id },
          data: { status: 'IN_PROGRESS' }
        })
      }

      return checkIn
    })

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[API] Error POST /api/pdi/[id]/check-ins:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
