// src/app/api/departments/[id]/responsable-candidates/route.ts
// Candidatos elegibles como responsable de un departamento: empleados activos de su
// CADENA JERÁRQUICA (el propio + ancestros + descendientes; hermanos NO).
//
// Reemplaza a GET /api/admin/accounts/[id]/employees (eliminado). URL neutra: la
// consumen las dos superficies, concierge (con targetAccountId) y cliente (cuenta del JWT).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { getResponsableChainDepartmentIds } from '@/lib/services/DepartmentResponsableService';
import type { StandardJobLevel } from '@/types/job-classification';

const MAX_RESULTS = 20;   // lo que se devuelve al selector
const SCAN_LIMIT = 200;   // techo de filas leídas antes de rankear (se reporta en meta)

// Prioridad de liderazgo para el ORDEN de la lista. NO filtra ni bloquea a nadie:
// un profesional_analista sigue siendo elegible, solo aparece más abajo.
const JOB_LEVEL_RANK: Record<StandardJobLevel, number> = {
  gerente_director: 0,
  subgerente_subdirector: 1,
  jefe: 2,
  supervisor_coordinador: 3,
  profesional_analista: 4,
  asistente_otros: 5,
  operativo_auxiliar: 6,
};
const UNRANKED = 99; // standardJobLevel null o desconocido → al final

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const targetAccountId = searchParams.get('targetAccountId')?.trim() || '';

    // Cuenta efectiva: la propia salvo override de concierge (solo FOCALIZAHR_ADMIN).
    let effectiveAccountId = userContext.accountId;

    if (targetAccountId && targetAccountId !== userContext.accountId) {
      if (userContext.role !== 'FOCALIZAHR_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Solo FOCALIZAHR_ADMIN puede consultar otras cuentas' },
          { status: 403 }
        );
      }
      effectiveAccountId = targetAccountId;
    }

    const targetDept = await prisma.department.findFirst({
      where: { id: params.id, accountId: effectiveAccountId },
      select: { id: true },
    });

    if (!targetDept) {
      return NextResponse.json(
        { success: false, error: 'Departamento no encontrado en esta cuenta' },
        { status: 404 }
      );
    }

    const chainIds = await getResponsableChainDepartmentIds({
      departmentId: params.id,
      accountId: effectiveAccountId,
    });

    // isActive:true es el mismo criterio que exige el resolver (un responsable inactivo
    // se ignora y sigue el walk-up). Solo se ofrecen candidatos que el resolver aceptaría.
    const where: any = {
      accountId: effectiveAccountId,
      isActive: true,
      status: { not: 'PENDING_ONBOARDING' },
      departmentId: { in: chainIds },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          position: true,
          standardJobLevel: true,
          department: { select: { id: true, displayName: true } },
        },
        orderBy: { fullName: 'asc' },
        take: SCAN_LIMIT,
      }),
      prisma.employee.count({ where }),
    ]);

    // Orden por liderazgo. Se rankea en JS porque Prisma no soporta orden custom sobre
    // un string; el universo ya viene acotado por la cadena, así que el set es chico.
    const rank = (lvl: string | null) =>
      lvl && lvl in JOB_LEVEL_RANK ? JOB_LEVEL_RANK[lvl as StandardJobLevel] : UNRANKED;

    const employees = candidates
      .sort((a, b) => {
        const diff = rank(a.standardJobLevel) - rank(b.standardJobLevel);
        return diff !== 0 ? diff : a.fullName.localeCompare(b.fullName, 'es');
      })
      .slice(0, MAX_RESULTS);

    // Pista informativa: cuántos empleados activos le reportan directamente a cada
    // candidato. NO ordena, NO preselecciona, NO filtra — solo da contexto a quien elige.
    //
    // Corre DESPUÉS del ranking, sobre los ≤20 que se van a mostrar: el IN queda mínimo y
    // no se cuenta a nadie que el usuario no vaya a ver. Una sola query, sin N+1.
    //
    // groupBy y no `_count: { select: { directReports: true } }` (patrón de
    // admin/employees/route.ts:86-88): Prisma 5 no soporta `where` dentro del _count de
    // relación, así que ese camino contaría inactivos y PENDING_ONBOARDING y no podría
    // scopear por accountId — las tres condiciones que el resto de este módulo respeta.
    const reportCounts = employees.length
      ? await prisma.employee.groupBy({
          by: ['managerId'],
          where: {
            accountId: effectiveAccountId,
            isActive: true,
            status: { not: 'PENDING_ONBOARDING' },
            managerId: { in: employees.map((e) => e.id) },
          },
          _count: { _all: true },
        })
      : [];

    const directReportsBy = new Map(
      reportCounts.map((r) => [r.managerId as string, r._count._all])
    );

    return NextResponse.json({
      success: true,
      data: employees.map((e) => ({
        ...e,
        directReportsCount: directReportsBy.get(e.id) ?? 0,
      })),
      meta: {
        total,                        // candidatos que calzan, sin truncar
        shown: employees.length,      // lo que efectivamente se devuelve
        scanned: candidates.length,   // filas leídas antes de rankear (techo SCAN_LIMIT)
        chainDepartments: chainIds.length,
      },
    });

  } catch (error) {
    console.error('Error buscando candidatos a responsable:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar candidatos' },
      { status: 500 }
    );
  }
}
