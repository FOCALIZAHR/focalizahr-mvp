// src/app/api/admin/accounts/[id]/structure/apply-general-manager/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);

    if (!validation.success || validation.account?.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accountId = params.id;

    // Verificar si ya existe una gerencia general
    const existingGerencia = await prisma.department.findFirst({
      where: {
        accountId,
        level: 2,
        displayName: 'Gerencia General'
      }
    });

    let gerenciaId: string;

    if (existingGerencia) {
      gerenciaId = existingGerencia.id;
    } else {
      // Crear la Gerencia General
      const gerencia = await prisma.department.create({
        data: {
          accountId,
          displayName: 'Gerencia General',
          standardCategory: 'sin_asignar',
          level: 2,
          unitType: 'gerencia',
          isActive: true
        }
      });
      gerenciaId = gerencia.id;
    }

    // Asignar todos los departamentos huérfanos
    const updated = await prisma.department.updateMany({
      where: {
        accountId,
        level: 3,
        parentId: null
      },
      data: {
        parentId: gerenciaId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Gerencia General creada. ${updated.count} departamentos asignados.`,
      data: {
        gerenciaId,
        departmentsAssigned: updated.count
      }
    });

  } catch (error) {
    console.error('Error applying general manager:', error);
    return NextResponse.json(
      { error: 'Error al crear estructura plana' },
      { status: 500 }
    );
  }
}