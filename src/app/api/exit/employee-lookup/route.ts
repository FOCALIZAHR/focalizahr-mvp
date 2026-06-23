/**
 * API GET /api/exit/employee-lookup
 *
 * Gate D D2: lookup del maestro Employee para el flujo de exit (bloqueo duro).
 *
 * MODOS:
 *   ?nationalId=12345678-9  -> match exacto por RUT. Devuelve { found, employee }.
 *   ?q=texto                -> buscador por nombre o RUT. Devuelve { results }.
 *
 * REGLAS (selladas):
 * - Por EXISTENCIA: SIN filtro de estado. Encuentra cualquier Employee de la cuenta.
 * - Multi-tenant: scopeado a accountId.
 * - RBAC: scope jerárquico de quien busca. Fuera de scope = no se revela (no-match),
 *   para no ser oráculo de RUT.
 * - Permiso: exit:register (mismo que registrar; el lookup es para registrar).
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExitRegistrationService } from '@/lib/services/ExitRegistrationService';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(userContext.role, 'exit:register')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const scopeDepartmentIds = await ExitRegistrationService.resolveScopeDepartmentIds({
      role: userContext.role,
      departmentId: userContext.departmentId
    });

    const { searchParams } = new URL(request.url);
    const nationalId = searchParams.get('nationalId');
    const query = searchParams.get('q');

    // MODO 1: match exacto por RUT
    if (nationalId) {
      const employee = await ExitRegistrationService.findEmployeeForExit({
        accountId: userContext.accountId,
        nationalId,
        scopeDepartmentIds
      });

      return NextResponse.json({
        success: true,
        data: { found: !!employee, employee }
      });
    }

    // MODO 2: buscador por nombre o RUT
    if (query) {
      const results = await ExitRegistrationService.searchEmployeesForExit({
        accountId: userContext.accountId,
        query,
        scopeDepartmentIds
      });

      return NextResponse.json({ success: true, data: { results } });
    }

    return NextResponse.json(
      { success: false, error: 'Indica nationalId o q' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Exit EmployeeLookup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el lookup' },
      { status: 500 }
    );
  }
}
