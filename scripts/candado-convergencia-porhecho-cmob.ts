// scripts/candado-convergencia-porhecho-cmob.ts
// CANDADO VIVO (read-only). Prueba que la convergencia de cmob0e56 NO se mueve
// al pasar de "por estado" (Fase 2: pending/acknowledged, sin ventana) a
// "por hecho" (porHecho: 12m status-agnóstico, sin decay).
//
// Para cada depto ANALIZADO de cmob0e56 (isaScore != null = los que entran a
// convergencia), carga las alertas externas en AMBOS modos y compara el
// multiset (alertType, producto, pesoEfectivo). Idéntico → no se mueve.
//
// Además reporta, org-wide, qué deptos SÍ verían delta (transparencia: la
// severidad ×1.3 puede moverse en otros deptos, no en los de cmob0e56).
//
// Run: npx tsx scripts/candado-convergencia-porhecho-cmob.ts
// Exit 0 si cmob0e56 no se mueve; exit 1 si se mueve.

import { prisma } from '../src/lib/prisma';
import { loadDepartmentExternalAlerts } from '../src/lib/services/compliance/ConvergenciaEngine';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';

type AlertaKey = string;
function keyOf(a: { alertType: string; producto: string; pesoEfectivo: number }): AlertaKey {
  return `${a.producto}:${a.alertType}:${a.pesoEfectivo}`;
}
function multiset(arr: Array<{ alertType: string; producto: string; pesoEfectivo: number }>): Map<AlertaKey, number> {
  const m = new Map<AlertaKey, number>();
  for (const a of arr) m.set(keyOf(a), (m.get(keyOf(a)) ?? 0) + 1);
  return m;
}
function equalMultiset(a: Map<AlertaKey, number>, b: Map<AlertaKey, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: CAMPAIGN_ID },
    select: { accountId: true },
  });
  if (!campaign) throw new Error('Campaña no encontrada');
  const accountId = campaign.accountId;

  const analyzed = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId: CAMPAIGN_ID,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
      isaScore: { not: null },
    },
    select: { departmentId: true, department: { select: { displayName: true } } },
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CANDADO convergencia "por hecho" — cmob0e56');
  console.log(`Deptos analizados: ${analyzed.map((a) => a.department?.displayName).join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  let moved = false;
  for (const a of analyzed) {
    if (!a.departmentId) continue;
    const fase2 = await loadDepartmentExternalAlerts(a.departmentId, accountId); // modo viejo
    const porHecho = await loadDepartmentExternalAlerts(a.departmentId, accountId, { porHecho: true });
    const same = equalMultiset(multiset(fase2), multiset(porHecho));
    if (!same) moved = true;
    console.log(
      `  ${a.department?.displayName ?? a.departmentId} · fase2=${fase2.length} alertas · porHecho=${porHecho.length} alertas · ` +
        (same ? 'IDÉNTICO ✓' : 'CAMBIÓ ✗'),
    );
    if (!same) {
      console.log('    fase2:    ', fase2.map(keyOf).sort().join(' | ') || '(vacío)');
      console.log('    porHecho: ', porHecho.map(keyOf).sort().join(' | ') || '(vacío)');
    }
  }

  // Org-wide: ¿qué OTROS deptos verían delta? (transparencia, no falla el candado)
  const allDeptIds = await prisma.exitAlert.findMany({
    where: { accountId },
    select: { departmentId: true },
    distinct: ['departmentId'],
  });
  const analyzedSet = new Set(analyzed.map((a) => a.departmentId));
  const otherMoved: string[] = [];
  for (const { departmentId } of allDeptIds) {
    if (!departmentId || analyzedSet.has(departmentId)) continue;
    const fase2 = await loadDepartmentExternalAlerts(departmentId, accountId);
    const porHecho = await loadDepartmentExternalAlerts(departmentId, accountId, { porHecho: true });
    if (!equalMultiset(multiset(fase2), multiset(porHecho))) {
      const d = await prisma.department.findUnique({ where: { id: departmentId }, select: { displayName: true } });
      otherMoved.push(`${d?.displayName ?? departmentId} (fase2=${fase2.length}→porHecho=${porHecho.length})`);
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(moved
    ? '✗ FALLA: la convergencia de cmob0e56 SE MUEVE con porHecho.'
    : '✓ CANDADO OK: la convergencia de cmob0e56 NO se mueve (sets idénticos).');
  console.log(`Otros deptos (fuera de cmob0e56) que SÍ verían delta: ${otherMoved.length}`);
  for (const m of otherMoved) console.log(`  · ${m}`);
  console.log('(El delta en otros deptos es esperado — severidad ×1.3 al incluir cerradas; no afecta cmob0e56.)');

  await prisma.$disconnect();
  process.exit(moved ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
