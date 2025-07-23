// API ANALYTICS CAMPAÑA - MÉTRICAS RESULTADOS
// src/app/api/campaigns/[id]/analytics/route.ts
// FocalizaHR MVP - Sistema completo métricas resultados

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ INTERFACES ANALYTICS
interface CampaignAnalytics {
  totalInvited: number;               // ✅ AÑADIDO
  totalResponded: number;             // ✅ AÑADIDO
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

    // ✅ VERIFICAR CAMPAÑA (consulta mínima)
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      select: {
        id: true,
        name: true,
        campaignType: { select: { name: true } }
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

    // ✅ CONTEOS OPTIMIZADOS CON _count
    const [totalInvited, totalResponded, totalResponses] = await Promise.all([
      // Total participantes invitados
      prisma.participant.count({
        where: { campaignId }
      }),
      
      // Total participantes que respondieron (únicos)
      prisma.response.findMany({
        where: {
          participant: { campaignId }
        },
        select: { participantId: true },
        distinct: ['participantId']
      }).then(results => results.length),
      
      // Total respuestas para validación
      prisma.response.count({
        where: {
          participant: { campaignId }
        }
      })
    ]);

    // Verificar que hay respuestas para analizar
    if (totalResponses === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No hay respuestas para analizar',
          metrics: null
        },
        { status: 200 }
      );
    }

    const participationRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 0;

    // ✅ SCORE PROMEDIO OPTIMIZADO CON aggregate
    const ratingAggregate = await prisma.response.aggregate({
      where: {
        participant: { campaignId },
        question: {
          responseType: { in: ['rating', 'rating_scale'] }
        },
        rating: { not: null }
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const averageScore = ratingAggregate._avg.rating || 0;

    // ✅ SCORES POR CATEGORÍA OPTIMIZADOS
    const categoryData = await prisma.response.groupBy({
      by: ['question'],
      where: {
        participant: { campaignId },
        question: {
          responseType: { in: ['rating', 'rating_scale'] },
          category: { not: null }
        },
        rating: { not: null }
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Obtener categorías para mapeo
    const questionCategories = await prisma.question.findMany({
      where: {
        id: { in: categoryData.map(item => item.question) }
      },
      select: { id: true, category: true }
    });

    const categoryMap = new Map(questionCategories.map(q => [q.id, q.category]));

    // Agrupar por categoría
    const categoryScores: Record<string, number> = {};
    const categoryStats: Record<string, { sum: number; count: number }> = {};

    for (const item of categoryData) {
      const category = categoryMap.get(item.question);
      if (category && item._avg.rating) {
        if (!categoryStats[category]) {
          categoryStats[category] = { sum: 0, count: 0 };
        }
        categoryStats[category].sum += item._avg.rating * item._count.rating;
        categoryStats[category].count += item._count.rating;
      }
    }

    // Calcular promedios por categoría
    for (const [category, stats] of Object.entries(categoryStats)) {
      categoryScores[category] = stats.count > 0 ? stats.sum / stats.count : 0;
    }

    // ✅ RESPUESTAS POR DÍA OPTIMIZADO
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const responsesByDay: Record<string, number> = {};
    
    // Consulta optimizada para respuestas por día
    for (const day of last7Days) {
      const startDate = new Date(`${day}T00:00:00.000Z`);
      const endDate = new Date(`${day}T23:59:59.999Z`);
      
      const dailyResponses = await prisma.response.findMany({
        where: {
          participant: { campaignId },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { participantId: true },
        distinct: ['participantId']
      });
      
      responsesByDay[day] = dailyResponses.length;
    }

    // ✅ SEGMENTACIÓN POR DEPARTAMENTO OPTIMIZADA
    const departmentStats = await prisma.participant.groupBy({
      by: ['department'],
      where: { campaignId },
      _count: { id: true }
    });

    // Scores por departamento
    const departmentScores = await prisma.response.groupBy({
      by: ['participantId'],
      where: {
        participant: { campaignId },
        question: {
          responseType: { in: ['rating', 'rating_scale'] }
        },
        rating: { not: null }
      },
      _avg: { rating: true }
    });

    // Mapear participantes a departamentos
    const participantDepts = await prisma.participant.findMany({
      where: { campaignId },
      select: { id: true, department: true }
    });

    const participantDeptMap = new Map(
      participantDepts.map(p => [p.id, p.department || 'Sin departamento'])
    );

    const participantBreakdown: Record<string, { count: number; avgScore: number }> = {};

    // Procesar estadísticas por departamento
    for (const deptStat of departmentStats) {
      const department = deptStat.department || 'Sin departamento';
      participantBreakdown[department] = {
        count: deptStat._count.id,
        avgScore: 0
      };
    }

    // Calcular scores promedio por departamento
    const deptScoreStats: Record<string, { sum: number; count: number }> = {};
    
    for (const scoreData of departmentScores) {
      const department = participantDeptMap.get(scoreData.participantId) || 'Sin departamento';
      if (scoreData._avg.rating) {
        if (!deptScoreStats[department]) {
          deptScoreStats[department] = { sum: 0, count: 0 };
        }
        deptScoreStats[department].sum += scoreData._avg.rating;
        deptScoreStats[department].count += 1;
      }
    }

    // Aplicar scores calculados
    for (const [department, stats] of Object.entries(deptScoreStats)) {
      if (participantBreakdown[department]) {
        participantBreakdown[department].avgScore = stats.count > 0 ? stats.sum / stats.count : 0;
      }
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

    // ✅ CONSTRUIR RESPUESTA - AHORA CON totalInvited y totalResponded
    const analytics: CampaignAnalytics = {
      totalInvited,                     // ✅ AÑADIDO
      totalResponded,                   // ✅ AÑADIDO
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
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(
      { 
        success: true,
        metrics: analytics,
        meta: {
          campaignId,
          campaignName: campaign.name,
          campaignType: campaign.campaignType.name,
          totalResponses,
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