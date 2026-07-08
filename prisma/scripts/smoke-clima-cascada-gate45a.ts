// prisma/scripts/smoke-clima-cascada-gate45a.ts
// Smoke del ClimaSynthesisEngine (Gate 4.5a). Fixtures sintéticos por tipo →
// asserts de dominante, orden, count dinámico, guard n≥5 y cross-signal.
// Ejecutar: npx tsx prisma/scripts/smoke-clima-cascada-gate45a.ts
// BORRAR al sellar el gate (evidencia queda en el commit).

import { ClimaSynthesisEngine } from '../../src/lib/services/clima/ClimaSynthesisEngine';
import type {
  ClimaResultsResponse,
  ClimaDepartmentInsight,
  ClimaDriverScore,
  RiskZone,
} from '../../src/types/clima';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${msg}`);
  } else {
    fail++;
    console.error(`  ❌ ${msg}`);
  }
}

/** Ningún string renderizado debe contener `{` (placeholder sin resolver). */
function noBraces(r: ReturnType<typeof ClimaSynthesisEngine.generate>, label: string) {
  const strs: string[] = [r.portada.hook, r.portada.ctaLabel];
  for (const a of r.acts) {
    strs.push(...a.narrative, a.hypotheses, a.anchor.value, a.anchor.caption, a.coachingTip, a.ctaLabel);
  }
  strs.push(r.synthesis.classification, r.synthesis.implication, r.synthesis.path, r.synthesis.accountability);
  for (const n of r.ancla.nodes) strs.push(n.narrative, n.label);
  const bad = strs.find((s) => typeof s === 'string' && s.includes('{'));
  assert(!bad, `${label}: sin placeholders sin resolver${bad ? ' → «' + bad.slice(0, 60) + '»' : ''}`);
}

function baseDept(p: Partial<ClimaDepartmentInsight> & { departmentId: string }): ClimaDepartmentInsight {
  return {
    departmentName: p.departmentId.toUpperCase(),
    engagementFavorability: 80,
    engagementMean: 4,
    driverScores: null,
    customDriverScores: null,
    driverAnalysis: null,
    topFocusArea: null,
    topStrength: null,
    riskZone: 'verde',
    momentum: null,
    correlationFlags: null,
    npsScore: null,
    promotersPct: null,
    detractorsPct: null,
    acotadoGroupScores: null,
    totalInvited: 12,
    totalResponded: 10,
    participationRate: 100,
    turnoverRateAtMeasurement: null,
    absenteeismRateAtMeasurement: null,
    overtimeRateAtMeasurement: null,
    incidentCountAtMeasurement: null,
    crossSignals: null,
    ...p,
  };
}

function ds(fav: number, n = 8, carried = false): ClimaDriverScore {
  return { fav, mean: fav / 20, n, carried };
}

function zoneCounts(depts: ClimaDepartmentInsight[]): Record<RiskZone, number> {
  const z: Record<RiskZone, number> = { verde: 0, amarilla: 0, naranja: 0, roja: 0 };
  for (const d of depts) if (d.riskZone) z[d.riskZone]++;
  return z;
}

function makeResp(
  depts: ClimaDepartmentInsight[],
  opts: {
    orgFav: number | null;
    orgZone: RiskZone | null;
    theatre?: string[];
    hotspot?: string[];
  },
): ClimaResultsResponse {
  return {
    success: true,
    scope: 'organization',
    campaign: {
      id: 'c1',
      name: 'Clima Q2',
      productType: 'pulso-express',
      startDate: '',
      endDate: '',
      completedAt: null,
      period: '2026-Q2',
    },
    company: { name: 'ACME', country: 'CL' },
    departments: depts,
    companyPulse: {
      deptCount: depts.length,
      zoneCounts: zoneCounts(depts),
      hotspotDepartmentIds: opts.hotspot ?? [],
      theatreDepartmentIds: opts.theatre ?? [],
      climaTurnover: null,
      businessCaseTotals: [],
    },
    orgFavorability: opts.orgFav,
    orgRiskZone: opts.orgZone,
    orgMomentum: null,
    businessCaseTotals: [],
    momentumMovers: { gainers: [], decliners: [] },
    goldCacheByDept: [],
  };
}

// ─── TEST 1 — TEATRO_GENERALIZADO domina (2 gerencias con teatro, n≥5) ───────
console.log('\nTEST 1 — TEATRO_GENERALIZADO');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 45, riskZone: 'roja' }),
    baseDept({ departmentId: 'b', engagementFavorability: 48, riskZone: 'roja' }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(
    makeResp(depts, { orgFav: 58, orgZone: 'roja', theatre: ['a', 'b'], hotspot: ['a', 'b'] }),
  );
  assert(r.dominant === 'TEATRO_GENERALIZADO', 'dominante = TEATRO (override de confiabilidad)');
  assert(r.acts[0].type === 'TEATRO_GENERALIZADO', 'primer acto = TEATRO');
  assert(r.synthesis.diagnosticType === 'TEATRO_GENERALIZADO', 'síntesis del dominante');
  assert(r.acts[0].anchor.value.includes('2'), 'ancla interpola {n}=2');
  assert(!r.acts[0].narrative.join(' ').includes('{'), 'sin placeholders sin resolver');
  // org<75 difuso (resto también <75) → NO HOTSPOT, co-dispara OBSERVACION.
  assert(
    r.acts.some((a) => a.type === 'OBSERVACION_SIN_FOCO'),
    'nivel difuso co-dispara OBSERVACION (no HOTSPOT: resto también <75)',
  );
  assert(!r.acts.some((a) => a.type === 'HOTSPOT_CONCENTRADO'), 'NO HOTSPOT (mediana-resto<75)');
}

// ─── TEST 2 — HOTSPOT_CONCENTRADO + cross-signal exit ────────────────────────
console.log('\nTEST 2 — HOTSPOT_CONCENTRADO + exit');
{
  const depts = [
    baseDept({
      departmentId: 'ventas',
      departmentName: 'Ventas',
      engagementFavorability: 42,
      riskZone: 'roja',
      crossSignals: {
        exitTopFactor: { factor: 'Su jefe directo', mentions: 6, mentionRate: 0.5, mentionsManager: true },
        onboardingAbandon: null,
      },
    }),
    baseDept({ departmentId: 'b', engagementFavorability: 80 }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(
    makeResp(depts, { orgFav: 68, orgZone: 'amarilla', hotspot: ['ventas'] }),
  );
  const act = r.acts.find((a) => a.type === 'HOTSPOT_CONCENTRADO')!;
  assert(!!act, 'HOTSPOT disparó');
  assert(act.anchor.caption.includes('Ventas'), 'ancla interpola {gerencia}=Ventas');
  assert(
    act.narrative.some((p) => p.includes('salir') || p.includes('jefe directo')),
    'cross-signal exit insertado (§7.3, mentionsManager)',
  );
  assert(
    act.hypotheses.includes('continuación exacta'),
    'el "O" §7.3 REEMPLAZA al "O" base cuando dispara el cruce',
  );
  assert(
    !act.hypotheses.includes('está generando algo'),
    'el "O" base del Acto NO aparece cuando el cruce dispara',
  );
  assert(
    act.narrative.some((p) => p.includes('buena parte del ancho completo')),
    'enriquecimiento HOTSPOT presente (nombre+cifra+spread)',
  );
  assert(
    act.narrative.some((p) => p.includes('42%') && p.includes('40 puntos')),
    'enriquecimiento interpola favorabilidadGerencia=42% y spreadVsMejor=40',
  );
  noBraces(r, 'TEST 2');
}

// ─── TEST 3 — HOTSPOT sin exit cuando el factor NO nombra manager ────────────
console.log('\nTEST 3 — HOTSPOT sin cruce exit (factor no-manager)');
{
  const depts = [
    baseDept({
      departmentId: 'ops',
      departmentName: 'Ops',
      engagementFavorability: 44,
      riskZone: 'roja',
      crossSignals: {
        exitTopFactor: { factor: 'Compensaciones', mentions: 6, mentionRate: 0.5, mentionsManager: false },
        onboardingAbandon: null,
      },
    }),
    baseDept({ departmentId: 'b', engagementFavorability: 81 }),
    baseDept({ departmentId: 'c', engagementFavorability: 80 }),
  ];
  const r = ClimaSynthesisEngine.generate(
    makeResp(depts, { orgFav: 68, orgZone: 'amarilla', hotspot: ['ops'] }),
  );
  const act = r.acts.find((a) => a.type === 'HOTSPOT_CONCENTRADO')!;
  assert(
    !act.narrative.some((p) => p.includes('salir')),
    'exit NO insertado (factor no nombra jefe/manager)',
  );
}

// ─── TEST 4 — DRIVER_SISTEMICO (autonomía en 2 gerencias) + onboarding ───────
console.log('\nTEST 4 — DRIVER_SISTEMICO + onboarding');
{
  const cross = {
    exitTopFactor: null,
    onboardingAbandon: { abandonRate: 0.4, abandonedJourneys: 4, totalJourneys: 10 },
  };
  const depts = [
    baseDept({ departmentId: 'a', driverScores: { autonomia: ds(58) }, crossSignals: cross }),
    baseDept({ departmentId: 'b', driverScores: { autonomia: ds(60) }, crossSignals: cross }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 76, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'DRIVER_SISTEMICO')!;
  assert(!!act, 'DRIVER_SISTEMICO disparó');
  assert(act.anchor.caption.includes('Autonomía'), 'dimensión = Autonomía (label)');
  assert(
    act.narrative.some((p) => p.includes('recién llega') || p.includes('recién entra')),
    'cross-signal onboarding insertado (≠liderazgo)',
  );
}

// ─── TEST 5 — DRIVER liderazgo NO inserta onboarding (bias diferido) ─────────
console.log('\nTEST 5 — DRIVER liderazgo sin cruce (bias diferido, onboarding no aplica)');
{
  const cross = {
    exitTopFactor: null,
    onboardingAbandon: { abandonRate: 0.4, abandonedJourneys: 4, totalJourneys: 10 },
  };
  const depts = [
    baseDept({ departmentId: 'a', driverScores: { liderazgo: ds(55) }, crossSignals: cross }),
    baseDept({ departmentId: 'b', driverScores: { liderazgo: ds(58) }, crossSignals: cross }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 76, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'DRIVER_SISTEMICO')!;
  assert(act.anchor.caption.includes('Liderazgo'), 'dimensión = Liderazgo');
  assert(
    !act.narrative.some((p) => p.includes('recién')),
    'onboarding NO insertado en liderazgo; bias diferido → sin cruce',
  );
}

// ─── TEST 6 — MOMENTUM_NEGATIVO (2 gerencias cayendo) ────────────────────────
console.log('\nTEST 6 — MOMENTUM_NEGATIVO');
{
  const depts = [
    baseDept({ departmentId: 'a', momentum: -8, engagementFavorability: 78 }),
    baseDept({ departmentId: 'b', momentum: -6, engagementFavorability: 76 }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 78, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'MOMENTUM_NEGATIVO')!;
  assert(!!act, 'MOMENTUM disparó');
  assert(act.anchor.value.includes('2'), 'ancla {n}=2 gerencias cayendo');
  assert(
    act.narrative.some((p) => p.includes('cayó 8 puntos') && p.includes('caída más pronunciada')),
    'enriquecimiento MOMENTUM nombra la mayor caída (n≥5)',
  );
  noBraces(r, 'TEST 6');
}

// ─── TEST 6b — MOMENTUM: mayor caída con n<5 → magnitud sin nombre ───────────
console.log('\nTEST 6b — MOMENTUM guard n<5 en el mover');
{
  const depts = [
    baseDept({ departmentId: 'tiny', engagementFavorability: 78, momentum: -14, totalResponded: 3 }),
    baseDept({ departmentId: 'b', engagementFavorability: 76, momentum: -6 }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 78, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'MOMENTUM_NEGATIVO')!;
  // El mayor faller es 'tiny' (-14) pero n<5 → magnitud sin nombre.
  assert(
    act.narrative.some((p) => p.includes('14 puntos') && p.includes('insuficiente para nombrarla')),
    'mayor caída con n<5 → magnitud, sin nombre (guard Nota G #1)',
  );
  assert(!act.narrative.some((p) => p.includes('TINY')), 'no nombra la gerencia n<5');
  noBraces(r, 'TEST 6b');
}

// ─── TEST 7 — BIEN_CON_FOCOS (org sano + 1 foco, sin crisis) ─────────────────
console.log('\nTEST 7 — BIEN_CON_FOCOS');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 68, riskZone: 'amarilla' }),
    baseDept({ departmentId: 'b', engagementFavorability: 85 }),
    baseDept({ departmentId: 'c', engagementFavorability: 88 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 80, orgZone: 'verde' }));
  assert(r.dominant === 'BIEN_CON_FOCOS', 'dominante = BIEN_CON_FOCOS');
  assert(r.acts.length === 1, 'solo 1 acto (terminal)');
  assert(r.acts[0].anchor.value.includes('1'), 'ancla {n}=1 foco');
  assert(
    r.acts[0].narrative.some((p) => p.includes('68%') && p.includes('es la excepción')),
    'enriquecimiento BIEN nombra el foco + cifra',
  );
  noBraces(r, 'TEST 7');
}

// ─── TEST 8 — SALUDABLE (todo verde) ─────────────────────────────────────────
console.log('\nTEST 8 — SALUDABLE');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 84, driverScores: { liderazgo: ds(88) } }),
    baseDept({ departmentId: 'b', engagementFavorability: 86, driverScores: { liderazgo: ds(90) } }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 85, orgZone: 'verde' }));
  assert(r.dominant === 'SALUDABLE', 'dominante = SALUDABLE');
  assert(r.acts.length === 1, 'count dinámico = 1 en clima sano');
  assert(r.acts[0].narrative.some((p) => p.includes('Liderazgo')), 'dimensionFuerte interpolada');
  assert(r.acts[0].hypotheses === '', 'SALUDABLE sin bloque "O"');
  assert(
    r.acts[0].narrative.some((p) => p.includes('es de solo 2 puntos') && p.includes('casi nadie se queda atrás')),
    'enriquecimiento SALUDABLE = spread total (2 puntos)',
  );
  noBraces(r, 'TEST 8');
}

// ─── TEST 9 — guard n≥5: gerencia con <5 respondientes NO dispara HOTSPOT ────
console.log('\nTEST 9 — guard n≥5 en activación');
{
  const depts = [
    baseDept({ departmentId: 'tiny', engagementFavorability: 40, riskZone: 'roja', totalResponded: 3 }),
    baseDept({ departmentId: 'b', engagementFavorability: 84 }),
    baseDept({ departmentId: 'c', engagementFavorability: 86 }),
  ];
  const r = ClimaSynthesisEngine.generate(
    makeResp(depts, { orgFav: 85, orgZone: 'verde', hotspot: ['tiny'] }),
  );
  assert(
    !r.acts.some((a) => a.type === 'HOTSPOT_CONCENTRADO'),
    'HOTSPOT excluido (gerencia con n<5)',
  );
  assert(r.dominant === 'SALUDABLE', 'cae a SALUDABLE (el outlier no cuenta)');
  assert(r.ancla.nodes[0].value === 0, 'Nodo 1 Ancla no cuenta la gerencia n<5');
}

// ─── TEST 10 — co-disparo: HOTSPOT (nivel+concentración) + MOMENTUM (tendencia) ─
console.log('\nTEST 10 — co-disparo HOTSPOT + MOMENTUM');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 40, riskZone: 'roja', momentum: -9 }),
    baseDept({ departmentId: 'b', engagementFavorability: 80 }),
    baseDept({ departmentId: 'c', engagementFavorability: 82 }),
    baseDept({ departmentId: 'd', engagementFavorability: 81 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 68, orgZone: 'amarilla' }));
  const order = r.acts.map((a) => a.type);
  assert(order.includes('HOTSPOT_CONCENTRADO'), 'HOTSPOT dispara (outlier roja + resto≥75)');
  assert(order.includes('MOMENTUM_NEGATIVO'), 'MOMENTUM co-dispara (ortogonal)');
  assert(order[0] === 'HOTSPOT_CONCENTRADO', 'dominante = HOTSPOT (prioridad sobre MOMENTUM)');
  assert(!order.includes('OBSERVACION_SIN_FOCO'), 'OBSERVACION NO dispara (es concentrado)');
}

// ─── TEST 11 — OBSERVACION_SIN_FOCO: bajo objetivo, difuso, sin outlier ──────
console.log('\nTEST 11 — OBSERVACION_SIN_FOCO (difuso bajo objetivo)');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 68, riskZone: 'amarilla' }),
    baseDept({ departmentId: 'b', engagementFavorability: 66, riskZone: 'amarilla' }),
    baseDept({ departmentId: 'c', engagementFavorability: 70, riskZone: 'amarilla' }),
    baseDept({ departmentId: 'd', engagementFavorability: 67, riskZone: 'amarilla' }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 68, orgZone: 'amarilla' }));
  assert(r.dominant === 'OBSERVACION_SIN_FOCO', 'dominante = OBSERVACION_SIN_FOCO');
  assert(r.acts.length === 1, 'un solo acto (difuso, sin ortogonales)');
  assert(r.acts[0].actSeparator.label === 'Panorama general', 'ActSeparator "Panorama general" (final)');
  assert(r.acts[0].anchor.value.includes('68'), 'ancla interpola {orgFavorability}=68%');
  assert(
    r.acts[0].narrative.some((p) => p.includes('más lejos del objetivo') && p.includes('no está sola')),
    'enriquecimiento OBSERVACION nombra el punto más bajo sin "aislado"',
  );
  assert(
    r.acts[0].hypotheses.includes('estándar de 75'),
    'hypotheses interpola {CLIMA_TARGET_FAVORABILITY}=75',
  );
  noBraces(r, 'TEST 11');
}

// ─── TEST 14 — DRIVER enrichment: 2 flags independientes (impact / fall) ─────
console.log('\nTEST 14 — DRIVER 2 flags independientes');
{
  // autonomia: bajo estándar en a,b (sistémico) + top-impact + mayor caída.
  const da = (driver: string, impact: number, delta: number) => ({
    driver, fav: 58, mean: 3, n: 8, carried: false,
    impact, gap: -17, gapBasis: 'fixed_target' as const, priority: 5,
    classification: 'focus_area' as const, momentumDelta: delta, momentumState: 'declining' as const, champion: null,
  });
  const mk = (id: string) =>
    baseDept({
      departmentId: id,
      driverScores: { autonomia: ds(58) },
      // autonomia top-impact (0.6) y mayor caída (-9) vs comunicacion (0.2 / -2).
      driverAnalysis: [da('autonomia', 0.6, -9), da('comunicacion', 0.2, -2)] as never,
    });
  const depts = [mk('a'), mk('b'), baseDept({ departmentId: 'c', engagementFavorability: 82 })];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 76, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'DRIVER_SISTEMICO')!;
  assert(!!act, 'DRIVER disparó');
  assert(
    act.narrative.some((p) => p.includes('el driver que más pesa') && p.includes('el que más cayó')),
    'ambos flags → frase completa con "Y"',
  );
  assert(
    act.narrative.some((p) => p.includes('variación de 9 puntos')),
    'deltaDimension calculado = 9 (no asumido)',
  );
  noBraces(r, 'TEST 14');
}

// Helper DriverImpact con fav configurable (para las variantes de un solo flag).
const dai = (driver: string, fav: number, impact: number, delta: number) => ({
  driver, fav, mean: Math.round((1 + (fav / 100) * 4) * 100) / 100, n: 8, carried: false,
  impact, gap: Math.round(fav - 75), gapBasis: 'fixed_target' as const, priority: 5,
  classification: (fav < 75 ? 'focus_area' : 'strength') as 'focus_area' | 'strength',
  momentumDelta: delta, momentumState: 'declining' as const, champion: null,
});

// ─── TEST 14a — DRIVER SOLO flag A (top-impact, NO mayor caída) ──────────────
console.log('\nTEST 14a — DRIVER solo flag A (top-impact)');
{
  // reconocimiento: sistémico + top-impact (0.65) pero delta −3; comunicacion cae más (−12).
  const mk = (id: string) => baseDept({
    departmentId: id,
    driverScores: { reconocimiento: ds(58), comunicacion: ds(82) },
    driverAnalysis: [dai('reconocimiento', 58, 0.65, -3), dai('comunicacion', 82, 0.25, -12)] as never,
  });
  const depts = [mk('a'), mk('b'), baseDept({ departmentId: 'c', engagementFavorability: 82 })];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 76, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'DRIVER_SISTEMICO')!;
  const expected =
    'Y no es cualquier problema: Reconocimiento es, hoy, el driver que más pesa en tu resultado general.';
  assert(act.narrative.includes(expected), `flag A solo → texto EXACTO: «${expected}»`);
  assert(!act.narrative.some((p) => p.includes('el que más cayó')), 'flag A solo NO trae la mitad de caída');
  assert(
    !act.narrative.some((p) => p.includes('Cuando el factor más influyente')),
    'flag A solo NO trae el cierre de A+B',
  );
  noBraces(r, 'TEST 14a');
}

// ─── TEST 14b — DRIVER SOLO flag B (mayor caída, NO top-impact) ──────────────
console.log('\nTEST 14b — DRIVER solo flag B (mayor caída)');
{
  // reconocimiento: sistémico + mayor caída (−12) pero impact 0.25; comunicacion pesa más (0.65).
  const mk = (id: string) => baseDept({
    departmentId: id,
    driverScores: { reconocimiento: ds(58), comunicacion: ds(82) },
    driverAnalysis: [dai('reconocimiento', 58, 0.25, -12), dai('comunicacion', 82, 0.65, -3)] as never,
  });
  const depts = [mk('a'), mk('b'), baseDept({ departmentId: 'c', engagementFavorability: 82 })];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 76, orgZone: 'verde' }));
  const act = r.acts.find((a) => a.type === 'DRIVER_SISTEMICO')!;
  const expected =
    'Y no es cualquier problema: Reconocimiento es, hoy, el que más cayó respecto al ciclo anterior, con una variación de 12 puntos.';
  assert(act.narrative.includes(expected), `flag B solo → texto EXACTO: «${expected}»`);
  assert(
    !act.narrative.some((p) => p.includes('el driver que más pesa')),
    'flag B solo NO trae la mitad de impact',
  );
  assert(
    !act.narrative.some((p) => p.includes('Cuando el factor más influyente')),
    'flag B solo NO trae el cierre de A+B',
  );
  noBraces(r, 'TEST 14b');
}

// ─── TEST 12 — CLAVE: outlier roja PERO resto también <75 → OBSERVACION, no HOTSPOT ─
console.log('\nTEST 12 — outlier roja + resto <75 → NO es "caso aislado"');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 45, riskZone: 'roja' }),
    baseDept({ departmentId: 'b', engagementFavorability: 62, riskZone: 'naranja' }),
    baseDept({ departmentId: 'c', engagementFavorability: 64, riskZone: 'naranja' }),
    baseDept({ departmentId: 'd', engagementFavorability: 66, riskZone: 'amarilla' }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 59, orgZone: 'roja' }));
  assert(!r.acts.some((a) => a.type === 'HOTSPOT_CONCENTRADO'), 'NO HOTSPOT (mediana-resto<75)');
  assert(r.dominant === 'OBSERVACION_SIN_FOCO', 'dominante = OBSERVACION (el peor no es aislado)');
}

// ─── TEST 13 — CLAVE: outlier severo en org sana (orgFav≥75) → BIEN_CON_FOCOS ─
console.log('\nTEST 13 — outlier severo pero orgFav≥75 → NO HOTSPOT');
{
  const depts = [
    baseDept({ departmentId: 'a', engagementFavorability: 40, riskZone: 'roja' }),
    baseDept({ departmentId: 'b', engagementFavorability: 85 }),
    baseDept({ departmentId: 'c', engagementFavorability: 88 }),
    baseDept({ departmentId: 'd', engagementFavorability: 86 }),
  ];
  const r = ClimaSynthesisEngine.generate(makeResp(depts, { orgFav: 82, orgZone: 'verde' }));
  assert(!r.acts.some((a) => a.type === 'HOTSPOT_CONCENTRADO'), 'NO HOTSPOT (orgFav≥75, guard absoluto)');
  assert(r.dominant === 'BIEN_CON_FOCOS', 'dominante = BIEN_CON_FOCOS (foco en org sana)');
}

console.log(`\n═══ RESULTADO: ${pass} PASS / ${fail} FAIL ═══`);
process.exit(fail === 0 ? 0 : 1);
