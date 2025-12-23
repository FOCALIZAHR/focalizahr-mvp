/**
 * ============================================
 * API: GET /api/analytics/nps
 * ============================================
 * 
 * Endpoint de consulta de métricas NPS pre-calculadas.
 * 
 * QUERY PARAMS:
 * - product: onboarding | exit | pulso | all (default: all)
 * - period: YYYY-MM | latest (default: latest)
 * - groupBy: gerencia | department | product (default: none)
 * - history: true | false (default: false)
 * 
 * EJEMPLOS:
 * - /api/analytics/nps?product=onboarding&period=2025-12
 * - /api/analytics/nps?groupBy=gerencia&period=2025-12
 * - /api/analytics/nps?product=all&groupBy=product
 * - /api/analytics/nps?history=true&product=onboarding
 * 
 * RESPUESTA:
 * {
 *   data: NPSInsight[],
 *   success: true
 * }
 * 
 * UBICACIÓN: src/app/api/analytics/nps/route.ts
 * 
 * @version 1.0
 * @date Diciembre 2025
 * ============================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';
import { NPSQueryParams } from '@/types/nps';

// ============================================
// GET /api/analytics/nps
// ============================================

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // 1. AUTENTICACIÓN Y CONTEXTO
    // ========================================
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      );
    }
    
    // ========================================
    // 2. PARSEAR QUERY PARAMS
    // ========================================
    const { searchParams } = new URL(request.url);
    
    const params: NPSQueryParams = {
      product: (searchParams.get('product') as NPSQueryParams['product']) || 'all',
      period: searchParams.get('period') || undefined,
      groupBy: (searchParams.get('groupBy') as NPSQueryParams['groupBy']) || undefined,
      history: searchParams.get('history') === 'true'
    };
    
    // ========================================
    // 3. CONSTRUIR WHERE CLAUSE
    // ========================================
    const whereClause: any = {
      accountId: userContext.accountId,
      periodType: 'monthly'
    };
    
    // Filtrar por producto
    if (params.product && params.product !== 'all') {
      whereClause.productType = params.product;
    }
    
    // Filtrar por período específico
    if (params.period && params.period !== 'latest') {
      whereClause.period = params.period;
    }
    
    // Si es "latest", obtener el período más reciente
    if (!params.period || params.period === 'latest') {
      const latestInsight = await prisma.nPSInsight.findFirst({
        where: { accountId: userContext.accountId },
        orderBy: { period: 'desc' },
        select: { period: true }
      });
      
      if (latestInsight) {
        whereClause.period = latestInsight.period;
      }
    }
    
    // ========================================
    // 4. EJECUTAR QUERY
    // ========================================
    const insights = await prisma.nPSInsight.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            displayName: true,
            level: true,
            parentId: true
          }
        }
      },
      orderBy: [
        { period: 'desc' },
        { npsScore: 'desc' }
      ],
      take: params.history ? 100 : 50
    });
    
    // ========================================
    // 5. FORMATEAR SEGÚN GROUPBY
    // ========================================
    let data;
    
    switch (params.groupBy) {
      case 'gerencia':
        // Filtrar solo nivel gerencia (level 2) + global
        data = insights.filter(i => 
          i.department?.level === 2 || i.departmentId === null
        );
        break;
        
      case 'product':
        // Agrupar por producto (solo globales, comparativo)
        data = insights.filter(i => i.departmentId === null);
        break;
        
      case 'department':
        // Todos los departamentos
        data = insights.filter(i => i.departmentId !== null);
        break;
        
      default:
        // Sin filtro adicional
        data = insights;
    }
    
    // ========================================
    // 6. RESPUESTA
    // ========================================
    return NextResponse.json({
      data,
      meta: {
        total: data.length,
        period: whereClause.period || 'all',
        product: params.product,
        groupBy: params.groupBy || 'none'
      },
      success: true
    });
    
  } catch (error: any) {
    console.error('[API /analytics/nps] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener métricas NPS',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}

// ============================================
// EJEMPLOS DE USO
// ============================================
// 
// # Ranking NPS por gerencia (Onboarding, Dic 2025)
// GET /api/analytics/nps?product=onboarding&period=2025-12&groupBy=gerencia
// 
// # Journey NPS del colaborador (comparativo cross-producto)
// GET /api/analytics/nps?groupBy=product&period=2025-12
// 
// # Trend temporal (últimos 12 meses de Onboarding global)
// GET /api/analytics/nps?product=onboarding&history=true
// 
// # NPS global de todos los productos del período actual
// GET /api/analytics/nps?period=latest
// ============================================