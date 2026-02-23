'use client'

import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface SelectionItem {
  competencyCode: string
  competencyName: string
  actualScore: number
  targetScore: number
  rawGap: number
  status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  category: 'URGENTE' | 'IMPACTO' | 'QUICK_WIN' | 'POTENCIAR'
  categoryLabel: string
  categoryColor: string
  narrative: string
}

interface PDISelectionListProps {
  items: SelectionItem[]
  preSelected: string[]
  maxSelection?: number
  employeeName?: string
  onConfirm: (selectedCodes: string[]) => void
  onBack?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

// Labels legibles para categorías
const CATEGORY_LABELS: Record<string, string> = {
  URGENTE: 'Brecha Crítica',
  IMPACTO: 'Alto Impacto',
  QUICK_WIN: 'Quick Win',
  POTENCIAR: 'Potenciar'
}

// Badges minimalistas (baja opacidad)
const BADGE_STYLES: Record<string, string> = {
  URGENTE: 'bg-red-500/10 text-red-400 border-red-500/20',
  IMPACTO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  QUICK_WIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  POTENCIAR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS (Cinema Mode v2.0)
// ════════════════════════════════════════════════════════════════════════════

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PDISelectionList({
  items,
  preSelected,
  maxSelection = 6,
  employeeName,
  onConfirm,
  onBack
}: PDISelectionListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preSelected))

  const toggleSelection = useCallback((code: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else if (next.size < maxSelection) {
        next.add(code)
      }
      return next
    })
  }, [maxSelection])

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected))
  }, [selected, onConfirm])

  const selectedCount = selected.size
  const canContinue = selectedCount >= 1
  // Normalizador FocalizaHR: "NUÑEZ,MARIA ANTONIETA" → "María"
  const firstName = employeeName
    ? formatDisplayName(employeeName, 'short').split(' ')[0]
    : 'el colaborador'

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* GRID PRINCIPAL: Split-View Cinema Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">

        {/* COLUMNA IZQUIERDA: Asistente Ejecutivo (Sticky) */}
        <div className="lg:col-span-4 lg:sticky lg:top-0 lg:h-screen">
          <div className="relative h-full flex flex-col p-6 lg:p-8">

            {/* Línea Tesla Superior */}
            <div
              className="absolute top-0 left-0 right-0 h-px
                bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent"
              style={{ boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)' }}
            />

            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/50 -z-10" />

            {/* Badge de paso */}
            <div className="flex items-center gap-2 mb-4 lg:mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Paso 1 de 2 · Selección IA
                </span>
              </div>
            </div>

            {/* Título con gradiente */}
            <h2 className="text-2xl lg:text-3xl font-light mb-1
              bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Plan de desarrollo
            </h2>

            <p className="text-xl lg:text-2xl font-semibold text-white mb-6 lg:mb-8">
              para {firstName}
            </p>

            {/* Contador Visual Elegante */}
            <div className="flex items-center gap-4 py-4 lg:py-6 border-y border-slate-800/50 mb-4 lg:mb-6">
              <div className="relative">
                <div className="text-5xl lg:text-6xl font-extralight text-white">
                  {selectedCount}
                </div>
                {selectedCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 w-3 h-3 bg-cyan-400 rounded-full"
                    style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.6)' }}
                  />
                )}
              </div>
              <div className="text-sm text-slate-400 leading-relaxed">
                de {maxSelection}<br/>
                <span className="text-slate-500">seleccionados</span>
              </div>
            </div>

            {/* Narrativa Estratégica - Solo desktop */}
            <div className="hidden lg:block flex-1 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Detectamos <span className="text-white font-medium">{items.length} oportunidades</span> de
                desarrollo, es superior al promedio. Como líder, tú conoces a {firstName}. Para garantizar
                el éxito del plan, te pedimos priorizar sabiamente: los planes con más de 6 objetivos
                simultáneos rara vez se cumplen.
              </p>

              {/* Tip destacado */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Selecciona un máximo de <span className="text-white font-medium">4 prioridades críticas</span> y{' '}
                  <span className="text-purple-400 font-medium">2 victorias rápidas</span>.
                </p>
              </div>
            </div>

            {/* CTA Desktop - Solo visible en lg+ */}
            <div className="hidden lg:flex flex-col gap-3 mt-auto pt-6">
              {onBack && (
                <GhostButton
                  icon={ArrowLeft}
                  onClick={onBack}
                  size="md"
                >
                  Atrás
                </GhostButton>
              )}

              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleConfirm}
                disabled={!canContinue}
                size="lg"
                glow={canContinue}
              >
                Priorizar {selectedCount} {selectedCount === 1 ? 'foco' : 'focos'}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tablero de Selección (Scrollable) */}
        <div className="lg:col-span-8 overflow-y-auto scrollbar-hide">
          <div className="p-4 lg:p-8 pb-32 lg:pb-8">

            {/* Header móvil compacto */}
            <div className="lg:hidden text-center mb-6">
              <p className="text-sm text-slate-400">
                {items.length} brechas detectadas · Selecciona hasta {maxSelection}
              </p>
            </div>

            {/* Grid de Tarjetas con Stagger */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3 lg:space-y-4"
            >
              {items.map((item) => {
                const isSelected = selected.has(item.competencyCode)
                const isDisabled = !isSelected && selectedCount >= maxSelection

                return (
                  <motion.button
                    key={item.competencyCode}
                    variants={cardVariants}
                    whileHover={!isDisabled ? { scale: 1.015, y: -2 } : {}}
                    whileTap={!isDisabled ? { scale: 0.99 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={() => toggleSelection(item.competencyCode)}
                    disabled={isDisabled}
                    className={cn(
                      // Base - Ticket limpio
                      'group relative w-full text-left transition-all duration-300',
                      'rounded-xl overflow-hidden',
                      // Glassmorphism
                      'bg-slate-900/50 backdrop-blur-xl',
                      // Bordes según estado
                      isSelected
                        ? 'border border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.12)]'
                        : 'border border-slate-800/80 hover:border-slate-700/80',
                      // Disabled
                      isDisabled && 'opacity-35 cursor-not-allowed'
                    )}
                  >
                    {/* ═══ INDICADOR DE TICKET ACTIVO (Barra lateral izquierda) ═══ */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scaleY: 0, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          exit={{ scaleY: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute left-0 top-0 bottom-0 w-1 origin-center
                            bg-gradient-to-b from-cyan-400 to-cyan-500"
                          style={{ boxShadow: '0 0 12px rgba(34, 211, 238, 0.5)' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* ═══ CONTENIDO DEL TICKET ═══ */}
                    <div className={cn(
                      'p-3 lg:p-4 transition-all duration-300',
                      isSelected && 'pl-5 lg:pl-6'
                    )}>
                      {/* Row 1: Nombre de competencia + Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                          'font-medium text-sm lg:text-base transition-colors duration-300',
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        )}>
                          {item.competencyName}
                        </span>

                        {/* Badge minimalista */}
                        <span className={cn(
                          'px-2 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider',
                          BADGE_STYLES[item.category]
                        )}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>

                      {/* Row 2: Métricas sutiles */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          Brecha:{' '}
                          <span className={cn(
                            'font-medium',
                            item.rawGap >= 1.5 ? 'text-red-400/80' :
                            item.rawGap >= 1 ? 'text-amber-400/80' : 'text-slate-400'
                          )}>
                            {Math.abs(item.rawGap).toFixed(1)} pts
                          </span>
                        </span>

                        <span className="text-slate-700">|</span>

                        <span className="text-slate-500">
                          {item.actualScore.toFixed(1)}
                          <span className="text-slate-600 mx-1">→</span>
                          <span className="text-cyan-400/70">{item.targetScore.toFixed(1)}</span>
                        </span>
                      </div>
                    </div>

                    {/* ═══ CHECK SUTIL EN ESQUINA ═══ */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute top-3 right-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50
                            flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-cyan-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* FOOTER MOBILE: CTA Sticky Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none" />

        <div className="bg-[#0F172A]/95 backdrop-blur-xl border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <GhostButton
                icon={ArrowLeft}
                onClick={onBack}
                size="md"
              >
                Atrás
              </GhostButton>
            )}

            <div className="flex-1">
              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleConfirm}
                disabled={!canContinue}
                size="lg"
                glow={canContinue}
                fullWidth
              >
                Continuar ({selectedCount})
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
