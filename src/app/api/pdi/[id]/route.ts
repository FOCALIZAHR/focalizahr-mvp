// ════════════════════════════════════════════════════════════════════════════
// API: GET /api/pdi/[id] - Obtener PDI
//       PATCH /api/pdi/[id] - Actualizar PDI (solo en DRAFT)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  GLOBAL_ACCESS_ROLES,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// ════════════════════════════════════════════════════════════════════════════
// GET - Obtener PDI con detalle completo
// ════════════════════════════════════════════════════════════════════════════

export async function GET(
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

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    const pdi = await prisma.developmentPlan.findUnique({
      where: { id },
      include: {
        goals: { orderBy: { priority: 'asc' } },
        checkIns: { orderBy: { scheduledDate: 'desc' } },
        employee: { select: { fullName: true, email: true, performanceTrack: true, departmentId: true } },
        manager: { select: { fullName: true, email: true } },
        cycle: { select: { name: true, startDate: true, endDate: true } }
      }
    })

    if (!pdi) {
      return NextResponse.json({ success: false, error: 'PDI no encontrado' }, { status: 404 })
    }

    // Verificar que pertenece a la misma cuenta
    if (pdi.accountId !== userContext.accountId) {
      return NextResponse.json({ success: false, error: 'Sin acceso' }, { status: 403 })
    }

    // ════════════════════════════════════════════════════════════════════════
    // Verificar acceso según rol
    // ════════════════════════════════════════════════════════════════════════
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    const isDirectManager = pdi.managerId === currentEmployee.id
    const isEmployee = pdi.employeeId === currentEmployee.id

    let hasHierarchicalAccess = false
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childDeptIds]
      hasHierarchicalAccess = allowedDepts.includes(pdi.employee.departmentId)
    }

    if (!hasGlobalAccess && !isDirectManager && !isEmployee && !hasHierarchicalAccess) {
      return NextResponse.json({ success: false, error: 'Sin acceso a este PDI' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: pdi })

  } catch (error) {
    console.error('[API] Error GET /api/pdi/[id]:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Actualizar PDI (solo en DRAFT, solo manager o HR global)
// ════════════════════════════════════════════════════════════════════════════

const UpdatePDISchema = z.object({
  validUntil: z.string().datetime().optional(),
  goals: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    targetOutcome: z.string().min(1).optional(),
    targetDate: z.string().datetime().optional(),
    priority: z.enum(['ALTA', 'MEDIA', 'BAJA']).optional(),
    category: z.enum([
      'SKILL_DEVELOPMENT', 'BEHAVIORAL_CHANGE', 'KNOWLEDGE_ACQUISITION',
      'EXPERIENCE_BUILDING', 'CERTIFICATION', 'MENTORING'
    ]).optional(),
    aiGenerated: z.boolean().optional(),
    _delete: z.boolean().optional()
  })).optional()
})

export async function PATCH(
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

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    const pdi = await prisma.developmentPlan.findUnique({
      where: { id },
      include: { goals: true, employee: { select: { departmentId: true } } }
    })

    if (!pdi) {
      return NextResponse.json({ success: false, error: 'PDI no encontrado' }, { status: 404 })
    }

    if (pdi.accountId !== userContext.accountId) {
      return NextResponse.json({ success: false, error: 'Sin acceso' }, { status: 403 })
    }

    // ════════════════════════════════════════════════════════════════════════
    // Verificar acceso de escritura
    // ════════════════════════════════════════════════════════════════════════
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    const isDirectManager = pdi.managerId === currentEmployee.id

    let hasHierarchicalAccess = false
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childDeptIds]
      hasHierarchicalAccess = allowedDepts.includes(pdi.employee.departmentId)
    }

    if (!hasGlobalAccess && !isDirectManager && !hasHierarchicalAccess) {
      return NextResponse.json({ success: false, error: 'Solo el manager puede editar este PDI' }, { status: 403 })
    }

    // Solo se puede editar en DRAFT
    if (pdi.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Solo se puede editar un PDI en estado DRAFT' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = UpdatePDISchema.parse(body)

    // Procesar goals
    if (data.goals) {
      const toDelete = data.goals.filter(g => g._delete && g.id).map(g => g.id!)
      const toUpdate = data.goals.filter(g => g.id && !g._delete)
      const toCreate = data.goals.filter(g => !g.id && !g._delete)

      // Construir datos de update solo con campos presentes
      const updateOps = toUpdate
        .filter(g => g.title || g.description || g.targetOutcome || g.targetDate || g.priority || g.category)
        .map(g => {
          const updateData: any = {}
          if (g.title) updateData.title = g.title
          if (g.description !== undefined) updateData.description = g.description
          if (g.targetOutcome) updateData.targetOutcome = g.targetOutcome
          if (g.targetDate) updateData.targetDate = new Date(g.targetDate)
          if (g.priority) updateData.priority = g.priority
          if (g.category) updateData.category = g.category
          return prisma.developmentGoal.update({
            where: { id: g.id },
            data: updateData
          })
        })

      // Calcular targetDate por defecto: 8 semanas desde ahora
      const defaultTargetDate = new Date()
      defaultTargetDate.setDate(defaultTargetDate.getDate() + 56)

      await prisma.$transaction([
        // Eliminar marcados
        ...(toDelete.length > 0 ? [
          prisma.developmentGoal.deleteMany({ where: { id: { in: toDelete }, planId: id } })
        ] : []),
        // Actualizar existentes (solo los que tienen campos modificados)
        ...updateOps,
        // Crear nuevos
        ...toCreate.map(g =>
          prisma.developmentGoal.create({
            data: {
              planId: id,
              competencyCode: 'CUSTOM',
              competencyName: 'Objetivo Manual',
              title: g.title || 'Objetivo personalizado',
              description: g.description,
              targetOutcome: g.targetOutcome || 'Meta por definir',
              targetDate: g.targetDate ? new Date(g.targetDate) : defaultTargetDate,
              priority: g.priority || 'MEDIA',
              category: g.category || 'SKILL_DEVELOPMENT',
              aiGenerated: g.aiGenerated ?? false
            }
          })
        )
      ])
    }

    // Actualizar plan si hay otros campos
    if (data.validUntil) {
      await prisma.developmentPlan.update({
        where: { id },
        data: { validUntil: new Date(data.validUntil) }
      })
    }

    // Retornar actualizado
    const updated = await prisma.developmentPlan.findUnique({
      where: { id },
      include: { goals: { orderBy: { priority: 'asc' } } }
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[API] Error PATCH /api/pdi/[id]:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
