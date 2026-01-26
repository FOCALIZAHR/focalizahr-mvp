// src/app/api/admin/employees/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // Parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    const pendingReview = searchParams.get('pendingReview') === 'true';
    const skip = (page - 1) * limit;

    // Construir filtro base
    const where: any = {
      accountId: userContext.accountId
    };

    // Filtro jerárquico para AREA_MANAGER
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const allowedDepts = [userContext.departmentId, ...childIds];
      where.departmentId = { in: allowedDepts };
    }

    // Filtros opcionales
    if (status) {
      where.status = status;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (pendingReview) {
      where.pendingReview = true;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ];
    }

    console.log('[API GET employees] Query where:', JSON.stringify(where, null, 2))

    // Query con paginación
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: { id: true, displayName: true, standardCategory: true }
          },
          manager: {
            select: { id: true, fullName: true, position: true }
          },
          _count: {
            select: { directReports: true }
          }
        },
        orderBy: { fullName: 'asc' },
        take: limit,
        skip
      }),
      prisma.employee.count({ where })
    ]);

    console.log('[API GET employees] Found:', total, 'employees for accountId:', userContext.accountId)

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      meta: {
        filtered: userContext.role === 'AREA_MANAGER'
      }
    });

  } catch (error: any) {
    console.error('[API] Error listando employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
