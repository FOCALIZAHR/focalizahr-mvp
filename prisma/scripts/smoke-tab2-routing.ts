// prisma/scripts/smoke-tab2-routing.ts
// SMOKE (read-only) de climaTab2Routing.routeDepartmentTab2 sobre data REAL.
// Replica cómo lo consumiría el endpoint de Tab 2 (1.2): por cada departamento,
//   - reactiveAnalysis del insight persistido → conteo below-tier (filtro estricto)
//   - isSystemic del builder (assembler + buildClimaPlanDecisions) → hasSystemicDimension
// y rutea por-centro (Decisión 1.a). Cruza contra el generate (Tab 1) para coherencia.
//
// Uso: npx --no-install tsx prisma/scripts/smoke-tab2-routing.ts [campaignId]

import { prisma } from '../../src/lib/prisma';
import {
  assembleClimaDecisionInputs,
  type AssemblerRow,
} from '../../src/lib/services/clima/assembleClimaDecisionInputs';
import { buildClimaPlanDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import type {
  DriverImpact,
  ReactiveImpact,
  ClimaCorrelationFlags,
} from '../../src/lib/services/clima/PulseEngine';
import {
  routeDepartmentTab2,
  type Tab2ReactiveRow,
} from '../../src/lib/services/clima/climaTab2Routing';

const DEMO_CAMPAIGN_B = 'cmrx7psja01fe9ay72qxrinkz';

async function main() {
  const campaignId = process.argv[2] || DEMO_CAMPAIGN_B;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, accountId: true, name: true },
  });
  if (!campaign) {
    console.log(`❌ Campaña ${campaignId} no encontrada.`);
    return;
  }

  const insightRows = await prisma.departmentClimaInsight.findMany({
    where: { accountId: campaign.accountId, campaignId },
    include: { department: { select: { id: true, displayName: true } } },
  });

  // isSystemic por depto ← builder (misma cadena que el generate de Tab 1).
  const rows: AssemblerRow[] = insightRows.map((r) => ({
    departmentId: r.departmentId,
    departmentName: r.department?.displayName ?? 'Departamento',
    driverAnalysis: (r.driverAnalysis as unknown as DriverImpact[] | null) ?? null,
    reactiveAnalysis: (r.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? null,
    correlationFlags: (r.correlationFlags as unknown as ClimaCorrelationFlags | null) ?? null,
  }));
  const decisiones = buildClimaPlanDecisions(assembleClimaDecisionInputs(rows));
  const systemicByDept = new Map<string, boolean>();
  for (const d of decisiones) {
    if (d.isSystemic) systemicByDept.set(d.departmentId, true);
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Campaña: ${campaign.name}  ·  deptos: ${insightRows.length}`);
  console.log(`(conteo = filtro estricto circular+doble-barril+energia; isSystemic = builder)`);
  console.log('════════════════════════════════════════════════════════════════');

  const tally: Record<string, number> = { ESTADO_B_PDI: 0, ESTADO_A_CHOICE: 0, NONE: 0 };

  for (const r of insightRows) {
    const reactives: Tab2ReactiveRow[] = (
      (r.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? []
    ).map((x) => ({ reactive: x.reactive, category: x.category, mean: x.mean }));

    const hasSystemic = systemicByDept.get(r.departmentId) ?? false;
    const res = routeDepartmentTab2(reactives, hasSystemic);
    tally[res.route]++;

    // Cuántos reactivos crudos había vs cuántos sobrevivieron el filtro estricto.
    const rawMeasured = reactives.filter((x) => x.mean !== null).length;

    console.log('');
    console.log(`▸ ${r.department?.displayName ?? r.departmentId}`);
    console.log(`    reactivos medidos (crudo): ${rawMeasured}`);
    console.log(`    below-tier tras filtro   : ${res.belowTierCount} foco(s)  ·  dimensiones: [${res.belowTierDimensions.join(', ') || '—'}]`);
    console.log(`    isSystemic (builder)     : ${res.hasSystemicDimension}`);
    console.log(`    → RUTA                   : ${res.route}`);
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Resumen rutas: ESTADO_B_PDI=${tally.ESTADO_B_PDI}  ESTADO_A_CHOICE=${tally.ESTADO_A_CHOICE}  NONE=${tally.NONE}`);
  console.log('════════════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
