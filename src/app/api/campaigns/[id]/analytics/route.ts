// API ANALYTICS CAMPAÑA - FIX IMPORT DEPARTMENTADAPTER
// src/app/api/campaigns/[id]/analytics/route.ts
// FIX CRÍTICO: Agregar import DepartmentAdapter faltante

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter'; // ← FIX: IMPORT AGREGADO

// ✅ INTERFACES ANALYTICS + TREND BY DEPARTMENT
interface CampaignAnalytics {
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  averageScore: number;
  completionTime: number;
  responseRate: number;
  segmentationData: any[];
  trendData: any[];
  trendDataByDepartment?: Record<string, Array<{ date: string; responses: number }>>; // ✅ NUEVO
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

    // ✅ VERIFICAR CAMPAÑA - CONSULTA MÍNIMA + FECHAS
    const campaignMeta = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      select: {
        id: true,
        name: true,
        startDate: true,  // ← AGREGAR PARA CÁLCULO DURACIÓN
        createdAt: true,  // ← FALLBACK SI NO HAY startDate
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

      // ✅ ENRIQUECER ANALYTICS VACÍO TAMBIÉN
      const enrichedEmptyMetrics = await DepartmentAdapter.enrichAnalytics(
        emptyMetrics,
        authResult.user.id
      );

      return NextResponse.json(
        { 
          success: true,
          metrics: enrichedEmptyMetrics,
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

    // ✅ RESPUESTAS POR DÍA - DURACIÓN REAL CAMPAÑA
    // Obtener fechas reales de la campaña
    const campaignStartDate = campaignMeta.startDate ? new Date(campaignMeta.startDate) : new Date(campaignMeta.createdAt);
    const today = new Date();
    const actualDays = Math.ceil((today.getTime() - campaignStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Límite sensato para UI (evitar sobrecargar charts)
    const maxDaysForUI = 30;
    const daysToAnalyze = Math.min(Math.max(actualDays, 7), maxDaysForUI); // Mínimo 7, máximo 30
    
    const analysisRange = Array.from({ length: daysToAnalyze }, (_, i) => {
      const date = new Date(campaignStartDate);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const responsesByDay: Record<string, number> = {};
    
    for (const day of analysisRange) {
      const startDate = new Date(`${day}T00:00:00.000Z`);
      const endDate = new Date(`${day}T23:59:59.999Z`);
      
      // ✅ CONSULTA CORREGIDA - Usar participant.responseDate
      const dailyResponses = await prisma.participant.findMany({
        where: {
          campaignId,
          hasResponded: true,
          responseDate: {  // ← AHORA USA responseDate CORRECTAMENTE
            gte: startDate,
            lte: endDate
          }
        },
        select: { id: true }
      });
      
      responsesByDay[day] = dailyResponses.length;
    }

    // ✅ NUEVA CONSULTA - TREND DATA BY DEPARTMENT (ARQUITECTURA CORRECTA)
    const responsesByDayByDept: Record<string, Record<string, number>> = {};
    
    for (const day of analysisRange) {
      const startDate = new Date(`${day}T00:00:00.000Z`);
      const endDate = new Date(`${day}T23:59:59.999Z`);
      
      // Obtener respuestas del día con departamento
      const dailyResponsesWithDept = await prisma.participant.findMany({
        where: {
          campaignId,
          hasResponded: true,
          responseDate: {  // ← AHORA USA responseDate CORRECTAMENTE
            gte: startDate,
            lte: endDate
          }
        },
        select: { 
          id: true,
          department: true
        }
      });

      // Agrupar por departamento (nombres técnicos crudos)
      const deptCounts: Record<string, number> = {};
      dailyResponsesWithDept.forEach(participant => {
        const department = participant.department || 'Sin departamento';
        deptCounts[department] = (deptCounts[department] || 0) + 1;
      });

      responsesByDayByDept[day] = deptCounts;
    }

    console.log('📊 Campaign temporal analysis:', {
      campaignStartDate: campaignStartDate.toISOString().split('T')[0],
      actualDays,
      daysToAnalyze,
      totalResponsesInRange: Object.values(responsesByDay).reduce((sum, count) => sum + count, 0),
      totalInvited,
      totalResponded,
      departmentsFound: Object.keys(responsesByDayByDept).length > 0 
        ? Object.keys(responsesByDayByDept[Object.keys(responsesByDayByDept)[0]] || {}) 
        : []
    });

    // ✅ PROCESAR TREND DATA BY DEPARTMENT (NOMBRES TÉCNICOS CRUDOS)
    const trendDataByDepartment: Record<string, Array<{ date: string; responses: number }>> = {};
    
    // Obtener todos los departamentos únicos (nombres técnicos sin procesar)
    const allDepartments = new Set<string>();
    Object.values(responsesByDayByDept).forEach(dayData => {
      Object.keys(dayData).forEach(dept => allDepartments.add(dept));
    });

    // Construir series temporal por departamento (con nombres técnicos crudos)
    allDepartments.forEach(department => {
      trendDataByDepartment[department] = analysisRange.map(day => ({
        date: day,
        responses: responsesByDayByDept[day]?.[department] || 0
      }));
    });

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

    // ✅ DATOS TENDENCIA - FIX APLICADO + RANGO DINÁMICO
    const trendData = analysisRange.map((day, index) => {
      // 🚨 FIX: Sumar todas las respuestas desde el primer día hasta el día actual (inclusive)
      const cumulativeParticipation = analysisRange
        .slice(0, index + 1)                    // Tomar días desde inicio hasta día actual
        .reduce((sum, currentDay) => {
          return sum + (responsesByDay[currentDay] || 0);
        }, 0);

      return {
        date: day,
        responses: responsesByDay[day] || 0,
        cumulativeParticipation                 // ✅ CÁLCULO CORRECTO
      };
    });

    // ✅ DATOS SEGMENTACIÓN
    const segmentationData = Object.entries(participantBreakdown).map(([department, data]) => ({
      segment: department,
      count: data.count,
      avgScore: Math.round(data.avgScore * 10) / 10,
      percentage: Math.round((data.count / totalInvited) * 100)
    }));

    // ✅ CONSTRUIR RESPUESTA - CON DEPARTMENT SCORES CENTRALIZADOS + TREND BY DEPT
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
      trendDataByDepartment, // ✅ NUEVA TUBERÍA DE DATOS POR DEPARTAMENTO
      demographicBreakdown: segmentationData,
      lastUpdated: new Date().toISOString()
    };

    console.log('📊 Raw analytics before enrichment:', {
      departmentScores: Object.keys(analytics.departmentScores || {}).length,
      totalInvited: analytics.totalInvited,
      accountId: authResult.user.id
    });

    // ✅ ENRIQUECER ANALYTICS CON DEPARTMENT NOMENCLATURA CLIENTE
    const enrichedAnalytics = await DepartmentAdapter.enrichAnalytics(
      analytics,
      authResult.user.id
    );

    console.log('✅ Analytics enriched successfully:', {
      originalDepartments: Object.keys(analytics.departmentScores || {}).length,
      enrichedDepartments: Object.keys(enrichedAnalytics.departmentScoresDisplay || {}).length,
      departmentMapping: Object.keys(enrichedAnalytics.departmentMapping || {}).length
    });

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