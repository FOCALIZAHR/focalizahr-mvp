// src/app/api/clima/campaigns/route.ts
// EX Clima — Lista de campañas de clima (Pulso Express / Experiencia Full) para
// el selector del Cinema Mode. Endpoint dedicado (clon de compliance/campaigns):
// el genérico /api/campaigns filtra por campaignType ID, no por slug.
//
// RBAC: clima:view. El filtrado jerárquico de AREA_MANAGER NO aplica a nivel
// lista (sin participantes en el payload); recién se aplica al abrir resultados.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { CLIMA_CAMPAIGN_SLUGS } from '@/lib/services/clima/ClimaAggregationService';
import type { ClimaProductType } from '@/types/clima';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        accountId: userContext.accountId,
        campaignType: { slug: { in: CLIMA_CAMPAIGN_SLUGS as unknown as string[] } },
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
        climaAggregationStatus: true,
        campaignType: { select: { slug: true } },
      },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, campaigns: [] });
    }

    // Flag hasCompletedAnalysis: agregación COMPLETED o existe al menos un
    // DepartmentClimaInsight para la campaña (re-run manual vía recompute deja
    // insights aunque el status quede en otro estado).
    const insightCampaignIds = await prisma.departmentClimaInsight.findMany({
      where: {
        accountId: userContext.accountId,
        campaignId: { in: campaigns.map((c) => c.id) },
      },
      select: { campaignId: true },
      distinct: ['campaignId'],
    });
    const withInsights = new Set(
      insightCampaignIds.map((i) => i.campaignId).filter((id): id is string => id !== null)
    );

    const payload = campaigns.map((c) => {
      const slug = c.campaignType?.slug ?? null;
      const productType = (CLIMA_CAMPAIGN_SLUGS as unknown as string[]).includes(slug ?? '')
        ? (slug as ClimaProductType)
        : null;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        completedAt: c.completedAt,
        totalInvited: c.totalInvited,
        totalResponded: c.totalResponded,
        productType,
        hasCompletedAnalysis:
          c.climaAggregationStatus === 'COMPLETED' || withInsights.has(c.id),
      };
    });

    return NextResponse.json({ success: true, campaigns: payload });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[clima/campaigns] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
