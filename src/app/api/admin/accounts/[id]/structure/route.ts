// src/app/api/admin/accounts/[Id]/structure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// GET: Obtener toda la estructura organizacional
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SEGURIDAD: Validar token y rol admin - PATRÓN ESTÁNDAR DEL PROYECTO
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

    const accountId = params.id;

    // Obtener toda la estructura: gerencias y departamentos
    const structure = await prisma.department.findMany({
      where: {
        accountId: accountId,
        isActive: true
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayName: 'asc' }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { displayName: 'asc' }
      ]
    });

    // ✅ OBTENER INFORMACIÓN DE LA CUENTA - CORRECCIÓN DEL BUG
    const accountInfo = await prisma.account.findUnique({
      where: { id: accountId },
      select: { companyName: true }
    });

    // Organizar en estructura jerárquica
    const gerencias = structure.filter(d => d.level === 2); // Sin filtro de parentId
    const organized = gerencias.map(gerencia => ({
      ...gerencia,
      participantCount: gerencia._count.participants,
      departments: structure
        .filter(d => d.parentId === gerencia.id)
        .map(dept => ({
          ...dept,
          participantCount: dept._count.participants
        }))
    }));

    // Agregar departamentos huérfanos (sin gerencia)
    const orphanDepartments = structure
      .filter(d => d.level === 3 && !d.parentId)
      .map(dept => ({
        ...dept,
        participantCount: dept._count.participants
      }));

    return NextResponse.json({
      success: true,
      data: {
        gerencias: organized,
        orphanDepartments,
        totalGerencias: gerencias.length,
        totalDepartments: structure.filter(d => d.level === 3).length,
        account: {
          id: accountId,
          name: accountInfo?.companyName || 'Cliente'  // ✅ AHORA USA accountInfo CORRECTAMENTE
        }
      }
    });

  } catch (error) {
    console.error('Error fetching structure:', error);
    return NextResponse.json(
      { error: 'Error al obtener estructura organizacional' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva gerencia o departamento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SEGURIDAD: Validar token y rol admin - PATRÓN ESTÁNDAR DEL PROYECTO
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

    const accountId = params.id;
    const body = await request.json();
    const { displayName, parentId, unitType } = body;

    // Validación de datos
    if (!displayName || !unitType) {
      return NextResponse.json(
        { error: 'Nombre y tipo de unidad son requeridos' },
        { status: 400 }
      );
    }

    // Determinar nivel basado en tipo
    const level = unitType === 'gerencia' ? 2 : 3;

    // Validar que gerencias no tengan padre
    if (level === 2 && parentId) {
      return NextResponse.json(
        { error: 'Las gerencias no pueden tener unidad padre' },
        { status: 400 }
      );
    }

    // Validar que departamentos sí tengan padre (gerencia)
    if (level === 3 && !parentId) {
      return NextResponse.json(
        { error: 'Los departamentos deben pertenecer a una gerencia' },
        { status: 400 }
      );
    }

    // Verificar unicidad del nombre en el mismo nivel
    const existingUnit = await prisma.department.findFirst({
      where: {
        accountId,
        displayName: {
          equals: displayName,
          mode: 'insensitive'
        },
        level,
        parentId: parentId || null,
        isActive: true
      }
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: `Ya existe una ${unitType} con ese nombre en este nivel` },
        { status: 400 }
      );
    }

    // Obtener categorización automática usando DepartmentAdapter
    const standardCategory = DepartmentAdapter.getGerenciaCategory(displayName) || 'sin_asignar';

    // Crear la nueva unidad organizacional
    const newUnit = await prisma.department.create({
      data: {
        accountId,
        displayName,
        parentId: parentId || null,
        unitType,
        level,
        standardCategory,
        isActive: true,
        employeeCount: 0
      },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            participants: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newUnit,
        departmentCount: newUnit._count.children,
        participantCount: newUnit._count.participants
      },
      message: `${unitType === 'gerencia' ? 'Gerencia' : 'Departamento'} creado exitosamente`
    });

  } catch (error) {
    console.error('Error creating organizational unit:', error);
    return NextResponse.json(
      { error: 'Error al crear unidad organizacional' },
      { status: 500 }
    );
  }
}