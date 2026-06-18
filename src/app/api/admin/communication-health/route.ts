// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/communication-health
// Estado de salud de la cola CommunicationMessage (Gate A v3.0)
// ════════════════════════════════════════════════════════════════════════════
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 5.1
//
// Scoping:
//   - FOCALIZAHR_ADMIN: ve toda la plataforma (sin filtro de accountId)
//   - Otros roles autorizados (ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER): solo su cuenta
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request);

  if (!userContext.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (!hasPermission(userContext.role, 'communication:monitor')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  // FOCALIZAHR_ADMIN ve todo, otros roles filtran por su accountId
  const isPlatformAdmin = userContext.role === 'FOCALIZAHR_ADMIN';
  const baseWhere = isPlatformAdmin ? {} : { accountId: userContext.accountId };

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const [byStatus, byChannel, recentFailures, oldestPending] = await Promise.all([
      // Counts por status
      prisma.communicationMessage.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
      // Counts por canal
      prisma.communicationMessage.groupBy({
        by: ['channel'],
        where: baseWhere,
        _count: true,
      }),
      // FAILED de las ultimas 24h con errorMessage
      prisma.communicationMessage.findMany({
        where: {
          ...baseWhere,
          status: 'FAILED',
          failedAt: { gte: twentyFourHoursAgo },
        },
        select: {
          id: true,
          messageType: true,
          channel: true,
          errorMessage: true,
          failedAt: true,
          accountId: true,
        },
        orderBy: { failedAt: 'desc' },
        take: 50,
      }),
      // PENDING mas antiguo (para detectar dispatcher caido)
      prisma.communicationMessage.findFirst({
        where: { ...baseWhere, status: 'PENDING' },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, scheduledAt: true, messageType: true },
      }),
    ]);

    const statusCounts = byStatus.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count;
      return acc;
    }, {});

    const channelCounts = byChannel.reduce<Record<string, number>>((acc, row) => {
      acc[row.channel] = row._count;
      return acc;
    }, {});

    const oldestPendingAgeSeconds = oldestPending
      ? Math.floor((Date.now() - new Date(oldestPending.scheduledAt).getTime()) / 1000)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        scope: isPlatformAdmin ? 'platform' : 'account',
        statusCounts,
        channelCounts,
        recentFailures,
        oldestPending: oldestPending
          ? {
              id: oldestPending.id,
              messageType: oldestPending.messageType,
              scheduledAt: oldestPending.scheduledAt,
              ageSeconds: oldestPendingAgeSeconds,
            }
          : null,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown error';
    console.error('[CommunicationHealth] Error:', errMsg);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo estado de comunicaciones' },
      { status: 500 }
    );
  }
}
