// scripts/gate4-voz-real-cmob0e56.ts
// Gate 4 (La Voz) — investigación READ-ONLY del material crudo real de cmob0e56:
// citas (patron_dominante.fragmentos), clasificación (nombre/senal_dominante/
// confianza) y hallazgo de género (alerta_sesgo_genero/evidencia_genero).
// CERO escritura.
//
// Run: npx tsx scripts/gate4-voz-real-cmob0e56.ts

import { prisma } from '@/lib/prisma';
import { buildLaVoz } from '@/lib/services/compliance/buildLaVoz';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type { ComplianceReportResponse } from '@/types/compliance';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';

async function main() {
  const rows = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED' },
    include: { department: { select: { displayName: true } } },
  });

  console.log(`Deptos COMPLETED: ${rows.length}\n`);
  const allQuotes: string[] = [];
  let generoCount = 0;

  for (const r of rows) {
    // resultPayload = { patrones: PatronAnalysisOutput, safetyDetail, convergencia }
    const p = ((r.resultPayload ?? {}) as any)?.patrones ?? {};
    const dom = p?.patrones?.[0] ?? null;
    console.log(`══ ${r.department?.displayName} [${r.departmentId}] ══`);
    console.log(`  senal_dominante=${p?.senal_dominante} · confianza=${p?.confianza_analisis}`);
    console.log(`  #patrones=${(p?.patrones ?? []).length}`);
    for (const pat of p?.patrones ?? []) {
      console.log(`    · nombre=${pat.nombre} · intensidad=${pat.intensidad} · origen=${pat.origen_percibido}`);
      console.log(`      fragmentos: ${(pat.fragmentos ?? []).map((f: string) => `"${f}"`).join(' · ')}`);
    }
    // Citas que ActoVoz hoy toma (solo patron_dominante = patrones[0]).
    for (const f of dom?.fragmentos ?? []) {
      const clean = String(f).trim();
      if (clean) allQuotes.push(clean);
    }
    // Género
    console.log(`  alerta_sesgo_genero=${p?.alerta_sesgo_genero}`);
    if (p?.alerta_sesgo_genero) {
      generoCount++;
      console.log(`    evidencia_genero="${p?.evidencia_genero}"`);
      console.log(`    analisis_genero="${p?.analisis_genero}"`);
    }
    console.log('');
  }

  // Dedup case-insensitive (como ActoVoz), tope 6.
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const c of allQuotes) {
    const k = c.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(c);
    if (uniq.length >= 6) break;
  }

  console.log('═══ CITAS (patron_dominante, dedup, tope 6) ═══');
  uniq.forEach((c, i) => console.log(`  ${i + 1}. "${c}"`));
  console.log(`\nn citas = ${uniq.length} · hallazgos género = ${generoCount}`);

  // Clasificación para el selector 0c.
  const SILENCIO_SET = new Set(['silencio_organizacional', 'resignacion_aprendida', 'miedo_represalias']);
  const doms = rows
    .map((r) => ((r.resultPayload ?? {}) as any)?.patrones?.patrones?.[0]?.nombre)
    .filter(Boolean);
  console.log(`\n═══ CLASIFICACIÓN (patron_dominante.nombre por depto) ═══`);
  console.log(`  nombres dominantes: ${doms.join(' · ')}`);
  const todasSilencio = doms.length > 0 && doms.every((n: string) => SILENCIO_SET.has(n));
  console.log(`  ¿todas en {silencio_organizacional, resignacion_aprendida, miedo_represalias}? → ${todasSilencio}`);

  // ── Resolver gerencia (level 2) de cada depto para alertasGenero ──
  const allDepts = await prisma.department.findMany({
    where: { accountId: ACCOUNT_ID, isActive: true },
    select: { id: true, displayName: true, level: true, parentId: true },
  });
  const byId = new Map(allDepts.map((d) => [d.id, d]));
  function gerenciaName(deptId: string): string | null {
    let cur = byId.get(deptId);
    let max = 10;
    while (cur && cur.level > 2 && cur.parentId && max-- > 0) {
      const parent = byId.get(cur.parentId);
      if (!parent) break;
      if (parent.level === 2) return parent.displayName;
      cur = parent;
    }
    return cur && cur.level === 2 ? cur.displayName : null;
  }

  // ── Construir ComplianceReportResponse mínimo y correr buildLaVoz ──
  const departments = rows.map((r) => {
    const pa = ((r.resultPayload ?? {}) as any)?.patrones ?? {};
    const dom = pa?.patrones?.[0] ?? null;
    return {
      departmentId: r.departmentId,
      departmentName: r.department?.displayName,
      patrones: {
        senal_dominante: pa?.senal_dominante ?? 'ambiente_sano',
        confianza_analisis: pa?.confianza_analisis ?? 'media',
        patron_dominante: dom
          ? { nombre: dom.nombre, nombreLegible: dom.nombre, intensidad: dom.intensidad, origen_percibido: dom.origen_percibido, fragmentos: dom.fragmentos ?? [] }
          : null,
      },
    };
  });
  const alertasGenero = rows
    .filter((r) => (((r.resultPayload ?? {}) as any)?.patrones ?? {})?.alerta_sesgo_genero)
    .map((r) => {
      const pa = ((r.resultPayload ?? {}) as any)?.patrones ?? {};
      return {
        departmentName: r.department?.displayName,
        parentDepartmentName: gerenciaName(r.departmentId ?? ''),
        evidenciaGenero: pa?.evidencia_genero ?? '',
        analisisGenero: pa?.analisis_genero ?? '',
        contextoGenero: '',
      };
    });

  const data = {
    success: true,
    type: 'executive',
    company: { name: 'demo', country: 'CL' },
    narratives: { alertasGenero },
    data: { departments },
  } as unknown as ComplianceReportResponse;

  const acto = buildLaVoz(data)!;
  console.log('\n╔══ GATE 4 · LA VOZ — ACTO (caso real) ══╗\n');
  console.log(`LA VOZ\n   ${acto.n}\n   VOCES RECOGIDAS  (forma: ${acto.forma})\n`);
  console.log(`   ${acto.narrativa.pre}[${acto.narrativa.destacado}]${acto.narrativa.post}\n`);
  console.log(`   ${acto.citas.map((c) => `"${c}"`).join('  ·  ')}\n`);
  if (acto.generos.length > 0) {
    console.log(`   ── ${acto.generos.length === 1 ? 'VOZ' : 'VOCES'} CON SESGO DE GÉNERO · ANÁLISIS IA`);
    for (const g of acto.generos) {
      console.log(`   ${formatDepartmentName(g.gerencia)}`);
      console.log(`   "${g.cita}"`);
    }
    console.log(`   ${acto.lecturaAlcance}\n`);
  }
  console.log(`   «${acto.cierre}»`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('ERROR:', e?.message ?? e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
