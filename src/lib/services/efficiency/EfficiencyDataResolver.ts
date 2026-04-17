// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY DATA RESOLVER — Orquesta los 9 lentes canónicos
// src/lib/services/efficiency/EfficiencyDataResolver.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapeo canónico (TASK_EFFICIENCY_HUB_FINAL.md):
//   L1 inercia      → diagnostic.inertiaCost + liberatedFTEs
//   L2 zombie       → diagnostic.zombies
//   L3 adopcion     → diagnostic.adoptionRisk + clima jerárquico (NPS → engagement)
//   L4 fantasma     → diagnostic.redundancy
//   L5 brecha       → diagnostic.productivityGap
//   L6 seniority    → diagnostic.seniorityCompression
//   L7 fuga         → diagnostic.flightRisk (tono PROTECTOR)
//   L8 retencion    → retentionPriority.ranking completo CON TODOS LOS TIERS
//   L9 pasivo       → prescindibles + finiquitos + costoEspera (gatillo de acción)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import type {
  OrganizationDiagnostic,
  EnrichedEmployee,
} from '@/lib/services/WorkforceIntelligenceService'
import type { OrganizationExposureResult } from '@/lib/services/AIExposureService'
import {
  calculateFiniquitoConTopeCustomUF,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'
import {
  LENTES_META,
  formatCLP,
  formatPct,
  formatInt,
  formatDec,
  type LenteId,
  type FamiliaId,
} from './EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// CONTEXTO pre-fetched por el endpoint
// ════════════════════════════════════════════════════════════════════════════

export interface DiagnosticContext {
  accountId: string
  departmentIds?: string[]
  diagnostic: OrganizationDiagnostic
  exposure: OrganizationExposureResult
  enriched: EnrichedEmployee[]
}

// ════════════════════════════════════════════════════════════════════════════
// OUTPUT
// ════════════════════════════════════════════════════════════════════════════

export interface LenteOutput {
  id: LenteId
  familia: FamiliaId
  titulo: string
  subtitulo: string
  /** true si hay datos suficientes (false → empty state + CTA) */
  hayData: boolean
  /** Entradas ya formateadas como strings para compilarActo() */
  datos: Record<string, string>
  /** Breakdown crudo para el frontend (persons, pairs, etc.) */
  detalle: unknown
  /** Solo L3: true si cayó al fallback de engagement AAE */
  usandoFallback?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function effExposure(e: Pick<EnrichedEmployee, 'focalizaScore' | 'observedExposure'>): number {
  return e.focalizaScore ?? e.observedExposure
}

function lastNPeriods(months: number): string[] {
  const periods: string[] = []
  const now = new Date()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return periods
}

function makeMeta(id: LenteId) {
  const m = LENTES_META[id]
  return { id: m.id, familia: m.familia, titulo: m.titulo, subtitulo: m.subtitulo }
}

/** Mapea score NPS (-100..100) a escala 0-5 para L3 */
function npsToScale5(nps: number): number {
  return Math.max(0, Math.min(5, (nps + 100) / 40))
}

/** Mapea engagement AAE (1..3) a escala 0-5 para L3 */
function engagementToScale5(eng: number): number {
  return Math.max(0, Math.min(5, ((eng - 1) / 2) * 5))
}

// ════════════════════════════════════════════════════════════════════════════
// L3 — JERARQUÍA DE FUENTES DE CLIMA (pulso → experiencia → engagement AAE)
// ════════════════════════════════════════════════════════════════════════════

interface ClimaPorDept {
  departmentId: string | null
  departmentName: string
  scoreScale5: number  // normalizado 0-5 para el template "{CLIMA}/5"
  fuente: 'pulso' | 'experiencia' | 'engagement_aae'
  usandoFallback: boolean
}

async function resolverClimaPorDepartamento(
  ctx: DiagnosticContext
): Promise<Map<string, ClimaPorDept>> {
  const mapa = new Map<string, ClimaPorDept>()

  // FUENTE 1: NPS producto "pulso" últimos 6 meses
  const pulsoRows = await prisma.nPSInsight.findMany({
    where: {
      accountId: ctx.accountId,
      productType: 'pulso',
      periodType: 'monthly',
      period: { in: lastNPeriods(6) },
      department: { level: 2 },
      ...(ctx.departmentIds ? { departmentId: { in: ctx.departmentIds } } : {}),
    },
    include: { department: { select: { displayName: true } } },
    orderBy: { period: 'desc' },
  })

  for (const r of pulsoRows) {
    if (!r.departmentId || mapa.has(r.departmentId)) continue
    mapa.set(r.departmentId, {
      departmentId: r.departmentId,
      departmentName: r.department?.displayName ?? 'gerencia sin nombre',
      scoreScale5: npsToScale5(r.npsScore),
      fuente: 'pulso',
      usandoFallback: false,
    })
  }

  // FUENTE 2: NPS producto "experiencia" — completa depts no cubiertos por pulso
  const expRows = await prisma.nPSInsight.findMany({
    where: {
      accountId: ctx.accountId,
      productType: 'experiencia',
      periodType: 'monthly',
      period: { in: lastNPeriods(12) },
      department: { level: 2 },
      ...(ctx.departmentIds ? { departmentId: { in: ctx.departmentIds } } : {}),
    },
    include: { department: { select: { displayName: true } } },
    orderBy: { period: 'desc' },
  })

  for (const r of expRows) {
    if (!r.departmentId || mapa.has(r.departmentId)) continue
    mapa.set(r.departmentId, {
      departmentId: r.departmentId,
      departmentName: r.department?.displayName ?? 'gerencia sin nombre',
      scoreScale5: npsToScale5(r.npsScore),
      fuente: 'experiencia',
      usandoFallback: false,
    })
  }

  // FUENTE 3 (FALLBACK): engagement AAE promedio por gerencia
  const porDept = new Map<string, { id: string; name: string; sum: number; n: number }>()
  for (const e of ctx.enriched) {
    if (e.potentialEngagement === null) continue
    const key = e.departmentId
    if (!key) continue
    const entry = porDept.get(key) ?? { id: key, name: e.departmentName ?? 'Sin gerencia', sum: 0, n: 0 }
    entry.sum += e.potentialEngagement
    entry.n += 1
    porDept.set(key, entry)
  }

  for (const [deptId, agg] of porDept) {
    if (mapa.has(deptId)) continue
    mapa.set(deptId, {
      departmentId: deptId,
      departmentName: agg.name,
      scoreScale5: engagementToScale5(agg.sum / agg.n),
      fuente: 'engagement_aae',
      usandoFallback: true,
    })
  }

  return mapa
}

// ════════════════════════════════════════════════════════════════════════════
// RESOLVER INDIVIDUAL POR LENTE
// ════════════════════════════════════════════════════════════════════════════

export async function resolverLente(
  lenteId: LenteId,
  ctx: DiagnosticContext
): Promise<LenteOutput> {
  const meta = makeMeta(lenteId)
  const { diagnostic, enriched } = ctx

  switch (lenteId) {
    // ── L1: Costo de Inercia (FTEs Liberables + costo mensual) ──────────
    case 'l1_inercia': {
      const inercia = diagnostic.inertiaCost
      const ftes = diagnostic.liberatedFTEs
      const hayData = ftes.totalFTEs > 0 || inercia.totalMonthly > 0
      return {
        ...meta,
        hayData,
        datos: {
          N_FTES: formatDec(ftes.totalFTEs),
          CLP_MES: formatCLP(inercia.totalMonthly),
          CLP_ANIO: formatCLP(inercia.totalAnnual),
        },
        detalle: {
          totalFTEs: ftes.totalFTEs,
          totalMonthly: inercia.totalMonthly,
          totalAnnual: inercia.totalAnnual,
          byDepartment: inercia.byDepartment,
          ftesByDepartment: ftes.byDepartment,
        },
      }
    }

    // ── L2: Paradoja del Talento Zombie ─────────────────────────────────
    // Cross-lookup con `enriched` para propagar campos que PersonAlert no
    // incluye pero EnrichedEmployee sí: focalizaScore, tenureMonths,
    // cuadrantes, nineBoxPosition, finiquitoToday. Esto habilita la ficha
    // rica en L2 (cuadrantes + reloj de finiquito) sin modificar el motor.
    case 'l2_zombie': {
      const z = diagnostic.zombies
      const enrichedById = new Map(enriched.map(e => [e.employeeId, e]))
      const personasEnriquecidas = z.persons.map(p => {
        const e = enrichedById.get(p.employeeId)
        return {
          ...p,
          // Canónico Eloundou (primario) — fallback a observedExposure legacy
          focalizaScore: e?.focalizaScore ?? null,
          tenureMonths: e?.tenureMonths ?? 0,
          riskQuadrant: e?.riskQuadrant ?? null,
          mobilityQuadrant: e?.mobilityQuadrant ?? null,
          nineBoxPosition: e?.nineBoxPosition ?? null,
          finiquitoToday: e?.finiquitoToday ?? null,
        }
      })
      // avgExposure usa focalizaScore primario (canónico) con fallback
      const expAvg =
        personasEnriquecidas.length > 0
          ? personasEnriquecidas.reduce(
              (s, p) => s + (p.focalizaScore ?? p.observedExposure ?? 0),
              0
            ) / personasEnriquecidas.length
          : 0
      return {
        ...meta,
        hayData: z.count > 0,
        datos: {
          N_PERSONAS: formatInt(z.count),
          EXPOSICION_PROMEDIO: formatPct(expAvg * 100),
        },
        detalle: {
          count: z.count,
          persons: personasEnriquecidas,
          totalInertiaCost: z.totalInertiaCost,
          avgExposure: expAvg,
        },
      }
    }

    // ── L3: Riesgo de Adopción (boicot interno) ─────────────────────────
    case 'l3_adopcion': {
      const adopt = diagnostic.adoptionRisk
      const inerciaByDept = new Map(
        diagnostic.inertiaCost.byDepartment.map(d => [d.departmentId, d])
      )
      const totalInertia = diagnostic.inertiaCost.totalMonthly || 1
      const climaPorDept = await resolverClimaPorDepartamento(ctx)

      // Emparejar adoption risk con clima + inercia para priorizar
      const enriquecidos = adopt.departments.map(d => {
        const clima = climaPorDept.get(d.departmentId)
        const ine = inerciaByDept.get(d.departmentId)
        const pctPotencial = ine
          ? (ine.monthlyCost / totalInertia) * 100
          : 0
        // Fallback clima: si no hay en mapa, usar el avgEngagement del adoptionRisk
        const climaScale5 = clima
          ? clima.scoreScale5
          : engagementToScale5(d.avgEngagement)
        const usandoFallback = clima?.usandoFallback ?? true
        return {
          ...d,
          climaScale5,
          pctPotencial,
          climaFuente: clima?.fuente ?? 'engagement_aae',
          usandoFallback,
        }
      })

      // Peor: mayor potencial de ahorro × peor clima (minimizar climaScale5, maximizar pctPotencial)
      const ordenados = [...enriquecidos].sort((a, b) => {
        const scoreA = a.pctPotencial * (5 - a.climaScale5)
        const scoreB = b.pctPotencial * (5 - b.climaScale5)
        return scoreB - scoreA
      })
      const peor = ordenados[0]

      const hayData = !!peor && peor.pctPotencial > 0

      return {
        ...meta,
        hayData,
        usandoFallback: peor?.usandoFallback,
        datos: {
          AREA: peor?.departmentName ?? 'la gerencia con mayor potencial',
          PCT_POTENCIAL: formatPct(peor?.pctPotencial ?? 0),
          CLIMA: peor ? (Math.round(peor.climaScale5 * 10) / 10).toFixed(1) : '0',
        },
        detalle: {
          ranking: ordenados,
          peor,
        },
      }
    }

    // ── L4: Cargos Fantasma (redundancia estructural) ───────────────────
    case 'l4_fantasma': {
      const r = diagnostic.redundancy
      const avgOverlap =
        r.pairs.length > 0
          ? r.pairs.reduce((s, p) => s + p.overlapPercent, 0) / r.pairs.length
          : 0
      // % automatizable ≈ promedio automationShare de los cargos involucrados.
      // Cruce con enriched por socCode.
      const socsInPairs = new Set<string>()
      for (const p of r.pairs) {
        socsInPairs.add(p.socCodeA)
        socsInPairs.add(p.socCodeB)
      }
      const involved = enriched.filter(e => e.socCode && socsInPairs.has(e.socCode))
      const avgAutomation =
        involved.length > 0
          ? involved.reduce((s, e) => s + e.automationShare, 0) / involved.length
          : 0

      return {
        ...meta,
        hayData: r.pairs.length > 0,
        datos: {
          N_PARES: formatInt(r.pairs.length),
          OVERLAP: formatPct(avgOverlap),
          PCT_AUTOMATIZABLE: formatPct(avgAutomation * 100),
        },
        detalle: {
          pairs: r.pairs,
          totalEstimatedSavings: r.totalEstimatedSavings,
          avgOverlap,
          avgAutomation,
        },
      }
    }

    // ── L5: Brecha de Productividad ─────────────────────────────────────
    // TASK canónico: usa retentionPriority filtrado por tier='prescindible'
    // (retentionScore<40). El hero es la suma de salarios de esas personas
    // — "salario pagado sin rendimiento equivalente".
    case 'l5_brecha': {
      const prescindibles = diagnostic.retentionPriority.ranking.filter(
        r => r.tier === 'prescindible'
      )
      const salariosTotales = prescindibles.reduce((s, p) => s + p.salary, 0)
      return {
        ...meta,
        hayData: prescindibles.length > 0,
        datos: {
          N_PERSONAS: formatInt(prescindibles.length),
          PERCENTIL: '40',
          UMBRAL: '40',
          CLP_MES: formatCLP(salariosTotales),
        },
        detalle: {
          persons: prescindibles,          // con retentionScore, roleFit, metas, finiquitoToday
          affectedCount: prescindibles.length,
          total: salariosTotales,
          // bySegment se mantiene como info complementaria (origen productivityGap)
          gapOriginal: diagnostic.productivityGap.total,
          bySegment: diagnostic.productivityGap.bySegment,
        },
      }
    }

    // ── L6: Compresión de Seniority ─────────────────────────────────────
    case 'l6_seniority': {
      const c = diagnostic.seniorityCompression
      const monthlyAhorro = c.totalAnnualSavings / 12
      // % de la línea senior: annualSavings / suma(seniorSalary * 12)
      const totalSeniorPayroll =
        c.opportunities.reduce((s, o) => s + o.seniorSalary * 12, 0) || 1
      const pctAhorro = (c.totalAnnualSavings / totalSeniorPayroll) * 100

      return {
        ...meta,
        hayData: c.opportunities.length > 0,
        datos: {
          N_FAMILIAS: formatInt(c.opportunities.length),
          CLP_AHORRO: formatCLP(monthlyAhorro),
          PCT_AHORRO: formatPct(pctAhorro),
        },
        detalle: {
          opportunities: c.opportunities,
          totalAnnualSavings: c.totalAnnualSavings,
          monthlyAhorro,
          pctAhorro,
        },
      }
    }

    // ── L7: Fuga de Talento Aumentado (tono PROTECTOR) ──────────────────
    case 'l7_fuga': {
      const f = diagnostic.flightRisk
      return {
        ...meta,
        hayData: f.count > 0,
        datos: {
          N_PERSONAS: formatInt(f.count),
          CLP_REEMPLAZO: formatCLP(f.totalReplacementCost),
        },
        detalle: {
          count: f.count,
          persons: f.persons,
          totalReplacementCost: f.totalReplacementCost,
        },
      }
    }

    // ── L8: Prioridad de Retención — RANKING COMPLETO CON TODOS LOS TIERS
    case 'l8_retencion': {
      const rp = diagnostic.retentionPriority
      // Conteo explícito por tier (el TASK exige ranking completo con tiers)
      const tiers = {
        intocable: 0,
        valioso: 0,
        neutro: 0,
        prescindible: 0,
      }
      for (const r of rp.ranking) {
        tiers[r.tier] = (tiers[r.tier] ?? 0) + 1
      }
      return {
        ...meta,
        hayData: rp.ranking.length > 0,
        datos: {
          N_PRESCINDIBLES: formatInt(tiers.prescindible),
        },
        detalle: {
          ranking: rp.ranking,            // TODO EL RANKING (todos los tiers)
          tiers,                           // breakdown por tier
          intocablesCount: rp.intocablesCount,
          prescindiblesCount: rp.prescindiblesCount,
        },
      }
    }

    // ── L9: Pasivo Laboral (costoEspera es el gatillo de venta) ─────────
    case 'l9_pasivo': {
      const prescindibles = diagnostic.retentionPriority.ranking.filter(
        r => r.tier === 'prescindible'
      )

      let totalHoy = 0
      let totalQ2 = 0
      let totalQ4 = 0
      let ahorroMensual = 0
      const breakdown = prescindibles.map(p => {
        const hoy =
          p.finiquitoToday ??
          calculateFiniquitoConTopeCustomUF(p.salary, p.tenureMonths, UF_VALUE_CLP)
        // Q2 = +6 meses, Q4 = +12 meses (TASK parte 7)
        const q2 = calculateFiniquitoConTopeCustomUF(
          p.salary,
          p.tenureMonths + 6,
          UF_VALUE_CLP
        )
        const q4 = calculateFiniquitoConTopeCustomUF(
          p.salary,
          p.tenureMonths + 12,
          UF_VALUE_CLP
        )
        totalHoy += hoy
        totalQ2 += q2
        totalQ4 += q4
        ahorroMensual += p.salary  // TASK parte 7: ahorroMes = salary
        return {
          employeeId: p.employeeId,
          employeeName: p.employeeName,
          position: p.position,
          departmentName: p.departmentName,
          salary: p.salary,
          tenureMonths: p.tenureMonths,
          finiquitoHoy: hoy,
          finiquitoQ2: q2,
          finiquitoQ4: q4,
          costoEspera: q4 - hoy,  // gatillo de venta del TASK
        }
      })

      // Payback: meses para recuperar inversión (finiquitos) con ahorro mensual
      const paybackMeses =
        ahorroMensual > 0 ? Math.ceil(totalHoy / ahorroMensual) : null
      const mesPayback = paybackMeses ?? 0

      return {
        ...meta,
        hayData: prescindibles.length > 0,
        datos: {
          CLP_FINIQUITOS: formatCLP(totalHoy),
          CLP_AHORRO_MES: formatCLP(ahorroMensual),
          N_MESES: paybackMeses !== null ? formatInt(paybackMeses) : '∞',
          MES_PAYBACK: paybackMeses !== null ? formatInt(mesPayback) : '∞',
        },
        detalle: {
          persons: breakdown,
          totalHoy,
          totalQ2,
          totalQ4,
          costoEsperaTotal: totalQ4 - totalHoy,
          ahorroMensual,
          paybackMeses,
        },
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RESOLVER TODOS LOS LENTES (orquestación para el endpoint)
// ════════════════════════════════════════════════════════════════════════════

const TODOS_LENTES: LenteId[] = [
  'l1_inercia',
  'l2_zombie',
  'l3_adopcion',
  'l4_fantasma',
  'l5_brecha',
  'l6_seniority',
  'l7_fuga',
  'l8_retencion',
  'l9_pasivo',
]

export async function resolverTodosLentes(
  ctx: DiagnosticContext
): Promise<Record<LenteId, LenteOutput>> {
  const outputs = await Promise.all(
    TODOS_LENTES.map(id => resolverLente(id, ctx))
  )
  return outputs.reduce<Record<LenteId, LenteOutput>>((acc, o) => {
    acc[o.id] = o
    return acc
  }, {} as Record<LenteId, LenteOutput>)
}
