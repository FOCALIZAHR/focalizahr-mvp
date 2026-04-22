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
// Dos modos automáticos según data disponible:
//
// Modo Estructural (fallback sin ciclo activo):
//   · Span + arquetipo + densidad + costo
//   · Narrativas basadas solo en spanZone
//   · Funciona desde día 1, sin prerequisitos
//
// Modo Completo (cuando hay PerformanceCycle con managerScore):
//   · Agrega perfilEvaluativo (via evaluatorStatsEngine sobre managerScore
//     del ciclo: avg + stdDev calculados en memoria)
//   · Agrega metasEquipoPct (via GoalsService.getEmployeeGoalsScore,
//     INDEPENDIENTE del ciclo — mismo patrón que Workforce/Simulador)
//   · Agrega roleFitPromedio (desde enriched.roleFitScore del ciclo)
//   · Activa las 8 combinaciones narrativas del spec §7
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
import { GoalsService } from './GoalsService'
import { getEvaluationClassification } from '@/lib/utils/evaluatorStatsEngine'
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
  type PerfilEvaluativo,
  type GerenciaRollup,
  type ArquetipoRollup,
  type PiramideNivel,
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
// NARRATIVAS — Matriz completa del spec §7 (8 combinaciones + reglas prioridad)
// ════════════════════════════════════════════════════════════════════════════
// Funciona en dos modos según si hay cycleId disponible:
//   · Modo Estructural (perfilEval=null, metasPct=null): narrativa solo por
//     spanZone. Fallback cuando no hay ciclo activo con evaluaciones.
//   · Modo Completo (perfilEval y/o metasPct presentes): las 8 combinaciones
//     del spec se activan según reglas de prioridad (§7).
// ════════════════════════════════════════════════════════════════════════════

function getSpanNarrative(
  firstName: string,
  spanZone: SpanZone,
  span: number,
  rangoOptimo: RangoOptimo,
  tenureMeses: number,
  costoFTE: number,
  perfilEval: PerfilEvaluativo | null,
  metasPct: number | null
): SpanNarrativeResult {
  const esNuevo = tenureMeses < 6
  const hasCycleData = perfilEval !== null
  const metasBajas = metasPct !== null && metasPct < 65
  const metasAltas = metasPct !== null && metasPct >= 85

  // REGLA 1 — MICRO-EQUIPO siempre gana (span ≤ 2)
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

  // REGLA 2 — SUB-SPAN (narrativas contextuales)
  if (spanZone === 'SUB') {
    // SUB + INDULGENTE + metas bajas → CAPA SIN VALOR
    if (hasCycleData && perfilEval === 'INDULGENTE' && metasBajas) {
      return {
        zona: 'ROJA',
        titulo: 'Capa sin valor',
        narrativa: `${firstName} gestiona ${span} personas y no detecta que su equipo no está cumpliendo. Evalúa bien a todos — pero los resultados dicen otra cosa.`,
        consecuencia: `Costo de esta capa: ${formatCLP(costoFTE)} por persona gestionada.`,
        accionSugerida: 'Consolidar',
        urgencia: 'ALTA',
      }
    }
    // SUB + SEVERA + metas altas → MICROMANAGEMENT
    if (hasCycleData && perfilEval === 'SEVERA' && metasAltas) {
      return {
        zona: 'AMARILLA',
        titulo: 'Micromanagement de alta presión',
        narrativa: `${firstName} tiene ${span} directos y los evalúa con estándares exigentes. Su equipo entrega — pero a qué costo.`,
        consecuencia: `Riesgo de agotamiento: monitorear retención del equipo.`,
        accionSugerida: esNuevo ? 'Monitorear' : 'Revisar estilo',
        urgencia: 'MEDIA',
      }
    }
    // SUB + CENTRAL + metas bajas → CAPA CIEGA
    if (hasCycleData && perfilEval === 'CENTRAL' && metasBajas) {
      return {
        zona: 'ROJA',
        titulo: 'Capa ciega a su propio problema',
        narrativa: `${firstName} evalúa a todos igual y su equipo cumple al ${Math.round(metasPct!)}%. No hay señal de autocorrección.`,
        consecuencia: `Sin diferenciación en las evaluaciones, el equipo no recibe la señal de que algo no está funcionando.`,
        accionSugerida: 'Coaching · Revisión',
        urgencia: 'ALTA',
      }
    }
    // SUB + OPTIMA + metas no bajas → CAPACIDAD SUBUTILIZADA
    if (!metasBajas && (!hasCycleData || perfilEval === 'OPTIMA')) {
      return {
        zona: 'AMARILLA',
        titulo: 'Capacidad subutilizada',
        narrativa: `El equipo de ${firstName} entrega. El problema es estructural: gestiona ${span} ${span === 1 ? 'persona' : 'personas'} cuando su cargo admite hasta ${rangoOptimo.max}.`,
        consecuencia: `Ampliar su equipo capturaría capacidad sin costo adicional.`,
        accionSugerida: 'Ampliar equipo',
        urgencia: 'BAJA',
      }
    }
    // SUB genérico
    return {
      zona: 'AMARILLA',
      titulo: 'Sub-spanning estructural',
      narrativa: `${firstName} gestiona ${span} ${span === 1 ? 'persona' : 'personas'} cuando su arquetipo admite ${rangoOptimo.min}–${rangoOptimo.max}. Estructura revisable.`,
      consecuencia: `Costo por FTE gestionado: ${formatCLP(costoFTE)}/mes.`,
      accionSugerida: esNuevo ? 'Monitorear' : 'Evaluar consolidación',
      urgencia: 'BAJA',
    }
  }

  // REGLA 3 — SOBRE-SPAN
  if (spanZone === 'SOBRE') {
    // SOBRE + INDULGENTE + metas bajas → SOBRECARGA CON VISTA GORDA
    if (hasCycleData && perfilEval === 'INDULGENTE' && metasBajas) {
      return {
        zona: 'ROJA',
        titulo: 'Sobrecarga con vista gorda',
        narrativa: `${firstName} tiene ${span} directos, evalúa a todos bien, y su equipo cumple al ${Math.round(metasPct!)}%. No alcanza a ver lo que tiene enfrente.`,
        consecuencia: `Con ${span} personas a cargo, los problemas individuales quedan invisibles.`,
        accionSugerida: 'Reducir equipo · Calibración',
        urgencia: 'ALTA',
      }
    }
    // SOBRE + OPTIMA + metas altas → LÍDER DE ALTA CAPACIDAD
    if (metasAltas && (!hasCycleData || perfilEval === 'OPTIMA')) {
      return {
        zona: 'VERDE',
        titulo: 'Líder de alta capacidad',
        narrativa: `${firstName} gestiona ${span} personas con cumplimiento de metas sobre el ${Math.round(metasPct!)}%. Este patrón es replicable.`,
        consecuencia: `¿Hay otros líderes que puedan aprender de este modelo de gestión?`,
        accionSugerida: 'Mantener',
        urgencia: 'NINGUNA',
      }
    }
    // SOBRE + SEVERA + metas altas → RESULTADO A COSTA DE PRESIÓN
    if (hasCycleData && perfilEval === 'SEVERA' && metasAltas) {
      return {
        zona: 'AMARILLA',
        titulo: 'Resultado a costa de presión',
        narrativa: `Los números de ${firstName} son sólidos. Sus evaluaciones están consistentemente en el rango severo. El equipo entrega — ¿por cuánto tiempo más?`,
        consecuencia: `Monitorear retención del equipo en los próximos 6 meses.`,
        accionSugerida: 'Monitorear retención',
        urgencia: 'MEDIA',
      }
    }
    // SOBRE genérico
    return {
      zona: 'AMARILLA',
      titulo: 'Equipo sobredimensionado',
      narrativa: `${firstName} gestiona ${span} personas — sobre el máximo recomendado de ${rangoOptimo.max} para su arquetipo.`,
      consecuencia: `Riesgo de atención insuficiente a cada directo.`,
      accionSugerida: esNuevo ? 'Monitorear' : 'Redistribuir equipo',
      urgencia: 'MEDIA',
    }
  }

  // EN_RANGO + INDULGENTE + metas bajas → ESTRUCTURA OK, GESTIÓN A REVISAR
  if (hasCycleData && perfilEval === 'INDULGENTE' && metasBajas) {
    return {
      zona: 'AMARILLA',
      titulo: 'Estructura OK · Gestión a revisar',
      narrativa: `${firstName} tiene el span correcto para su cargo. El problema no es cuánta gente gestiona — es lo que percibe de ella.`,
      consecuencia: `Evaluaciones indulgentes + metas bajas: la señal no llega al equipo.`,
      accionSugerida: 'Calibración evaluativa',
      urgencia: 'MEDIA',
    }
  }

  // EN_RANGO + todo OK → ESTRUCTURA SALUDABLE
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
        byGerencia: [],
        byArquetipo: [],
        piramide: [],
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

    // ── Modo Completo: perfil evaluativo + metas equipo + roleFit ─────
    // Detecta ciclo activo más reciente (mismo criterio que
    // WorkforceIntelligenceService.buildEnrichedDataset). Si no hay,
    // cae automáticamente a Modo Estructural (perfilEval=null,
    // metasPct=null) y la matriz de narrativas usa fallbacks genéricos.
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        accountId,
        status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] },
        performanceRatings: { some: { managerScore: { not: null } } },
      },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    })

    // Perfil evaluativo por manager — calcula avg + stdDev en memoria
    // desde managerScore del ciclo. No depende de ManagerVarianceService
    // para tener el control sobre stdDev (requerido por
    // getEvaluationClassification).
    const evalStatsByManagerId = new Map<
      string,
      { avg: number; stdDev: number; count: number }
    >()
    if (cycle) {
      const scoreRatings = await prisma.performanceRating.findMany({
        where: {
          cycleId: cycle.id,
          accountId,
          managerScore: { not: null },
          employee: { managerId: { not: null } },
        },
        select: {
          managerScore: true,
          employee: { select: { managerId: true } },
        },
      })
      const scoresByManagerId = new Map<string, number[]>()
      for (const r of scoreRatings) {
        const mgrId = r.employee.managerId
        if (!mgrId || r.managerScore === null) continue
        if (!scoresByManagerId.has(mgrId)) scoresByManagerId.set(mgrId, [])
        scoresByManagerId.get(mgrId)!.push(r.managerScore)
      }
      for (const [mgrId, scores] of scoresByManagerId) {
        const count = scores.length
        const avg = scores.reduce((s, x) => s + x, 0) / count
        const variance =
          scores.reduce((s, x) => s + (x - avg) ** 2, 0) / count
        const stdDev = Math.sqrt(variance)
        evalStatsByManagerId.set(mgrId, { avg, stdDev, count })
      }
    }

    // Metas del equipo — GoalsService.getEmployeeGoalsScore es
    // INDEPENDIENTE de cycleId (usa as-of-date actual). Se consulta por
    // cada directo activo del manager y se promedia. Uso canónico —
    // mismo patrón que Workforce y Simulador.
    const asOf = new Date()
    const directsByManagerId = new Map<string, string[]>()
    for (const e of enriched) {
      const mgrId = managerIdById.get(e.employeeId)
      if (!mgrId) continue
      if (!directsByManagerId.has(mgrId)) directsByManagerId.set(mgrId, [])
      directsByManagerId.get(mgrId)!.push(e.employeeId)
    }

    const metasEquipoByManagerId = new Map<string, number>()
    const metasPromises: Array<Promise<void>> = []
    for (const m of managerCandidates) {
      const directs = directsByManagerId.get(m.employeeId) ?? []
      if (directs.length === 0) continue
      metasPromises.push(
        (async () => {
          const scores = await Promise.all(
            directs.map(id => GoalsService.getEmployeeGoalsScore(id, asOf))
          )
          const conMetas = scores.filter(s => s.goalsCount > 0)
          if (conMetas.length === 0) return
          const avg =
            conMetas.reduce((s, x) => s + x.score, 0) / conMetas.length
          metasEquipoByManagerId.set(m.employeeId, avg)
        })()
      )
    }
    await Promise.all(metasPromises)

    // RoleFit promedio del equipo — desde enriched (ya cargado
    // con el cycle activo del enricher principal)
    const roleFitByManagerId = new Map<string, number>()
    for (const m of managerCandidates) {
      const directs = directsByManagerId.get(m.employeeId) ?? []
      if (directs.length === 0) continue
      const scores = directs
        .map(id => enrichedById.get(id)?.roleFitScore)
        .filter((v): v is number => v !== null && v !== undefined)
      if (scores.length === 0) continue
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length
      roleFitByManagerId.set(m.employeeId, avg)
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

      // Señales del Modo Completo (null si no hay cycle o sin data)
      const evalStats = evalStatsByManagerId.get(m.employeeId) ?? null
      const perfilEvaluativo: PerfilEvaluativo | null = evalStats
        ? getEvaluationClassification(
            evalStats.avg,
            evalStats.stdDev,
            evalStats.count
          )
        : null
      const avgScore = evalStats ? evalStats.avg : null
      const metasEquipoPct = metasEquipoByManagerId.get(m.employeeId) ?? null
      const roleFitPromedio = roleFitByManagerId.get(m.employeeId) ?? null

      // Primer nombre para narrativas
      const firstName = m.employeeName.split(/[\s,]+/).filter(Boolean)[0] ?? m.employeeName

      const narrativa = getSpanNarrative(
        firstName,
        spanZone,
        spanActivo,
        rangoOptimo,
        m.tenureMonths,
        costoFTE,
        perfilEvaluativo,
        metasEquipoPct
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
        perfilEvaluativo,
        avgScore,
        metasEquipoPct,
        roleFitPromedio,
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

    // ── Rollups laterales para el modal "Distribución completa" ──────
    // Cero queries adicionales — todo se agrega in-memory desde
    // profiles + enriched.
    const byGerencia = buildGerenciaRollup(profiles, enriched)
    const byArquetipo = buildArquetipoRollup(profiles)
    const piramide = buildPiramide(enriched, profiles)

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
      byGerencia,
      byArquetipo,
      piramide,
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROLLUPS — agregaciones in-memory para el modal "Distribución completa"
// ════════════════════════════════════════════════════════════════════════════

function buildGerenciaRollup(
  profiles: SpanManagerProfile[],
  enriched: EnrichedEmployee[]
): GerenciaRollup[] {
  // FTE total por gerencia (no solo managers — toda la dotación de la gerencia)
  const fteByGerencia = new Map<string, number>()
  for (const e of enriched) {
    fteByGerencia.set(
      e.departmentId,
      (fteByGerencia.get(e.departmentId) ?? 0) + 1
    )
  }

  const grupos = new Map<
    string,
    {
      gerenciaNombre: string
      managers: SpanManagerProfile[]
    }
  >()
  for (const p of profiles) {
    const key = p.gerenciaId
    if (!grupos.has(key))
      grupos.set(key, { gerenciaNombre: p.gerenciaNombre, managers: [] })
    grupos.get(key)!.managers.push(p)
  }

  const out: GerenciaRollup[] = []
  for (const [gerenciaId, { gerenciaNombre, managers }] of grupos) {
    const total = managers.length
    const fteGerencia = fteByGerencia.get(gerenciaId) ?? total
    out.push({
      gerenciaId,
      gerenciaNombre,
      totalManagers: total,
      spanPromedio: managers.reduce((s, m) => s + m.spanActual, 0) / total,
      densidadGerencial: fteGerencia > 0 ? total / fteGerencia : 0,
      costoFTEpromedio:
        managers.reduce((s, m) => s + m.costoFTEgestionado, 0) / total,
      enRojo: managers.filter(m => m.narrativa.zona === 'ROJA').length,
      enAmarillo: managers.filter(m => m.narrativa.zona === 'AMARILLA').length,
      enVerde: managers.filter(m => m.narrativa.zona === 'VERDE').length,
    })
  }
  // Ordenar por managers descendente
  return out.sort((a, b) => b.totalManagers - a.totalManagers)
}

function buildArquetipoRollup(
  profiles: SpanManagerProfile[]
): ArquetipoRollup[] {
  const grupos = new Map<string, SpanManagerProfile[]>()
  for (const p of profiles) {
    const key = p.standardJobLevel
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(p)
  }

  const out: ArquetipoRollup[] = []
  for (const [standardJobLevel, managers] of grupos) {
    const total = managers.length
    const enRango = managers.filter(m => m.spanZone === 'EN_RANGO').length
    out.push({
      standardJobLevel,
      arquetipo: managers[0].rangoOptimo.arquetipo,
      rangoOptimo: managers[0].rangoOptimo,
      totalManagers: total,
      spanPromedio: managers.reduce((s, m) => s + m.spanActual, 0) / total,
      enRango,
      fueraRango: total - enRango,
      distanciaMediaAlOptimo:
        managers.reduce((s, m) => s + Math.abs(m.spanGap), 0) / total,
    })
  }
  // Ordenar por order del arquetipo (gerentes arriba, operativos abajo)
  // — usa el SPAN_OPTIMO key order como proxy
  const orden = Object.keys(SPAN_OPTIMO)
  return out.sort(
    (a, b) =>
      orden.indexOf(a.standardJobLevel) - orden.indexOf(b.standardJobLevel)
  )
}

function buildPiramide(
  enriched: EnrichedEmployee[],
  profiles: SpanManagerProfile[]
): PiramideNivel[] {
  // FTE por standardJobLevel (toda la dotación, no solo managers)
  const fteByLevel = new Map<string, number>()
  for (const e of enriched) {
    const key = e.standardJobLevel ?? 'sin_clasificar'
    fteByLevel.set(key, (fteByLevel.get(key) ?? 0) + 1)
  }

  // Managers por level
  const managersByLevel = new Map<string, SpanManagerProfile[]>()
  for (const p of profiles) {
    const key = p.standardJobLevel
    if (!managersByLevel.has(key)) managersByLevel.set(key, [])
    managersByLevel.get(key)!.push(p)
  }

  // Construir niveles en orden canónico (1 = más alto)
  const orden = Object.keys(SPAN_OPTIMO) // gerente_director ... operativo_auxiliar
  const out: PiramideNivel[] = []
  for (let i = 0; i < orden.length; i++) {
    const standardJobLevel = orden[i]
    const fteCount = fteByLevel.get(standardJobLevel) ?? 0
    if (fteCount === 0) continue // omitir niveles vacíos
    const mgrs = managersByLevel.get(standardJobLevel) ?? []
    const rango = SPAN_OPTIMO[standardJobLevel] ?? SPAN_FALLBACK
    out.push({
      nivel: i + 1,
      standardJobLevel,
      arquetipo: rango.arquetipo,
      fteCount,
      managersCount: mgrs.length,
      spanPromedio:
        mgrs.length > 0
          ? mgrs.reduce((s, m) => s + m.spanActual, 0) / mgrs.length
          : null,
      ratioControl: null, // se calcula en el siguiente loop
    })
  }

  // Ratio de control: managers de este nivel : FTE acumulado de niveles
  // inferiores (lo que efectivamente "controla" esta capa).
  let acumInferior = 0
  for (let i = out.length - 1; i >= 0; i--) {
    const nivel = out[i]
    if (nivel.managersCount > 0 && acumInferior > 0) {
      nivel.ratioControl = acumInferior / nivel.managersCount
    }
    acumInferior += nivel.fteCount
  }

  return out
}
