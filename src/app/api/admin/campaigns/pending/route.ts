import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/campaigns/pending
// Lista campañas pendientes - MODO CONCIERGE (todas las empresas)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const withoutParticipants = searchParams.get('withoutParticipants') === 'true';

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (withoutParticipants) {
      where.totalInvited = { lte: 0 };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        account: { 
          select: { 
            companyName: true, 
            adminEmail: true 
          } 
        },
        campaignType: { 
          select: { 
            name: true, 
            slug: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      campaignType: {
        name: campaign.campaignType.name,
        slug: campaign.campaignType.slug
      },
      company: {
        name: campaign.account.companyName,
        admin_email: campaign.account.adminEmail
      },
      totalInvited: campaign.totalInvited,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      created_at: campaign.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length
    });

  } catch (error) {
    console.error('Error fetching campaigns for admin:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo campañas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}