// POST /api/workforce/presupuesto/provisiones
// Paso 4 del Wizard: dos listas de salidas + alternativas para swap.
//   listaRoja           — sugeridas por el sistema (tier=prescindible)
//   salidasPlanificadas — planificadas por el CEO (movimientos negativos)
// Para movimientos negativos consultamos Employee directo y enriquecemos
// con ranking — asi incluimos personas sin socCode (evitando el limite
// silencioso del enriquecimiento). Cada salida planificada incluye sus
// alternativas del mismo cargo para permitir swap manual.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { WorkforceIntelligenceService } from '@/lib/services/WorkforceIntelligenceService'
import {
  calculateFiniquitoConTopeCustomUF,
  calculateFiniquitoFuturo,
  calculateMonthsUntilNextYear,
  calculateTenureMonths,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'

const IPC_DEFAULT = 4.5
const FACTOR_AMPLIFICACION_DEFAULT = 1.35
const SALARY_MINIMO_VALIDO = 100_000
const SCORE_ALTO_WARNING = 80
const MESES_NOMBRE = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

interface AlternativaEntry {
  employeeId: string
  employeeName: string
  position: string
  retentionScore: number
  tier: string
}

interface ScoreBreakdown {
  goalsNorm: number
  roleFitNorm: number
  adaptNorm: number
  multiplierCritical: number
  multiplierSuccessor: number
  multiplierExposure: number
  hasCompleteData: boolean
}

interface ProvisionEntry {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  roleFitScore: number
  tenureMonths: number
  salary: number
  tier: 'intocable' | 'valioso' | 'neutro' | 'prescindible'
  finiquitoHoy: number
  finiquitoQ2: number
  finiquitoQ4: number
  costoEspera: number
  mesAniversario: number
  alzaSiEspera: number
  impactoTotalEspera: number
  timingAlert: string | null
  timingSeverity: 'warning' | 'critical' | null
  bloqueado: boolean
  bloqueadoRazon: string | null
  riskQuadrant: string | null
  origen: 'sistema' | 'planificado'
  cargoOrigen?: string
  movimientoKey?: string
  scoreAltoWarning: boolean
  alternativas: AlternativaEntry[]
  scoreBreakdown: ScoreBreakdown
}

interface MovimientoInput {
  acotadoGroup: string
  cargo: string
  delta: number
}

interface AniversarioAgregado {
  mes: number
  mesNombre: string
  personasCount: number
  costoAdicional: number
}

function formatMontoMM(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const mm = value / 1_000_000
  return mm >= 10 ? `${mm.toFixed(0)}M` : `${mm.toFixed(1)}M`
}

function normalizeCargo(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

function keyCargo(acotadoGroup: string | null, position: string | null): string {
  const a = (acotadoGroup ?? '').trim()
  const p = position ? normalizeCargo(position) : ''
  return `${a}::${p}`
}

function tierDesdeScore(score: number): 'intocable' | 'valioso' | 'neutro' | 'prescindible' {
  if (score >= 120) return 'intocable'
  if (score >= 80) return 'valioso'
  if (score >= 40) return 'neutro'
  return 'prescindible'
}

// Timing alert basado en el SALTO REAL de finiquito al cruzar el proximo
// umbral de antiguedad (ley chilena: +1 mes de sueldo por año cumplido,
// tope 11 años, fraccion ≥ 6 meses cuenta como año).
// NO es salary × IPC — eso es reajuste salarial, concepto distinto.
function generarTimingAlert(
  alzaEnFiniquito: number,
  mesSalto: number,
  mesesAlSalto: number | null,
): { text: string | null; severity: 'warning' | 'critical' | null } {
  if (alzaEnFiniquito < 500_000 || mesesAlSalto === null) {
    return { text: null, severity: null }
  }
  const mesNombre = MESES_NOMBRE[mesSalto - 1]
  if (alzaEnFiniquito >= 2_000_000) {
    return {
      text: `+$${formatMontoMM(alzaEnFiniquito)} si no se actua antes de ${mesNombre}`,
      severity: 'critical',
    }
  }
  if (mesesAlSalto <= 3) {
    return {
      text: `+$${formatMontoMM(alzaEnFiniquito)} al cumplir proximo año en ${mesNombre}`,
      severity: 'warning',
    }
  }
  return { text: null, severity: null }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ipcPorcentaje =
      typeof body?.ipcPorcentaje === 'number' && Number.isFinite(body.ipcPorcentaje)
        ? body.ipcPorcentaje
        : IPC_DEFAULT
    const factorAmplificacion =
      typeof body?.factorAmplificacion === 'number' && Number.isFinite(body.factorAmplificacion)
        ? body.factorAmplificacion
        : FACTOR_AMPLIFICACION_DEFAULT
    const movimientos: MovimientoInput[] = Array.isArray(body?.movimientos)
      ? body.movimientos.filter((m: any) => typeof m?.delta === 'number' && m.delta < 0)
      : []
    const salidasOverrides: Record<string, string[]> =
      typeof body?.salidasOverrides === 'object' && body.salidasOverrides !== null
        ? body.salidasOverrides
        : {}

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    let departmentIds: string[] | undefined
    if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    const diagnostic = await WorkforceIntelligenceService.getOrganizationDiagnostic(
      userContext.accountId,
      departmentIds,
    )
    const ranking = diagnostic.retentionPriority.ranking
    const rankingById = new Map(ranking.map(r => [r.employeeId, r]))
    const intocables = ranking.filter(r => r.tier === 'intocable').slice(0, 10)
    const intocableIds = new Set(
      ranking.filter(r => r.tier === 'intocable').map(r => r.employeeId),
    )

    // ── Thresholds adaptivos para prescindibles ──
    // Cuando la densidad de datos IA es baja (avgEff < 0.3), todos los scores se
    // comprimen y nadie cruza el threshold canonico de 40. Usamos umbrales escalados
    // O un fallback bottom-15% para garantizar que el CEO vea candidatos reales.
    const avgEff =
      ranking.length > 0
        ? ranking.reduce(
            (s, r) => s + (r.focalizaScore ?? r.observedExposure ?? 0),
            0,
          ) / ranking.length
        : 0
    const usandoThresholdsEscalados = avgEff < 0.3
    const thresholdPrescindible = usandoThresholdsEscalados ? 45 : 40

    let prescindiblesAuto = ranking.filter(
      r => Math.round(r.retentionScore) < thresholdPrescindible && r.tier !== 'intocable',
    )

    // Fallback: si sigue vacio, tomar los N con menor score (minimo 3, maximo 15%).
    let usandoFallbackRelativo = false
    if (prescindiblesAuto.length === 0 && ranking.length > 0) {
      const noIntocables = ranking.filter(r => r.tier !== 'intocable')
      const n = Math.max(3, Math.floor(noIntocables.length * 0.15))
      prescindiblesAuto = [...noIntocables]
        .sort((a, b) => a.retentionScore - b.retentionScore)
        .slice(0, n)
      usandoFallbackRelativo = prescindiblesAuto.length > 0
    }

    console.log(
      `[provisiones] account=${userContext.accountId} ranking=${ranking.length} prescindibles=${prescindiblesAuto.length} intocables=${intocables.length} movimientos=${movimientos.length} avgEff=${avgEff.toFixed(2)} scaled=${usandoThresholdsEscalados} fallback=${usandoFallbackRelativo}`,
    )

    // ── Para cada movimiento negativo: query directa Employee + merge ranking.
    // Esto garantiza que personas con socCode=null (excluidas del ranking) esten
    // disponibles como candidatas — sin limite silencioso.
    const cargoKeys = movimientos.map(m => keyCargo(m.acotadoGroup, m.cargo))
    const employeesCargosMov =
      cargoKeys.length > 0
        ? await prisma.employee.findMany({
            where: {
              accountId: userContext.accountId,
              isActive: true,
              status: 'ACTIVE',
              ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
              OR: movimientos.map(m => ({
                acotadoGroup: m.acotadoGroup,
                position: { equals: m.cargo, mode: 'insensitive' },
              })),
            },
            select: {
              id: true,
              fullName: true,
              position: true,
              acotadoGroup: true,
              hireDate: true,
              departmentId: true,
              department: { select: { displayName: true } },
            },
          })
        : []

    // Cache salarios por acotadoGroup (para empleados fuera de ranking).
    const uniqueGroupsCargos = [...new Set(employeesCargosMov.map(e => e.acotadoGroup).filter(Boolean))] as string[]
    const salaryCache = new Map<string, number>()
    for (const group of uniqueGroupsCargos) {
      const sr = await SalaryConfigService.getSalaryForAccount(userContext.accountId, group)
      salaryCache.set(group, sr.monthlySalary)
    }
    const defaultSalary =
      uniqueGroupsCargos.length > 0
        ? (await SalaryConfigService.getSalaryForAccount(userContext.accountId)).monthlySalary
        : 0

    // Pre-cargar hireDate para TODOS los prescindibles auto (ya en ranking).
    const idsAdicionales = prescindiblesAuto
      .map(p => p.employeeId)
      .filter(id => !employeesCargosMov.some(e => e.id === id))
    const employeesExtra =
      idsAdicionales.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: idsAdicionales }, accountId: userContext.accountId },
            select: { id: true, hireDate: true },
          })
        : []
    const hireDateMap = new Map<string, Date>([
      ...employeesCargosMov.map(e => [e.id, e.hireDate] as [string, Date]),
      ...employeesExtra.map(e => [e.id, e.hireDate] as [string, Date]),
    ])

    const mesActual = new Date().getMonth() + 1
    const ufValue = UF_VALUE_CLP
    const skippedSinSalario: string[] = []

    // Calcula el desglose del score — identico a calculateRetentionPriority().
    const computeBreakdown = (r: (typeof ranking)[number] | undefined): ScoreBreakdown => {
      if (!r) {
        return {
          goalsNorm: 50,
          roleFitNorm: 50,
          adaptNorm: 50,
          multiplierCritical: 1,
          multiplierSuccessor: 1,
          multiplierExposure: 1,
          hasCompleteData: false,
        }
      }
      const goalsNorm = r.metasCompliance ?? 50
      const roleFitNorm = r.roleFitScore
      const adaptBase5 = r.potentialAbility !== null ? (r.potentialAbility / 3) * 5 : 2.5
      const adaptNorm = (adaptBase5 / 5) * 100
      const multiplierCritical = r.isCriticalPosition ? 1.5 : 1
      const multiplierSuccessor = r.mobilityQuadrant === 'SUCESOR_NATURAL' ? 1.3 : 1
      const eff = r.focalizaScore ?? r.observedExposure ?? 0
      const multiplierExposure = 1 + eff
      return {
        goalsNorm: Math.round(goalsNorm),
        roleFitNorm: Math.round(roleFitNorm),
        adaptNorm: Math.round(adaptNorm),
        multiplierCritical,
        multiplierSuccessor,
        multiplierExposure: Number(multiplierExposure.toFixed(2)),
        hasCompleteData: r.metasCompliance !== null && r.potentialAbility !== null,
      }
    }

    // Construye ProvisionEntry a partir de un candidato (con o sin ranking).
    const buildFromEmployee = (
      emp: (typeof employeesCargosMov)[number],
      origen: 'sistema' | 'planificado',
      cargoOrigen?: string,
      movimientoKey?: string,
      alternativas: AlternativaEntry[] = [],
    ): ProvisionEntry | null => {
      const rankingEntry = rankingById.get(emp.id)
      const salary =
        rankingEntry?.salary ??
        salaryCache.get(emp.acotadoGroup ?? '') ??
        defaultSalary
      if (salary < SALARY_MINIMO_VALIDO) {
        skippedSinSalario.push(emp.id)
        return null
      }
      const tenureMonths =
        rankingEntry?.tenureMonths ?? calculateTenureMonths(emp.hireDate)
      const retentionScore = rankingEntry ? Math.round(rankingEntry.retentionScore) : 50
      const roleFitScore = rankingEntry?.roleFitScore ?? 50
      const tier = rankingEntry?.tier ?? tierDesdeScore(retentionScore)
      const finiquitoHoy = calculateFiniquitoConTopeCustomUF(salary, tenureMonths, ufValue)
      const finiquitoQ2 = calculateFiniquitoFuturo(salary, tenureMonths, 90, ufValue)
      const finiquitoQ4 = calculateFiniquitoFuturo(salary, tenureMonths, 180, ufValue)
      const costoEspera = finiquitoQ4 - finiquitoHoy
      // Salto real de finiquito al proximo año cumplido (ley chilena).
      const mesesAlSalto = calculateMonthsUntilNextYear(tenureMonths)
      const mesSalto =
        mesesAlSalto !== null ? ((mesActual - 1 + mesesAlSalto) % 12) + 1 : mesActual
      const finiquitoEnSalto =
        mesesAlSalto !== null
          ? calculateFiniquitoConTopeCustomUF(salary, tenureMonths + mesesAlSalto, ufValue)
          : finiquitoHoy
      const alzaSiEspera = finiquitoEnSalto - finiquitoHoy
      const impactoTotalEspera = alzaSiEspera
      const mesAniversario = mesSalto
      const { text, severity } = generarTimingAlert(alzaSiEspera, mesSalto, mesesAlSalto)

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        position: emp.position ?? '',
        departmentName: emp.department?.displayName ?? rankingEntry?.departmentName ?? '',
        retentionScore,
        roleFitScore,
        tenureMonths,
        salary,
        tier,
        finiquitoHoy,
        finiquitoQ2,
        finiquitoQ4,
        costoEspera,
        mesAniversario,
        alzaSiEspera,
        impactoTotalEspera,
        timingAlert: text,
        timingSeverity: severity,
        bloqueado: false,
        bloqueadoRazon: null,
        riskQuadrant: rankingEntry?.riskQuadrant ?? null,
        origen,
        cargoOrigen,
        movimientoKey,
        scoreAltoWarning: retentionScore >= SCORE_ALTO_WARNING,
        alternativas,
        scoreBreakdown: computeBreakdown(rankingEntry),
      }
    }

    // Construye a partir de un RetentionEntry (solo para lista roja automatica).
    const buildFromRanking = (
      p: (typeof ranking)[number],
      origen: 'sistema' | 'planificado',
    ): ProvisionEntry | null => {
      if (p.salary < SALARY_MINIMO_VALIDO) {
        skippedSinSalario.push(p.employeeId)
        return null
      }
      const finiquitoHoy = calculateFiniquitoConTopeCustomUF(p.salary, p.tenureMonths, ufValue)
      const finiquitoQ2 = calculateFiniquitoFuturo(p.salary, p.tenureMonths, 90, ufValue)
      const finiquitoQ4 = calculateFiniquitoFuturo(p.salary, p.tenureMonths, 180, ufValue)
      const costoEspera = finiquitoQ4 - finiquitoHoy
      const mesesAlSalto = calculateMonthsUntilNextYear(p.tenureMonths)
      const mesSalto =
        mesesAlSalto !== null ? ((mesActual - 1 + mesesAlSalto) % 12) + 1 : mesActual
      const finiquitoEnSalto =
        mesesAlSalto !== null
          ? calculateFiniquitoConTopeCustomUF(p.salary, p.tenureMonths + mesesAlSalto, ufValue)
          : finiquitoHoy
      const alzaSiEspera = finiquitoEnSalto - finiquitoHoy
      const impactoTotalEspera = alzaSiEspera
      const mesAniversario = mesSalto
      const { text, severity } = generarTimingAlert(alzaSiEspera, mesSalto, mesesAlSalto)

      return {
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        position: p.position,
        departmentName: p.departmentName,
        retentionScore: Math.round(p.retentionScore),
        roleFitScore: p.roleFitScore,
        tenureMonths: p.tenureMonths,
        salary: p.salary,
        tier: p.tier,
        finiquitoHoy,
        finiquitoQ2,
        finiquitoQ4,
        costoEspera,
        mesAniversario,
        alzaSiEspera,
        impactoTotalEspera,
        timingAlert: text,
        timingSeverity: severity,
        bloqueado: false,
        bloqueadoRazon: null,
        riskQuadrant: p.riskQuadrant,
        origen,
        scoreAltoWarning: Math.round(p.retentionScore) >= SCORE_ALTO_WARNING,
        alternativas: [],
        scoreBreakdown: computeBreakdown(p),
      }
    }

    // ── Construir salidasPlanificadas por movimiento, con alternativas ─────
    const salidasPlanificadas: ProvisionEntry[] = []
    const planificadosIds = new Set<string>()

    for (const mov of movimientos) {
      const movKey = keyCargo(mov.acotadoGroup, mov.cargo)
      // Todos los empleados del cargo (excluyendo intocables).
      const candidatos = employeesCargosMov
        .filter(
          e =>
            e.acotadoGroup === mov.acotadoGroup &&
            (e.position ?? '').toLowerCase().trim() === mov.cargo.toLowerCase().trim(),
        )
        .filter(e => !intocableIds.has(e.id))
        // Ordenar por retention score ascendente (menor score primero).
        .sort((a, b) => {
          const sa = rankingById.get(a.id)?.retentionScore ?? 50
          const sb = rankingById.get(b.id)?.retentionScore ?? 50
          return sa - sb
        })

      if (candidatos.length === 0) continue

      // Aplicar override del CEO si existe; sino tomar los primeros |delta|.
      const overrideIds = salidasOverrides[movKey]
      const seleccionadosEmps = overrideIds
        ? candidatos.filter(c => overrideIds.includes(c.id)).slice(0, Math.abs(mov.delta))
        : candidatos.slice(0, Math.abs(mov.delta))

      const seleccionadosIds = new Set(seleccionadosEmps.map(e => e.id))

      // Alternativas = candidatos no seleccionados (todos los demas).
      const alternativasList: AlternativaEntry[] = candidatos
        .filter(c => !seleccionadosIds.has(c.id))
        .map(c => {
          const r = rankingById.get(c.id)
          const score = r ? Math.round(r.retentionScore) : 50
          return {
            employeeId: c.id,
            employeeName: c.fullName,
            position: c.position ?? '',
            retentionScore: score,
            tier: r?.tier ?? tierDesdeScore(score),
          }
        })

      for (const c of seleccionadosEmps) {
        if (planificadosIds.has(c.id)) continue
        const entry = buildFromEmployee(c, 'planificado', mov.cargo, movKey, alternativasList)
        if (entry) {
          salidasPlanificadas.push(entry)
          planificadosIds.add(c.id)
        }
      }
    }

    // ── listaRoja: prescindibles automaticos, excluyendo los ya planificados ─
    const listaRoja: ProvisionEntry[] = []
    for (const p of prescindiblesAuto) {
      if (planificadosIds.has(p.employeeId)) continue
      const entry = buildFromRanking(p, 'sistema')
      if (entry) listaRoja.push(entry)
    }

    if (skippedSinSalario.length > 0) {
      console.warn(
        `[workforce/presupuesto/provisiones] ${skippedSinSalario.length} candidatos excluidos por salario invalido (<${SALARY_MINIMO_VALIDO})`,
      )
    }

    const listaVerde = intocables.map(p => ({
      employeeId: p.employeeId,
      employeeName: p.employeeName,
      position: p.position,
      departmentName: p.departmentName,
      roleFitScore: p.roleFitScore,
      tier: p.tier,
      bloqueado: true,
      bloqueadoRazon: `RoleFit ${p.roleFitScore}% — protegido`,
    }))

    const aniversarioMap = new Map<number, AniversarioAgregado>()
    const todos = [...listaRoja, ...salidasPlanificadas]
    for (const entry of todos) {
      const existing = aniversarioMap.get(entry.mesAniversario)
      if (existing) {
        existing.personasCount += 1
        existing.costoAdicional += entry.alzaSiEspera * factorAmplificacion
      } else {
        aniversarioMap.set(entry.mesAniversario, {
          mes: entry.mesAniversario,
          mesNombre: MESES_NOMBRE[entry.mesAniversario - 1],
          personasCount: 1,
          costoAdicional: entry.alzaSiEspera * factorAmplificacion,
        })
      }
    }
    const prescindiblesConAniversario = Array.from(aniversarioMap.values())
      .map(a => ({ ...a, costoAdicional: Math.round(a.costoAdicional) }))
      .sort((a, b) => a.mes - b.mes)

    const finiquitosTotal =
      listaRoja.reduce((sum, r) => sum + r.finiquitoHoy, 0) +
      salidasPlanificadas.reduce((sum, r) => sum + r.finiquitoHoy, 0)
    const ahorroMensualPostSalida = Math.round(
      todos.reduce((sum, r) => sum + r.salary * factorAmplificacion, 0),
    )
    const paybackMeses =
      ahorroMensualPostSalida > 0 ? Math.round(finiquitosTotal / ahorroMensualPostSalida) : 0

    return NextResponse.json({
      success: true,
      data: {
        listaRoja,
        salidasPlanificadas,
        listaVerde,
        prescindiblesConAniversario,
        resumen: {
          finiquitosTotal,
          personasCount: listaRoja.length + salidasPlanificadas.length,
          ahorroMensualPostSalida,
          paybackMeses,
        },
        contexto: {
          ufValueCLP: ufValue,
          factorAmplificacion,
          ipcPorcentaje,
          mesActual,
          excluidosSinSalario: skippedSinSalario.length,
          thresholdsEscalados: usandoThresholdsEscalados,
          fallbackRelativo: usandoFallbackRelativo,
          avgExposicionIA: Number(avgEff.toFixed(2)),
        },
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/provisiones] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
