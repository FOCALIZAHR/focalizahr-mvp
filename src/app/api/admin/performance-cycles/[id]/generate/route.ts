// src/app/api/admin/performance-cycles/[id]/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import {
  generateManagerEvaluations,
  generateUpwardEvaluations,
  generateSelfEvaluations,
  generatePeerEvaluations
} from '@/lib/services/EvaluationService';

export async function POST(
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

    // FOCALIZAHR_ADMIN puede generar en ciclos de cualquier cuenta
    const isSuperAdmin = userContext.role === 'FOCALIZAHR_ADMIN';

    const cycle = await prisma.performanceCycle.findFirst({
      where: { id, ...(isSuperAdmin ? {} : { accountId: userContext.accountId }) }
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      );
    }

    if (!['DRAFT', 'SCHEDULED'].includes(cycle.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se puede generar en DRAFT o SCHEDULED' },
        { status: 400 }
      );
    }

    // Usar accountId del ciclo (no del admin) para buscar empleados
    const effectiveAccountId = cycle.accountId;

    const results: Record<string, any> = {};
    const options = { minSubordinates: cycle.minSubordinates, dueDate: cycle.endDate };

    // Generar según configuración del ciclo
    if (cycle.includesSelf) {
      results.self = await generateSelfEvaluations(id, effectiveAccountId, options);
    }

    if (cycle.includesManager) {
      results.manager = await generateManagerEvaluations(id, effectiveAccountId, options);
    }

    if (cycle.includesUpward) {
      results.upward = await generateUpwardEvaluations(id, effectiveAccountId, options);
    }

    if (cycle.includesPeer) {
      results.peer = await generatePeerEvaluations(id, effectiveAccountId, options);
    }

    // Calcular totales
    const totalCreated = Object.values(results).reduce((sum: number, r: any) => sum + (r.created || 0), 0);
    const totalSkipped = Object.values(results).reduce((sum: number, r: any) => sum + (r.skipped || 0), 0);
    const allErrors = Object.values(results).flatMap((r: any) => r.errors || []);

    // Cambiar a SCHEDULED si se generaron evaluaciones exitosamente
    if (totalCreated > 0 && cycle.status === 'DRAFT') {
      await prisma.performanceCycle.update({
        where: { id },
        data: { status: 'SCHEDULED' }
      });
    }

    return NextResponse.json({
      success: true,
      totalCreated,
      totalSkipped,
      errors: allErrors,
      details: results,
      statusChanged: totalCreated > 0 && cycle.status === 'DRAFT' ? 'SCHEDULED' : null
    });

  } catch (error: any) {
    console.error('[API] Error generando evaluations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
