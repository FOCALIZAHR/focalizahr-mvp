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

const MAX_RESULTS = 20;

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
    const departmentId = searchParams.get('departmentId') || '';

    // isActive:true es el mismo criterio que exige el resolver
    // (DepartmentResponsableService: un responsable inactivo se ignora y sigue el
    // walk-up). Solo se ofrecen candidatos que el resolver aceptaría.
    const where: any = {
      accountId,
      isActive: true,
      status: { not: 'PENDING_ONBOARDING' },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
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
      take: MAX_RESULTS,
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });

  } catch (error) {
    console.error('Error buscando employees de la cuenta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar empleados' },
      { status: 500 }
    );
  }
}
