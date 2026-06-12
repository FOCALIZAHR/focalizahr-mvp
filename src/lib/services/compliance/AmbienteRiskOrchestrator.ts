// src/lib/services/compliance/AmbienteRiskOrchestrator.ts
// ════════════════════════════════════════════════════════════════════════════
// AmbienteRiskOrchestrator (Gate 1)
//
// Wrap del response actual del endpoint /api/compliance/report → emite el
// contrato nuevo `AmbienteRiskPayload` (data + narratives + beat1Seed +
// synthesis + reportNarratives).
//
// Función pura: no hace queries Prisma. Posición arquitectónica:
//   1. El pipeline de cierre (ComplianceAnalysisOrchestrator.ts) persiste
//      ReportNarratives + per-dept payloads. NO se toca.
//   2. El endpoint carga eso + riskScores runtime + coverage, y emite el
//      ComplianceReportResponse actual. NO se toca en Gate 1 (Gate 3 lo wire).
//   3. Este orchestrator consume `ComplianceReportResponse` y emite el
//      `AmbienteRiskPayload` — capa normalizada que los Beats nuevos consumen.
//
// Razón del shape: ver `src/types/ambiente-cascada.ts` (decisión "de dónde
// leen los Beats nuevos") + plan §3.1.1 + §3.5.9 (Wrap, no replace).
//
// Slot `synthesis`: null hasta Gate 2/3 (AmbienteSynthesisEngine).
// ════════════════════════════════════════════════════════════════════════════

import { buildGerenciaRollup } from './buildGerenciaRollup';
import { classifyD4, deriveBeat1Slots } from './deriveBeat1Slots';
import { computeOrgDimensions } from './orgDimensions';
import { DIMENSION_CEO_LABELS } from '@/config/narratives/ComplianceNarrativeDictionary';
import {
  PESO_BASE_ALERTA,
  ALERTAS_CRITICAS,
} from '@/config/compliance/convergenciaWeights';
import type { ComplianceReportResponse } from '@/types/compliance';
import type {
  AmbienteRiskPayload,
  AmbienteRiskData,
  AmbienteRiskNarratives,
  Beat1Seed,
  FactoresTitulares,
  FactorTitular,
  ExtremosTitulares,
  AmplificadorSenal,
} from '@/types/ambiente-cascada';

export class AmbienteRiskOrchestrator {
  /** Construye el payload completo de la cascada. Pure. */
  static buildAmbientePayload(
    response: ComplianceReportResponse,
  ): AmbienteRiskPayload {
    const data = this.buildData(response);
    const beat1Seed = this.buildBeat1Seed(data);
    const narratives = this.buildNarratives();

    return {
      data,
      narratives,
      beat1Seed,
      synthesis: null, // Gate 2/3 — AmbienteSynthesisEngine
      reportNarratives: response.narratives,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // CAPA DATA — normalización por nivel de agregación
  // ────────────────────────────────────────────────────────────────────────

  static buildData(response: ComplianceReportResponse): AmbienteRiskData {
    const d = response.data;

    // Rollups por gerencia — única invocación. Se reutilizan en buildBeat1Seed.
    const rollupsPerGerencia = buildGerenciaRollup(response);

    const riskScores = d.riskScores ?? [];
    const departments = d.departments ?? [];

    // ── Conteos derivados org-level ────────────────────────────────────
    const riesgoDeptosCount = departments.filter(
      (dept) => dept.riskLevel === 'risk' || dept.riskLevel === 'critical',
    ).length;
    const teatroCount = departments.filter(
      (dept) => dept.teatroCumplimiento === true,
    ).length;

    const coverageGapPct = 100 - (d.coverage?.pctCobertura ?? 0);

    const gerenciasUniversoTotal = rollupsPerGerencia.length;
    const gerenciasMedidasCount = rollupsPerGerencia.filter(
      (r) => r.isa.weighted !== null,
    ).length;

    // "Mudas" — misma regla canónica que countMudas() en deriveBeat1Slots.
    const gerenciasMudasCount = rollupsPerGerencia.filter((r) => {
      const deptosConIsa =
        r.totalChildren -
        r.silencio.deptosSubThreshold -
        r.silencio.deptosNoInvitados;
      return (
        deptosConIsa === 0 &&
        (r.silencio.deptosSubThreshold > 0 || r.silencio.coverageRate === 0)
      );
    }).length;

    // Tasa de respuesta de personas (denominador person-level).
    let totalInvited = 0;
    let totalResponded = 0;
    for (const r of rollupsPerGerencia) {
      totalInvited += r.silencio.invited;
      totalResponded += r.silencio.responded;
    }
    const personResponseRate =
      totalInvited > 0 ? Math.round((totalResponded / totalInvited) * 100) : null;

    // Denuncias 12m por dept (crudo, null preservado: null ≠ 0).
    const denunciasByDept = new Map<string, number | null>();
    for (const r of riskScores) {
      denunciasByDept.set(r.departmentId, r.inputs.denuncias_12m);
    }

    // Nivel 2 — señal específica de la SEXTA por dept, join con la sexta del
    // coverage (`tipoSenal` + `exitAlertType`, ya computado en runtime).
    // Exit-dominante → alertType específico + severidad por PESO_BASE_ALERTA.
    // Onboarding-dominante → solo producto (coverage llena exitAlertType solo
    // para tipoSenal='exit'). 'otra' → se omite (sin señal nominable).
    const sextaSignalsByDept = new Map<string, AmplificadorSenal>();
    for (const item of d.coverage?.silencioConVozExterna ?? []) {
      let senal: AmplificadorSenal | undefined;
      if (item.tipoSenal === 'exit' && item.exitAlertType) {
        senal = {
          producto: 'exit',
          alertType: item.exitAlertType,
          severidad: PESO_BASE_ALERTA[item.exitAlertType] ?? 0,
          esCritica: ALERTAS_CRITICAS.includes(item.exitAlertType),
        };
      } else if (item.tipoSenal === 'onboarding') {
        senal = { producto: 'onboarding', alertType: '', severidad: 0, esCritica: false };
      }
      if (senal) sextaSignalsByDept.set(item.departmentId, senal);
    }

    return {
      // Org-level
      orgISA: d.orgISA ?? null,
      isaComponents: d.isaComponents ?? null,
      orgSafetyScore: d.orgSafetyScore ?? null,
      coverageGapPct,
      personResponseRate,
      totalInvited,
      totalResponded,

      // Universo / conteos
      departmentsCount: departments.length,
      gerenciasUniversoTotal,
      gerenciasMedidasCount,
      gerenciasMudasCount,
      riesgoDeptosCount,
      teatroCount,

      // Per-dept (ComplianceReportDepartment extends DepartmentSafetyScore →
      // upcast estructural seguro).
      scoresPerDept: departments,
      riskScoresPerDept: riskScores,

      // Per-gerencia
      rollupsPerGerencia,

      // Convergencia
      convergencias: d.convergencia?.departments ?? [],
      criticalByManager: d.convergencia?.criticalByManager ?? [],

      // Opcionales — gates posteriores los completan
      fragmentosTextuales: undefined, // Gate 7 (Beat 4 Voz)
      silencioConVozExterna: d.silencioVozExterna,
      otroMundo: d.otroMundo,
      denunciasByDept,

      // Origen organizacional del meta-análisis — resuelve {origen} en la base
      // de CONCENTRACION_MANDO (Gate 2.5). null si no hubo meta-análisis.
      origenOrganizacional: d.metaAnalysis?.origen_organizacional ?? null,

      // Nivel 2 — señal específica de la SEXTA por dept (join coverage).
      sextaSignalsByDept,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // CAPA NARRATIVES — gates 6/7 la pueblan; Gate 1 deja la estructura
  // ────────────────────────────────────────────────────────────────────────

  static buildNarratives(): AmbienteRiskNarratives {
    return {
      perDeptRisk: undefined,
      dimensionLabels: undefined,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // BEAT 1 SEED — la semilla del hilo único
  // ────────────────────────────────────────────────────────────────────────

  static buildBeat1Seed(data: AmbienteRiskData): Beat1Seed {
    // hasDenunciaFormal: ≥1 dept con piso_denuncia disparado (= denuncia_12m≥1).
    const hasDenunciaFormal = data.riskScoresPerDept.some(
      (r) => r.drivers.piso_denuncia > 0,
    );

    // classifyD4 con inputs canónicos. orgISA null → 0 para clasificar como
    // peor banda (caída a 'numero-bajo' con intensidad 'critico'). El render
    // del Beat 1 ya maneja el caso "sin orgISA" — degrada a "datos insuficientes".
    const classified = classifyD4({
      orgISA: data.orgISA ?? 0,
      riesgoDeptos: data.riesgoDeptosCount,
      coverageGapPct: data.coverageGapPct,
      teatroCount: data.teatroCount,
      hasDenunciaFormal,
    });

    const beat1Slots = deriveBeat1Slots(data.rollupsPerGerencia, {
      orgISA: data.orgISA ?? 0,
      coverageGapPct: data.coverageGapPct,
    });

    // Gate 5 (§3.6) — titulares de factores y extremos para que Beat 1 nombre
    // veredicto + factores + extremos como cláusulas del mismo argumento.
    const factoresTitulares = this.buildFactoresTitulares(data);
    const extremosTitulares = this.buildExtremosTitulares(data);

    return {
      mundoDominante: classified.mundo,
      intensidad: classified.intensidad,
      hasDenunciaFormal: classified.hasDenunciaFormal,
      beat1Slots,
      factoresTitulares,
      extremosTitulares,
      classifyD4Trace: classified.trace,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // BEAT 1 TITULARES — factores (top 2 dims por banda) + extremos (gerencias)
  // ────────────────────────────────────────────────────────────────────────

  /** Promedia las 6 dimensiones org-level ponderando por respondentCount.
   *  Retorna las que tienen dato (entre 0 y 6); las dims sin masa quedan fuera. */
  private static buildOrgDimensionAverages(
    data: AmbienteRiskData,
  ): FactorTitular[] {
    // Gate 3 §8 — migrado al helper compartido `computeOrgDimensions` (fuente
    // única; mismo cómputo: ponderado por respondentCount, omite Σw=0). Solo se
    // adapta la shape de salida al contrato del consumidor (FactorTitular).
    return computeOrgDimensions(data.scoresPerDept).map((d) => ({
      dimensionKey: d.key,
      labelCEO: DIMENSION_CEO_LABELS[d.key],
      valor: d.valor,
    }));
  }

  /** Factores titulares según banda ISA (regla del MAPA, §3.6):
   *  - Banda alta (ISA ≥ 80): top 2 fortalezas. `debilidades=[]`,
   *    `fortalezaRelativa=null`.
   *  - Banda observación/baja (ISA < 80): bottom 2 debilidades. `fortalezas=[]`,
   *    `fortalezaRelativa` = la mejor relativa. */
  private static buildFactoresTitulares(
    data: AmbienteRiskData,
  ): FactoresTitulares {
    const averages = this.buildOrgDimensionAverages(data);
    const orgISA = data.orgISA;

    if (averages.length === 0 || orgISA === null) {
      return { fortalezas: [], debilidades: [], fortalezaRelativa: null };
    }

    // Banda alta — solo fortalezas.
    if (orgISA >= 80) {
      const sortedDesc = [...averages].sort((a, b) => b.valor - a.valor);
      return {
        fortalezas: sortedDesc.slice(0, 2),
        debilidades: [],
        fortalezaRelativa: null,
      };
    }

    // Banda observación o baja — debilidades + fortaleza relativa.
    const sortedAsc = [...averages].sort((a, b) => a.valor - b.valor);
    const debilidades = sortedAsc.slice(0, 2);
    // Fortaleza relativa = la mejor del set (no necesariamente "buena", solo
    // la menos mala). Solo si hay ≥3 dims medidas (con 1-2 no aporta).
    const fortalezaRelativa =
      averages.length >= 3 ? sortedAsc[sortedAsc.length - 1] : null;

    return {
      fortalezas: [],
      debilidades,
      fortalezaRelativa,
    };
  }

  /** Extremos titulares — mejor/peor gerencia por ISA, solo si ≥2 con ISA. */
  private static buildExtremosTitulares(
    data: AmbienteRiskData,
  ): ExtremosTitulares {
    const conIsa = data.rollupsPerGerencia.filter(
      (r) => r.isa.weighted !== null,
    );
    if (conIsa.length < 2) {
      return { mejor: null, peor: null };
    }

    // Mayor ISA, tiebreak alfabético.
    const sortedDesc = [...conIsa].sort((a, b) => {
      const diff = (b.isa.weighted as number) - (a.isa.weighted as number);
      if (diff !== 0) return diff;
      return a.groupName.localeCompare(b.groupName);
    });
    const best = sortedDesc[0];

    // Menor ISA, tiebreak alfabético.
    const sortedAsc = [...conIsa].sort((a, b) => {
      const diff = (a.isa.weighted as number) - (b.isa.weighted as number);
      if (diff !== 0) return diff;
      return a.groupName.localeCompare(b.groupName);
    });
    const worst = sortedAsc[0];

    return {
      mejor: { gerenciaName: best.groupName, isa: best.isa.weighted as number },
      peor: { gerenciaName: worst.groupName, isa: worst.isa.weighted as number },
    };
  }
}
