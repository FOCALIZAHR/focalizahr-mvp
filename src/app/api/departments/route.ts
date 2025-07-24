// ====================================================================
// FOCALIZAHR DEPARTMENTS - API ROUTES CORREGIDO
// src/app/api/departments/route.ts
// Chat 2: Foundation Schema + Services - ARCHIVO NUEVO
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/auth';
import { DepartmentService, CreateDepartmentData } from '@/lib/services/DepartmentService';

export const dynamic = 'force-dynamic';

// ✅ GET: Obtener departments de la cuenta
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    console.log(`📊 Fetching departments for account: ${authResult.account.companyName}`);

    const departments = await DepartmentService.getDepartmentsByAccount(authResult.account.id);
    
    console.log(`✅ Found ${departments.length} departments`);

    return NextResponse.json({ 
      success: true,
      departments,
      total: departments.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching departments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch departments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ POST: Crear nuevo department
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, standardCategory }: CreateDepartmentData = body;

    // Validaciones básicas
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'displayName is required and cannot be empty' 
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

    console.log(`📊 Creating department: ${displayName} (${standardCategory || 'auto-detect'})`);

    const department = await DepartmentService.createDepartment(authResult.account.id, {
      displayName: displayName.trim(),
      standardCategory,
    });

    console.log(`✅ Department created successfully:`, department);

    return NextResponse.json({ 
      success: true,
      department: {
        id: department.id,
        displayName: department.displayName,
        standardCategory: department.standardCategory,
        isActive: department.isActive,
        createdAt: department.createdAt,
      },
      message: `Department "${department.displayName}" created successfully`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error creating department:', error);

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
        error: 'Failed to create department',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ PUT: Bulk create departments
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const authResult = await validateAuthToken(authHeader, request);
    
    if (!authResult.success || !authResult.account) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { departmentNames }: { departmentNames: string[] } = body;

    if (!Array.isArray(departmentNames) || departmentNames.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'departmentNames array is required and cannot be empty' 
        },
        { status: 400 }
      );
    }

    // Validar que todos los nombres sean strings válidos
    const validNames = departmentNames
      .filter(name => typeof name === 'string' && name.trim().length > 0)
      .map(name => name.trim());

    if (validNames.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid department names provided' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 Bulk creating ${validNames.length} departments`);

    const result = await DepartmentService.createBulkDepartments(authResult.account.id, validNames);

    // Obtener departments actualizados
    const departments = await DepartmentService.getDepartmentsByAccount(authResult.account.id);

    console.log(`✅ Bulk creation completed: ${result.count} departments created`);

    return NextResponse.json({ 
      success: true,
      created: result.count,
      departments,
      total: departments.length,
      message: `Successfully created ${result.count} departments`,
    });

  } catch (error: any) {
    console.error('❌ Error bulk creating departments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to bulk create departments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}