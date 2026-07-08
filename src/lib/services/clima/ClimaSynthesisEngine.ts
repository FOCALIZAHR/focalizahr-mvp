// src/lib/services/clima/ClimaSynthesisEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// ClimaSynthesisEngine (Gate 4.5a) — motor de la Cascada Ejecutiva de Clima.
//
// Función pura (patrón AmbienteSynthesisEngine): consume la ClimaResultsResponse
// read-time (Gate 4, extendida con crossSignals) y decide DINÁMICAMENTE cuántos
// y cuáles Actos mostrar (semilla §9 — reemplaza "4 Actos" fijos): 1-2 en clima
// sano, 4-5 en crisis. NO recomputa nada sellado de Gate 3 — solo lee, filtra y
// ensambla la narrativa verbatim del ClimaNarrativeDictionary.
//
// GUARD n≥5 EN LA ACTIVACIÓN (Nota C, Victor): el motor NO dispara ningún tipo
// para una gerencia/dimensión con <5 respondientes. Los 3 flags sellados de Gate 3
// (hotspot ALG 2, theatre) gatean solo por presencia de dato, NUNCA por n → el
// motor re-filtra read-time contra `detectableDepts` (totalResponded ≥ 5). El
// guard de nivel dimensión (DRIVER_SISTEMICO) usa driverScores[d].n (por-driver;
// los carried tienen n:0 y quedan auto-excluidos). Gate binario (estándar Gallup).
//
// Copy: TODO verbatim del ClimaNarrativeDictionary (Principio 4). Este archivo
// solo elige el tipo, interpola placeholders y decide qué cross-signal insertar.
// ════════════════════════════════════════════════════════════════════════════

import type { ClimaResultsResponse, ClimaDepartmentInsight } from '@/types/clima';
import type {
  ClimaDiagnosticType,
  ClimaAct,
  ClimaSynthesis,
  ClimaSynthesisResult,
  ClimaPortadaContent,
  ClimaAnclaNode,
} from '@/types/clima-cascada';
// FUENTE ÚNICA client-safe (sin prisma). El motor lo consume ClimaIntroSequence
// (client component); PulseEngine arrastra prisma vía GoalsDiagnosticService, por
// eso NO se importa de ahí sino del módulo de constantes compartido.
import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import {
  CLIMA_TARGET_FAVORABILITY,
  LEADERSHIP_DRIVER,
  MOMENTUM_DECLINING_PP,
  CLIMA_MIN_RESPONDENTS,
} from '@/lib/services/clima/climaThresholds';
import {
  ACT_DICTIONARY,
  CROSS_SIGNAL_CLAUSES,
  PORTADA_BY_ZONE,
  PORTADA_CTA,
  ANCLA_NODE_LABELS,
  ANCLA_CONFIABILIDAD_TOOLTIP,
  ANCLA_SCORE_LABEL,
  anclaNode1Narrative,
  anclaNode2Narrative,
  anclaNode3Narrative,
  anclaNode4Narrative,
  interpolate,
  type CrossSignalKey,
} from '@/lib/services/clima/ClimaNarrativeDictionary';

// ════════════════════════════════════════════════════════════════════════════
// UMBRALES — todos exportados para auditabilidad y tests. Editables por dev
// (comparabilidad), no configurables por cliente.
// ════════════════════════════════════════════════════════════════════════════

export const THRESHOLDS = {
  /** Guard n≥5 del sistema (privacidad + activación del motor, Nota C). Fuente única. */
  MIN_RESPONDENTS: CLIMA_MIN_RESPONDENTS,
  /** TEATRO: "2 o más gerencias" (§1 tooltip Ancla Científica). */
  TEATRO_MIN_DEPTS: 2,
  /** DRIVER_SISTEMICO: la misma dimensión bajo estándar en ≥N gerencias. */
  DRIVER_MIN_DEPTS: 2,
  /** MOMENTUM: caída ≤ este delta (pp) cuenta como "cayendo". Fuente única (DECLINING). */
  MOMENTUM_DECLINE_PP: MOMENTUM_DECLINING_PP,
} as const;

/** Orden de prioridad (dominante = el primero disparado). TEATRO overridea
 *  (confiabilidad: ningún número es confiable hasta resolverse). HOTSPOT y
 *  OBSERVACION_SIN_FOCO son el par mutuamente excluyente del nivel bajo objetivo
 *  (concentrado vs difuso). */
export const DIAGNOSTIC_PRIORITY: ClimaDiagnosticType[] = [
  'TEATRO_GENERALIZADO',
  'HOTSPOT_CONCENTRADO',
  'OBSERVACION_SIN_FOCO',
  'DRIVER_SISTEMICO',
  'MOMENTUM_NEGATIVO',
  'BIEN_CON_FOCOS',
  'SALUDABLE',
];

// ════════════════════════════════════════════════════════════════════════════
// LABELS de dimensión (driver questionCategory → etiqueta ejecutiva). Los ids
// son contrato inmutable; solo la etiqueta es libre. Fallback = capitalizar.
// ════════════════════════════════════════════════════════════════════════════

const DIMENSION_LABELS: Record<string, string> = {
  liderazgo: 'Liderazgo',
  autonomia: 'Autonomía',
  desarrollo: 'Desarrollo',
  crecimiento: 'Crecimiento',
  comunicacion: 'Comunicación',
  reconocimiento: 'Reconocimiento',
  satisfaccion: 'Satisfacción',
  compensaciones: 'Compensaciones',
};

function dimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ════════════════════════════════════════════════════════════════════════════

/** Decisión de enriquecimiento "momento de revelación" (Nota G) — qué variante
 *  del slot de enriquecimiento incluir. Los valores ya están en `context`. */
interface EnrichmentDecision {
  include: boolean;
  /** n<5 → variante de solo magnitud (en la práctica solo MOMENTUM lo alcanza). */
  useMagnitude: boolean;
  /** MOMENTUM — mostrar el contraste con la gerencia que mejoró (n≥5). */
  contrast: boolean;
  /** DRIVER — flag A: la dimensión es también la de mayor impact. */
  driverImpact: boolean;
  /** DRIVER — flag B: la dimensión es también la de mayor caída (calculado). */
  driverFall: boolean;
}

/** Un tipo disparado + su contexto de interpolación + decisión de cross-signal. */
interface FiredDiagnostic {
  type: ClimaDiagnosticType;
  context: Record<string, string>;
  /** Cláusula §7 a insertar (convergencia + "O"), o null. El motor solo elige
   *  'exit' u 'onboarding' en 4.5a; el sesgo del evaluador queda DIFERIDO. */
  crossClause: CrossSignalKey | null;
  /** Enriquecimiento (Nota G). undefined = Acto sin enriquecimiento (TEATRO). */
  enrichment?: EnrichmentDecision;
  trigger: string;
}

// ════════════════════════════════════════════════════════════════════════════
// MOTOR
// ════════════════════════════════════════════════════════════════════════════

export class ClimaSynthesisEngine {
  /** Punto de entrada. Pure. */
  static generate(input: ClimaResultsResponse): ClimaSynthesisResult {
    const target = CLIMA_TARGET_FAVORABILITY;
    const orgFav = input.orgFavorability;

    // 1. Guard n≥5 en la activación: solo gerencias con ≥5 respondientes son
    //    detectables (department-level). Los flags sellados no gatean por n.
    const detectable = input.departments.filter(
      (d) => d.totalResponded >= THRESHOLDS.MIN_RESPONDENTS,
    );
    const detectableIds = new Set(detectable.map((d) => d.departmentId));
    const byId = new Map(detectable.map((d) => [d.departmentId, d]));

    // 2. Señales re-filtradas contra `detectable` (read-time). El p25 sellado
    //    (hotspotDepartmentIds) YA NO decide HOTSPOT: pasó a ser descriptor de
    //    distribución, subordinado al piso absoluto (ver §HOTSPOT abajo).
    const theatreDepts = input.companyPulse.theatreDepartmentIds
      .filter((id) => detectableIds.has(id))
      .map((id) => byId.get(id)!)
      .filter(Boolean);
    const decliningDepts = detectable.filter(
      (d) => d.momentum !== null && d.momentum <= THRESHOLDS.MOMENTUM_DECLINE_PP,
    );
    const belowStandard = detectable.filter(
      (d) => d.engagementFavorability !== null && d.engagementFavorability < target,
    );
    const nonVerde = detectable.filter((d) => d.riskZone !== null && d.riskZone !== 'verde');

    // Agregados de nivel para el enriquecimiento "momento de revelación" (Nota G).
    const favs = detectable
      .map((d) => d.engagementFavorability)
      .filter((f): f is number => f !== null);
    const bestFav = favs.length ? Math.max(...favs) : null;
    // Movers sobre TODAS las gerencias ("la más pronunciada de toda la organización").
    // El nombre solo se usa con n≥5 (guard Nota G #1); rankMomentumMovers no guardea.
    const movers = this.computeMovers(input.departments);

    // 3. Disparo en DOS CAPAS (jerarquía sellada — ver as-built):
    //    · El NIVEL ABSOLUTO (orgFav vs 75) es la fuente de verdad y manda primero.
    //    · El percentil / la mediana solo DESCRIBEN la distribución dentro de un
    //      nivel absoluto ya establecido — nunca deciden por sí solos si hay problema.
    //    Ejes ORTOGONALES (co-disparan, anclados en umbrales absolutos): confiabilidad
    //    (TEATRO), tendencia (MOMENTUM, delta), dimensión (DRIVER, driver<75).
    //    Eje NIVEL+CONCENTRACIÓN: exactamente un tipo (o ninguno si un ortogonal ya
    //    explica el nivel), según orgFav vs 75 y la forma (concentrado vs difuso).
    const fired: FiredDiagnostic[] = [];

    // ─── Ortogonal · Confiabilidad (override) — absoluto (ISA>70 ∧ eiFav<50) ──
    if (theatreDepts.length >= THRESHOLDS.TEATRO_MIN_DEPTS) {
      fired.push({
        type: 'TEATRO_GENERALIZADO',
        context: { n: String(theatreDepts.length) },
        crossClause: null,
        trigger: `${theatreDepts.length} gerencias con teatro (n≥5)`,
      });
    }

    // ─── Ortogonal · Tendencia — delta absoluto (momentum ≤ −5pp) ─────────────
    if (decliningDepts.length >= 1) {
      const context: Record<string, string> = { n: String(decliningDepts.length) };
      let crossClause: CrossSignalKey | null = null;
      const onbDept = decliningDepts.find((d) => d.crossSignals?.onboardingAbandon != null);
      if (onbDept) {
        crossClause = 'onboarding';
        context.gerencia = onbDept.departmentName;
      }
      // Enriquecimiento: mayor caída (nombre si n≥5, magnitud si n<5) + contraste.
      const { faller, riser } = movers;
      let useMagnitude = true;
      if (faller && faller.momentum !== null) {
        context.deltaBaja = String(Math.abs(Math.round(faller.momentum)));
        if (faller.totalResponded >= THRESHOLDS.MIN_RESPONDENTS) {
          useMagnitude = false;
          context.GerenciaBaja = faller.departmentName;
        }
      }
      let contrast = false;
      if (riser && riser.momentum !== null && riser.totalResponded >= THRESHOLDS.MIN_RESPONDENTS) {
        contrast = true;
        context.GerenciaSube = riser.departmentName;
        context.deltaSube = String(Math.round(riser.momentum));
      }
      fired.push({
        type: 'MOMENTUM_NEGATIVO',
        context,
        crossClause,
        enrichment: {
          include: faller !== null,
          useMagnitude,
          contrast,
          driverImpact: false,
          driverFall: false,
        },
        trigger: `${decliningDepts.length} gerencias cayendo (≤${THRESHOLDS.MOMENTUM_DECLINE_PP}pp)`,
      });
    }

    // ─── Ortogonal · Dimensión — absoluto (driver < 75 en ≥2 gerencias) ───────
    const systemic = this.detectSystemicDriver(detectable, target);
    if (systemic) {
      const isLeadership = systemic.driver === LEADERSHIP_DRIVER;
      const context: Record<string, string> = {
        n: String(systemic.depts.length),
        dimension: dimensionLabel(systemic.driver),
      };
      let crossClause: CrossSignalKey | null = null;
      if (isLeadership) {
        // §7.3 exit (gerencia afectada cuyo motivo top de salida nombra jefe).
        // El sesgo del evaluador (§7.1/7.2) queda DIFERIDO — no se inserta en 4.5a.
        const exitDept = systemic.depts.find(
          (d) => d.crossSignals?.exitTopFactor?.mentionsManager === true,
        );
        if (exitDept) {
          crossClause = 'exit';
          context.gerencia = exitDept.departmentName;
        }
      } else {
        const onbDept = systemic.depts.find((d) => d.crossSignals?.onboardingAbandon != null);
        if (onbDept) {
          crossClause = 'onboarding';
          context.gerencia = onbDept.departmentName;
        }
      }
      // Enriquecimiento DRIVER — 2 flags INDEPENDIENTES (decisión Victor). La
      // detección NO cambia: "sistémico" (≥2 gerencias) ya está garantizado.
      const di = this.driverImpactAndDelta(detectable, systemic.driver);
      const driverImpact = di.isTopImpact; // flag A: la dimensión más pesa (mayor impact)
      const driverFall = di.isTopFall; // flag B: la dimensión más cayó (calculado)
      if (driverFall && di.orgDelta !== null) {
        context.deltaDimension = String(Math.abs(Math.round(di.orgDelta)));
      }
      fired.push({
        type: 'DRIVER_SISTEMICO',
        context,
        crossClause,
        enrichment: {
          include: driverImpact || driverFall,
          useMagnitude: false,
          contrast: false,
          driverImpact,
          driverFall,
        },
        trigger: `driver ${systemic.driver} bajo estándar en ${systemic.depts.length} gerencias`,
      });
    }

    // ¿Algún eje ortogonal ya lleva la historia? (para no forzar SALUDABLE/nivel).
    const hasOrthogonal = fired.length > 0;

    // ─── Eje NIVEL + CONCENTRACIÓN (exactamente uno, o ninguno si un ortogonal
    //     ya explica el nivel bajo) ───────────────────────────────────────────
    if (orgFav !== null && orgFav >= target) {
      // Empresa SOBRE el objetivo (absoluto).
      if (nonVerde.length > 0) {
        // BIEN_CON_FOCOS: promedio sano con focos puntuales. El foco (peor no-verde,
        // n≥5 por ser detectable) es a la vez el sujeto del enriquecimiento y del
        // cruce ("en esa misma gerencia").
        const foco = this.pickWorst(nonVerde)!;
        const context: Record<string, string> = {
          n: String(nonVerde.length),
          total: String(detectable.length),
          gerencia: foco.departmentName,
          favorabilidadGerencia: String(Math.round(foco.engagementFavorability!)),
          gapVsPromedioOrg: String(
            Math.round(this.meanExcluding(detectable, foco) - foco.engagementFavorability!),
          ),
        };
        const crossClause: CrossSignalKey | null =
          foco.crossSignals?.onboardingAbandon != null ? 'onboarding' : null;
        fired.push({
          type: 'BIEN_CON_FOCOS',
          context,
          crossClause,
          enrichment: {
            include: true,
            useMagnitude: false,
            contrast: false,
            driverImpact: false,
            driverFall: false,
          },
          trigger: `orgFav=${orgFav} sano · ${nonVerde.length}/${detectable.length} focos`,
        });
      } else if (!hasOrthogonal) {
        // SALUDABLE: todo verde, sin caída, sin dimensión, sin teatro. Parte limpio.
        const context: Record<string, string> = {
          orgFavorability: this.pct(orgFav),
          dimensionFuerte: this.strongestDimension(detectable),
        };
        const spread = bestFav !== null && favs.length ? bestFav - Math.min(...favs) : null;
        if (spread !== null) context.spreadTotal = String(Math.round(spread));
        fired.push({
          type: 'SALUDABLE',
          context,
          crossClause: null,
          enrichment: {
            include: spread !== null,
            useMagnitude: false,
            contrast: false,
            driverImpact: false,
            driverFall: false,
          },
          trigger: `sano · orgFav=${orgFav}`,
        });
      }
      // else (todo verde pero un ortogonal disparó): el ortogonal lleva la historia.
    } else if (orgFav !== null && orgFav < target && detectable.length > 0) {
      // Empresa BAJO el objetivo (absoluto) → hay problema. ¿Concentrado o difuso?
      const worst = this.pickWorst(detectable);
      // HOTSPOT = 3 condiciones: orgFav<75 (arriba) + outlier naranja/roja (piso
      // absoluto) + mediana-del-resto ≥ 75 (fondo sano → "caso aislado" es cierto
      // por construcción). Sin fondo sano, NO es concentración → cae a difuso.
      const concentrated =
        detectable.length >= 3 &&
        worst !== null &&
        (worst.riskZone === 'naranja' || worst.riskZone === 'roja') &&
        this.medianOfRest(detectable, worst) >= target;

      if (concentrated && worst) {
        const exit = worst.crossSignals?.exitTopFactor?.mentionsManager === true;
        const wFav = worst.engagementFavorability!; // pickWorst descarta null
        const context: Record<string, string> = {
          gerencia: worst.departmentName,
          favorability: this.pct(wFav),
          favorabilidadGerencia: String(Math.round(wFav)),
        };
        if (orgFav !== null) context.gapVsPromedio = String(Math.round(orgFav - wFav));
        if (bestFav !== null) context.spreadVsMejor = String(Math.round(bestFav - wFav));
        fired.push({
          type: 'HOTSPOT_CONCENTRADO',
          context,
          crossClause: exit ? 'exit' : null,
          enrichment: {
            include: true,
            useMagnitude: false, // worst ∈ detectable → n≥5 → siempre nombrado
            contrast: false,
            driverImpact: false,
            driverFall: false,
          },
          trigger: `hotspot ${worst.departmentName} fav=${worst.engagementFavorability} (resto≥${target})`,
        });
      } else if (!systemic) {
        // OBSERVACION_SIN_FOCO: bajo objetivo, difuso, sin foco concentrado ni
        // dimensión que lo explique. El punto más bajo (n≥5) se nombra sin "aislado".
        const lowest = worst; // pickWorst(detectable)
        const context: Record<string, string> = {
          orgFavorability: this.pct(orgFav),
          CLIMA_TARGET_FAVORABILITY: String(target),
        };
        if (lowest && lowest.engagementFavorability !== null) {
          context.GerenciaMasBaja = lowest.departmentName;
          context.favorabilidadMasBaja = String(Math.round(lowest.engagementFavorability));
        }
        // onboarding parejo: abandono elevado en ≥2 gerencias (no concentrado).
        const parejoCount = detectable.filter(
          (d) => d.crossSignals?.onboardingAbandon != null,
        ).length;
        const crossClause: CrossSignalKey | null = parejoCount >= 2 ? 'onboardingParejo' : null;
        fired.push({
          type: 'OBSERVACION_SIN_FOCO',
          context,
          crossClause,
          enrichment: {
            include: !!lowest,
            useMagnitude: false, // lowest ∈ detectable → n≥5
            contrast: false,
            driverImpact: false,
            driverFall: false,
          },
          trigger: `difuso bajo objetivo · orgFav=${orgFav}`,
        });
      }
      // else (difuso pero systemic): DRIVER_SISTEMICO ya explica el nivel bajo.
    } else if (!hasOrthogonal) {
      // orgFav null / sin base para diagnosticar nivel → cierre benigno.
      fired.push({
        type: 'SALUDABLE',
        context: {
          orgFavorability: this.pct(orgFav),
          dimensionFuerte: this.strongestDimension(detectable),
        },
        crossClause: null,
        trigger: `sin base · orgFav=${orgFav}`,
      });
    }

    // 4. Ordenar por prioridad; dominante = primero.
    fired.sort(
      (a, b) => DIAGNOSTIC_PRIORITY.indexOf(a.type) - DIAGNOSTIC_PRIORITY.indexOf(b.type),
    );
    const dominantFired = fired[0];

    // 5. Construir Actos + Síntesis + Portada + Ancla.
    const acts = fired.map((f) => this.buildAct(f));
    const synthesis = this.buildSynthesis(dominantFired);
    const portada = this.buildPortada(orgFav, input.orgRiskZone, target);
    const ancla = this.buildAncla(
      orgFav,
      detectable,
      belowStandard.length,
      decliningDepts.length,
      theatreDepts.length,
      target,
    );

    return {
      portada,
      ancla,
      acts,
      dominant: dominantFired.type,
      synthesis,
      trigger: fired.map((f) => `${f.type}[${f.trigger}]`).join(' · '),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Detección de driver sistémico
  // ──────────────────────────────────────────────────────────────────────────

  /** La misma dimensión bajo estándar (fav < target, n≥5, medido) en ≥N gerencias
   *  detectables. Devuelve el driver con más gerencias afectadas (desempate: menor
   *  fav promedio). NOTA: la condición "sin relación jerárquica" del doc no se
   *  verifica acá (la respuesta no trae parentId) — refinamiento diferido. */
  private static detectSystemicDriver(
    detectable: ClimaDepartmentInsight[],
    target: number,
  ): { driver: string; depts: ClimaDepartmentInsight[] } | null {
    const affectedByDriver = new Map<string, ClimaDepartmentInsight[]>();
    for (const d of detectable) {
      const scores = d.driverScores ?? {};
      for (const [driver, s] of Object.entries(scores)) {
        // Guard nivel dimensión: n≥5 por-driver + medido (carried tiene n:0).
        if (s.carried || s.n < THRESHOLDS.MIN_RESPONDENTS || s.fav === null) continue;
        if (s.fav < target) {
          const list = affectedByDriver.get(driver) ?? [];
          list.push(d);
          affectedByDriver.set(driver, list);
        }
      }
    }

    let best: { driver: string; depts: ClimaDepartmentInsight[]; avgFav: number } | null = null;
    for (const [driver, depts] of affectedByDriver) {
      if (depts.length < THRESHOLDS.DRIVER_MIN_DEPTS) continue;
      const avgFav =
        depts.reduce((s, d) => s + (d.driverScores![driver].fav ?? 0), 0) / depts.length;
      if (
        !best ||
        depts.length > best.depts.length ||
        (depts.length === best.depts.length && avgFav < best.avgFav)
      ) {
        best = { driver, depts, avgFav };
      }
    }
    return best ? { driver: best.driver, depts: best.depts } : null;
  }

  /** Dimensión que más sostiene el resultado = driver con mayor fav promedio
   *  (medido, n≥5) sobre las gerencias detectables. */
  private static strongestDimension(detectable: ClimaDepartmentInsight[]): string {
    const sums = new Map<string, { sum: number; count: number }>();
    for (const d of detectable) {
      for (const [driver, s] of Object.entries(d.driverScores ?? {})) {
        if (s.carried || s.n < THRESHOLDS.MIN_RESPONDENTS || s.fav === null) continue;
        const agg = sums.get(driver) ?? { sum: 0, count: 0 };
        agg.sum += s.fav;
        agg.count += 1;
        sums.set(driver, agg);
      }
    }
    let bestDriver: string | null = null;
    let bestAvg = -1;
    for (const [driver, { sum, count }] of sums) {
      const avg = sum / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDriver = driver;
      }
    }
    return bestDriver ? dimensionLabel(bestDriver) : 'El compromiso del equipo';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Construcción de Acto / Síntesis / Portada / Ancla
  // ──────────────────────────────────────────────────────────────────────────

  private static buildAct(f: FiredDiagnostic): ClimaAct {
    const copy = ACT_DICTIONARY[f.type];
    const ctx = f.context;
    const narrative: string[] = copy.narrativePre.map((p) => interpolate(p, ctx));

    // Enriquecimiento "momento de revelación" (Nota G) — entre pre y post.
    if (copy.enrichment && f.enrichment?.include) {
      const e = copy.enrichment;
      if (e.driver) {
        // DRIVER — 2 flags independientes (impact / fall). Fragmentos verbatim §3.
        const { driverImpact, driverFall } = f.enrichment;
        let s: string | null = null;
        if (driverImpact && driverFall) {
          s = e.driver.prefix + e.driver.impact + e.driver.joinAnd + e.driver.fall + e.driver.closingBoth;
        } else if (driverImpact) {
          s = e.driver.prefix + e.driver.impact + e.driver.closingSingle;
        } else if (driverFall) {
          s = e.driver.prefix + e.driver.fall + e.driver.closingSingle;
        }
        if (s) narrative.push(interpolate(s, ctx));
      } else {
        // named (n≥5) / magnitude (n<5) + contrast (MOMENTUM).
        if (f.enrichment.useMagnitude && e.magnitude) narrative.push(interpolate(e.magnitude, ctx));
        else if (e.named) narrative.push(interpolate(e.named, ctx));
        if (f.enrichment.contrast && e.contrast) narrative.push(interpolate(e.contrast, ctx));
      }
    }

    // Párrafos posteriores al enriquecimiento.
    for (const p of copy.narrativePost) narrative.push(interpolate(p, ctx));

    // Cruce §7 (fuente única): la convergencia va a la narrativa; su "O" REEMPLAZA
    // al "O" base SOLO si no está vacío (onboardingParejo conserva el "O" base).
    let hypotheses = interpolate(copy.hypotheses, ctx);
    if (f.crossClause) {
      const clause = CROSS_SIGNAL_CLAUSES[f.crossClause];
      narrative.push(interpolate(clause.convergence, ctx));
      if (clause.hypotheses) hypotheses = interpolate(clause.hypotheses, ctx);
    }

    return {
      type: f.type,
      actSeparator: copy.actSeparator,
      anchor: {
        value: interpolate(copy.anchor.value, ctx),
        caption: interpolate(copy.anchor.caption, ctx),
      },
      narrative,
      hypotheses,
      coachingTip: interpolate(copy.coachingTip, ctx),
      ctaLabel: interpolate(copy.ctaLabel, ctx),
      heroColor: copy.heroColor,
    };
  }

  private static buildSynthesis(dominant: FiredDiagnostic): ClimaSynthesis {
    const s = ACT_DICTIONARY[dominant.type].synthesis;
    const ctx = dominant.context;
    return {
      diagnosticType: dominant.type,
      classification: interpolate(s.classification, ctx),
      implication: interpolate(s.implication, ctx),
      path: interpolate(s.path, ctx),
      accountability: interpolate(s.accountability, ctx),
    };
  }

  private static buildPortada(
    orgFav: number | null,
    orgRiskZone: RiskZone | null,
    target: number,
  ): ClimaPortadaContent {
    const zone: RiskZone = orgRiskZone ?? 'verde';
    const n = this.round(orgFav);
    const gap = orgFav !== null ? String(Math.max(0, Math.round(target - orgFav))) : '';
    return {
      hook: interpolate(PORTADA_BY_ZONE[zone], { n, gap }),
      ctaLabel: PORTADA_CTA,
    };
  }

  /** Acto Ancla (Tipo 2 — Masa y Gravedad). 4 nodos anti-robo-de-trueno. */
  private static buildAncla(
    orgFav: number | null,
    detectable: ClimaDepartmentInsight[],
    nBelow: number,
    nFalling: number,
    nTheatre: number,
    target: number,
  ): { score: number | null; scoreLabel: string; nodes: ClimaAnclaNode[] } {
    const total = detectable.length;

    // Nodo 2 — Concentración: % del riesgo total que vive en el peor punto.
    let totalRisk = 0;
    let worstRisk = 0;
    for (const d of detectable) {
      if (d.engagementFavorability === null) continue;
      const risk = Math.max(0, target - d.engagementFavorability);
      totalRisk += risk;
      if (risk > worstRisk) worstRisk = risk;
    }
    const concentrationPct = totalRisk > 0 ? Math.round((worstRisk / totalRisk) * 100) : 0;

    const nodes: ClimaAnclaNode[] = [
      {
        value: nBelow,
        label: ANCLA_NODE_LABELS.distribucion,
        narrative: anclaNode1Narrative(nBelow, total),
        suffix: '',
      },
      {
        value: concentrationPct,
        label: ANCLA_NODE_LABELS.concentracion,
        narrative: anclaNode2Narrative(concentrationPct),
        suffix: '%',
      },
      {
        value: nFalling,
        label: ANCLA_NODE_LABELS.volatilidad,
        narrative: anclaNode3Narrative(nFalling, total),
        suffix: '',
      },
      {
        value: nTheatre,
        label: ANCLA_NODE_LABELS.confiabilidad,
        narrative: anclaNode4Narrative(nTheatre),
        tooltip: ANCLA_CONFIABILIDAD_TOOLTIP,
        suffix: '',
      },
    ];

    return { score: orgFav !== null ? Math.round(orgFav) : null, scoreLabel: ANCLA_SCORE_LABEL, nodes };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Depto con menor engagementFavorability (peor). */
  private static pickWorst(
    depts: ClimaDepartmentInsight[],
  ): ClimaDepartmentInsight | null {
    let worst: ClimaDepartmentInsight | null = null;
    for (const d of depts) {
      if (d.engagementFavorability === null) continue;
      if (worst === null || d.engagementFavorability < worst.engagementFavorability!) {
        worst = d;
      }
    }
    return worst;
  }

  /** Mediana de engagementFavorability del RESTO (excluye `worst`). Mide si el
   *  fondo contra el que se compara el outlier está sano — condición del HOTSPOT
   *  (el percentil describe distribución, no decide problema). null → -Infinity
   *  (sin resto → no hay concentración posible). */
  private static medianOfRest(
    depts: ClimaDepartmentInsight[],
    worst: ClimaDepartmentInsight,
  ): number {
    const rest = depts
      .filter((d) => d.departmentId !== worst.departmentId && d.engagementFavorability !== null)
      .map((d) => d.engagementFavorability as number)
      .sort((a, b) => a - b);
    if (rest.length === 0) return -Infinity;
    const mid = Math.floor(rest.length / 2);
    return rest.length % 2 === 0 ? (rest[mid - 1] + rest[mid]) / 2 : rest[mid];
  }

  /** Mayor caída y mayor mejora de momentum sobre TODAS las gerencias (para el
   *  enriquecimiento; el nombre solo se usa con n≥5, guard aplicado en el caller). */
  private static computeMovers(all: ClimaDepartmentInsight[]): {
    faller: ClimaDepartmentInsight | null;
    riser: ClimaDepartmentInsight | null;
  } {
    let faller: ClimaDepartmentInsight | null = null;
    let riser: ClimaDepartmentInsight | null = null;
    for (const d of all) {
      if (d.momentum === null) continue;
      if (faller === null || d.momentum < faller.momentum!) faller = d;
      if (d.momentum > 0 && (riser === null || d.momentum > riser.momentum!)) riser = d;
    }
    return { faller, riser };
  }

  /** DRIVER — 2 flags independientes + delta org (Nota G). impact org-level =
   *  driverAnalysis.impact (|r|, mismo entre deptos); delta org = promedio de
   *  momentumDelta medido. isTopImpact = mayor |impact| entre drivers; isTopFall =
   *  delta org más negativo entre drivers (y < 0). */
  private static driverImpactAndDelta(
    detectable: ClimaDepartmentInsight[],
    driver: string,
  ): { isTopImpact: boolean; isTopFall: boolean; orgDelta: number | null } {
    const impactByDriver = new Map<string, number>(); // |impact|
    const deltaByDriver = new Map<string, { sum: number; count: number }>();
    for (const d of detectable) {
      for (const da of d.driverAnalysis ?? []) {
        if (da.impact !== null && !impactByDriver.has(da.driver)) {
          impactByDriver.set(da.driver, Math.abs(da.impact));
        }
        if (da.momentumDelta !== null && !da.carried) {
          const agg = deltaByDriver.get(da.driver) ?? { sum: 0, count: 0 };
          agg.sum += da.momentumDelta;
          agg.count += 1;
          deltaByDriver.set(da.driver, agg);
        }
      }
    }

    const myImpact = impactByDriver.get(driver) ?? null;
    let isTopImpact = false;
    if (myImpact !== null) {
      isTopImpact = true;
      for (const [dr, imp] of impactByDriver) {
        if (dr !== driver && imp > myImpact) {
          isTopImpact = false;
          break;
        }
      }
    }

    const myAgg = deltaByDriver.get(driver);
    const orgDelta = myAgg && myAgg.count > 0 ? myAgg.sum / myAgg.count : null;
    let isTopFall = false;
    if (orgDelta !== null && orgDelta < 0) {
      isTopFall = true;
      for (const [dr, agg] of deltaByDriver) {
        if (dr === driver || agg.count === 0) continue;
        if (agg.sum / agg.count < orgDelta) {
          isTopFall = false; // otra dimensión cayó más
          break;
        }
      }
    }
    return { isTopImpact, isTopFall, orgDelta };
  }

  /** Promedio de engagementFavorability del resto (excluye `dept`). */
  private static meanExcluding(
    depts: ClimaDepartmentInsight[],
    dept: ClimaDepartmentInsight,
  ): number {
    const rest = depts
      .filter((d) => d.departmentId !== dept.departmentId && d.engagementFavorability !== null)
      .map((d) => d.engagementFavorability as number);
    if (rest.length === 0) return dept.engagementFavorability ?? 0;
    return rest.reduce((s, v) => s + v, 0) / rest.length;
  }

  private static pct(v: number | null): string {
    return v !== null ? `${Math.round(v)}%` : 'sin dato';
  }

  private static round(v: number | null): string {
    return v !== null ? String(Math.round(v)) : 'sin dato';
  }
}
