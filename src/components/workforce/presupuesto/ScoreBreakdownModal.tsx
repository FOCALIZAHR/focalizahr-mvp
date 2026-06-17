'use client'

// Modal de desglose del score de retencion.
// Convierte el numero en inteligencia explicable — el CEO ve por que
// esa persona aparece en la lista.
// Glassmorphism + Tesla line, centered con backdrop.

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ProvisionEntry } from './types'
import { formatNombre } from './format'

interface ScoreBreakdownModalProps {
  entry: ProvisionEntry | null
  onClose: () => void
}

interface BarProps {
  label: string
  value: number | null
  max: number
}

function Bar({ label, value, max }: BarProps) {
  if (value === null) {
    return (
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400 font-light">{label}</span>
        <span className="text-xs text-slate-500 font-light italic">sin evaluar</span>
      </div>
    )
  }
  const pct = Math.min(100, (value / max) * 100)
  const color = value >= 80 ? '#22D3EE' : value >= 50 ? '#A78BFA' : '#64748B'
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400 font-light">{label}</span>
        <span className="text-sm text-slate-200 font-medium tabular-nums">
          {value}
          <span className="text-xs text-slate-500 font-light ml-0.5">/{max}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function ScoreBreakdownModal({
  entry,
  onClose,
}: ScoreBreakdownModalProps) {
  useEffect(() => {
    if (!entry) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [entry, onClose])

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 shadow-2xl"
          >
            {/* Tesla line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                boxShadow: '0 0 20px rgba(34,211,238,0.3)',
              }}
            />

            {/* Header */}
            <div className="p-5 pb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                  Score de retencion
                </span>
                <p className="text-sm text-slate-200 font-medium mt-1 truncate">
                  {formatNombre(entry.employeeName)}
                </p>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">
                  {entry.position}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SEMANTICA — que significa el numero */}
            <div className="px-5 pb-4">
              <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                Score alto = mas valioso de retener. Score bajo = candidato a salida.
                Umbral de proteccion: 80.
              </p>
            </div>

            {/* Componentes base */}
            <div className="px-5 py-4 border-t border-slate-800/60 space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                Componentes base
              </span>
              <Bar
                label="Cumplimiento metas"
                value={entry.scoreBreakdown.goalsNorm}
                max={100}
              />
              <Bar
                label="Dominio del cargo"
                value={entry.scoreBreakdown.roleFitNorm}
                max={100}
              />
              <Bar
                label="Adaptabilidad"
                value={entry.scoreBreakdown.adaptNorm}
                max={100}
              />
              <p className="text-[10px] text-slate-500 font-light italic pt-1">
                Promedio ponderado: metas 40% · dominio 30% · adaptabilidad 30%
              </p>
            </div>

            {/* Modificadores aditivos — con explicacion en parentesis */}
            {(entry.scoreBreakdown.bonusCritico !== 0 ||
              entry.scoreBreakdown.bonusSucesor !== 0 ||
              entry.scoreBreakdown.penaltyExposicion !== 0) && (
              <div className="px-5 py-4 border-t border-slate-800/60">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium block mb-3">
                  Modificadores
                </span>
                <div className="space-y-3">
                  {entry.scoreBreakdown.bonusCritico !== 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Posicion critica</span>
                        <span className="text-cyan-400 font-medium tabular-nums">
                          +{entry.scoreBreakdown.bonusCritico}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                        (Ocupa un cargo critico con plan de sucesion. Perderlo
                        interrumpe la continuidad del negocio — suma al score.)
                      </p>
                    </div>
                  )}
                  {entry.scoreBreakdown.bonusSucesor !== 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Sucesor natural</span>
                        <span className="text-cyan-400 font-medium tabular-nums">
                          +{entry.scoreBreakdown.bonusSucesor}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                        (El motor de talento lo identifica como sucesor natural de
                        otro cargo clave. Perderlo cuesta capital estrategico — suma
                        al score.)
                      </p>
                    </div>
                  )}
                  {entry.scoreBreakdown.penaltyExposicion !== 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Exposicion IA</span>
                        <span className="text-amber-400 font-medium tabular-nums">
                          {entry.scoreBreakdown.penaltyExposicion}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                        (El cargo esta expuesto a automatizacion: parte de su valor
                        migra a la IA. Resta al score — mas expuesto, menos critico
                        retener el rol tal cual.)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score total — numero protagonista */}
            <div className="px-5 py-5 border-t border-slate-800/60 bg-slate-900/40">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                  Score total
                </span>
                <span className="text-3xl font-extralight text-white tabular-nums">
                  {entry.retentionScore}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-light italic mt-2">
                {entry.tier === 'intocable'
                  ? 'Intocable — no aparece como opcion de salida.'
                  : entry.tier === 'valioso'
                    ? 'Valioso — revisar cuidadosamente antes de moverlo.'
                    : entry.tier === 'neutro'
                      ? 'Neutro — decision discrecional.'
                      : 'Prescindible — candidato natural a salida.'}
              </p>
              {!entry.scoreBreakdown.hasCompleteData && (
                <p className="text-[10px] text-amber-400/80 font-light italic mt-1">
                  Evaluacion incompleta — faltan datos de metas o potencial.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
