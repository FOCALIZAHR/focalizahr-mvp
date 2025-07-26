// API ANALYTICS CAMPAÑA - RECONSTRUCCIÓN ARQUITECTÓNICA DEFINITIVA
// src/app/api/campaigns/[id]/analytics/route.ts
// FocalizaHR MVP - Completitud + Performance según directriz

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// ✅ INTERFACES ANALYTICS
interface CampaignAnalytics {
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  segmentationData: any[];
  trendData: any[];
  lastUpdated: string;
  categoryScores?: Record<string, number>;
  departmentScores?: Record<string, number>; // ✅ AGREGADO AL INTERFACE
  responsesByDay?: Record<string, number>;
  demographicBreakdown?: any[];
}

// ✅ GET /api/campaigns/[id]/analytics - RECONSTRUCCIÓN COMPLETA
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

    // ✅ VERIFICAR CAMPAÑA - CONSULTA MÍNIMA
    const campaignMeta = await prisma.campaign.findFirst({
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

    if (!campaignMeta) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campaña no encontrada' 
        },
        { status: 404 }
      );
    }

    // ✅ PASO 1: COMPLETITUD DE DATOS - SEGÚN DIRECTRIZ
    const totalInvited = await prisma.participant.count({ 
      where: { campaignId } 
    });
    
    const totalResponded = await prisma.participant.count({ 
      where: { campaignId, hasResponded: true } 
    });

    const participationRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 0;

    // Verificar que hay respuestas para continuar
    if (totalResponded === 0) {
      const emptyMetrics: CampaignAnalytics = {
        totalInvited,
        totalResponded: 0,
        participationRate: 0,
        averageScore: 0,
        categoryScores: {},
        responsesByDay: {},
        segmentationData: [],
        trendData: [],
        completionTime: 0,
        responseRate: 0,
        demographicBreakdown: [],
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(
        { 
          success: true,
          metrics: emptyMetrics,
          meta: {
            campaignId,
            campaignName: campaignMeta.name,
            campaignType: campaignMeta.campaignType.name,
            totalResponses: 0,
            uniqueParticipants: 0,
            calculatedAt: new Date().toISOString()
          }
        },
        { status: 200 }
      );
    }

    // ✅ PASO 2: PERFORMANCE - ERRADICAR CONSULTA VORAZ

    // Score promedio - DB AGGREGATION
    const ratingAggregate = await prisma.response.aggregate({
      where: { 
        participant: { campaignId }, 
        rating: { not: null } 
      },
      _avg: { rating: true }
    });
    const averageScore = ratingAggregate._avg.rating || 0;

    // Scores por categoría - DB GROUPBY
    const categoryData = await prisma.response.groupBy({
      by: ['questionId'],
      where: { 
        participant: { campaignId }, 
        rating: { not: null } 
      },
      _avg: { rating: true },
      _count: { _all: true }
    });

    // Mapear questionId a category - CONSULTA EFICIENTE
    const questionIds = categoryData.map(item => item.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, category: true }
    });

    const questionCategoryMap = new Map(questions.map(q => [q.id, q.category]));

    // Calcular scores por categoría
    const categoryScores: Record<string, number> = {};
    const categoryTotals: Record<string, { sum: number; count: number }> = {};

    categoryData.forEach(item => {
      const category = questionCategoryMap.get(item.questionId);
      if (category && item._avg.rating) {
        if (!categoryTotals[category]) {
          categoryTotals[category] = { sum: 0, count: 0 };
        }
        categoryTotals[category].sum += item._avg.rating * item._count._all;
        categoryTotals[category].count += item._count._all;
      }
    });

    Object.keys(categoryTotals).forEach(category => {
      const totals = categoryTotals[category];
      categoryScores[category] = totals.count > 0 ? totals.sum / totals.count : 0;
    });

    // ✅ RESPUESTAS POR DÍA - DB QUERIES EFICIENTES
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const responsesByDay: Record<string, number> = {};
    
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

    // ✅ SEGMENTACIÓN - DB GROUPBY DEPARTAMENTOS CENTRALIZADO
    const departmentStats = await prisma.participant.groupBy({
      by: ['department'],
      where: { campaignId },
      _count: { id: true }
    });

    // ✅ DEPARTMENT SCORES - CÁLCULO CENTRALIZADO Y EFICIENTE (CORREGIDO)
    const departmentScores: Record<string, number> = {};
    
    // Obtener scores promedio por participante - CORREGIDO: usar participantId
    const participantAvgScores = await prisma.response.groupBy({
      by: ['participantId'],
      where: {
        participant: { campaignId },
        rating: { not: null }
      },
      _avg: { rating: true }
    });

    // Mapear participantId a department
    const participantDepartments = await prisma.participant.findMany({
      where: { campaignId },
      select: { id: true, department: true }
    });

    const participantDeptMap = new Map(
      participantDepartments.map(p => [p.id, p.department || 'Sin departamento'])
    );

    // Calcular scores promedio por departamento
    const deptScoreAccumulator: Record<string, { sum: number; count: number }> = {};
    
    participantAvgScores.forEach(item => {
      const department = participantDeptMap.get(item.participantId);
      const avgScore = item._avg.rating;
      
      if (department && avgScore !== null) {
        if (!deptScoreAccumulator[department]) {
          deptScoreAccumulator[department] = { sum: 0, count: 0 };
        }
        deptScoreAccumulator[department].sum += avgScore;
        deptScoreAccumulator[department].count += 1;
      }
    });

    // Calcular promedios finales por departamento
    Object.entries(deptScoreAccumulator).forEach(([dept, stats]) => {
      if (stats.count > 0) {
        departmentScores[dept] = Math.round((stats.sum / stats.count) * 10) / 10;
      }
    });

    // ✅ SEGMENTACIÓN DATA SIMPLIFICADA
    const participantBreakdown: Record<string, { count: number; avgScore: number }> = {};

    // Estadísticas por departamento usando los scores ya calculados
    for (const deptStat of departmentStats) {
      const department = deptStat.department || 'Sin departamento';
      participantBreakdown[department] = {
        count: deptStat._count.id,
        avgScore: departmentScores[department] || 0
      };
    }

    // ✅ DATOS TENDENCIA
    const trendData = last7Days.map((day, index) => ({
      date: day,
      responses: responsesByDay[day] || 0,
      cumulativeParticipation: Object.values(responsesByDay)
        .slice(0, index + 1)
        .reduce((sum, count) => sum + count, 0)
    }));

    // ✅ DATOS SEGMENTACIÓN
    const segmentationData = Object.entries(participantBreakdown).map(([department, data]) => ({
      segment: department,
      count: data.count,
      avgScore: Math.round(data.avgScore * 10) / 10,
      percentage: Math.round((data.count / totalInvited) * 100)
    }));

    // ✅ CONSTRUIR RESPUESTA - CON DEPARTMENT SCORES CENTRALIZADOS
    const analytics: CampaignAnalytics = {
      totalInvited,                                    // ✅ PASO 1 COMPLETADO
      totalResponded,                                  // ✅ PASO 1 COMPLETADO
      participationRate: Math.round(participationRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      completionTime: 8.5,
      responseRate: Math.round(participationRate * 10) / 10,
      categoryScores: Object.fromEntries(
        Object.entries(categoryScores).map(([cat, score]) => [cat, Math.round(score * 10) / 10])
      ),
      departmentScores, // ✅ DEPARTMENT SCORES CENTRALIZADOS AGREGADOS
      responsesByDay,
      segmentationData,
      trendData,
      demographicBreakdown: segmentationData,
      lastUpdated: new Date().toISOString()
    };

    // ✅ ENRIQUECER ANALYTICS CON DEPARTMENT NOMENCLATURA CLIENTE
    const enrichedAnalytics = await DepartmentAdapter.enrichAnalytics(
      analytics,
      authResult.user.id
    );

    return NextResponse.json(
      { 
        success: true,
        metrics: enrichedAnalytics,                    // ✅ ANALYTICS ENRICHED
        meta: {
          campaignId,
          campaignName: campaignMeta.name,
          campaignType: campaignMeta.campaignType.name,
          totalResponses: categoryData.reduce((sum, item) => sum + item._count._all, 0),
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

    if (force) {
      console.log(`Forzando recálculo analytics para campaña ${params.id}`);
    }

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