'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC ORCHESTRATOR - Landing → Gerencias/Personas → Cover → Content
// src/components/talent-actions/TACOrchestrator.tsx
//
// Revelacion progresiva:
// Landing: Solo headline + mision + CTA (sin sidebar, sin grid)
// Gerencias: OrgHealthMap (Pilar 1) con sidebar
// Personas: TalentTreemap (Pilar 2) con sidebar
// Cover/Content: Drill-down de gerencia individual
// ════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTalentActions } from '@/hooks/useTalentActions'
import TACLeftColumn from './TACLeftColumn'
import TACLanding from './TACLanding'
import OrgHealthMap from './OrgHealthMap'
import TalentTreemap from './TalentTreemap'
import GerenciaCover from './GerenciaCover'
import GerenciaDetail from './GerenciaDetail'

type ViewLevel = 'landing' | 'gerencias' | 'personas' | 'cover' | 'content'

const springTransition = { type: 'spring' as const, stiffness: 220, damping: 30 }

export default function TACOrchestrator() {
  const { orgMap, selectedGerencia, flaggedGerencias, userRole, loading, error, selectGerencia, clearSelection } = useTalentActions()
  const [viewLevel, setViewLevel] = useState<ViewLevel>('landing')

  // RBAC: AREA_MANAGER salta landing, va directo a Pilar 2
  const isAreaManager = userRole === 'AREA_MANAGER'

  useEffect(() => {
    if (isAreaManager && viewLevel === 'landing') {
      setViewLevel('personas')
    }
  }, [isAreaManager, viewLevel])

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleNavigateFromLanding = useCallback((view: 'gerencias' | 'personas') => {
    setViewLevel(view)
  }, [])

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
      setViewLevel(isAreaManager ? 'personas' : 'gerencias')
      clearSelection()
    } else if (viewLevel === 'gerencias' || viewLevel === 'personas') {
      if (!isAreaManager) {
        setViewLevel('landing')
        clearSelection()
      }
    }
  }, [viewLevel, clearSelection, isAreaManager])

  const handleBackToLanding = useCallback(() => {
    if (isAreaManager) return
    setViewLevel('landing')
    clearSelection()
  }, [clearSelection, isAreaManager])

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

  // Landing: sin sidebar, sin chrome — solo la decision
  const showSidebar = viewLevel !== 'landing'

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

          {/* COLUMNA IZQUIERDA (25%) — Solo cuando NO es landing */}
          {showSidebar && (
            <TACLeftColumn
              orgStats={orgMap.orgStats}
              salarySource={orgMap.salarySource}
              viewLevel={viewLevel === 'gerencias' || viewLevel === 'personas' ? 'hub' : viewLevel as 'cover' | 'content'}
              selectedGerencia={selectedGerencia}
              onBackToHub={handleBackToLanding}
            />
          )}

          {/* COLUMNA DERECHA — Navegacion animada */}
          <div className={`${showSidebar ? 'w-full lg:w-[75%]' : 'w-full'} min-h-[500px] flex flex-col`}>

            {/* Back button (no en landing, no para AREA_MANAGER en personas) */}
            {viewLevel !== 'landing' && !(isAreaManager && viewLevel === 'personas') && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors p-4 pb-0 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {viewLevel === 'content'
                  ? 'Volver a portada'
                  : viewLevel === 'cover'
                    ? 'Volver a gerencias'
                    : 'Volver'
                }
              </motion.button>
            )}

            <AnimatePresence mode="wait">

              {/* LANDING — Solo headline + mision + CTA */}
              {viewLevel === 'landing' && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={springTransition}
                  className="flex-1"
                >
                  <TACLanding
                    orgMap={orgMap}
                    onNavigate={handleNavigateFromLanding}
                    userRole={userRole}
                  />
                </motion.div>
              )}

              {/* PILAR 1: Vision por Gerencias */}
              {viewLevel === 'gerencias' && (
                <motion.div
                  key="gerencias"
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

              {/* PILAR 2: Mapa de Talento por Personas */}
              {viewLevel === 'personas' && (
                <motion.div
                  key="personas"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={springTransition}
                  className="flex-1 p-4 md:p-8"
                >
                  <TalentTreemap />
                </motion.div>
              )}

              {/* COVER */}
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

              {/* CONTENT */}
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
