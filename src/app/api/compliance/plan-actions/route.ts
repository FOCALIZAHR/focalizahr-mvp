// src/app/api/compliance/plan-actions/route.ts
// Ambiente Sano - CRUD de CompliancePlanAction (plan del ciclo).
//
// GET  ?campaignId=X  — lista las acciones registradas (RBAC compliance:view).
// POST                — registra una nueva acción (RBAC compliance:manage).
// DELETE ?triggerRef  — limpia la acción registrada para ese trigger.
//
// Idempotente: unique compuesto (campaignId, triggerRef) evita duplicados.
// Al persistir, copia evidencia + plazo desde INTERVENTION_CATALOG.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { INTERVENTION_CATALOG } from '@/lib/services/compliance/InterventionEngine';

type TriggerType = 'dimension_low' | 'patron' | 'alert';

interface CreateInput {
  campaignId: string;
  triggerType: TriggerType;
  triggerRef: string;
  triggerLabel: string;
  chosenOption: number; // 0 | 1 | 2
  interventionId: string; // key del catálogo
}

function isTriggerType(value: unknown): value is TriggerType {
  return value === 'dimension_low' || value === 'patron' || value === 'alert';
}

// ═══════════════════════════════════════════════════════════════════
// GET
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    // Validar pertenencia de la campaña al account.
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    const actions = await prisma.compliancePlanAction.findMany({
      where: { campaignId },
      orderBy: { registeredAt: 'asc' },
    });

    return NextResponse.json({ success: true, actions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/plan-actions] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId && !userContext.role) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<CreateInput>;
    if (
      !body.campaignId ||
      !isTriggerType(body.triggerType) ||
      !body.triggerRef ||
      !body.triggerLabel ||
      typeof body.chosenOption !== 'number' ||
      !body.interventionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Campos requeridos: campaignId, triggerType, triggerRef, triggerLabel, chosenOption, interventionId',
        },
        { status: 400 }
      );
    }

    // Validar pertenencia de la campaña.
    const campaign = await prisma.campaign.findFirst({
      where: { id: body.campaignId, accountId: userContext.accountId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // Validar intervención en catálogo.
    const intervention = INTERVENTION_CATALOG[body.interventionId];
    if (!intervention) {
      return NextResponse.json(
        { success: false, error: `interventionId desconocida: ${body.interventionId}` },
        { status: 400 }
      );
    }

    // Upsert por (campaignId, triggerRef) — idempotencia.
    const action = await prisma.compliancePlanAction.upsert({
      where: {
        campaignId_triggerRef: {
          campaignId: body.campaignId,
          triggerRef: body.triggerRef,
        },
      },
      update: {
        chosenOption: body.chosenOption,
        optionLabel: intervention.titulo,
        interventionId: body.interventionId,
        evidencia: intervention.evidencia,
        plazo: intervention.plazo,
        registeredAt: new Date(),
        registeredBy: userContext.userId ?? userContext.accountId!,
      },
      create: {
        campaignId: body.campaignId,
        accountId: userContext.accountId!,
        triggerType: body.triggerType,
        triggerRef: body.triggerRef,
        triggerLabel: body.triggerLabel,
        chosenOption: body.chosenOption,
        optionLabel: intervention.titulo,
        interventionId: body.interventionId,
        evidencia: intervention.evidencia,
        plazo: intervention.plazo,
        registeredBy: userContext.userId ?? userContext.accountId!,
      },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/plan-actions] POST:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const triggerRef = searchParams.get('triggerRef');
    if (!campaignId || !triggerRef) {
      return NextResponse.json(
        { success: false, error: 'campaignId y triggerRef requeridos' },
        { status: 400 }
      );
    }

    // Validar pertenencia.
    const existing = await prisma.compliancePlanAction.findFirst({
      where: {
        campaignId,
        triggerRef,
        accountId: userContext.accountId,
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Acción no encontrada' },
        { status: 404 }
      );
    }

    await prisma.compliancePlanAction.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/plan-actions] DELETE:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
