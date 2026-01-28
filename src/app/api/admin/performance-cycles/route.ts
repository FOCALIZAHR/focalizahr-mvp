// src/app/api/admin/performance-cycles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import { CompetencyService } from '@/lib/services/CompetencyService';

// GET - Listar ciclos
export async function GET(request: NextRequest) {
  try {
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

    // FOCALIZAHR_ADMIN puede consultar cualquier cuenta via query param
    const { searchParams } = new URL(request.url);
    const queryAccountId = searchParams.get('accountId');
    const effectiveAccountId = (userContext.role === 'FOCALIZAHR_ADMIN' && queryAccountId)
      ? queryAccountId
      : userContext.accountId;

    const cycles = await prisma.performanceCycle.findMany({
      where: { accountId: effectiveAccountId },
      include: {
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: cycles });

  } catch (error: any) {
    console.error('[API] Error listando cycles:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear ciclo
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      campaignId,
      name,
      description,
      startDate,
      endDate,
      cycleType,
      includesSelf,
      includesManager,
      includesPeer,
      includesUpward,
      anonymousResults,
      minSubordinates
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'name, startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    // ════════════════════════════════════════════════════════════════
    // COMPETENCY LIBRARY: Generar snapshot inmutable de competencias
    // Este snapshot NO cambia aunque el cliente edite su biblioteca después
    // ════════════════════════════════════════════════════════════════
    const competencySnapshot = await CompetencyService.generateSnapshot(userContext.accountId);

    const cycle = await prisma.performanceCycle.create({
      data: {
        accountId: userContext.accountId,
        campaignId: campaignId || undefined,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        cycleType: cycleType || 'QUARTERLY',
        includesSelf: includesSelf ?? false,
        includesManager: includesManager ?? true,
        includesPeer: includesPeer ?? false,
        includesUpward: includesUpward ?? false,
        anonymousResults: anonymousResults ?? true,
        minSubordinates: minSubordinates ?? 3,
        status: 'DRAFT',
        createdBy: userContext.userId,
        // Snapshot congelado de competencias al momento de crear el ciclo
        competencySnapshot: competencySnapshot.length > 0
          ? JSON.parse(JSON.stringify(competencySnapshot))
          : undefined
      }
    });

    return NextResponse.json({ success: true, data: cycle }, { status: 201 });

  } catch (error: any) {
    console.error('[API] Error creando cycle:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
