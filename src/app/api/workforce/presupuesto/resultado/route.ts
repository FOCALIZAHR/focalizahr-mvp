// POST /api/workforce/presupuesto/resultado
// Paso 5 del Wizard: presupuesto mensualizado 12 meses + narrativa ejecutiva.
// Recibe el estado completo del wizard y devuelve barras mensuales con
// colores semanticos y texto CEO para directorio.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'
import {
  calculateFiniquitoConTopeCustomUF,
  calculateMonthsUntilNextYear,
  calculateTenureMonths,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'

const MESES_NOMBRE = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

type FrecuenciaReajuste = 'anual' | 'semestral' | 'trimestral'

interface SupuestosMacro {
  ipcPorcentaje: number
  meritoPorcentaje: number
  factorAmplificacion: number
  ausentismoPorcentaje: number
  rotacionEsperada: number
  anioPresupuesto: number
  mesInicio: number
  mesSalidas: number
  frecuenciaReajuste: FrecuenciaReajuste
  mesReajusteIPC: number
  mesMerito: number
}

function clampMes(n: unknown, fallback: number): number {
  const parsed = typeof n === 'number' ? n : Number.parseInt(String(n ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(12, Math.max(1, Math.round(parsed)))
}

interface MovimientoInput {
  acotadoGroup: string
  cargo: string
  delta: number
  mesInicio?: number
}

interface FiniquitoEntry {
  nombre: string
  monto: number
}

interface MesPresupuesto {
  mes: number
  mesNombre: string
  costoEmpresa: number
  costoBaseMes: number
  reajusteIPCMes: number
  meritoMes: number
  finiquitosMes: number
  ahorroPostSalida: number
  costoAniversariosEvitables: number
  finiquitosDetalle: FiniquitoEntry[]
  // Proyeccion "sin acciones": que pasaria con la masa si el CEO no hace nada
  // (aplica IPC + merito pero NO movimientos, NO finiquitos, NO ahorro).
  sinAccionesMes: number
  fteMes: number
  color: 'neutral' | 'warning' | 'critical' | 'success'
  tooltip: string
}

function formatMonto(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M`
  }
  return `$${Math.round(value / 1_000).toLocaleString('es-CL')}K`
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

    const body = await request.json()
    const raw = (body?.supuestos ?? {}) as Partial<SupuestosMacro>
    const mesActualDefault = new Date().getMonth() + 1
    const supuestos: SupuestosMacro = {
      ipcPorcentaje:
        typeof raw.ipcPorcentaje === 'number' && Number.isFinite(raw.ipcPorcentaje)
          ? raw.ipcPorcentaje
          : 4.5,
      meritoPorcentaje:
        typeof raw.meritoPorcentaje === 'number' && Number.isFinite(raw.meritoPorcentaje)
          ? raw.meritoPorcentaje
          : 2.0,
      factorAmplificacion:
        typeof raw.factorAmplificacion === 'number' && Number.isFinite(raw.factorAmplificacion)
          ? raw.factorAmplificacion
          : 1.35,
      ausentismoPorcentaje:
        typeof raw.ausentismoPorcentaje === 'number' && Number.isFinite(raw.ausentismoPorcentaje)
          ? raw.ausentismoPorcentaje
          : 3.0,
      rotacionEsperada:
        typeof raw.rotacionEsperada === 'number' && Number.isFinite(raw.rotacionEsperada)
          ? raw.rotacionEsperada
          : 12,
      anioPresupuesto:
        typeof raw.anioPresupuesto === 'number' && Number.isFinite(raw.anioPresupuesto)
          ? raw.anioPresupuesto
          : new Date().getFullYear(),
      mesInicio: clampMes(raw.mesInicio, mesActualDefault),
      mesSalidas: clampMes(raw.mesSalidas, ((mesActualDefault - 1 + 3) % 12) + 1),
      frecuenciaReajuste:
        raw.frecuenciaReajuste === 'semestral' || raw.frecuenciaReajuste === 'trimestral'
          ? raw.frecuenciaReajuste
          : 'anual',
      mesReajusteIPC: clampMes(raw.mesReajusteIPC, 7),
      mesMerito: clampMes(raw.mesMerito, 7),
    }
    const movimientos: MovimientoInput[] = Array.isArray(body?.movimientos) ? body.movimientos : []
    const provisionesSeleccionadas: string[] = Array.isArray(body?.provisionesSeleccionadas)
      ? body.provisionesSeleccionadas
      : []
    const rawMeses = (body?.mesesSalidaPorPersona ?? {}) as Record<string, unknown>
    const mesesSalidaPorPersona: Record<string, number> = {}
    for (const [id, v] of Object.entries(rawMeses)) {
      mesesSalidaPorPersona[id] = clampMes(v, supuestos.mesSalidas)
    }
    const prescindiblesIds: string[] = Array.isArray(body?.prescindiblesIds)
      ? body.prescindiblesIds
      : []

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    let departmentIds: string[] | undefined
    if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        status: 'ACTIVE',
        ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
      },
      select: { id: true, acotadoGroup: true },
    })

    const acotadoGroups = PositionAdapter.getAllAcotadoGroupsOrdered().map(g => g.value)
    const salaryCache = new Map<string, number>()
    for (const group of acotadoGroups) {
      const sr = await SalaryConfigService.getSalaryForAccount(userContext.accountId, group)
      salaryCache.set(group, sr.monthlySalary)
    }
    const defaultSalary = (
      await SalaryConfigService.getSalaryForAccount(userContext.accountId)
    ).monthlySalary

    let masaBase = 0
    const totalHeadcount = employees.length
    for (const e of employees) {
      masaBase += salaryCache.get(e.acotadoGroup ?? '') ?? defaultSalary
    }
    const costoBase = masaBase * supuestos.factorAmplificacion

    const impactoMensualPorMesInicio = new Array(13).fill(0) as number[]
    for (const m of movimientos) {
      const salary = salaryCache.get(m.acotadoGroup) ?? defaultSalary
      const mesInicio = Math.max(1, Math.min(12, m.mesInicio ?? 1))
      impactoMensualPorMesInicio[mesInicio] +=
        m.delta * salary * supuestos.factorAmplificacion
    }

    const seleccionadosSet = new Set(provisionesSeleccionadas)

    // Convierte un mes absoluto (1-12) a su posicion relativa (1-12) dentro
    // del ciclo que arranca en supuestos.mesInicio.
    const aPosicion = (mesAbsoluto: number): number =>
      ((mesAbsoluto - supuestos.mesInicio + 12) % 12) + 1

    // HireDates de prescindibles NO seleccionados — necesarias para calcular
    // en qué mes cae su aniversario laboral (alzaEvitable).
    // prescindiblesIds viene del frontend (dato opaco producido por /provisiones).
    const noSeleccionadosIds = prescindiblesIds.filter(id => !seleccionadosSet.has(id))
    const employeesProv =
      noSeleccionadosIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: noSeleccionadosIds }, accountId: userContext.accountId },
            select: { id: true, hireDate: true, acotadoGroup: true },
          })
        : []
    const hireDateMap = new Map(
      employeesProv.filter(e => e.hireDate != null).map(e => [e.id, e.hireDate as Date]),
    )
    const acotadoGroupMap = new Map(employeesProv.map(e => [e.id, e.acotadoGroup]))
    const prescindibleSalaryMap = new Map(
      employeesProv.map(e => [e.id, salaryCache.get(e.acotadoGroup ?? '') ?? defaultSalary]),
    )


    // Query directa a Employee: los seleccionados en /provisiones pueden
    // incluir salidas planificadas (no necesariamente en ranking de prescindibles).
    // La fuente canonica para calcular finiquitos es Employee, no el ranking.
    const empleadosProvisiones =
      provisionesSeleccionadas.length > 0
        ? await prisma.employee.findMany({
            where: {
              id: { in: provisionesSeleccionadas },
              accountId: userContext.accountId,
              status: 'ACTIVE',
              ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
            },
            select: {
              id: true,
              fullName: true,
              hireDate: true,
              acotadoGroup: true,
            },
          })
        : []

    // Tenure AL INICIO del ciclo del presupuesto (no "hoy"). Asi el finiquito
    // refleja el estado del empleado cuando efectivamente arranca el periodo.
    const cicloInicio = new Date(supuestos.anioPresupuesto, supuestos.mesInicio - 1, 1)
    const tenureMesesAlCiclo = (hireDate: Date): number => {
      const meses =
        (cicloInicio.getFullYear() - hireDate.getFullYear()) * 12 +
        (cicloInicio.getMonth() - hireDate.getMonth())
      return Math.max(0, meses)
    }

    // Acumulados por posicion del ciclo (cada persona cae en su propio mes).
    const finiquitosPorPos = new Array(13).fill(0) as number[]
    const ahorroMensualInicialPorPos = new Array(13).fill(0) as number[]
    const finiquitosDetallePorPos: FiniquitoEntry[][] = Array.from({ length: 13 }, () => [])
    // FTE delta por posicion: salidas (-1 por persona) y movimientos (delta acumulado).
    const salidasFtePorPos = new Array(13).fill(0) as number[]
    let finiquitosSeleccionados = 0
    let ahorroMensualSeleccionados = 0

    for (const e of empleadosProvisiones) {
      const salary = salaryCache.get(e.acotadoGroup ?? '') ?? defaultSalary
      const tenureMonths = tenureMesesAlCiclo(e.hireDate)
      const finiquito = calculateFiniquitoConTopeCustomUF(
        salary,
        tenureMonths,
        UF_VALUE_CLP,
      )
      const ahorroMensual = salary * supuestos.factorAmplificacion
      const mesAbs = mesesSalidaPorPersona[e.id] ?? supuestos.mesSalidas
      const pos = aPosicion(mesAbs)
      finiquitosPorPos[pos] += finiquito
      ahorroMensualInicialPorPos[pos] += ahorroMensual
      finiquitosDetallePorPos[pos].push({ nombre: e.fullName, monto: Math.round(finiquito) })
      salidasFtePorPos[pos] -= 1
      finiquitosSeleccionados += finiquito
      ahorroMensualSeleccionados += ahorroMensual

    }

    // Aniversarios evitables: prescindibles NO seleccionados cuyo próximo
    // aniversario laboral cae dentro del ciclo.
    const mesActualCal = new Date().getMonth() + 1
    const aniversariosEvitablesPorPos = new Array(13).fill(0) as number[]
    for (const empId of noSeleccionadosIds) {
      const hireDate = hireDateMap.get(empId)
      if (!hireDate) continue
      const tenureMonths = calculateTenureMonths(hireDate)
      const mesesAlSalto = calculateMonthsUntilNextYear(tenureMonths)
      if (mesesAlSalto === null) continue
      const mesAniversarioAbs = ((mesActualCal - 1 + mesesAlSalto) % 12) + 1
      const pos = aPosicion(mesAniversarioAbs)
      if (pos < 1 || pos > 12) continue
      const salary = prescindibleSalaryMap.get(empId) ?? defaultSalary
      const finiquitoAntes = calculateFiniquitoConTopeCustomUF(salary, tenureMonths, UF_VALUE_CLP)
      const finiquitoDespues = calculateFiniquitoConTopeCustomUF(salary, tenureMonths + mesesAlSalto, UF_VALUE_CLP)
      const alza = finiquitoDespues - finiquitoAntes
      if (alza > 0) {
        aniversariosEvitablesPorPos[pos] += alza * supuestos.factorAmplificacion
      }
    }

    const posReajusteIPC = aPosicion(supuestos.mesReajusteIPC)
    // Intervalo en meses entre eventos de reajuste.
    const intervaloReajuste =
      supuestos.frecuenciaReajuste === 'semestral'
        ? 6
        : supuestos.frecuenciaReajuste === 'trimestral'
          ? 3
          : 12
    // Cuantos eventos de reajuste han ocurrido hasta el mes relativo mRel (inclusive).
    const reajustesAplicados = (mRel: number): number => {
      if (mRel < posReajusteIPC) return 0
      return Math.floor((mRel - posReajusteIPC) / intervaloReajuste) + 1
    }

    // FTE: movimientos cambian headcount en su mesInicio; salidas en su pos.
    const deltaFtePorPos = new Array(13).fill(0) as number[]
    for (const mov of movimientos) {
      const mesI = Math.max(1, Math.min(12, mov.mesInicio ?? 1))
      deltaFtePorPos[mesI] += mov.delta
    }

    const meses: MesPresupuesto[] = []
    let deltaAcumulado = 0
    let ahorroMensualAcumulado = 0
    let fteAcumulado = totalHeadcount
    for (let m = 1; m <= 12; m += 1) {
      const mesAbsoluto = ((supuestos.mesInicio - 1 + (m - 1)) % 12) + 1
      deltaAcumulado += impactoMensualPorMesInicio[m]
      fteAcumulado += deltaFtePorPos[m] + salidasFtePorPos[m]
      // El ahorro empieza el mes SIGUIENTE a la salida — sumamos en m+1.
      if (m > 1) ahorroMensualAcumulado += ahorroMensualInicialPorPos[m - 1]
      const reajusteIPC =
        costoBase * (supuestos.ipcPorcentaje / 100) * reajustesAplicados(m)
      // Merito: evento anual independiente, en su propio mes.
      const posMerito = aPosicion(supuestos.mesMerito)
      const meritoMes =
        m >= posMerito ? costoBase * (supuestos.meritoPorcentaje / 100) : 0
      const finiquitosMes = finiquitosPorPos[m]
      const ahorroPostSalida = ahorroMensualAcumulado
      const costoAniversariosEvitables = Math.round(aniversariosEvitablesPorPos[m])
      const ausentismoMes = costoBase * (supuestos.ausentismoPorcentaje / 100)
      const costoEmpresaMes =
        costoBase + deltaAcumulado + reajusteIPC + meritoMes + ausentismoMes + finiquitosMes - ahorroPostSalida
      // Linea de inercia: masa + reajustes (IPC + merito) + ausentismo, sin movimientos,
      // sin finiquitos, sin ahorro de salidas.
      const sinAccionesMes = costoBase + reajusteIPC + meritoMes + ausentismoMes

      const nombreMes = MESES_NOMBRE[mesAbsoluto - 1]
      let color: MesPresupuesto['color'] = 'neutral'
      let tooltip = `Costo empresa ${nombreMes}: ${formatMonto(costoEmpresaMes)}`
      if (finiquitosMes > 0) {
        color = 'critical'
        tooltip = `Pago de finiquitos en ${nombreMes}: ${formatMonto(finiquitosMes)} por salidas planificadas`
      } else if (costoAniversariosEvitables > 0) {
        color = 'warning'
        tooltip = `Personas de la lista roja alcanzan aniversario en ${nombreMes}. Alza proyectada: ${formatMonto(
          costoAniversariosEvitables,
        )} evitable si se actua antes`
      } else if (ahorroPostSalida > 0) {
        color = 'success'
        tooltip = `Ahorro activo en ${nombreMes}: ${formatMonto(ahorroPostSalida)} menos en planilla tras salidas`
      }

      meses.push({
        mes: m,
        mesNombre: nombreMes,
        costoEmpresa: Math.round(costoEmpresaMes),
        costoBaseMes: Math.round(costoBase + deltaAcumulado - ahorroPostSalida),
        reajusteIPCMes: Math.round(reajusteIPC),
        meritoMes: Math.round(meritoMes),
        finiquitosMes: Math.round(finiquitosMes),
        ahorroPostSalida: Math.round(ahorroPostSalida),
        costoAniversariosEvitables,
        finiquitosDetalle: finiquitosDetallePorPos[m],
        sinAccionesMes: Math.round(sinAccionesMes),
        fteMes: fteAcumulado,
        color,
        tooltip,
      })
    }

    const costoTotalAnual = meses.reduce((sum, x) => sum + x.costoEmpresa, 0)
    const costoBaseAnual = costoBase * 12
    const variacionVsBase =
      costoBaseAnual > 0
        ? Math.round(((costoTotalAnual - costoBaseAnual) / costoBaseAnual) * 100)
        : 0
    const ahorroNeto = meses.reduce((sum, x) => sum + x.ahorroPostSalida, 0) - finiquitosSeleccionados

    console.log('[resultado] resumen:', {
      totalFiniquitos: Math.round(finiquitosSeleccionados),
      ahorroMensual: Math.round(ahorroMensualSeleccionados),
      paybackMeses:
        ahorroMensualSeleccionados > 0
          ? Math.round(finiquitosSeleccionados / ahorroMensualSeleccionados)
          : 0,
      variacionPct: variacionVsBase,
    })

    const paybackMeses =
      ahorroMensualSeleccionados > 0
        ? Math.round(finiquitosSeleccionados / ahorroMensualSeleccionados)
        : 0

    const narrativaEjecutiva = construirNarrativa({
      totalHeadcount,
      costoTotalAnual,
      variacionVsBase,
      ipc: supuestos.ipcPorcentaje,
      ahorroNeto,
      finiquitos: finiquitosSeleccionados,
      personasSalida: provisionesSeleccionadas.length,
      aniversariosEvitables: aniversariosEvitablesPorPos.reduce((s: number, v: number) => s + v, 0),
      paybackMeses,
    })

    return NextResponse.json({
      success: true,
      data: {
        meses,
        narrativaEjecutiva,
        costoBaseOriginal: Math.round(costoBase),
        fteInicial: totalHeadcount,
        resumenAnual: {
          costoTotalAnual: Math.round(costoTotalAnual),
          costoBaseAnual: Math.round(costoBaseAnual),
          variacionVsBase,
          finiquitos: Math.round(finiquitosSeleccionados),
          ahorroNeto: Math.round(ahorroNeto),
          paybackMeses:
            ahorroMensualSeleccionados > 0
              ? Math.round(finiquitosSeleccionados / ahorroMensualSeleccionados)
              : 0,
        },
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/resultado] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

function construirNarrativa(ctx: {
  totalHeadcount: number
  costoTotalAnual: number
  variacionVsBase: number
  ipc: number
  ahorroNeto: number
  finiquitos: number
  personasSalida: number
  aniversariosEvitables: number
  paybackMeses: number
}): string {
  const variacion = `${ctx.variacionVsBase >= 0 ? '+' : ''}${ctx.variacionVsBase}%`

  const posicionVsIPC =
    ctx.variacionVsBase < ctx.ipc
      ? 'por debajo de la inflacion'
      : ctx.variacionVsBase === ctx.ipc
        ? 'en linea con la inflacion'
        : 'sobre la inflacion'

  const lineas: string[] = []

  lineas.push(
    `${ctx.totalHeadcount} personas. ${formatMonto(ctx.costoTotalAnual)} proyectados para el ciclo. Eso es un ${variacion} sobre la base actual — ${posicionVsIPC}.`,
  )

  if (ctx.personasSalida > 0 && ctx.ahorroNeto > 0) {
    lineas.push(
      `Las ${ctx.personasSalida} salidas planificadas cuestan ${formatMonto(ctx.finiquitos)} en finiquitos. Pero generan ${formatMonto(ctx.ahorroNeto)} de ahorro neto. Se pagan solas en ${ctx.paybackMeses} ${ctx.paybackMeses === 1 ? 'mes' : 'meses'}.`,
    )
  } else if (ctx.personasSalida > 0) {
    lineas.push(
      `Las ${ctx.personasSalida} salidas planificadas cuestan ${formatMonto(ctx.finiquitos)} en finiquitos. El ahorro neto aun no compensa — revisa el timing o el alcance.`,
    )
  } else {
    lineas.push(
      'Sin salidas planificadas. La masa crece por inercia — reajustes y merito empujan el costo sin que nadie lo decida.',
    )
  }

  if (ctx.aniversariosEvitables > 1_000_000) {
    lineas.push(
      `Hay ${formatMonto(ctx.aniversariosEvitables)} en alzas automaticas que puedes evitar si actuas antes del proximo aniversario. Cada mes que pasa reduce tu margen.`,
    )
  }

  return lineas.join('\n\n')
}
