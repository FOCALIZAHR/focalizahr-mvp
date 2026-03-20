// src/lib/services/AuthorizationService.ts
// VERSIÓN FINAL VALIDADA - INCLUYE AMBOS NIVELES DE SEGURIDAD + CONTEXTO

import { prisma } from '@/lib/prisma';
import { LRUCache } from 'lru-cache';

// Cache para optimizar consultas recursivas
const hierarchyCache = new LRUCache<string, string[]>({
  max: 500,
  ttl: 1000 * 60 * 15 // 15 minutos
});

/**
 * Interface para opciones de filtrado con contexto
 */
export interface FilterOptions {
  dataType?: 'participation' | 'results' | 'administrative';
  skipDepartmentFilter?: boolean;
  scope?: 'company' | 'filtered';  // NUEVO: Para rankings sin filtro departamental
}

/**
 * Obtiene todos los departamentos hijos de una gerencia
 * Utiliza CTE recursivo con cache para optimización
 */
export async function getChildDepartmentIds(parentId: string): Promise<string[]> {
  if (hierarchyCache.has(parentId)) {
    debugLog(`📦 Cache hit para departamento ${parentId}`);
    return hierarchyCache.get(parentId)!;
  }
  
  debugLog(`🔍 Consultando hijos de departamento ${parentId}`);
  
  const result = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE dept_tree AS (
      SELECT id, 0 as depth 
      FROM departments 
      WHERE parent_id = ${parentId}
      
      UNION ALL
      
      SELECT d.id, dt.depth + 1
      FROM departments d
      JOIN dept_tree dt ON d.parent_id = dt.id
      WHERE dt.depth < 3
    )
    SELECT id FROM dept_tree
  `;
  
  const ids = result.map(r => r.id);
  debugLog(`✅ Encontrados ${ids.length} departamentos hijos`);
  
  hierarchyCache.set(parentId, ids);
  return ids;
}

/**
 * FUNCIÓN CRÍTICA - Construye filtros de seguridad multi-nivel
 * NIVEL 1: Multi-tenant (accountId) - SIEMPRE
 * NIVEL 2: Departamental (departmentId) - Solo AREA_MANAGER y según contexto
 * 
 * ACTUALIZADO: Ahora soporta contexto para comportamiento diferenciado
 */
export async function buildParticipantAccessFilter(
  userContext: {
    accountId: string;
    role: string | null;
    departmentId: string | null;
  },
  options?: FilterOptions  // NUEVO: Parámetro opcional para contexto
): Promise<any> {
  
  // Log del contexto si está presente
  if (options?.dataType) {
    debugLog(`📋 Contexto: ${options.dataType}`);
  }
  
  debugLog(`🔐 Construyendo filtros para rol: ${userContext.role}, account: ${userContext.accountId}`);
  
  const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'CEO'];
  
  // CASO 1: Roles globales - filtro por cuenta únicamente
  if (globalRoles.includes(userContext.role || '')) {
    debugLog(`✅ Acceso total para ${userContext.role} en cuenta ${userContext.accountId}`);
    return {
      campaign: { 
        accountId: userContext.accountId  // CRÍTICO: Filtro multi-tenant
      }
    };
  }
  
  // CASO 2: AREA_MANAGER - filtro por cuenta Y departamentos (CON CONTEXTO)
  if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {

    // NUEVO: Si es contexto de participación, skip explícito, o scope='company', NO filtrar por departamento
    if (options?.dataType === 'participation' || options?.skipDepartmentFilter || options?.scope === 'company') {
      debugLog(`📊 AREA_MANAGER en modo ${options?.scope || options?.dataType || 'skip'}: Sin filtro departamental`);
      return {
        campaign: {
          accountId: userContext.accountId  // Solo multi-tenant
        }
      };
    }
    
    // Comportamiento original: Para resultados o sin contexto, SÍ filtrar
    debugLog(`🏢 AREA_MANAGER: Aplicando filtros para depto ${userContext.departmentId}`);
    
    const childIds = await getChildDepartmentIds(userContext.departmentId);
    const allAllowedIds = [userContext.departmentId, ...childIds];
    
    debugLog(`✅ Puede ver ${allAllowedIds.length} departamentos en cuenta ${userContext.accountId}`);
    
    return {
      campaign: { 
        accountId: userContext.accountId  // NIVEL 1: Multi-tenant
      },
      departmentId: { 
        in: allAllowedIds  // NIVEL 2: Departamental
      }
    };
  }
  
  // CASO 3: Sin acceso (seguridad por defecto)
  debugLog(`🚫 Sin acceso: rol ${userContext.role} no reconocido`);
  return {
    campaign: { 
      accountId: userContext.accountId 
    },
    id: 'no-access-impossible-value'  // Garantiza 0 resultados
  };
}

/**
 * Helper para extraer contexto del usuario de los headers
 * Los headers vienen del middleware (Día 3)
 */
export function extractUserContext(request: Request): {
  accountId: string;
  role: string | null;
  departmentId: string | null;
  userId: string | null;
} {
  return {
    accountId: request.headers.get('x-account-id') || '',
    role: request.headers.get('x-user-role'),
    departmentId: request.headers.get('x-department-id'),
    userId: request.headers.get('x-user-id')
  };
}

/**
 * Logger condicional para desarrollo
 */
const DEBUG = process.env.NODE_ENV === 'development';
function debugLog(message: string) {
  if (DEBUG) {
    console.log(message);
  }
}

/**
 * Invalida el cache cuando hay cambios en estructura organizacional
 */
export function invalidateDepartmentCache(departmentId?: string) {
  if (departmentId) {
    debugLog(`🗑️ Invalidando cache para departamento ${departmentId}`);
    hierarchyCache.delete(departmentId);
  } else {
    debugLog(`🗑️ Limpiando todo el cache de departamentos`);
    hierarchyCache.clear();
  }
}

// =============================================================================
// 🔐 EXTENSIÓN RBAC CENTRALIZADA (FocalizaHR Enterprise v3.0)
// =============================================================================
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
  'employees:terminate': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // PERFORMANCE CYCLES (Evaluación de desempeño)
  // ─────────────────────────────────────────────────────────────────────────
  'performance:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],
  'performance:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // NINE-BOX / POTENTIAL ASSIGNMENT
  // Estos roles PUEDEN asignar potencial, pero HR_MANAGER/CEO/AREA_MANAGER
  // requieren ser jefe directo (Capa 2 en API)
  // ─────────────────────────────────────────────────────────────────────────
  'potential:assign': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
  ],
  'potential:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // EVALUATOR PORTAL (Portal de evaluaciones para usuarios)
  // ─────────────────────────────────────────────────────────────────────────
  'evaluations:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER',
    'EVALUATOR'
  ],
  'evaluations:submit': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'AREA_MANAGER',
    'EVALUATOR'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // COMPETENCY LIBRARY
  // ─────────────────────────────────────────────────────────────────────────
  'competencies:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN'
    // Solo roles con capacidad de configurar evaluaciones
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // CALIBRATION SESSIONS
  // ─────────────────────────────────────────────────────────────────────────
  'calibration:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER',
    'EVALUATOR'
  ],
  'calibration:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // GOALS (OKRs/Metas)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * goals:view - Ver y listar metas
   *
   * GLOBAL_ACCESS_ROLES (ven toda la empresa):
   *   - FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CEO
   *
   * HIERARCHICAL_FILTER_ROLES (filtrado por departamento):
   *   - AREA_MANAGER: Ve metas COMPANY + metas AREA/INDIVIDUAL de su scope
   *
   * EVALUATOR (filtrado por managerId):
   *   - Ve metas COMPANY (corporativas visibles para todos)
   *   - Ve metas INDIVIDUAL de sus subordinados directos (managerId)
   *
   * IMPORTANTE: El filtrado específico de EVALUATOR se implementa en la API,
   * NO aquí. Este permiso solo autoriza el acceso al endpoint.
   */
  'goals:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER',
    'EVALUATOR'
  ],

  /**
   * goals:create - Crear metas nuevas
   *
   * Niveles permitidos por rol:
   *   - CEO/ACCOUNT_OWNER: Pueden crear COMPANY goals
   *   - HR_ADMIN/HR_MANAGER: Pueden crear COMPANY + AREA goals
   *   - AREA_MANAGER: Pueden crear AREA + INDIVIDUAL para su equipo
   *   - EVALUATOR: Solo INDIVIDUAL para sus subordinados directos (managerId)
   *
   * IMPORTANTE: La validación de nivel y ownership se hace en la API.
   * Este permiso solo autoriza acceso al endpoint POST.
   */
  'goals:create': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER',
    'EVALUATOR'
  ],

  /**
   * goals:approve - Aprobar/rechazar solicitudes de cierre de metas
   *
   * Lógica de aprobación:
   *   - COMPANY goals: CEO o ACCOUNT_OWNER aprueban
   *   - AREA goals: HR_MANAGER o el jefe de área aprueba
   *   - INDIVIDUAL goals: AREA_MANAGER (jefe directo) aprueba
   *
   * NOTA: La validación de quién puede aprobar qué se hace
   * en la lógica de negocio, no solo con este permiso.
   */
  'goals:approve': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
  ],

  // GOALS CONFIGURATION (ya existía - NO modificar)
  'goals:config': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN'
  ],

  // SUCCESSION INTELLIGENCE
  'succession:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
  ],
  'succession:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'CEO'
  ],
  'salary-config:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],
  'salary-config:edit': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN'
  ],
  'talent-actions:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],
  'talent-actions:pl-view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],
  'pl-talent:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],
  'talent-actions:exit-cross': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
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
  'EVALUATOR',          // Usuario evaluador (portal de evaluaciones)
  'VIEWER',             // Solo lectura limitada
  'CLIENT',             // Legacy (default en middleware)
] as const;

export type RoleType = typeof ALL_ROLES[number];

// =============================================================================
// GLOBAL_ACCESS_ROLES - Roles que ven TODA la empresa (sin filtro jerárquico)
// =============================================================================
//
// IMPORTANTE: Estos roles NO tienen filtro por departamento en
// buildParticipantAccessFilter. Ven todos los datos de su cuenta.
//
// TODO POST-LANZAMIENTO:
// ─────────────────────────────────────────────────────────────────────────────
// A) REFACTORIZAR APIs ANTIGUAS: Migrar de allowedRoles hardcodeados a
//    hasPermission() centralizado. Ver endpoints en:
//    - campaigns/[id]/participants/upload (línea 629)
//    - onboarding/enroll (línea 76)
//    - exit/register (línea 81)
//    - Y 11+ endpoints más con arrays hardcodeados
//
// B) RESTRICCIÓN PERFORMANCE: Evaluar si HR_ADMIN/HR_OPERATOR deben ver
//    evaluaciones de desempeño de gerentes/ejecutivos. Actualmente ven todo.
//    Considerar: Solo ACCOUNT_OWNER y CEO ven evaluaciones de nivel gerencial.
//    Afecta: performance:view, potential:view en PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',      // Agregado: Scope empresa completa según documentación
  'HR_MANAGER',
  'HR_OPERATOR',   // Agregado: Scope empresa completa según documentación
  'CEO'
] as const;

/**
 * Roles que requieren filtrado jerárquico.
 */
export const HIERARCHICAL_FILTER_ROLES = [
  'AREA_MANAGER'
] as const;