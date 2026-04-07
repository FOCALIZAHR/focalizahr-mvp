'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR WIZARD — Portada→Acción × 4 Actos + Confeti
// Cada acto: portada narrativa (contexto) → acción (formulario) → siguiente
// NEUTRO: zero betaScore, zero exposure, zero IA colors.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WizardProgressBar from './WizardProgressBar'
import ActoPortada from './ActoPortada'
import ActoFallback from './ActoFallback'
import ActoPurpose from './ActoPurpose'
import ActoResponsibilities from './ActoResponsibilities'
import ActoComplement from './ActoComplement'
import ActoConfirm from './ActoConfirm'
import DescriptorVictory from './DescriptorVictory'
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
  // Fallback: show candidate selection when no SOC match and candidates exist
  const needsFallback = proposal.tasks.length === 0
    && proposal.topCandidates != null
    && proposal.topCandidates.length > 0

  const [showFallback, setShowFallback] = useState(needsFallback)
  const [fallbackLoading, setFallbackLoading] = useState(false)

  // Phase: 'portada' shows narrative context, 'action' shows the form
  const [currentAct, setCurrentAct] = useState(1)
  const [phase, setPhase] = useState<'portada' | 'action'>('portada')
  const [purpose, setPurpose] = useState(proposal.purpose ?? '')
  const [purposeApproved, setPurposeApproved] = useState(false)
  const [purposeEdited, setPurposeEdited] = useState(false)
  const [tasks, setTasks] = useState<ProposedTask[]>(proposal.tasks)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeTasks = tasks.filter(t => t.isActive).length
  // When tasks=0, skip act 2 portada (nothing to preview) → go straight to action
  const skipAct2Portada = tasks.length === 0

  // Fallback: select a candidate SOC → load its tasks
  const handleSelectCandidate = useCallback(async (socCode: string) => {
    try {
      setFallbackLoading(true)
      const res = await fetch('/api/descriptors/select-occupation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: proposal.jobTitle, socCode }),
      })
      if (!res.ok) throw new Error('Error al cargar perfil')
      const json = await res.json()
      if (json.success && json.data) {
        if (json.data.purpose) setPurpose(json.data.purpose)
        if (json.data.tasks?.length > 0) setTasks(json.data.tasks)
      }
      setShowFallback(false)
    } catch (e: any) {
      console.error('[DescriptorWizard] select candidate error:', e)
    } finally {
      setFallbackLoading(false)
    }
  }, [proposal.jobTitle])

  const handleSkipFallback = useCallback(() => setShowFallback(false), [])

  // Portada → Action
  const handleEnterAction = useCallback(() => setPhase('action'), [])

  // Action → Next act (portada unless skip)
  const handleNext = useCallback(() => {
    if (currentAct < 4) {
      const nextAct = currentAct + 1
      setCurrentAct(nextAct)
      // Skip portada for act 2 when no tasks (nothing to preview)
      setPhase(nextAct === 2 && skipAct2Portada ? 'action' : 'portada')
    }
  }, [currentAct, skipAct2Portada])

  // Back: action→portada (unless skip), portada→previous act action, act 1→lobby
  const handleBack = useCallback(() => {
    if (phase === 'action') {
      // If this act has no portada, go to previous act
      if (currentAct === 2 && skipAct2Portada) {
        setCurrentAct(1)
        setPhase('action')
      } else {
        setPhase('portada')
      }
    } else if (currentAct === 1) {
      onBack()
    } else {
      setCurrentAct(prev => prev - 1)
      setPhase('action')
    }
  }, [phase, currentAct, onBack, skipAct2Portada])

  // Jump to a specific act (from ActoConfirm summary)
  const handleGoToAct = useCallback((act: number) => {
    setCurrentAct(act)
    setPhase('action')
  }, [])

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

      const saveRes = await fetch('/api/descriptors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: proposal.jobTitle,
          socCode: proposal.socCode,
          purpose,
          purposeSource: purposeEdited ? 'client_edited' : 'onet_generated',
          responsibilities: tasks,
          competencies: proposal.competencies,
          matchConfidence: proposal.matchConfidence,
        }),
      })

      if (!saveRes.ok) throw new Error('Error al guardar')
      const saveJson = await saveRes.json()
      const id = saveJson.data?.id
      if (!id) throw new Error('No se obtuvo ID del descriptor')

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
  }, [proposal, tasks, purpose, purposeEdited])

  // Portada narratives per act
  const isHighConfidence = proposal.matchConfidence === 'HIGH'

  const portadaConfig = {
    1: {
      title: 'Define el',
      subtitle: 'Propósito',
      narrative: employeeCount > 1
        ? `Este cargo lo ocupan ${employeeCount} personas${departmentName ? ` en ${departmentName}` : ''}. ${
            isHighConfidence
              ? 'Hemos identificado su propósito con alta coincidencia en bases internacionales.'
              : 'Te sugerimos un propósito base que puedes editar completamente.'
          } Tu trabajo: validar que refleje lo que este cargo realmente hace en tu empresa.`
        : `${isHighConfidence
            ? 'Hemos identificado el propósito de este cargo con alta coincidencia en bases internacionales.'
            : 'Te sugerimos un propósito base que puedes editar completamente.'
          } Tu trabajo: validar que refleje lo que este cargo realmente hace en tu empresa.`,
      coachingTip: 'Un propósito claro es la base de evaluaciones justas.',
      cta: 'Ver propósito',
    },
    2: {
      title: 'Ajusta las',
      subtitle: 'Responsabilidades',
      narrative: `Encontramos ${tasks.length} responsabilidades típicas para este cargo. Tu misión: desmarcar las que no aplican en tu empresa. Es más fácil quitar lo que sobra que escribir desde cero.`,
      coachingTip: `Lo que definas aquí determina cómo se evalúa a ${employeeCount === 1 ? 'esta persona' : `estas ${employeeCount} personas`}.`,
      cta: 'Revisar tareas',
    },
    3: {
      title: 'Complementa',
      subtitle: 'el Descriptor',
      narrative: 'En Chile, muchos cargos incluyen tareas de otras áreas. Un Jefe de Finanzas que también hace RRHH no es raro. Si falta algo, aquí puedes agregarlo.',
      coachingTip: 'Este paso es opcional. Si todo está cubierto, avanza.',
      cta: 'Complementar',
      ctaSecondary: 'Saltar paso',
    },
    4: {
      title: 'Confirma el',
      subtitle: 'Descriptor',
      narrative: `Has revisado propósito, responsabilidades y competencias. Una vez que confirmes, este descriptor se convierte en el estándar contra el que se evalúa a ${employeeCount === 1 ? '1 persona' : `${employeeCount} personas`}.`,
      coachingTip: 'Una vez confirmado, alimenta evaluaciones y análisis.',
      cta: 'Ver resumen',
    },
  } as const

  // Victory screen (post-confirmation)
  if (confirmed) {
    return (
      <DescriptorVictory
        jobTitle={proposal.jobTitle}
        employeeCount={employeeCount}
        departmentName={departmentName}
        onNextJob={onNextJob}
        onHome={onHome}
      />
    )
  }

  // Fallback: candidate selection before wizard starts
  if (showFallback) {
    return (
      <div className="space-y-6">
        <WizardProgressBar
          jobTitle={proposal.jobTitle}
          currentAct={0}
          onBack={onBack}
          onHome={onHome}
        />
        <ActoFallback
          jobTitle={proposal.jobTitle}
          candidates={proposal.topCandidates ?? []}
          onSelect={handleSelectCandidate}
          onSkip={handleSkipFallback}
          loading={fallbackLoading}
        />
      </div>
    )
  }

  const config = portadaConfig[currentAct as keyof typeof portadaConfig]

  return (
    <div className="space-y-6">
      {/* Progress bar — outside the glass card */}
      <WizardProgressBar
        jobTitle={proposal.jobTitle}
        currentAct={currentAct}
        onBack={handleBack}
        onHome={onHome}
      />

      {/* Portada or Action with transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentAct}-${phase}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {phase === 'portada' ? (
            <ActoPortada
              actNumber={currentAct}
              title={config.title}
              subtitle={config.subtitle}
              narrative={config.narrative}
              coachingTip={config.coachingTip}
              cta={config.cta}
              ctaSecondary={'ctaSecondary' in config ? config.ctaSecondary : undefined}
              onAction={handleEnterAction}
              onSkip={currentAct === 3 ? handleNext : undefined}
            />
          ) : currentAct === 1 ? (
            <ActoPurpose
              purpose={purpose}
              onPurposeChange={(val) => { setPurpose(val); setPurposeEdited(true) }}
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
              initialTaskCount={proposal.tasks.length}
              competencies={proposal.competencies}
              employeeCount={employeeCount}
              departmentName={departmentName}
              saving={saving}
              onConfirm={handleConfirm}
              onGoToAct={handleGoToAct}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
