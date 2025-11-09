
export const dynamic = 'force-dynamic'; // ✅ AGREGAR ESTA LÍNEA
// ============================================
// API GET /api/onboarding/journeys
// FASE 3 - Onboarding Journey Intelligence v3.2.2
// ============================================
// 
// PROPÓSITO:
// Listar journeys de onboarding con paginación y filtros
//
// AUTENTICACIÓN:
// Headers inyectados por middleware
//
// AUTORIZACIÓN:
// - FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR: Ve todos de su cuenta
// - AREA_MANAGER: Solo journeys de su departamento + hijos
//
// QUERY PARAMS:
// - page (default: 1)
// - limit (default: 20, max: 50)
// - status (active, completed, abandoned)
// - departmentId (filtro por departamento específico)
// - riskLevel (critical, high, medium, low)
// - sortBy (hireDate, exoScore, status)
// - sortOrder (asc, desc)
//
// INCLUDES PRISMA:
// - department (select: displayName)
// - alerts top 3 (where: pending/acknowledged, orderBy: severity desc)
//
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/onboarding/journeys
 * 
 * Lista journeys con paginación y filtros
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Onboarding Journeys List] Request iniciada');
    
    // ========================================
    // PASO 1: AUTENTICACIÓN
    // ========================================
    
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || '';
    const userDepartmentId = request.headers.get('x-department-id');
    
    if (!accountId) {
      console.log('❌ [Onboarding Journeys List] Header x-account-id faltante');
      return NextResponse.json(
        { 
          error: 'No autorizado.', 
          success: false 
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ [Onboarding Journeys List] Usuario autenticado - Role: ${userRole}, AccountId: ${accountId}`);
    
    // ========================================
    // PASO 2: AUTORIZACIÓN RBAC
    // ========================================
    
    const allowedRoles = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'HR_ADMIN',
      'HR_OPERATOR',
      'AREA_MANAGER'
    ];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ [Onboarding Journeys List] Rol no autorizado: ${userRole}`);
      return NextResponse.json(
        { 
          error: 'Sin permisos para ver journeys de onboarding.',
          success: false
        },
        { status: 403 }
      );
    }
    
    // ========================================
    // PASO 3: PARSEAR QUERY PARAMS
    // ========================================
    
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    const status = searchParams.get('status'); // active, completed, abandoned
    const departmentIdFilter = searchParams.get('departmentId');
    const riskLevel = searchParams.get('riskLevel'); // critical, high, medium, low
    const sortBy = searchParams.get('sortBy') || 'hireDate';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    console.log('📥 [Onboarding Journeys List] Query params:', {
      page,
      limit,
      status,
      departmentIdFilter,
      riskLevel,
      sortBy,
      sortOrder
    });
    
    // ========================================
    // PASO 4: CONSTRUIR WHERE CLAUSE
    // ========================================
    
    const whereClause: any = {
      accountId // Multi-tenant isolation
    };
    
    // Filtro por status
    if (status && ['active', 'completed', 'abandoned'].includes(status)) {
      whereClause.status = status;
    }
    
    // Filtro por riskLevel
    if (riskLevel && ['critical', 'high', 'medium', 'low'].includes(riskLevel)) {
      whereClause.riskLevel = riskLevel;
    }
    
    // Filtro departamental
    if (departmentIdFilter) {
      whereClause.departmentId = departmentIdFilter;
    } else if (userRole === 'AREA_MANAGER' && userDepartmentId) {
      // AREA_MANAGER: Solo ve su departamento + hijos
      // TODO: Cuando se implemente getChildDepartments, usar aquí
      // const childIds = await getChildDepartmentIds(userDepartmentId);
      // whereClause.departmentId = { in: [userDepartmentId, ...childIds] };
      
      // Por ahora, solo su departamento exacto
      whereClause.departmentId = userDepartmentId;
      console.log(`🏢 [Onboarding Journeys List] AREA_MANAGER: Filtrado por departamento ${userDepartmentId}`);
    }
    
    // ========================================
    // PASO 5: CONSTRUIR ORDER BY
    // ========================================
    
    let orderBy: any = { createdAt: 'desc' }; // Default
    
    if (sortBy === 'hireDate') {
      orderBy = { hireDate: sortOrder };
    } else if (sortBy === 'exoScore') {
      orderBy = { exoScore: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    }
    
    // ========================================
    // PASO 6: QUERY PRINCIPAL
    // ========================================
    
    console.log('🔍 [Onboarding Journeys List] Ejecutando queries...');
    
    const [journeys, total] = await Promise.all([
      prisma.journeyOrchestration.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          // Departamento (solo nombre)
          department: {
            select: {
              id: true,
              displayName: true
            }
          },
          // Top 3 alertas pendientes/acknowledged (ordenadas por severidad)
          alerts: {
            where: {
              status: {
                in: ['pending', 'acknowledged']
              }
            },
            orderBy: {
              severity: 'desc' // critical > high > medium > low
            },
            take: 3,
            select: {
              id: true,
              alertType: true,
              severity: true,
              description: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      
      // Count total para paginación
      prisma.journeyOrchestration.count({
        where: whereClause
      })
    ]);
    
    // ========================================
    // PASO 7: RESPUESTA CON PAGINACIÓN
    // ========================================
    
    const duration = Date.now() - startTime;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ [Onboarding Journeys List] Query exitosa en ${duration}ms`);
    console.log(`📊 [Onboarding Journeys List] Resultados: ${journeys.length}/${total} total`);
    
    return NextResponse.json(
      {
        success: true,
        data: journeys,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          status: status || null,
          departmentId: departmentIdFilter || null,
          riskLevel: riskLevel || null
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Onboarding Journeys List] Error después de ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error obteniendo journeys', 
        success: false 
      },
      { status: 500 }
    );
  }
}