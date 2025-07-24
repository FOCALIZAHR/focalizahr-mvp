// ====================================================================
// FOCALIZAHR DEPARTMENTS - INDIVIDUAL DEPARTMENT API
// src/app/api/departments/[id]/route.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/auth';
import { DepartmentService, CreateDepartmentData } from '@/lib/services/DepartmentService';

export const dynamic = 'force-dynamic';

// ✅ GET: Obtener department específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    const departmentId = params.id;
    
    if (!departmentId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Department ID is required' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching department: ${departmentId}`);

    const department = await DepartmentService.getDepartmentById(departmentId, authResult.account.id);
    
    if (!department) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Department not found or access denied' 
        },
        { status: 404 }
      );
    }

    console.log(`✅ Department found: ${department.displayName}`);

    return NextResponse.json({ 
      success: true,
      department: {
        id: department.id,
        displayName: department.displayName,
        standardCategory: department.standardCategory,
        isActive: department.isActive,
        participantCount: department._count?.participants || 0,
        createdAt: department.createdAt,
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching department:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch department',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ PATCH: Actualizar department
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    const departmentId = params.id;
    const body = await request.json();
    const { displayName, standardCategory }: Partial<CreateDepartmentData> = body;

    if (!departmentId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Department ID is required' 
        },
        { status: 400 }
      );
    }

    // Validaciones
    if (displayName !== undefined) {
      if (!displayName || displayName.trim().length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'displayName cannot be empty' 
          },
          { status: 400 }
        );
      }

      if (displayName.trim().length > 100) {
        return NextResponse.json(
          { 
            success: false,
            error: 'displayName cannot exceed 100 characters' 
          },
          { status: 400 }
        );
      }
    }

    console.log(`📊 Updating department: ${departmentId}`);

    const updatedDepartment = await DepartmentService.updateDepartment(
      departmentId, 
      authResult.account.id, 
      { displayName, standardCategory }
    );

    console.log(`✅ Department updated: ${updatedDepartment.displayName}`);

    return NextResponse.json({ 
      success: true,
      department: {
        id: updatedDepartment.id,
        displayName: updatedDepartment.displayName,
        standardCategory: updatedDepartment.standardCategory,
        isActive: updatedDepartment.isActive,
        createdAt: updatedDepartment.createdAt,
      },
      message: `Department "${updatedDepartment.displayName}" updated successfully`,
    });

  } catch (error: any) {
    console.error('❌ Error updating department:', error);

    // Handle unique constraint violation
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          code: 'DEPARTMENT_EXISTS',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update department',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Desactivar department (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    const departmentId = params.id;
    
    if (!departmentId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Department ID is required' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 Deactivating department: ${departmentId}`);

    const deactivatedDepartment = await DepartmentService.deactivateDepartment(
      departmentId, 
      authResult.account.id
    );

    console.log(`✅ Department deactivated: ${deactivatedDepartment.displayName}`);

    return NextResponse.json({ 
      success: true,
      department: {
        id: deactivatedDepartment.id,
        displayName: deactivatedDepartment.displayName,
        isActive: deactivatedDepartment.isActive,
      },
      message: `Department "${deactivatedDepartment.displayName}" deactivated successfully`,
    });

  } catch (error: any) {
    console.error('❌ Error deactivating department:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to deactivate department',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}