// src/app/api/compliance/campaigns/route.ts
// Ambiente Sano - Lista de campañas del slug pulso-ambientes-sanos para el
// selector del dashboard. Endpoint dedicado (ver C2 del SPEC frontend):
// el endpoint genérico /api/campaigns filtra por campaignType ID, no slug.
//
// RBAC: compliance:view. Filtrado jerárquico para AREA_MANAGER no aplica
// aquí porque la lista es a nivel campaña (sin participantes en el payload);
// el AREA_MANAGER recién se filtra al abrir el reporte de una campaña.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        accountId: userContext.accountId,
        campaignType: { slug: AMBIENTE_SANO_SLUG },
      },
      orderBy: [{ endDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        completedAt: true,
        totalInvited: true,
        totalResponded: true,
      },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, campaigns: [] });
    }

    // Flag hasCompletedAnalysis: ¿existe ORG COMPLETED para cada campaña?
    const orgCompleted = await prisma.complianceAnalysis.findMany({
      where: {
        campaignId: { in: campaigns.map((c) => c.id) },
        scope: 'ORG',
        status: 'COMPLETED',
      },
      select: { campaignId: true },
    });
    const completedSet = new Set(orgCompleted.map((a) => a.campaignId));

    const payload = campaigns.map((c) => ({
      ...c,
      hasCompletedAnalysis: completedSet.has(c.id),
    }));

    return NextResponse.json({ success: true, campaigns: payload });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/campaigns] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
