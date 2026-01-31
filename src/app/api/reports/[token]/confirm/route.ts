// src/app/api/reports/[token]/confirm/route.ts
// API para confirmar recepción de reporte individual

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reports/[token]/confirm
 * Acceso anónimo - Confirma recepción del reporte
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const confirmation = await prisma.feedbackDeliveryConfirmation.findUnique({
      where: { reportToken: token },
      include: {
        cycle: {
          select: {
            account: {
              select: { reportLinkExpirationDays: true }
            }
          }
        }
      }
    });

    if (!confirmation) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Ya confirmado
    if (confirmation.confirmedAt) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        confirmedAt: confirmation.confirmedAt.toISOString()
      });
    }

    // Verificar expiración
    const expirationDays = confirmation.cycle.account.reportLinkExpirationDays;
    const sentAt = new Date(confirmation.sentAt);
    const expiresAt = new Date(sentAt.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiresAt;

    if (isExpired) {
      return NextResponse.json(
        { success: false, error: 'Este enlace ha expirado' },
        { status: 410 }
      );
    }

    // Determinar si fue on-time (dentro de 7 días del envío)
    const daysSinceSent = Math.floor(
      (new Date().getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const receivedOnTime = daysSinceSent <= 7;

    // Actualizar confirmación
    const updated = await prisma.feedbackDeliveryConfirmation.update({
      where: { reportToken: token },
      data: {
        confirmedAt: new Date(),
        receivedOnTime
      }
    });

    return NextResponse.json({
      success: true,
      confirmedAt: updated.confirmedAt?.toISOString(),
      receivedOnTime
    });

  } catch (error: any) {
    console.error('[API] Error confirmando report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
