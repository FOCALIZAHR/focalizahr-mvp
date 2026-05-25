// src/lib/services/compliance/DepartmentRiskScoreService.ts
// Score de riesgo por departamento — runtime, no persistido.
//
// Diseño cerrado en `.claude/tasks/SCORE_RIESGO_DEPARTAMENTO_DISENO_CERRADO.md`.
// Task gate-by-gate en `.claude/tasks/TASK_SCORE_RIESGO_BACKEND_PASO2.md`.
//
// Dos drivers (confiabilidad + voz externa) + piso de denuncia.
// Fórmula:
//   C       = 50 · s²                        (s = 1 − participación)
//   A_norm  = pesoAlertas / (pesoAlertas + 3)
//   A       = 50 · A_norm
//   inferido     = min(C + A, 100)
//   piso         = 75 si denuncias12m ≥ 1, 0 si no
//   score        = max(inferido, piso)
//
// El score se computa para TODO el universo del account (todos los deptos
// activos), no solo los con ComplianceAnalysis. Por eso los helpers son
// agnósticos a la presencia de AS.

import { prisma } from '@/lib/prisma';

// ════════════════════════════════════════════════════════════════════════════
// GATE 1 — Bridge de denuncia (ventana 12 meses)
// ════════════════════════════════════════════════════════════════════════════

/** Meses hacia atrás para la ventana de denuncia. Decisión de diseño. */
const DENUNCIA_WINDOW_MONTHS = 12;

/**
 * Suma de `DepartmentMetric.issueCount` por departamento dentro de la ventana
 * de los últimos 12 meses (por `periodEnd`).
 *
 * Regla `null ≠ 0`:
 *   - Dept con ≥1 row con `issueCount` no-null en la ventana → Map con la suma
 *     (puede ser `0` = cargado, sin denuncias).
 *   - Dept sin NINGÚN row con métrica cargada en la ventana → Map con `null`
 *     (sin dato — el frontend no debe leer esto como "sin denuncias").
 *
 * @param accountId  Cuenta dueña de los deptos.
 * @param deptIds    Universo de deptos a consultar (subset filtrado por RBAC
 *                   ya resuelto por el caller).
 * @param now        Reloj inyectable (testing). Default: new Date().
 */
export async function loadDenunciaCountsByDept(
  accountId: string,
  deptIds: string[],
  now: Date = new Date(),
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  // Inicializar todos los deptos pedidos a null — "sin dato" hasta probar lo contrario.
  for (const id of deptIds) out.set(id, null);

  if (deptIds.length === 0) return out;

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - DENUNCIA_WINDOW_MONTHS);

  const rows = await prisma.departmentMetric.findMany({
    where: {
      accountId,
      departmentId: { in: deptIds },
      periodEnd: { gte: cutoff },
      issueCount: { not: null },
    },
    select: { departmentId: true, issueCount: true },
  });

  // Acumular: solo flipear a número (incluso 0) cuando hay al menos un row.
  for (const r of rows) {
    if (r.issueCount === null) continue; // defensive — el where ya filtra
    const current = out.get(r.departmentId);
    const base = current === null || current === undefined ? 0 : current;
    out.set(r.departmentId, base + r.issueCount);
  }

  return out;
}
