// prisma/scripts/backfill-compliance-namespaced-payloads.ts
// Migra resultPayload planos (pre-namespaces) al shape nuevo:
//   DEPARTMENT: { patrones, safetyDetail, convergencia }
//   ORG:        resetea a PENDING para que el drain lo regenere con namespaces
//
// Solo toca DEPT rows cuyo payload NO tiene 'safetyDetail'. Idempotente.
// NO llama al LLM — reutiliza patrones ya persistidos por el Orchestrator.
//
// Uso:
//   npm run backfill:compliance-namespaced -- --campaign=<id>             # dry-run
//   npm run backfill:compliance-namespaced -- --campaign=<id> --apply

import { PrismaClient } from '@prisma/client';
import {
  calculateSafetyScoreForDepartment,
} from '../../src/lib/services/SafetyScoreService';
import {
  loadDepartmentExternalSignals,
  buildDepartmentConvergencia,
} from '../../src/lib/services/compliance/ConvergenciaEngine';
import type { PatronAnalysisOutput } from '../../src/lib/services/compliance/complianceTypes';

const prisma = new PrismaClient();

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
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
    `🔧 Backfill namespaced payloads — campaign=${campaignId} (${apply ? 'APPLY' : 'DRY-RUN'})`
  );
  console.log('');

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId },
    include: { campaignType: { select: { slug: true } } },
  });
  if (!campaign) {
    console.error('Campaña no encontrada.');
    process.exit(1);
  }
  if (campaign.campaignType.slug !== 'pulso-ambientes-sanos') {
    console.error(`Campaña no es pulso-ambientes-sanos (slug=${campaign.campaignType.slug}).`);
    process.exit(1);
  }

  const accountId = campaign.accountId;

  // 1. DEPT rows COMPLETED.
  const deptRows = await prisma.complianceAnalysis.findMany({
    where: { campaignId, scope: 'DEPARTMENT', status: 'COMPLETED' },
    include: {
      department: {
        select: { id: true, displayName: true, parentId: true, accumulatedExoScore: true },
      },
    },
  });

  // 2. ORG row (para reset).
  const orgRow = await prisma.complianceAnalysis.findFirst({
    where: { campaignId, scope: 'ORG' },
  });

  console.log(`DEPT rows COMPLETED: ${deptRows.length}`);
  console.log(`ORG row: ${orgRow ? `${orgRow.id} (status=${orgRow.status})` : 'no existe'}`);
  console.log('');

  // Clasificar DEPTs por estructura de payload.
  interface Analysis {
    id: string;
    deptName: string;
    deptId: string;
    status: 'needs-migration' | 'already-namespaced' | 'no-payload' | 'no-department';
    hasPatrones: boolean;
  }
  const analyses: Analysis[] = deptRows.map((d) => {
    if (!d.departmentId || !d.department) {
      return { id: d.id, deptName: '(sin depto)', deptId: '', status: 'no-department', hasPatrones: false };
    }
    if (!d.resultPayload || typeof d.resultPayload !== 'object') {
      return {
        id: d.id,
        deptName: d.department.displayName,
        deptId: d.departmentId,
        status: 'no-payload',
        hasPatrones: false,
      };
    }
    const payload = d.resultPayload as Record<string, unknown>;
    if ('safetyDetail' in payload && 'convergencia' in payload) {
      return {
        id: d.id,
        deptName: d.department.displayName,
        deptId: d.departmentId,
        status: 'already-namespaced',
        hasPatrones: true,
      };
    }
    const hasPatrones = 'patrones' in payload && Array.isArray((payload as { patrones?: unknown }).patrones);
    return {
      id: d.id,
      deptName: d.department.displayName,
      deptId: d.departmentId,
      status: 'needs-migration',
      hasPatrones,
    };
  });

  const toMigrate = analyses.filter((a) => a.status === 'needs-migration');
  const alreadyOk = analyses.filter((a) => a.status === 'already-namespaced');
  const noPayload = analyses.filter((a) => a.status === 'no-payload' || a.status === 'no-department');

  console.log('Detalle DEPT:');
  console.log('─'.repeat(80));
  for (const a of analyses) {
    const mark =
      a.status === 'already-namespaced' ? '✓' :
      a.status === 'needs-migration' ? '→' : '!';
    console.log(`  ${mark} ${a.id}  ${a.deptName.padEnd(30)}  ${a.status}${!a.hasPatrones && a.status === 'needs-migration' ? ' (sin patrones — NO migrable)' : ''}`);
  }
  console.log('─'.repeat(80));
  console.log('');

  console.log(`📊 Resumen:`);
  console.log(`   A migrar (DEPT):        ${toMigrate.length}`);
  console.log(`   Ya namespaced:          ${alreadyOk.length}`);
  console.log(`   Sin payload/depto:      ${noPayload.length}`);
  console.log(`   ORG a resetear:         ${orgRow ? 1 : 0}`);
  console.log('');

  if (toMigrate.length === 0 && (!orgRow || orgRow.status === 'PENDING')) {
    console.log('✅ Nada que hacer.');
    return;
  }

  if (!apply) {
    console.log('🔍 DRY-RUN: nada persistido.');
    console.log('   Para aplicar: agregá --apply');
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // APPLY
  // ═══════════════════════════════════════════════════════════════════
  console.log(`🔄 Aplicando backfill...\n`);

  for (const a of toMigrate) {
    if (!a.hasPatrones) {
      console.log(`   ⚠️  SKIP ${a.deptName}: no tiene patrones en payload.`);
      continue;
    }
    const row = deptRows.find((r) => r.id === a.id);
    if (!row || !row.departmentId || !row.department) continue;

    const patrones = row.resultPayload as unknown as PatronAnalysisOutput;
    const safetyDetail = await calculateSafetyScoreForDepartment(
      campaignId,
      row.departmentId,
      accountId
    );
    if (!safetyDetail) {
      console.log(`   ⚠️  SKIP ${a.deptName}: safetyDetail null (bajo privacy threshold).`);
      continue;
    }

    const external = await loadDepartmentExternalSignals(
      row.departmentId,
      accountId,
      row.department.accumulatedExoScore
    );

    // Motor A v2 — backfill recibe los inputs pero como `isaScore` no se
    // recomputa acá (script idempotente para namespacing solamente), Motor A
    // queda en empty para rows sin ISA. Si el row ya tiene isaScore en BD,
    // se pasa para que A1/A5 puedan activarse.
    // Motor B Fase 2 — externalAlerts: [] (backfill no recarga alertas
    // externas — out-of-scope del namespace migration. convergenciaExterna
    // saldrá con scoreTotal=0 + flags en false. Re-run del orchestrator
    // sobre la campaña refresca el sub-objeto correctamente).
    const convergencia = buildDepartmentConvergencia({
      departmentId: row.departmentId,
      departmentName: row.department.displayName,
      managerId: row.department.parentId,
      safetyScore: safetyDetail.safetyScore,
      patrones: patrones.patrones ?? [],
      externalSignals: external,
      isaScore: row.isaScore,
      dimensionScores: safetyDetail.dimensionScores,
      patronesOutput: patrones,
      teatroCumplimiento: !!row.teatroCumplimiento,
      externalAlerts: [],
    });

    const newPayload = { patrones, safetyDetail, convergencia };

    await prisma.complianceAnalysis.update({
      where: { id: row.id },
      data: { resultPayload: newPayload as unknown as object },
    });
    console.log(`   ✅ ${a.deptName}: payload namespaced.`);
  }

  // Reset ORG para que el drain lo regenere con el shape nuevo.
  if (orgRow) {
    if (orgRow.status === 'PENDING' && orgRow.retryCount === 0) {
      console.log(`\n   ORG ya estaba PENDING, nada que resetear.`);
    } else {
      await prisma.complianceAnalysis.update({
        where: { id: orgRow.id },
        data: {
          status: 'PENDING',
          retryCount: 0,
          errorMessage: null,
          startedAt: null,
          completedAt: null,
        },
      });
      console.log(`\n   ✅ ORG reseteado a PENDING.`);
    }
  }

  console.log('');
  console.log(`🎉 Backfill completado. Siguiente paso: drain.`);
  console.log(`   npx tsx prisma/scripts/drain-compliance-campaign.ts ${campaignId}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
