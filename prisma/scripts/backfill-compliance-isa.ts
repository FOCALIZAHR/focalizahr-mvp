// prisma/scripts/backfill-compliance-isa.ts
// Recalcula el ISA para campañas ya cerradas (DEPT + ORG) sin volver a
// llamar al LLM. Usa los datos ya persistidos en resultPayload namespaced.
//
// - Dry-run por defecto.
// - Con --apply: ejecuta UPDATEs.
// - Idempotente: DEPTs/ORGs que ya tienen isaScore no null no se tocan por
//   defecto. Con --force se recalculan igual.
//
// Uso:
//   npm run backfill:compliance-isa                  # dry-run global
//   npm run backfill:compliance-isa -- --apply       # apply
//   npm run backfill:compliance-isa -- --campaign=X  # una campaña
//   npm run backfill:compliance-isa -- --force       # recalcular también los que ya tienen isa

import { PrismaClient, Prisma } from '@prisma/client';
import { calculateISA } from '../../src/lib/services/compliance/ISAService';
import type {
  PatronAnalysisOutput,
  ConfianzaAnalisis,
} from '../../src/lib/services/compliance/complianceTypes';

const prisma = new PrismaClient();

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
}

interface DeptPayloadShape {
  patrones?: PatronAnalysisOutput;
  safetyDetail?: { safetyScore: number };
  convergencia?: { riskSignalsCount: number; activeSources: string[] };
  isa?: number;
}

async function main() {
  const apply = !!parseFlag('apply');
  const force = !!parseFlag('force');
  const campaignFlag = parseFlag('campaign');
  const campaignId = typeof campaignFlag === 'string' ? campaignFlag : undefined;

  console.log(
    `🔧 Backfill ISA (${apply ? 'APPLY' : 'DRY-RUN'}, force=${force}, campaign=${campaignId ?? 'ALL'})`
  );
  console.log('');

  // ── DEPT rows ────────────────────────────────────────────────────────
  const where: Prisma.ComplianceAnalysisWhereInput = {
    scope: 'DEPARTMENT',
    status: 'COMPLETED',
    ...(campaignId ? { campaignId } : {}),
    ...(force ? {} : { isaScore: null }),
  };

  const deptRows = await prisma.complianceAnalysis.findMany({
    where,
    include: { campaign: { select: { id: true, name: true } } },
  });

  const toUpdateDepts: Array<{
    id: string;
    campaignName: string;
    isaNew: number;
    isaOld: number | null;
  }> = [];
  const skippedDepts: string[] = [];

  for (const row of deptRows) {
    const payload = row.resultPayload as unknown as DeptPayloadShape | null;
    if (!payload?.patrones || !payload?.safetyDetail || !payload?.convergencia) {
      skippedDepts.push(`${row.id} (payload incompleto o pre-namespaces)`);
      continue;
    }
    const isaNew = calculateISA({
      safetyScore: payload.safetyDetail.safetyScore,
      patrones: payload.patrones.patrones ?? [],
      confianzaLLM: payload.patrones.confianza_analisis as ConfianzaAnalisis,
      convergenciaSignals: payload.convergencia.riskSignalsCount,
      activeSources: payload.convergencia.activeSources.length,
      teatroCumplimiento: !!row.teatroCumplimiento,
    });
    toUpdateDepts.push({
      id: row.id,
      campaignName: row.campaign.name,
      isaNew,
      isaOld: row.isaScore,
    });
  }

  // ── ORG rows ─────────────────────────────────────────────────────────
  const orgRows = await prisma.complianceAnalysis.findMany({
    where: {
      scope: 'ORG',
      status: 'COMPLETED',
      ...(campaignId ? { campaignId } : {}),
      ...(force ? {} : { isaScore: null }),
    },
    include: { campaign: { select: { id: true, name: true } } },
  });

  const toUpdateOrgs: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    orgIsaNew: number | null;
    orgIsaOld: number | null;
  }> = [];

  for (const org of orgRows) {
    // Para calcular orgISA = promedio ponderado por respondentCount,
    // necesito los DEPTs COMPLETED de la misma campaña.
    const depts = await prisma.complianceAnalysis.findMany({
      where: {
        campaignId: org.campaignId,
        scope: 'DEPARTMENT',
        status: 'COMPLETED',
      },
      select: { respondentCount: true, resultPayload: true, isaScore: true, id: true },
    });

    let totalWeight = 0;
    let weightedSum = 0;
    for (const d of depts) {
      // Preferir el isaScore de columna (si ya se backfilló arriba) o el del payload.
      // Al momento del dry-run no están aún actualizados, calculamos in-memory.
      const payload = d.resultPayload as unknown as DeptPayloadShape | null;
      const inMemoryIsa = toUpdateDepts.find((u) => u.id === d.id)?.isaNew;
      const isa = inMemoryIsa ?? d.isaScore ?? payload?.isa ?? null;
      const weight = d.respondentCount ?? 0;
      if (isa !== null && weight > 0) {
        weightedSum += isa * weight;
        totalWeight += weight;
      }
    }
    const orgIsaNew = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

    toUpdateOrgs.push({
      id: org.id,
      campaignId: org.campaignId,
      campaignName: org.campaign.name,
      orgIsaNew,
      orgIsaOld: org.isaScore,
    });
  }

  // ── Reporte ──────────────────────────────────────────────────────────
  console.log(`📊 DEPT rows a recalcular: ${toUpdateDepts.length}`);
  console.log(`📊 DEPT rows skipped:       ${skippedDepts.length}`);
  console.log(`📊 ORG rows a recalcular:   ${toUpdateOrgs.length}`);
  console.log('');

  if (toUpdateDepts.length > 0) {
    console.log('DEPT (primeros 20):');
    for (const u of toUpdateDepts.slice(0, 20)) {
      console.log(`  ${u.id}  ${u.campaignName.padEnd(28)}  ${u.isaOld ?? 'null'} → ${u.isaNew}`);
    }
    if (toUpdateDepts.length > 20) console.log(`  ... +${toUpdateDepts.length - 20} más`);
    console.log('');
  }

  if (toUpdateOrgs.length > 0) {
    console.log('ORG:');
    for (const u of toUpdateOrgs) {
      console.log(`  ${u.id}  ${u.campaignName.padEnd(28)}  ${u.orgIsaOld ?? 'null'} → ${u.orgIsaNew ?? 'null'}`);
    }
    console.log('');
  }

  if (skippedDepts.length > 0) {
    console.log(`⚠️  ${skippedDepts.length} DEPT rows saltados (payload pre-namespaces o incompleto).`);
    console.log('   Tip: correr primero backfill-compliance-namespaced-payloads.ts.');
    console.log('');
  }

  if (!apply) {
    console.log(`🔍 DRY-RUN: nada persistido. Para aplicar: --apply`);
    return;
  }

  // ── Apply ────────────────────────────────────────────────────────────
  let updatedDepts = 0;
  for (const u of toUpdateDepts) {
    // Actualizar isaScore + isa dentro del resultPayload (merge).
    const row = await prisma.complianceAnalysis.findUnique({
      where: { id: u.id },
      select: { resultPayload: true },
    });
    const payload = (row?.resultPayload as object | null) ?? {};
    await prisma.complianceAnalysis.update({
      where: { id: u.id },
      data: {
        isaScore: u.isaNew,
        resultPayload: { ...payload, isa: u.isaNew } as unknown as object,
      },
    });
    updatedDepts++;
  }

  let updatedOrgs = 0;
  for (const u of toUpdateOrgs) {
    if (u.orgIsaNew === null) continue;
    const row = await prisma.complianceAnalysis.findUnique({
      where: { id: u.id },
      select: { resultPayload: true },
    });
    const payload = (row?.resultPayload as Record<string, unknown> | null) ?? {};
    const global = (payload.global as Record<string, unknown> | undefined) ?? {};
    await prisma.complianceAnalysis.update({
      where: { id: u.id },
      data: {
        isaScore: u.orgIsaNew,
        resultPayload: {
          ...payload,
          global: { ...global, orgISA: u.orgIsaNew },
        } as unknown as object,
      },
    });
    updatedOrgs++;
  }

  console.log(`🎉 Backfill ISA completado.`);
  console.log(`   DEPT actualizados: ${updatedDepts}`);
  console.log(`   ORG actualizados:  ${updatedOrgs}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
