// src/lib/services/vitals/resolveVitalsAccess.ts
// ════════════════════════════════════════════════════════════════════════════
// FUENTE ÚNICA de la regla de acceso de Signos Vitales (fail-CLOSED).
//
// Extraído de api/vitals/summary/route.ts (Gate A) SIN cambio de comportamiento,
// para que el endpoint y la portada server-side (Gate B) compartan la MISMA
// regla en vez de replicarla. Replicarla habría creado el caso 17 de
// DEUDA_FAIL_OPEN_AREA_MANAGER (16 endpoints que hoy repiten el filtro inline
// y fallan ABIERTO si el AREA_MANAGER no tiene departamento).
//
// Vive acá y no en src/lib/auth/ porque usa getChildDepartmentIds, que arrastra
// Prisma. src/lib/auth/permissions.ts es client-safe por contrato explícito
// (ver su cabecera) y no debe importar Prisma ni nada que lo arrastre.
//
// ── QUÉ HEADER DE ROL USA Y POR QUÉ ────────────────────────────────────────
// Usa 'x-user-role', que el middleware setea desde el claim `userRole`
// (middleware.ts:208) — el rol RBAC real de los 8 niveles.
//
// NO usa 'x-effective-role' (middleware.ts:222). Ese pasa por getEffectiveRole()
// (middleware.ts:44-56), que para un User nuevo devuelve lo mismo, pero para un
// token Account legacy cae a `payload.role`: el campo COLAPSADO a
// CLIENT/FOCALIZAHR_ADMIN. Confiar en él reproduciría la clase de bug de
// DashboardNavigation.tsx:115, y podría conceder acceso de admin derivado del
// campo colapsado.
//
// Con token legacy, 'x-user-role' ni siquiera se setea (middleware.ts:206 exige
// payload.userId), asi que el rol llega null y hasPermission deniega. Fail-closed.
// ════════════════════════════════════════════════════════════════════════════

import { getChildDepartmentIds, hasPermission } from '@/lib/services/AuthorizationService';

/** Lector de headers agnóstico: sirve para NextRequest y para headers() de RSC. */
export type HeaderGetter = (name: string) => string | null | undefined;

export type VitalsAccessDenied = {
  ok: false;
  status: 401 | 403;
  error: string;
  code?: 'AREA_MANAGER_SIN_DEPARTAMENTO';
};

export type VitalsAccessGranted = {
  ok: true;
  accountId: string;
  role: string;
  /** null = toda la cuenta. Array = scope jerárquico resuelto. */
  departmentIds: string[] | null;
};

export type VitalsAccess = VitalsAccessGranted | VitalsAccessDenied;

/**
 * Resuelve acceso y scope para Signos Vitales.
 * Comportamiento idéntico al que tenía route.ts inline en Gate A.
 */
export async function resolveVitalsAccess(getHeader: HeaderGetter): Promise<VitalsAccess> {
  const accountId = getHeader('x-account-id') || '';
  const role = getHeader('x-user-role') || null;

  if (!accountId) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }

  if (!hasPermission(role, 'vitals:view')) {
    return { ok: false, status: 403, error: 'Sin permisos' };
  }

  let departmentIds: string[] | null = null;

  if (role === 'AREA_MANAGER') {
    // El middleware inyecta `payload.departmentId || ''` (middleware.ts:209), así
    // que un AREA_MANAGER sin departamento llega como STRING VACÍO, no como null,
    // pese a que el tipo declare `string | null`. El `!` cubre ambos casos.
    // Estado explícito, nunca datos de toda la cuenta ni un "sin datos" mudo.
    const departmentId = getHeader('x-department-id') || '';
    if (!departmentId) {
      return {
        ok: false,
        status: 403,
        error: 'Tu acceso no tiene departamento asignado. Contacta a tu administrador.',
        code: 'AREA_MANAGER_SIN_DEPARTAMENTO',
      };
    }

    const children = await getChildDepartmentIds(departmentId);
    departmentIds = [departmentId, ...children];
  }

  return { ok: true, accountId, role: role as string, departmentIds };
}
