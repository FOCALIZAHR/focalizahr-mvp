// NUEVA: /api/campaigns/[id]/gerencias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const userContext = extractUserContext(request);
    
    // Validación básica
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: userContext.accountId
      }
    });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Obtener gerencias (nivel 2) con sus departamentos hijos
    const gerencias = await prisma.department.findMany({
      where: {
        accountId: userContext.accountId,
        level: 2,
        unitType: 'gerencia'
      },
      include: {
        children: {
          where: {
            level: 3,
            unitType: 'departamento'
          }
        }
      }
    });
    
    // Calcular métricas agregadas para cada gerencia
    const gerenciasWithMetrics = await Promise.all(
      gerencias.map(async (gerencia) => {
        // Obtener IDs de todos los departamentos hijos
        const departmentIds = gerencia.children.map(d => d.id);
        
        // Contar participantes totales en los departamentos hijos
        const participants = await prisma.participant.count({
          where: {
            campaignId,
            departmentId: {
              in: departmentIds
            }
          }
        });
        
        // Contar participantes que han respondido
        const responded = await prisma.participant.count({
          where: {
            campaignId,
            hasResponded: true,
            departmentId: {
              in: departmentIds
            }
          }
        });
        
        // Calcular métricas
        const participationRate = participants > 0 
          ? Math.round((responded / participants) * 100)
          : 0;
        
        // Determinar tendencia básica
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (participationRate > 70) trend = 'up';
        if (participationRate < 40) trend = 'down';
        
        return {
          id: gerencia.id,
          displayName: gerencia.displayName,
          level: gerencia.level,
          unitType: gerencia.unitType,
          participationRate,
          participantCount: participants,
          respondedCount: responded,
          departmentCount: gerencia.children.length,
          departments: gerencia.children.map(d => ({
            id: d.id,
            displayName: d.displayName,
            standardCategory: d.standardCategory
          })),
          trend
        };
      })
    );
    
    // Ordenar por tasa de participación (mayor a menor)
    const sortedGerencias = gerenciasWithMetrics.sort((a, b) => 
      b.participationRate - a.participationRate
    );
    
    return NextResponse.json({
      success: true,
      data: sortedGerencias,
      metadata: {
        totalGerencias: sortedGerencias.length,
        campaignId,
        userRole: userContext.role,
        userGerenciaId: userContext.departmentId
      }
    });
    
  } catch (error) {
    console.error('Error fetching gerencias:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}