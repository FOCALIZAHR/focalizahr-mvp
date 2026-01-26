// =============================================================================
// 🔐 EXTENSIÓN RBAC CENTRALIZADA (FocalizaHR Enterprise v3.0)
// =============================================================================
// 
// AGREGAR AL FINAL DE: src/lib/services/AuthorizationService.ts
// 
// BASADO EN: Investigación Claude Code - Matriz REAL del código (Enero 2025)
// NO MODIFICA: Código existente - Es 100% aditivo
// 
// PROPÓSITO:
// - Centralizar permisos que hoy están hardcodeados en 14+ endpoints
// - Permitir migración gradual (endpoints viejos siguen funcionando)
// - Base para nuevos desarrollos (Employee Master, etc.)
// =============================================================================

// =============================================================================
// MATRIZ DE PERMISOS - BASADA EN CÓDIGO REAL (Claude Code Investigation)
// =============================================================================
// 
// Fuentes verificadas:
// - department-metrics/upload/route.ts línea 76
// - campaigns/[id]/participants/upload/route.ts línea 629
// - campaigns/[id]/participants/route.ts línea 145
// - onboarding/enroll/route.ts líneas 76-81
// - onboarding/enroll/batch/route.ts líneas 99-103
// - exit/register/route.ts líneas 81-86
// - exit/register/batch/route.ts líneas 87-91
// - exit/alerts/[id]/route.ts líneas 40-46
// - onboarding/journeys/[id]/route.ts líneas 49-54
// - onboarding/metrics/route.ts líneas 105, 238
// - exit/records/route.ts línea 81
// - middleware.ts línea 222
// =============================================================================

export const PERMISSIONS = {
  // ─────────────────────────────────────────────────────────────────────────
  // PARTICIPANTES (campaigns/[id]/participants)
  // ─────────────────────────────────────────────────────────────────────────
  'participants:read': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_MANAGER',      // De campaigns/[id]/participants GET línea 145
    'HR_ADMIN',
    'HR_OPERATOR',
    'CEO',             // De campaigns/[id]/participants GET línea 145
    'AREA_MANAGER'     // Implícito - con filtrado jerárquico
  ],
  'participants:write': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_OPERATOR'
    // NOTA: CEO excluido intencionalmente - es rol de solo lectura
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // MÉTRICAS DEPARTAMENTALES (department-metrics/upload)
  // ─────────────────────────────────────────────────────────────────────────
  'metrics:upload': [
    'ACCOUNT_OWNER', 
    'FOCALIZAHR_ADMIN'
    // Más restrictivo - solo dueños pueden cargar datos crudos
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // ONBOARDING
  // ─────────────────────────────────────────────────────────────────────────
  'onboarding:enroll': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_OPERATOR'
  ],
  'onboarding:enroll:batch': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN'
    // Más restrictivo para batch - sin HR_OPERATOR
  ],
  'onboarding:read': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_MANAGER',
    'HR_OPERATOR', 
    'CEO',
    'AREA_MANAGER'     // Con filtrado jerárquico
  ],
  'onboarding:journeys:read': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_OPERATOR',
    'AREA_MANAGER'     // Con validación jerárquica en detalle
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // EXIT INTELLIGENCE
  // ─────────────────────────────────────────────────────────────────────────
  'exit:register': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_MANAGER'
  ],
  'exit:register:batch': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN'
    // Más restrictivo para batch
  ],
  'exit:records:read': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'CEO'
    // NOTA: Más restrictivo que onboarding - sin HR_OPERATOR ni HR_MANAGER
  ],
  'exit:alerts:manage': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN', 
    'HR_MANAGER', 
    'AREA_MANAGER'     // Puede gestionar alertas de su jerarquía
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // ADMINISTRACIÓN
  // ─────────────────────────────────────────────────────────────────────────
  'admin:access': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_MANAGER'
    // De middleware.ts línea 222
  ],
  'admin:accounts': [
    'FOCALIZAHR_ADMIN'
    // Solo superadmin puede gestionar cuentas
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // SISTEMA
  // ─────────────────────────────────────────────────────────────────────────
  'system:full': [
    'FOCALIZAHR_ADMIN'
  ],
  
  // ─────────────────────────────────────────────────────────────────────────
  // FUTURO: EMPLOYEE MASTER (para nuevos desarrollos)
  // ─────────────────────────────────────────────────────────────────────────
  'employees:read': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR', 
    'AREA_MANAGER'
  ],
  'employees:write': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN',
    'HR_MANAGER'
  ],
  'employees:sync': [
    'FOCALIZAHR_ADMIN', 
    'ACCOUNT_OWNER', 
    'HR_ADMIN',
    'HR_MANAGER'
  ],
} as const;

// =============================================================================
// TIPO PARA PERMISOS (Type-Safe)
// =============================================================================

export type PermissionType = keyof typeof PERMISSIONS;

// =============================================================================
// FUNCIÓN PRINCIPAL: hasPermission
// =============================================================================

/**
 * Valida si un rol tiene permiso para ejecutar una acción.
 * 
 * @param role - Rol del usuario (puede ser null)
 * @param action - Acción a validar (type-safe con PermissionType)
 * @returns boolean - true si tiene permiso
 * 
 * @example
 * // En un endpoint nuevo:
 * import { hasPermission, extractUserContext } from '@/lib/services/AuthorizationService';
 * 
 * const userContext = extractUserContext(request);
 * if (!hasPermission(userContext.role, 'employees:sync')) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export function hasPermission(role: string | null, action: PermissionType): boolean {
  if (!role) {
    debugLog(`🚫 hasPermission: rol es null, denegando acceso a ${action}`);
    return false;
  }
  
  const allowedRoles = PERMISSIONS[action];
  
  if (!allowedRoles) {
    debugLog(`⚠️ hasPermission: acción ${action} no definida en PERMISSIONS`);
    return false;
  }
  
  const hasAccess = (allowedRoles as readonly string[]).includes(role);
  
  debugLog(`🔐 hasPermission: ${role} -> ${action} = ${hasAccess ? '✅' : '❌'}`);
  
  return hasAccess;
}

// =============================================================================
// FUNCIÓN AUXILIAR: checkPermissionOrFail
// =============================================================================

/**
 * Valida permiso y lanza excepción si no tiene acceso.
 * Útil para simplificar código en endpoints.
 * 
 * @param role - Rol del usuario
 * @param action - Acción a validar
 * @throws Error si no tiene permiso
 * 
 * @example
 * try {
 *   checkPermissionOrFail(userContext.role, 'employees:write');
 *   // Continuar con la lógica...
 * } catch (error) {
 *   return NextResponse.json({ error: error.message }, { status: 403 });
 * }
 */
export function checkPermissionOrFail(role: string | null, action: PermissionType): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Sin permisos para: ${action}`);
  }
}

// =============================================================================
// FUNCIÓN AUXILIAR: getPermissionsForRole
// =============================================================================

/**
 * Obtiene todas las acciones permitidas para un rol.
 * Útil para debugging y UI de permisos.
 * 
 * @param role - Rol a consultar
 * @returns Array de acciones permitidas
 * 
 * @example
 * const perms = getPermissionsForRole('HR_OPERATOR');
 * // ['participants:read', 'participants:write', 'onboarding:enroll', ...]
 */
export function getPermissionsForRole(role: string): PermissionType[] {
  const permissions: PermissionType[] = [];
  
  for (const [action, allowedRoles] of Object.entries(PERMISSIONS)) {
    if ((allowedRoles as readonly string[]).includes(role)) {
      permissions.push(action as PermissionType);
    }
  }
  
  return permissions;
}

// =============================================================================
// CONSTANTES ÚTILES
// =============================================================================

/**
 * Lista de todos los roles válidos en el sistema.
 * Basado en investigación de código real.
 */
export const ALL_ROLES = [
  'FOCALIZAHR_ADMIN',   // Sistema FocalizaHR (super admin)
  'ACCOUNT_OWNER',      // Dueño de la cuenta/empresa
  'HR_ADMIN',           // RRHH principal
  'HR_MANAGER',         // Jefe RRHH
  'HR_OPERATOR',        // RRHH operacional
  'CEO',                // Ejecutivo (solo lectura)
  'AREA_MANAGER',       // Gerente de área (filtrado jerárquico)
  'VIEWER',             // Solo lectura limitada
  'CLIENT',             // Legacy (default en middleware)
] as const;

export type RoleType = typeof ALL_ROLES[number];

/**
 * Roles con acceso global (ven toda la empresa).
 * Coincide con globalRoles en buildParticipantAccessFilter línea 80.
 */
export const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN', 
  'ACCOUNT_OWNER', 
  'HR_MANAGER', 
  'CEO'
] as const;

/**
 * Roles que requieren filtrado jerárquico.
 */
export const HIERARCHICAL_FILTER_ROLES = [
  'AREA_MANAGER'
] as const;
