// scripts/gate2-triage-rollup-cmob0e56.ts
// Gate 2 (Triage) — extracción READ-ONLY del rollup real por gerencia para
// cmob0e56. Replica el path del route (computeCoverageAnalysis +
// gerenciaByDeptId + computeDepartmentRiskScores) y resuelve la lectura del
// peor dept por gerencia. CERO escritura, cero mutación.
//
// Run: npx tsx scripts/gate2-triage-rollup-cmob0e56.ts

import { prisma } from '@/lib/prisma';
import { computeCoverageAnalysis } from '@/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '@/lib/services/compliance/DepartmentRiskScoreService';
import { resolveDepartmentRiskNarrative } from '@/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import type { DepartmentRiskScore } from '@/types/compliance';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';

async function main() {
  // 1. Coverage (deptosCobertura = coverageItems para riskScores).
  const coverage = await computeCoverageAnalysis(CAMPAIGN_ID, ACCOUNT_ID);

  // 2. gerenciaByDeptId — bloque verbatim del route (dept→gerencia level 2).
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

  // 3. riskScores (per-dept, con parentGerenciaId/Name).
  const riskScores = await computeDepartmentRiskScores({
    accountId: ACCOUNT_ID,
    coverageItems: coverage.deptosCobertura,
    gerenciaByDeptId,
  });

  // 4. Hero (coverageGapPct, dept-level) vs intro (personResponseRate, person-level).
  const coverageGapPct = 100 - coverage.pctCobertura;
  let inv = 0;
  let resp = 0;
  for (const c of coverage.deptosCobertura) {
    inv += c.invited;
    resp += c.responded;
  }
  const personResponseRate = inv > 0 ? Math.round((resp / inv) * 100) : null;

  // 5. Agrupar riskScores por gerencia (parentGerenciaId; standalone si null).
  const groups = new Map<string, { name: string; children: DepartmentRiskScore[] }>();
  for (const rs of riskScores) {
    const key = rs.parentGerenciaId ?? `__dept__:${rs.departmentId}`;
    const name = rs.parentGerenciaName ?? rs.departmentName;
    if (!groups.has(key)) groups.set(key, { name, children: [] });
    groups.get(key)!.children.push(rs);
  }

  // 6. Por gerencia: peor dept (maxScore) + lectura + composición.
  const rows = [...groups.values()].map((g) => {
    const worst = g.children.reduce((a, b) => (b.score > a.score ? b : a));
    const reading = resolveDepartmentRiskNarrative(worst);
    return {
      gerencia: g.name,
      nChildren: g.children.length,
      maxScore: worst.score,
      worstDept: worst.departmentName,
      via: g.children.length > 1, // exigencia render: "vía {worstDept}"
      bucket: worst.bucket,
      drivers: worst.drivers, // confiabilidad (silencio) · voz_externa (señales) · piso_denuncia
      denuncias_12m: worst.inputs.denuncias_12m,
      pesoAlertas: worst.inputs.pesoAlertas,
      lectura: reading ? `${reading.state}${reading.rama ? '/' + reading.rama : ''}` : 'null (con_isa+alertas)',
    };
  });
  rows.sort((a, b) => b.maxScore - a.maxScore);

  console.log('═══ HERO / INTRO ═══');
  console.log(`coverageGapPct (hero, dept-level) = ${coverageGapPct}%`);
  console.log(`personResponseRate (intro, person-level) = ${personResponseRate}%  (resp ${resp} / inv ${inv})`);
  console.log(`pctCobertura = ${coverage.pctCobertura} · deptosConVoz ${coverage.deptosConVoz}/${coverage.totalDeptos}`);
  console.log('');
  console.log('═══ ROLLUP POR GERENCIA (peor dept) ═══');
  for (const r of rows) {
    console.log(
      `• ${r.gerencia}  ·  ${r.maxScore}  ·  lectura=${r.lectura}  ·  bucket=${r.bucket}` +
        `\n    drivers: confiabilidad(silencio)=${r.drivers.confiabilidad} · voz_externa(señales)=${r.drivers.voz_externa} · piso_denuncia=${r.drivers.piso_denuncia}` +
        `\n    denuncias_12m=${r.denuncias_12m} · pesoAlertas=${r.pesoAlertas} · nChildren=${r.nChildren}` +
        (r.via ? ` · VÍA ${r.worstDept}` : ' · (1 dept / standalone)'),
    );
  }
  console.log('');
  console.log('═══ SEXTA / OTRO MUNDO (coverage) ═══');
  console.log(`silencioConVozExterna: ${JSON.stringify(coverage.silencioConVozExterna)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('ERROR:', e?.message ?? e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
