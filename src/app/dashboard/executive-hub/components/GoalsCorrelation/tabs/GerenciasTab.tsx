'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Gerencias (Heatmap + Semáforo Confianza)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/GerenciasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tabla por gerencia: Cobertura | Progreso | Desconexión | Semáforo
// Semáforo cruce calibración × metas
// Narrativa de la peor gerencia
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { GerenciaGoalsStats } from '../GoalsCorrelation.types'

interface GerenciasTabProps {
  byGerencia: GerenciaGoalsStats[]
}

const CONFIDENCE_CONFIG = {
  green: { dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]', label: 'Confiable', text: 'text-emerald-400' },
  amber: { dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]', label: 'Revisar', text: 'text-amber-400' },
  red: { dot: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]', label: 'Alerta', text: 'text-red-400' },
}

export default memo(function GerenciasTab({ byGerencia }: GerenciasTabProps) {

  // Worst gerencia for narrative
  const worstGerencia = useMemo(() => {
    const withDisconnection = byGerencia.filter(g => g.disconnectionRate > 0 && g.coverage > 30)
    return withDisconnection.length > 0 ? withDisconnection[0] : null // Already sorted by disconnectionRate desc
  }, [byGerencia])

  if (byGerencia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">Sin datos por gerencia.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Heatmap Table */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/30 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_60px_70px_70px] gap-px bg-slate-800/30 px-4 py-2.5">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Gerencia</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center">Cob.</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center">Prog.</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center">Desc.</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center">Conf.</p>
        </div>

        {/* Rows */}
        {byGerencia.map((ger, idx) => {
          const conf = CONFIDENCE_CONFIG[ger.confidenceLevel]

          return (
            <motion.div
              key={ger.gerenciaName}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: idx * 0.03 }}
              className="grid grid-cols-[1fr_60px_60px_70px_70px] gap-px px-4 py-3 border-t border-slate-800/20 hover:bg-slate-800/20 transition-colors"
            >
              {/* Gerencia name */}
              <div className="min-w-0">
                <p className="text-sm font-light text-slate-200 truncate">{ger.gerenciaName}</p>
                <p className="text-[9px] text-slate-600">{ger.employeeCount} personas</p>
              </div>

              {/* Cobertura */}
              <div className="flex items-center justify-center">
                <span className={cn(
                  'text-xs font-mono',
                  ger.coverage >= 70 ? 'text-slate-300' : 'text-amber-400'
                )}>
                  {ger.coverage}%
                </span>
              </div>

              {/* Progreso */}
              <div className="flex items-center justify-center">
                <span className="text-xs font-mono text-slate-300">
                  {ger.avgProgress}%
                </span>
              </div>

              {/* Desconexión */}
              <div className="flex items-center justify-center">
                <span className={cn(
                  'text-xs font-mono',
                  ger.disconnectionRate > 25 ? 'text-red-400' :
                  ger.disconnectionRate > 15 ? 'text-amber-400' :
                  'text-slate-500'
                )}>
                  {ger.disconnectionRate}%
                </span>
              </div>

              {/* Semáforo confianza */}
              <div className="flex items-center justify-center gap-1.5 group relative">
                <div className={cn('w-2 h-2 rounded-full', conf.dot)} />
                <span className={cn('text-[9px] font-medium', conf.text)}>
                  {conf.label}
                </span>

                {/* Tooltip — explica semáforo */}
                {ger.evaluatorClassification && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-56 text-left">
                    <p className="text-[10px] text-slate-300 mb-1">Evaluador: {ger.evaluatorClassification}</p>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      {ger.confidenceLevel === 'red' && ger.avgProgress < 40
                        ? 'Evaluador indulgente + metas bajas = doble inflación. Las evaluaciones podrían estar sobreestimadas.'
                        : ger.confidenceLevel === 'red' && ger.avgProgress > 80
                        ? 'Evaluador severo + metas altas = posible sesgo contra resultados reales.'
                        : ger.confidenceLevel === 'amber'
                        ? 'Evaluador con tendencia central. Difícil distinguir top performers de underperformers.'
                        : 'Evaluaciones calibradas. Los datos son confiables para decisiones de compensación.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Narrative — peor gerencia */}
      {worstGerencia && (
        <div className="border-l-2 border-amber-500/30 pl-4">
          <p className="text-sm font-light text-slate-300 leading-relaxed">
            <span className="font-medium text-slate-200">{worstGerencia.gerenciaName}</span> tiene el mayor nivel de desconexión:
            evaluación promedio {worstGerencia.avgScore360.toFixed(1)} pero metas promedio {worstGerencia.avgProgress}%.
            {worstGerencia.evaluatorClassification && (
              <> Evaluador clasificado <span className="font-medium text-amber-400">{worstGerencia.evaluatorClassification}</span>.</>
            )}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-slate-600">
        <span>Cob. = Cobertura de metas</span>
        <span>Prog. = Progreso promedio</span>
        <span>Desc. = Desconexión 360° vs metas</span>
        <span>Conf. = Confianza evaluador × metas</span>
      </div>
    </div>
  )
})
