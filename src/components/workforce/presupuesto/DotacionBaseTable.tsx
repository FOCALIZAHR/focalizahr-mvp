'use client'

// Paso 1 del Wizard: dos momentos separados con AnimatePresence.
// MOMENTO 1 — Portada (Patron Executive Portada, full card centered)
// MOMENTO 2 — Evidencia (tabla + guardarrail + CTA Confirmar)
// Guardarrail sin fondos de color — patron clonado de UrgencyCard (exit).

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'
import { formatCLP } from './format'
import type { DotacionBaseResponse } from './types'

interface DotacionBaseTableProps {
  data: DotacionBaseResponse
  ano: number
  onAnoChange: (ano: number) => void
  onContinue: () => void
}

function buildAnoOptions(): number[] {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1, current + 2]
}

function ExposureBar({ value }: { value: number }) {
  const color =
    value >= 60 ? '#E24B4A' : value >= 40 ? '#EF9F27' : '#639922'
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-14 h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-light w-9 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

export default function DotacionBaseTable({
  data,
  ano,
  onAnoChange,
  onContinue,
}: DotacionBaseTableProps) {
  const [mostrarDistribucion, setMostrarDistribucion] = useState(false)

  const totalesCalculados = useMemo(
    () => ({
      masaTotal: data.porGerencia.reduce((s, g) => s + g.masaSalarial, 0),
      costoTotal: data.porGerencia.reduce((s, g) => s + g.costoEmpresa, 0),
    }),
    [data.porGerencia],
  )

  const anoOptions = useMemo(() => buildAnoOptions(), [])

  return (
    <AnimatePresence mode="wait">
      {!mostrarDistribucion ? (
        // ═══════════════════════════════════════════════════════════════
        // MOMENTO 1 — PORTADA (full card, centrada)
        // ═══════════════════════════════════════════════════════════════
        <motion.div
          key="portada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="relative min-h-[440px] flex flex-col"
        >
          {/* Selector año — top right del card */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
              Año
            </span>
            <select
              value={ano}
              onChange={e => onAnoChange(Number.parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-light bg-slate-900/40 border border-slate-700/50 text-slate-200 focus:outline-none focus:border-cyan-500/40 tabular-nums"
            >
              {anoOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Contenido centrado */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
              Presupuesto {ano}
            </span>

            <div className="space-y-2">
              <p className="text-[64px] md:text-[80px] font-extralight text-white leading-none tabular-nums">
                {data.totalHeadcount} personas
              </p>
              <p className="text-xl md:text-2xl font-light">
                <span className="fhr-title-gradient">
                  {formatCLP(data.costoEmpresa)} al mes
                </span>
              </p>
            </div>

            <p className="text-sm text-slate-400 font-light max-w-md leading-relaxed pt-2">
              Asi se ve tu organizacion antes de cualquier decision del ciclo.
            </p>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => setMostrarDistribucion(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium transition-colors"
              >
                Ver distribucion
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        // ═══════════════════════════════════════════════════════════════
        // MOMENTO 2 — EVIDENCIA (tabla + guardarrail + CTA avance)
        // ═══════════════════════════════════════════════════════════════
        <motion.div
          key="distribucion"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Contexto — recuerda que paso y año sigue */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                Distribucion por gerencia · {ano}
              </span>
              <p className="text-sm text-slate-400 font-light mt-1">
                {data.totalHeadcount} personas · {formatCLP(data.costoEmpresa)} al mes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarDistribucion(false)}
              className="text-xs text-slate-500 hover:text-white font-light transition-colors"
            >
              ← Volver a resumen
            </button>
          </div>

          {/* EVIDENCIA — tabla por gerencia */}
          <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left font-medium px-4 py-3">Gerencia</th>
                    <th className="text-right font-medium px-4 py-3">Personas</th>
                    <th className="text-right font-medium px-4 py-3">Masa</th>
                    <th className="text-right font-medium px-4 py-3">Costo</th>
                    <th className="text-right font-medium px-4 py-3">Exposicion IA</th>
                  </tr>
                </thead>
                <tbody>
                  {data.porGerencia.map(g => (
                    <tr
                      key={g.gerenciaId}
                      className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-200 font-light">
                        {g.gerenciaNombre}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-light">
                        {g.headcount}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 font-light tabular-nums">
                        {formatCLP(g.masaSalarial)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200 font-light tabular-nums">
                        {formatCLP(g.costoEmpresa)}
                      </td>
                      <td className="px-4 py-3">
                        <ExposureBar value={g.exposicionIA} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-800/30 border-t border-slate-700/50">
                    <td className="px-4 py-3 text-cyan-400 font-medium text-xs uppercase tracking-wider">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-white font-light">
                      {data.totalHeadcount}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-light tabular-nums">
                      {formatCLP(totalesCalculados.masaTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium tabular-nums">
                      {formatCLP(totalesCalculados.costoTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <ExposureBar value={data.exposicionIAPromedio} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GUARDARRAIL — patron UrgencyCard (sin fondo de color) */}
          {data.intocablesCount > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50">
              {/* Tesla line sutil cyan */}
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
                    {data.intocablesCount}{' '}
                    {data.intocablesCount === 1 ? 'persona con' : 'personas con'} alto
                    dominio de su cargo
                  </p>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Las dos fuentes de datos lo confirman. Aparecen como referencia
                    en el paso 4, no como opcion de salida. Mover a quien sostiene
                    el negocio es el tipo de decision que cuesta mas de lo que ahorra.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACCION — avanzar al paso 2 */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-medium transition-colors"
            >
              Confirmar y continuar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
