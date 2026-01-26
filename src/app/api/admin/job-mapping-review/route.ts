// ════════════════════════════════════════════════════════════════════════════
// JOB MAPPING REVIEW API - Revisión de Mapeo de Cargos
// src/app/api/admin/job-mapping-review/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET: Obtener posiciones sin mapear (standardJobLevel = null)
// POST: Asignar nivel manualmente + guardar en histórico
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PositionAdapter } from '@/lib/services/PositionAdapter';
import { extractUserContext } from '@/lib/services/AuthorizationService';

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface UnmappedPosition {
  position: string;
  participantCount: number;
  accountId: string;
  companyName: string;
  suggestedLevel: string | null;
  suggestedAcotado: string | null;
}

// ════════════════════════════════════════════════════════════════════════════
// GET: Obtener posiciones sin mapear
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    // Verificar permisos (FOCALIZAHR_ADMIN o HR_ADMIN)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const isFocalizahrAdmin = userContext.role === 'FOCALIZAHR_ADMIN';

    // Construir filtro según rol
    const whereClause: any = {
      position: { not: null },
      standardJobLevel: null
    };

    // Si no es admin de FocalizaHR, solo ver su cuenta
    if (!isFocalizahrAdmin) {
      whereClause.campaign = { accountId: userContext.accountId };
    }

    // Agrupar por position y campaignId para obtener count
    const unmappedRaw = await prisma.participant.groupBy({
      by: ['position', 'campaignId'],
      where: whereClause,
      _count: { id: true }
    });

    if (unmappedRaw.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalUnmapped: 0,
          totalParticipants: 0,
          accountsAffected: 0
        }
      });
    }

    // Obtener campañas para enriquecer con datos de empresa
    const campaignIds = [...new Set(unmappedRaw.map(r => r.campaignId))];
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: {
        id: true,
        accountId: true,
        account: {
          select: { companyName: true }
        }
      }
    });

    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // Enriquecer con datos de empresa y sugerencia del algoritmo
    const enriched: UnmappedPosition[] = unmappedRaw.map(item => {
      const campaign = campaignMap.get(item.campaignId);
      const suggestedLevel = PositionAdapter.getJobLevel(item.position || '');
      const suggestedAcotado = suggestedLevel
        ? PositionAdapter.getAcotadoGroup(suggestedLevel)
        : null;

      return {
        position: item.position || '',
        participantCount: item._count.id,
        accountId: campaign?.accountId || '',
        companyName: campaign?.account?.companyName || 'N/A',
        suggestedLevel,
        suggestedAcotado
      };
    });

    // Consolidar por position + accountId (mismo cargo en distintas campañas de misma cuenta)
    const consolidated = enriched.reduce((acc, item) => {
      const key = `${item.accountId}-${item.position.toLowerCase()}`;
      if (!acc[key]) {
        acc[key] = item;
      } else {
        acc[key].participantCount += item.participantCount;
      }
      return acc;
    }, {} as Record<string, UnmappedPosition>);

    const data = Object.values(consolidated).sort((a, b) =>
      b.participantCount - a.participantCount
    );

    // Summary stats
    const totalParticipants = data.reduce((sum, d) => sum + d.participantCount, 0);
    const accountsAffected = new Set(data.map(d => d.accountId)).size;

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalUnmapped: data.length,
        totalParticipants,
        accountsAffected
      }
    });

  } catch (error: any) {
    console.error('[JobMappingReview] Error GET:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST: Asignar nivel manualmente
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    // Verificar permisos
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { position, accountId, standardJobLevel } = body;

    if (!position || !accountId || !standardJobLevel) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: position, accountId, standardJobLevel' },
        { status: 400 }
      );
    }

    // Validar que el nivel existe
    const levelConfig = PositionAdapter.JOB_LEVEL_CONFIG[standardJobLevel];
    if (!levelConfig) {
      return NextResponse.json(
        { success: false, error: `Nivel inválido: ${standardJobLevel}` },
        { status: 400 }
      );
    }

    const acotadoGroup = PositionAdapter.getAcotadoGroup(standardJobLevel);
    const userEmail = request.headers.get('x-user-email') || 'admin@focalizahr.com';

    // 1. Guardar en histórico (feedback loop)
    await PositionAdapter.saveToHistory(
      accountId,
      position,
      standardJobLevel,
      userEmail
    );

    // 2. Actualizar todos los participants con ese cargo en esa cuenta
    const updated = await prisma.participant.updateMany({
      where: {
        position: { equals: position, mode: 'insensitive' },
        campaign: { accountId }
      },
      data: {
        standardJobLevel,
        acotadoGroup,
        jobLevelMethod: 'manual',
        jobLevelMappedAt: new Date()
      }
    });

    // 3. Audit log
    try {
      await prisma.auditLog.create({
        data: {
          accountId,
          action: 'job_level_manual_assignment',
          entityType: 'participant',
          newValues: {
            position,
            standardJobLevel,
            acotadoGroup,
            participantsUpdated: updated.count
          },
          userInfo: { email: userEmail }
        }
      });
    } catch (auditError) {
      console.warn('[JobMappingReview] Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      updated: updated.count,
      mapping: {
        position,
        standardJobLevel,
        acotadoGroup,
        levelLabel: PositionAdapter.getLevelLabel(standardJobLevel),
        acotadoLabel: PositionAdapter.getAcotadoLabel(acotadoGroup || '')
      },
      message: `${updated.count} participantes actualizados`
    });

  } catch (error: any) {
    console.error('[JobMappingReview] Error POST:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
