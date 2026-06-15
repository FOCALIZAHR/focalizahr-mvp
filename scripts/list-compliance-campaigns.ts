// scripts/list-compliance-campaigns.ts
// READ-ONLY. Lista campañas con análisis ORG de compliance (ISA org-level)
// para identificar cuál abrir en el dev server por mundo. No escribe nada.
// Run: npx tsx scripts/list-compliance-campaigns.ts

import { prisma } from '../src/lib/prisma';

async function main() {
  const rows = await prisma.complianceAnalysis.findMany({
    where: { scope: 'ORG', isaScore: { not: null } },
    select: {
      isaScore: true,
      status: true,
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          totalInvited: true,
          totalResponded: true,
        },
      },
    },
  });

  rows.sort((a, b) => (b.isaScore ?? 0) - (a.isaScore ?? 0));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CAMPAÑAS COMPLIANCE (análisis ORG) — orden por ISA desc');
  console.log('Nota: el gap del selector es DEPT-level; el % persona es proxy.');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const r of rows) {
    const c = r.campaign;
    const pct =
      c.totalInvited > 0 ? Math.round((c.totalResponded / c.totalInvited) * 100) : 0;
    const banda = (r.isaScore ?? 0) >= 80 ? 'SANO' : (r.isaScore ?? 0) >= 60 ? 'atención' : (r.isaScore ?? 0) >= 40 ? 'riesgo' : 'crítico';
    console.log(
      `\n  ISA ${String(r.isaScore).padStart(3)} [${banda}]  ${c.name}` +
        `\n    id=${c.id}  status=${c.status}  job=${r.status}  persona=${c.totalResponded}/${c.totalInvited} (${pct}%)`,
    );
  }
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`Total: ${rows.length} campañas con ISA org-level.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
