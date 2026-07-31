import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// PUT: Actualizar gerencia o departamento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; structureId: string } }
) {
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

    const accountId = params.id;
    const unitId = params.structureId;
    const body = await request.json();
    const { displayName, parentId, responsableId } = body;

    console.log('🔍 PUT - Actualizando unidad:', {
      unitId,
      accountId,
      nuevoNombre: displayName,
      nuevoPadre: parentId
    });

    // Buscar la unidad existente
    const existingUnit = await prisma.department.findFirst({
      where: {
        id: unitId,
        accountId,
        isActive: true
      }
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Unidad organizacional no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Unidad encontrada:', {
      nombre: existingUnit.displayName,
      tipo: existingUnit.unitType,
      nivel: existingUnit.level,
      categoriaActual: existingUnit.standardCategory,
      padreActual: existingUnit.parentId
    });

    // Las gerencias (nivel 2) no pueden tener padre
    if (existingUnit.level === 2 && parentId) {
      return NextResponse.json(
        { error: 'Las gerencias no pueden tener unidad padre' },
        { status: 400 }
      );
    }

    // Verificar que el nuevo padre existe y es una gerencia (si se proporciona)
    if (parentId) {
      const parentUnit = await prisma.department.findFirst({
        where: {
          id: parentId,
          accountId,
          isActive: true,
          level: 2
        }
      });

      if (!parentUnit) {
        return NextResponse.json(
          { error: 'La gerencia padre especificada no existe o no es válida' },
          { status: 400 }
        );
      }

      console.log('✅ Gerencia padre válida:', parentUnit.displayName);
    }

    // Verificar unicidad del nuevo nombre si cambió
    if (displayName && displayName !== existingUnit.displayName) {
      const duplicateName = await prisma.department.findFirst({
        where: {
          accountId,
          displayName: {
            equals: displayName,
            mode: 'insensitive'
          },
          level: existingUnit.level,
          parentId: parentId ?? existingUnit.parentId,
          isActive: true,
          NOT: { id: unitId }
        }
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'Ya existe una unidad con ese nombre en este nivel' },
          { status: 400 }
        );
      }
    }

    // Categorización inteligente
    let standardCategory = existingUnit.standardCategory;
    
    if (displayName && displayName !== existingUnit.displayName) {
      const nuevaCategoria = DepartmentAdapter.getGerenciaCategory(displayName);
      
      if (nuevaCategoria) {
        standardCategory = nuevaCategoria;
        console.log(`✅ Categorización exitosa: "${displayName}" → ${nuevaCategoria}`);
      } else {
        standardCategory = 'sin_asignar';
        console.log(`⚠️ Sin categoría clara: "${displayName}" → sin_asignar`);
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (displayName) {
      updateData.displayName = displayName;
    }
    
    if (body.hasOwnProperty('parentId')) {
      updateData.parentId = parentId || null;
    }
    
    if (standardCategory !== existingUnit.standardCategory) {
      updateData.standardCategory = standardCategory;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Responsable del departamento (EX Clima Gate 1 — FK a Employee.id)
    //
    // R1 NO NEGOCIABLE (ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md §2bis): el FK
    // referencia el id GLOBAL de Employee y NO garantiza misma cuenta. Verificar
    // en capa de aplicación que employee.accountId === department.accountId antes
    // de enlazar; sin este chequeo el vínculo sería un puente cross-tenant.
    // ────────────────────────────────────────────────────────────────────────
    if (Object.prototype.hasOwnProperty.call(body, 'responsableId')) {
      if (responsableId) {
        const responsableEmployee = await prisma.employee.findFirst({
          where: {
            id: responsableId,
            accountId,          // ← R1: mismo accountId que el departamento
            isActive: true
          },
          select: { id: true, fullName: true }
        });

        if (!responsableEmployee) {
          return NextResponse.json(
            { error: 'El responsable indicado no existe, está inactivo o no pertenece a esta cuenta' },
            { status: 400 }
          );
        }

        updateData.responsableId = responsableId;
        console.log(`✅ Responsable validado: ${responsableEmployee.fullName}`);
      } else {
        // null / '' → desasignar explícito (el resolver cae a Account.adminEmail)
        updateData.responsableId = null;
        console.log('🔄 Responsable desasignado');
      }
    }

    // Actualizar la unidad
    // where incluye accountId (defensa multi-tenant en la mutación misma, no solo
    // en el findFirst previo). Patrón ya usado en DepartmentService.ts:180-183.
    const updatedUnit = await prisma.department.update({
      where: { id: unitId, accountId },
      data: updateData,
      include: {
        parent: true,
        responsable: {
          select: { id: true, fullName: true, position: true }
        },
        children: {
          where: { isActive: true },
          orderBy: { displayName: 'asc' }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    console.log('✅ Unidad actualizada exitosamente');

    // Auditoría del cambio de responsable (solo si efectivamente cambió).
    // Patrón: admin/mapping-review/route.ts:276-290 (entityType 'department').
    // try/catch silencioso: auditar nunca debe voltear la mutación ya persistida.
    if (
      Object.prototype.hasOwnProperty.call(updateData, 'responsableId') &&
      updateData.responsableId !== existingUnit.responsableId
    ) {
      try {
        await prisma.auditLog.create({
          data: {
            accountId,
            action: 'DEPARTMENT_RESPONSABLE_UPDATED',
            entityType: 'department',
            entityId: unitId,
            oldValues: { responsableId: existingUnit.responsableId },
            newValues: { responsableId: updateData.responsableId },
            userInfo: {
              performedBy: validation.account.adminEmail || validation.account.id,
              performedByRole: validation.account.role || 'UNKNOWN'
            }
          }
        });
      } catch (auditError) {
        console.error('⚠️ No se pudo registrar el AuditLog del responsable:', auditError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUnit,
        participantCount: updatedUnit._count.participants
      },
      message: 'Unidad organizacional actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando unidad:', error);
    return NextResponse.json(
      { error: 'Error al actualizar unidad organizacional' },
      { status: 500 }
    );
  }
}

// PATCH: Soft delete (desactivar) gerencia o departamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; structureId: string } }
) {
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

    const accountId = params.id;
    const unitId = params.structureId;
    const body = await request.json();
    const { isActive } = body;

    console.log('🔍 PATCH - Toggle estado:', {
      unitId,
      nuevoEstado: isActive
    });

    // Verificar que la unidad existe
    const unit = await prisma.department.findFirst({
      where: {
        id: unitId,
        accountId
      }
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Unidad organizacional no encontrada' },
        { status: 404 }
      );
    }

    // Si se está desactivando, validar que no tenga dependencias activas
    if (isActive === false) {
      
      // Para gerencias: verificar que no tenga departamentos activos
      if (unit.level === 2) {
        const activeChildren = await prisma.department.count({
          where: {
            parentId: unitId,
            isActive: true
          }
        });

        if (activeChildren > 0) {
          return NextResponse.json(
            { 
              error: 'No se puede desactivar una gerencia con departamentos activos',
              details: `Esta gerencia tiene ${activeChildren} departamento(s) activo(s).`
            },
            { status: 400 }
          );
        }
      }

      // Para departamentos: verificar que no tenga participantes activos
      if (unit.level === 3) {
        const activeParticipants = await prisma.participant.count({
          where: {
            departmentId: unitId,
            hasResponded: false
          }
        });

        if (activeParticipants > 0) {
          return NextResponse.json(
            { 
              error: 'No se puede desactivar un departamento con participantes activos',
              details: `Este departamento tiene ${activeParticipants} participante(s) activos.`
            },
            { status: 400 }
          );
        }
      }
    }

    // Realizar la actualización
    const updatedUnit = await prisma.department.update({
      where: { id: unitId },
      data: { isActive },
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

    console.log(`✅ Unidad ${isActive ? 'activada' : 'desactivada'} exitosamente`);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUnit,
        childrenCount: updatedUnit._count.children,
        participantCount: updatedUnit._count.participants
      },
      message: isActive 
        ? 'Unidad organizacional reactivada exitosamente'
        : 'Unidad organizacional desactivada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado de unidad organizacional' },
      { status: 500 }
    );
  }
}

// Función helper para encontrar la categoría más común
function getMostCommonCategory(categories: string[]): string | null {
  if (categories.length === 0) return null;
  
  const frequency: { [key: string]: number } = {};
  categories.forEach(cat => {
    frequency[cat] = (frequency[cat] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = null;
  
  for (const [cat, count] of Object.entries(frequency)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = cat;
    }
  }
  
  return mostCommon;
}