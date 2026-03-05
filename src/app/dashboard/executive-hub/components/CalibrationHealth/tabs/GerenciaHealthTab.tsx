'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB 2: SALUD POR GERENCIA
// Tabla con Tesla line por fila + tooltips por celda
// Mobile: solo Gerencia + Salud + ⚠️. Desktop: + σ/Óptima/Central/Severa/Indulg
// Click en celda con sesgo → abre BiasDetailModal en la gerencia correspondiente
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { TableCell } from '../shared/TableCell'
import { getTooltipForCell, getTeslaLineColor } from '../CalibrationHealth.utils'
import { BiasDetailModal } from '../BiasDetailModal'
import type { CalibrationData, IntegrityScore } from '../CalibrationHealth.types'

interface GerenciaHealthTabProps {
  data: CalibrationData
}

export const GerenciaHealthTab = memo(function GerenciaHealthTab({ data }: GerenciaHealthTabProps) {
  const gerencias = data?.byGerencia ?? []

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalGerenciaId, setModalGerenciaId] = useState<string | null>(null)

  const handleViewEvaluator = useCallback((gerenciaId: string) => {
    setModalGerenciaId(gerenciaId)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setModalGerenciaId(null)
  }, [])

  const sorted = [...gerencias].sort((a, b) => {
    if (a.evaluatorCount === 0 && b.evaluatorCount > 0) return 1
    if (a.evaluatorCount > 0 && b.evaluatorCount === 0) return -1
    const pctA = a.evaluatorCount > 0 ? (a.counts.OPTIMA / a.evaluatorCount) : -1
    const pctB = b.evaluatorCount > 0 ? (b.counts.OPTIMA / b.evaluatorCount) : -1
    return pctB - pctA
  })

  if (gerencias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Info className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">No hay datos de gerencias disponibles.</p>
      </div>
    )
  }

  // Fallback integrityScore for BiasDetailModal
  const integrity: IntegrityScore = data.integrityScore || {
    score: data.overallConfidence,
    baseScore: data.overallConfidence,
    penalties: { bias: null, variance: null },
    level: data.overallConfidence >= 75 ? 'HIGH' : data.overallConfidence >= 50 ? 'MEDIUM' : 'LOW',
    narrative: ''
  }

  return (
    <div className="w-full">
      {/* Leyenda */}
      <div className="flex items-center gap-1.5 mb-5 px-1 text-[11.5px] text-slate-500">
        <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
        <span>
          <span className="text-slate-400">ÓPTIMA</span> = diferencia bien ·{' '}
          <span className="text-slate-400">CENTRAL</span> = todo igual ·{' '}
          <span className="text-slate-400">SEVERA</span> = muy estricto ·{' '}
          <span className="text-slate-400">INDULG</span> = muy blando
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl overflow-x-auto border border-slate-800/60" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
        <table className="w-full border-collapse min-w-[600px] md:min-w-0">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
              <TH align="left" style={{ width: '32%', paddingLeft: '20px' }}>Gerencia</TH>
              <TH style={{ width: '12%' }}>Salud</TH>
              <TH className="hidden md:table-cell" style={{ width: '10%', color: '#94a3b8' }}>σ</TH>
              <TH className="hidden md:table-cell" style={{ width: '12%', color: '#10b981' }}>Óptima</TH>
              <TH className="hidden md:table-cell" style={{ width: '12%', color: '#22d3ee' }}>Central</TH>
              <TH className="hidden md:table-cell" style={{ width: '12%', color: '#f59e0b' }}>Severa</TH>
              <TH className="hidden md:table-cell" style={{ width: '12%', color: '#f59e0b' }}>Indulg</TH>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, idx) => {
              const isEmpty = g.evaluatorCount === 0
              const total = g.evaluatorCount
              const healthPct = !isEmpty ? Math.round((g.counts.OPTIMA / total) * 100) : null
              const hasAlert = !isEmpty && (g.counts.SEVERA > 0 || g.counts.INDULGENTE > 0)
              const teslaColor = getTeslaLineColor(total, healthPct, hasAlert)
              const isLast = idx === sorted.length - 1

              const healthColor = !isEmpty && healthPct !== null
                ? healthPct >= 80 ? '#10b981' : healthPct >= 50 ? '#f59e0b' : '#ef4444'
                : undefined

              const pct = (n: number) => !isEmpty ? `${Math.round((n / total) * 100)}%` : null

              // Click action: only for non-empty gerencias
              const viewAction = !isEmpty ? () => handleViewEvaluator(g.gerenciaId) : undefined

              return (
                <tr
                  key={g.gerenciaId}
                  className="group transition-colors duration-150 hover:bg-slate-700/15"
                  style={{ borderBottom: isLast ? 'none' : '1px solid rgba(51, 65, 85, 0.3)' }}
                >
                  {/* Gerencia + Tesla line */}
                  <td className="py-3.5" style={{ paddingLeft: 0 }}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 self-stretch w-0.5 rounded-full ${teslaColor}`}
                        style={{ minHeight: '42px', marginLeft: '6px', opacity: isEmpty ? 0.35 : 0.85 }}
                      />
                      <span className="text-sm font-medium truncate" style={{ color: isEmpty ? '#475569' : '#e2e8f0', maxWidth: '200px' }}>
                        {g.gerenciaName}
                      </span>
                    </div>
                  </td>

                  {/* Salud */}
                  <TableCell
                    value={isEmpty ? null : `${healthPct}%`}
                    tooltip={getTooltipForCell(isEmpty ? 'EMPTY' : 'SALUD', g)}
                    color={healthColor}
                    bold={!isEmpty}
                    onAction={viewAction}
                  />

                  {/* σ Varianza — oculto en móvil */}
                  <TableCell
                    className="hidden md:table-cell"
                    value={isEmpty || g.stdDev === null ? null : `${g.stdDev.toFixed(2)}`}
                    tooltip={{
                      title: 'Varianza (σ)',
                      body: isEmpty || g.stdDev === null
                        ? 'Sin datos de varianza'
                        : g.stdDev < 0.5
                          ? 'Baja dispersión: los evaluadores califican de forma consistente.'
                          : g.stdDev < 1.0
                            ? 'Dispersión moderada: algunos evaluadores difieren en criterios.'
                            : 'Alta dispersión: los jefes no están alineados en criterios de evaluación.'
                    }}
                    color={isEmpty || g.stdDev === null ? undefined : g.stdDev >= 1.0 ? '#ef4444' : g.stdDev >= 0.5 ? '#f59e0b' : '#94a3b8'}
                  />

                  {/* Óptima / Central / Severa / Indulg — ocultos en móvil */}
                  <TableCell className="hidden md:table-cell" value={pct(g.counts.OPTIMA)} tooltip={getTooltipForCell('OPTIMA', g)} />
                  <TableCell className="hidden md:table-cell" value={pct(g.counts.CENTRAL)} tooltip={getTooltipForCell('CENTRAL', g)} onAction={viewAction} />
                  <TableCell className="hidden md:table-cell" value={pct(g.counts.SEVERA)} tooltip={getTooltipForCell('SEVERA', g)} highlight={!isEmpty && g.counts.SEVERA > 0} onAction={viewAction} />
                  <TableCell className="hidden md:table-cell" value={pct(g.counts.INDULGENTE)} tooltip={getTooltipForCell('INDULGENTE', g)} highlight={!isEmpty && g.counts.INDULGENTE > 0} onAction={viewAction} />

                  {/* Alerta */}
                  <td className="px-2 py-3.5 text-center w-8">
                    {hasAlert && <AlertTriangle className="w-4 h-4 inline-block text-amber-500 opacity-85" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="mt-3 px-1 text-xs text-slate-700">
        Pasa el cursor sobre cualquier celda para ver el diagnóstico. Haz clic en celdas con sesgo para ver evaluadores.
      </p>

      {/* Drill-down Modal */}
      {data.byGerencia && data.byGerencia.length > 0 && (
        <BiasDetailModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          byGerencia={data.byGerencia}
          integrityScore={integrity}
          initialGerenciaId={modalGerenciaId}
        />
      )}
    </div>
  )
})

// Header cell helper
function TH({ children, align, className, style }: {
  children: React.ReactNode; align?: string; className?: string; style?: React.CSSProperties
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase ${className || ''}`}
      style={{ color: '#475569', textAlign: (align as any) || 'center', ...style }}
    >
      {children}
    </th>
  )
}

export default GerenciaHealthTab
