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
import type { ComplianceReportResponse } from '@/types/compliance';
import type {
  AmbienteRiskPayload,
  AmbienteRiskData,
  AmbienteRiskNarratives,
  Beat1Seed,
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

    return {
      mundoDominante: classified.mundo,
      intensidad: classified.intensidad,
      hasDenunciaFormal: classified.hasDenunciaFormal,
      beat1Slots,
      classifyD4Trace: classified.trace,
    };
  }
}
