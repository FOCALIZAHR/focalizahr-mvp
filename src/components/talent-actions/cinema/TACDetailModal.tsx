'use client'

// Clonado de src/components/evaluator/cinema/AvatarInfoModal.tsx
// Misma estructura modal: fixed z-50, backdrop, Tesla line, avatar header
// Contenido adaptado: GerenciaDetail en vez de InfoRow/StatusRow

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import GerenciaDetail from '../GerenciaDetail'
import type { TACDetailModalProps } from '@/types/tac-cinema'

export default memo(function TACDetailModal({
  isOpen,
  onClose,
  gerencia
}: TACDetailModalProps) {

  if (!gerencia) return null

  const initials = gerencia.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — copia exacta del AvatarInfoModal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal — misma estructura pero mas ancho para GerenciaDetail */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[85vh] overflow-y-auto">

              {/* Tesla line — copia exacta */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

              {/* Header — copia exacta layout del AvatarInfoModal */}
              <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-b from-slate-800/50 to-transparent">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>

                {/* Avatar — copia exacta CSS */}
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl font-bold text-slate-300 border-2 border-slate-600 mb-4">
                  {initials}
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {gerencia.displayName}
                </h2>
                <p className="text-sm text-slate-400">
                  {gerencia.totalPersonas} personas · {gerencia.clasificadas} clasificadas
                </p>
              </div>

              {/* Info rows — adaptado al dominio gerencia */}
              <div className="px-6 pb-4 space-y-1">
                <InfoRow icon={Users} label="Personas evaluadas" value={`${gerencia.clasificadas} de ${gerencia.totalPersonas}`} />
                <InfoRow icon={Shield} label="Sucesion" value={formatSuccessionIndex(gerencia)} />
                {gerencia.plTotal > 0 && (
                  <InfoRow
                    icon={Users}
                    label="P&L en riesgo"
                    value={formatCurrencyCLP(gerencia.plTotal)}
                    tooltip={`Estimacion del costo si el talento en riesgo sale de la organizacion.\n\nIncluye:\n· Talento en riesgo de irse × sueldo anual × 1.25\n· Conocimiento critico en riesgo × sueldo anual × 1.25 × 1.5\n\nFuente salarial: configuracion de la empresa o promedio de mercado Chile.\nMetodologia: SHRM 2024.`}
                  />
                )}
              </div>

              {/* Separador — copia exacta */}
              <div className="mx-6 h-px bg-slate-800" />

              {/* Distribucion de talento — usa GerenciaDetail existente */}
              <div className="px-6 py-4">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4">
                  Distribucion de Talento
                </p>
                <GerenciaDetail gerencia={gerencia.full} />
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

// Indice de cobertura de sucesion
function formatSuccessionIndex(gerencia: { sucesoresTotal: number; full: { sucesores: { posicionesCriticas: number; total: number; enPlanFormal: number } } }): string {
  const pos = gerencia.full.sucesores.posicionesCriticas
  const suc = gerencia.full.sucesores.total
  if (pos === 0) return `${suc} sucesores`
  const indice = (suc / pos).toFixed(1)
  return `${indice}x cobertura · ${pos} pos · ${suc} suc`
}

// InfoRow — con tooltip Cinema Mode style
function InfoRow({
  icon: Icon,
  label,
  value,
  tooltip
}: {
  icon: typeof Users
  label: string
  value: string
  tooltip?: string
}) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div
      className="flex items-center gap-3 py-2 relative"
      onMouseEnter={() => tooltip && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 flex justify-between items-center">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm text-white font-medium">{value}</span>
      </div>

      {/* Tooltip Cinema Mode style */}
      {showTip && tooltip && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 z-[80] pointer-events-none"
          style={{ opacity: showTip ? 1 : 0, transition: 'opacity 0.15s ease-out' }}
        >
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl">
            {/* Tesla line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-xl bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {tooltip}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
