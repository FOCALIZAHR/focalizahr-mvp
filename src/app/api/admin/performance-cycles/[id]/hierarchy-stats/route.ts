// src/app/api/admin/performance-cycles/[id]/hierarchy-stats/route.ts
// API para estadísticas jerárquicas del ciclo de desempeño

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

/**
 * GET /api/admin/performance-cycles/[id]/hierarchy-stats
 * Retorna estadísticas de asignaciones agrupadas por departamento
 * con soporte de drill-down jerárquico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el ciclo existe y pertenece a la cuenta
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: cycleId,
        accountId: userContext.accountId
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 });
    }

    // Obtener todas las asignaciones del ciclo con datos de departamento
    const assignments = await prisma.evaluationAssignment.findMany({
      where: { cycleId },
      select: {
        id: true,
        evaluateeName: true,
        evaluateeId: true,
        evaluateeDepartment: true,
        evaluateeDepartmentId: true,
        evaluatorName: true,
        evaluationType: true,
        status: true
      }
    });

    // Query param para drill-down a un departamento específico
    const departmentId = request.nextUrl.searchParams.get('departmentId');

    // ── Stats Globales ──
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED').length;
    const pendingAssignments = assignments.filter(a => a.status === 'PENDING').length;
    const inProgressAssignments = assignments.filter(a => a.status === 'IN_PROGRESS').length;
    const expiredAssignments = assignments.filter(a => a.status === 'EXPIRED').length;

    const globalStats = {
      total: totalAssignments,
      completed: completedAssignments,
      pending: pendingAssignments,
      inProgress: inProgressAssignments,
      expired: expiredAssignments,
      completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
    };

    // ── Agrupar por departamento del evaluado ──
    const deptMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      total: number;
      completed: number;
      pending: number;
      inProgress: number;
      expired: number;
      evaluatees: Map<string, {
        id: string;
        name: string;
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
        expired: number;
      }>;
    }>();

    for (const a of assignments) {
      const deptKey = a.evaluateeDepartmentId;
      if (!deptMap.has(deptKey)) {
        deptMap.set(deptKey, {
          departmentId: deptKey,
          departmentName: a.evaluateeDepartment,
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          expired: 0,
          evaluatees: new Map()
        });
      }

      const dept = deptMap.get(deptKey)!;
      dept.total++;
      if (a.status === 'COMPLETED') dept.completed++;
      else if (a.status === 'PENDING') dept.pending++;
      else if (a.status === 'IN_PROGRESS') dept.inProgress++;
      else if (a.status === 'EXPIRED') dept.expired++;

      // Agrupar por evaluado dentro del departamento
      if (!dept.evaluatees.has(a.evaluateeId)) {
        dept.evaluatees.set(a.evaluateeId, {
          id: a.evaluateeId,
          name: a.evaluateeName,
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          expired: 0
        });
      }

      const evaluatee = dept.evaluatees.get(a.evaluateeId)!;
      evaluatee.total++;
      if (a.status === 'COMPLETED') evaluatee.completed++;
      else if (a.status === 'PENDING') evaluatee.pending++;
      else if (a.status === 'IN_PROGRESS') evaluatee.inProgress++;
      else if (a.status === 'EXPIRED') evaluatee.expired++;
    }

    // Formatear departamentos
    const departments = Array.from(deptMap.values())
      .map(d => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        total: d.total,
        completed: d.completed,
        pending: d.pending,
        inProgress: d.inProgress,
        expired: d.expired,
        completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
        evaluateeCount: d.evaluatees.size
      }))
      .sort((a, b) => a.completionRate - b.completionRate); // Peor primero

    // Si se pidió drill-down a un departamento específico
    let drillDown = null;
    if (departmentId && deptMap.has(departmentId)) {
      const dept = deptMap.get(departmentId)!;
      drillDown = {
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        evaluatees: Array.from(dept.evaluatees.values())
          .map(e => ({
            ...e,
            completionRate: e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0
          }))
          .sort((a, b) => a.completionRate - b.completionRate)
      };
    }

    return NextResponse.json({
      success: true,
      hierarchy: {
        cycleId,
        cycleName: cycle.name,
        cycleStatus: cycle.status,
        globalStats,
        departments,
        drillDown
      }
    });

  } catch (error: any) {
    console.error('[API] Error hierarchy-stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
