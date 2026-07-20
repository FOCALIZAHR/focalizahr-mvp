// prisma/scripts/smoke-vitals-gateB.ts
// ════════════════════════════════════════════════════════════════════════════
// Smoke Gate B — narrativas de la portada Signos Vitales.
//
// FRENTE 1: las 4 ramas de buildVitalsNarrative con fixtures en memoria.
// FRENTE 2: el summary REAL de la cuenta de prueba → debe dar sin_veredicto.
// FRENTE 3: auditoria automatica contra skill focalizahr-narrativas
//           (jerga del sistema, instrucciones prescriptivas, plazos).
//
// SOLO LECTURA. Cero escritura a BD, cero fixture.
//
// PENDIENTE FUERA DE ESTE SMOKE: verificacion visual y de pulgar en 375px.
// Requiere dev server y ojo humano. Es de Victor / Gate C.
//
// Uso: npx tsx prisma/scripts/smoke-vitals-gateB.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';
import { buildVitalsNarrative } from '../../src/lib/narratives/vitalsNarratives';
import { getVitalSigns } from '../../src/lib/services/vitals/VitalSignsService';
import type { VitalSignsSummary } from '../../src/lib/services/vitals/types';

const ACCOUNT = 'cmfgedx7b00012413i92048wl';
const NOW = new Date('2026-07-20T00:00:00.000Z');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function summaryOf(over: Partial<VitalSignsSummary>): VitalSignsSummary {
  return {
    scope: 'organization',
    departments: [],
    zoneDistribution: { verde: 0, amarilla: 0, naranja: 0, roja: 0, sinVeredicto: 0 },
    headline: null,
    headlineUnavailableReason: null,
    coverage: {
      totalDepartments: 10,
      withClimaVerdict: 0,
      withExo: 0,
      withEis: 0,
      withIsa: 0,
    },
    ...over,
  } as VitalSignsSummary;
}

function deptWith(over: any) {
  return {
    departmentId: 'D1',
    departmentName: 'Operaciones',
    clima: {
      status: 'con_veredicto',
      verdict: {
        favorability: 43,
        riskZone: 'roja',
        momentum: null,
        correlationFlags: null,
        topFocusArea: null,
        period: '2026-Q2',
        measuredAt: '2026-06-30T00:00:00.000Z',
        monthsAgo: 1,
        respondents: 10,
        productType: 'experiencia-full',
      },
      followUp: null,
    },
    onboarding: { exoScore: null },
    exit: { eisScore: null },
    ambiente: { isaScore: null, previousIsaScore: null, delta: null },
    ...over,
  };
}

function allText(n: ReturnType<typeof buildVitalsNarrative>): string {
  const parts = [
    n.finding.headline ?? '',
    ...n.finding.body,
    n.hero.kind === 'phrase' ? n.hero.text : n.hero.caption + ' ' + (n.hero.detail ?? ''),
    n.emptyState?.title ?? '',
    n.emptyState?.description ?? '',
    n.emptyState?.insight ?? '',
    n.cta?.label ?? '',
  ];
  return parts.join(' ');
}

// ════════════════════════════════════════════════════════════════════════════
function frente1() {
  console.log('\n=== FRENTE 1 — ramas de buildVitalsNarrative ===');

  // 1.1 sin departamentos
  const s0 = buildVitalsNarrative(
    summaryOf({ coverage: { totalDepartments: 0, withClimaVerdict: 0, withExo: 0, withEis: 0, withIsa: 0 } }),
    { canManageCampaigns: true }
  );
  check('1.1 cuenta sin estructura → sin_departamentos, hero frase',
    s0.state === 'sin_departamentos' && s0.hero.kind === 'phrase', s0.state);

  // 1.2 sin veredicto — el estado REAL de hoy
  const s1 = buildVitalsNarrative(summaryOf({}), { canManageCampaigns: true });
  check('1.2 sin veredicto → hero es FRASE, nunca numero (regla null != 0 visual)',
    s1.state === 'sin_veredicto' && s1.hero.kind === 'phrase',
    `state=${s1.state} hero=${s1.hero.kind}`);
  check('1.2b sin veredicto → FHREmptyState type pending',
    s1.emptyState?.type === 'pending');

  // 1.3 CTA segun permiso (decision 1 de Victor)
  check('1.3a con campaigns:manage → "Activar medicion completa"',
    s1.cta?.label === 'Activar medición completa' && s1.cta.href === '/dashboard/campaigns/new',
    JSON.stringify(s1.cta));
  const s1b = buildVitalsNarrative(summaryOf({}), { canManageCampaigns: false });
  check('1.3b sin campaigns:manage (CEO / AREA_MANAGER) → "Ver la operacion"',
    s1b.cta?.label === 'Ver la operación' && s1b.cta.href === '/dashboard',
    JSON.stringify(s1b.cta));

  // 1.4 sin riesgo
  const s3 = buildVitalsNarrative(
    summaryOf({
      departments: [deptWith({ clima: { status: 'con_veredicto', verdict: { ...deptWith({}).clima.verdict, favorability: 82, riskZone: 'verde' }, followUp: null } })] as any,
      zoneDistribution: { verde: 4, amarilla: 0, naranja: 0, roja: 0, sinVeredicto: 6 },
      headline: null,
      coverage: { totalDepartments: 10, withClimaVerdict: 4, withExo: 0, withEis: 0, withIsa: 0 },
    }),
    { canManageCampaigns: true }
  );
  check('1.4 lectura sin riesgo → sin_riesgo, hero numero, CTA diagnostico',
    s3.state === 'sin_riesgo' && s3.hero.kind === 'number' && s3.cta?.href === '/dashboard/clima',
    s3.state);

  // 1.5 con criticos, variante base b1
  const s2 = buildVitalsNarrative(
    summaryOf({
      departments: [deptWith({})] as any,
      zoneDistribution: { verde: 2, amarilla: 1, naranja: 0, roja: 1, sinVeredicto: 6 },
      headline: { departmentId: 'D1', departmentName: 'Operaciones', riskZone: 'roja', favorability: 43 },
      coverage: { totalDepartments: 10, withClimaVerdict: 4, withExo: 0, withEis: 0, withIsa: 0 },
    }),
    { canManageCampaigns: true }
  );
  check('1.5 con criticos b1 → headline nombra el area y concuerda en genero',
    s2.state === 'con_criticos'
      && s2.finding.headline === 'Operaciones entró en zona crítica.',
    `headline="${s2.finding.headline}"`);
  check('1.5b hero = cantidad de areas criticas, en numero',
    s2.hero.kind === 'number' && s2.hero.value === 1);
  check('1.5c superlativo "la mas baja" verificado, no asumido',
    s2.finding.body[0].includes('la más baja'),
    s2.finding.body[0]);

  // 1.6 superlativo NO se afirma cuando es falso
  const s2b = buildVitalsNarrative(
    summaryOf({
      departments: [
        deptWith({}),
        deptWith({ departmentId: 'D2', departmentName: 'Logistica',
          clima: { status: 'con_veredicto', verdict: { ...deptWith({}).clima.verdict, favorability: 30, riskZone: 'naranja' }, followUp: null } }),
      ] as any,
      zoneDistribution: { verde: 0, amarilla: 0, naranja: 1, roja: 1, sinVeredicto: 8 },
      headline: { departmentId: 'D1', departmentName: 'Operaciones', riskZone: 'roja', favorability: 43 },
      coverage: { totalDepartments: 10, withClimaVerdict: 2, withExo: 0, withEis: 0, withIsa: 0 },
    }),
    { canManageCampaigns: true }
  );
  check('1.6 si NO es la mas baja, el texto no lo afirma',
    !s2b.finding.body[0].includes('la más baja'),
    s2b.finding.body[0]);

  // 1.7 variante b2 — contradiccion con seguimiento
  const s2c = buildVitalsNarrative(
    summaryOf({
      departments: [deptWith({
        clima: {
          status: 'con_veredicto',
          verdict: { ...deptWith({}).clima.verdict, topFocusArea: 'liderazgo' },
          followUp: { measuredAt: '2026-07-15T00:00:00.000Z', period: 'FU', dimension: 'liderazgo', delta: 17, deltaUnavailableReason: null },
        },
      })] as any,
      zoneDistribution: { verde: 0, amarilla: 0, naranja: 0, roja: 1, sinVeredicto: 9 },
      headline: { departmentId: 'D1', departmentName: 'Operaciones', riskZone: 'roja', favorability: 43 },
      coverage: { totalDepartments: 10, withClimaVerdict: 1, withExo: 0, withEis: 0, withIsa: 0 },
    }),
    { canManageCampaigns: true }
  );
  check('1.7 con seguimiento positivo → narrativa de contradiccion (b2)',
    s2c.finding.headline === 'La intervención funciona. La zona no cambió.',
    `headline="${s2c.finding.headline}"`);
  check('1.7b b2 menciona el delta y la dimension intervenida',
    s2c.finding.body[0].includes('17') && s2c.finding.body[0].includes('liderazgo'));
}

// ════════════════════════════════════════════════════════════════════════════
async function frente2() {
  console.log('\n=== FRENTE 2 — summary REAL de la cuenta de prueba ===');
  const real = await getVitalSigns({ accountId: ACCOUNT, departmentIds: null, now: NOW });
  const n = buildVitalsNarrative(real, { canManageCampaigns: true });

  check('2.1 la cuenta real cae en sin_veredicto (estado que se ve hoy)',
    n.state === 'sin_veredicto', n.state);
  check('2.2 hero NO es numero (no se pinta un 0 de 72px)',
    n.hero.kind === 'phrase', n.hero.kind);
  check('2.3 el texto nombra las 57 areas reales',
    n.finding.body[0].includes(String(real.coverage.totalDepartments)),
    n.finding.body[0]);
  console.log(`  info  ${real.coverage.totalDepartments} deptos · veredictos ${real.coverage.withClimaVerdict}`);
  console.log(`  info  hero: "${n.hero.kind === 'phrase' ? n.hero.text : ''}"`);
}

// ════════════════════════════════════════════════════════════════════════════
function frente3() {
  console.log('\n=== FRENTE 3 — auditoria contra skill focalizahr-narrativas ===');

  const JERGA_SISTEMA = [
    'experiencia-full', 'isFollowUp', 'pulso-express', 'productType', 'riskZone',
    'RoleFit', 'Pearson', 'NineBox', 'engagement score', 'DepartmentClimaInsight',
    'climaAggregationStatus', 'ISA', 'EXO', 'EIS', 'favorability',
  ];
  const PRESCRIPTIVO = [
    'se recomienda', 'deberías', 'deberia', 'es necesario', 'debes ',
    'agendar', 'convocar', 'activar proceso',
  ];
  const PLAZOS = [
    'próximos 30 días', 'proximos 30 dias', 'esta semana', 'antes del',
    'en 30 días', 'cuanto antes', 'urgente',
  ];

  const casos = [
    buildVitalsNarrative(summaryOf({}), { canManageCampaigns: true }),
    buildVitalsNarrative(summaryOf({}), { canManageCampaigns: false }),
    buildVitalsNarrative(
      summaryOf({ coverage: { totalDepartments: 0, withClimaVerdict: 0, withExo: 0, withEis: 0, withIsa: 0 } }),
      { canManageCampaigns: true }
    ),
    buildVitalsNarrative(
      summaryOf({
        departments: [deptWith({})] as any,
        zoneDistribution: { verde: 2, amarilla: 1, naranja: 0, roja: 1, sinVeredicto: 6 },
        headline: { departmentId: 'D1', departmentName: 'Operaciones', riskZone: 'roja', favorability: 43 },
        coverage: { totalDepartments: 10, withClimaVerdict: 4, withExo: 0, withEis: 0, withIsa: 0 },
      }),
      { canManageCampaigns: true }
    ),
  ];

  for (const [i, n] of casos.entries()) {
    const texto = allText(n);
    const lower = texto.toLowerCase();

    const jerga = JERGA_SISTEMA.filter((t) => texto.includes(t));
    check(`3.${i + 1}a [${n.state}] sin jerga del sistema`,
      jerga.length === 0, `encontrado: ${jerga.join(', ')}`);

    const presc = PRESCRIPTIVO.filter((t) => lower.includes(t));
    check(`3.${i + 1}b [${n.state}] sin instrucciones prescriptivas`,
      presc.length === 0, `encontrado: ${presc.join(', ')}`);

    const plazos = PLAZOS.filter((t) => lower.includes(t));
    check(`3.${i + 1}c [${n.state}] sin plazos`,
      plazos.length === 0, `encontrado: ${plazos.join(', ')}`);
  }

  // Regla 0 (Minto): el headline resuelve solo, <= 8 palabras.
  for (const n of casos) {
    const cima = n.finding.headline ?? (n.hero.kind === 'phrase' ? n.hero.text : '');
    const palabras = cima.trim().split(/\s+/).filter(Boolean).length;
    check(`3.min [${n.state}] cima Minto <= 8 palabras (${palabras})`,
      palabras > 0 && palabras <= 8, `"${cima}"`);
  }

  // Regla 2: causas con "O" donde hay hipotesis.
  const conCriticos = casos[3];
  check('3.O el caso con hallazgo presenta causas con "O"',
    conCriticos.finding.body.some((p) => /(^|\. )O /.test(p)),
    JSON.stringify(conCriticos.finding.body));
}

async function main() {
  console.log('SMOKE GATE B — narrativas Signos Vitales');
  frente1();
  await frente2();
  frente3();
  console.log('\n  PENDIENTE (fuera de este smoke): verificacion visual y de pulgar');
  console.log('  en 375px. Requiere dev server y ojo humano — Victor / Gate C.');
  console.log(`\n──────────────────────────────────\nRESULTADO: ${passed} PASS · ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
