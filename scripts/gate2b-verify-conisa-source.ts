// scripts/gate2b-verify-conisa-source.ts
// VERIFICACIÓN (Gate 2b, decisión #1): ¿los sub-deptos con_isa de las gerencias
// Punto Ciego (EQUIPOS MEDICOS, TI) salen de ESTA campaña cmob0e56, o mezclan
// otra ("account-scoped")? READ-ONLY, cero escritura.
//
// Run: npx tsx scripts/gate2b-verify-conisa-source.ts

import { prisma } from '@/lib/prisma';
import { computeCoverageAnalysis } from '@/lib/services/compliance/CoverageAnalysisService';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';
const TARGET = ['EQUIPOS MEDICOS', 'TI'];

async function main() {
  const coverage = await computeCoverageAnalysis(CAMPAIGN_ID, ACCOUNT_ID);

  // Deptos objetivo en la cobertura de ESTA campaña.
  const items = coverage.deptosCobertura.filter((d) =>
    TARGET.some((t) => d.departmentName?.toUpperCase().includes(t)),
  );

  console.log('═══ COBERTURA cmob0e56 (esta campaña) ═══');
  for (const d of items) {
    console.log(
      `• ${d.departmentName} [${d.departmentId}]\n` +
        `    analyzed=${d.analyzed} · invited=${d.invited} · responded=${d.responded} · participationRate=${d.participationRate}`,
    );
  }

  // ¿De qué campaña es el ComplianceAnalysis COMPLETED de esos deptos?
  const ids = items.map((d) => d.departmentId);
  const analyses = await prisma.complianceAnalysis.findMany({
    where: { departmentId: { in: ids }, scope: 'DEPARTMENT' },
    select: {
      departmentId: true,
      campaignId: true,
      status: true,
      createdAt: true,
      campaign: { select: { name: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n═══ ComplianceAnalysis (DEPARTMENT) de esos deptos — todas las campañas ═══');
  for (const a of analyses) {
    const here = a.campaignId === CAMPAIGN_ID ? '  ◀ ESTA CAMPAÑA' : '  ⚠ OTRA CAMPAÑA';
    console.log(
      `• dept=${a.departmentId} · status=${a.status} · campaign="${a.campaign?.name}" [${a.campaignId}]${here}`,
    );
  }

  // Veredicto.
  console.log('\n═══ VEREDICTO ═══');
  for (const d of items) {
    const thisCampaign = analyses.filter(
      (a) => a.departmentId === d.departmentId && a.campaignId === CAMPAIGN_ID,
    );
    const completedHere = thisCampaign.some((a) => a.status === 'COMPLETED');
    console.log(
      `• ${d.departmentName}: analyzed=${d.analyzed} · COMPLETED en esta campaña=${completedHere} · responded=${d.responded}`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('ERROR:', e?.message ?? e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
