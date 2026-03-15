'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC ORCHESTRATOR - Hub → Cover → Content
// src/components/talent-actions/TACOrchestrator.tsx
// Patrón: GuidedSummaryOrchestrator (split 25/75)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTalentActions } from '@/hooks/useTalentActions'
import TACLeftColumn from './TACLeftColumn'
import OrgHealthMap from './OrgHealthMap'
import GerenciaCover from './GerenciaCover'
import GerenciaDetail from './GerenciaDetail'

type ViewLevel = 'hub' | 'cover' | 'content'

const springTransition = { type: 'spring' as const, stiffness: 220, damping: 30 }

export default function TACOrchestrator() {
  const { orgMap, selectedGerencia, flaggedGerencias, loading, error, selectGerencia, clearSelection } = useTalentActions()
  const [viewLevel, setViewLevel] = useState<ViewLevel>('hub')

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleSelectGerencia = useCallback((id: string) => {
    selectGerencia(id)
    setViewLevel('cover')
  }, [selectGerencia])

  const handleEnterContent = useCallback(() => {
    setViewLevel('content')
  }, [])

  const handleBack = useCallback(() => {
    if (viewLevel === 'content') {
      setViewLevel('cover')
    } else if (viewLevel === 'cover') {
      setViewLevel('hub')
      clearSelection()
    }
  }, [viewLevel, clearSelection])

  const handleBackToHub = useCallback(() => {
    setViewLevel('hub')
    clearSelection()
  }, [clearSelection])

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin relative" />
        </div>
      </div>
    )
  }

  if (error || !orgMap) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-slate-400">{error || 'Sin datos disponibles'}</p>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] p-3 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springTransition}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col lg:flex-row relative overflow-hidden min-h-[600px]">

          {/* TESLA LINE */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE'
            }}
          />

          {/* COLUMNA IZQUIERDA (25%) — Contexto fijo */}
          <TACLeftColumn
            orgStats={orgMap.orgStats}
            salarySource={orgMap.salarySource}
            viewLevel={viewLevel}
            selectedGerencia={selectedGerencia}
            onBackToHub={handleBackToHub}
          />

          {/* COLUMNA DERECHA (75%) — Navegación animada */}
          <div className="w-full lg:w-[75%] min-h-[500px] flex flex-col">

            {/* Back button */}
            {viewLevel !== 'hub' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors p-4 pb-0 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {viewLevel === 'content' ? 'Volver a portada' : 'Volver al mapa'}
              </motion.button>
            )}

            <AnimatePresence mode="wait">

              {/* NIVEL 1: HUB */}
              {viewLevel === 'hub' && (
                <motion.div
                  key="hub"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={springTransition}
                  className="flex-1 p-4 md:p-8"
                >
                  <OrgHealthMap
                    gerencias={orgMap.gerencias}
                    orgStats={orgMap.orgStats}
                    flaggedGerencias={flaggedGerencias}
                    onSelectGerencia={handleSelectGerencia}
                  />
                </motion.div>
              )}

              {/* NIVEL 2: COVER */}
              {viewLevel === 'cover' && selectedGerencia && (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={springTransition}
                  className="flex-1 p-4 md:p-8"
                >
                  <GerenciaCover
                    gerencia={selectedGerencia}
                    onEnterContent={handleEnterContent}
                  />
                </motion.div>
              )}

              {/* NIVEL 3: CONTENT */}
              {viewLevel === 'content' && selectedGerencia && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={springTransition}
                  className="flex-1 p-4 md:p-8"
                >
                  <GerenciaDetail
                    gerencia={selectedGerencia}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
