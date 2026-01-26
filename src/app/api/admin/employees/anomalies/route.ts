// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE ANOMALIES API - Human-in-the-Loop Resolution
// src/app/api/admin/employees/anomalies/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET:   Lista empleados con trackHasAnomaly === true
// PATCH: Resuelve anomalía (PROMOTE a MANAGER o CONFIRM como COLABORADOR)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface AnomalyEmployee {
  id: string;
  fullName: string;
  position: string | null;
  performanceTrack: string | null;
  standardJobLevel: string | null;
  department: {
    displayName: string;
  };
  directReportsCount: number;
}

type ResolutionAction = 'PROMOTE' | 'CONFIRM';

// ════════════════════════════════════════════════════════════════════════════
// GET - Lista empleados con anomalías
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    // Solo FOCALIZAHR_ADMIN puede acceder
    if (userContext.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener parámetro opcional de accountId
    const { searchParams } = new URL(request.url);
    const accountIdFilter = searchParams.get('accountId');

    // Query con filtro de anomalías
    const whereClause: Record<string, unknown> = {
      trackHasAnomaly: true,
      status: 'ACTIVE'
    };

    if (accountIdFilter) {
      whereClause.accountId = accountIdFilter;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        position: true,
        performanceTrack: true,
        standardJobLevel: true,
        accountId: true,
        department: {
          select: {
            displayName: true
          }
        },
        account: {
          select: {
            companyName: true
          }
        },
        _count: {
          select: {
            directReports: true
          }
        }
      },
      orderBy: [
        { account: { companyName: 'asc' } },
        { fullName: 'asc' }
      ]
    });

    // Transformar datos
    const data: AnomalyEmployee[] = employees.map(emp => ({
      id: emp.id,
      fullName: emp.fullName,
      position: emp.position,
      performanceTrack: emp.performanceTrack,
      standardJobLevel: emp.standardJobLevel,
      department: {
        displayName: emp.department.displayName
      },
      companyName: emp.account.companyName,
      directReportsCount: emp._count.directReports
    }));

    // Calcular resumen
    const summary = {
      total: data.length,
      byTrack: {
        colaborador: data.filter(e => e.performanceTrack === 'COLABORADOR').length,
        manager: data.filter(e => e.performanceTrack === 'MANAGER').length,
        ejecutivo: data.filter(e => e.performanceTrack === 'EJECUTIVO').length
      },
      companiesAffected: new Set(employees.map(e => e.accountId)).size
    };

    return NextResponse.json({
      success: true,
      data,
      summary
    });

  } catch (error) {
    console.error('[API] Error fetching anomalies:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Resolver anomalía
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    // Solo FOCALIZAHR_ADMIN puede resolver
    if (userContext.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, action } = body as { employeeId: string; action: ResolutionAction };

    if (!employeeId || !action) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: employeeId y action requeridos' },
        { status: 400 }
      );
    }

    if (!['PROMOTE', 'CONFIRM'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Acción inválida. Usar PROMOTE o CONFIRM' },
        { status: 400 }
      );
    }

    // Obtener empleado actual
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        performanceTrack: true,
        trackHasAnomaly: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    if (!employee.trackHasAnomaly) {
      return NextResponse.json(
        { success: false, error: 'Este empleado no tiene anomalías pendientes' },
        { status: 400 }
      );
    }

    // Determinar nuevo track según acción
    let newTrack: string | undefined;
    let resolutionNote: string;

    if (action === 'PROMOTE') {
      // Promover a MANAGER si tiene reportes directos
      newTrack = 'MANAGER';
      resolutionNote = `Promovido de ${employee.performanceTrack} a MANAGER por revisión manual`;
    } else {
      // CONFIRM: Mantener track actual, solo quitar anomalía
      resolutionNote = `Track ${employee.performanceTrack} confirmado manualmente`;
    }

    // Actualizar empleado
    const updateData: Record<string, unknown> = {
      trackHasAnomaly: false,
      trackMappedAt: new Date(),
      jobLevelMethod: 'manual'
    };

    if (newTrack) {
      updateData.performanceTrack = newTrack;
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    });

    // Log de auditoría
    console.log(
      `✅ [ANOMALÍA RESUELTA] ${employee.fullName}\n` +
      `   Acción: ${action}\n` +
      `   Track anterior: ${employee.performanceTrack}\n` +
      `   Track nuevo: ${newTrack || employee.performanceTrack}\n` +
      `   Resuelto por: ${userContext.userId || 'Admin'}`
    );

    return NextResponse.json({
      success: true,
      message: resolutionNote,
      data: {
        employeeId,
        previousTrack: employee.performanceTrack,
        newTrack: newTrack || employee.performanceTrack,
        action
      }
    });

  } catch (error) {
    console.error('[API] Error resolving anomaly:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
