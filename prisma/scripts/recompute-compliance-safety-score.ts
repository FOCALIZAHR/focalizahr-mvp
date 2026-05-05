// prisma/scripts/recompute-compliance-safety-score.ts
//
// Recomputa el SafetyScore de una campaña Ambiente Sano usando la fórmula
// vigente de SafetyScoreService (post-refactor 2026-05-05: promedio simple
// en lugar de pesos arbitrarios).
//
// Uso:
//   npm run recompute:compliance-safety -- --campaign=<id>             # dry-run
//   npm run recompute:compliance-safety -- --campaign=<id> --apply
//
// Qué actualiza (solo en --apply):
//   • ComplianceAnalysis.safetyScore (columna) por dept y ORG.
//   • ComplianceAnalysis.resultPayload.safetyDetail (JSON) por dept.
//   • ComplianceAnalysis.resultPayload.global.orgSafetyScore (JSON) en ORG.
//
// Qué NO actualiza:
//   • patrones LLM (no dependen de safetyScore).
//   • teatroCumplimiento (depende de safetyScore Y patrones LLM — drift posible
//     en deptos cerca del threshold 4.0; recomendado re-drain del orchestrator
//     si se detectan casos límite).
//   • convergencia.signals.ambiente (referencia stale a safetyScore viejo).
//   • narrativas (correr `npm run rebuild:compliance-narratives` después).
//   • isaScore (correr re-drain si querés ISA actualizado).
//
// Backup: antes de cualquier UPDATE persiste el snapshot completo de los rows
// modificados en prisma/backups/safety-score-recompute-<campaignId>-<ISO>.json.

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  calculateSafetyScores,
  type DepartmentSafetyScore,
} from '../../src/lib/services/SafetyScoreService';

const prisma = new PrismaClient();

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
}

interface DeptDiff {
  rowId: string;
  departmentId: string;
  departmentName: string;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
  newDetail: DepartmentSafetyScore;
}

interface OrgDiff {
  rowId: string;
  oldScore: number | null;
  newScore: number | null;
  delta: number | null;
}

function fmtScore(value: number | null): string {
  if (value === null) return 'null';
  return value.toFixed(3);
}

function fmtDelta(delta: number | null): string {
  if (delta === null) return '   —  ';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(3)}`;
}

async function main() {
  const apply = !!parseFlag('apply');
  const campaignFlag = parseFlag('campaign');
  const campaignId = typeof campaignFlag === 'string' ? campaignFlag : undefined;

  if (!campaignId) {
    console.error('❌ Falta --campaign=<id>');
    process.exit(1);
  }

  console.log(
    `🔧 Recompute safety_score — campaign=${campaignId} (${apply ? 'APPLY' : 'DRY-RUN'})`
  );
  console.log('');

  // ── 1) Validar campaña + obtener accountId ──────────────────────────────
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      accountId: true,
      campaignType: { select: { slug: true } },
    },
  });
  if (!campaign) {
    console.error(`❌ Campaña ${campaignId} no encontrada.`);
    process.exit(1);
  }
  if (campaign.campaignType.slug !== 'pulso-ambientes-sanos') {
    console.error(
      `❌ Campaña no es de tipo Ambiente Sano (slug=${campaign.campaignType.slug}).`
    );
    process.exit(1);
  }

  console.log(`📋 Campaña: ${campaign.name}`);
  console.log(`   accountId: ${campaign.accountId}`);
  console.log('');

  // ── 2) Leer ComplianceAnalysis rows COMPLETED (DEPT + ORG) ──────────────
  const rows = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId,
      accountId: campaign.accountId,
      status: 'COMPLETED',
    },
    include: { department: { select: { id: true, displayName: true } } },
  });

  const deptRows = rows.filter((r) => r.scope === 'DEPARTMENT');
  const orgRow = rows.find((r) => r.scope === 'ORG');

  if (deptRows.length === 0) {
    console.error('❌ No hay DEPARTMENT rows COMPLETED.');
    process.exit(1);
  }
  if (!orgRow) {
    console.error('❌ No hay ORG row COMPLETED.');
    process.exit(1);
  }

  console.log(`📊 Rows encontrados: ${deptRows.length} dept + 1 ORG`);
  console.log('');

  // ── 3) Recomputar con la fórmula nueva ──────────────────────────────────
  const fresh = await calculateSafetyScores(campaignId, campaign.accountId);

  const freshByDeptId = new Map(fresh.departments.map((d) => [d.departmentId, d]));

  // ── 4) Build diff per dept ──────────────────────────────────────────────
  const deptDiffs: DeptDiff[] = [];
  const noChangeDepts: string[] = [];
  const skippedDepts: string[] = [];

  for (const row of deptRows) {
    if (!row.departmentId) continue;
    const newDept = freshByDeptId.get(row.departmentId);
    if (!newDept) {
      // Dept presente en BD pero recompute lo skipea (privacy threshold ahora?)
      skippedDepts.push(row.department?.displayName ?? row.departmentId);
      continue;
    }
    const oldScore = row.safetyScore;
    const newScore = newDept.safetyScore;
    const delta = oldScore !== null ? newScore - oldScore : null;

    if (oldScore !== null && Math.abs(newScore - oldScore) < 0.001) {
      noChangeDepts.push(newDept.departmentName);
      continue;
    }

    deptDiffs.push({
      rowId: row.id,
      departmentId: row.departmentId,
      departmentName: newDept.departmentName,
      oldScore,
      newScore,
      delta,
      newDetail: newDept,
    });
  }

  // Sort por |delta| descendente para legibilidad
  deptDiffs.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));

  // ── 5) Diff ORG ─────────────────────────────────────────────────────────
  const orgDiff: OrgDiff = {
    rowId: orgRow.id,
    oldScore: orgRow.safetyScore,
    newScore: fresh.orgScore,
    delta:
      orgRow.safetyScore !== null && fresh.orgScore !== null
        ? fresh.orgScore - orgRow.safetyScore
        : null,
  };

  // ── 6) Reporte ──────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DIFF — Safety Score (promedio ponderado → promedio simple)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Departamentos con cambio:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(
    `${'Dept'.padEnd(28)} ${'n'.padStart(3)}  ${'Old'.padStart(7)}  ${'New'.padStart(7)}  ${'Δ'.padStart(7)}`
  );
  console.log('───────────────────────────────────────────────────────────────');

  if (deptDiffs.length === 0) {
    console.log('  (ninguno — todos los safetyScore son idénticos)');
  } else {
    for (const d of deptDiffs) {
      console.log(
        `${d.departmentName.padEnd(28).slice(0, 28)} ${String(d.newDetail.respondentCount).padStart(3)}  ${fmtScore(d.oldScore).padStart(7)}  ${fmtScore(d.newScore).padStart(7)}  ${fmtDelta(d.delta).padStart(7)}`
      );
    }
  }

  if (noChangeDepts.length > 0) {
    console.log('');
    console.log(
      `Sin cambio (Δ<0.001): ${noChangeDepts.length} dept(s) — ${noChangeDepts.join(', ')}`
    );
  }
  if (skippedDepts.length > 0) {
    console.log('');
    console.log(
      `⚠️  Dept en BD que el recompute ahora skipea: ${skippedDepts.join(', ')}`
    );
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(
    `${'ORG'.padEnd(28)} ${'   '} ${fmtScore(orgDiff.oldScore).padStart(7)}  ${fmtScore(orgDiff.newScore).padStart(7)}  ${fmtDelta(orgDiff.delta).padStart(7)}`
  );
  console.log('───────────────────────────────────────────────────────────────');
  console.log('');

  if (!apply) {
    console.log('🟡 DRY-RUN — sin cambios persistidos.');
    console.log('');
    console.log('Para aplicar:');
    console.log(
      `   npm run recompute:compliance-safety -- --campaign=${campaignId} --apply`
    );
    console.log('');
    console.log('Después de aplicar (recomendado):');
    console.log(
      `   npm run rebuild:compliance-narratives -- --campaign=${campaignId} --apply`
    );
    return;
  }

  // ── 7) Backup antes de UPDATE ───────────────────────────────────────────
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(
    backupsDir,
    `safety-score-recompute-${campaignId}-${ts}.json`
  );

  const backupPayload = {
    campaignId,
    accountId: campaign.accountId,
    timestamp: new Date().toISOString(),
    formula: 'pre-refactor (weighted) → post-refactor (simple average)',
    rows: rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      departmentId: r.departmentId,
      safetyScore: r.safetyScore,
      resultPayload: r.resultPayload,
    })),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
  console.log(`💾 Backup: ${backupPath}`);
  console.log('');

  // ── 8) Apply per dept ───────────────────────────────────────────────────
  console.log('🔧 Aplicando cambios...');

  let updatedDepts = 0;
  for (const d of deptDiffs) {
    const row = deptRows.find((r) => r.id === d.rowId);
    if (!row) continue;

    const currentPayload = (row.resultPayload ?? {}) as Record<string, unknown>;
    const newPayload = {
      ...currentPayload,
      safetyDetail: d.newDetail,
    };

    await prisma.complianceAnalysis.update({
      where: { id: d.rowId },
      data: {
        safetyScore: d.newScore,
        resultPayload: newPayload as unknown as object,
      },
    });
    updatedDepts += 1;
  }
  console.log(`   ${updatedDepts} dept row(s) actualizados.`);

  // ── 9) Apply ORG ────────────────────────────────────────────────────────
  if (orgDiff.delta !== null && Math.abs(orgDiff.delta) >= 0.001) {
    const orgPayload = (orgRow.resultPayload ?? {}) as Record<string, unknown>;
    const orgGlobal = (orgPayload.global ?? {}) as Record<string, unknown>;
    const newOrgPayload = {
      ...orgPayload,
      global: {
        ...orgGlobal,
        orgSafetyScore: orgDiff.newScore,
      },
    };

    await prisma.complianceAnalysis.update({
      where: { id: orgRow.id },
      data: {
        safetyScore: orgDiff.newScore,
        resultPayload: newOrgPayload as unknown as object,
      },
    });
    console.log(`   1 ORG row actualizado.`);
  } else {
    console.log(`   ORG sin cambio (Δ<0.001).`);
  }

  console.log('');
  console.log('✅ APPLY completado.');
  console.log('');
  console.log('Próximo paso (regenerar narrativas con scores actualizados):');
  console.log(
    `   npm run rebuild:compliance-narratives -- --campaign=${campaignId} --apply`
  );
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
