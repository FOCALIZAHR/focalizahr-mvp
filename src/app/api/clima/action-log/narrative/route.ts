// src/app/api/clima/action-log/narrative/route.ts
// H3b — la narrativa ejecutiva del hallazgo.
//
// ⛔ ESTE ENDPOINT NO GENERA NADA. Solo LEE la fila que dejó el cron
// (`/api/cron/clima-narrative-refresh`). Responde en milisegundos y no llama a
// ningún modelo.
//
// 🕐 Nació generando en cada visita, con caché en memoria. Se cambió el 2026-08-07:
// en serverless cada instancia tiene su propia caché, así que el ahorro era
// ficticio y con 90 jefes podían salir cientos de llamadas a Sonnet para leer
// siempre lo mismo. Ahora Sonnet corre UNA vez por cambio de clasificaciones, en
// el cron, y todos leen de la base.
//
// Sigue siendo un endpoint aparte de `../findings` —y no un campo de su
// respuesta— porque la narrativa puede no existir todavía: el cron pasa 1x/día, y
// entre que se escribe una entrada y se regenera la narrativa, la pantalla tiene
// que mostrar el template sin esperar a nadie.
//
// Nunca devuelve 500: la narrativa es un extra. Si falla, la UI muestra el
// template, que siempre es correcto.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import type { ClimaNarrativeDTO } from '@/types/clima-hub';

const VACIO = { narrative: null as ClimaNarrativeDTO | null };

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const campaignId = new URL(request.url).searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId requerido' }, { status: 400 });
    }

    const plan = await prisma.actionPlan.findFirst({
      where: { accountId: userContext.accountId, campaignId, moduleType: 'clima', estado: 'aprobado' },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!plan) return NextResponse.json({ success: true, data: VACIO });

    // UNA SOLA FILA GLOBAL POR PLAN (decisión de Victor, 2026-08-07): la leen
    // todos, CEO y AREA_MANAGER por igual. El `accountId` va en el where igual que
    // en cualquier query del proyecto, aunque el plan ya esté acotado a la cuenta.
    const fila = await prisma.climaEffectivenessNarrative.findFirst({
      where: {
        accountId: userContext.accountId,
        actionPlanId: plan.id,
        scope: 'GLOBAL',
        status: 'COMPLETED',
      },
      select: {
        headline: true,
        soporte: true,
        patron: true,
        evidencia: true,
        model: true,
        completedAt: true,
      },
    });

    // Fila COMPLETED sin headline = el cron corrió y no encontró patrón, o la
    // validación descartó la narrativa. Es un resultado, no una falta: la pantalla
    // se queda con el template.
    if (!fila?.headline || !fila.soporte) {
      return NextResponse.json({ success: true, data: VACIO });
    }

    return NextResponse.json({
      success: true,
      data: {
        narrative: {
          headline: fila.headline,
          soporte: fila.soporte,
          patron: fila.patron ?? '',
          evidencia: fila.evidencia,
          model: fila.model ?? '',
          generatedAt: (fila.completedAt ?? new Date()).toISOString(),
        } satisfies ClimaNarrativeDTO,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: VACIO });
  }
}
