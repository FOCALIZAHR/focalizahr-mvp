// prisma/scripts/seed-clima-cascada-demo.ts
// Siembra 4 campañas demo de clima para el live review de la Cascada Ejecutiva
// (Gate 4.5a), con perfiles DELIBERADOS:
//   A · Teatro                 → TEATRO_GENERALIZADO domina (2 gerencias)
//   B · Foco Concentrado+Exit  → HOTSPOT (outlier roja + resto sano) + cruce exit
//                                 real (n≥5) "los que se fueron dijeron lo mismo"
//   C · Difuso bajo objetivo   → OBSERVACION_SIN_FOCO (el corner resuelto)
//   D · Patrón Sistémico       → DRIVER_SISTEMICO con AMBOS flags (top-impact +
//                                mayor caída) + MOMENTUM_NEGATIVO co-disparando
//
// Idempotente por marcadores únicos. Ejecutar:
//   npx tsx prisma/scripts/seed-clima-cascada-demo.ts
// BORRAR (script + datos) al sellar el gate.

import { prisma } from '../../src/lib/prisma';
import type { Prisma } from '@prisma/client';

const ACCOUNT_ID = 'cmczi7mdg003c14pgfewzl0b4'; // Empresa Demo FocalizaHR (test@focalizahr.cl)
const PULSO_TYPE_ID = 'cmczi63rn000014pg0vnm0pow'; // slug pulso-express
const NAME_MARKER = '[GATE45A-DEMO]';
const EXIT_MARKER = 'GATE45A-DEMO'; // period string (la API matchea por periodEnd, no por este label)

const START = new Date('2026-04-01T00:00:00Z');
const END = new Date('2026-06-30T00:00:00Z');
const P_START = new Date('2026-04-01');
const P_END = new Date('2026-06-30');
const EXIT_START = new Date('2026-01-01');
const EXIT_END = new Date('2026-03-31'); // ≤ END → entra en el join período-alineado

function zoneOf(fav: number): string {
  if (fav >= 75) return 'verde';
  if (fav >= 65) return 'amarilla';
  if (fav >= 60) return 'naranja';
  return 'roja';
}

function flags(theatreDetected: boolean, isaScore: number | null, eiFav: number): Prisma.InputJsonValue {
  return {
    version: 1,
    theatreDetected,
    theatre: { isaScore, engagementFav: eiFav, evaluable: isaScore !== null },
    hotspot: {
      isHotspot: false,
      eiFav,
      p25CompanyEiFav: null,
      deptsInSample: 4,
      headcountAvg: null,
      turnoverRate: null,
      confidence: 'low',
    },
    climaTurnover: null,
    businessCases: [],
    computedAt: END.toISOString(),
  };
}

interface DeptProfile {
  fav: number;
  theatre?: boolean;
  isa?: number;
  momentum?: number;
  driverScores?: Prisma.InputJsonValue;
  driverAnalysis?: Prisma.InputJsonValue;
}

/** DriverImpact para el seed (perfil D). impact org-level (|r|), momentumDelta pp. */
function da(driver: string, fav: number, impact: number, delta: number) {
  return {
    driver,
    fav,
    mean: Math.round((1 + (fav / 100) * 4) * 100) / 100,
    n: 16,
    carried: false,
    impact,
    gap: Math.round(fav - 75),
    gapBasis: 'fixed_target',
    priority: Math.round(Math.abs(impact) * Math.abs(fav - 75) * 10) / 10,
    classification: fav < 75 ? 'focus_area' : 'strength',
    momentumDelta: delta,
    momentumState: delta <= -10 ? 'crisis' : delta <= -5 ? 'declining' : 'stable',
    champion: null,
  };
}

async function seedCampaign(
  name: string,
  period: string,
  deptIds: { id: string; name: string }[],
  profiles: DeptProfile[],
): Promise<string> {
  const campaign = await prisma.campaign.create({
    data: {
      accountId: ACCOUNT_ID,
      campaignTypeId: PULSO_TYPE_ID,
      name,
      startDate: START,
      endDate: END,
      status: 'completed',
      totalInvited: profiles.length * 20,
      totalResponded: profiles.length * 16,
      climaAggregationStatus: 'COMPLETED',
      completedAt: END,
    },
    select: { id: true },
  });

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const dept = deptIds[i];
    await prisma.departmentClimaInsight.create({
      data: {
        accountId: ACCOUNT_ID,
        departmentId: dept.id,
        campaignId: campaign.id,
        period,
        periodStart: P_START,
        periodEnd: P_END,
        productType: 'pulso-express',
        engagementFavorability: p.fav,
        engagementMean: Math.round((1 + (p.fav / 100) * 4) * 100) / 100,
        riskZone: zoneOf(p.fav),
        momentum: p.momentum ?? null,
        totalInvited: 20,
        totalResponded: 16,
        participationRate: 80,
        correlationFlags: flags(!!p.theatre, p.isa ?? null, p.fav),
        ...(p.driverScores !== undefined ? { driverScores: p.driverScores } : {}),
        ...(p.driverAnalysis !== undefined ? { driverAnalysis: p.driverAnalysis } : {}),
      },
    });
  }
  console.log(`  ✅ ${name} → ${campaign.id} (${profiles.length} deptos)`);
  return campaign.id;
}

async function main() {
  // Corrige el typo de dato del depto de la cuenta demo (comrcial → Comercial).
  // Idempotente; solo mejora la calidad visual de la revisión (no afecta lógica).
  await prisma.department.updateMany({
    where: { accountId: ACCOUNT_ID, displayName: 'comrcial' },
    data: { displayName: 'Comercial' },
  });

  const depts = await prisma.department.findMany({
    where: { accountId: ACCOUNT_ID },
    select: { id: true, displayName: true },
    orderBy: { displayName: 'asc' },
    take: 6,
  });
  if (depts.length < 4) {
    throw new Error(`Cuenta ${ACCOUNT_ID} tiene solo ${depts.length} departamentos (se necesitan ≥4).`);
  }
  const d = depts.slice(0, 4).map((x) => ({ id: x.id, name: x.displayName ?? 'Depto' }));
  console.log('Departamentos usados:', d.map((x) => x.name).join(', '));

  // ── Cleanup idempotente por marcadores (transacción; solo datos propios) ──
  const prev = await prisma.campaign.findMany({
    where: { accountId: ACCOUNT_ID, name: { startsWith: NAME_MARKER } },
    select: { id: true },
  });
  const prevIds = prev.map((c) => c.id);
  await prisma.$transaction([
    prisma.departmentClimaInsight.deleteMany({ where: { campaignId: { in: prevIds } } }),
    prisma.departmentExitInsight.deleteMany({ where: { accountId: ACCOUNT_ID, period: EXIT_MARKER } }),
    prisma.campaign.deleteMany({ where: { id: { in: prevIds } } }),
  ]);
  console.log(`Cleanup: ${prevIds.length} campañas demo previas borradas.\n`);

  // ── A · Teatro (2 gerencias con contradicción cumplimiento↔clima) ──
  // Resto NO sano (mediana-resto<75) → co-dispara OBSERVACION, no HOTSPOT: hay
  // 2 gerencias bajas (las de teatro), no un outlier aislado.
  await seedCampaign(`${NAME_MARKER} A · Teatro`, 'GATE45A-A', d, [
    { fav: 45, theatre: true, isa: 82 },
    { fav: 48, theatre: true, isa: 78 },
    { fav: 70 },
    { fav: 72 },
  ]);

  // ── B · Foco Concentrado + Exit real ──
  const outlier = d[0];
  await seedCampaign(`${NAME_MARKER} B · Foco Concentrado`, 'GATE45A-B', d, [
    { fav: 42 }, // outlier roja (d[0]) — resto sano → HOTSPOT
    { fav: 80 },
    { fav: 82 },
    { fav: 81 },
  ]);
  await prisma.departmentExitInsight.create({
    data: {
      accountId: ACCOUNT_ID,
      departmentId: outlier.id,
      period: EXIT_MARKER,
      periodType: 'quarterly',
      periodStart: EXIT_START,
      periodEnd: EXIT_END,
      totalExits: 9,
      voluntaryExits: 7,
      surveysCompleted: 8, // ≥5 → pasa el guard n≥5
      topExitFactors: [
        { factor: 'Jefe directo', mentions: 6, mentionRate: 0.67, avgSeverity: 4.2 },
        { factor: 'Falta de reconocimiento', mentions: 3, mentionRate: 0.33, avgSeverity: 3.1 },
      ],
    },
  });
  console.log(`  ✅ Exit cross-signal → ${outlier.name} (topExitFactor "Jefe directo", n=8)`);

  // ── C · Difuso bajo objetivo (el corner → OBSERVACION_SIN_FOCO) ──
  await seedCampaign(`${NAME_MARKER} C · Difuso bajo objetivo`, 'GATE45A-C', d, [
    { fav: 68 },
    { fav: 66 },
    { fav: 70 },
    { fav: 67 },
  ]);

  // ── D · Patrón Sistémico (DRIVER con AMBOS flags + MOMENTUM co-dispara) ──
  // reconocimiento: bajo estándar en 2 gerencias (sistémico) + mayor impact (0.65)
  // + mayor caída (delta −12) → flag A y flag B ambos true → frase completa "Y".
  const dscore = (fav: number): Prisma.InputJsonValue => ({
    fav,
    mean: Math.round((1 + (fav / 100) * 4) * 100) / 100,
    n: 16,
    carried: false,
  });
  await seedCampaign(`${NAME_MARKER} D · Patron Sistemico`, 'GATE45A-D', d, [
    {
      fav: 80,
      momentum: -9,
      driverScores: { reconocimiento: dscore(58), comunicacion: dscore(82) },
      driverAnalysis: [da('reconocimiento', 58, 0.65, -12), da('comunicacion', 82, 0.25, -3)],
    },
    {
      fav: 82,
      momentum: -7,
      driverScores: { reconocimiento: dscore(60), comunicacion: dscore(80) },
      driverAnalysis: [da('reconocimiento', 60, 0.65, -12), da('comunicacion', 80, 0.25, -3)],
    },
    {
      fav: 85,
      momentum: 6, // gerencia que MEJORA (n≥5) → dispara el contraste del enriquecimiento
      driverScores: { comunicacion: dscore(84) },
      driverAnalysis: [da('comunicacion', 84, 0.25, -3)],
    },
    {
      fav: 86,
      driverScores: { comunicacion: dscore(85) },
      driverAnalysis: [da('comunicacion', 85, 0.25, -3)],
    },
  ]);

  console.log('\n═══ Seed demo listo. 4 campañas en Empresa Demo FocalizaHR. ═══');
  console.log('Abrir /dashboard/clima y elegir la campaña en el selector del Rail.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
