'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Save, Send } from 'lucide-react'
import PDISuggestionCard from './PDISuggestionCard'

interface PDISuggestionWizardProps {
  employeeId: string
  cycleId: string
  employeeName: string
  onComplete?: (pdiId: string) => void
}

export default function PDISuggestionWizard({
  employeeId,
  cycleId,
  employeeName,
  onComplete
}: PDISuggestionWizardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdi, setPdi] = useState<any>(null)
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Guard against double-fire (StrictMode, re-renders)
  const generatingRef = useRef(false)

  // Elapsed timer during loading
  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [isLoading])

  // Generar PDI con sugerencias al montar — con guard
  useEffect(() => {
    if (generatingRef.current) return
    generatingRef.current = true

    async function generatePDI() {
      try {
        setError(null)
        const res = await fetch('/api/pdi/generate-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, cycleId })
        })
        const data = await res.json()

        if (data.success) {
          setPdi(data.data)
          setSelectedGoals(new Set(data.data.goals.map((g: any) => g.id)))
        } else if (res.status === 409 && data.existingId) {
          onComplete?.(data.existingId)
        } else {
          setError(data.error || 'Error generando sugerencias')
        }
      } catch (err) {
        console.error('Error generating PDI:', err)
        setError('Error de conexión al generar sugerencias')
      } finally {
        setIsLoading(false)
      }
    }
    generatePDI()
  }, [employeeId, cycleId, onComplete])

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals(prev => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }, [])

  const handleSaveDraft = useCallback(async () => {
    if (!pdi) return
    setIsSaving(true)
    try {
      const goalsToRemove = pdi.goals
        .filter((g: any) => !selectedGoals.has(g.id))
        .map((g: any) => ({ id: g.id, _delete: true }))
      const goalsToKeep = pdi.goals
        .filter((g: any) => selectedGoals.has(g.id))
        .map((g: any) => ({ id: g.id }))

      await fetch(`/api/pdi/${pdi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: [...goalsToKeep, ...goalsToRemove]
        })
      })
    } catch (err) {
      console.error('Error saving draft:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdi, selectedGoals])

  const handleSubmitForReview = useCallback(async () => {
    if (!pdi) return
    setIsSaving(true)
    try {
      await handleSaveDraft()

      const res = await fetch(`/api/pdi/${pdi.id}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT_FOR_REVIEW' })
      })

      const data = await res.json()
      if (data.success) {
        onComplete?.(pdi.id)
      }
    } catch (err) {
      console.error('Error submitting:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdi, handleSaveDraft, onComplete])

  // Loading state with elapsed timer and progress hints
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full mb-4"
        />
        <p className="text-slate-400 mb-2">
          Analizando brechas de <span className="text-cyan-400 font-medium">{employeeName.split(' ')[0]}</span>...
        </p>
        <p className="text-slate-600 text-xs">
          {elapsed < 5
            ? 'Obteniendo resultados 360°...'
            : elapsed < 15
            ? 'Procesando competencias y gaps...'
            : elapsed < 30
            ? 'Generando objetivos de desarrollo...'
            : 'Esto puede tomar unos segundos más...'}
        </p>
        {elapsed > 3 && (
          <p className="text-slate-700 text-[10px] mt-2">{elapsed}s</p>
        )}
      </div>
    )
  }

  // Error state with retry
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              generatingRef.current = false
              setError(null)
              setIsLoading(true)
              setElapsed(0)
              // Re-trigger the effect
              const run = async () => {
                try {
                  const res = await fetch('/api/pdi/generate-suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId, cycleId })
                  })
                  const data = await res.json()
                  if (data.success) {
                    setPdi(data.data)
                    setSelectedGoals(new Set(data.data.goals.map((g: any) => g.id)))
                  } else if (res.status === 409 && data.existingId) {
                    onComplete?.(data.existingId)
                  } else {
                    setError(data.error || 'Error generando sugerencias')
                  }
                } catch (err) {
                  setError('Error de conexión al generar sugerencias')
                } finally {
                  setIsLoading(false)
                }
              }
              run()
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!pdi) return null

  const firstName = employeeName.split(' ')[0]

  return (
    <div className="space-y-6">

      {/* Header Cinema Split 35/65 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        className="relative bg-[#0F172A]/90 backdrop-blur-2xl rounded-[24px] border border-slate-800 overflow-hidden"
      >
        {/* Línea Tesla */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />

        <div className="flex p-6 gap-6">
          {/* Info (35%) */}
          <div className="flex-[35] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Plan de Desarrollo
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {firstName}
            </h2>
            <p className="text-sm text-slate-400">
              Basado en resultados del ciclo actual
            </p>
          </div>

          {/* Métrica (65%) */}
          <div className="flex-[65] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {selectedGoals.size}/{pdi.goals?.length || 0}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Objetivos seleccionados
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sección de sugerencias */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
          Sugerencias Inteligentes
        </h3>

        {/* Carrusel horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {pdi.goals?.map((goal: any, index: number) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 220, damping: 30 }}
              className="flex-shrink-0 w-[320px]"
            >
              <PDISuggestionCard
                goal={goal}
                isSelected={selectedGoals.has(goal.id)}
                onToggle={() => toggleGoal(goal.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar borrador'}</span>
        </button>

        <button
          onClick={handleSubmitForReview}
          disabled={isSaving || selectedGoals.size === 0}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSaving ? 'Enviando...' : 'Enviar para revisión'}</span>
        </button>
      </div>
    </div>
  )
}
