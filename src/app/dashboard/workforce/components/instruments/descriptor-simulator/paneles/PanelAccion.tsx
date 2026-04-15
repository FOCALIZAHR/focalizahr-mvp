'use client'

// ════════════════════════════════════════════════════════════════════════════
// PANEL ACCION — zona C del Panel de Control (bottom, siempre visible)
// paneles/PanelAccion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dos botones:
//   - Copiar resumen: al clipboard la frase canónica arbitradora
//   - Exportar escenario: abre ScenarioExportModal (snapshot V1, no persiste)
//
// shrink-0 + border-t → NUNCA se oculta con scroll.
// El botón Exportar solo se habilita si hay cambios (simulation.hasChanges).
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { Check, Copy, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCLP } from '../../_shared/format'
import type { LiveSimulation } from '../descriptor-simulator-utils'

interface PanelAccionProps {
  simulation: LiveSimulation
  baselineExposurePct: number
  jobTitle: string
  onExport: () => void
}

export default memo(function PanelAccion({
  simulation,
  baselineExposurePct,
  jobTitle,
  onExport,
}: PanelAccionProps) {
  const [copied, setCopied] = useState(false)

  const canAct = simulation.hasChanges

  const handleCopy = async () => {
    const newPct = Math.round(simulation.newExposurePct)
    const oldPct = Math.round(baselineExposurePct)
    const summary = `Rediseño "${jobTitle}" — Bajo este escenario, el rediseño libera ${Math.round(simulation.hoursLiberated)} horas/mes, rescata ${formatCLP(simulation.rescateCLPTotal)} CLP/mes y reduce la exposición de ${oldPct}% a ${newPct}%.`
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silencioso — navegador sin permisos
    }
  }

  return (
    <div className="p-4 border-t border-slate-700/30 shrink-0 space-y-2">
      {/* Copiar resumen */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={!canAct}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all',
          canAct
            ? 'text-slate-300 border border-slate-700/50 hover:border-slate-500 hover:text-white'
            : 'text-slate-600 border border-slate-800 cursor-not-allowed',
        )}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copiar resumen
          </>
        )}
      </button>

      {/* Aprobar / Exportar escenario */}
      <button
        type="button"
        onClick={onExport}
        disabled={!canAct}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all',
          canAct
            ? 'text-cyan-300 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.12)]'
            : 'text-slate-600 border border-slate-800 cursor-not-allowed',
        )}
      >
        Aprobar rediseño
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
})
