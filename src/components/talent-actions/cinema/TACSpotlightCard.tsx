'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC SPOTLIGHT CARD — Acto 3: ¿Qué vas a hacer?
//
// El CEO ya leyó el diagnóstico en Actos 1-2 (TACGerenciaCover).
// Aquí solo necesita SENTIR la urgencia y VER qué hacer.
//
// Diseño: flujo vertical limpio, sin cajas dentro de cajas.
// Referencia: dashboard/onboarding/inicio (Panel 1)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Home, Info, Calendar, Mail, Flag, ChevronRight, Loader2, ShieldCheck, Brain, X } from 'lucide-react'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import { getGerenciaPatternNarrative, getActionTooltip } from '@/config/GerenciaPatternNarratives'
import type { GerenciaPattern } from '@/config/GerenciaPatternNarratives'
import TACDetailModal from './TACDetailModal'
import type { TACSpotlightCardProps } from '@/types/tac-cinema'

const REQUIRES_ACTION = new Set(['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO'])

const PATTERN_TITLE: Record<string, [string, string]> = {
  QUEMADA: ['Sobrecarga', 'Estructural'],
  FRAGIL: ['Fuga de', 'Talento'],
  ESTANCADA: ['Equipo', 'Estancado'],
  RIESGO_OCULTO: ['Riesgo', 'Oculto'],
}

export default function TACSpotlightCard({
  gerencia,
  onBack,
  onOpenDetail
}: TACSpotlightCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const [confirmModal, setConfirmModal] = useState<string | null>(null)

  const pattern = gerencia.pattern
  const requiresAction = pattern ? REQUIRES_ACTION.has(pattern) : false
  const narrative = pattern && REQUIRES_ACTION.has(pattern)
    ? getGerenciaPatternNarrative(pattern as GerenciaPattern)
    : null

  const allActionsCompleted = completedActions.has('NOTIFY_HRBP')
    && completedActions.has('SCHEDULE_COMMITTEE')
    && completedActions.has('FLAG_FOR_REVIEW')

  // Cargar acciones ya ejecutadas al montar
  useEffect(() => {
    if (!gerencia.full?.gerenciaId) return
    fetch(`/api/talent-actions/checkout?gerenciaId=${gerencia.full.gerenciaId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.completedActions) {
          setCompletedActions(new Set(data.data.completedActions))
        }
      })
      .catch(() => {})
  }, [gerencia.full?.gerenciaId])

  const handleAction = async (actionCode: 'NOTIFY_HRBP' | 'SCHEDULE_COMMITTEE' | 'FLAG_FOR_REVIEW') => {
    if (executing || completedActions.has(actionCode)) return
    setExecuting(true)
    try {
      const res = await fetch('/api/talent-actions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gerenciaId: gerencia.full.gerenciaId,
          gerenciaName: gerencia.displayName,
          pattern,
          action: actionCode
        })
      })
      const data = await res.json()
      if (data.success) {
        setCompletedActions(prev => new Set([...prev, actionCode]))
        setConfirmModal(data.data?.contextMessage || data.data?.message || 'Acción registrada')
      }
    } catch (error) {
      console.error('[SpotlightCard] Error:', error)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-4xl my-auto"
    >
      <div className="bg-slate-950 border border-slate-800/50 rounded-2xl flex flex-col md:flex-row relative overflow-hidden">

        {/* Tesla line */}
        <div className="fhr-top-line absolute top-0 left-0 right-0 z-10" />

        {/* ═══════════════ COLUMNA IZQUIERDA ═══════════════ */}
        <div className="w-full md:w-[240px] md:flex-shrink-0 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/40">

          {/* Avatar */}
          <div
            onClick={() => setShowDetailModal(true)}
            className="relative mb-5 cursor-pointer group"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl font-light text-slate-300 group-hover:border-cyan-500/30 transition-all duration-300">
              {gerencia.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-cyan-400 font-medium">Ver detalle</span>
            </div>
          </div>

          {/* Nombre + dato */}
          <h2 className="text-lg font-light text-white text-center tracking-tight mb-1">
            {gerencia.displayName}
          </h2>
          <p className="text-xs text-slate-600 text-center">
            {gerencia.totalPersonas} personas · {gerencia.clasificadas} en riesgo
          </p>
        </div>

        {/* ═══════════════ COLUMNA DERECHA ═══════════════ */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">

          {/* Volver — arriba derecha, sutil */}
          <button
            onClick={onBack}
            className="absolute top-5 right-6 z-10 text-slate-600 hover:text-slate-400 transition-colors duration-200 text-xs flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Inicio
          </button>

          {/* ——— Flujo vertical: todo respira ——— */}
          <div className="flex flex-col items-start gap-8">

            {/* 1. Título patrón — palabra blanca + palabra gradiente */}
            {pattern && PATTERN_TITLE[pattern] && (
              <div>
                <p className="text-[10px] text-slate-600 mb-3">
                  Diagnóstico
                </p>
                <h3 className="text-2xl md:text-3xl font-light tracking-tight">
                  <span className="text-white">{PATTERN_TITLE[pattern][0]}</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                    {PATTERN_TITLE[pattern][1]}
                  </span>
                </h3>
              </div>
            )}

            {/* 2. Narrativa — texto que fluye, sin caja */}
            {narrative && (
              <p className="text-slate-400 text-base md:text-lg font-light leading-relaxed max-w-lg">
                {narrative.coachingTip}
              </p>
            )}

            {/* 3. Dato duro — una línea sutil, como onboarding */}
            {gerencia.plTotal > 0 && (
              <p className="text-xs text-slate-500">
                {gerencia.clasificadas} personas en riesgo · {formatCurrencyCLP(gerencia.plTotal)} en costo potencial
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="h-px w-12 bg-white/10" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* 4. Acciones */}
            {pattern && requiresAction && !gerencia.dataInsufficient && (
              allActionsCompleted ? (
                /* Todas las acciones completadas */
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400 font-medium">Todas las acciones ejecutadas</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4 w-full max-w-md">

                  {/* CTA sólido — Agendar */}
                  {completedActions.has('SCHEDULE_COMMITTEE') ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Comité agendado</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAction('SCHEDULE_COMMITTEE')}
                      disabled={executing}
                      className="group flex items-center gap-3 px-6 py-3 rounded-full bg-cyan-400 text-slate-950 font-medium text-sm hover:bg-cyan-300 transition-all duration-300 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {executing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      <span>Agendar Comité de Riesgo</span>
                      {!executing && (
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all duration-300" />
                      )}
                    </button>
                  )}

                  {/* Acciones secundarias */}
                  <div className="flex items-center gap-5 pl-1">
                    {/* Notificar */}
                    {completedActions.has('NOTIFY_HRBP') ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Notificado</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAction('NOTIFY_HRBP')}
                        disabled={executing}
                        className="flex items-center gap-1.5 text-slate-600 text-sm hover:text-slate-400 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Notificar</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setVisibleTooltip(visibleTooltip === 'notificar' ? null : 'notificar')
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setVisibleTooltip(visibleTooltip === 'notificar' ? null : 'notificar') } }}
                          className="opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <Info className="w-3 h-3" />
                        </span>
                      </button>
                    )}

                    {/* Marcar */}
                    {completedActions.has('FLAG_FOR_REVIEW') ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Marcada</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAction('FLAG_FOR_REVIEW')}
                        disabled={executing}
                        className="flex items-center gap-1.5 text-slate-600 text-sm hover:text-slate-400 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Marcar</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setVisibleTooltip(visibleTooltip === 'marcar' ? null : 'marcar')
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setVisibleTooltip(visibleTooltip === 'marcar' ? null : 'marcar') } }}
                          className="opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <Info className="w-3 h-3" />
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Tooltip expandible */}
                  {visibleTooltip && narrative && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-slate-500 leading-relaxed pl-1 max-w-md"
                    >
                      {visibleTooltip === 'notificar'
                        ? getActionTooltip(pattern as GerenciaPattern, 'notificar')
                        : visibleTooltip === 'marcar'
                          ? getActionTooltip(pattern as GerenciaPattern, 'marcar')
                          : null
                      }
                    </motion.p>
                  )}
                </div>
              )
            )}

            {/* 5. Link personas */}
            <button
              onClick={() => setShowDetailModal(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
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

      {/* Modal de confirmación post-acción */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop glassmorphism */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center"
          >
            {/* Ícono Brain */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            {/* Mensaje contextual */}
            <p className="text-slate-300 text-base leading-relaxed mb-8">
              {confirmModal}
            </p>

            {/* Botón Entendido */}
            <button
              onClick={() => setConfirmModal(null)}
              className="px-8 py-2.5 rounded-full bg-transparent border border-cyan-500/40 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all duration-300"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
