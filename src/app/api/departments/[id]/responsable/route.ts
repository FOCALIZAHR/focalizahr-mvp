// src/app/api/departments/[id]/responsable/route.ts
// ÚNICA vía de escritura de Department.responsableId. La consumen DOS superficies:
//   · concierge  → /dashboard/admin/accounts/[id]/structure  (manda targetAccountId)
//   · cliente    → /dashboard/organizacion/responsables      (cuenta del JWT)
//
// URL neutra a propósito (no /api/admin/**): el mismo backend sirve a las dos pantallas,
// igual que api/department-metrics/upload en Métricas Departamentales.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { setDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasPermission(userContext.role, 'departments:responsable:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { responsableId, targetAccountId } = body;

    // ── Cuenta efectiva ──
    // Por defecto la propia. targetAccountId es el override del concierge, reservado a
    // FOCALIZAHR_ADMIN (patrón department-metrics/upload/route.ts:101-165).
    let effectiveAccountId = userContext.accountId;

    if (targetAccountId && targetAccountId !== userContext.accountId) {
      if (userContext.role !== 'FOCALIZAHR_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Solo FOCALIZAHR_ADMIN puede operar sobre otras cuentas' },
          { status: 403 }
        );
      }

      const targetAccount = await prisma.account.findUnique({
        where: { id: targetAccountId },
        select: { id: true, status: true },
      });

      if (!targetAccount) {
        return NextResponse.json(
          { success: false, error: 'Cuenta objetivo no encontrada' },
          { status: 404 }
        );
      }

      if (targetAccount.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: 'La cuenta objetivo no está activa' },
          { status: 403 }
        );
      }

      effectiveAccountId = targetAccountId;
    }

    // '' se normaliza a null (desasignar) — el <select> vacío manda string vacío.
    const nextResponsableId: string | null = responsableId || null;

    const result = await setDepartmentResponsable({
      departmentId: params.id,
      accountId: effectiveAccountId,
      responsableId: nextResponsableId,
      actor: {
        accountId: userContext.accountId,
        email: request.headers.get('x-user-email'),
        role: userContext.role,
      },
    });

    if (!result.ok) {
      switch (result.reason) {
        case 'DEPARTMENT_NOT_FOUND':
          return NextResponse.json(
            { success: false, error: 'Departamento no encontrado en esta cuenta' },
            { status: 404 }
          );
        case 'EMPLOYEE_NOT_FOUND':
          return NextResponse.json(
            {
              success: false,
              error: 'El responsable indicado no existe, está inactivo o no pertenece a esta cuenta',
            },
            { status: 400 }
          );
        case 'OUT_OF_CHAIN':
          return NextResponse.json(
            {
              success: false,
              error: 'El responsable debe pertenecer al departamento, a una unidad superior o a una que dependa de él',
            },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        departmentId: params.id,
        responsableId: result.responsableId,
        responsableName: result.responsableName,
        changed: result.changed,
      },
      message: result.responsableId
        ? 'Responsable asignado'
        : 'Responsable desasignado',
    });

  } catch (error) {
    console.error('Error actualizando responsable de departamento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el responsable' },
      { status: 500 }
    );
  }
}
