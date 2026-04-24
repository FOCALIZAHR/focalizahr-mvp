// src/app/api/compliance/generate-participants/route.ts
// Ambiente Sano - Genera Participants desde Employee ACTIVE para una campaña.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { generateComplianceParticipants } from '@/lib/services/ComplianceParticipantGenerator';

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId && !userContext.role) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasPermission(userContext.role, 'compliance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para gestionar Ambiente Sano' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { campaignId, accountId: bodyAccountId } = body;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    let targetAccountId: string;

    if (userContext.role === 'FOCALIZAHR_ADMIN') {
      if (!bodyAccountId) {
        return NextResponse.json(
          { success: false, error: 'accountId requerido para FOCALIZAHR_ADMIN' },
          { status: 400 }
        );
      }

      const account = await prisma.account.findUnique({
        where: { id: bodyAccountId },
        select: { id: true, status: true },
      });

      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Cuenta no encontrada' },
          { status: 404 }
        );
      }

      if (account.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: `Cuenta no activa: ${account.status}` },
          { status: 400 }
        );
      }

      targetAccountId = bodyAccountId;
    } else {
      if (!userContext.accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId no disponible en contexto' },
          { status: 401 }
        );
      }
      targetAccountId = userContext.accountId;
    }

    const result = await generateComplianceParticipants(campaignId, targetAccountId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/generate-participants] Error:', msg);

    if (msg === 'Debe cargar nómina primero') {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }

    if (msg.startsWith('ComplianceParticipantGenerator solo aplica')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
