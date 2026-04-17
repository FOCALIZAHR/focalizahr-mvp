'use client'

// Paso 4 del Wizard: dos secciones como cards independientes con Tesla line.
// Cada seccion = card glassmorphism + header + narrativa ejecutiva + fila compacta.
// Score es chip clickeable → abre ScoreBreakdownModal con componentes + multiplicadores.
// Swap en la columna de acciones, compacto.

import { useState } from 'react'
import {
  Shield,
  AlertTriangle,
  Sparkles,
  Target,
  ArrowLeftRight,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TooltipContext } from '@/components/ui/TooltipContext'
import AniversarioTimingAlert from './AniversarioTimingAlert'
import ScoreBreakdownModal from './ScoreBreakdownModal'
import { formatCLP, formatAntiguedad, formatNombre } from './format'
import type { ProvisionesResponse, ProvisionEntry } from './types'

const MESES_NOMBRE = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

interface ProvisionesTableProps {
  data: ProvisionesResponse
  seleccionadas: string[]
  mesesSalida: Record<string, number>
  mesSalidaDefault: number
  onToggle: (employeeId: string) => void
  onMesSalidaChange: (employeeId: string, mes: number) => void
  onSwap?: (movimientoKey: string, fromId: string, toId: string) => void
  onContinue: () => void
  onBack: () => void
}

interface SeccionProps {
  title: string
  counter: number
  icon: React.ReactNode
  teslaColor: string
  narrativa: string
  items: ProvisionEntry[]
  seleccionadas: Set<string>
  mesesSalida: Record<string, number>
  mesSalidaDefault: number
  onToggle: (id: string) => void
  onMesSalidaChange: (employeeId: string, mes: number) => void
  onSwap?: (movimientoKey: string, fromId: string, toId: string) => void
  onScoreClick: (entry: ProvisionEntry) => void
  empty?: string
  permitirSwap?: boolean
}

const MESES_SELECT = [
  { v: 1, l: 'Ene' },
  { v: 2, l: 'Feb' },
  { v: 3, l: 'Mar' },
  { v: 4, l: 'Abr' },
  { v: 5, l: 'May' },
  { v: 6, l: 'Jun' },
  { v: 7, l: 'Jul' },
  { v: 8, l: 'Ago' },
  { v: 9, l: 'Sep' },
  { v: 10, l: 'Oct' },
  { v: 11, l: 'Nov' },
  { v: 12, l: 'Dic' },
]

function SeccionCard({
  title,
  counter,
  icon,
  teslaColor,
  narrativa,
  items,
  seleccionadas,
  mesesSalida,
  mesSalidaDefault,
  onToggle,
  onMesSalidaChange,
  onSwap,
  onScoreClick,
  empty,
  permitirSwap = false,
}: SeccionProps) {
  const [swapOpenId, setSwapOpenId] = useState<string | null>(null)

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
        }}
      />

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-slate-200 flex-1">{title}</h3>
        <span className="text-xs font-light text-slate-400 tabular-nums">
          {counter} {counter === 1 ? 'persona' : 'personas'}
        </span>
      </div>

      {/* Narrativa ejecutiva */}
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-400 font-light leading-relaxed">
          {narrativa}
        </p>
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div className="px-5 py-6 text-center border-t border-slate-800/60">
          <p className="text-xs text-slate-500 font-light">{empty}</p>
        </div>
      ) : (
        <>
          {/* Header compacto — solo nombra la columna del mes (resto es self-evident) */}
          <div className="px-5 pt-2.5 pb-2 border-t border-slate-800/60 flex items-center justify-end gap-1">
            <TooltipContext
              variant="projection"
              position="top"
              usePortal
              title="Mes de salida"
              explanation="Por defecto todas las salidas usan el mes definido en Supuestos. Puedes cambiar el mes de cada persona individualmente para mover el pago de finiquito y el inicio del ahorro."
              details={[]}
            >
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium cursor-help">
                Mes de salida
                <Info className="w-3 h-3 text-slate-500" />
              </span>
            </TooltipContext>
          </div>
        <ul className="divide-y divide-slate-800/60">
          {items.map(p => {
            const checked = seleccionadas.has(p.employeeId)
            const timingColor =
              p.timingSeverity === 'critical' ? 'text-red-400' : 'text-amber-400'
            return (
              <li key={p.employeeId} className="px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                {/* Fila 1 — identidad y metricas */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggle(p.employeeId)}
                    aria-checked={checked}
                    role="checkbox"
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer',
                      checked
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'bg-transparent border-slate-600 hover:border-slate-400',
                    )}
                  >
                    {checked && <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />}
                  </button>

                  {/* Identidad */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 font-light truncate">
                      {formatNombre(p.employeeName)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-light truncate">
                      {p.position} · {p.departmentName}
                    </div>
                  </div>

                  {/* Score chip clickeable — preview premium en hover, detalle en click */}
                  <TooltipContext
                    variant={p.scoreAltoWarning ? 'risk' : 'projection'}
                    position="top"
                    usePortal
                    title={`Score ${p.retentionScore}`}
                    explanation={
                      p.retentionScore >= 120
                        ? 'Intocable — el sistema lo protege.'
                        : p.retentionScore >= 80
                          ? 'Valioso — revisa antes de mover.'
                          : p.retentionScore >= 40
                            ? 'Neutro — decision discrecional.'
                            : 'Prescindible — candidato natural a salida.'
                    }
                    details={[
                      `Cumplimiento metas: ${p.scoreBreakdown.goalsNorm}/100`,
                      `Dominio del cargo: ${p.scoreBreakdown.roleFitNorm}/100`,
                      `Adaptabilidad: ${p.scoreBreakdown.adaptNorm}/100`,
                      ...(p.scoreBreakdown.multiplierCritical > 1
                        ? [`Amplificador posicion critica ×${p.scoreBreakdown.multiplierCritical}`]
                        : []),
                      ...(p.scoreBreakdown.multiplierSuccessor > 1
                        ? [`Amplificador sucesor natural ×${p.scoreBreakdown.multiplierSuccessor}`]
                        : []),
                      ...(p.scoreBreakdown.multiplierExposure > 1.05
                        ? [`Amplificador exposicion IA ×${p.scoreBreakdown.multiplierExposure}`]
                        : []),
                    ]}
                    actionable="Ver el desglose completo"
                    onActionableClick={() => onScoreClick(p)}
                  >
                    <button
                      type="button"
                      onClick={() => onScoreClick(p)}
                      className={cn(
                        'flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors',
                        p.scoreAltoWarning
                          ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40',
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          p.scoreAltoWarning ? 'text-amber-400' : 'text-slate-200',
                        )}
                      >
                        {p.retentionScore}
                      </span>
                      <Info className="w-3 h-3 text-slate-500" />
                    </button>
                  </TooltipContext>

                  {/* Antiguedad */}
                  <span className="hidden sm:inline-block flex-shrink-0 w-14 text-right text-xs text-slate-400 font-light tabular-nums">
                    {formatAntiguedad(p.tenureMonths)}
                  </span>

                  {/* Finiquito — tooltip premium con salto real de antiguedad */}
                  <TooltipContext
                    variant="projection"
                    position="top"
                    usePortal
                    title="Finiquito estimado"
                    explanation="Costo legal de salida segun ley chilena (Art. 163): 1 mes de sueldo por año cumplido, tope 11 años, base imponible topada en 90 UF."
                    details={[
                      `Hoy (${formatAntiguedad(p.tenureMonths)}): ${formatCLP(p.finiquitoHoy)}`,
                      `En 3 meses: ${formatCLP(p.finiquitoQ2)}`,
                      `En 6 meses: ${formatCLP(p.finiquitoQ4)}`,
                      ...(p.alzaSiEspera > 0
                        ? [
                            `Proximo salto en ${MESES_NOMBRE[p.mesAniversario - 1]}: +${formatCLP(p.alzaSiEspera)} (1 mes adicional de sueldo por año cumplido)`,
                          ]
                        : ['Sin saltos de antiguedad en el horizonte']),
                    ]}
                    actionable={
                      p.alzaSiEspera >= 2_000_000
                        ? `En ${MESES_NOMBRE[p.mesAniversario - 1]} el finiquito sube de ${formatCLP(p.finiquitoHoy)} a ${formatCLP(p.finiquitoHoy + p.alzaSiEspera)}. Decidir antes evita ese costo.`
                        : p.alzaSiEspera >= 500_000
                          ? 'Hay un salto de antiguedad en el horizonte corto — considera el timing.'
                          : 'Monto estable — sin presion de timing.'
                    }
                  >
                    <span className="flex-shrink-0 w-16 text-right text-sm text-slate-200 font-light tabular-nums cursor-help">
                      {formatCLP(p.finiquitoHoy)}
                    </span>
                  </TooltipContext>

                  {/* Mes de salida — editable solo si la persona esta seleccionada */}
                  {(() => {
                    const mesActual = mesesSalida[p.employeeId] ?? mesSalidaDefault
                    const modificado = checked && mesActual !== mesSalidaDefault
                    return (
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {modificado && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                            title="Mes modificado respecto al default"
                          />
                        )}
                        <select
                          value={mesActual}
                          onChange={e =>
                            onMesSalidaChange(p.employeeId, Number.parseInt(e.target.value, 10))
                          }
                          disabled={!checked}
                          title={
                            checked
                              ? 'Mes de salida para esta persona'
                              : 'Selecciona la persona para editar el mes de salida'
                          }
                          className={cn(
                            'w-16 px-1.5 py-1 text-[11px] text-right bg-slate-900/40 border rounded font-light tabular-nums focus:outline-none transition-colors',
                            !checked
                              ? 'border-slate-800/40 text-slate-600 cursor-not-allowed opacity-60'
                              : modificado
                                ? 'border-cyan-500/40 text-cyan-300 hover:border-cyan-500/60 cursor-pointer'
                                : 'border-slate-700/50 text-slate-300 hover:border-cyan-500/40 cursor-pointer',
                          )}
                        >
                          {MESES_SELECT.map(m => (
                            <option key={m.v} value={m.v} className="bg-slate-900">
                              {m.l}
                            </option>
                          ))}
                        </select>
                        {modificado && (
                          <button
                            type="button"
                            onClick={() => onMesSalidaChange(p.employeeId, mesSalidaDefault)}
                            title="Restaurar mes por defecto"
                            aria-label="Restaurar mes por defecto"
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-slate-800/40 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })()}

                  {/* Swap icon solo si aplica */}
                  {permitirSwap && p.movimientoKey && p.alternativas.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSwapOpenId(swapOpenId === p.employeeId ? null : p.employeeId)
                      }
                      className={cn(
                        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                        swapOpenId === p.employeeId
                          ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400'
                          : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800/40',
                      )}
                      title="Cambiar por otro del mismo cargo"
                      aria-label="Cambiar por otro del mismo cargo"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Fila 2 — timing + cargo origen (compacto, no rompe vertical) */}
                <div className="flex items-center gap-3 mt-1.5 pl-7">
                  {p.timingAlert && (
                    <span
                      className={cn(
                        'text-[11px] italic font-light flex-1 min-w-0 truncate',
                        timingColor,
                      )}
                    >
                      {p.timingAlert}
                    </span>
                  )}
                  {p.cargoOrigen && (
                    <button
                      type="button"
                      onClick={() => onToggle(p.employeeId)}
                      title="Quitar este movimiento"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-600/40 text-[10px] text-slate-400 font-light flex-shrink-0 hover:border-slate-500/60 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-500">×</span>
                      Quitar movimiento
                    </button>
                  )}
                </div>

                {/* Fila 3 — swap dropdown expandido (solo si abierto) */}
                {permitirSwap &&
                  swapOpenId === p.employeeId &&
                  p.movimientoKey &&
                  p.alternativas.length > 0 && (
                    <div className="pl-7 mt-2">
                      <select
                        autoFocus
                        onChange={e => {
                          const toId = e.target.value
                          if (toId && onSwap && p.movimientoKey) {
                            onSwap(p.movimientoKey, p.employeeId, toId)
                            setSwapOpenId(null)
                          }
                        }}
                        onBlur={() => setSwapOpenId(null)}
                        defaultValue=""
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-cyan-500/30 text-slate-200 font-light focus:outline-none"
                      >
                        <option value="" disabled>
                          Elige otra persona del mismo cargo...
                        </option>
                        {p.alternativas.map(alt => (
                          <option key={alt.employeeId} value={alt.employeeId}>
                            {formatNombre(alt.employeeName)} · score {alt.retentionScore}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </li>
            )
          })}
        </ul>
        </>
      )}
    </div>
  )
}

export default function ProvisionesTable({
  data,
  seleccionadas,
  mesesSalida,
  mesSalidaDefault,
  onToggle,
  onMesSalidaChange,
  onSwap,
  onContinue,
  onBack,
}: ProvisionesTableProps) {
  const [scoreEntry, setScoreEntry] = useState<ProvisionEntry | null>(null)

  const seleccionadasSet = new Set(seleccionadas)
  const todas = [...data.listaRoja, ...data.salidasPlanificadas]

  const resumenSeleccionado = todas
    .filter(r => seleccionadasSet.has(r.employeeId))
    .reduce(
      (acc, r) => ({
        finiquitos: acc.finiquitos + r.finiquitoHoy,
        salarios: acc.salarios + r.salary,
        count: acc.count + 1,
      }),
      { finiquitos: 0, salarios: 0, count: 0 },
    )

  const ahorroMensualSel = Math.round(
    resumenSeleccionado.salarios * data.contexto.factorAmplificacion,
  )
  const paybackSel =
    ahorroMensualSel > 0 ? Math.round(resumenSeleccionado.finiquitos / ahorroMensualSel) : 0

  const sinListaRoja = data.listaRoja.length === 0
  const sinPlanificadas = data.salidasPlanificadas.length === 0

  const avgPct = Math.round(data.contexto.avgExposicionIA * 100)
  const narrativaSistema =
    data.contexto.fallbackRelativo && data.contexto.thresholdsEscalados
      ? `Densidad de datos IA baja (avg ${avgPct}%) y ninguna persona cruzo el umbral ajustado. Estas son las personas con menor score relativo del ranking. Revisa con criterio antes de incluirlas como salida.`
      : data.contexto.fallbackRelativo
        ? `Ninguna persona cruzo el umbral absoluto de prescindible — los scores estan comprimidos en tu organizacion. Estas son las personas con menor score relativo del ranking (banda baja). Son la mejor señal disponible, no una salida automatica.`
        : data.contexto.thresholdsEscalados
          ? `Densidad de datos IA baja en tu organizacion (avg ${avgPct}%). Umbrales ajustados para capturar la cola baja. O sus metas no se cumplieron, O su dominio del cargo esta por debajo del estandar, O ambas.`
          : 'Dos fuentes coinciden — estas personas tienen el menor score de retencion del sistema. O sus metas no se cumplieron. O su dominio del cargo esta por debajo del estandar. O ambos. Esta es la lista que el motor sugiere sin intervencion humana.'

  const narrativaPlanificadas =
    'El sistema eligio a estas personas porque tienen el menor score de retencion en su cargo — O porque sus metas no se cumplieron, O porque su dominio del cargo esta por debajo del estandar. Tu las confirmaste en el paso 2 al definir los movimientos negativos. Aqui esta el costo real — click en el score para ver el desglose.'

  return (
    <div className="space-y-6">
      {/* NARRATIVA PRINCIPAL */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Paso 4 · Salidas planificadas
        </span>
        <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight">
          Dos fuentes coinciden.{' '}
          <span className="fhr-title-gradient">Aqui estan.</span>
        </h2>
        {sinListaRoja && sinPlanificadas && (
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            No hay salidas sugeridas ni planificadas en este ciclo. Puedes continuar
            sin provisiones.
          </p>
        )}
      </div>

      {/* TIMING ALERT + NOTICE EXCLUIDOS */}
      <AniversarioTimingAlert
        aniversarios={data.prescindiblesConAniversario}
        mesActual={data.contexto.mesActual}
      />

      {data.contexto.excluidosSinSalario > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/40">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 font-light leading-relaxed">
            {data.contexto.excluidosSinSalario} persona
            {data.contexto.excluidosSinSalario === 1 ? '' : 's'} con datos salariales
            incompletos no se considera{data.contexto.excluidosSinSalario === 1 ? '' : 'n'}.
          </p>
        </div>
      )}

      {/* SECCION 1 — Sistema */}
      <SeccionCard
        title="Salidas sugeridas por el sistema"
        counter={data.listaRoja.length}
        icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        teslaColor="rgba(34,211,238,0.5)"
        narrativa={narrativaSistema}
        items={data.listaRoja}
        seleccionadas={seleccionadasSet}
        mesesSalida={mesesSalida}
        mesSalidaDefault={mesSalidaDefault}
        onToggle={onToggle}
        onMesSalidaChange={onMesSalidaChange}
        onScoreClick={setScoreEntry}
        empty="Sin zona prescindible en este ciclo."
      />

      {/* SECCION 2 — Planificadas por el CEO */}
      {data.salidasPlanificadas.length > 0 && (
        <SeccionCard
          title="Salidas planificadas por ti"
          counter={data.salidasPlanificadas.length}
          icon={<Target className="w-4 h-4 text-purple-400" />}
          teslaColor="rgba(167,139,250,0.5)"
          narrativa={narrativaPlanificadas}
          items={data.salidasPlanificadas}
          seleccionadas={seleccionadasSet}
          mesesSalida={mesesSalida}
          mesSalidaDefault={mesSalidaDefault}
          onToggle={onToggle}
          onMesSalidaChange={onMesSalidaChange}
          onSwap={onSwap}
          onScoreClick={setScoreEntry}
          permitirSwap
        />
      )}

      {/* RESUMEN — costo y payback */}
      {resumenSeleccionado.count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Salidas seleccionadas
            </p>
            <p className="text-xl font-extralight text-white mt-1 tabular-nums">
              {resumenSeleccionado.count}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Finiquitos
            </p>
            <p className="text-xl font-extralight text-white mt-1 tabular-nums">
              {formatCLP(resumenSeleccionado.finiquitos)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Ahorro mensual
            </p>
            <p className="text-xl font-extralight text-emerald-400 mt-1 tabular-nums">
              {formatCLP(ahorroMensualSel)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Payback
            </p>
            <p className="text-xl font-extralight text-white mt-1 tabular-nums">
              {paybackSel}
              <span className="text-xs text-slate-400 font-light ml-1">meses</span>
            </p>
          </div>
        </div>
      )}

      {/* GUARDARRAIL — lista verde */}
      {data.listaVerde.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50">
          <div
            className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)',
            }}
          />
          <div className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 flex-shrink-0">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">
                Estas personas no aparecen como opcion
              </p>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Dominan su cargo, entregan resultados y las dos fuentes de datos lo
                confirman. Moverlas es el tipo de error que destruye el motor del
                negocio en silencio.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                {data.listaVerde.slice(0, 6).map(p => (
                  <div
                    key={p.employeeId}
                    className="flex items-center gap-2 text-[11px] text-slate-400 font-light"
                  >
                    <span className="w-1 h-1 rounded-full bg-cyan-400/60" />
                    <span className="truncate">
                      {formatNombre(p.employeeName)} · {p.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCION */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white font-light transition-colors"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium transition-colors"
        >
          Ver presupuesto proyectado
        </button>
      </div>

      {/* Modal de desglose del score */}
      <ScoreBreakdownModal entry={scoreEntry} onClose={() => setScoreEntry(null)} />
    </div>
  )
}
