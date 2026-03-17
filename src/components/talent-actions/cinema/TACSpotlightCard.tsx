'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC SPOTLIGHT CARD — Paso 3: ¿Qué vas a hacer?
// Layout 2 columnas: avatar izq + acciones der
// Pasos 1-2 (TACGerenciaCover) ya explicaron QUÉ pasa y POR QUÉ
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Home, Shield, Info, Lightbulb, Calendar, Mail, Flag } from 'lucide-react'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import { getPatternLabel } from '@/config/tacLabels'
import { getGerenciaPatternNarrative } from '@/config/GerenciaPatternNarratives'
import type { GerenciaPattern } from '@/config/GerenciaPatternNarratives'
import TACDetailModal from './TACDetailModal'
import type { TACSpotlightCardProps } from '@/types/tac-cinema'

const REQUIRES_ACTION = new Set(['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO'])

const PATTERN_KEYWORD: Record<string, string> = {
  QUEMADA: 'SOBRECARGA ESTRUCTURAL',
  FRAGIL: 'FUGA DE TALENTO',
  ESTANCADA: 'ESTANCAMIENTO',
  RIESGO_OCULTO: 'RIESGO OCULTO',
}

export default function TACSpotlightCard({
  gerencia,
  onBack,
  onOpenDetail
}: TACSpotlightCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null)

  const pattern = gerencia.pattern
  const requiresAction = pattern ? REQUIRES_ACTION.has(pattern) : false
  const patternNarrative = pattern && REQUIRES_ACTION.has(pattern)
    ? getGerenciaPatternNarrative(pattern as GerenciaPattern)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-y-auto md:overflow-visible">

        {/* LINEA TESLA */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />

        {/* Boton Volver */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <Home className="w-3 h-3" /> Inicio
        </button>

        {/* COLUMNA IZQUIERDA: Identidad (250px fijo) */}
        <div className="w-full md:w-[250px] md:flex-shrink-0 bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar CLICKEABLE */}
          <div
            onClick={() => setShowDetailModal(true)}
            className="relative mb-6 cursor-pointer group"
          >
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700 shadow-2xl group-hover:border-cyan-500/50 transition-colors">
              {gerencia.displayName.charAt(0).toUpperCase()}
            </div>

            <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors flex items-center justify-center">
              <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Ver detalle
              </span>
            </div>

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

          {/* Info */}
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

            {gerencia.plTotal > 0 && (
              <p className="text-sm text-slate-300 font-semibold">
                {formatCurrencyCLP(gerencia.plTotal)}
                <span className="text-xs text-slate-500 font-normal block">en riesgo</span>
              </p>
            )}

            {gerencia.sucesoresTotal > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                <Shield className="w-3 h-3" />
                {gerencia.sucesoresEnPlan} de {gerencia.sucesoresTotal} con plan
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA — Paso 3: ¿Qué vas a hacer? */}
        <div className="flex-1 flex flex-col pt-4 bg-gradient-to-br from-[#0F172A] to-[#162032]">
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-5">

            {/* 1. NARRATIVA — PROTAGONISTA */}
            {patternNarrative && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(34, 211, 238, 0.08)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                  <div>
                    {pattern && PATTERN_KEYWORD[pattern] && (
                      <span className="text-cyan-400 font-bold text-xs tracking-wider block mb-2">
                        {PATTERN_KEYWORD[pattern]}
                      </span>
                    )}
                    <p className="text-[#E2E8F0] text-base leading-[1.6]">
                      {patternNarrative.coachingTip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TESLA LINE SEPARADOR */}
            <div
              className="h-px my-1.5"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)',
              }}
            />

            {/* 3-5. ACCIONES (solo si requiere acción) */}
            {pattern && requiresAction && !gerencia.dataInsufficient && (
              <>
                {/* 3. CTA OUTLINE — Agendar Comité (consecuencia, discreto) */}
                <div className="relative">
                  <div
                    className="w-full h-12 rounded-full bg-transparent border-2 border-cyan-400 text-cyan-400 font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-colors hover:bg-cyan-400 hover:text-[#0F172A]"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Agendar Comité de Riesgo</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setVisibleTooltip(visibleTooltip === 'comite' ? null : 'comite')
                      }}
                      className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  {visibleTooltip === 'comite' && patternNarrative && (
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 backdrop-blur rounded-xl p-3 mt-2">
                      {patternNarrative.actions.agendar_comite.tooltip}
                    </p>
                  )}
                </div>

                {/* 4. ACCIONES GHOST — 2 en fila */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Notificar */}
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-full bg-transparent border border-slate-600/40 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors hover:border-cyan-400/50 hover:text-cyan-400 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Notificar</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setVisibleTooltip(visibleTooltip === 'notificar' ? null : 'notificar')
                        }}
                        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {visibleTooltip === 'notificar' && patternNarrative && (
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 backdrop-blur rounded-lg p-2.5 mt-1.5">
                        {patternNarrative.actions.notificar.tooltip}
                      </p>
                    )}
                  </div>

                  {/* Marcar */}
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-full bg-transparent border border-slate-600/40 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors hover:border-cyan-400/50 hover:text-cyan-400 cursor-pointer"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Marcar</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setVisibleTooltip(visibleTooltip === 'marcar' ? null : 'marcar')
                        }}
                        className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {visibleTooltip === 'marcar' && patternNarrative && (
                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 backdrop-blur rounded-lg p-2.5 mt-1.5">
                        {patternNarrative.actions.marcar.tooltip}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 5. LINK "Ver las X personas" */}
            <button
              onClick={() => setShowDetailModal(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors text-left"
            >
              Ver las {gerencia.clasificadas} personas →
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <TACDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        gerencia={gerencia}
      />
    </motion.div>
  )
}
