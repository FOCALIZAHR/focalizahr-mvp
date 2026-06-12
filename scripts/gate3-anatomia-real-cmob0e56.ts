// scripts/gate3-anatomia-real-cmob0e56.ts
// Gate 3 (Anatomía) — org dimensions REALES de cmob0e56, READ-ONLY.
// Lee resultPayload.safetyDetail.dimensionScores de los ComplianceAnalysis
// DEPARTMENT COMPLETED y corre computeOrgDimensions + dimFoco + toDisplay100.
//
// Run: npx tsx scripts/gate3-anatomia-real-cmob0e56.ts

import { prisma } from '@/lib/prisma';
import {
  computeOrgDimensions,
  dimFoco,
  toDisplay100,
} from '@/lib/services/compliance/orgDimensions';
import { buildAnatomia, buildAnatomiaModal } from '@/lib/services/compliance/buildAnatomia';
import {
  DIMENSION_CEO_LABELS,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportDepartment } from '@/types/compliance';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';

async function main() {
  const rows = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED' },
    select: { departmentId: true, respondentCount: true, resultPayload: true },
  });

  const departments: ComplianceReportDepartment[] = rows.map((r) => {
    const payload = (r.resultPayload ?? {}) as any;
    const ds = payload?.safetyDetail?.dimensionScores ?? {};
    return {
      departmentId: r.departmentId ?? '',
      dimensionScores: ds,
      respondentCount: r.respondentCount ?? 0,
    } as unknown as ComplianceReportDepartment;
  });

  console.log(`Deptos COMPLETED: ${departments.length}`);
  const dims = computeOrgDimensions(departments);
  const foco = dimFoco(dims);

  console.log('\n═══ ORG DIMENSIONS (ponderado por respondentCount) ═══');
  for (const d of dims) {
    console.log(
      `• ${DIMENSION_CEO_LABELS[d.key]} (${d.key})  ·  valor ${d.valor.toFixed(2)}  ·  display ${toDisplay100(d.valor)}  ·  ${d.level}`,
    );
  }

  const sanas = dims.filter((d) => d.level === 'sano');
  const noSanas = dims.filter((d) => d.level !== 'sano');
  console.log('\n═══ FORMA ═══');
  console.log(`sanas=${sanas.length} · noSanas=${noSanas.length} · total=${dims.length}`);
  const forma =
    noSanas.length === 0 ? 'TODO_SANO'
      : sanas.length === 0 ? 'TODO_BAJO'
        : noSanas.length === 1 ? 'DESPAREJO_SINGULAR'
          : 'DESPAREJO_PLURAL';
  console.log(`forma = ${forma}`);
  console.log(`dimFoco = ${foco ? `${DIMENSION_CEO_LABELS[foco.key]} (${foco.key}) valor ${foco.valor.toFixed(2)} ${foco.level}` : 'null (todo sano)'}`);

  const sorted = [...dims].sort((a, b) => b.valor - a.valor);
  console.log(`dimMásAlta = ${DIMENSION_CEO_LABELS[sorted[0].key]} (${sorted[0].valor.toFixed(2)})`);
  const bajas = [...noSanas].sort((a, b) => a.valor - b.valor);
  console.log(`bajas (por debajo de la línea, asc): ${bajas.map((b) => `${DIMENSION_CEO_LABELS[b.key]} ${b.valor.toFixed(2)}`).join(' · ')}`);

  // ── orgISA real (scope ORG) + render del acto ─────────────────────────────
  const org = await prisma.complianceAnalysis.findFirst({
    where: { campaignId: CAMPAIGN_ID, scope: 'ORG' },
    select: { isaScore: true },
  });
  const orgISA = org?.isaScore ?? 0;
  const acto = buildAnatomia(dims, orgISA)!;

  console.log('\n╔══ GATE 3b · ANATOMÍA — ACTO (caso real) ══╗\n');
  console.log('LA ANATOMÍA');
  console.log(`\n   ${acto.hero.dimsEnSano}   (${acto.hero.color})`);
  console.log('   DIMENSIONES EN NIVEL SANO');
  console.log(`   de las ${acto.hero.total} que mide el estudio\n`);
  console.log(`   ${acto.titular}`);
  for (const p of acto.parrafos) console.log(`   ${p}`);
  if (acto.focoParrafo) {
    console.log(`   ${acto.focoParrafo.pre}[${acto.focoParrafo.foco}]ⓘ${acto.focoParrafo.post}`);
  }
  if (acto.causaRaiz) console.log(`\n   ${acto.causaRaiz}\n`);
  for (const g of acto.grupos) {
    console.log(`   ${g.kicker}   ${g.items.map((i) => `${i.labelCEO} · ${i.display}`).join('  ·  ')}`);
  }
  console.log(`\n   ${acto.scaleLine}`);
  console.log(`   ${acto.modalLink}`);
  console.log(`   «${acto.cierre}»`);

  // ── MODAL 3c ──────────────────────────────────────────────────────────────
  const modal = buildAnatomiaModal(dims)!;
  console.log('\n╔══ GATE 3c · ANATOMÍA — MODAL "Ver el detalle" ══╗\n');
  console.log(`  ${modal.header}`);
  console.log(`  ${modal.scaleLine}\n`);
  for (const g of modal.grupos) {
    console.log(`  ▸ ${g.kicker}`);
    for (const d of g.dims) {
      console.log(`    ${d.labelCEO}  ${d.display}   [${'█'.repeat(Math.round(d.display / 5))}${'·'.repeat(20 - Math.round(d.display / 5))}|75]`);
      console.log(`      ${d.labelLower}`);
      console.log(`      «${d.headline}» (cursiva)`);
      console.log(`      ${d.body}`);
    }
    console.log('');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('ERROR:', e?.message ?? e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
