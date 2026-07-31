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
