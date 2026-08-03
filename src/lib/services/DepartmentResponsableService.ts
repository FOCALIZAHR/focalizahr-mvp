// src/lib/services/DepartmentResponsableService.ts
// EX Clima Gate 1 (transversal) — resuelve "¿quién es el responsable de este departamento?".
//
// Contrato (sellado en .claude/tasks/ARQUITECTURA_RESPONSABLE_DEPARTAMENTO.md, Addendum):
//   - Department.responsableId → Employee.id (hecho de RRHH, NO login).
//   - Walk-up: evalúa el PROPIO departmentId recibido primero; si no tiene responsable
//     activo, sube por Department.parentId; tope en el primer responsable activo.
//   - Fallback final: Account.adminEmail (siempre resuelve — adminEmail es requerido/único).
//   - NUNCA toca Employee.managerId (ese es otro eje: jefe de una persona, no de un depto).
//
// Multi-tenant: cada salto valida accountId. Cap de profundidad contra ciclos de parentId.
// Pura: no envía nada. El canal (email/otro) del responsable lo decide su consumidor (5C).

import { prisma } from '@/lib/prisma';
import { getChildDepartmentIds } from '@/lib/services/AuthorizationService';

const MAX_DEPTH = 6; // holding(1) → gerencia(2) → depto(3) + margen; corta ciclos

export type DepartmentResponsableResult =
  | {
      source: 'responsable';
      departmentId: string; // depto donde se encontró el responsable (puede ser un ancestro)
      employeeId: string;
      email: string | null; // puede ser null; el canal lo decide el consumidor
      name: string;
    }
  | {
      source: 'account_admin';
      email: string;
      name: string;
    };

/**
 * Resuelve el responsable de un departamento subiendo por la jerarquía (parentId),
 * con fallback a Account.adminEmail. Empieza SIEMPRE por el departmentId recibido.
 */
export async function resolveDepartmentResponsable(params: {
  departmentId: string;
  accountId: string;
}): Promise<DepartmentResponsableResult> {
  const { departmentId, accountId } = params;

  let currentId: string | null = departmentId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    // Guard multi-tenant: el depto debe pertenecer a la cuenta.
    const dept: { id: string; parentId: string | null; responsableId: string | null } | null =
      await prisma.department.findFirst({
        where: { id: currentId, accountId },
        select: { id: true, parentId: true, responsableId: true },
      });

    if (!dept) break; // depto ajeno/inexistente → cae al fallback

    if (dept.responsableId) {
      const emp = await prisma.employee.findFirst({
        where: { id: dept.responsableId, accountId, isActive: true },
        select: { id: true, fullName: true, email: true },
      });
      if (emp) {
        return {
          source: 'responsable',
          departmentId: dept.id,
          employeeId: emp.id,
          email: emp.email,
          name: emp.fullName,
        };
      }
      // responsable seteado pero inactivo/ausente → seguir subiendo
    }

    currentId = dept.parentId;
    depth += 1;
  }

  // Fallback: administrador de la cuenta (adminEmail es String @unique requerido).
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { adminEmail: true, adminName: true },
  });

  return {
    source: 'account_admin',
    email: account?.adminEmail ?? '',
    name: account?.adminName ?? 'Administrador',
  };
}

/**
 * Todos los employeeIds que responden por `departmentId` en LÍNEA VERTICAL ASCENDENTE:
 * el responsable resuelto (walk-up) MÁS los responsables de cada ancestro por encima.
 *
 * Existe porque el autorreporte del jefe (Gate 5C) lo escribe el responsable del
 * departamento O cualquiera ARRIBA de él: si el jefe de área no registró qué hizo con
 * el hallazgo, su gerente tiene que poder hacerlo. Sin esta ampliación, el circuito
 * se corta en la única persona que quizá esté de vacaciones.
 *
 * SOLO ascendente. Un responsable de un depto HIJO no responde por su padre, y los
 * departamentos HERMANOS quedan fuera. Es la mitad ascendente de la regla de rama
 * vertical de getResponsableChainDepartmentIds (que sí incluye descendientes, porque
 * responde otra pregunta: quién es ELEGIBLE como responsable, no quién responde YA).
 *
 * `resolved` es idéntico a lo que devuelve resolveDepartmentResponsable: el PRIMER
 * responsable activo subiendo desde el propio departmentId, con fallback a
 * Account.adminEmail. Se devuelve junto al set para que el caller distinga
 * "responsable directo" de "superior" sin volver a resolver.
 *
 * Fail-closed: si nadie en la cadena tiene responsable activo, `chainEmployeeIds`
 * queda VACÍO (el fallback account_admin no aporta employeeId) y nadie escribe.
 *
 * ⚠️ El walk-up vive en DOS funciones (esta y resolveDepartmentResponsable) por la
 * misma razón que computeResponsableCandidateCounts existe aparte: los costos son
 * opuestos. resolveDepartmentResponsable CORTA en el primer responsable (1 salto en
 * el caso común) y la llaman rutas calientes como by-person, una vez por departamento;
 * ésta recorre la cadena ENTERA. Si cambia la regla del walk-up, cambiarla en las dos.
 *
 * Sube por parentId crudo, NO por getChildDepartmentIds (LRU 15 min): la respuesta
 * gatea ESCRITURA y no puede servir jerarquía vieja.
 * Multi-tenant: cada salto valida accountId. Mismo cap de profundidad contra ciclos.
 */
export async function resolveResponsableChain(params: {
  departmentId: string;
  accountId: string;
}): Promise<{ resolved: DepartmentResponsableResult; chainEmployeeIds: Set<string> }> {
  const { departmentId, accountId } = params;

  const chainEmployeeIds = new Set<string>();
  let resolved: DepartmentResponsableResult | null = null;

  let currentId: string | null = departmentId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    // Guard multi-tenant: el depto debe pertenecer a la cuenta.
    const dept: { id: string; parentId: string | null; responsableId: string | null } | null =
      await prisma.department.findFirst({
        where: { id: currentId, accountId },
        select: { id: true, parentId: true, responsableId: true },
      });

    if (!dept) break; // depto ajeno/inexistente → corta la cadena acá

    if (dept.responsableId) {
      const emp = await prisma.employee.findFirst({
        where: { id: dept.responsableId, accountId, isActive: true },
        select: { id: true, fullName: true, email: true },
      });
      if (emp) {
        chainEmployeeIds.add(emp.id);
        // El PRIMERO encontrado es el responsable resuelto (misma semántica que
        // resolveDepartmentResponsable); los de más arriba son sus superiores.
        if (!resolved) {
          resolved = {
            source: 'responsable',
            departmentId: dept.id,
            employeeId: emp.id,
            email: emp.email,
            name: emp.fullName,
          };
        }
      }
      // responsable seteado pero inactivo/ausente → seguir subiendo
    }

    currentId = dept.parentId;
    depth += 1;
  }

  if (!resolved) {
    // Nadie activo en toda la cadena → mismo fallback que resolveDepartmentResponsable.
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { adminEmail: true, adminName: true },
    });
    resolved = {
      source: 'account_admin',
      email: account?.adminEmail ?? '',
      name: account?.adminName ?? 'Administrador',
    };
  }

  return { resolved, chainEmployeeIds };
}

/**
 * Ids de departamento cuyos empleados pueden ser RESPONSABLES de `departmentId`:
 * el propio departamento + sus ancestros hasta la raíz + todos sus descendientes.
 * Los departamentos HERMANOS quedan fuera a propósito.
 *
 * Regla de producto (Victor, 2026-07-31): el responsable de un departamento debe tener
 * relación jerárquica real con el equipo. Clima notifica planes de acción a esta
 * persona; alguien de otra rama recibiría un aviso que no le corresponde.
 *
 * Por qué "propio + arriba + abajo" y no solo "arriba": una gerencia nivel 2 casi nunca
 * tiene empleados registrados en sí misma — su jefe figura en un departamento hijo. Con
 * la cadena solo ascendente, 6 gerencias reales quedaban sin ningún candidato elegible.
 *
 * Multi-tenant: cada salto ascendente valida accountId, y los descendientes se
 * intersectan contra departamentos de la cuenta (getChildDepartmentIds no filtra por
 * accountId — se apoya en que parentId no cruza cuentas, garantía implícita).
 */
export async function getResponsableChainDepartmentIds(params: {
  departmentId: string;
  accountId: string;
}): Promise<string[]> {
  const { departmentId, accountId } = params;

  // Fail-closed: arranca vacío. Cada id entra SOLO después de confirmarse que pertenece
  // a la cuenta; un departmentId ajeno devuelve [] y el consumidor no ofrece candidatos.
  const chain = new Set<string>();

  // ── Ascendente: subir por parentId hasta la raíz (mismo patrón que el walk-up) ──
  let currentId: string | null = departmentId;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    const dept: { id: string; parentId: string | null } | null =
      await prisma.department.findFirst({
        where: { id: currentId, accountId },
        select: { id: true, parentId: true },
      });

    if (!dept) break; // depto ajeno/inexistente → corta la cadena acá

    chain.add(dept.id); // confirmado de la cuenta
    currentId = dept.parentId;
    depth += 1;
  }

  // ── Descendente: todo el subárbol bajo el propio departamento ──
  const descendantIds = await getChildDepartmentIds(departmentId);

  if (descendantIds.length > 0) {
    // Guard multi-tenant explícito sobre el CTE (que no filtra por cuenta).
    const ownDescendants = await prisma.department.findMany({
      where: { id: { in: descendantIds }, accountId },
      select: { id: true },
    });
    for (const d of ownDescendants) chain.add(d.id);
  }

  return [...chain];
}

/**
 * Cuántos candidatos elegibles tiene CADA departamento activo de una cuenta.
 * Versión bulk de getResponsableChainDepartmentIds: misma regla de cadena
 * (propio + ancestros + descendientes, hermanos NO), resuelta en memoria con 2
 * queries en vez de 2 por departamento.
 *
 * ⚠️ Si cambia la regla de cadena, hay que cambiarla en LAS DOS funciones. Existen
 * separadas porque los costos son opuestos: la de arriba resuelve UN departamento
 * y se apoya en el CTE recursivo cacheado; ésta resuelve los ~57 de una pantalla,
 * donde 114 queries serían inaceptables.
 *
 * Sirve para distinguir "sin responsable pero asignable" de "sin responsable y
 * bloqueado porque su rama no tiene a nadie cargado" — sin ese dato, la pantalla
 * de mantenimiento ofrece decenas de filas que abren un selector vacío.
 */
export async function computeResponsableCandidateCounts(
  accountId: string
): Promise<Map<string, number>> {
  const [departments, employees] = await Promise.all([
    prisma.department.findMany({
      where: { accountId, isActive: true },
      select: { id: true, parentId: true },
    }),
    prisma.employee.groupBy({
      by: ['departmentId'],
      where: { accountId, isActive: true, status: { not: 'PENDING_ONBOARDING' } },
      _count: { _all: true },
    }),
  ]);

  const parentOf = new Map(departments.map((d) => [d.id, d.parentId]));
  const childrenOf = new Map<string, string[]>();
  for (const d of departments) {
    if (!d.parentId) continue;
    const arr = childrenOf.get(d.parentId) ?? [];
    arr.push(d.id);
    childrenOf.set(d.parentId, arr);
  }

  const employeesIn = new Map<string, number>();
  for (const row of employees) {
    employeesIn.set(row.departmentId, row._count._all);
  }

  const counts = new Map<string, number>();

  for (const dept of departments) {
    const chain = new Set<string>([dept.id]);

    // Ascendente, con el mismo cap de profundidad que el walk-up.
    let currentId = parentOf.get(dept.id) ?? null;
    let depth = 0;
    while (currentId && depth < MAX_DEPTH) {
      if (chain.has(currentId)) break; // ciclo de parentId
      chain.add(currentId);
      currentId = parentOf.get(currentId) ?? null;
      depth += 1;
    }

    // Descendente: todo el subárbol propio.
    const stack = [...(childrenOf.get(dept.id) ?? [])];
    let guard = 0;
    while (stack.length && guard < departments.length + 1) {
      const id = stack.pop()!;
      guard += 1;
      if (chain.has(id)) continue;
      chain.add(id);
      stack.push(...(childrenOf.get(id) ?? []));
    }

    let total = 0;
    for (const id of chain) total += employeesIn.get(id) ?? 0;
    counts.set(dept.id, total);
  }

  return counts;
}

// ════════════════════════════════════════════════════════════════════════════
// ESCRITURA — única vía para persistir Department.responsableId
//
// Vive acá (y no inline en un route handler) porque hay DOS superficies que lo
// escriben: la pantalla concierge (/dashboard/admin/accounts/[id]/structure) y la
// del cliente (/dashboard/organizacion/responsables). Con la regla duplicada en dos
// handlers, R1 y la cadena jerárquica podrían divergir en silencio.
// ════════════════════════════════════════════════════════════════════════════

/** Motivo de rechazo. El handler lo traduce a HTTP; el servicio no conoce status codes. */
export type SetResponsableFailure =
  | 'DEPARTMENT_NOT_FOUND'   // depto inexistente o de otra cuenta
  | 'EMPLOYEE_NOT_FOUND'     // employee inexistente, inactivo, o de otra cuenta (R1)
  | 'OUT_OF_CHAIN';          // employee fuera de la rama vertical del departamento

export type SetResponsableResult =
  | { ok: true; changed: boolean; responsableId: string | null; responsableName: string | null }
  | { ok: false; reason: SetResponsableFailure };

/**
 * Asigna o desasigna el responsable de un departamento.
 *
 * - `responsableId: null` DESASIGNA y no valida nada: limpiar un estado inválido siempre
 *   debe poder hacerse (hay filas heredadas anteriores a la regla de cadena).
 * - R1 NO NEGOCIABLE: el FK referencia el id GLOBAL de Employee y no garantiza misma
 *   cuenta → se verifica en capa de aplicación antes de enlazar.
 * - La cadena jerárquica se valida SOLO si el valor cambia, por la misma razón de arriba:
 *   una fila heredada que la viola no debe bloquear ediciones ajenas del departamento.
 *
 * `actor` solo alimenta la auditoría. Cuando `actor.accountId !== accountId` se registra
 * como operación de admin sobre otra cuenta (actingAdminId vs targetAccountId), mismo
 * patrón que api/department-metrics/upload.
 */
export async function setDepartmentResponsable(params: {
  departmentId: string;
  accountId: string;
  responsableId: string | null;
  actor: { accountId: string; email: string | null; role: string | null };
}): Promise<SetResponsableResult> {
  const { departmentId, accountId, responsableId, actor } = params;

  const department = await prisma.department.findFirst({
    where: { id: departmentId, accountId },
    select: { id: true, responsableId: true },
  });

  if (!department) return { ok: false, reason: 'DEPARTMENT_NOT_FOUND' };

  const previousId = department.responsableId;
  const changed = previousId !== responsableId;

  let responsableName: string | null = null;

  if (responsableId) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: responsableId,
        accountId,        // ← R1: mismo accountId que el departamento
        isActive: true,
      },
      select: { id: true, fullName: true, departmentId: true },
    });

    if (!employee) return { ok: false, reason: 'EMPLOYEE_NOT_FOUND' };

    if (changed) {
      const chainIds = await getResponsableChainDepartmentIds({ departmentId, accountId });
      if (!chainIds.includes(employee.departmentId)) {
        return { ok: false, reason: 'OUT_OF_CHAIN' };
      }
    }

    responsableName = employee.fullName;
  }

  if (!changed) {
    // Nada que persistir ni que auditar.
    return { ok: true, changed: false, responsableId, responsableName };
  }

  await prisma.department.update({
    where: { id: departmentId, accountId },   // defensa multi-tenant en la mutación misma
    data: { responsableId },
  });

  // Auditoría. try/catch silencioso: nunca debe voltear la mutación ya persistida.
  const actingOnAnotherAccount = actor.accountId !== accountId;
  try {
    await prisma.auditLog.create({
      data: {
        accountId,
        action: 'DEPARTMENT_RESPONSABLE_UPDATED',
        entityType: 'department',
        entityId: departmentId,
        oldValues: { responsableId: previousId },
        newValues: { responsableId },
        userInfo: {
          performedBy: actor.email,
          performedByRole: actor.role,
          // Solo cuando el actor opera sobre una cuenta ajena (concierge).
          ...(actingOnAnotherAccount && {
            actingAdminId: actor.accountId,
            targetAccountId: accountId,
          }),
        },
      },
    });
  } catch (auditError) {
    console.error('⚠️ No se pudo registrar el AuditLog del responsable:', auditError);
  }

  return { ok: true, changed: true, responsableId, responsableName };
}
