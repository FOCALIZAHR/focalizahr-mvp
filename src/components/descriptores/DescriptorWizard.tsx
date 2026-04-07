'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR WIZARD — 4 Actos Secuenciales con AnimatePresence
// Propósito → Responsabilidades → Complementar → Confirmar
// NEUTRO: zero betaScore, zero exposure, zero IA colors.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WizardProgressBar from './WizardProgressBar'
import ActoPurpose from './ActoPurpose'
import ActoResponsibilities from './ActoResponsibilities'
import ActoComplement from './ActoComplement'
import ActoConfirm from './ActoConfirm'
import type { DescriptorProposal, ProposedTask } from '@/lib/services/JobDescriptorService'

interface DescriptorWizardProps {
  proposal: DescriptorProposal
  employeeCount: number
  departmentName: string | null
  onBack: () => void
  onHome: () => void
  onNextJob: () => void
}

export default memo(function DescriptorWizard({
  proposal,
  employeeCount,
  departmentName,
  onBack,
  onHome,
  onNextJob,
}: DescriptorWizardProps) {
  // State that persists across acts
  const [currentAct, setCurrentAct] = useState(1)
  const [purpose, setPurpose] = useState(proposal.purpose ?? '')
  const [purposeApproved, setPurposeApproved] = useState(false)
  const [tasks, setTasks] = useState<ProposedTask[]>(proposal.tasks)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  // Navigation
  const handleNext = useCallback(() => setCurrentAct(prev => Math.min(prev + 1, 4)), [])
  const handleBack = useCallback(() => {
    if (currentAct === 1) {
      onBack()
    } else {
      setCurrentAct(prev => prev - 1)
    }
  }, [currentAct, onBack])

  const handleGoToAct = useCallback((act: number) => setCurrentAct(act), [])

  // Task toggle
  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.taskId === taskId ? { ...t, isActive: !t.isActive } : t
    ))
  }, [])

  // Add task from search
  const handleAddTask = useCallback((task: ProposedTask) => {
    setTasks(prev => [...prev, { ...task, isActive: true, isFromOnet: true }])
  }, [])

  // Confirm — save + confirm
  const handleConfirm = useCallback(async () => {
    try {
      setSaving(true)

      // 1. Save as DRAFT
      const saveRes = await fetch('/api/descriptors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: proposal.jobTitle,
          socCode: proposal.socCode,
          purpose,
          purposeSource: purposeApproved ? 'onet_generated' : 'client_edited',
          responsibilities: tasks,
          competencies: proposal.competencies,
          matchConfidence: proposal.matchConfidence,
        }),
      })

      if (!saveRes.ok) throw new Error('Error al guardar')
      const saveJson = await saveRes.json()
      const id = saveJson.data?.id
      if (!id) throw new Error('No se obtuvo ID del descriptor')

      // 2. Confirm
      const confirmRes = await fetch('/api/descriptors/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptorId: id }),
      })

      if (!confirmRes.ok) throw new Error('Error al confirmar')
      setConfirmed(true)
    } catch (e: any) {
      console.error('[DescriptorWizard] confirm error:', e)
      alert(e.message ?? 'Error al confirmar descriptor')
    } finally {
      setSaving(false)
    }
  }, [proposal, tasks, purpose, purposeApproved])

  return (
    <div className="space-y-6">
      {/* Progress bar — sticky top */}
      {!confirmed && (
        <WizardProgressBar
          jobTitle={proposal.jobTitle}
          currentAct={currentAct}
          onBack={handleBack}
          onHome={onHome}
        />
      )}

      {/* Acts with transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={confirmed ? 'success' : currentAct}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {confirmed ? (
            <ActoConfirm
              jobTitle={proposal.jobTitle}
              purpose={purpose}
              tasks={tasks}
              competencies={proposal.competencies}
              employeeCount={employeeCount}
              departmentName={departmentName}
              saving={false}
              confirmed={true}
              onConfirm={() => {}}
              onGoToAct={() => {}}
              onNextJob={onNextJob}
              onHome={onHome}
            />
          ) : currentAct === 1 ? (
            <ActoPurpose
              purpose={purpose}
              onPurposeChange={setPurpose}
              approved={purposeApproved}
              onApprove={() => setPurposeApproved(true)}
              matchConfidence={proposal.matchConfidence}
              employeeCount={employeeCount}
              onNext={handleNext}
            />
          ) : currentAct === 2 ? (
            <ActoResponsibilities
              tasks={tasks}
              onToggle={handleToggleTask}
              onNext={handleNext}
            />
          ) : currentAct === 3 ? (
            <ActoComplement
              excludeSocCode={proposal.socCode ?? undefined}
              onAddTask={handleAddTask}
              competencies={proposal.competencies}
              onNext={handleNext}
            />
          ) : (
            <ActoConfirm
              jobTitle={proposal.jobTitle}
              purpose={purpose}
              tasks={tasks}
              competencies={proposal.competencies}
              employeeCount={employeeCount}
              departmentName={departmentName}
              saving={saving}
              confirmed={false}
              onConfirm={handleConfirm}
              onGoToAct={handleGoToAct}
              onNextJob={onNextJob}
              onHome={onHome}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
