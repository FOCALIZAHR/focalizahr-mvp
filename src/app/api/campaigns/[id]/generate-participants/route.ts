// src/app/api/campaigns/[id]/generate-participants/route.ts
// Genera Participants desde Employee ACTIVE para una campaña employee-based.
// Endpoint genérico (Ambiente Sano, Pulso Express, Experiencia Full) — el generator
// valida el slug contra su allow-list. Reemplaza la necesidad de un endpoint por producto.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { generateEmployeeBasedParticipants } from '@/lib/services/EmployeeBasedParticipantGenerator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId && !userContext.role) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Mismo permiso que crear campaña (campaigns:manage): crear y generar piden lo
    // mismo, y este set espeja compliance:manage — restaura la paridad de Ambiente
    // Sano para HR_MANAGER, que participants:write excluía.
    if (!hasPermission(userContext.role, 'campaigns:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para generar participantes' },
        { status: 403 }
      );
    }

    const campaignId = params.id;
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    // accountId: FOCALIZAHR_ADMIN puede operar sobre otra cuenta vía body; el resto usa
    // su propio contexto (multi-tenant).
    let targetAccountId: string;

    if (userContext.role === 'FOCALIZAHR_ADMIN') {
      const body = await request.json().catch(() => ({}));
      const bodyAccountId = body?.accountId;

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

    const result = await generateEmployeeBasedParticipants(campaignId, targetAccountId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[campaigns/generate-participants] Error:', msg);

    if (msg === 'Debe cargar nómina primero') {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }

    if (msg.startsWith('EmployeeBasedParticipantGenerator no aplica')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
