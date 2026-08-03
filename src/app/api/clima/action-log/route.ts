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
// la protección real es el GUARD DE LÍNEA JERÁRQUICA — escriben el responsable
// resuelto del departamento Y sus superiores en línea ascendente
// (resolveResponsableChain + pertenencia de employeeId a la cadena). Si el jefe de
// área no registró qué hizo, su gerente tiene que poder hacerlo; sin eso el circuito
// se corta en una sola persona. Ramas HERMANAS quedan fuera: alguien con
// 'clima:view' pero sin relación vertical con el departamento recibe 403.
// Nunca se resuelve identidad por email (regla vigente del proyecto).
// Ver .claude/tasks/SPEC_ATACAR_CAUSA_TAB2_v2.md §1 (Fase A) y §V1 (el GET), y
// .claude/tasks/PLAN_BITACORA_ACCIONES_CLIMA.md §F1 (la ampliación).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService';
import { resolveResponsableChain } from '@/lib/services/DepartmentResponsableService';
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
 * ¿El viewer está en la LÍNEA JERÁRQUICA del departamento pedido? Es decir: ¿es su
 * responsable resuelto (walk-up), o el responsable de algún ancestro por encima?
 *
 * Es la MISMA condición que decide `canWrite` en el POST — fuente única para que leer y
 * escribir no diverjan. false sin `employeeId` (vínculo Employee↔User no poblado → no hay
 * identidad que comparar; nunca se resuelve por email). Resuelve con
 * `resolveResponsableChain`, que NO está cacheado.
 *
 * Ramas HERMANAS quedan fuera por construcción: la cadena es solo ascendente.
 */
async function isViewerInResponsableChain(
  userContext: { accountId: string; employeeId: string | null },
  departmentId: string
): Promise<boolean> {
  if (!userContext.employeeId) return false;
  const { chainEmployeeIds } = await resolveResponsableChain({
    departmentId,
    accountId: userContext.accountId,
  });
  return chainEmployeeIds.has(userContext.employeeId);
}

/**
 * Guard de lectura por departamento (V1). Tres puertas, en orden de costo creciente:
 *   1. Rol GLOBAL (GLOBAL_ACCESS_ROLES): ve toda la cuenta.
 *   2. Subárbol del JWT: {departmentId propio ∪ descendientes} (getChildDepartmentIds, cacheado).
 *   3. Línea jerárquica del depto pedido (resolveResponsableChain): su responsable resuelto
 *      O cualquier superior ascendente. El walk-up puede hacer a alguien responsable de un
 *      depto FUERA de su subárbol JWT — p.ej. el responsable de una gerencia responde por un
 *      hijo sin responsable propio sin tenerlo en su token.
 *      `canWrite ⟹ read`: si puede ESCRIBIR el autorreporte, tiene que poder LEER el plan; sin
 *      esta puerta el jefe que llega por el correo de los 30 días se lleva un 403. Y al
 *      ampliarse la escritura a los superiores, la lectura los acompaña por la misma razón:
 *      registrar sin poder ver lo ya registrado es escribir a ciegas (decisión Victor,
 *      2026-08-03). La ampliación es VERTICAL: ramas hermanas siguen recibiendo 403.
 *
 * La resolución de la cadena (query walk-up, NO cacheada) se paga SOLO si 1 y 2 fallan.
 * Si el caller ya la calculó (el `canWrite` del modo lista), la pasa en `viewerIsResponsable`
 * y no se vuelve a resolver — nunca se resuelve dos veces en un mismo request.
 *
 * Devuelve true si el acceso debe NEGARSE. Fail-closed: quien no cae en ninguna puerta, fuera
 * (incluye al no-global sin departmentId propio que tampoco es responsable).
 */
async function isDepartmentReadDenied(
  userContext: {
    accountId: string;
    role: string | null;
    departmentId: string | null;
    employeeId: string | null;
  },
  departmentId: string,
  viewerIsResponsable?: boolean
): Promise<boolean> {
  // 1. Global: ve toda la cuenta.
  if ((GLOBAL_ACCESS_ROLES as readonly string[]).includes(userContext.role ?? '')) {
    return false;
  }
  // 2. Subárbol del JWT. Sin departmentId propio se SALTA (no corta): un responsable por
  //    walk-up puede no tener departmentId en el token y aún así pasar por la puerta 3.
  if (userContext.departmentId) {
    const allowed = new Set([
      userContext.departmentId,
      ...(await getChildDepartmentIds(userContext.departmentId)),
    ]);
    if (allowed.has(departmentId)) return false;
  }
  // 3. Línea jerárquica (walk-up). Reusa el cálculo de canWrite si vino; si no, resuelve.
  const inChain =
    viewerIsResponsable ?? (await isViewerInResponsableChain(userContext, departmentId));
  return !inChain;
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
    // canWrite (¿el viewer está en la línea jerárquica de este depto?) y la 3ª puerta del
    // guard de lectura comparten la MISMA resolución (mismo departmentId) → se calcula UNA
    // vez y se reusa. En modo lista canWrite siempre se necesita para la respuesta, así que
    // la resolución no es "de más"; la puerta 3 solo la aprovecha. (En modo entradas, sin
    // canWrite, el guard la resuelve lazy: solo si global y subárbol fallan.)
    const canWrite = await isViewerInResponsableChain(userContext, departmentId);
    if (await isDepartmentReadDenied(userContext, departmentId, canWrite)) {
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

    // canWrite ya resuelto arriba (compartido con la 3ª puerta del guard).
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

    // 4. Guard de línea jerárquica — escriben el responsable resuelto del departamento
    //    y sus superiores ascendentes. Ramas hermanas quedan fuera (la cadena es solo
    //    ascendente por construcción en resolveResponsableChain).
    const { resolved, chainEmployeeIds } = await resolveResponsableChain({
      departmentId: log.departmentId,
      accountId: userContext.accountId,
    });
    if (resolved.source !== 'responsable') {
      // Nadie en toda la cadena tiene responsable activo → solo queda el fallback
      // account_admin, que no aporta employeeId. Fail-closed: no escribe nadie.
      return NextResponse.json(
        { success: false, error: 'No eres responsable de este departamento' },
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
    if (!chainEmployeeIds.has(userContext.employeeId)) {
      return NextResponse.json(
        { success: false, error: 'No eres responsable de este departamento' },
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
