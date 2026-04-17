'use client'

// Paso 5 del Wizard: presupuesto mensualizado 12 meses + narrativa ejecutiva.
// Patron G: narrativa backend → chart + KPIs → accion (exportar / guardar).
// Exportar PDF y Guardar borrador son placeholders v1.1 / Entrega B.

import { Download, Save } from 'lucide-react'
import AniversarioBarChart from './AniversarioBarChart'
import { formatCLP } from './format'
import type { ResultadoResponse } from './types'

interface ResultadoMensualProps {
  data: ResultadoResponse
  onBack: () => void
  onVolverDiagnostico: () => void
  onSave: () => void
}

export default function ResultadoMensual({
  data,
  onBack,
  onVolverDiagnostico,
  onSave,
}: ResultadoMensualProps) {
  const { meses, narrativaEjecutiva, resumenAnual, costoBaseOriginal } = data
  const costoMaximo = Math.max(...meses.map(m => m.costoEmpresa))
  const mesMaximo = meses.find(m => m.costoEmpresa === costoMaximo)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Paso 5 · Presupuesto para directorio
        </span>
        <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight">
          Asi se ve el{' '}
          <span className="fhr-title-gradient">proximo ciclo.</span>
        </h2>
      </div>

      {/* NUMERO PROTAGONISTA */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 p-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          Costo empresa proyectado del ciclo
        </p>
        <p className="text-[56px] md:text-[72px] font-extralight text-white leading-none tabular-nums mt-2">
          {formatCLP(resumenAnual.costoTotalAnual)}
        </p>
        <p
          className={
            resumenAnual.variacionVsBase >= 0
              ? 'text-xs text-slate-400 font-light mt-2'
              : 'text-xs text-emerald-400 font-light mt-2'
          }
        >
          {resumenAnual.variacionVsBase >= 0 ? '+' : ''}
          {resumenAnual.variacionVsBase}% vs base actual de{' '}
          {formatCLP(resumenAnual.costoBaseAnual)}
        </p>
      </div>

      {/* EVIDENCIA — chart mensual */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
            Costo empresa mes a mes
          </p>
          {mesMaximo && (
            <p className="text-[11px] text-slate-500 font-light">
              Maximo: {mesMaximo.mesNombre}
            </p>
          )}
        </div>
        <AniversarioBarChart meses={meses} costoBaseOriginal={costoBaseOriginal} />
      </div>

      {/* NARRATIVA EJECUTIVA — siempre visible debajo del chart */}
      {narrativaEjecutiva && (
        <div className="relative overflow-hidden rounded-xl bg-slate-900/40 border border-slate-700/40 p-6">
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            }}
          />
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium mb-4">
            Sintesis ejecutiva
          </p>
          <div className="text-sm text-slate-300 font-light leading-relaxed whitespace-pre-line">
            {narrativaEjecutiva}
          </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Finiquitos
          </p>
          <p className="text-xl font-extralight text-white mt-1 tabular-nums">
            {formatCLP(resumenAnual.finiquitos)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Ahorro neto
          </p>
          <p
            className={
              resumenAnual.ahorroNeto >= 0
                ? 'text-xl font-extralight text-emerald-400 mt-1 tabular-nums'
                : 'text-xl font-extralight text-amber-400 mt-1 tabular-nums'
            }
          >
            {resumenAnual.ahorroNeto >= 0 ? '+' : ''}
            {formatCLP(resumenAnual.ahorroNeto)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Payback
          </p>
          <p className="text-xl font-extralight text-white mt-1 tabular-nums">
            {resumenAnual.paybackMeses}
            <span className="text-xs text-slate-400 font-light ml-1">meses</span>
          </p>
        </div>
        <div className="rounded-lg bg-slate-900/40 border border-slate-700/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Variacion
          </p>
          <p
            className={
              resumenAnual.variacionVsBase >= 0
                ? 'text-xl font-extralight text-white mt-1 tabular-nums'
                : 'text-xl font-extralight text-emerald-400 mt-1 tabular-nums'
            }
          >
            {resumenAnual.variacionVsBase >= 0 ? '+' : ''}
            {resumenAnual.variacionVsBase}%
          </p>
        </div>
      </div>

      {/* ACCIONES FINALES — placeholders Entrega A */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-4 border-t border-slate-800/40">
        <div className="flex-1 flex gap-2">
          <button
            type="button"
            disabled
            title="Disponible en proxima version"
            className="fhr-btn fhr-btn-secondary flex items-center gap-2 opacity-40 cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={onSave}
            className="fhr-btn fhr-btn-secondary flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar escenario
          </button>
        </div>

        <div className="flex items-center justify-between md:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-white font-light transition-colors"
          >
            ← Ajustar salidas
          </button>
          <button
            type="button"
            onClick={onVolverDiagnostico}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium transition-colors"
          >
            Volver al diagnostico
          </button>
        </div>
      </div>
    </div>
  )
}
