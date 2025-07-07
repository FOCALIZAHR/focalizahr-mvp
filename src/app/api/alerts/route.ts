// src/app/api/alerts/route.ts
// 🎯 ARCHIVO COMPLETO CORREGIDO - Todas las funciones auth + schema Prisma
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
}

export async function GET(request: NextRequest) {
  try {
    // ✅ CORRECCIÓN 1: verifyAuth → verifyJWT (función correcta)
    const authResult = await verifyJWT(request);
    
    // ✅ CORRECCIÓN 2: authResult.accountId → authResult.user (estructura correcta)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ✅ CORRECCIÓN 3: authResult.accountId → authResult.user.id
    const accountId = authResult.user.id;

    // ✅ CORRECCIÓN 4-6: Todos los campos Prisma en camelCase
    const campaigns = await prisma.campaign.findMany({
      where: { accountId: accountId },          // account_id → accountId
      include: {
        campaignType: {                         // campaign_type → campaignType
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }           // created_at → createdAt
    });

    // ✅ CORRECCIÓN 7-9: Mapeo con campos camelCase
    const campaignsWithMetrics = campaigns.map(campaign => {
      const now = new Date();
      const endDate = new Date(campaign.endDate);        // end_date → endDate
      const timeDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const isOverdue = campaign.status === 'active' && daysRemaining < 0;
      const participationRate = campaign.totalInvited > 0     // total_invited → totalInvited
        ? (campaign.totalResponded / campaign.totalInvited) * 100  // total_responded → totalResponded
        : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        participationRate,
        daysRemaining: campaign.status === 'active' ? daysRemaining : undefined,
        isOverdue,
        totalInvited: campaign.totalInvited,        // total_invited → totalInvited
        totalResponded: campaign.totalResponded     // total_responded → totalResponded
      };
    });

    // ✅ LÓGICA ALERTAS PRESERVADA 100% (funcionalidad original mantenida)
    const alerts: Alert[] = [];

    campaignsWithMetrics.forEach(campaign => {
      // Campañas próximas a vencer (≤3 días)
      if (campaign.status === 'active' && 
          campaign.daysRemaining !== undefined && 
          campaign.daysRemaining <= 3 && 
          campaign.daysRemaining > 0) {
        alerts.push({
          id: `expiring-${campaign.id}`,
          type: 'warning',
          title: 'Campaña próxima a vencer',
          message: `La campaña "${campaign.name}" vence en ${campaign.daysRemaining} día${campaign.daysRemaining === 1 ? '' : 's'}`,
          timestamp: new Date(),
          campaignId: campaign.id
        });
      }

      // Campañas vencidas
      if (campaign.isOverdue) {
        alerts.push({
          id: `overdue-${campaign.id}`,
          type: 'warning',
          title: 'Campaña vencida',
          message: `La campaña "${campaign.name}" ha superado su fecha límite`,
          timestamp: new Date(),
          campaignId: campaign.id
        });
      }

      // Baja participación (<30%)
      if (campaign.participationRate < 30 && campaign.status === 'active') {
        alerts.push({
          id: `low-participation-${campaign.id}`,
          type: 'warning',
          title: 'Baja participación',
          message: `La campaña "${campaign.name}" tiene solo ${campaign.participationRate.toFixed(1)}% de participación`,
          timestamp: new Date(),
          campaignId: campaign.id
        });
      }

      // Alta participación (≥75%)
      if (campaign.participationRate >= 75 && campaign.status === 'active') {
        alerts.push({
          id: `high-participation-${campaign.id}`,
          type: 'success',
          title: 'Excelente participación',
          message: `La campaña "${campaign.name}" alcanzó ${campaign.participationRate.toFixed(1)}% de participación`,
          timestamp: new Date(),
          campaignId: campaign.id
        });
      }
    });

    // Sin campañas activas
    const activeCampaigns = campaignsWithMetrics.filter(c => c.status === 'active').length;
    if (campaigns.length > 0 && activeCampaigns === 0) {
      alerts.push({
        id: 'no-active-campaigns',
        type: 'info',
        title: 'Sin campañas activas',
        message: 'No tienes campañas activas en este momento',
        timestamp: new Date()
      });
    }

    // ✅ RESPONSE ORIGINAL PRESERVADO
    return NextResponse.json({
      success: true,
      alerts,
      timestamp: new Date(),
      count: alerts.length
    });

  } catch (error) {
    console.error('Error generando alertas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}