// API ANALYTICS CAMPAÑA - MÉTRICAS RESULTADOS
// src/app/api/campaigns/[id]/analytics/route.ts
// FocalizaHR MVP - Sistema completo métricas resultados

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ INTERFACES ANALYTICS
interface CampaignAnalytics {
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  segmentationData: any[];
  trendData: any[];
  lastUpdated: string;
  categoryScores?: Record<string, number>;
  responsesByDay?: Record<string, number>;
  demographicBreakdown?: any[];
  departmentScores?: Record<string, number>;
}

// ✅ GET /api/campaigns/[id]/analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado' 
        },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // Verificar que la campaña existe y pertenece al usuario
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        campaignType: true,
        participants: {
          include: {
            responses: {
              include: {
                question: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campaña no encontrada' 
        },
        { status: 404 }
      );
    }

    // Obtener todas las respuestas de la campaña
    const allResponses = campaign.participants.flatMap(p => p.responses);

    // Verificar que la campaña tiene respuestas
    if (allResponses.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No hay respuestas para analizar',
          metrics: null
        },
        { status: 200 }
      );
    }

    // ✅ CALCULAR MÉTRICAS BÁSICAS
    const totalInvited = campaign.participants.length;
    const totalResponded = new Set(allResponses.map(r => r.participantId)).size;
    const participationRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 0;

    // Calcular score promedio de respuestas rating
    const ratingResponses = allResponses.filter(r => 
      (r.question.responseType === 'rating' || r.question.responseType === 'rating_scale') && r.rating !== null
    );
    const averageScore = ratingResponses.length > 0 
      ? ratingResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingResponses.length
      : 0;

    // ✅ CALCULAR SCORES POR CATEGORÍA
    const categoryScores: Record<string, number> = {};
    const categoriesWithRatings = new Set(
      ratingResponses.map(r => r.question.category).filter(Boolean)
    );

    for (const category of categoriesWithRatings) {
      const categoryResponses = ratingResponses.filter(r => r.question.category === category);
      if (categoryResponses.length > 0) {
        categoryScores[category] = categoryResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / categoryResponses.length;
      }
    }

    // ✅ RESPUESTAS POR DÍA (últimos 7 días)
    const responsesByDay: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    for (const day of last7Days) {
      const dayResponses = allResponses.filter(r => 
        r.createdAt.toISOString().split('T')[0] === day
      );
      responsesByDay[day] = new Set(dayResponses.map(r => r.participantId)).size;
    }

    // ✅ SEGMENTACIÓN BÁSICA (por participante)
    const participantBreakdown: Record<string, { count: number; avgScore: number }> = {};
    const participantMap = new Map<string, any>();

    // Crear mapa de participantes
    for (const participant of campaign.participants) {
      participantMap.set(participant.id, participant);
    }

    // Agrupar por departamento si existe
    for (const response of allResponses) {
      const participant = participantMap.get(response.participantId);
      const department = participant?.department || 'Sin departamento';
      
      if (!participantBreakdown[department]) {
        participantBreakdown[department] = { count: 0, avgScore: 0 };
      }
    }

    // Calcular métricas por departamento
    for (const [department, _] of Object.entries(participantBreakdown)) {
      const departmentParticipants = campaign.participants.filter(p => 
        (p.department || 'Sin departamento') === department
      );
      const departmentResponses = ratingResponses.filter(r => 
        departmentParticipants.some(p => p.id === r.participantId)
      );
      
      participantBreakdown[department] = {
        count: departmentParticipants.length,
        avgScore: departmentResponses.length > 0 
          ? departmentResponses.reduce((sum, r) => sum + (r.rating || 0), 0) / departmentResponses.length
          : 0
      };
    }

    // ✅ DATOS TENDENCIA (mock para MVP)
    const trendData = last7Days.map(day => ({
      date: day,
      responses: responsesByDay[day] || 0,
      cumulativeParticipation: Object.values(responsesByDay)
        .slice(0, last7Days.indexOf(day) + 1)
        .reduce((sum, count) => sum + count, 0)
    }));

    // ✅ DATOS SEGMENTACIÓN
    const segmentationData = Object.entries(participantBreakdown).map(([department, data]) => ({
      segment: department,
      count: data.count,
      avgScore: Math.round(data.avgScore * 10) / 10,
      percentage: Math.round((data.count / totalInvited) * 100)
    }));

    // ✅ TIEMPO ESTIMADO COMPLETITUD (mock)
    const completionTime = 8.5; // minutos promedio estimado

    // ✅ TASA DE RESPUESTA ACTUAL
    const responseRate = participationRate; // En MVP son equivalentes

    // ✅ CONSTRUIR DEPARTMENT_SCORES PARA KIT COMUNICACIÓN
    const departmentScores: Record<string, number> = {};
    if (participantBreakdown) { // Verificación de existencia según Gemini
      for (const [department, data] of Object.entries(participantBreakdown)) {
        // Solo incluir departamentos con datos válidos (no "Sin departamento")
        if (department !== 'Sin departamento' && data.avgScore > 0) {
          departmentScores[department] = Math.round(data.avgScore * 10) / 10;
        }
      }
    }

    // ✅ CONSTRUIR RESPUESTA
    const analytics: CampaignAnalytics = {
      participationRate: Math.round(participationRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      completionTime,
      responseRate: Math.round(responseRate * 10) / 10,
      categoryScores: Object.fromEntries(
        Object.entries(categoryScores).map(([cat, score]) => [cat, Math.round(score * 10) / 10])
      ),
      responsesByDay,
      segmentationData,
      trendData,
      demographicBreakdown: segmentationData,
      lastUpdated: new Date().toISOString(),
      departmentScores: departmentScores
    };

    return NextResponse.json(
      { 
        success: true,
        metrics: analytics,
        meta: {
          campaignId,
          campaignName: campaign.name,
          campaignType: campaign.campaignType.name,
          totalResponses: allResponses.length,
          uniqueParticipants: totalResponded,
          calculatedAt: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error calculating campaign analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// ✅ POST /api/campaigns/[id]/analytics - RECALCULAR FORZADO
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado' 
        },
        { status: 401 }
      );
    }

    const { force = false } = await request.json();

    // Si es forzado, limpiar cache analytics (futuro)
    if (force) {
      console.log(`Forzando recálculo analytics para campaña ${params.id}`);
    }

    // Delegar al GET method para recalcular
    return GET(request, { params });

  } catch (error) {
    console.error('Error forcing analytics recalculation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}