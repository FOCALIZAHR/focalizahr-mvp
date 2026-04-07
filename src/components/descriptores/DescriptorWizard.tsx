'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR WIZARD — Layer 2: Validación del cargo
// Filosofía: "Todo viene pre-llenado. HR solo desmarca y confirma."
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, CheckCircle } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import DescriptorTaskList from './DescriptorTaskList'
import DescriptorTaskSearch from './DescriptorTaskSearch'
import type { DescriptorProposal, ProposedTask } from '@/lib/services/JobDescriptorService'

interface DescriptorWizardProps {
  proposal: DescriptorProposal
  onBack: () => void
  onHome: () => void
  onNextJob: (jobTitle: string) => void
}

export default memo(function DescriptorWizard({
  proposal,
  onBack,
  onHome,
  onNextJob,
}: DescriptorWizardProps) {
  const [tasks, setTasks] = useState<ProposedTask[]>(proposal.tasks)
  const [purpose, setPurpose] = useState(proposal.purpose ?? '')
  const [editingPurpose, setEditingPurpose] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [descriptorId, setDescriptorId] = useState<string | null>(null)

  const activeTasks = tasks.filter(t => t.isActive)

  // Toggle tarea ON/OFF
  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.taskId === taskId ? { ...t, isActive: !t.isActive } : t
    ))
  }, [])

  // Agregar tarea de otra área
  const handleAddTask = useCallback((task: ProposedTask) => {
    setTasks(prev => [...prev, { ...task, isActive: true, isFromOnet: true }])
    setShowSearch(false)
  }, [])

  // Guardar + Confirmar
  const handleConfirm = useCallback(async () => {
    try {
      setSaving(true)

      // 1. Guardar como DRAFT
      const saveRes = await fetch('/api/descriptors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: proposal.jobTitle,
          socCode: proposal.socCode,
          purpose,
          purposeSource: editingPurpose ? 'client_edited' : 'onet_generated',
          responsibilities: tasks,
          competencies: proposal.competencies,
          matchConfidence: proposal.matchConfidence,
        }),
      })

      if (!saveRes.ok) throw new Error('Error al guardar')
      const saveJson = await saveRes.json()
      const id = saveJson.data?.id

      if (!id) throw new Error('No se obtuvo ID del descriptor')

      // 2. Confirmar
      const confirmRes = await fetch('/api/descriptors/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptorId: id }),
      })

      if (!confirmRes.ok) throw new Error('Error al confirmar')

      setDescriptorId(id)
      setConfirmed(true)
    } catch (e: any) {
      console.error('[DescriptorWizard] confirm error:', e)
      alert(e.message ?? 'Error al confirmar descriptor')
    } finally {
      setSaving(false)
    }
  }, [proposal, tasks, purpose, editingPurpose])

  // ── POST-CONFIRMACIÓN ──
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <CheckCircle className="w-16 h-16 text-cyan-400 mb-6" />
        <h2 className="text-2xl font-extralight text-white mb-2">
          Descriptor confirmado
        </h2>
        <p className="text-sm font-light text-slate-400 max-w-md mb-8">
          Este descriptor ahora es el estándar contra el que se evaluará a las personas con este cargo.
        </p>
        <p className="text-xs text-slate-600 mb-10">
          Ahorro estimado: 2.5 horas de consultoría.
        </p>
        <div className="flex items-center gap-4">
          <PrimaryButton onClick={onBack}>
            Siguiente cargo
          </PrimaryButton>
          <button
            onClick={onHome}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Volver al ranking
          </button>
        </div>
      </motion.div>
    )
  }

  // ── WIZARD ──
  return (
    <div className="space-y-8">
      {/* Header: Back + Home */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ranking
        </button>
        <button
          onClick={onHome}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <Home className="w-3.5 h-3.5" />
          Portada
        </button>
      </div>

      {/* Título split */}
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">
          {proposal.jobTitle}
        </h2>
        <p className="text-xl font-light fhr-title-gradient mt-0.5">
          Descriptor Propuesto
        </p>
      </div>

      {/* Card narrativa de alivio */}
      <div className="fhr-glass-card p-6">
        <p className="text-sm font-light text-slate-300 leading-relaxed">
          Hemos mapeado este cargo usando inteligencia de mercado.
          Desmarca las tareas que esta persona <span className="text-white font-medium">no hace</span> en tu empresa.
        </p>
        {proposal.matchConfidence && (
          <p className="text-xs text-slate-500 mt-2">
            Confianza del mapeo: {proposal.matchConfidence.toLowerCase()}
          </p>
        )}
      </div>

      {/* SECCIÓN: PROPÓSITO */}
      <section>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
          Propósito del cargo
        </p>
        {editingPurpose ? (
          <div className="space-y-2">
            <textarea
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              rows={3}
              className="w-full fhr-input bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 font-light leading-relaxed resize-none focus:border-cyan-500/30 focus:outline-none"
            />
            <button
              onClick={() => setEditingPurpose(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="fhr-card p-4">
            <p className="text-sm font-light text-slate-300 leading-relaxed">
              {purpose || 'Sin propósito definido.'}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[9px] text-cyan-400/60 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                Sugerido por FocalizaHR
              </span>
              <button
                onClick={() => setEditingPurpose(true)}
                className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN: RESPONSABILIDADES */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Responsabilidades ({activeTasks.length} de {tasks.length} activas)
          </p>
        </div>

        <DescriptorTaskList tasks={tasks} onToggle={handleToggleTask} />

        {/* Agregar de otra área */}
        <button
          onClick={() => setShowSearch(true)}
          className="mt-4 text-sm text-cyan-400/80 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
        >
          + Agregar responsabilidades de otra área
        </button>

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <DescriptorTaskSearch
                excludeSocCode={proposal.socCode ?? undefined}
                onAdd={handleAddTask}
                onClose={() => setShowSearch(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECCIÓN: COMPETENCIAS */}
      {proposal.competencies.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
            Competencias esperadas
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {proposal.competencies.map(c => (
              <div key={c.code} className="fhr-card p-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-400/40 flex-shrink-0" />
                <span className="text-xs font-light text-slate-300">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA: CONFIRMAR */}
      <div className="pt-6 border-t border-slate-800/40">
        <PrimaryButton
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? 'Confirmando...' : 'Confirmar Descriptor'}
        </PrimaryButton>
      </div>
    </div>
  )
})
