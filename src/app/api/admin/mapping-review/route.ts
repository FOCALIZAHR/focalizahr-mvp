// src/app/api/admin/mapping-review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

// GET: Obtener todos los departamentos sin categoría asignada
export async function GET(request: NextRequest) {
  try {
    // SEGURIDAD: Validar token y rol admin
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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const companyFilter = searchParams.get('company')?.toLowerCase();

    // Consultar departamentos sin asignar con información de la empresa
    const unmappedDepartments = await prisma.department.findMany({
      where: {
        standardCategory: 'sin_asignar',
        isActive: true,
        // Filtro opcional por empresa
        ...(companyFilter && {
          account: {
            companyName: {
              contains: companyFilter,
              mode: 'insensitive'
            }
          }
        })
      },
      include: {
        account: {
          select: {
            id: true,
            companyName: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: [
        { account: { companyName: 'asc' } },
        { displayName: 'asc' }
      ]
    });

    // Formatear respuesta con información adicional
    const formattedDepartments = unmappedDepartments.map(dept => ({
      id: dept.id,
      displayName: dept.displayName,
      companyId: dept.accountId,
      companyName: dept.account.companyName,
      participantCount: dept._count.participants,
      level: dept.level,
      unitType: dept.unitType,
      createdAt: dept.createdAt
    }));

    // Estadísticas generales
    const stats = {
      totalUnmapped: formattedDepartments.length,
      companiesAffected: new Set(formattedDepartments.map(d => d.companyId)).size,
      totalParticipants: formattedDepartments.reduce((sum, d) => sum + d.participantCount, 0)
    };

    console.log(`[Mapping Review] Consultados ${stats.totalUnmapped} departamentos sin asignar de ${stats.companiesAffected} empresas`);

    return NextResponse.json({
      success: true,
      data: formattedDepartments,
      stats
    });

  } catch (error) {
    console.error('Error fetching unmapped departments:', error);
    return NextResponse.json(
      { error: 'Error al obtener departamentos sin asignar' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar categoría de un departamento
export async function PATCH(request: NextRequest) {
  try {
    // SEGURIDAD: Validar token y rol admin
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

    // Obtener datos del body
    const body = await request.json();
    const { departmentId, newStandardCategory } = body;

    // Validaciones
    if (!departmentId || !newStandardCategory) {
      return NextResponse.json(
        { error: 'departmentId y newStandardCategory son requeridos' },
        { status: 400 }
      );
    }

    // Validar que la categoría sea válida (una de las 8 gerencias)
    const validCategories = [
      'personas', 'comercial', 'marketing', 'tecnologia', 
      'operaciones', 'finanzas', 'servicio', 'legal'
    ];

    if (!validCategories.includes(newStandardCategory)) {
      return NextResponse.json(
        { error: `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        account: {
          select: { companyName: true }
        }
      }
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la categoría
    const oldCategory = department.standardCategory;
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        standardCategory: newStandardCategory
      }
    });

    // Log de auditoría en el servidor
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: 'MAPPING_REVIEW_UPDATE',
      performedBy: {
        accountId: validation.account.id,  // ID de la cuenta FocalizaHR
        adminEmail: validation.account.adminEmail,
        adminName: validation.account.adminName,
        role: validation.account.role
      },
      targetDepartment: {
        departmentId,
        departmentName: department.displayName,
        account: department.accountId ? { connect: { id: department.accountId } } : undefined,  // ← CAMBIO CORRECTO
        companyName: department.account.companyName
      },
      change: {
        field: 'standardCategory',
        oldValue: oldCategory,
        newValue: newStandardCategory
      }
    };

    console.log('[AUDIT] Mapping Review Update:', JSON.stringify(auditLog, null, 2));

    // Guardar en tabla de auditoría
    // ✅ CÓDIGO CORRECTO - userId se deja null porque el actor no es un 'User' final
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DEPARTMENT_CATEGORY_UPDATE',
          accountId: department.accountId,  // La cuenta CLIENTE afectada
          userId: null,  // Se deja nulo porque el actor no es un 'User' final
          entityType: 'department',
          entityId: departmentId,
          oldValues: { standardCategory: oldCategory },
          newValues: { standardCategory: newStandardCategory },
          metadata: {
            ...auditLog,
            actingAccountId: validation.account.id,  // Guardamos el ID del admin aquí
            actingAccountEmail: validation.account.adminEmail  // Y su email para trazabilidad
          }
        }
      });
    } catch (auditError) {
      // Log pero no fallar si hay error con auditoría
      console.error('[AUDIT] Error guardando en tabla auditoría:', auditError);
      // La operación principal ya se completó, continuar
    }

    return NextResponse.json({
      success: true,
      message: `Categoría actualizada exitosamente de "${oldCategory}" a "${newStandardCategory}"`,
      data: {
        departmentId,
        displayName: department.displayName,
        oldCategory,
        newCategory: newStandardCategory
      }
    });

  } catch (error) {
    console.error('Error updating department category:', error);
    return NextResponse.json(
      { error: 'Error al actualizar categoría del departamento' },
      { status: 500 }
    );
  }
}