// src/app/api/admin/structures/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Validar token y rol admin
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);

    if (!validation.success || !validation.account) {
      return NextResponse.json(
        { error: validation.error || 'No autorizado' },
        { status: 401 }
      );
    }

    if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Se requiere rol FOCALIZAHR_ADMIN' },
        { status: 403 }
      );
    }

    // Obtener todas las cuentas con sus estructuras
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        departments: {
          where: { isActive: true }
        }
      },
      orderBy: { companyName: 'asc' }
    });

    // Calcular métricas para cada cuenta
    const structuresOverview = accounts.map(account => {
      const gerenciasCount = account.departments.filter(d => d.level === 2).length;
      const departmentsCount = account.departments.filter(d => d.level === 3).length;
      const orphanDepartmentsCount = account.departments.filter(
        d => d.level === 3 && !d.parentId
      ).length;

      return {
        id: account.id,
        companyName: account.companyName,
        gerenciasCount,
        departmentsCount,
        orphanDepartmentsCount,
        structureComplete: orphanDepartmentsCount === 0 && departmentsCount > 0
      };
    });

    // Calcular métricas globales
    const totalAccounts = structuresOverview.length;
    const completedStructures = structuresOverview.filter(s => s.structureComplete).length;
    const pendingStructures = totalAccounts - completedStructures;
    const totalOrphans = structuresOverview.reduce((sum, s) => sum + s.orphanDepartmentsCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        structures: structuresOverview,
        metrics: {
          totalAccounts,
          completedStructures,
          pendingStructures,
          totalOrphans
        }
      }
    });

  } catch (error) {
    console.error('Error fetching structures overview:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen de estructuras' },
      { status: 500 }
    );
  }
}