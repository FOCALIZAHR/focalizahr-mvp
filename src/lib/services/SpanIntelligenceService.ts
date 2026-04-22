// ════════════════════════════════════════════════════════════════════════════
// SPAN INTELLIGENCE SERVICE — Arquitectura de Liderazgo (L4 reemplazo)
// src/lib/services/SpanIntelligenceService.ts
// ════════════════════════════════════════════════════════════════════════════
// Backend canónico para el lente L4 del Efficiency Hub. Calcula:
//   · Span de cada manager vs umbrales McKinsey por arquetipo
//   · Densidad gerencial organizacional
//   · Costo por FTE gestionado (salary estimado / span activo)
//   · Narrativa determinista por manager
//
// Principio P15: backend calcula, frontend renderiza. Cero lógica de
// negocio en el componente.
//
// Spec: .claude/tasks/SPEC_L4_ARQUITECTURA_LIDERAZGO.md
//
// Modo Estructural (default, sin cycleId):
//   · Span + arquetipo + densidad + costo
//   · Narrativas basadas solo en spanZone
//   · Funciona desde día 1, sin prerequisitos
//
// Modo Completo (cuando cycleId disponible — próximo commit):
//   · Agrega perfilEvaluativo + metasEquipoPct
//   · Activa matriz de 8 narrativas cruzadas
//
// Hallazgos de validación (§16 del spec):
//   · Emplea directReportsCount del enriched (ya filtra status=ACTIVE)
//     y lo refina contando desde enriched en memoria (isActive+ACTIVE).
//   · Detección de manager: performanceTrack ∈ {EJECUTIVO, MANAGER}
//     + spanActivo > 0. NO se usa managerLevel (100% null en demo).
//   · salary siempre estimado (no hay Employee.salary) vía
//     SalaryConfigService.getSalaryForAccount(accountId, acotadoGroup).
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import type { EnrichedEmployee } from './WorkforceIntelligenceService'
import { PositionAdapter } from './PositionAdapter'
import { SalaryConfigService } from './SalaryConfigService'
import {
  SPAN_OPTIMO,
  SPAN_FALLBACK,
  SPAN_MICRO_THRESHOLD,
  DENSIDAD_TOP_HEAVY,
  DENSIDAD_PESADA_MIN,
  DENSIDAD_PLANA_MAX,
  type SpanZone,
  type SpanNarrativeResult,
  type SpanManagerProfile,
  type OrgSpanSummary,
  type OrgSpanIntelligence,
  type RangoOptimo,
} from '@/types/span'

// ════════════════════════════════════════════════════════════════════════════
// FORMATTERS LOCALES (mismos que EfficiencyNarrativeEngine pero sin importar
// ese módulo para evitar ciclos entre resolver y service)
// ════════════════════════════════════════════════════════════════════════════

function formatCLP(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${Math.round(value)}`
}

// ════════════════════════════════════════════════════════════════════════════
// CLASIFICACIÓN DE SPAN ZONE
// ════════════════════════════════════════════════════════════════════════════

export function classifySpanZone(
  span: number,
  standardJobLevel: string | null
): SpanZone {
  if (span <= SPAN_MICRO_THRESHOLD) return 'MICRO'
  const rango = resolveRango(standardJobLevel)
  if (span < rango.min) return 'SUB'
  if (span > rango.max) return 'SOBRE'
  return 'EN_RANGO'
}

export function getSpanGap(
  span: number,
  standardJobLevel: string | null
): number {
  const rango = resolveRango(standardJobLevel)
  if (span < rango.min) return span - rango.min // negativo
  if (span > rango.max) return span - rango.max // positivo
  return 0
}

function resolveRango(standardJobLevel: string | null): RangoOptimo {
  if (!standardJobLevel) return SPAN_FALLBACK
  return SPAN_OPTIMO[standardJobLevel] ?? SPAN_FALLBACK
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS — Modo Estructural (sin cycleId)
// Matriz reducida del spec §7. Modo Completo extiende esto en commit futuro.
// ════════════════════════════════════════════════════════════════════════════

function getSpanNarrativeEstructural(
  firstName: string,
  spanZone: SpanZone,
  span: number,
  rangoOptimo: RangoOptimo,
  tenureMeses: number,
  costoFTE: number
): SpanNarrativeResult {
  const esNuevo = tenureMeses < 6

  if (spanZone === 'MICRO') {
    return {
      zona: 'ROJA',
      titulo: 'Título sin función real',
      narrativa: `${firstName} tiene ${span} ${span === 1 ? 'directo' : 'directos'}. Esta estructura no es gestión — es un título heredado de una reorganización que nunca se cerró.`,
      consecuencia: `Costo mensual de esta capa: ${formatCLP(costoFTE * span)}.`,
      accionSugerida: 'Consolidar',
      urgencia: 'ALTA',
    }
  }

  if (spanZone === 'SUB') {
    return {
      zona: 'AMARILLA',
      titulo: 'Sub-spanning estructural',
      narrativa: `${firstName} gestiona ${span} ${span === 1 ? 'persona' : 'personas'} cuando su arquetipo admite ${rangoOptimo.min}–${rangoOptimo.max}. Estructura revisable.`,
      consecuencia: `Costo por FTE gestionado: ${formatCLP(costoFTE)}/mes.`,
      accionSugerida: esNuevo ? 'Monitorear' : 'Evaluar consolidación',
      urgencia: 'BAJA',
    }
  }

  if (spanZone === 'SOBRE') {
    return {
      zona: 'AMARILLA',
      titulo: 'Equipo sobredimensionado',
      narrativa: `${firstName} gestiona ${span} personas — sobre el máximo recomendado de ${rangoOptimo.max} para su arquetipo.`,
      consecuencia: `Riesgo de atención insuficiente a cada directo.`,
      accionSugerida: esNuevo ? 'Monitorear' : 'Redistribuir equipo',
      urgencia: 'MEDIA',
    }
  }

  // EN_RANGO — estructura saludable
  return {
    zona: 'VERDE',
    titulo: 'Estructura saludable',
    narrativa: `${firstName} opera dentro del rango óptimo para su cargo.`,
    consecuencia: null,
    accionSugerida: 'Mantener',
    urgencia: 'NINGUNA',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS ORGANIZACIONALES (Acto 1 y 2)
// ════════════════════════════════════════════════════════════════════════════

function buildHeroNarrative(
  densidad: number,
  totalManagers: number,
  totalFTE: number,
  managersEnRojo: number,
  costoCapasSuboptimas: number
): { heroValue: string; heroUnit: string } {
  if (costoCapasSuboptimas > 0) {
    return {
      heroValue: formatCLP(costoCapasSuboptimas),
      heroUnit: `por mes en capas de gestión subóptimas · ${managersEnRojo} ${managersEnRojo === 1 ? 'jefatura' : 'jefaturas'} fuera del rango estructural`,
    }
  }
  // Sin capas en rojo — hero positivo basado en densidad
  return {
    heroValue: `${(densidad * 100).toFixed(0)}%`,
    heroUnit: `de tu dotación son jefes · ${managersEnRojo} de ${totalManagers} fuera del rango óptimo McKinsey`,
  }
}

function getDensidadNarrative(
  densidad: number,
  totalManagers: number,
  totalFTE: number
): string | null {
  if (densidad >= DENSIDAD_TOP_HEAVY) {
    return `Uno de cada ${Math.round(1 / densidad)} empleados es jefe. Tu estructura dedica el ${(densidad * 100).toFixed(0)}% de su dotación a gestionar al resto — por encima del estándar LATAM (10–14%).`
  }
  if (densidad >= DENSIDAD_PESADA_MIN) {
    return `${totalManagers} managers para ${totalFTE} personas. Tu estructura de gestión está en la parte alta del rango — revisable sin afectar la operación.`
  }
  if (densidad < DENSIDAD_PLANA_MAX) {
    return `Estructura plana: ${totalManagers} managers para ${totalFTE} personas. Alta velocidad de decisión, riesgo de sobrecarga en jefaturas clave.`
  }
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class SpanIntelligenceService {
  /**
   * Calcula OrgSpanIntelligence completa para el account.
   * Usa `enriched` del DiagnosticContext para evitar duplicar queries.
   */
  static async getOrgSpanIntelligence(
    accountId: string,
    enriched: EnrichedEmployee[]
  ): Promise<OrgSpanIntelligence> {
    if (enriched.length === 0) {
      return {
        org: {
          totalFTE: 0,
          totalManagers: 0,
          densidadGerencial: 0,
          managersEnRojo: 0,
          managersEnAmarillo: 0,
          managersEnVerde: 0,
          costoCapasSuboptimas: 0,
          costoFTEpromedio: 0,
          heroValue: '0',
          heroUnit: 'sin datos',
          densidadNarrativa: null,
        },
        managers: [],
      }
    }

    // ── Query lateral: managerId por empleado activo ──────────────────
    // EnrichedEmployee no expone managerId. La query es barata porque
    // ya filtrada por el enricher (mismo scope).
    const empsWithManager = await prisma.employee.findMany({
      where: { accountId, isActive: true, status: 'ACTIVE' },
      select: { id: true, managerId: true },
    })
    const managerIdById = new Map(
      empsWithManager.map(e => [e.id, e.managerId])
    )

    // ── Contar directReports ACTIVOS por manager (in-memory) ──────────
    // Consistente con §16.5: filtrar por activos excluye fantasmas.
    const activeSpanByManagerId = new Map<string, number>()
    for (const e of enriched) {
      const mgrId = managerIdById.get(e.employeeId)
      if (!mgrId) continue
      activeSpanByManagerId.set(
        mgrId,
        (activeSpanByManagerId.get(mgrId) ?? 0) + 1
      )
    }

    // ── Enriched indexado + detección de managers ─────────────────────
    const enrichedById = new Map(enriched.map(e => [e.employeeId, e]))
    const managerCandidates: EnrichedEmployee[] = []
    for (const e of enriched) {
      const track = PositionAdapter.mapToTrack(e.standardJobLevel)
      const spanActivo = activeSpanByManagerId.get(e.employeeId) ?? 0
      if (
        spanActivo > 0 &&
        (track === 'EJECUTIVO' || track === 'MANAGER')
      ) {
        managerCandidates.push(e)
      }
    }

    // ── Salary estimado por acotadoGroup (cache local) ───────────────
    const salaryCache = new Map<string, number>()
    async function estimateSalary(
      acotadoGroup: string | null
    ): Promise<number> {
      const key = acotadoGroup ?? '_default'
      if (salaryCache.has(key)) return salaryCache.get(key)!
      const result = await SalaryConfigService.getSalaryForAccount(
        accountId,
        acotadoGroup ?? undefined
      )
      salaryCache.set(key, result.monthlySalary)
      return result.monthlySalary
    }

    // ── Build profiles ─────────────────────────────────────────────────
    const profiles: SpanManagerProfile[] = []
    for (const m of managerCandidates) {
      const spanActivo = activeSpanByManagerId.get(m.employeeId) ?? 0
      const standardJobLevel = m.standardJobLevel
      const track = PositionAdapter.mapToTrack(standardJobLevel)
      const spanZone = classifySpanZone(spanActivo, standardJobLevel)
      const spanGap = getSpanGap(spanActivo, standardJobLevel)
      const rangoOptimo = resolveRango(standardJobLevel)

      const salary = await estimateSalary(m.acotadoGroup)
      const costoFTE = spanActivo > 0 ? salary / spanActivo : salary

      // Primer nombre para narrativas
      const firstName = m.employeeName.split(/[\s,]+/).filter(Boolean)[0] ?? m.employeeName

      const narrativa = getSpanNarrativeEstructural(
        firstName,
        spanZone,
        spanActivo,
        rangoOptimo,
        m.tenureMonths,
        costoFTE
      )

      profiles.push({
        managerId: m.employeeId,
        managerName: m.employeeName,
        cargo: m.position,
        gerenciaId: m.departmentId,
        gerenciaNombre: m.departmentName,
        standardJobLevel: standardJobLevel ?? 'sin_clasificar',
        performanceTrack: track,
        tenureMeses: m.tenureMonths,
        acotadoGroup: m.acotadoGroup,
        spanActual: spanActivo,
        spanZone,
        spanGap,
        rangoOptimo,
        perfilEvaluativo: null, // Modo Completo en commit futuro
        avgScore: null,
        metasEquipoPct: null,
        roleFitPromedio: null,
        salarioManager: salary,
        costoFTEgestionado: costoFTE,
        narrativa,
      })
    }

    // Ordenar: urgencia > zona > costoFTE DESC
    const urgOrder = { ALTA: 0, MEDIA: 1, BAJA: 2, NINGUNA: 3 }
    const zonaOrder = { ROJA: 0, AMARILLA: 1, VERDE: 2 }
    profiles.sort((a, b) => {
      const u = urgOrder[a.narrativa.urgencia] - urgOrder[b.narrativa.urgencia]
      if (u !== 0) return u
      const z =
        zonaOrder[a.narrativa.zona] - zonaOrder[b.narrativa.zona]
      if (z !== 0) return z
      return b.costoFTEgestionado - a.costoFTEgestionado
    })

    // ── Org summary ────────────────────────────────────────────────────
    const totalFTE = enriched.length
    const totalManagers = profiles.length
    const densidad = totalFTE > 0 ? totalManagers / totalFTE : 0
    const managersEnRojo = profiles.filter(p => p.narrativa.zona === 'ROJA').length
    const managersEnAmarillo = profiles.filter(p => p.narrativa.zona === 'AMARILLA').length
    const managersEnVerde = profiles.filter(p => p.narrativa.zona === 'VERDE').length
    const costoCapasSuboptimas = profiles
      .filter(p => p.narrativa.zona === 'ROJA')
      .reduce((s, p) => s + p.salarioManager, 0)
    const costoFTEpromedio =
      totalManagers > 0
        ? profiles.reduce((s, p) => s + p.costoFTEgestionado, 0) / totalManagers
        : 0

    const hero = buildHeroNarrative(
      densidad,
      totalManagers,
      totalFTE,
      managersEnRojo,
      costoCapasSuboptimas
    )
    const densidadNarrativa = getDensidadNarrative(
      densidad,
      totalManagers,
      totalFTE
    )

    return {
      org: {
        totalFTE,
        totalManagers,
        densidadGerencial: densidad,
        managersEnRojo,
        managersEnAmarillo,
        managersEnVerde,
        costoCapasSuboptimas,
        costoFTEpromedio,
        heroValue: hero.heroValue,
        heroUnit: hero.heroUnit,
        densidadNarrativa,
      },
      managers: profiles,
    }
  }
}
