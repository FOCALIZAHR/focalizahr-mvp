// src/app/api/vitals/summary/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET /api/vitals/summary — signos vitales del scope del usuario.
// SPEC_HOME_SIGNOS_VITALES_v1.1, Gate A.
//
// Patrón auth MODERNO: la regla de acceso vive en resolveVitalsAccess (fuente
// única, compartida con la portada server-side del Gate B). PROHIBIDO verifyJWT
// legacy — colapsa los 8 roles a CLIENT (auth.ts:186) y dejaría el RBAC ciego.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getVitalSigns } from '@/lib/services/vitals/VitalSignsService';
import { resolveVitalsAccess } from '@/lib/services/vitals/resolveVitalsAccess';

export async function GET(request: NextRequest) {
  try {
    const access = await resolveVitalsAccess((name) => request.headers.get(name));

    if (!access.ok) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
          ...(access.code ? { code: access.code } : {}),
        },
        { status: access.status }
      );
    }

    const data = await getVitalSigns({
      accountId: access.accountId,
      departmentIds: access.departmentIds,
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
