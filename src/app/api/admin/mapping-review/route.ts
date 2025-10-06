// src/app/api/admin/mapping-review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

// ================================================================
// GET: Obtener términos CSV sin mapear (agrupados individualmente)
// ================================================================
export async function GET(request: NextRequest) {
  try {
    // SEGURIDAD: Validar token y rol admin (NO TOCAR)
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

    // ✅ PASO 1: Obtener el/los departamento(s) paraguas
    const umbrellaQuery: any = {
      standardCategory: 'sin_asignar',
      isActive: true
    };

    // Aplicar filtro de empresa si existe
    if (companyFilter) {
      umbrellaQuery.account = {
        companyName: {
          contains: companyFilter,
          mode: 'insensitive'
        }
      };
    }

    const umbrellaDepartments = await prisma.department.findMany({
      where: umbrellaQuery,
      select: {
        id: true,
        accountId: true,
        account: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    if (umbrellaDepartments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          totalUnmappedTerms: 0,
          companiesAffected: 0,
          totalParticipants: 0
        }
      });
    }

    const umbrellaIds = umbrellaDepartments.map(d => d.id);
    const accountIdMap = new Map(
      umbrellaDepartments.map(d => [d.id, { accountId: d.accountId, companyName: d.account.companyName }])
    );

    // ✅ PASO 2: Agrupar por término CSV (participant.department)
    const unmappedTerms = await prisma.participant.groupBy({
      by: ['department', 'departmentId'],
      where: {
        departmentId: { in: umbrellaIds },
        department: { not: null }
      },
      _count: {
        id: true
      }
    });

    // ✅ PASO 3: Enriquecer con sugerencias de categoría
    const enrichedTerms = unmappedTerms.map(term => {
      const accountInfo = accountIdMap.get(term.departmentId!);
      const suggestedCategory = DepartmentAdapter.getGerenciaCategory(term.department!);
      
      return {
        id: term.departmentId, // ✅ FIX 3: Compatibilidad con frontend
        csvTerm: term.department,
        displayName: term.department,
        companyId: accountInfo?.accountId || '',
        companyName: accountInfo?.companyName || 'N/A',
        participantCount: term._count.id,
        suggestedCategory: suggestedCategory || null,
        confidence: suggestedCategory ? 'high' : 'low',
        departmentId: term.departmentId // Department paraguas actual
      };
    });

    // Ordenar: primero por empresa, luego por término
    enrichedTerms.sort((a, b) => {
      const companyCompare = a.companyName.localeCompare(b.companyName);
      if (companyCompare !== 0) return companyCompare;
      return (a.csvTerm || '').localeCompare(b.csvTerm || '');
    });

    // Estadísticas agregadas
    const stats = {
      totalUnmappedTerms: enrichedTerms.length,
      companiesAffected: new Set(enrichedTerms.map(d => d.companyId)).size,
      totalParticipants: enrichedTerms.reduce((sum, d) => sum + d.participantCount, 0)
    };

    console.log(`[Mapping Review] Consultados ${stats.totalUnmappedTerms} términos CSV únicos de ${stats.companiesAffected} empresas`);

    return NextResponse.json({
      success: true,
      data: enrichedTerms,
      stats
    });

  } catch (error) {
    console.error('Error fetching unmapped CSV terms:', error);
    return NextResponse.json(
      { error: 'Error al obtener términos sin mapear' },
      { status: 500 }
    );
  }
}

// ================================================================
// PATCH: Crear departamento nuevo y reasignar participantes
// ================================================================
export async function PATCH(request: NextRequest) {
  try {
    // SEGURIDAD: Validar token y rol admin (NO TOCAR)
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
    const { csvTerm, standardCategory, accountId, departmentId } = body;

    // ✅ FIX 1: Validar que departmentId es obligatorio
    if (!csvTerm || !standardCategory || !accountId || !departmentId) {
      return NextResponse.json(
        { error: 'csvTerm, standardCategory, accountId y departmentId son requeridos' },
        { status: 400 }
      );
    }

    // Validar categoría (las 8 gerencias válidas)
    const validCategories = [
      'personas', 'comercial', 'marketing', 'tecnologia', 
      'operaciones', 'finanzas', 'servicio', 'legal'
    ];

    if (!validCategories.includes(standardCategory)) {
      return NextResponse.json(
        { error: `Categoría inválida. Debe ser una de: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // ✅ FIX 2: Validar que departmentId paraguas existe y pertenece al accountId
    const paraguas = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { 
        accountId: true,
        standardCategory: true 
      }
    });

    if (!paraguas) {
      return NextResponse.json(
        { error: 'Departamento paraguas no encontrado' },
        { status: 404 }
      );
    }

    if (paraguas.accountId !== accountId) {
      return NextResponse.json(
        { error: 'Validación de seguridad fallida: departmentId no pertenece al accountId especificado' },
        { status: 403 }
      );
    }

    if (paraguas.standardCategory !== 'sin_asignar') {
      return NextResponse.json(
        { error: 'El departmentId especificado no es un paraguas válido (debe tener standardCategory = sin_asignar)' },
        { status: 400 }
      );
    }

    // ✅ TRANSACCIÓN: Crear department + reasignar participantes
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el nuevo departamento con el término CSV
      const newDepartment = await tx.department.create({
        data: {
          accountId,
          displayName: csvTerm,
          standardCategory,
          unitType: 'departamento',
          level: 3,
          isActive: true
        }
      });

      // 2. Reasignar participantes que tienen ese término CSV exacto
      const updatedParticipants = await tx.participant.updateMany({
        where: {
          department: csvTerm,
          departmentId: departmentId // Department paraguas actual
        },
        data: {
          departmentId: newDepartment.id
        }
      });

      return {
        department: newDepartment,
        participantsReassigned: updatedParticipants.count
      };
    });

    // ✅ AUDITORÍA: Log de la operación
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: 'MAPPING_REVIEW_CREATE_AND_REASSIGN',
      performedBy: {
        accountId: validation.account.id,
        adminEmail: validation.account.adminEmail,
        adminName: validation.account.adminName,
        role: validation.account.role
      },
      targetCompany: {
        accountId,
      },
      operation: {
        csvTerm,
        newDepartmentId: result.department.id,
        standardCategory,
        participantsAffected: result.participantsReassigned
      }
    };

    console.log('[AUDIT] Mapping Review - Create & Reassign:', JSON.stringify(auditLog, null, 2));

    // Guardar en tabla de auditoría
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DEPARTMENT_CREATE_FROM_CSV_TERM',
          account: { connect: { id: accountId } },
          entityType: 'department',
          entityId: result.department.id,
          oldValues: { csvTerm, status: 'unmapped' },
          newValues: { 
            departmentId: result.department.id,
            standardCategory,
            participantsReassigned: result.participantsReassigned
          }
        }
      });
    } catch (auditError) {
      console.error('[AUDIT] Error guardando auditoría:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: `Departamento "${csvTerm}" creado con categoría "${standardCategory}". ${result.participantsReassigned} participantes reasignados.`,
      data: {
        departmentId: result.department.id,
        displayName: result.department.displayName,
        standardCategory: result.department.standardCategory,
        participantsReassigned: result.participantsReassigned
      }
    });

  } catch (error) {
    console.error('Error creating department and reassigning participants:', error);
    return NextResponse.json(
      { error: 'Error al crear departamento y reasignar participantes' },
      { status: 500 }
    );
  }
}