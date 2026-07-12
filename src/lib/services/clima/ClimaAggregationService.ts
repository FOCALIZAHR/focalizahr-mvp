// src/lib/services/clima/ClimaAggregationService.ts
// EX Clima Gate 2B — El cerebro que calcula todo al cerrar una campaña de clima
// y lo persiste en DepartmentClimaInsight (+ NPSInsight 3 niveles + gold cache).
//
// PATRÓN ENTERPRISE (MAESTRO §2C, calcado de Ambiente Sano):
//   climaAggregationStatus: PENDING → RUNNING → COMPLETED | FAILED
//   Fallo de UN depto no mata el resto (try/catch individual, errores acumulados).
//   Idempotente: upsert por clave [accountId, departmentId, period, productType,
//   isFollowUp] — re-ejecutable vía npm run recompute:clima-insights.
//   AuditLog SIEMPRE al final con metadata (deptos procesados, fallidos, durationMs).
//
// Solo matemática (sin LLM) → corre síncrono en el request de cierre.
// Presupuesto MAESTRO: <10s para ~1.000 respondentes.

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NPSAggregationService } from '@/lib/services/NPSAggregationService';
import { SalaryConfigService, type SalaryResult } from '@/lib/services/SalaryConfigService';
import {
  ClimaResponseRow,
  DriverScore,
  calcAcotadoGroupScores,
  calcDriverScores,
  calcEngagementIndex,
} from './FavorabilityCalculator';
import { PRIVACY_THRESHOLD } from '@/lib/services/SafetyScoreService';
import { PulseDeptInput, calcRiskZone, computePulse } from './PulseEngine';
import { ActionEffectivenessService } from './ActionEffectivenessService';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de dominio
// ─────────────────────────────────────────────────────────────────────────────

/** Slugs de CampaignType que disparan agregación de clima al cierre. */
export const CLIMA_CAMPAIGN_SLUGS = ['pulso-express', 'experiencia-full'] as const;
export type ClimaCampaignSlug = (typeof CLIMA_CAMPAIGN_SLUGS)[number];

/** DepartmentClimaInsight.productType usa el slug tal cual (schema Gate 1). */
const INSIGHT_PRODUCT_BY_SLUG: Record<ClimaCampaignSlug, string> = {
  'pulso-express': 'pulso-express',
  'experiencia-full': 'experiencia-full',
};

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';
const CLIMA_BENCHMARK_METRIC = 'pulse_climate';

/** Umbrales default de sugerencia de foco (MAESTRO §2B.11). */
const FOCUS_LOW_MEAN_THRESHOLD = 3.0;
const FOCUS_HIGH_MEAN_THRESHOLD = 4.0;
const FOCUS_LOW_DRIVER_COUNT = 2;
const FOCUS_HIGH_DRIVER_COUNT = 1;

/** Ventana rolling del gold cache clima en Department (MAESTRO §2B.10). */
const GOLD_CACHE_WINDOW_MONTHS = 12;

const round1 = (x: number) => Math.round(x * 10) / 10;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de resultado
// ─────────────────────────────────────────────────────────────────────────────

export interface ClimaAggregationResult {
  status: 'COMPLETED' | 'FAILED';
  deptosProcesados: number;
  insightsGenerados: number;
  deptosFallidos: { departmentId: string; error: string }[];
  durationMs: number;
}

/** Shape 1C de Campaign.driverFocusByDepartment (MAESTRO §1C). */
export interface DriverFocusMap {
  [departmentId: string]: {
    low: string[];
    high: string[];
    thresholds: { low: number; high: number };
  };
}

/** acotadoGroup dominante = el de mayor n (respondentes) en acotadoGroupScores.
 *  null si vacío. Alimenta getSalaryForAccount por depto (Cambio 2 Gate 3). */
function dominantAcotadoGroup(scores: Record<string, { n: number }>): string | null {
  let best: string | null = null;
  let bestN = -1;
  for (const [key, value] of Object.entries(scores)) {
    if (value.n > bestN) {
      bestN = value.n;
      best = key;
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────────────────────────────────────

export class ClimaAggregationService {
  /**
   * Procesa el cierre de una campaña de clima. Idempotente y re-ejecutable.
   * Nunca revierte el cierre de la campaña: ante fallo queda FAILED + AuditLog.
   */
  static async processClimaResults(campaignId: string): Promise<ClimaAggregationResult> {
    const startedAt = Date.now();

    // 1. Cargar y validar campaña
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        accountId: true,
        campaignTypeId: true,
        startDate: true,
        endDate: true,
        driverFocusByDepartment: true,
        campaignType: { select: { slug: true } },
      },
    });
    if (!campaign) {
      throw new Error(`Campaña ${campaignId} no encontrada`);
    }
    const slug = campaign.campaignType.slug as ClimaCampaignSlug;
    if (!(CLIMA_CAMPAIGN_SLUGS as readonly string[]).includes(slug)) {
      throw new Error(`Campaña ${campaignId} no es de clima (slug: ${slug})`);
    }
    const accountId = campaign.accountId;
    const productType = INSIGHT_PRODUCT_BY_SLUG[slug];

    // 2. RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { climaAggregationStatus: 'RUNNING' },
    });

    const errors: { departmentId: string; error: string }[] = [];
    let deptosProcesados = 0;
    let insightsGenerados = 0;

    try {
      // period = trimestre del cierre, derivado del endDate (estable → clave idempotente)
      const period = toQuarterPeriod(campaign.endDate);

      // Seguimiento focalizado: SOLO Experiencia Full puebla driverFocusByDepartment
      const focusMap =
        slug === 'experiencia-full'
          ? (campaign.driverFocusByDepartment as DriverFocusMap | null)
          : null;
      const isFollowUp = !!focusMap && Object.keys(focusMap).length > 0;

      // 3. Participantes + banco de preguntas + UNA query de responses con select
      // mínimo (questionId plano, NO nested — a 20k filas el payload repetido de
      // question por fila domina el tiempo de red; el banco son ~60 filas)
      const [participants, questions, responses] = await Promise.all([
        prisma.participant.findMany({
          where: { campaignId },
          select: { id: true, departmentId: true, acotadoGroup: true, hasResponded: true },
        }),
        prisma.question.findMany({
          where: { campaignTypeId: campaign.campaignTypeId },
          select: {
            id: true,
            category: true,
            questionTier: true,
            responseType: true,
            isBenchmarkable: true,
          },
        }),
        prisma.response.findMany({
          where: {
            participant: { campaignId },
            rating: { not: null },
          },
          select: {
            rating: true,
            participantId: true,
            questionId: true,
          },
        }),
      ]);

      const questionById = new Map(questions.map((q) => [q.id, q]));

      // Agrupar en memoria por departamento (participantes sin depto: solo global)
      const participantById = new Map(participants.map((p) => [p.id, p]));
      const rowsByDept = new Map<string, ClimaResponseRow[]>();
      const npsRatingByDeptParticipant = new Map<string, Map<string, number>>();

      for (const r of responses) {
        const p = participantById.get(r.participantId);
        const question = questionById.get(r.questionId);
        if (!p?.departmentId || !question) continue;
        const row: ClimaResponseRow = {
          rating: r.rating!,
          participantId: r.participantId,
          questionCategory: question.category,
          questionTier: question.questionTier,
          responseType: question.responseType,
          isBenchmarkable: question.isBenchmarkable,
          departmentId: p.departmentId,
          acotadoGroup: p.acotadoGroup,
        };
        const bucket = rowsByDept.get(p.departmentId);
        if (bucket) bucket.push(row);
        else rowsByDept.set(p.departmentId, [row]);

        // eNPS por depto para el insight (un rating NPS por participante)
        if (question.responseType === 'nps_scale') {
          let deptNps = npsRatingByDeptParticipant.get(p.departmentId);
          if (!deptNps) {
            deptNps = new Map();
            npsRatingByDeptParticipant.set(p.departmentId, deptNps);
          }
          deptNps.set(r.participantId, r.rating!);
        }
      }

      // Universo de deptos = participantes invitados con departmentId
      const deptIds = Array.from(
        new Set(participants.map((p) => p.departmentId).filter((d): d is string => !!d))
      );

      // Precarga batch de fuentes por depto (evita N+1 innecesario)
      const [departments, deptMetrics, isaAnalyses, prevBaselines, prevInsights, benchmark] =
        await Promise.all([
          // Gold caches EXO/EIS (lectura directa, refresco por cron de cada producto)
          prisma.department.findMany({
            where: { id: { in: deptIds }, accountId },
            select: { id: true, accumulatedExoScore: true, accumulatedEISScore: true },
          }),
          // DepartmentMetric más reciente por depto (carga manual Excel; puede estar vacía)
          prisma.departmentMetric.findMany({
            where: { accountId, departmentId: { in: deptIds } },
            orderBy: { periodEnd: 'desc' },
            select: {
              departmentId: true,
              turnoverRate: true,
              absenceRate: true,
              overtimeHoursAvg: true,
              issueCount: true,
              headcountAvg: true, // Gate 3: base de peopleAtRisk + hotspot (ALG 2)
            },
          }),
          // ISA: réplica de loadPreviousDeptIsaScore (ComplianceAnalysisOrchestrator)
          prisma.complianceAnalysis.findMany({
            where: {
              accountId,
              departmentId: { in: deptIds },
              scope: 'DEPARTMENT',
              status: 'COMPLETED',
              campaign: {
                status: 'completed',
                campaignType: { slug: AMBIENTE_SANO_SLUG },
              },
            },
            orderBy: { campaign: { endDate: 'desc' } },
            select: { departmentId: true, isaScore: true },
          }),
          // Última medición COMPLETA por depto (fuente del carry-forward)
          prisma.departmentClimaInsight.findMany({
            where: {
              accountId,
              departmentId: { in: deptIds },
              productType,
              isFollowUp: false,
              periodEnd: { lt: campaign.endDate },
            },
            orderBy: { periodEnd: 'desc' },
            select: { departmentId: true, period: true, driverScores: true },
          }),
          // Insight anterior por depto, cualquier isFollowUp (fuente del momentum:
          // el EI siempre se mide, incluso en seguimientos)
          prisma.departmentClimaInsight.findMany({
            where: {
              accountId,
              departmentId: { in: deptIds },
              productType,
              periodEnd: { lt: campaign.endDate },
            },
            orderBy: { periodEnd: 'desc' },
            // driverScores: Gate 3 ALG 3 (momentum per-driver vs período anterior)
            select: { departmentId: true, engagementFavorability: true, driverScores: true },
          }),
          // Benchmark mercado pulse_climate — lookup mínimo GLOBAL (escritura = Gate 6C;
          // hoy no hay datos → benchmarkDelta null by design)
          prisma.marketBenchmark.findFirst({
            where: {
              metricType: CLIMA_BENCHMARK_METRIC,
              dimension: 'GLOBAL',
              isActive: true,
              isPublic: true,
            },
            orderBy: { period: 'desc' },
            select: { avgScore: true },
          }),
        ]);

      const deptById = new Map(departments.map((d) => [d.id, d]));
      const latestMetricByDept = firstPerKey(deptMetrics, (m) => m.departmentId);
      const isaByDept = firstPerKey(isaAnalyses, (a) => a.departmentId ?? '');
      const baselineByDept = firstPerKey(prevBaselines, (i) => i.departmentId);
      const prevInsightByDept = firstPerKey(prevInsights, (i) => i.departmentId);

      // Insumos de PulseEngine (Gate 3) — se llenan DENTRO del closure per-dept
      // con los artefactos YA calculados (cero re-queries; solo deptos con
      // upsert exitoso entran al motor)
      // El salario se resuelve DESPUÉS del loop (por acotadoGroup dominante),
      // así que acá el input va sin salary; el dominante se guarda aparte.
      const pulseInputByDept = new Map<string, Omit<PulseDeptInput, 'salary'>>();
      const dominantAcotadoByDept = new Map<string, string | null>();

      // Cambio Gate 3 (ALG5, rama b): salidas VOLUNTARIAS por depto en ventana
      // móvil de 12 meses desde campaign.endDate (FIJA → reproducible, mismo
      // principio que gapBasis:'fixed_target'). Una sola groupBy para todos.
      const voluntaryWindowStart = new Date(campaign.endDate);
      voluntaryWindowStart.setUTCFullYear(voluntaryWindowStart.getUTCFullYear() - 1);
      const voluntaryGroups = await prisma.exitRecord.groupBy({
        by: ['departmentId'],
        where: {
          accountId,
          departmentId: { in: deptIds },
          exitReason: 'voluntary',
          exitDate: { gte: voluntaryWindowStart, lte: campaign.endDate },
        },
        _count: { _all: true },
      });
      const voluntaryByDept = new Map<string, number>();
      for (const g of voluntaryGroups) {
        if (g.departmentId) voluntaryByDept.set(g.departmentId, g._count._all);
      }

      // 4. Por CADA departamento — fallo individual NO mata el resto.
      // En PARALELO (S-PERF): los upserts son independientes entre deptos y el
      // cuello de botella es latencia de red a la BD, no cómputo.
      await Promise.all(deptIds.map(async (deptId) => {
        try {
          const deptRows = rowsByDept.get(deptId) ?? [];
          const deptParticipants = participants.filter((p) => p.departmentId === deptId);

          const { full: driverScores, custom: customScores } = calcDriverScores(deptRows);
          const ei = calcEngagementIndex(deptRows);
          const acotadoScores = calcAcotadoGroupScores(deptRows);

          // Participación
          const totalInvited = deptParticipants.length;
          const totalResponded = deptParticipants.filter((p) => p.hasResponded).length;
          const participationRate =
            totalInvited > 0 ? round1((totalResponded / totalInvited) * 100) : 0;

          // CARRY-FORWARD (solo seguimiento): drivers NO medidos en esta campaña
          // copian fav/mean de la última medición completa con carried=true + n=0
          if (isFollowUp) {
            const baseline = baselineByDept.get(deptId);
            const baselineScores = baseline?.driverScores as Record<string, DriverScore> | null;
            if (baselineScores) {
              for (const [category, score] of Object.entries(baselineScores)) {
                if (driverScores[category]) continue; // medido en esta campaña
                driverScores[category] = {
                  fav: score.fav,
                  mean: score.mean,
                  n: 0,
                  carried: true,
                  sourceDate: baseline!.period,
                };
              }
            }
          }

          // Snapshots datos duros (nombres REALES de DepartmentMetric; null-safe si
          // el cliente no ha cargado la planilla). overtimeRateAtMeasurement guarda
          // overtimeHoursAvg (horas promedio, no rate — semántica documentada aquí).
          const metric = latestMetricByDept.get(deptId);
          const dept = deptById.get(deptId);

          // Momentum: delta de engagementFavorability vs insight anterior
          // (momentum POR DRIVER = Gate 3 ALG 3)
          const prev = prevInsightByDept.get(deptId);
          const momentum =
            ei.fav !== null && prev?.engagementFavorability != null
              ? round1(ei.fav - prev.engagementFavorability)
              : null;

          // benchmarkDelta: vs mercado si existe benchmark pulse_climate
          const benchmarkDelta =
            ei.fav !== null && benchmark ? round1(ei.fav - benchmark.avgScore) : null;

          // eNPS del depto (mismo threshold de privacidad que el resto del insight)
          const deptNpsRatings = Array.from(
            (npsRatingByDeptParticipant.get(deptId) ?? new Map<string, number>()).values()
          );
          const npsCalc =
            deptNpsRatings.length >= PRIVACY_THRESHOLD
              ? NPSAggregationService.calculateNPS(deptNpsRatings)
              : null;

          const hasCustom = Object.keys(customScores).length > 0;
          const hasAcotado = Object.keys(acotadoScores).length > 0;

          const insightData = {
            campaignId,
            periodStart: campaign.startDate,
            periodEnd: campaign.endDate,
            engagementFavorability: ei.fav,
            engagementMean: ei.mean,
            driverScores: driverScores as unknown as Prisma.InputJsonValue,
            customDriverScores: hasCustom
              ? (customScores as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            totalInvited,
            totalResponded,
            participationRate,
            npsScore: npsCalc ? npsCalc.npsScore : null,
            promotersPct: npsCalc ? npsCalc.promotersPct : null,
            detractorsPct: npsCalc ? npsCalc.detractorsPct : null,
            acotadoGroupScores: hasAcotado
              ? (acotadoScores as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            turnoverRateAtMeasurement: metric?.turnoverRate ?? null,
            absenteeismRateAtMeasurement: metric?.absenceRate ?? null,
            overtimeRateAtMeasurement: metric?.overtimeHoursAvg ?? null,
            incidentCountAtMeasurement: metric?.issueCount ?? null,
            exoScoreAtMeasurement: dept?.accumulatedExoScore ?? null,
            eisScoreAtMeasurement: dept?.accumulatedEISScore ?? null,
            isaScoreAtMeasurement: isaByDept.get(deptId)?.isaScore ?? null,
            momentum,
            benchmarkDelta,
            // driverAnalysis / topFocus* / riskZone / correlationFlags los escribe
            // la fase 4c (PulseEngine, Gate 3) — comment* NO se toca (Gate 6)
          };

          await prisma.departmentClimaInsight.upsert({
            where: {
              accountId_departmentId_period_productType_isFollowUp: {
                accountId,
                departmentId: deptId,
                period,
                productType,
                isFollowUp,
              },
            },
            create: {
              accountId,
              departmentId: deptId,
              period,
              productType,
              isFollowUp,
              ...insightData,
            },
            update: insightData,
          });

          // Gate 3: insumos del PulseEngine — reutiliza lo ya computado en memoria
          // acotadoGroup dominante (Cambio 2): el de mayor n en acotadoScores.
          dominantAcotadoByDept.set(deptId, dominantAcotadoGroup(acotadoScores));
          pulseInputByDept.set(deptId, {
            departmentId: deptId,
            driverScores, // post carry-forward
            ei,
            momentum,
            rows: deptRows,
            prevDriverScores:
              (prev?.driverScores as Record<string, DriverScore> | null) ?? null,
            turnoverRate: metric?.turnoverRate ?? null,
            headcountAvg: metric?.headcountAvg ?? null,
            isaScore: isaByDept.get(deptId)?.isaScore ?? null,
            totalResponded,
            participationRate,
            voluntaryExits12mo: voluntaryByDept.get(deptId) ?? 0,
          });

          deptosProcesados += 1;
          insightsGenerados += 1;
        } catch (deptError) {
          deptosProcesados += 1;
          errors.push({
            departmentId: deptId,
            error: deptError instanceof Error ? deptError.message : String(deptError),
          });
        }
      }));

      // 4b/4c. PulseEngine (Gate 3): 5 algoritmos + flag de teatro sobre los
      // deptos con insight base exitoso. Fallo aquí DEGRADA (insight base queda,
      // campos diagnóstico null, FAILED re-ejecutable) — nunca bloquea el cierre.
      let pulseDurationMs: number | null = null;
      if (pulseInputByDept.size > 0) {
        try {
          const pulseStart = Date.now();
          // Cambio 2: salario POR DEPARTAMENTO vía acotadoGroup dominante. Config de
          // cuenta cacheada por grupo distinto (memo) → NO N findUnique por depto;
          // el loop de arriba es paralelo, por eso se resuelve acá secuencialmente.
          const salaryByGroup = new Map<string, SalaryResult>();
          const depts: PulseDeptInput[] = [];
          for (const [deptId, base] of pulseInputByDept) {
            const group = dominantAcotadoByDept.get(deptId) ?? null;
            const groupKey = group ?? '__default__';
            let salary = salaryByGroup.get(groupKey);
            if (!salary) {
              salary = await SalaryConfigService.getSalaryForAccount(accountId, group);
              salaryByGroup.set(groupKey, salary);
            }
            depts.push({ ...base, salary });
          }
          const pulseOutputs = computePulse({ depts });

          await Promise.all(
            Array.from(pulseOutputs.entries()).map(async ([deptId, output]) => {
              try {
                await prisma.departmentClimaInsight.update({
                  where: {
                    accountId_departmentId_period_productType_isFollowUp: {
                      accountId,
                      departmentId: deptId,
                      period,
                      productType,
                      isFollowUp,
                    },
                  },
                  data: {
                    driverAnalysis: output.driverAnalysis as unknown as Prisma.InputJsonValue,
                    topFocusArea: output.topFocusArea,
                    topStrength: output.topStrength,
                    riskZone: output.riskZone,
                    correlationFlags:
                      output.correlationFlags as unknown as Prisma.InputJsonValue,
                  },
                });
              } catch (updateError) {
                errors.push({
                  departmentId: deptId,
                  error: updateError instanceof Error ? updateError.message : String(updateError),
                });
              }
            })
          );
          pulseDurationMs = Date.now() - pulseStart;

          // 4d. Efectividad de planes (Gate 5C) — SOLO en Seguimiento Focalizado
          // (isFollowUp); el veredicto de la matriz lo emite solo esta campaña.
          // Cero re-queries: reusa pulseOutputs (momentumDelta ya calculado) en memoria.
          // Degrade-safe: fallo acá no bloquea el cierre.
          if (isFollowUp) {
            try {
              const driverAnalysisByDept = new Map(
                Array.from(pulseOutputs.entries()).map(([deptId, o]) => [deptId, o.driverAnalysis])
              );
              await ActionEffectivenessService.evaluateOnFollowUpClose({
                accountId,
                campaignId,
                driverAnalysisByDept,
              });
            } catch (effError) {
              errors.push({
                departmentId: 'ACTION_EFFECTIVENESS',
                error: effError instanceof Error ? effError.message : String(effError),
              });
            }
          }
        } catch (pulseError) {
          errors.push({
            departmentId: 'PULSE_ENGINE',
            error: pulseError instanceof Error ? pulseError.message : String(pulseError),
          });
        }
      }

      // 5. eNPS 3 niveles (gerencia / depto / global) — NPSInsight
      try {
        await NPSAggregationService.aggregateClimaNPS(campaignId);
      } catch (npsError) {
        errors.push({
          departmentId: 'NPS_AGGREGATION',
          error: npsError instanceof Error ? npsError.message : String(npsError),
        });
      }

      // 6. Gold cache clima por depto (rolling 12 meses, cualquier isFollowUp —
      //    el EI siempre se mide). Incluye accumulatedClimaRiskZone (Gate 3).
      try {
        await this.refreshGoldCache(accountId, deptIds, campaign.endDate);
      } catch (cacheError) {
        errors.push({
          departmentId: 'GOLD_CACHE',
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
      }

      // 8. Estado final + AuditLog SIEMPRE (patrón status/route.ts)
      const status: ClimaAggregationResult['status'] =
        errors.length === 0 ? 'COMPLETED' : 'FAILED';
      const durationMs = Date.now() - startedAt;

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { climaAggregationStatus: status },
      });

      await prisma.auditLog.create({
        data: {
          accountId,
          campaignId,
          action:
            status === 'COMPLETED' ? 'clima_aggregation_completed' : 'clima_aggregation_failed',
          entityType: 'campaign',
          entityId: campaignId,
          newValues: {
            deptosProcesados,
            insightsGenerados,
            deptosFallidos: errors,
            durationMs,
            pulseDurationMs, // Gate 3 — presupuesto MAESTRO <5s para 10 deptos
          },
        },
      });

      return { status, deptosProcesados, insightsGenerados, deptosFallidos: errors, durationMs };
    } catch (fatalError) {
      // Fallo global (query madre, etc.): FAILED + AuditLog, y se propaga.
      // El caller (PUT /status) lo captura para NUNCA revertir el cierre.
      const durationMs = Date.now() - startedAt;
      const message = fatalError instanceof Error ? fatalError.message : String(fatalError);

      await prisma.campaign
        .update({ where: { id: campaignId }, data: { climaAggregationStatus: 'FAILED' } })
        .catch(() => undefined);
      await prisma.auditLog
        .create({
          data: {
            accountId,
            campaignId,
            action: 'clima_aggregation_failed',
            entityType: 'campaign',
            entityId: campaignId,
            newValues: {
              deptosProcesados,
              insightsGenerados,
              deptosFallidos: [...errors, { departmentId: 'FATAL', error: message }],
              durationMs,
            },
          },
        })
        .catch(() => undefined);

      throw fatalError;
    }
  }

  /**
   * Gold cache clima en Department: promedio de engagementFavorability/Mean de
   * los insights del depto de los últimos 12 meses (el EI siempre se mide,
   * por eso entran seguimientos también).
   */
  private static async refreshGoldCache(
    accountId: string,
    deptIds: string[],
    referenceDate: Date
  ): Promise<void> {
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - GOLD_CACHE_WINDOW_MONTHS);

    const insights = await prisma.departmentClimaInsight.findMany({
      where: {
        accountId,
        departmentId: { in: deptIds },
        periodEnd: { gte: cutoff, lte: referenceDate },
      },
      select: { departmentId: true, engagementFavorability: true, engagementMean: true },
    });

    const byDept = new Map<string, { favs: number[]; means: number[] }>();
    for (const insight of insights) {
      let acc = byDept.get(insight.departmentId);
      if (!acc) {
        acc = { favs: [], means: [] };
        byDept.set(insight.departmentId, acc);
      }
      if (insight.engagementFavorability !== null) acc.favs.push(insight.engagementFavorability);
      if (insight.engagementMean !== null) acc.means.push(insight.engagementMean);
    }

    const now = new Date();
    await Promise.all(
      Array.from(byDept.entries())
        .filter(([, acc]) => acc.favs.length > 0 || acc.means.length > 0)
        .map(([deptId, acc]) =>
          prisma.department.update({
            where: { id: deptId },
            data: {
              accumulatedClimaFavorability:
                acc.favs.length > 0 ? round1(avg(acc.favs)) : null,
              accumulatedClimaMean:
                acc.means.length > 0 ? Math.round(avg(acc.means) * 100) / 100 : null,
              accumulatedClimaLastUpdated: now,
              // Gate 3: zona sobre el fav rolling, SIN modulación por momentum
              // (es promedio 12m — el momentum puntual no aplica al acumulado)
              accumulatedClimaRiskZone:
                acc.favs.length > 0 ? calcRiskZone(round1(avg(acc.favs)), null) : null,
            },
          })
        )
    );
  }
}

/**
 * Sugerencia de foco para la próxima campaña de seguimiento (MAESTRO §2B.11):
 * por depto, top 2 drivers con mean < 3.0 (los más bajos) + top 1 con mean > 4.0
 * (el más alto). Lee SOLO insights con isFollowUp=false — la línea base siempre
 * viene de mediciones completas. Retorna el shape 1C de driverFocusByDepartment.
 * El wiring a la creación de campañas es Gate 4/7 (aquí solo el servicio).
 */
export async function suggestDriverFocus(
  accountId: string,
  productType: string = 'experiencia-full'
): Promise<DriverFocusMap> {
  const insights = await prisma.departmentClimaInsight.findMany({
    where: { accountId, productType, isFollowUp: false },
    orderBy: { periodEnd: 'desc' },
    select: { departmentId: true, driverScores: true },
  });

  const latestByDept = firstPerKey(insights, (i) => i.departmentId);
  const focusMap: DriverFocusMap = {};

  for (const [deptId, insight] of latestByDept) {
    const scores = insight.driverScores as Record<string, DriverScore> | null;
    if (!scores) continue;

    const measured = Object.entries(scores).filter(
      ([, s]) => !s.carried && s.mean !== null
    ) as [string, DriverScore & { mean: number }][];

    const low = measured
      .filter(([, s]) => s.mean < FOCUS_LOW_MEAN_THRESHOLD)
      .sort((a, b) => a[1].mean - b[1].mean)
      .slice(0, FOCUS_LOW_DRIVER_COUNT)
      .map(([category]) => category);

    const high = measured
      .filter(([, s]) => s.mean > FOCUS_HIGH_MEAN_THRESHOLD)
      .sort((a, b) => b[1].mean - a[1].mean)
      .slice(0, FOCUS_HIGH_DRIVER_COUNT)
      .map(([category]) => category);

    if (low.length === 0 && high.length === 0) continue;

    focusMap[deptId] = {
      low,
      high,
      thresholds: { low: FOCUS_LOW_MEAN_THRESHOLD, high: FOCUS_HIGH_MEAN_THRESHOLD },
    };
  }

  return focusMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** "2026-Q3" a partir de una fecha (UTC — endDate es @db.Date). */
function toQuarterPeriod(date: Date): string {
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${quarter}`;
}

/** Primer elemento por clave preservando el orden de llegada (listas ya ordenadas desc). */
function firstPerKey<T>(items: T[], keyFn: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return map;
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
