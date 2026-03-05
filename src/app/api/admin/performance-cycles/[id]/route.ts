// src/app/api/admin/performance-cycles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission, GLOBAL_ACCESS_ROLES, getChildDepartmentIds } from '@/lib/services/AuthorizationService';
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService';

// GET - Detalle de ciclo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasPermission(userContext.role, 'evaluations:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SECURITY: Filtrado jerárquico de assignments según rol
    // ════════════════════════════════════════════════════════════════════════════
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

    // FOCALIZAHR_ADMIN puede ver ciclos de cualquier cuenta
    const whereClause = userContext.role === 'FOCALIZAHR_ADMIN'
      ? { id }
      : { id, accountId: userContext.accountId };

    // Construir filtro de assignments según rol
    let assignmentFilter: any = {}
    if (!hasGlobalAccess) {
      if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
        const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
        const allowedDepts = [userContext.departmentId, ...childDeptIds]
        assignmentFilter = { evaluatee: { departmentId: { in: allowedDepts } } }
      } else if (userContext.role === 'EVALUATOR') {
        const userEmail = request.headers.get('x-user-email') || ''
        const currentEmployee = await prisma.employee.findFirst({
          where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
          select: { id: true }
        })
        if (currentEmployee) {
          assignmentFilter = { evaluatee: { managerId: currentEmployee.id } }
        } else {
          return NextResponse.json(
            { success: false, error: 'Empleado no encontrado' },
            { status: 404 }
          );
        }
      }
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: whereClause,
      include: {
        assignments: {
          where: assignmentFilter,
          include: {
            evaluator: { select: { id: true, fullName: true } },
            evaluatee: { select: { id: true, fullName: true } }
          }
        },
        _count: {
          select: { assignments: true }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      );
    }

    // Stats por estado (sobre assignments filtrados por rol)
    const stats = {
      total: cycle.assignments.length,
      pending: cycle.assignments.filter(a => a.status === 'PENDING').length,
      inProgress: cycle.assignments.filter(a => a.status === 'IN_PROGRESS').length,
      completed: cycle.assignments.filter(a => a.status === 'COMPLETED').length,
      expired: cycle.assignments.filter(a => a.status === 'EXPIRED').length
    };

    // Stats por tipo de evaluación
    const byType = {
      self: cycle.assignments.filter(a => a.evaluationType === 'SELF').length,
      managerToEmployee: cycle.assignments.filter(a => a.evaluationType === 'MANAGER_TO_EMPLOYEE').length,
      employeeToManager: cycle.assignments.filter(a => a.evaluationType === 'EMPLOYEE_TO_MANAGER').length,
      peer: cycle.assignments.filter(a => a.evaluationType === 'PEER').length
    };

    // Detectar departamentos huérfanos (level=3 sin parentId, excluyendo paraguas)
    const orphanDepartmentCount = await prisma.department.count({
      where: {
        accountId: cycle.accountId,
        level: 3,
        parentId: null,
        isActive: true,
        NOT: { displayName: 'Departamentos sin Asignar' }
      }
    });

    return NextResponse.json({
      success: true,
      data: cycle,
      stats,
      byType,
      orphanDepartmentCount
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo cycle:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar ciclo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // FOCALIZAHR_ADMIN puede gestionar ciclos de cualquier cuenta
    const whereClause = userContext.role === 'FOCALIZAHR_ADMIN'
      ? { id }
      : { id, accountId: userContext.accountId };

    const cycle = await prisma.performanceCycle.findFirst({
      where: whereClause
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, ...updateData } = body;

    // Validar transiciones de estado
    if (status) {
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['SCHEDULED', 'CANCELLED'],
        'SCHEDULED': ['ACTIVE', 'CANCELLED'],
        'ACTIVE': ['IN_REVIEW', 'CANCELLED'],
        'IN_REVIEW': ['COMPLETED', 'ACTIVE'],
        'COMPLETED': [],
        'CANCELLED': []
      };

      if (!validTransitions[cycle.status]?.includes(status)) {
        return NextResponse.json(
          { success: false, error: `No se puede cambiar de ${cycle.status} a ${status}` },
          { status: 400 }
        );
      }
    }

    // Validar pesos si se envían
    if (updateData.includeGoals !== undefined || updateData.competenciesWeight !== undefined || updateData.goalsWeight !== undefined) {
      const incGoals = updateData.includeGoals ?? cycle.includeGoals
      const compW = updateData.competenciesWeight ?? cycle.competenciesWeight
      const goalW = updateData.goalsWeight ?? cycle.goalsWeight
      if (incGoals && (compW + goalW !== 100)) {
        return NextResponse.json(
          { success: false, error: 'Los pesos de competencias y metas deben sumar 100%' },
          { status: 400 }
        );
      }
    }

    // Sanitizar campos actualizables
    const allowedFields = [
      'name', 'description', 'startDate', 'endDate',
      'includesSelf', 'includesManager', 'includesPeer', 'includesUpward',
      'anonymousResults', 'minSubordinates',
      'competenciesWeight', 'goalsWeight', 'includeGoals'
    ];

    const sanitizedData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Convertir fechas si es necesario
        if (field === 'startDate' || field === 'endDate') {
          sanitizedData[field] = new Date(updateData[field]);
        } else {
          sanitizedData[field] = updateData[field];
        }
      }
    }

    const updated = await prisma.performanceCycle.update({
      where: { id },
      data: {
        ...sanitizedData,
        ...(status && { status })
      }
    });

    // Auto-generar PerformanceRatings al entrar a IN_REVIEW
    if (status === 'IN_REVIEW') {
      try {
        const result = await PerformanceRatingService.generateRatingsForCycle(id, cycle.accountId)
        console.log(`[Performance] Auto-generated ratings on IN_REVIEW: ${result.success} success, ${result.failed} failed`)
      } catch (err) {
        console.error('[Performance] Error auto-generating ratings:', err)
        // No fallar la transición de estado
      }
    }

    // Sincronizar Campaign asociada cuando el ciclo se activa
    if (status === 'ACTIVE' && cycle.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: cycle.campaignId }
      });

      if (campaign && campaign.status === 'draft') {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'active',
            activatedAt: new Date()
          }
        });
        console.log(`[Performance] Campaign ${campaign.id} activada junto con ciclo ${id}`);
      }
    }

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    console.error('[API] Error actualizando cycle:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
