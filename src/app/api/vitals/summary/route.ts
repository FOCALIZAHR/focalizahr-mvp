// src/app/api/vitals/summary/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET /api/vitals/summary — signos vitales del scope del usuario.
// SPEC_HOME_SIGNOS_VITALES_v1.1, Gate A.
//
// Patrón auth MODERNO (clima/results:143-152 + compliance/report:153-162):
// extractUserContext + hasPermission. PROHIBIDO verifyJWT legacy — colapsa los
// 8 roles a CLIENT (auth.ts:186) y dejaría el RBAC ciego.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserContext,
  getChildDepartmentIds,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { getVitalSigns } from '@/lib/services/vitals/VitalSignsService';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    if (!hasPermission(userContext.role, 'vitals:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    // ── Filtrado jerárquico fail-CLOSED ────────────────────────────────────
    // null = toda la cuenta (roles globales). Array = scope departamental.
    let departmentIds: string[] | null = null;

    if (userContext.role === 'AREA_MANAGER') {
      // El middleware inyecta `payload.departmentId || ''` (middleware.ts:206-213),
      // así que un AREA_MANAGER sin departamento llega como STRING VACÍO, no como
      // null — pese a que el tipo declare `string | null`. El `!` cubre ambos.
      // Estado explícito, nunca datos de toda la cuenta ni un "sin datos" mudo.
      if (!userContext.departmentId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Tu acceso no tiene departamento asignado. Contacta a tu administrador.',
            code: 'AREA_MANAGER_SIN_DEPARTAMENTO',
          },
          { status: 403 }
        );
      }

      const children = await getChildDepartmentIds(userContext.departmentId);
      departmentIds = [userContext.departmentId, ...children];
    }

    const data = await getVitalSigns({
      accountId: userContext.accountId,
      departmentIds,
    });

    return NextResponse.json({ success: true, data });
  } catch {
    // Sin stack traces al cliente.
    return NextResponse.json(
      { success: false, error: 'Error obteniendo signos vitales' },
      { status: 500 }
    );
  }
}
