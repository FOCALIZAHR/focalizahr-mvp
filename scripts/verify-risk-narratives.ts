// scripts/verify-risk-narratives.ts
// Verificación read-only del DepartmentRiskNarrativeDictionary sobre cmob0e56*.
// No persiste nada — solo lee, resuelve la narrativa y muestra la tabla.
//
// Adicionalmente: caso sintético del 5to branch (con_isa + pesoAlertas > 0 →
// null) para confirmar que el ajuste de CONFIABLE viaja probado.

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { computeCoverageAnalysis } from '../src/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '../src/lib/services/compliance/DepartmentRiskScoreService';
import { resolveDepartmentRiskNarrative } from '../src/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import type { DepartmentRiskScore } from '../src/types/compliance';

function snippet(s: string, n = 70): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

async function main() {
  // 1. Resolver campaña.
  const campaign = await prisma.campaign.findFirst({
    where: { id: { startsWith: 'cmob0e56' } },
    select: { id: true, name: true, accountId: true },
  });
  if (!campaign) {
    console.error('Campaña con prefijo cmob0e56 no encontrada.');
    process.exit(1);
  }
  console.log(`Campaign: ${campaign.id}  "${campaign.name}"`);
  console.log('');

  // 2. Coverage → risk scores → narrativas.
  const coverage = await computeCoverageAnalysis(campaign.id, campaign.accountId);
  const scores = await computeDepartmentRiskScores({
    accountId: campaign.accountId,
    coverageItems: coverage.deptosCobertura,
  });

  // 3. Tabla por dept.
  const rows = scores.map((s) => {
    let exit = 0;
    let onb = 0;
    for (const a of s.alertas) {
      if (a.producto === 'exit') exit += a.pesoEfectivo;
      else onb += a.pesoEfectivo;
    }
    const narrative = resolveDepartmentRiskNarrative(s);
    return {
      depto: s.departmentName,
      bucket: s.bucket,
      pesoA: s.inputs.pesoAlertas,
      exit,
      onb,
      denun: s.inputs.denuncias_12m === null ? 'null' : String(s.inputs.denuncias_12m),
      state: narrative?.state ?? 'NULL',
      rama: narrative?.rama ?? '—',
      narrativa: narrative ? snippet(narrative.narrativa) : '— (sin string en este motor)',
    };
  });

  // Orden: FUEGO > HUMO > PUNTO_CIEGO > CONFIABLE > NULL.
  const stateOrder: Record<string, number> = {
    FUEGO: 0,
    HUMO: 1,
    PUNTO_CIEGO: 2,
    CONFIABLE: 3,
    NULL: 4,
  };
  rows.sort((a, b) => (stateOrder[a.state] ?? 9) - (stateOrder[b.state] ?? 9));
  console.table(rows);

  // 4. Output completo de un HUMO (Cultura) y un PUNTO_CIEGO.
  const humo = scores.find((s) => s.departmentName.toLowerCase().includes('cultura'));
  const humoComercial = scores.find((s) => s.departmentName === 'Gerencia Comercial');
  const ciego = scores.find((s) => s.departmentName === 'RRHH');

  for (const [label, s] of [
    ['HUMO · Subgerencia Cultura y DO', humo],
    ['HUMO · Gerencia Comercial', humoComercial],
    ['PUNTO CIEGO · RRHH', ciego],
  ] as Array<[string, DepartmentRiskScore | undefined]>) {
    if (!s) continue;
    console.log('');
    console.log(`=== ${label} ===`);
    console.log(JSON.stringify(resolveDepartmentRiskNarrative(s), null, 2));
  }

  // 4.b Dump del alertas[] crudo de los HUMO — para ver el alertType de cada peso.
  for (const [label, s] of [
    ['Subgerencia Cultura y DO', humo],
    ['Gerencia Comercial', humoComercial],
  ] as Array<[string, DepartmentRiskScore | undefined]>) {
    if (!s) continue;
    console.log('');
    console.log(`=== alertas[] crudo · ${label} (pesoAlertas=${s.inputs.pesoAlertas}) ===`);
    console.table(s.alertas);
  }

  // 5. CASOS SINTÉTICOS — ramas que el dataset real no ejercita.
  console.log('');
  console.log('═══ CASOS SINTÉTICOS ═══');

  type SyntheticCase = {
    label: string;
    riskScore: DepartmentRiskScore;
    expectedState: 'FUEGO' | 'HUMO' | 'PUNTO_CIEGO' | 'CONFIABLE' | 'NULL';
    expectedRama?: 'A' | 'B' | 'A-legal';
  };

  const baseChip = {
    confiabilidad: 50,
    voz_externa: 25,
    piso_denuncia: 0,
  };

  const cases: SyntheticCase[] = [
    // (0) Branch del fix de CONFIABLE — con_isa + alertas activas sin denuncia.
    {
      label: '(0) con_isa + pesoAlertas > 0 sin denuncia → null',
      expectedState: 'NULL',
      riskScore: {
        departmentId: 'synth-0',
        departmentName: 'Depto Sintético 0',
        score: 35,
        bucket: 'con_isa',
        drivers: { confiabilidad: 10, voz_externa: 25, piso_denuncia: 0 },
        reason: 'suma',
        inputs: { participacion: 70, pesoAlertas: 2, denuncias_12m: null },
        alertas: [
          { alertType: 'toxic_exit_detected', producto: 'exit', pesoEfectivo: 2 },
        ],
      },
    },
    // (a) HUMO con ley_karin peso 2 + nps_critico peso 1 → A-legal (no A).
    //     Exit domina (3 vs 0) — sin priority Karin daría 'A'. Priority gana.
    {
      label: '(a) HUMO + ley_karin peso 2 + nps_critico peso 1 → A-legal',
      expectedState: 'HUMO',
      expectedRama: 'A-legal',
      riskScore: {
        departmentId: 'synth-a',
        departmentName: 'Depto Sintético A',
        score: 75,
        bucket: 'sub_threshold',
        drivers: { ...baseChip },
        reason: 'suma',
        inputs: { participacion: 0, pesoAlertas: 3, denuncias_12m: null },
        alertas: [
          { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 2 },
          { alertType: 'nps_critico', producto: 'exit', pesoEfectivo: 1 },
        ],
      },
    },
    // (b) HUMO + ley_karin con peso 0 (no qualifica) + nps_critico peso 3 → A.
    //     Confirma el guard `pesoEfectivo > 0` del 2a.
    {
      label: '(b) HUMO + ley_karin peso 0 + nps_critico peso 3 → A (no A-legal)',
      expectedState: 'HUMO',
      expectedRama: 'A',
      riskScore: {
        departmentId: 'synth-b',
        departmentName: 'Depto Sintético B',
        score: 75,
        bucket: 'sub_threshold',
        drivers: { ...baseChip },
        reason: 'suma',
        inputs: { participacion: 0, pesoAlertas: 3, denuncias_12m: null },
        alertas: [
          { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 0 },
          { alertType: 'nps_critico', producto: 'exit', pesoEfectivo: 3 },
        ],
      },
    },
    // (c) HUMO + ley_karin exit peso 1 + CONFUSION_ROL onboarding peso 5 → A-legal.
    //     Onboarding domina 5>1 — sin priority Karin daría 'B'. Priority gana.
    //     Es la rama que ni Comercial ni (a)/(b) ejercitan.
    {
      label: '(c) HUMO + ley_karin peso 1 + onboarding peso 5 → A-legal (priority gana sobre split)',
      expectedState: 'HUMO',
      expectedRama: 'A-legal',
      riskScore: {
        departmentId: 'synth-c',
        departmentName: 'Depto Sintético C',
        score: 75,
        bucket: 'sub_threshold',
        drivers: { ...baseChip },
        reason: 'suma',
        inputs: { participacion: 0, pesoAlertas: 6, denuncias_12m: null },
        alertas: [
          { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 1 },
          { alertType: 'CONFUSION_ROL', producto: 'onboarding', pesoEfectivo: 5 },
        ],
      },
    },
  ];

  let failures = 0;
  for (const c of cases) {
    const result = resolveDepartmentRiskNarrative(c.riskScore);
    const actualState = result?.state ?? 'NULL';
    const actualRama = result?.rama ?? undefined;
    const stateOK = actualState === c.expectedState;
    const ramaOK = (c.expectedRama ?? undefined) === actualRama;
    const pass = stateOK && ramaOK;
    if (!pass) failures += 1;
    console.log('');
    console.log(`${pass ? '✓' : '✗'} ${c.label}`);
    console.log(
      `  esperado: state=${c.expectedState}${c.expectedRama ? ` rama=${c.expectedRama}` : ''}`,
    );
    console.log(
      `  obtenido: state=${actualState}${actualRama ? ` rama=${actualRama}` : ''}`,
    );
  }
  console.log('');
  console.log(
    failures === 0
      ? `✓ Los ${cases.length} casos sintéticos pasaron.`
      : `✗ FALLO — ${failures} de ${cases.length} casos sintéticos fallaron.`,
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
