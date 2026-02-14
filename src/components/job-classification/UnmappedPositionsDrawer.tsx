'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import PositionAssignmentCard from './PositionAssignmentCard'

// ============================================================================
// TYPES
// ============================================================================

interface UnmappedPosition {
  position: string
  employeeCount: number
  employeeIds: string[]
  suggestedLevel: string | null
  suggestedAcotado: string | null
  suggestedTrack: string
}

interface UnmappedPositionsDrawerProps {
  positions: UnmappedPosition[]
  accountId?: string
  onClose: () => void
  onAssignComplete: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const JOB_LEVELS = [
  { value: 'gerente_director', label: 'Gerente / Director', track: 'EJECUTIVO', color: 'text-purple-400' },
  { value: 'subgerente_subdirector', label: 'Subgerente / Subdirector', track: 'MANAGER', color: 'text-cyan-400' },
  { value: 'jefe', label: 'Jefe / Head', track: 'MANAGER', color: 'text-cyan-400' },
  { value: 'supervisor_coordinador', label: 'Supervisor / Coordinador', track: 'MANAGER', color: 'text-cyan-400' },
  { value: 'profesional_analista', label: 'Profesional / Analista', track: 'COLABORADOR', color: 'text-blue-400' },
  { value: 'asistente_otros', label: 'Asistente / Otros', track: 'COLABORADOR', color: 'text-blue-400' },
  { value: 'operativo_auxiliar', label: 'Operativo / Auxiliar', track: 'COLABORADOR', color: 'text-blue-400' }
] as const

const TRACK_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  EJECUTIVO: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  MANAGER: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  COLABORADOR: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default memo(function UnmappedPositionsDrawer({
  positions,
  accountId,
  onClose,
  onAssignComplete
}: UnmappedPositionsDrawerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    positions.length > 0 ? 0 : null
  )
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localPositions, setLocalPositions] = useState(positions)

  const filtered = searchQuery
    ? localPositions.filter(p =>
        p.position.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : localPositions

  const selectedPosition = selectedIndex !== null ? filtered[selectedIndex] : null

  // Auto-fill suggested level when selecting a position
  const handleSelectPosition = (index: number) => {
    setSelectedIndex(index)
    const pos = filtered[index]
    setSelectedLevel(pos?.suggestedLevel || null)
  }

  // Get resulting track for selected level
  const resultingTrack = selectedLevel
    ? JOB_LEVELS.find(l => l.value === selectedLevel)?.track || 'COLABORADOR'
    : null

  const handleAssign = async () => {
    if (!selectedPosition || !selectedLevel) return

    setIsSubmitting(true)
    try {
      const body: Record<string, string> = {
        position: selectedPosition.position,
        standardJobLevel: selectedLevel
      }
      if (accountId) body.accountId = accountId

      const res = await fetch('/api/job-classification/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const json = await res.json()
      if (json.success) {
        // Remove assigned position from local list
        const remaining = localPositions.filter(
          p => p.position.toLowerCase() !== selectedPosition.position.toLowerCase()
        )
        setLocalPositions(remaining)

        // Select next or null
        if (remaining.length > 0) {
          const nextIdx = Math.min(selectedIndex ?? 0, remaining.length - 1)
          setSelectedIndex(nextIdx)
          setSelectedLevel(remaining[nextIdx]?.suggestedLevel || null)
        } else {
          setSelectedIndex(null)
          setSelectedLevel(null)
        }

        onAssignComplete()
      }
    } catch (err) {
      console.error('[Drawer] Assign error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptAllSuggestions = async () => {
    const withSuggestions = localPositions.filter(p => p.suggestedLevel)
    if (withSuggestions.length === 0) return

    setIsSubmitting(true)
    try {
      const assignments = withSuggestions.map(p => ({
        position: p.position,
        standardJobLevel: p.suggestedLevel!
      }))

      const body: Record<string, unknown> = { assignments }
      if (accountId) body.accountId = accountId

      const res = await fetch('/api/job-classification/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const json = await res.json()
      if (json.success) {
        // Remove all assigned
        const assignedPositions = new Set(
          withSuggestions.map(p => p.position.toLowerCase())
        )
        const remaining = localPositions.filter(
          p => !assignedPositions.has(p.position.toLowerCase())
        )
        setLocalPositions(remaining)
        setSelectedIndex(remaining.length > 0 ? 0 : null)
        setSelectedLevel(remaining[0]?.suggestedLevel || null)
        onAssignComplete()
      }
    } catch (err) {
      console.error('[Drawer] Batch assign error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const trackStyle = resultingTrack ? TRACK_STYLES[resultingTrack] : null
  const suggestedCount = localPositions.filter(p => p.suggestedLevel).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative ml-auto w-full max-w-4xl h-full bg-[#0F172A]/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE 30%, #A78BFA 70%, transparent)',
            boxShadow: '0 0 12px rgba(34,211,238,0.3)'
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Resolver Pendientes</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {localPositions.length} cargo{localPositions.length !== 1 ? 's' : ''} sin clasificar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: split layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Position list */}
          <div className="w-full md:w-1/2 border-r border-slate-800 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Batch accept */}
            {suggestedCount > 0 && (
              <div className="px-3 py-2 border-b border-slate-800/50">
                <GhostButton
                  size="sm"
                  icon={Sparkles}
                  onClick={handleAcceptAllSuggestions}
                  isLoading={isSubmitting}
                  fullWidth
                >
                  Aceptar {suggestedCount} sugerencias
                </GhostButton>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filtered.map((pos, idx) => (
                <PositionAssignmentCard
                  key={pos.position}
                  position={pos.position}
                  employeeCount={pos.employeeCount}
                  suggestedLevel={pos.suggestedLevel}
                  suggestedTrack={pos.suggestedTrack}
                  isSelected={selectedIndex === idx}
                  onClick={() => handleSelectPosition(idx)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-300">Todos los cargos clasificados</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Assignment panel */}
          <div className="hidden md:flex w-1/2 flex-col p-4 md:p-6">
            {selectedPosition ? (
              <>
                {/* Selected position info */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cargo seleccionado
                  </p>
                  <p className="text-base font-semibold text-white">
                    {selectedPosition.position}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedPosition.employeeCount} empleado{selectedPosition.employeeCount !== 1 ? 's' : ''} afectado{selectedPosition.employeeCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Suggestion badge */}
                {selectedPosition.suggestedLevel && (
                  <div className="flex items-center gap-2 mb-5 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sugerencia IA</p>
                      <p className="text-sm text-purple-300 font-medium">
                        {JOB_LEVELS.find(l => l.value === selectedPosition.suggestedLevel)?.label}
                      </p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px mb-5 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

                {/* Level selector */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Seleccionar nivel
                </p>
                <div className="space-y-1.5 mb-5 flex-1 overflow-y-auto">
                  {JOB_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setSelectedLevel(level.value)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm
                        ${selectedLevel === level.value
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-white'
                          : 'border-slate-700/30 bg-slate-800/20 text-slate-300 hover:border-slate-600 hover:bg-slate-800/40'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span>{level.label}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${level.color}`}>
                          {level.track}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Resulting track preview */}
                {trackStyle && resultingTrack && (
                  <div className={`rounded-xl p-3 border mb-5 ${trackStyle.bg} ${trackStyle.border}`}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Track resultante
                    </p>
                    <p className={`text-sm font-bold ${trackStyle.text}`}>
                      {resultingTrack}
                    </p>
                  </div>
                )}

                {/* Assign button */}
                <PrimaryButton
                  size="md"
                  fullWidth
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={handleAssign}
                  isLoading={isSubmitting}
                  disabled={!selectedLevel}
                >
                  Asignar y Siguiente
                </PrimaryButton>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-500">
                  Selecciona un cargo para asignar nivel
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})
