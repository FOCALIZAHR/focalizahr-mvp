'use client'

// ============================================================================
// TAC DETAIL MODAL — Detalle gerencia con Design System FocalizaHR
// Usa clases .fhr-* de focalizahr-unified.css
// ============================================================================

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import GerenciaDetail from '../GerenciaDetail'
import type { TACDetailModalProps } from '@/types/tac-cinema'

export default memo(function TACDetailModal({
  isOpen,
  onClose,
  gerencia,
  expandedQuadrant
}: TACDetailModalProps) {
  const [showPlTooltip, setShowPlTooltip] = useState(false)

  if (!gerencia) return null

  const pos = gerencia.full.sucesores.posicionesCriticas
  const suc = gerencia.full.sucesores.total
  const successionText = pos === 0
    ? `${suc} sucesores activos`
    : `${(suc / pos).toFixed(1)}x cobertura · ${pos} pos · ${suc} suc`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl mx-4 bg-[#0F172A] border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto"
          >
            {/* Esferas difusas de fondo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Tesla line */}
            <div className="fhr-top-line" />

            {/* Header */}
            <div className="text-center pt-8 pb-4 px-6">
              <p className="fhr-text-sm uppercase tracking-wider mb-2"
                 style={{ color: 'var(--fhr-text-muted)', fontWeight: 600, fontSize: '0.625rem' }}>
                Distribucion de Talento
              </p>

              <h1 className="fhr-hero-title" style={{ fontSize: '1.75rem' }}>
                {gerencia.displayName}
              </h1>
              <p className="fhr-subtitle mt-1">
                {gerencia.clasificadas} de {gerencia.totalPersonas} personas evaluadas
              </p>

              {/* Divider Tesla ── • ── */}
              <div className="fhr-divider">
                <span className="fhr-divider-line" />
                <span className="fhr-divider-dot" />
                <span className="fhr-divider-line" />
              </div>

              <p className="fhr-subtitle">
                {successionText}
              </p>
            </div>

            {/* P&L Detection card */}
            {gerencia.plTotal > 0 && (
              <div
                className="mx-6 mb-5 fhr-card-glass relative"
                onMouseEnter={() => setShowPlTooltip(true)}
                onMouseLeave={() => setShowPlTooltip(false)}
              >
                <div className="fhr-top-line" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-light" style={{ color: 'var(--fhr-cyan)' }}>
                      {formatCurrencyCLP(gerencia.plTotal)}
                    </span>
                    <span className="ml-2" style={{ color: 'var(--fhr-text-tertiary)' }}>en riesgo</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg text-white font-medium">
                      {gerencia.full.riskDistribution.BURNOUT_RISK}
                    </span>
                    <span className="block text-xs" style={{ color: 'var(--fhr-text-muted)' }}>sobrecargadas</span>
                  </div>
                </div>
                <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--fhr-text-muted)' }}>
                  <HelpCircle className="w-3 h-3" />
                  Fuente: SHRM 2024 · Costo reemplazo × factor riesgo
                </div>

                {/* Tooltip */}
                {showPlTooltip && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 z-[80] pointer-events-none">
                    <div className="relative p-4 shadow-2xl rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700/30">
                      <div className="fhr-top-line" />
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'var(--fhr-text-secondary)' }}>
                        {`Estimacion del costo si el talento en riesgo sale de la organizacion.\n\nIncluye:\n· Talento en riesgo de irse × sueldo anual × 1.25\n· Conocimiento critico en riesgo × sueldo anual × 1.25 × 1.5\n\nFuente salarial: configuracion de la empresa o promedio de mercado Chile.\nMetodologia: SHRM 2024.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contenido */}
            <div style={{ borderTop: '1px solid var(--fhr-border-default)' }}>
              <div className="px-6 py-5">
                <GerenciaDetail gerencia={gerencia.full} expandedQuadrant={expandedQuadrant} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid var(--fhr-border-default)' }}>
              <button
                onClick={onClose}
                className="w-full text-center text-sm transition-colors min-h-[44px]"
                style={{ color: 'var(--fhr-text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fhr-text-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--fhr-text-muted)'}
              >
                Cerrar
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
