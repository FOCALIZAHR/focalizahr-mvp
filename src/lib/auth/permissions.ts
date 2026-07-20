// src/lib/auth/permissions.ts
// ════════════════════════════════════════════════════════════════════════════
// RBAC PURO — client-safe (SIN Prisma, SIN LRUCache).
//
// Extraído de AuthorizationService.ts (Enterprise, jul-2026): ese archivo mezclaba
// el mapa de permisos (puro) con funciones que consultan la base (getChildDepartmentIds,
// buildParticipantAccessFilter). Como TODO vivía junto y el archivo importa Prisma,
// ningún componente de CLIENTE podía usar hasPermission() → el proyecto lo venía
// resolviendo con archivos "espejo" (climaRoles.ts, goalCycleRoles.ts) que DUPLICAN a
// mano el array de roles, justo lo que la Regla Enterprise #2 prohíbe.
//
// Ahora hay UNA sola fuente: cliente y servidor importan la MISMA hasPermission().
// AuthorizationService.ts re-exporta todo esto para no romper a sus ~200 importadores.
//
// ⚠️ Este archivo NO debe importar Prisma ni nada que lo arrastre. Si algún día lo
//    necesita, va en AuthorizationService.ts, no acá.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Logger condicional para desarrollo. Copia local (privada) del helper: NO_DEBUG
 * en producción. process.env.NODE_ENV lo inlinea Next tanto en server como en client.
 */
const DEBUG = process.env.NODE_ENV === 'development';
function debugLog(message: string) {
  if (DEBUG) {
    console.log(message);
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
  // CAMPAÑAS (crear + generar participantes employee-based)
  // Crear/gestionar campañas es operativo de RRHH. Espeja compliance:manage:
  // el mismo set que ya autorizaba generar participantes de Ambiente Sano.
  // CEO/AREA_MANAGER excluidos (lectura / gerente de línea).
  // ─────────────────────────────────────────────────────────────────────────
  'campaigns:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR'
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
   * goals:create:strategic - Crear metas de nivel COMPANY o AREA (el "Estratega")
   *
   * Gate A / BUG 6: hasta jul-2026 NADA en el servidor impedía que un
   * AREA_MANAGER creara una meta corporativa por API directa — solo la UI lo
   * ocultaba (StepSelectLevel.tsx). Eso invalidaba la gobernanza de "el KPI se
   * congela en el origen": cualquier jefe podía inventarse su propia corporativa.
   *
   * NO se reutiliza 'goals:create': ese incluye AREA_MANAGER y EVALUATOR, que SÍ
   * pueden crear metas INDIVIDUAL — son cosas distintas y merecen permisos distintos.
   *
   * Set = el mismo que goals:cycles:manage. CEO queda FUERA a propósito (mismo
   * criterio ya tomado para los ciclos: participa del juicio de cierre por meta
   * vía goals:approve, no de la administración estratégica).
   *
   * DEUDA CONOCIDA (Victor, jul-2026): FOCALIZAHR_ADMIN queda incluido por ahora,
   * aunque implica que el equipo interno de FocalizaHR puede crear metas dentro de
   * la cuenta de un cliente. A resolver después; no bloquea este gate.
   */
  'goals:create:strategic': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
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

  // ─────────────────────────────────────────────────────────────────────────
  // GOAL CYCLES (contenedor de período de metas — gestión operativa)
  // Decisión de Negocio #1 CORREGIDA post-Gate C (SPEC_GOALCYCLE_v4): alineado
  // al patrón performance:manage (mismo set de 4 roles). CEO removido: participa
  // en el juicio humano de cierre por meta vía goals:approve (sin cambios), no
  // en la administración operativa del ciclo completo. Crear/activar/cerrar/
  // finalizar ciclos + lectura de la superficie de gestión de ciclos.
  // ─────────────────────────────────────────────────────────────────────────
  'goals:cycles:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
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
  'exposure:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
  ],
  'salary-config:edit': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN'
  ],
  'descriptors:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],
  'descriptors:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
  ],
  'workforce-intelligence:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
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
  'workforce:budget:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],
  'workforce:budget:approve': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'CEO'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // EFFICIENCY INTELLIGENCE HUB
  // Acceso ejecutivo + liderazgo de personas. Contiene simulación de despidos y
  // cálculo de presupuestos de dotación → data sensible: solo CEO, liderazgo RRHH
  // (HR_ADMIN/HR_MANAGER), dueño de la cuenta y superadmin.
  // AREA_MANAGER NO se incluye a propósito (decisión Victor jun-2026). El filtrado
  // jerárquico para AREA_MANAGER YA existe en api/efficiency/diagnostic/route.ts:
  // para habilitar que un gerente vea SOLO su gerencia a cargo, basta agregar
  // 'AREA_MANAGER' a esta lista.
  // ─────────────────────────────────────────────────────────────────────────
  'efficiency:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // BENCHMARK (comparación de mercado embebida en productos — CARA AL CLIENTE)
  // Roles = los que ven los productos que muestran la comparación (Onboarding,
  // Exit, etc.). Es la comparación que ve el cliente ("tu score vs mercado").
  // NO confundir con la vista interna FocalizaHR de TODOS los benchmarks del
  // mercado (futura, esa será solo FOCALIZAHR_ADMIN).
  // ─────────────────────────────────────────────────────────────────────────
  'benchmark:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // COMUNICACIONES (Gate A v3.0 - cola unificada + dispatcher)
  // ─────────────────────────────────────────────────────────────────────────
  'communication:monitor': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER'
  ],
  'communication:force-dispatch': [
    'FOCALIZAHR_ADMIN'
    // Solo super admin puede forzar el dispatcher (boton de emergencia)
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLIANCE (AMBIENTE SANO — Ley Karin)
  // ─────────────────────────────────────────────────────────────────────────
  'compliance:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'CEO',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'AREA_MANAGER'     // Con filtrado jerárquico
  ],
  'compliance:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // EX CLIMA (Inteligencia de Clima — MAESTRO_EX_CLIMA §1H)
  // Mismo patrón que compliance:view / compliance:manage.
  // AREA_MANAGER con filtrado jerárquico (lo aplica la API, Gate 4).
  // ─────────────────────────────────────────────────────────────────────────
  'clima:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],
  'clima:manage': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR'
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // VITALS (portada de entrada "Signos Vitales" — SPEC_HOME_SIGNOS_VITALES_v1 §4)
  // AREA_MANAGER incluido CON filtrado jerárquico fail-CLOSED (lo aplica la API:
  // sin departmentId → 403 explícito, nunca datos de toda la cuenta).
  // HR_OPERATOR excluido a propósito: Gate C lo redirige a la vista operativa
  // (/dashboard), que es su superficie de trabajo.
  // EVALUATOR excluido: el middleware (:252) ya lo manda a evaluaciones.
  // ─────────────────────────────────────────────────────────────────────────
  'vitals:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
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
