// prisma/scripts/rebuild-compliance-narratives.ts
// Reconstruye SOLO el subcampo `narratives` del ORG resultPayload, usando los
// dept payloads ya persistidos. Cero LLM. Idempotente.
//
// Caso de uso: el diccionario ComplianceNarrativeDictionary se actualizó pero
// las narrativas viejas quedaron cacheadas en BD. Sin recálculo de patrones.
//
// Uso:
//   npm run rebuild:compliance-narratives -- --campaign=<id>             # dry-run
//   npm run rebuild:compliance-narratives -- --campaign=<id> --apply

import { PrismaClient } from '@prisma/client';
import { buildReportNarratives } from '../../src/lib/services/compliance/ComplianceNarrativeEngine';
import type {
  PatronAnalysisOutput,
  MetaAnalysisOutput,
} from '../../src/lib/services/compliance/complianceTypes';
import type { DepartmentSafetyScore } from '../../src/lib/services/SafetyScoreService';
import type { DepartmentConvergencia } from '../../src/lib/services/compliance/ConvergenciaEngine';
import type {
  ReportNarratives,
  DimensionNarrative,
} from '../../src/lib/services/compliance/ComplianceNarrativeEngine';
import type { ComplianceAlertType } from '../../src/config/complianceAlertConfig';

const prisma = new PrismaClient();

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
}

interface NamespacedDeptPayload {
  patrones: PatronAnalysisOutput;
  safetyDetail: DepartmentSafetyScore;
  convergencia: DepartmentConvergencia;
  isa?: number;
}

interface OrgPayloadShape {
  meta: MetaAnalysisOutput | null;
  global: {
    orgSafetyScore: number | null;
    orgISA?: number | null;
    skippedByPrivacy: unknown[];
    activeSourcesGlobal: unknown[];
    criticalByManager: unknown[];
    previousOrgScore: number | null;
    previousCampaignLabel: string | null;
  };
  narratives: ReportNarratives;
}

function isNamespacedDept(p: unknown): p is NamespacedDeptPayload {
  return (
    !!p &&
    typeof p === 'object' &&
    'safetyDetail' in (p as Record<string, unknown>)
  );
}

async function main() {
  const apply = !!parseFlag('apply');
  const campaignFlag = parseFlag('campaign');
  const campaignId = typeof campaignFlag === 'string' ? campaignFlag : undefined;

  if (!campaignId) {
    console.error('Error: falta --campaign=<id>');
    process.exit(1);
  }

  console.log(
    `🔧 Rebuild compliance narratives — campaign=${campaignId} (${apply ? 'APPLY' : 'DRY-RUN'})`
  );
  console.log('');

  // ── 1) Leer ORG row ──────────────────────────────────────────────────────
  const orgRow = await prisma.complianceAnalysis.findFirst({
    where: { campaignId, scope: 'ORG', status: 'COMPLETED' },
  });
  if (!orgRow || !orgRow.resultPayload) {
    console.error('❌ No hay ORG ComplianceAnalysis COMPLETED para esta campaña.');
    process.exit(1);
  }
  const orgPayload = orgRow.resultPayload as unknown as OrgPayloadShape;

  // ── 2) Leer DEPARTMENT rows COMPLETED ────────────────────────────────────
  const deptRows = await prisma.complianceAnalysis.findMany({
    where: { campaignId, scope: 'DEPARTMENT', status: 'COMPLETED' },
    include: { department: { select: { displayName: true } } },
  });

  if (deptRows.length === 0) {
    console.error('❌ No hay DEPARTMENT rows COMPLETED.');
    process.exit(1);
  }

  // ── 3) Reconstruir inputs de buildReportNarratives ───────────────────────
  const safetyScores: DepartmentSafetyScore[] = [];
  const departmentAnalyses: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    payload: PatronAnalysisOutput | null;
    teatroCumplimiento: boolean;
  }> = [];
  const convergencias: DepartmentConvergencia[] = [];

  for (const d of deptRows) {
    const p = d.resultPayload;
    if (!isNamespacedDept(p)) continue;

    safetyScores.push(p.safetyDetail);
    convergencias.push(p.convergencia);
    // Lectura defensiva: payloads pre-deploy del campo no tienen parentDepartmentName.
    const parentDepartmentName =
      typeof (p as Record<string, unknown>).parentDepartmentName === 'string'
        ? ((p as Record<string, unknown>).parentDepartmentName as string)
        : null;
    departmentAnalyses.push({
      departmentName: d.department?.displayName ?? 'Sin nombre',
      parentDepartmentName,
      payload: p.patrones,
      teatroCumplimiento: !!d.teatroCumplimiento,
    });
  }

  // ── 4) Leer alertas ──────────────────────────────────────────────────────
  const alerts = await prisma.complianceAlert.findMany({
    where: { campaignId },
    include: { department: { select: { displayName: true } } },
  });

  // ── 5) Llamar a buildReportNarratives (DETERMINISTA, sin LLM) ────────────
  const fresh = buildReportNarratives({
    orgSafetyScore: orgPayload.global.orgSafetyScore,
    scores: safetyScores,
    departmentAnalyses,
    meta: orgPayload.meta,
    convergencias,
    alertas: alerts.map((a) => ({
      alertType: a.alertType as ComplianceAlertType,
      title: a.title,
      departmentName: a.department?.displayName ?? null,
      severity: a.severity,
      signalsCount: a.signalsCount,
      teatroCumplimiento:
        deptRows.find((d) => d.departmentId === a.departmentId)
          ?.teatroCumplimiento ?? false,
    })),
    previousOrgScore: orgPayload.global.previousOrgScore,
    previousCampaignLabel: orgPayload.global.previousCampaignLabel,
  });

  // ── 6) Diff de narrativas dimensionales ──────────────────────────────────
  const oldDims: DimensionNarrative[] = orgPayload.narratives.artefacto1_dimensiones;
  const newDims: DimensionNarrative[] = fresh.artefacto1_dimensiones;

  console.log('━'.repeat(80));
  console.log('  DIFF — narratives.artefacto1_dimensiones[].narrativa');
  console.log('━'.repeat(80));
  console.log('');

  let changedCount = 0;
  for (const newDim of newDims) {
    const oldDim = oldDims.find((d) => d.dimensionKey === newDim.dimensionKey);
    const changed = oldDim?.narrativa !== newDim.narrativa;
    if (changed) changedCount++;

    const marker = changed ? '🔄' : '✓ ';
    console.log(`${marker}  ${newDim.dimensionKey}  (${newDim.dimensionNombre})`);
    console.log(`    nivel: ${oldDim?.nivel ?? '∅'} → ${newDim.nivel}`);
    console.log('');
    console.log('    ─ ANTES ───────────────────────────────────────');
    console.log(`    ${oldDim?.narrativa ?? '∅'}`);
    console.log('');
    console.log('    ─ DESPUÉS ─────────────────────────────────────');
    console.log(`    ${newDim.narrativa}`);
    console.log('');
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log(`  ${changedCount}/${newDims.length} narrativas cambian.`);
  console.log('━'.repeat(80));
  console.log('');

  // ── 7) Apply o salir ─────────────────────────────────────────────────────
  if (!apply) {
    console.log('💡 Dry-run. Re-ejecuta con --apply para escribir en BD.');
    return;
  }

  if (changedCount === 0) {
    console.log('✓ Nada que actualizar.');
    return;
  }

  const newPayload: OrgPayloadShape = {
    ...orgPayload,
    narratives: fresh,
  };

  await prisma.complianceAnalysis.update({
    where: { id: orgRow.id },
    data: { resultPayload: newPayload as unknown as object },
  });

  console.log(`✅ ORG resultPayload actualizado (id=${orgRow.id}).`);
  console.log('   El próximo GET /api/compliance/report devolverá las narrativas nuevas.');
}

main()
  .catch((err) => {
    console.error('💥 Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
