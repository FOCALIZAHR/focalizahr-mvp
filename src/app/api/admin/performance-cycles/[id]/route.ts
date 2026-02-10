// src/app/api/admin/performance-cycles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
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

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // FOCALIZAHR_ADMIN puede ver ciclos de cualquier cuenta
    const whereClause = userContext.role === 'FOCALIZAHR_ADMIN'
      ? { id }
      : { id, accountId: userContext.accountId };

    const cycle = await prisma.performanceCycle.findFirst({
      where: whereClause,
      include: {
        assignments: {
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

    // Stats por estado
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

    return NextResponse.json({
      success: true,
      data: cycle,
      stats,
      byType
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
        'IN_REVIEW': ['COMPLETED'],
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

    // Sanitizar campos actualizables
    const allowedFields = [
      'name', 'description', 'startDate', 'endDate',
      'includesSelf', 'includesManager', 'includesPeer', 'includesUpward',
      'anonymousResults', 'minSubordinates'
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
