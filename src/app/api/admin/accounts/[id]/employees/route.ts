// src/app/api/admin/accounts/[id]/employees/route.ts
// Búsqueda de Employees de UNA cuenta cliente, para el concierge FocalizaHR.
//
// ¿Por qué no se reusa GET /api/admin/employees? Ese endpoint filtra por
// userContext.accountId (header x-account-id), que el middleware puebla con la cuenta
// del ADMIN logueado — no con la cuenta cliente que el concierge está editando
// (params.id). Además, con token legacy de Account el middleware no inyecta
// x-user-role, así que hasPermission(null, 'employees:read') devuelve false.
// Ver .claude/plans/ (Gate 0 responsableId, punto 6).
//
// Auth: MISMO patrón que las rutas hermanas de accounts/[id]/structure —
// validateAuthToken + Account.role === 'FOCALIZAHR_ADMIN'.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';
import { getResponsableChainDepartmentIds } from '@/lib/services/DepartmentResponsableService';
import type { StandardJobLevel } from '@/types/job-classification';

const MAX_RESULTS = 20;   // lo que se devuelve al selector
const SCAN_LIMIT = 200;   // techo de filas leídas antes de rankear (se reporta en meta)

// Prioridad de liderazgo para el ORDEN de la lista. NO filtra ni bloquea a nadie:
// un profesional_analista sigue siendo elegible, solo aparece más abajo.
// Los slugs son los del type canónico StandardJobLevel (src/types/job-classification.ts).
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
    // SEGURIDAD: Validar token y rol admin
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);

    if (!validation.success || !validation.account) {
      return NextResponse.json(
        { success: false, error: validation.error || 'No autorizado' },
        { status: 401 }
      );
    }

    if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado - Se requiere rol FOCALIZAHR_ADMIN' },
        { status: 403 }
      );
    }

    const accountId = params.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const forDepartmentId = searchParams.get('forDepartmentId')?.trim() || '';

    // OBLIGATORIO y fail-closed: sin el departamento que se está editando no hay
    // cadena jerárquica que aplicar, y devolver la nómina completa sería justamente
    // lo que este filtro viene a impedir.
    if (!forDepartmentId) {
      return NextResponse.json(
        { success: false, error: 'forDepartmentId es requerido' },
        { status: 400 }
      );
    }

    const targetDept = await prisma.department.findFirst({
      where: { id: forDepartmentId, accountId },
      select: { id: true },
    });

    if (!targetDept) {
      return NextResponse.json(
        { success: false, error: 'Departamento no encontrado en esta cuenta' },
        { status: 404 }
      );
    }

    // Cadena jerárquica: propio + ancestros + descendientes. Hermanos NO.
    const chainIds = await getResponsableChainDepartmentIds({
      departmentId: forDepartmentId,
      accountId,
    });

    // isActive:true es el mismo criterio que exige el resolver
    // (DepartmentResponsableService: un responsable inactivo se ignora y sigue el
    // walk-up). Solo se ofrecen candidatos que el resolver aceptaría.
    const where: any = {
      accountId,
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
          department: {
            select: { id: true, displayName: true },
          },
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

    return NextResponse.json({
      success: true,
      data: employees,
      meta: {
        total,                        // candidatos que calzan, sin truncar
        shown: employees.length,      // lo que efectivamente se devuelve
        scanned: candidates.length,   // filas leídas antes de rankear (techo SCAN_LIMIT)
        chainDepartments: chainIds.length,
      },
    });

  } catch (error) {
    console.error('Error buscando employees de la cuenta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar empleados' },
      { status: 500 }
    );
  }
}
