// ════════════════════════════════════════════════════════════════════════════
// GET/POST /api/action-plans — Listado y creación de planes genéricos
// src/app/api/action-plans/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET   — lista filtrada por (moduleType, campaignId), ordenada updatedAt desc
// POST  — crea borrador. Si ya existe borrador para (account, moduleType,
//         campaignId) y no es enmienda → 409 Conflict (un solo borrador activo)
//
// Modelo genérico: moduleType discrimina el dominio (compliance/exit/onboarding).
// RBAC se despacha por moduleType: compliance → compliance:view/manage, etc.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserContext,
  hasPermission,
  type PermissionType,
} from '@/lib/services/AuthorizationService';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// ════════════════════════════════════════════════════════════════════════════
// Permisos por módulo
// ════════════════════════════════════════════════════════════════════════════

// Mapping de perms por módulo. Cuando exit/onboarding integren ActionPlan,
// agregar acá su tupla de perms (ya existentes en AuthorizationService o nuevas).
const PERMS_BY_MODULE: Record<
  string,
  { view: PermissionType; manage: PermissionType }
> = {
  compliance: { view: 'compliance:view', manage: 'compliance:manage' },
};

function resolvePerms(moduleType: string | null) {
  if (!moduleType) return null;
  return PERMS_BY_MODULE[moduleType] ?? null;
}

// ════════════════════════════════════════════════════════════════════════════
// GET — list filtrada
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleType = searchParams.get('moduleType');
    const campaignId = searchParams.get('campaignId');
    const estado = searchParams.get('estado');

    if (!moduleType) {
      return NextResponse.json(
        { success: false, error: 'moduleType requerido' },
        { status: 400 }
      );
    }
    const perms = resolvePerms(moduleType);
    if (!perms) {
      return NextResponse.json(
        { success: false, error: `moduleType desconocido: ${moduleType}` },
        { status: 400 }
      );
    }
    if (!hasPermission(userContext.role, perms.view)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const where: Prisma.ActionPlanWhereInput = {
      accountId: userContext.accountId,
      moduleType,
    };
    if (campaignId) where.campaignId = campaignId;
    if (estado) where.estado = estado;

    const planes = await prisma.actionPlan.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: planes });
  } catch (error: unknown) {
    console.error('[action-plans] GET error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST — crear borrador (o enmienda si parentPlanId presente)
// ════════════════════════════════════════════════════════════════════════════

interface CreatePlanBody {
  moduleType: string;
  campaignId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  parentPlanId?: string | null;
  decisiones?: unknown;
  narrativasEdit?: Record<string, string>;
  resumenSnap?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreatePlanBody;
    if (!body.moduleType) {
      return NextResponse.json(
        { success: false, error: 'moduleType requerido' },
        { status: 400 }
      );
    }
    const perms = resolvePerms(body.moduleType);
    if (!perms) {
      return NextResponse.json(
        { success: false, error: `moduleType desconocido: ${body.moduleType}` },
        { status: 400 }
      );
    }
    if (!hasPermission(userContext.role, perms.manage)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const userEmail = request.headers.get('x-user-email') ?? userContext.accountId;

    // ── Caso enmienda — parentPlanId presente ──
    if (body.parentPlanId) {
      const parent = await prisma.actionPlan.findFirst({
        where: { id: body.parentPlanId, accountId: userContext.accountId },
      });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Plan padre no encontrado' },
          { status: 404 }
        );
      }
      if (parent.estado !== 'aprobado') {
        return NextResponse.json(
          {
            success: false,
            error: 'Solo se puede crear enmienda desde un plan aprobado',
          },
          { status: 400 }
        );
      }
      if (!parent.allowAmendment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este plan no permite enmiendas (allowAmendment=false)',
          },
          { status: 403 }
        );
      }
      // Las enmiendas heredan moduleType/campaignId del padre por seguridad.
      const enmienda = await prisma.actionPlan.create({
        data: {
          accountId: userContext.accountId,
          campaignId: parent.campaignId,
          moduleType: parent.moduleType,
          targetType: parent.targetType,
          targetId: parent.targetId,
          createdBy: userEmail,
          parentPlanId: parent.id,
          estado: 'borrador',
          decisiones: (body.decisiones ?? parent.decisiones) as Prisma.InputJsonValue,
          narrativasEdit: (body.narrativasEdit ?? parent.narrativasEdit) as Prisma.InputJsonValue,
          resumenSnap: (body.resumenSnap ?? parent.resumenSnap) as Prisma.InputJsonValue,
        },
      });
      return NextResponse.json({ success: true, data: enmienda });
    }

    // ── Caso borrador nuevo — un solo borrador por (account, moduleType, campaignId) ──
    const existingDraft = await prisma.actionPlan.findFirst({
      where: {
        accountId: userContext.accountId,
        moduleType: body.moduleType,
        campaignId: body.campaignId ?? null,
        estado: 'borrador',
      },
    });
    if (existingDraft) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un borrador activo para este alcance',
          existingPlanId: existingDraft.id,
        },
        { status: 409 }
      );
    }

    const plan = await prisma.actionPlan.create({
      data: {
        accountId: userContext.accountId,
        campaignId: body.campaignId ?? null,
        moduleType: body.moduleType,
        targetType: body.targetType ?? null,
        targetId: body.targetId ?? null,
        createdBy: userEmail,
        estado: 'borrador',
        decisiones: (body.decisiones ?? []) as Prisma.InputJsonValue,
        narrativasEdit: (body.narrativasEdit ?? {}) as Prisma.InputJsonValue,
        resumenSnap: (body.resumenSnap ?? {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error: unknown) {
    console.error('[action-plans] POST error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
