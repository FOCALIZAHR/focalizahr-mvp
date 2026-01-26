// src/app/api/admin/employees/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService';
import {
  processEmployeeImport,
  DEFAULT_SYNC_CONFIG
} from '@/lib/services/EmployeeSyncService';

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId && !userContext.role) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // RBAC centralizado
    if (!hasPermission(userContext.role, 'employees:sync')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para sincronizar empleados' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employees, config, accountId: bodyAccountId } = body;

    // ═══════════════════════════════════════════════════════════════════════
    // DETERMINAR accountId SEGUN ROL
    // ═══════════════════════════════════════════════════════════════════════
    let targetAccountId: string;

    if (userContext.role === 'FOCALIZAHR_ADMIN') {
      // FOCALIZAHR_ADMIN puede especificar accountId en body
      if (!bodyAccountId) {
        return NextResponse.json(
          { success: false, error: 'accountId requerido para FOCALIZAHR_ADMIN' },
          { status: 400 }
        );
      }

      // Validar que la cuenta existe
      const account = await prisma.account.findUnique({
        where: { id: bodyAccountId },
        select: { id: true, companyName: true, status: true }
      });

      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Cuenta no encontrada' },
          { status: 404 }
        );
      }

      if (account.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: `Cuenta no activa: ${account.status}` },
          { status: 400 }
        );
      }

      targetAccountId = bodyAccountId;
      console.log(`[API] FOCALIZAHR_ADMIN sincronizando empleados para: ${account.companyName}`);

    } else {
      // Otros roles usan su propio accountId del JWT
      if (!userContext.accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId no disponible en contexto' },
          { status: 401 }
        );
      }
      targetAccountId = userContext.accountId;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VALIDAR DATOS
    // ═══════════════════════════════════════════════════════════════════════
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array de employees requerido' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EJECUTAR IMPORT
    // ═══════════════════════════════════════════════════════════════════════
    const result = await processEmployeeImport(
      targetAccountId,
      employees,
      { ...DEFAULT_SYNC_CONFIG, ...config },
      userContext.userId || undefined
    );

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[API] Error en sync employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
