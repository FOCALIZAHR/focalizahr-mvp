// src/app/api/admin/employees/pending-review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

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

    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        pendingReview: true
      },
      include: {
        department: {
          select: { displayName: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo pending review:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
