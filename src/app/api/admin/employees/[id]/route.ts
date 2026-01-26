// src/app/api/admin/employees/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService';

// GET - Detalle de empleado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        department: true,
        manager: {
          select: { id: true, fullName: true, position: true, email: true }
        },
        directReports: {
          select: { id: true, fullName: true, position: true, email: true, status: true }
        },
        history: {
          orderBy: { effectiveDate: 'desc' },
          take: 20
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Validación jerárquica para AREA_MANAGER
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const allowedDepts = [userContext.departmentId, ...childIds];

      if (!allowedDepts.includes(employee.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Fuera de su ámbito' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar con acciones especiales
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // Obtener empleado
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // ════════════════════════════════════════════════════════════════
    // ACCIONES ESPECIALES
    // ════════════════════════════════════════════════════════════════

    // TERMINATE
    if (action === 'terminate') {
      if (!hasPermission(userContext.role, 'employees:terminate')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos para desactivar' },
          { status: 403 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'TERMINATE',
            fieldName: 'status',
            oldValue: employee.status,
            newValue: 'INACTIVE',
            changeSource: 'MANUAL',
            changedBy: userContext.userId,
            changeReason: updateData.reason || 'Desvinculación manual'
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            status: 'INACTIVE',
            isActive: false,
            terminatedAt: new Date(),
            terminationReason: updateData.reason || 'manual'
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // REHIRE
    if (action === 'rehire') {
      if (!hasPermission(userContext.role, 'employees:write')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos' },
          { status: 403 }
        );
      }

      if (employee.status !== 'INACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Solo se puede recontratar empleados inactivos' },
          { status: 400 }
        );
      }

      const newTenure = employee.tenureCount + 1;

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'REHIRE',
            fieldName: 'status',
            oldValue: 'INACTIVE',
            newValue: 'ACTIVE',
            changeSource: 'MANUAL',
            changedBy: userContext.userId,
            changeReason: `Recontratación manual (tenure #${newTenure})`
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            rehireDate: new Date(),
            tenureCount: newTenure,
            terminatedAt: null,
            terminationReason: null,
            pendingReview: false,
            pendingReviewReason: null
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // TRANSFER (cambio de departamento)
    if (action === 'transfer') {
      if (!hasPermission(userContext.role, 'employees:write')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos' },
          { status: 403 }
        );
      }

      if (!updateData.departmentId) {
        return NextResponse.json(
          { success: false, error: 'departmentId requerido para transfer' },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'TRANSFER',
            fieldName: 'departmentId',
            oldValue: employee.departmentId,
            newValue: updateData.departmentId,
            changeSource: 'MANUAL',
            changedBy: userContext.userId
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            departmentId: updateData.departmentId,
            ...(updateData.managerId !== undefined && { managerId: updateData.managerId })
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // ════════════════════════════════════════════════════════════════
    // UPDATE NORMAL
    // ════════════════════════════════════════════════════════════════
    if (!hasPermission(userContext.role, 'employees:write')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const allowedFields = [
      'fullName', 'preferredName', 'email', 'phoneNumber',
      'position', 'jobTitle', 'seniorityLevel', 'costCenter'
    ];

    const sanitizedData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: sanitizedData
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    console.error('[API] Error actualizando employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
