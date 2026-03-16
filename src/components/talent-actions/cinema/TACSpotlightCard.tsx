'use client'

// Clonado de src/components/evaluator/cinema/SpotlightCard.tsx
// Misma estructura HTML/CSS exacta: Tesla line, back button, 2 columnas, avatar clickeable

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Home, Users, Shield } from 'lucide-react'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import { getPatternLabel, getQuadrantLabel } from '@/config/tacLabels'
import CheckoutPanel from '../CheckoutPanel'
import TACDetailModal from './TACDetailModal'
import type { TACSpotlightCardProps } from '@/types/tac-cinema'

const PATTERN_NARRATIVES: Record<string, string> = {
  FRAGIL: 'Talento clave concentrado en pocas personas. Riesgo de fuga en cadena.',
  QUEMADA: 'Equipo sobrecargado con senales de burnout activo.',
  ESTANCADA: 'Sin movimiento de talento en 12+ meses. Riesgo de desmotivacion.',
  EN_TRANSICION: 'Cambios recientes en estructura. Monitorear adaptacion.',
  RIESGO_OCULTO: 'Metricas estables pero patrones preocupantes bajo la superficie.',
  SALUDABLE: 'Equipo balanceado y en movimiento. Modelo a replicar.'
}

const REQUIRES_ACTION = new Set(['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO'])

export default function TACSpotlightCard({
  gerencia,
  onBack,
  onOpenDetail
}: TACSpotlightCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)

  const pattern = gerencia.pattern
  const narrative = pattern ? PATTERN_NARRATIVES[pattern] : null
  const requiresAction = pattern ? REQUIRES_ACTION.has(pattern) : false

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-y-auto md:overflow-visible">

        {/* LINEA TESLA — copia exacta */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />

        {/* Boton Volver — copia exacta CSS */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <Home className="w-3 h-3" /> Inicio
        </button>

        {/* COLUMNA IZQUIERDA: Identidad (250px fijo) — copia exacta layout */}
        <div className="w-full md:w-[250px] md:flex-shrink-0 bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar CLICKEABLE — copia exacta CSS del evaluator */}
          <div
            onClick={() => setShowDetailModal(true)}
            className="relative mb-6 cursor-pointer group"
          >
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700 shadow-2xl group-hover:border-cyan-500/50 transition-colors">
              {gerencia.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Indicador de "clickeable" — copia exacta */}
            <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors flex items-center justify-center">
              <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Ver detalle
              </span>
            </div>

            {/* Punto urgencia */}
            {requiresAction && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                    {getPatternLabel(pattern)}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Info — copia exacta layout del evaluator */}
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
              {gerencia.displayName}
            </h2>
            <p className="text-sm text-slate-400 font-medium mb-1">
              {gerencia.totalPersonas} personas
            </p>
            <p className="text-xs text-slate-600 mb-3">
              {gerencia.clasificadas} clasificadas · ICC {gerencia.icc ?? 0}%
            </p>

            {/* P&L */}
            {gerencia.plTotal > 0 && (
              <p className="text-sm text-slate-300 font-semibold">
                {formatCurrencyCLP(gerencia.plTotal)}
                <span className="text-xs text-slate-500 font-normal block">en riesgo</span>
              </p>
            )}

            {/* Sucesores */}
            {gerencia.sucesoresTotal > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                <Shield className="w-3 h-3" />
                {gerencia.sucesoresEnPlan} de {gerencia.sucesoresTotal} con plan
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA — copia exacta layout: flex-1, min-h, bg gradient */}
        <div className="flex-1 flex flex-col min-h-[500px] pt-4 bg-gradient-to-br from-[#0F172A] to-[#162032]">
          <div className="flex-1 p-6 md:p-8 space-y-6">

            {/* Narrativa */}
            {narrative && (
              <p className="text-lg text-white font-light leading-relaxed">
                <span className="text-cyan-400 font-medium">{gerencia.displayName}</span>
                {': '}
                <span className="text-slate-300">{narrative}</span>
              </p>
            )}

            {/* Metricas grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricTile label="En fuga" value={gerencia.fugaCount} color="text-red-400" />
              <MetricTile label="Burnout" value={gerencia.burnoutCount} color="text-orange-400" />
              <MetricTile label="Motor" value={gerencia.motorCount} color="text-emerald-400" />
              <MetricTile label="Bajo rend." value={gerencia.bajoRendimientoCount} color="text-amber-400" />
            </div>

            {/* Link a detalle completo */}
            <button
              onClick={() => setShowDetailModal(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver distribucion de talento completa →
            </button>

            {/* Checkout — solo si patron no saludable y tiene datos */}
            {pattern && pattern !== 'SALUDABLE' && !gerencia.dataInsufficient && (
              <CheckoutPanel
                gerenciaId={gerencia.full.gerenciaId}
                gerenciaName={gerencia.displayName}
                pattern={pattern}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal — z-50 (equivalente a AvatarInfoModal) */}
      <TACDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        gerencia={gerencia}
      />
    </motion.div>
  )
}

function MetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  )
}
