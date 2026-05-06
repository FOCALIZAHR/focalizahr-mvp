// prisma/scripts/backfill-convergencia-subobjetos.ts
//
// Regenera los sub-objetos del motor v2 (convergenciaInterna + convergenciaExterna
// + nivelFinal) en `result_payload.convergencia` para campañas Ambiente Sano
// COMPLETED cerradas ANTES de los commits que los introdujeron:
//   - 2b08d38 (Fase 1 Motor A — convergenciaInterna)
//   - 872856f (Fase 2 Motor B — convergenciaExterna)
//   - 5089e54 (Fase 4 — nivelFinal)
//
// El orchestrator nunca actualiza retroactivamente rows COMPLETED. Sin este
// script, la UI v2 (que asume el shape completo) crasheaba con campañas
// históricas. La defensa frontend (helpers.ts) previene el crash, pero los
// hallazgos del motor v2 sobre campañas legacy no se mostraban — este script
// regenera el JSON para que el frontend muestre los hallazgos reales.
//
// Uso:
//   npm run backfill:convergencia-subobjetos -- --campaign=<id>             # dry-run 1 campaña
//   npm run backfill:convergencia-subobjetos -- --campaign=<id> --apply    # apply 1 campaña
//   npm run backfill:convergencia-subobjetos -- --all                       # dry-run todas
//   npm run backfill:convergencia-subobjetos -- --all --apply              # apply todas
//
// NO llama al LLM — reutiliza patrones ya persistidos.
// Backup obligatorio antes de cualquier UPDATE.
// Idempotente: si convergenciaInterna ya existe, skip.

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadDepartmentExternalSignals,
  loadDepartmentExternalAlerts,
  buildDepartmentConvergencia,
  buildGlobalConvergencia,
  applyA4ToDepartments,
  type DepartmentConvergencia,
} from '../../src/lib/services/compliance/ConvergenciaEngine';
import type {
  PatronAnalysisOutput,
} from '../../src/lib/services/compliance/complianceTypes';
import type { DepartmentSafetyScore } from '../../src/lib/services/SafetyScoreService';

const prisma = new PrismaClient();

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
}

interface CampaignToProcess {
  id: string;
  name: string;
  accountId: string;
}

interface DeptRowSummary {
  rowId: string;
  departmentId: string;
  departmentName: string;
  hadInterna: boolean;
  hadExterna: boolean;
  hadNivelFinal: boolean;
  rebuiltConvergencia?: DepartmentConvergencia;
}

async function listCampaigns(opts: {
  campaignId?: string;
  all: boolean;
}): Promise<CampaignToProcess[]> {
  if (opts.campaignId) {
    const c = await prisma.campaign.findUnique({
      where: { id: opts.campaignId },
      select: {
        id: true,
        name: true,
        accountId: true,
        campaignType: { select: { slug: true } },
      },
    });
    if (!c) {
      console.error(`❌ Campaña ${opts.campaignId} no encontrada.`);
      process.exit(1);
    }
    if (c.campaignType.slug !== 'pulso-ambientes-sanos') {
      console.error(
        `❌ Campaña no es Ambiente Sano (slug=${c.campaignType.slug}).`
      );
      process.exit(1);
    }
    return [{ id: c.id, name: c.name, accountId: c.accountId }];
  }

  if (opts.all) {
    const campaigns = await prisma.campaign.findMany({
      where: {
        campaignType: { slug: 'pulso-ambientes-sanos' },
        complianceAnalyses: { some: { scope: 'DEPARTMENT', status: 'COMPLETED' } },
      },
      select: { id: true, name: true, accountId: true },
      orderBy: { endDate: 'desc' },
    });
    return campaigns;
  }

  console.error('❌ Falta --campaign=<id> o --all');
  process.exit(1);
}

async function processCampaign(
  campaign: CampaignToProcess,
  apply: boolean,
  backupsDir: string
): Promise<{ processed: number; skipped: number; updated: number }> {
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`📋 Campaña: ${campaign.name} (${campaign.id})`);
  console.log(`   accountId: ${campaign.accountId}`);

  const deptRows = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId: campaign.id,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
    },
    include: {
      department: {
        select: {
          id: true,
          displayName: true,
          parentId: true,
          accumulatedExoScore: true,
        },
      },
    },
  });

  if (deptRows.length === 0) {
    console.log('   (sin DEPT rows COMPLETED, skip)');
    return { processed: 0, skipped: 0, updated: 0 };
  }

  // Detectar quién necesita rebuild
  const summaries: DeptRowSummary[] = [];
  let needRebuild = 0;
  for (const r of deptRows) {
    const payload = (r.resultPayload ?? {}) as Record<string, unknown>;
    const conv = payload.convergencia as Record<string, unknown> | undefined;
    const hadInterna = !!conv?.convergenciaInterna;
    const hadExterna = !!conv?.convergenciaExterna;
    const hadNivelFinal = !!conv?.nivelFinal;
    if (!r.departmentId || !r.department) continue;

    summaries.push({
      rowId: r.id,
      departmentId: r.departmentId,
      departmentName: r.department.displayName,
      hadInterna,
      hadExterna,
      hadNivelFinal,
    });
    if (!hadInterna || !hadExterna || !hadNivelFinal) needRebuild++;
  }

  console.log(
    `   ${deptRows.length} DEPT rows · ${needRebuild} requieren rebuild`
  );

  if (needRebuild === 0) {
    console.log('   ✓ todos los rows ya tienen los sub-objetos. Skip.');
    return { processed: deptRows.length, skipped: deptRows.length, updated: 0 };
  }

  // Backup ANTES de cualquier mutación
  if (apply) {
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      backupsDir,
      `convergencia-subobjetos-${campaign.id}-${ts}.json`
    );
    const backupPayload = {
      campaignId: campaign.id,
      accountId: campaign.accountId,
      timestamp: new Date().toISOString(),
      rows: deptRows.map((r) => ({
        id: r.id,
        departmentId: r.departmentId,
        resultPayload: r.resultPayload,
      })),
    };
    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`   💾 Backup: ${path.basename(backupPath)}`);
  }

  // Reconstruir convergencia per dept
  const reconstructedDepts: DepartmentConvergencia[] = [];
  for (let i = 0; i < deptRows.length; i++) {
    const r = deptRows[i];
    if (!r.departmentId || !r.department) continue;
    const summary = summaries[i];
    if (!summary) continue;

    // Lectura defensiva del JSON persistido
    const payload = (r.resultPayload ?? {}) as Record<string, unknown>;
    const patronesOutput = (payload.patrones ?? null) as PatronAnalysisOutput | null;
    const safetyDetail = (payload.safetyDetail ?? null) as DepartmentSafetyScore | null;

    if (!patronesOutput || !safetyDetail) {
      console.log(
        `      ⚠️  ${summary.departmentName}: payload incompleto (patrones=${!!patronesOutput}, safetyDetail=${!!safetyDetail}). Skip.`
      );
      continue;
    }

    // Inputs externos (queries a Department + ExitAlert + JourneyAlert)
    const externalSignals = await loadDepartmentExternalSignals(
      r.departmentId,
      campaign.accountId,
      r.department.accumulatedExoScore
    );
    const externalAlerts = await loadDepartmentExternalAlerts(
      r.departmentId,
      campaign.accountId
    );

    // Reconstrucción con todos los inputs disponibles
    const conv = buildDepartmentConvergencia({
      departmentId: r.departmentId,
      departmentName: r.department.displayName,
      managerId: r.department.parentId,
      safetyScore: safetyDetail.safetyScore,
      patrones: patronesOutput.patrones ?? [],
      externalSignals,
      isaScore: r.isaScore,
      dimensionScores: safetyDetail.dimensionScores,
      patronesOutput,
      teatroCumplimiento: !!r.teatroCumplimiento,
      externalAlerts,
    });
    reconstructedDepts.push(conv);
    summary.rebuiltConvergencia = conv;
  }

  // A4 cross-dept patch
  const isaByDeptId = new Map<string, number>();
  for (const r of deptRows) {
    if (r.departmentId && r.isaScore !== null) {
      isaByDeptId.set(r.departmentId, r.isaScore);
    }
  }
  const globals = buildGlobalConvergencia(reconstructedDepts, isaByDeptId);
  const deptsConA4 = applyA4ToDepartments(reconstructedDepts, globals.criticalByManager);

  // Reporte detallado
  console.log('   Diff:');
  for (const summary of summaries) {
    const final = deptsConA4.find(
      (d) => d.departmentId === summary.departmentId
    );
    if (!final) {
      console.log(`      · ${summary.departmentName}: sin reconstrucción (skip)`);
      continue;
    }
    const flags: string[] = [];
    if (final.convergenciaInterna.casosActivos.length > 0) {
      flags.push(`casos=[${final.convergenciaInterna.casosActivos.join(',')}]`);
    }
    if (final.convergenciaInterna.enCriticalByManagerGroup) flags.push('A4');
    if (final.convergenciaExterna.scoreTotal > 0) {
      flags.push(`extScore=${final.convergenciaExterna.scoreTotal.toFixed(1)}`);
    }
    if (final.convergenciaExterna.fallaCicloDeVida) flags.push('CICLO_VIDA');
    console.log(
      `      · ${summary.departmentName.padEnd(22)} ` +
        `nivelFinal=${final.nivelFinal.padEnd(16)} ` +
        `[${flags.join(' ') || '—'}]`
    );
  }

  if (!apply) {
    console.log('   🟡 DRY-RUN — sin cambios persistidos.');
    return { processed: deptRows.length, skipped: 0, updated: 0 };
  }

  // Persistir cada row
  let updated = 0;
  for (const r of deptRows) {
    if (!r.departmentId) continue;
    const final = deptsConA4.find((d) => d.departmentId === r.departmentId);
    if (!final) continue;

    const currentPayload = (r.resultPayload ?? {}) as Record<string, unknown>;
    const newPayload = {
      ...currentPayload,
      convergencia: final,
    };
    await prisma.complianceAnalysis.update({
      where: { id: r.id },
      data: { resultPayload: newPayload as unknown as object },
    });
    updated++;
  }
  console.log(`   ✅ ${updated} rows actualizados.`);

  return { processed: deptRows.length, skipped: 0, updated };
}

async function main() {
  const apply = !!parseFlag('apply');
  const all = !!parseFlag('all');
  const campaignFlag = parseFlag('campaign');
  const campaignId = typeof campaignFlag === 'string' ? campaignFlag : undefined;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(
    `  Backfill convergencia sub-objetos (${apply ? 'APPLY' : 'DRY-RUN'})`
  );
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const campaigns = await listCampaigns({ campaignId, all });
  console.log(`📋 ${campaigns.length} campaña(s) Ambiente Sano a procesar.`);
  console.log('');

  const backupsDir = path.join(__dirname, '..', 'backups');

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalUpdated = 0;

  for (const c of campaigns) {
    const r = await processCampaign(c, apply, backupsDir);
    totalProcessed += r.processed;
    totalSkipped += r.skipped;
    totalUpdated += r.updated;
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  TOTAL: ${totalProcessed} rows · ${totalSkipped} skipped · ${totalUpdated} updated`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (!apply) {
    console.log('');
    console.log('Para aplicar:');
    if (campaignId) {
      console.log(
        `   npm run backfill:convergencia-subobjetos -- --campaign=${campaignId} --apply`
      );
    } else {
      console.log(
        `   npm run backfill:convergencia-subobjetos -- --all --apply`
      );
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
