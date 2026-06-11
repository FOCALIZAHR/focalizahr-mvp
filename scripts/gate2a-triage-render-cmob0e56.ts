// scripts/gate2a-triage-render-cmob0e56.ts
// Gate 2a (Triage) — render READ-ONLY del caso real cmob0e56 a través del
// builder autoritativo `buildTriageGroups` (que internamente corre
// `buildGerenciaRollup` real — consolida el merge de ancestro de Comercial).
// CERO escritura. Imprime la pantalla tal como la renderizaría ActoTriage.
//
// Run: npx tsx scripts/gate2a-triage-render-cmob0e56.ts

import { prisma } from '@/lib/prisma';
import { computeCoverageAnalysis } from '@/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '@/lib/services/compliance/DepartmentRiskScoreService';
import {
  buildTriageGroups,
  triageInstanceLine,
} from '@/lib/services/compliance/buildTriageGroups';
import { computeOtroMundo } from '@/lib/services/compliance/CoverageAnalysisService';
import { detectSilencioConVozExterna } from '@/lib/services/compliance/detectSilencioConVozExterna';
import { SILENCIO_PESO_MIN } from '@/lib/services/compliance/ComplianceAlertService';
import type { ComplianceReportResponse } from '@/types/compliance';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';

async function main() {
  const coverage = await computeCoverageAnalysis(CAMPAIGN_ID, ACCOUNT_ID);

  const allDepts = await prisma.department.findMany({
    where: { accountId: ACCOUNT_ID, isActive: true },
    select: { id: true, displayName: true, level: true, parentId: true },
  });
  const deptById = new Map(allDepts.map((d) => [d.id, d]));
  const gerenciaByDeptId = new Map<string, { id: string; name: string } | null>();
  for (const dept of allDepts) {
    if (dept.level === 2 || dept.level === 1) {
      gerenciaByDeptId.set(dept.id, null);
    } else {
      let current = dept;
      let max = 10;
      let resolved: { id: string; name: string } | null = null;
      while (current.parentId && current.level > 2 && max-- > 0) {
        const parent = deptById.get(current.parentId);
        if (!parent) break;
        if (parent.level === 2) {
          resolved = { id: parent.id, name: parent.displayName };
          break;
        }
        current = parent;
      }
      gerenciaByDeptId.set(dept.id, resolved);
    }
  }

  const riskScores = await computeDepartmentRiskScores({
    accountId: ACCOUNT_ID,
    coverageItems: coverage.deptosCobertura,
    gerenciaByDeptId,
  });

  // Sexta real (alertas persistidas) — mismo mapeo que el route.
  const alerts = await prisma.complianceAlert.findMany({
    where: { campaignId: CAMPAIGN_ID, alertType: 'silencio_con_voz_externa' },
    include: { department: { select: { id: true, displayName: true } } },
  } as any);
  const silencioVozExterna = (alerts as any[]).map((a) => ({
    departmentId: a.departmentId,
    departmentName: a.department?.displayName ?? null,
    narrativa: a.description,
    signalsCount: a.signalsCount ?? 0,
  }));

  // OTRO MUNDO real (motor company-scope) — mismo path que el route.
  const otroMundo = detectSilencioConVozExterna(
    await computeOtroMundo(ACCOUNT_ID, CAMPAIGN_ID),
    'no_invitado',
    SILENCIO_PESO_MIN,
  );

  // Minimal ComplianceReportResponse — solo los paths que el builder lee.
  const data = {
    success: true,
    type: 'executive',
    company: { name: 'demo', country: 'CL' },
    narratives: { alertasGenero: [] },
    data: {
      orgISA: coverage.pctCobertura, // irrelevante para el builder
      coverage: {
        pctCobertura: coverage.pctCobertura,
        deptosCobertura: coverage.deptosCobertura,
        silencioConVozExterna: [],
        participacionAnomala: [],
      },
      departments: [],
      convergencia: { departments: [] },
      silencioVozExterna,
      otroMundo,
      riskScores,
    },
  } as unknown as ComplianceReportResponse;

  const acto = buildTriageGroups(data);

  const L = '─'.repeat(72);
  console.log('\n╔══ GATE 2a · TRIAGE — CASO REAL cmob0e56 (render) ══╗\n');
  console.log('EL TRIAGE');
  console.log(`\n   ${acto.hero.number}`);
  console.log(`   ${acto.hero.label}`);
  if (acto.hero.sub) console.log(`   ${acto.hero.sub}`);
  console.log(`\n${L}\nINTRO:\n  ${acto.intro}\n${L}\n`);

  for (const g of acto.groups) {
    console.log(`▸ ${g.kicker}${g.count > 1 ? `   (${g.count})` : ''}`);
    for (const inst of g.instances) {
      console.log(`    ${triageInstanceLine(inst)}`);
    }
    console.log(`    «${g.narrativa}»`);
    console.log(`    ${g.link}\n`);
  }

  console.log(L);
  console.log(`extremosLine: ${acto.extremosLine === null ? 'NO se emite (guard)' : acto.extremosLine}`);
  console.log(`counts: ${JSON.stringify(acto.counts)}`);
  console.log('');
  console.log('═══ DEDUPE Sexta / OTRO MUNDO ═══');
  console.log(`Sexta RAW (${silencioVozExterna.length}): ${silencioVozExterna.map((s) => `${s.departmentName} [${s.departmentId}]`).join(' · ') || '—'}`);
  console.log(`Sexta tras dedupe (${acto.sexta.length}): ${acto.sexta.map((s) => s.departmentName).join(' · ') || '— (banda NO se emite)'}`);
  console.log(`OTRO MUNDO RAW (${otroMundo.length}): ${otroMundo.map((o) => `${o.departmentName} [${o.departmentId}]`).join(' · ') || '—'}`);
  console.log(`OTRO MUNDO tras dedupe (${acto.otroMundo.length}): ${acto.otroMundo.map((o) => o.departmentName).join(' · ') || '— (banda NO se emite)'}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('ERROR:', e?.message ?? e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
