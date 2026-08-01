// src/app/api/clima/action-log/route.ts
// EX Clima Gate 5C — Autorreporte del jefe (cierre del circuito).
//
// POST: el responsable de un departamento escribe una entrada de bitácora sobre
// lo que hizo con un hallazgo de clima aprobado. Crea una ClimaActionLogEntry
// (tabla hija) y sincroniza el ESPEJO en la fila padre ClimaActionLog
// (actionText/registeredAt/registeredBy = la entrada más reciente, completa).
// ActionEffectivenessService sigue leyendo actionText — no se toca.
//
// Seguridad (spec §P2): permiso amplio 'clima:action-log:write' abre la puerta;
// la protección real es el GUARD DE PROPIEDAD — solo el responsable resuelto del
// departamento (resolveDepartmentResponsable + comparación de employeeId) puede
// escribir. Nunca se resuelve identidad por email (regla vigente del proyecto).
// Ver .claude/tasks/SPEC_CLIMA_AUTORREPORTE_JEFE_v1.md §P2.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService';
import { resolveDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import type {
  ClimaAtacarCausaDecisionDTO,
  ClimaAtacarCausaEntryDTO,
  ClimaAtacarCausaLogDTO,
} from '@/types/clima-atacar-causa';
import { z } from 'zod';

const TEXT_MAX = 200;
const ENTRIES_PREVIEW = 3; // modo lista: últimas N por log (la vista muestra 3 + "Ver todas")
const ENTRIES_PAGE_DEFAULT = 20; // modo entradas
const ENTRIES_PAGE_MAX = 50;

/**
 * Guard de lectura por departamento (V1). Roles GLOBALES (GLOBAL_ACCESS_ROLES) sin
 * restricción; TODO el resto queda acotado a {propio ∪ descendientes}, fail-closed sin
 * departmentId propio. Invertido a propósito (global-vs-resto, no AREA_MANAGER-específico):
 * si clima:view suma otro rol no-global, queda acotado automáticamente. Devuelve true si
 * el acceso al departamento pedido debe negarse.
 */
async function isDepartmentReadDenied(
  userContext: { role: string | null; departmentId: string | null },
  departmentId: string
): Promise<boolean> {
  if ((GLOBAL_ACCESS_ROLES as readonly string[]).includes(userContext.role ?? '')) {
    return false; // global: ve toda la cuenta
  }
  if (!userContext.departmentId) return true; // fail-closed
  const allowed = new Set([
    userContext.departmentId,
    ...(await getChildDepartmentIds(userContext.departmentId)),
  ]);
  return !allowed.has(departmentId);
}

// Shape del body. El CONTENIDO de `text` (trim > 0, <= 200) se valida DESPUÉS del
// guard de propiedad (spec §P2, paso 5): a un no-responsable no se le revela nada
// de la validación de texto. Acá solo se exige la forma mínima para poder cargar
// el log (climaActionLogId presente) y que text sea string.
const BodySchema = z.object({
  climaActionLogId: z.string().min(1),
  text: z.string(),
});

// ════════════════════════════════════════════════════════════════════════════
// GET — "Atacar la causa" (Tab 2). ÚNICA fuente de datos de la vista: plan aprobado
// (acotado al depto, solo aceptar/modificar) + bitácora, unidos por triggerRef, todo
// resuelto en el servidor. No depende de /api/action-plans (esos entregan la cuenta
// entera; filtrar en el cliente no es filtrar).
//
//   Modo lista:    ?planId=<id>&departmentId=<id>
//   Modo entradas: ?logId=<id>&limit=<n>&offset=<m>  ("Ver todas")
// ════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');
    const planId = searchParams.get('planId');
    const departmentId = searchParams.get('departmentId');

    // ── Modo entradas — paginación de "Ver todas" de un log ──
    if (logId) {
      const log = await prisma.climaActionLog.findFirst({
        where: { id: logId, accountId: userContext.accountId },
        select: { id: true, departmentId: true },
      });
      if (!log) {
        return NextResponse.json({ success: false, error: 'Hallazgo no encontrado' }, { status: 404 });
      }
      if (await isDepartmentReadDenied(userContext, log.departmentId)) {
        return NextResponse.json({ success: false, error: 'Sin acceso a este departamento' }, { status: 403 });
      }
      const limit = Math.min(
        Math.max(parseInt(searchParams.get('limit') || `${ENTRIES_PAGE_DEFAULT}`, 10) || ENTRIES_PAGE_DEFAULT, 1),
        ENTRIES_PAGE_MAX
      );
      const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
      const [rows, entriesCount] = await Promise.all([
        prisma.climaActionLogEntry.findMany({
          where: { climaActionLogId: log.id, accountId: userContext.accountId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          select: { id: true, text: true, createdAt: true },
        }),
        prisma.climaActionLogEntry.count({
          where: { climaActionLogId: log.id, accountId: userContext.accountId },
        }),
      ]);
      const entries: ClimaAtacarCausaEntryDTO[] = rows.map((e) => ({
        id: e.id,
        text: e.text,
        createdAt: e.createdAt.toISOString(),
      }));
      return NextResponse.json({ success: true, data: { entries, entriesCount } });
    }

    // ── Modo lista — plan aprobado (acotado al depto) + bitácora ──
    if (!planId || !departmentId) {
      return NextResponse.json(
        { success: false, error: 'planId y departmentId requeridos' },
        { status: 400 }
      );
    }
    if (await isDepartmentReadDenied(userContext, departmentId)) {
      return NextResponse.json({ success: false, error: 'Sin acceso a este departamento' }, { status: 403 });
    }

    const plan = await prisma.actionPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId, moduleType: 'clima' },
      select: { id: true, estado: true, decisiones: true },
    });
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 });
    }
    // Solo planes aprobados devuelven decisiones (spec §V1).
    if (plan.estado !== 'aprobado') {
      return NextResponse.json({ success: true, data: { decisiones: [], logs: [] } });
    }

    // Decisiones: SOLO de este depto y SOLO aceptadas/modificadas (rechazar/pospuesto fuera).
    const items = (plan.decisiones as ClimaDecisionItem[] | null) ?? [];
    const decisiones: ClimaAtacarCausaDecisionDTO[] = items
      .filter(
        (d) =>
          d.departmentId === departmentId &&
          (d.ceoDecision === 'aceptar' || d.ceoDecision === 'modificar')
      )
      .map((d) => ({
        triggerRef: d.triggerRef,
        narrative: d.intervention.narrative,
        steps: d.intervention.steps,
        ceoNotes: d.ceoNotes ?? null,
        ceoDecision: d.ceoDecision as 'aceptar' | 'modificar',
      }));

    // Logs del depto en este plan (existen solo para decisiones aceptadas).
    const logRows = await prisma.climaActionLog.findMany({
      where: { accountId: userContext.accountId, actionPlanId: plan.id, departmentId },
      select: { id: true, triggerRef: true },
    });

    // canWrite: mismo departamento para todos → se resuelve UNA vez.
    let canWrite = false;
    if (userContext.employeeId) {
      const responsable = await resolveDepartmentResponsable({
        departmentId,
        accountId: userContext.accountId,
      });
      canWrite =
        responsable.source === 'responsable' &&
        responsable.employeeId === userContext.employeeId;
    }

    let logs: ClimaAtacarCausaLogDTO[] = [];
    if (logRows.length > 0) {
      const allEntries = await prisma.climaActionLogEntry.findMany({
        where: {
          accountId: userContext.accountId,
          climaActionLogId: { in: logRows.map((l) => l.id) },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, text: true, createdAt: true, climaActionLogId: true },
      });
      const byLog = new Map<string, ClimaAtacarCausaEntryDTO[]>();
      for (const e of allEntries) {
        const arr = byLog.get(e.climaActionLogId) ?? [];
        arr.push({ id: e.id, text: e.text, createdAt: e.createdAt.toISOString() });
        byLog.set(e.climaActionLogId, arr);
      }
      logs = logRows.map((l) => {
        const grouped = byLog.get(l.id) ?? [];
        return {
          id: l.id,
          triggerRef: l.triggerRef,
          canWrite,
          entriesCount: grouped.length,
          entries: grouped.slice(0, ENTRIES_PREVIEW),
        };
      });
    }

    return NextResponse.json({ success: true, data: { decisiones, logs } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo cargar el plan.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Contexto + autenticación
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // 2. Permiso (abre la puerta; la propiedad es el guard real)
    if (!hasPermission(userContext.role, 'clima:action-log:write')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    // 3. Body + carga del log CON accountId en el where. La fila nace solo al
    //    aprobar un plan: si no existe, la decisión no fue aceptada → 404.
    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }
    const { climaActionLogId, text } = parsed.data;

    const log = await prisma.climaActionLog.findFirst({
      where: { id: climaActionLogId, accountId: userContext.accountId },
      select: { id: true, departmentId: true },
    });
    if (!log) {
      return NextResponse.json({ success: false, error: 'Hallazgo no encontrado' }, { status: 404 });
    }

    // 4. Guard de propiedad — solo el responsable resuelto del departamento escribe.
    const responsable = await resolveDepartmentResponsable({
      departmentId: log.departmentId,
      accountId: userContext.accountId,
    });
    if (responsable.source !== 'responsable') {
      return NextResponse.json(
        { success: false, error: 'No eres el responsable de este departamento' },
        { status: 403 }
      );
    }
    if (!userContext.employeeId) {
      // Vínculo Employee↔User no poblado para este usuario (esperado hasta el
      // backfill con la primera nómina real). Mensaje honesto, no error crudo.
      return NextResponse.json(
        {
          success: false,
          error:
            'Tu usuario aún no está vinculado a tu ficha de empleado. Avisa a RRHH para completar el vínculo.',
        },
        { status: 403 }
      );
    }
    if (responsable.employeeId !== userContext.employeeId) {
      return NextResponse.json(
        { success: false, error: 'No eres el responsable de este departamento' },
        { status: 403 }
      );
    }

    // 5. Validación de contenido del texto (después del guard de propiedad).
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Escribe lo que hiciste antes de registrar.' },
        { status: 400 }
      );
    }
    if (trimmed.length > TEXT_MAX) {
      return NextResponse.json(
        { success: false, error: `El texto supera el máximo de ${TEXT_MAX} caracteres.` },
        { status: 400 }
      );
    }

    // 6. Transacción: crear la entry + sincronizar el espejo del padre (entrada
    //    más reciente, completa) + contar entradas del log.
    const now = new Date();
    const { entry, entriesCount } = await prisma.$transaction(async (tx) => {
      const entry = await tx.climaActionLogEntry.create({
        data: {
          accountId: userContext.accountId,
          climaActionLogId: log.id,
          text: trimmed,
          createdBy: userContext.employeeId,
        },
      });

      await tx.climaActionLog.update({
        where: { id: log.id },
        data: {
          actionText: trimmed,
          registeredAt: now,
          registeredBy: userContext.employeeId,
        },
      });

      const entriesCount = await tx.climaActionLogEntry.count({
        where: { climaActionLogId: log.id, accountId: userContext.accountId },
      });

      return { entry, entriesCount };
    });

    return NextResponse.json({ success: true, data: { entry, entriesCount } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo registrar. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
