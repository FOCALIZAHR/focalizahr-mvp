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
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import { resolveDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';
import { z } from 'zod';

const TEXT_MAX = 200;

// Shape del body. El CONTENIDO de `text` (trim > 0, <= 200) se valida DESPUÉS del
// guard de propiedad (spec §P2, paso 5): a un no-responsable no se le revela nada
// de la validación de texto. Acá solo se exige la forma mínima para poder cargar
// el log (climaActionLogId presente) y que text sea string.
const BodySchema = z.object({
  climaActionLogId: z.string().min(1),
  text: z.string(),
});

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
        { success: false, error: 'No sos el responsable de este departamento' },
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
            'Tu usuario aún no está vinculado a tu ficha de empleado. Avisá a RRHH para completar el vínculo.',
        },
        { status: 403 }
      );
    }
    if (responsable.employeeId !== userContext.employeeId) {
      return NextResponse.json(
        { success: false, error: 'No sos el responsable de este departamento' },
        { status: 403 }
      );
    }

    // 5. Validación de contenido del texto (después del guard de propiedad).
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Escribí lo que hiciste antes de registrar.' },
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
      { success: false, error: 'No se pudo registrar. Intentá de nuevo.' },
      { status: 500 }
    );
  }
}
