// ════════════════════════════════════════════════════════════════════════════
// GET/PUT /api/action-plans/[planId] — Detail + autosave parcial
// src/app/api/action-plans/[planId]/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET     — detalle completo (decisiones + narrativas + snap)
// PUT     — autosave body parcial. Estado 'aprobado' es inmutable (403).
//           Si el body trae estado='aprobado' y el plan está en borrador,
//           registra approvedBy + approvedAt al transitar.
//
// RBAC dispatch por moduleType del plan en BD (no del body).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserContext,
  hasPermission,
  type PermissionType,
} from '@/lib/services/AuthorizationService';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

interface RouteContext {
  params: Promise<{ planId: string }> | { planId: string };
}

async function resolveParams(params: RouteContext['params']) {
  return params instanceof Promise ? await params : params;
}

// Mapping de perms por módulo. Cuando exit/onboarding integren ActionPlan,
// agregar acá su tupla de perms (ya existentes en AuthorizationService o nuevas).
const PERMS_BY_MODULE: Record<
  string,
  { view: PermissionType; manage: PermissionType }
> = {
  compliance: { view: 'compliance:view', manage: 'compliance:manage' },
};

// ════════════════════════════════════════════════════════════════════════════
// GET — detalle completo
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { planId } = await resolveParams(ctx.params);
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const plan = await prisma.actionPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
    });
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const perms = PERMS_BY_MODULE[plan.moduleType];
    if (!perms || !hasPermission(userContext.role, perms.view)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: plan });
  } catch (error: unknown) {
    console.error('[action-plans/[planId]] GET error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PUT — autosave body parcial. Aprobado es inmutable.
// ════════════════════════════════════════════════════════════════════════════

interface UpdatePlanBody {
  estado?: 'borrador' | 'aprobado' | 'archivado';
  allowAmendment?: boolean;
  decisiones?: unknown;
  narrativasEdit?: Record<string, string>;
  resumenSnap?: unknown;
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  try {
    const { planId } = await resolveParams(ctx.params);
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const existing = await prisma.actionPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const perms = PERMS_BY_MODULE[existing.moduleType];
    if (!perms || !hasPermission(userContext.role, perms.manage)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // ── Regla: aprobado es inmutable ──
    if (existing.estado === 'aprobado') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Plan aprobado es inmutable. Si allowAmendment=true, crea una enmienda con POST /api/action-plans + parentPlanId.',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdatePlanBody;
    const userEmail =
      request.headers.get('x-user-email') ?? userContext.accountId;

    // ── Construir update parcial ──
    const data: Prisma.ActionPlanUpdateInput = { updatedBy: userEmail };

    if (body.decisiones !== undefined)
      data.decisiones = body.decisiones as Prisma.InputJsonValue;
    if (body.narrativasEdit !== undefined)
      data.narrativasEdit = body.narrativasEdit as Prisma.InputJsonValue;
    if (body.resumenSnap !== undefined)
      data.resumenSnap = body.resumenSnap as Prisma.InputJsonValue;
    if (body.allowAmendment !== undefined)
      data.allowAmendment = body.allowAmendment;

    // ── Transición de estado ──
    if (body.estado !== undefined && body.estado !== existing.estado) {
      data.estado = body.estado;
      if (body.estado === 'aprobado') {
        data.approvedBy = userEmail;
        data.approvedAt = new Date();
      }
    }

    const updated = await prisma.actionPlan.update({
      where: { id: planId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('[action-plans/[planId]] PUT error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
