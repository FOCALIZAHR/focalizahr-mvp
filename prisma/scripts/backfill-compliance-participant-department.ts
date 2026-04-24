// prisma/scripts/backfill-compliance-participant-department.ts
// Backfill idempotente: setea Participant.department (string) = Department.displayName
// para Participants de campañas Ambiente Sano que tienen departmentId poblado pero
// department en null. Sin esto, los analytics agrupan por el string y todos caen en
// "Sin departamento".
//
// - Dry-run por defecto (reporta qué cambiaría).
// - Con --apply: ejecuta los UPDATE.
// - No toca Participants que ya tengan department seteado (idempotente).
// - No toca Participants sin departmentId (no hay fuente de verdad para completarlos).
//
// Uso:
//   npm run backfill:compliance-participant-department         # dry-run
//   npm run backfill:compliance-participant-department -- --apply

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'pulso-ambientes-sanos';

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(
    `🏷️  Backfill Participant.department en "${SLUG}" (${apply ? 'APPLY' : 'DRY-RUN'})`
  );
  console.log('');

  // Traer Participants de campañas Ambiente Sano con departmentId seteado pero
  // department (string) en null o vacío.
  const participants = await prisma.participant.findMany({
    where: {
      campaign: { campaignType: { slug: SLUG } },
      departmentId: { not: null },
      OR: [{ department: null }, { department: '' }],
    },
    select: {
      id: true,
      campaignId: true,
      departmentId: true,
      department: true,
      departmentRel: { select: { displayName: true } },
    },
  });

  if (participants.length === 0) {
    console.log('✅ No hay Participants con department=null que necesiten backfill.');
    return;
  }

  // Agrupar por campañas para reporte más legible.
  const byCampaign = new Map<string, number>();
  const missingDept: string[] = [];
  const ready: Array<{ id: string; targetName: string }> = [];

  for (const p of participants) {
    if (!p.departmentRel) {
      // departmentId apunta a un Department que ya no existe (o sin displayName).
      missingDept.push(p.id);
      continue;
    }
    ready.push({ id: p.id, targetName: p.departmentRel.displayName });
    byCampaign.set(p.campaignId, (byCampaign.get(p.campaignId) ?? 0) + 1);
  }

  console.log(`📊 Resumen:`);
  console.log(`   Participants candidatos:     ${participants.length}`);
  console.log(`   Listos para UPDATE:          ${ready.length}`);
  console.log(`   Sin Department resoluble:    ${missingDept.length}`);
  console.log('');

  if (byCampaign.size > 0) {
    console.log('Distribución por campaña:');
    for (const [cid, count] of byCampaign.entries()) {
      console.log(`   ${cid}  →  ${count} participants`);
    }
    console.log('');
  }

  if (missingDept.length > 0) {
    console.log(
      `⚠️  ${missingDept.length} participants tienen departmentId pero el Department no es resoluble. Se saltan.`
    );
    console.log('');
  }

  if (ready.length === 0) {
    console.log('✅ No hay nada que aplicar.');
    return;
  }

  if (!apply) {
    console.log(`🔍 DRY-RUN: ${ready.length} participants se actualizarían.`);
    console.log(
      '   Para aplicar: npm run backfill:compliance-participant-department -- --apply'
    );
    return;
  }

  console.log(`🔄 Aplicando UPDATE a ${ready.length} participants...\n`);

  // Bulk por displayName para eficiencia: un update por valor distinto de department.
  const byTargetName = new Map<string, string[]>();
  for (const r of ready) {
    const arr = byTargetName.get(r.targetName) ?? [];
    arr.push(r.id);
    byTargetName.set(r.targetName, arr);
  }

  let totalUpdated = 0;
  for (const [name, ids] of byTargetName.entries()) {
    const { count } = await prisma.participant.updateMany({
      where: { id: { in: ids } },
      data: { department: name },
    });
    totalUpdated += count;
    console.log(`   ✅ "${name}"  →  ${count} participants`);
  }

  console.log('');
  console.log(`🎉 Backfill completado. ${totalUpdated} participants actualizados.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
