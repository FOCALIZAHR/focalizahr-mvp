// Mide el tiempo de lectura + ensamblaje del /report (sin HTTP).
// Replica las 4 queries principales que hace el endpoint y mide cada una.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CAMPAIGN_ID = process.argv[2];
if (!CAMPAIGN_ID) {
  console.error('Uso: tsx prisma/scripts/measure-compliance-report.ts <campaignId>');
  process.exit(1);
}

async function main() {
  console.log(`📏 Midiendo /report para ${CAMPAIGN_ID}\n`);

  // ═══════════════════════════════════════════════════════════════════
  // COLD: primera lectura tras startup del cliente Prisma.
  // ═══════════════════════════════════════════════════════════════════
  const coldStart = Date.now();
  const [campaign, org, depts, alerts] = await Promise.all([
    prisma.campaign.findFirst({
      where: { id: CAMPAIGN_ID },
      include: {
        account: { select: { companyName: true } },
        campaignType: { select: { slug: true } },
      },
    }),
    prisma.complianceAnalysis.findFirst({
      where: { campaignId: CAMPAIGN_ID, scope: 'ORG', status: 'COMPLETED' },
    }),
    prisma.complianceAnalysis.findMany({
      where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED' },
      include: { department: { select: { id: true, displayName: true } } },
    }),
    prisma.complianceAlert.findMany({
      where: { campaignId: CAMPAIGN_ID },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { department: { select: { id: true, displayName: true } } },
    }),
  ]);
  const coldMs = Date.now() - coldStart;

  // ═══════════════════════════════════════════════════════════════════
  // WARM: segunda lectura (connection pool ya caliente).
  // ═══════════════════════════════════════════════════════════════════
  const warmStart = Date.now();
  await Promise.all([
    prisma.campaign.findFirst({
      where: { id: CAMPAIGN_ID },
      include: {
        account: { select: { companyName: true } },
        campaignType: { select: { slug: true } },
      },
    }),
    prisma.complianceAnalysis.findFirst({
      where: { campaignId: CAMPAIGN_ID, scope: 'ORG', status: 'COMPLETED' },
    }),
    prisma.complianceAnalysis.findMany({
      where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED' },
      include: { department: { select: { id: true, displayName: true } } },
    }),
    prisma.complianceAlert.findMany({
      where: { campaignId: CAMPAIGN_ID },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { department: { select: { id: true, displayName: true } } },
    }),
  ]);
  const warmMs = Date.now() - warmStart;

  console.log('⏱️  Tiempos de lectura:');
  console.log(`   Cold (4 queries parallel, primera vez):   ${coldMs} ms`);
  console.log(`   Warm (4 queries parallel, conexión lista): ${warmMs} ms`);
  console.log('');

  // Verificación de shape.
  if (!org) {
    console.log('❌ ORG no está COMPLETED. El /report respondería 404.');
    return;
  }
  const orgPayload = org.resultPayload as Record<string, unknown> | null;
  if (!orgPayload) {
    console.log('❌ ORG.resultPayload es null.');
    return;
  }
  const hasMeta = 'meta' in orgPayload;
  const hasGlobal = 'global' in orgPayload;
  const hasNarratives = 'narratives' in orgPayload;
  console.log('📦 Shape ORG.resultPayload:');
  console.log(`   meta:       ${hasMeta ? '✓' : '✗'}`);
  console.log(`   global:     ${hasGlobal ? '✓' : '✗'}`);
  console.log(`   narratives: ${hasNarratives ? '✓' : '✗'}`);

  if (hasGlobal) {
    const g = orgPayload.global as Record<string, unknown>;
    console.log(`     orgSafetyScore:          ${g.orgSafetyScore ?? 'null'}`);
    console.log(`     skippedByPrivacy:        ${Array.isArray(g.skippedByPrivacy) ? (g.skippedByPrivacy as unknown[]).length : '?'} items`);
    console.log(`     activeSourcesGlobal:     ${Array.isArray(g.activeSourcesGlobal) ? (g.activeSourcesGlobal as string[]).join(', ') || '(vacío)' : '?'}`);
    console.log(`     criticalByManager:       ${Array.isArray(g.criticalByManager) ? (g.criticalByManager as unknown[]).length : '?'} grupos`);
    console.log(`     previousOrgScore:        ${g.previousOrgScore ?? 'null'}`);
    console.log(`     previousCampaignLabel:   ${g.previousCampaignLabel ?? 'null'}`);
  }

  if (hasNarratives) {
    const n = orgPayload.narratives as Record<string, unknown>;
    console.log(`   narratives.portada.titular: ${JSON.stringify((n.portada as { titular?: string })?.titular ?? 'null')}`);
    console.log(`   narratives.artefacto1_dimensiones: ${Array.isArray(n.artefacto1_dimensiones) ? (n.artefacto1_dimensiones as unknown[]).length : '?'} dims`);
    console.log(`   narratives.artefacto2_patrones:    ${Array.isArray(n.artefacto2_patrones) ? (n.artefacto2_patrones as unknown[]).length : '?'} patrones`);
    console.log(`   narratives.alertasGenero:          ${Array.isArray(n.alertasGenero) ? (n.alertasGenero as unknown[]).length : '?'} alertas`);
    console.log(`   narratives.artefacto3_convergencia: ${Array.isArray(n.artefacto3_convergencia) ? (n.artefacto3_convergencia as unknown[]).length : '?'} deptos`);
    console.log(`   narratives.artefacto4_alertas:     ${Array.isArray(n.artefacto4_alertas) ? (n.artefacto4_alertas as unknown[]).length : '?'} alertas`);
    console.log(`   narratives.cierre.mensaje:         ${JSON.stringify((n.cierre as { mensaje?: string })?.mensaje ?? 'null').slice(0, 80)}...`);
  }

  console.log('');
  console.log(`📦 DEPARTMENT rows COMPLETED: ${depts.length}`);
  for (const d of depts) {
    const p = d.resultPayload as Record<string, unknown> | null;
    const ok = p && 'patrones' in p && 'safetyDetail' in p && 'convergencia' in p;
    console.log(`   ${ok ? '✓' : '✗'} ${d.department?.displayName ?? d.departmentId}  namespaced=${ok}`);
  }

  console.log(`\n📢 Alertas: ${alerts.length}`);

  void campaign;
}

main().catch(console.error).finally(() => prisma.$disconnect());
