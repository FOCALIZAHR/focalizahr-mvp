// src/app/api/admin/performance-cycles/[id]/delivery-tracking/route.ts
// API para métricas de entrega de reportes

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

/**
 * GET /api/admin/performance-cycles/[id]/delivery-tracking
 * Retorna métricas de entrega de reportes individuales
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
        endDate: true,
        account: {
          select: {
            reportLinkExpirationDays: true
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 });
    }

    // Obtener todas las confirmaciones de entrega del ciclo
    const confirmations = await prisma.feedbackDeliveryConfirmation.findMany({
      where: { cycleId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    const expirationDays = cycle.account.reportLinkExpirationDays;
    const now = new Date();

    // Clasificar confirmaciones
    const deliveries = confirmations.map(c => {
      const expiresAt = new Date(c.sentAt.getTime() + expirationDays * 24 * 60 * 60 * 1000);
      const isExpired = now > expiresAt;

      let status: 'confirmed' | 'pending' | 'expired';
      if (c.confirmedAt) {
        status = 'confirmed';
      } else if (isExpired) {
        status = 'expired';
      } else {
        status = 'pending';
      }

      return {
        id: c.id,
        employeeId: c.employeeId,
        employeeName: c.employee.name || 'Sin nombre',
        employeeEmail: c.employee.email || '',
        sentAt: c.sentAt.toISOString(),
        confirmedAt: c.confirmedAt?.toISOString() || null,
        receivedOnTime: c.receivedOnTime,
        expiresAt: expiresAt.toISOString(),
        status
      };
    });

    // Stats
    const total = deliveries.length;
    const confirmed = deliveries.filter(d => d.status === 'confirmed').length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const expired = deliveries.filter(d => d.status === 'expired').length;
    const onTime = deliveries.filter(d => d.receivedOnTime === true).length;

    return NextResponse.json({
      success: true,
      tracking: {
        cycleId,
        cycleName: cycle.name,
        stats: {
          total,
          confirmed,
          pending,
          expired,
          onTime,
          confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
          onTimeRate: confirmed > 0 ? Math.round((onTime / confirmed) * 100) : 0
        },
        deliveries
      }
    });

  } catch (error: any) {
    console.error('[API] Error delivery tracking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
