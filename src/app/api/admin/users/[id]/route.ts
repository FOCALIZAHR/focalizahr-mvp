// /api/admin/users/[id]/route.ts - Editar y desactivar usuario
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, isAdmin } from '@/lib/auth';
import { ALL_ROLES } from '@/lib/services/AuthorizationService';

// Roles que pueden gestionar usuarios
const USER_MANAGEMENT_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
];

function canManageUsers(role?: string): boolean {
  return !!role && USER_MANAGEMENT_ROLES.includes(role);
}

// ============================================
// PATCH /api/admin/users/[id] - Editar usuario
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromHeaders(request);
    const { id: userId } = await params;

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado - Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Determinar accountId del operador
    const operatorAccountId = user.accountId || user.id;

    // Buscar usuario a editar
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountId: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar multi-tenant: solo puede editar usuarios de su cuenta (o admin global)
    if (!isAdmin(user) && existingUser.accountId !== operatorAccountId) {
      return NextResponse.json(
        { error: 'No puede editar usuarios de otra cuenta' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role, departmentId, isActive } = body;

    // Construir datos de actualización
    const updateData: Record<string, string | boolean | null> = {};
    const oldValues: Record<string, string | boolean | null> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'El nombre no puede estar vacío' },
          { status: 400 }
        );
      }
      oldValues.name = existingUser.name;
      updateData.name = name.trim();
    }

    if (role !== undefined) {
      if (!(ALL_ROLES as readonly string[]).includes(role)) {
        return NextResponse.json(
          { error: `Rol inválido: ${role}` },
          { status: 400 }
        );
      }
      oldValues.role = existingUser.role;
      updateData.role = role;
    }

    if (departmentId !== undefined) {
      // Puede ser null (quitar departamento) o un ID válido
      if (departmentId !== null) {
        const department = await prisma.department.findFirst({
          where: {
            id: departmentId,
            accountId: existingUser.accountId,
          },
        });

        if (!department) {
          return NextResponse.json(
            { error: 'El departamento no pertenece a esta cuenta' },
            { status: 400 }
          );
        }
      }
      oldValues.departmentId = existingUser.departmentId;
      updateData.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive debe ser boolean' },
          { status: 400 }
        );
      }
      oldValues.isActive = existingUser.isActive;
      updateData.isActive = isActive;
    }

    // Validar: AREA_MANAGER debe tener departamento
    const finalRole = (updateData.role as string) || existingUser.role;
    const finalDeptId = updateData.departmentId !== undefined
      ? updateData.departmentId
      : existingUser.departmentId;

    if (finalRole === 'AREA_MANAGER' && !finalDeptId) {
      return NextResponse.json(
        { error: 'El rol AREA_MANAGER requiere un departamento asignado' },
        { status: 400 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        accountId: existingUser.accountId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: userId,
        oldValues: oldValues,
        newValues: updateData,
        userInfo: {
          performedBy: user.adminEmail || user.id,
          performedByRole: user.role || 'UNKNOWN',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error en PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/admin/users/[id] - Desactivar usuario (soft delete)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromHeaders(request);
    const { id: userId } = await params;

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado - Permisos insuficientes' },
        { status: 403 }
      );
    }

    const operatorAccountId = user.accountId || user.id;

    // Buscar usuario
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar multi-tenant
    if (!isAdmin(user) && existingUser.accountId !== operatorAccountId) {
      return NextResponse.json(
        { error: 'No puede desactivar usuarios de otra cuenta' },
        { status: 403 }
      );
    }

    // Soft delete: marcar isActive = false
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        accountId: existingUser.accountId,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: userId,
        oldValues: { isActive: true },
        newValues: { isActive: false },
        userInfo: {
          performedBy: user.adminEmail || user.id,
          performedByRole: user.role || 'UNKNOWN',
          deactivatedUser: {
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${existingUser.email} desactivado`,
    });
  } catch (error) {
    console.error('Error en DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined,
      },
      { status: 500 }
    );
  }
}
