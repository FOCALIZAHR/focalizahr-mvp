'use client'

// Paso 3 del Wizard: supuestos macro del presupuesto.
// Patron G: narrativa → 5 sliders → proyeccion aproximada → accion.
// Los numeros finales se calculan en backend en el Paso 5.

import { useMemo } from 'react'
import { formatCLP } from './format'
import type { SupuestosMacro, FrecuenciaReajuste } from './types'

interface SupuestosMacroFormProps {
  supuestos: SupuestosMacro
  setSupuestos: (next: SupuestosMacro) => void
  costoBaseMensual: number
  rotacionHistorica: number
  onContinue: () => void
  onBack: () => void
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

interface MesSelectorProps {
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
}

function MesSelector({ label, hint, value, onChange }: MesSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          {label}
        </label>
        <select
          value={value}
          onChange={e => onChange(Number.parseInt(e.target.value, 10))}
          className="px-2 py-1 text-sm font-light text-white bg-slate-900/40 border border-slate-700/50 rounded focus:outline-none focus:border-cyan-500/40"
        >
          {MESES.map(m => (
            <option key={m.value} value={m.value} className="bg-slate-900">
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
        {hint}
      </p>
    </div>
  )
}

interface SliderFieldProps {
  label: string
  hint: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: number) => void
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix = '%',
  onChange,
}: SliderFieldProps) {
  const handleNumber = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(max, Math.max(min, parsed))
    onChange(clamped)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => handleNumber(e.target.value)}
            className="w-16 px-2 py-1 text-right text-sm font-light text-white bg-slate-900/40 border border-slate-700/50 rounded focus:outline-none focus:border-cyan-500/40 tabular-nums"
          />
          <span className="text-xs text-slate-500 font-light">{suffix}</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number.parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-400"
        style={{
          background: `linear-gradient(to right, #22D3EE 0%, #22D3EE ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%, #334155 100%)`,
        }}
      />

      <p className="text-[11px] text-slate-500 font-light leading-relaxed">
        {hint}
      </p>
    </div>
  )
}

export default function SupuestosMacroForm({
  supuestos,
  setSupuestos,
  costoBaseMensual,
  rotacionHistorica,
  onContinue,
  onBack,
}: SupuestosMacroFormProps) {
  const proyeccion = useMemo(() => {
    const incrementoAnual =
      (supuestos.ipcPorcentaje + supuestos.meritoPorcentaje) / 100
    const costoAnualAprox =
      costoBaseMensual * 12 * (1 + incrementoAnual / 2)
    const variacionPct = Math.round(incrementoAnual * 100)
    return { costoAnualAprox, variacionPct }
  }, [supuestos, costoBaseMensual])

  const update = (patch: Partial<SupuestosMacro>) =>
    setSupuestos({ ...supuestos, ...patch })

  return (
    <div className="space-y-6">
      {/* NARRATIVA */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Paso 3 · Supuestos
        </span>
        <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight">
          Los parametros que{' '}
          <span className="fhr-title-gradient">mueven la aguja.</span>
        </h2>
        <p className="text-sm text-slate-400 font-light leading-relaxed">
          Estos cinco numeros determinan como crece la masa salarial durante el
          ciclo. El resultado final se calcula con precision en el paso 5 — aqui
          solo defines el marco.
        </p>
      </div>

      {/* EVIDENCIA — 5 sliders */}
      <div className="space-y-5 rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <SliderField
          label="IPC proyectado"
          hint="Inflacion anual proyectada que se aplica al reajuste salarial."
          value={supuestos.ipcPorcentaje}
          min={0}
          max={10}
          step={0.1}
          onChange={v => update({ ipcPorcentaje: v })}
        />

        <SliderField
          label="Merito promedio"
          hint="Porcentaje adicional aplicado solo a quienes superan la expectativa del cargo."
          value={supuestos.meritoPorcentaje}
          min={0}
          max={8}
          step={0.1}
          onChange={v => update({ meritoPorcentaje: v })}
        />

        <SliderField
          label="Factor amplificacion"
          hint="Multiplicador del sueldo bruto para llegar a costo empresa total (cotizaciones, leyes sociales, seguros)."
          value={supuestos.factorAmplificacion}
          min={1.2}
          max={1.6}
          step={0.01}
          suffix="×"
          onChange={v => update({ factorAmplificacion: v })}
        />

        <SliderField
          label="Ausentismo"
          hint="Horas no trabajadas que se pagan igual. Ajusta el costo efectivo por persona."
          value={supuestos.ausentismoPorcentaje}
          min={0}
          max={8}
          step={0.1}
          onChange={v => update({ ausentismoPorcentaje: v })}
        />

        <SliderField
          label="Rotacion esperada"
          hint={`Porcentaje anual de salidas no planificadas. Historico reciente: ${rotacionHistorica}%. Este supuesto se activara en la proxima version del motor.`}
          value={supuestos.rotacionEsperada}
          min={0}
          max={30}
          step={0.5}
          onChange={v => update({ rotacionEsperada: v })}
        />
      </div>

      {/* PERIODO DEL PRESUPUESTO */}
      <div className="space-y-5 rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            Periodo
          </p>
          <p className="text-[11px] text-slate-500 font-light">
            El ciclo del presupuesto arranca en este mes y año.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Año del presupuesto
            </label>
            <select
              value={supuestos.anioPresupuesto}
              onChange={e => update({ anioPresupuesto: Number.parseInt(e.target.value, 10) })}
              className="px-2 py-1 text-sm font-light text-white bg-slate-900/40 border border-slate-700/50 rounded focus:outline-none focus:border-cyan-500/40"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-slate-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <MesSelector
          label="Mes de inicio del ciclo"
          hint="Primer mes que se presenta al directorio."
          value={supuestos.mesInicio}
          onChange={v => update({ mesInicio: v })}
        />
      </div>

      {/* SALIDAS — default del wizard, override por persona en Paso 4 */}
      <div className="space-y-5 rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            Salidas — default
          </p>
          <p className="text-[11px] text-slate-500 font-light">
            Mes por defecto para las desvinculaciones. En el paso 4 puedes ajustar
            individualmente a cada persona.
          </p>
        </div>

        <MesSelector
          label="Mes planificado para salidas"
          hint="Se usa como valor inicial; editable persona por persona."
          value={supuestos.mesSalidas}
          onChange={v => update({ mesSalidas: v })}
        />
      </div>

      {/* REAJUSTE IPC — frecuencia + primer mes */}
      <div className="space-y-5 rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
            Reajuste salarial por IPC
          </p>
          <p className="text-[11px] text-slate-500 font-light">
            Cada cuanto y desde cuando se aplica el ajuste a la masa salarial.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Frecuencia de reajuste
          </label>
          <div className="flex gap-2">
            {(['anual', 'semestral', 'trimestral'] as FrecuenciaReajuste[]).map(f => {
              const activo = supuestos.frecuenciaReajuste === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ frecuenciaReajuste: f })}
                  className={
                    'flex-1 px-3 py-1.5 text-xs font-light capitalize rounded-lg border transition-colors ' +
                    (activo
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:border-slate-500/60')
                  }
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>

        <MesSelector
          label="Mes del primer reajuste"
          hint={
            supuestos.frecuenciaReajuste === 'anual'
              ? 'Se aplica una vez al año.'
              : supuestos.frecuenciaReajuste === 'semestral'
                ? `El segundo reajuste cae automaticamente en ${MESES[(supuestos.mesReajusteIPC - 1 + 6) % 12].label}.`
                : `Se aplica tambien en ${MESES[(supuestos.mesReajusteIPC - 1 + 3) % 12].label}, ${MESES[(supuestos.mesReajusteIPC - 1 + 6) % 12].label} y ${MESES[(supuestos.mesReajusteIPC - 1 + 9) % 12].label}.`
          }
          value={supuestos.mesReajusteIPC}
          onChange={v => update({ mesReajusteIPC: v })}
        />

        <MesSelector
          label="Mes de ajuste por merito"
          hint="Aplica solo a personas con desempeño destacado. Se aplica una vez al año, independiente de la frecuencia del IPC."
          value={supuestos.mesMerito}
          onChange={v => update({ mesMerito: v })}
        />
      </div>

      {/* PROYECCION APROXIMADA — feedback inmediato */}
      <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4">
        <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">
          Proyeccion aproximada del ciclo
        </p>
        <p className="text-sm text-slate-300 font-light mt-2 leading-relaxed">
          Con estos supuestos, la masa salarial al cierre del ciclo termina{' '}
          <span className="text-white font-medium">
            +{proyeccion.variacionPct}% sobre la base actual
          </span>
          . Costo empresa proyectado:{' '}
          <span className="text-white font-medium tabular-nums">
            {formatCLP(proyeccion.costoAnualAprox)}
          </span>
          .
        </p>
        <p className="text-[11px] text-slate-500 font-light mt-1 italic">
          Calculo indicativo. El detalle mensualizado se entrega en el paso 5.
        </p>
      </div>

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
          Continuar a salidas
        </button>
      </div>
    </div>
  )
}
