// src/app/api/campaigns/[id]/stats/route.ts
// VERSIÓN FINAL v11.0 - Reparación Definitiva del Contrato de Datos

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const campaignId = params.id;
    const accountId = authResult.user.id;

    // CONSULTA CORREGIDA Y OPTIMIZADA
    const campaignData = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: accountId },
      select: {
        id: true, name: true, description: true, status: true,
        startDate: true, endDate: true, createdAt: true,
        account: {
          select: { companyName: true }
        },
        campaignType: {
          select: { name: true } // ✅ FIX: Pide 'name', el campo que sí existe.
        },
        _count: { 
          select: { participants: true } 
        }
      }
    });

    if (!campaignData) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    const respondedCount = await prisma.participant.count({
      where: { campaignId: campaignId, hasResponded: true }
    });
    
    const totalParticipants = campaignData._count.participants;
    const participationRate = totalParticipants > 0 ? (respondedCount / totalParticipants) * 100 : 0;

    // CONSTRUCCIÓN DEL PAQUETE DE DATOS CON LA ESTRUCTURA CORRECTA
    const responseData = {
      success: true,
      campaign: {
        id: campaignData.id,
        name: campaignData.name,
        description: campaignData.description,
        status: campaignData.status,
        company: { name: campaignData.account.companyName }, // Estructura que el frontend espera
        campaignType: { 
            name: campaignData.campaignType.name,
            displayName: campaignData.campaignType.name // Mapeamos 'name' a 'displayName' para el frontend
        },
        createdAt: campaignData.createdAt,
        endDate: campaignData.endDate,
        participants: [], // El frontend espera este array, aunque lo calculemos diferente
      },
      metrics: {
        totalParticipants,
        respondedParticipants: respondedCount,
        participationRate: parseFloat(participationRate.toFixed(1)),
        averageScore: 0, // Se obtendrá de la API de analytics
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Error fetching campaign stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor', code: 'CAMPAIGN_STATS_ERROR' }, { status: 500 });
  }
}