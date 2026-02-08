// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION WIZARD - Orquestador Principal
// src/components/calibration/CalibrationWizard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Crea sesión via POST /api/calibration/sessions
// Luego agrega participantes via POST /api/calibration/sessions/[id]/participants
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, Check, ArrowLeft, ArrowRight, Loader2, Rocket } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'

import StepSelectCycle from './steps/StepSelectCycle'
import StepConfigureScope from './steps/StepConfigureScope'
import StepInviteParticipants from './steps/StepInviteParticipants'
import StepReviewCreate from './steps/StepReviewCreate'
import StepPublish from './steps/StepPublish'

const STEPS = [
  { id: 1, name: 'Ciclo' },
  { id: 2, name: 'Configuración' },
  { id: 3, name: 'Participantes' },
  { id: 4, name: 'Revisar' },
  { id: 5, name: 'Publicar' }
]

type FilterMode = 'jobLevel' | 'jobFamily' | 'directReports' | 'customPicks' | 'department'

interface WizardData {
  cycleId: string
  cycleName: string
  sessionName: string
  description: string
  scheduledAt: string
  selectedDepartments: string[]
  departmentNames: string[]
  filterMode: FilterMode
  filterConfig: any
  participants: Array<{ email: string; name: string; role: 'FACILITATOR' | 'REVIEWER' | 'OBSERVER' }>
}

export default function CalibrationWizard() {
  const router = useRouter()
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [data, setData] = useState<WizardData>({
    cycleId: '',
    cycleName: '',
    sessionName: '',
    description: '',
    scheduledAt: '',
    selectedDepartments: [],
    departmentNames: [],
    filterMode: 'jobLevel',
    filterConfig: {},
    participants: []
  })

  // Validación por paso
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!data.cycleId
      case 2:
        return !!data.sessionName.trim() && !!data.scheduledAt
      case 3:
        return data.participants.some(p => p.role === 'FACILITATOR')
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }, [currentStep, data])

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setError('')
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setError('')
      setCurrentStep(prev => prev - 1)
    }
  }

  // Step 4: Crear sesión como DRAFT
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // 1. Crear sesión
      const sessionRes = await fetch('/api/calibration/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: data.cycleId,
          name: data.sessionName,
          description: data.description,
          scheduledAt: data.scheduledAt,
          departmentIds: data.selectedDepartments.length > 0 ? data.selectedDepartments : undefined,
          filterMode: data.filterMode,
          filterConfig: data.filterConfig
        })
      })

      const sessionJson = await sessionRes.json()

      if (!sessionJson.success) {
        throw new Error(sessionJson.error || 'Error creando sesión')
      }

      const createdSessionId = sessionJson.data.id
      setSessionId(createdSessionId)

      // 2. Agregar participantes uno a uno
      for (const participant of data.participants) {
        const partRes = await fetch(`/api/calibration/sessions/${createdSessionId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantEmail: participant.email,
            participantName: participant.name,
            role: participant.role
          })
        })

        const partJson = await partRes.json()
        if (!partJson.success) {
          console.warn(`[Wizard] Error agregando participante ${participant.email}:`, partJson.error)
        }
      }

      // 3. Avanzar al paso 5 (Publicar)
      toast.success(
        `Sesión "${data.sessionName}" creada como borrador. Revisa y publica.`,
        'Sesión Creada'
      )
      setCurrentStep(5)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 5: Publicar sesión (DRAFT → IN_PROGRESS + emails)
  const handlePublish = async () => {
    if (!sessionId) return

    setIsPublishing(true)
    setError('')

    try {
      toast.info(
        `Programando invitaciones para ${data.participants.length} panelistas...`,
        'Publicando Sesión'
      )

      const res = await fetch(`/api/calibration/sessions/${sessionId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Error publicando sesión')
      }

      // Toast de éxito con detalle de emails
      if (result.sendImmediately) {
        toast.success(
          `Sesión publicada. ${result.emailsSent} invitaciones enviadas.`,
          'Sesión Activa'
        )
      } else {
        const scheduledDate = new Date(result.emailScheduledFor).toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })
        toast.success(
          `Sesión publicada. ${result.emailsScheduled} invitaciones programadas para ${scheduledDate}.`,
          'Sesión Activa'
        )
      }

      // Redirect al War Room
      router.push(`/dashboard/performance/calibration/sessions/${sessionId}`)
    } catch (err: any) {
      toast.error('Error al publicar sesión. Intenta nuevamente.', 'Error')
      setError(err.message)
    } finally {
      setIsPublishing(false)
    }
  }

  // Color dinámico de línea Tesla
  const teslaLineColor = useMemo(() => {
    if (currentStep === 5) return '#10B981'
    if (currentStep === 4) return '#A78BFA'
    return '#22D3EE'
  }, [currentStep])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
      {/* Header con glassmorphism + línea Tesla */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        {/* Línea Tesla dinámica */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] transition-all duration-400"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaLineColor}, transparent)`,
            boxShadow: `0 0 15px ${teslaLineColor}`
          }}
        />

        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Título */}
          <div>
            <h1 className="text-lg font-semibold text-white">Nueva Sesión de Calibración</h1>
            <p className="text-xs text-slate-500">
              Paso {currentStep} de {STEPS.length}
            </p>
          </div>

          {/* Stepper (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
                  currentStep > step.id && 'bg-cyan-500 text-white',
                  currentStep === step.id && 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500',
                  currentStep < step.id && 'bg-slate-800 text-slate-500'
                )}>
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-8 h-[2px] mx-1 transition-all duration-200',
                    currentStep > step.id ? 'bg-cyan-500' : 'bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Cerrar */}
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentStep === 1 && (
              <StepSelectCycle
                selectedCycleId={data.cycleId}
                onSelect={(cycleId, cycle) => setData(prev => ({
                  ...prev,
                  cycleId,
                  cycleName: cycle.name,
                  sessionName: prev.sessionName || `Calibración - ${cycle.name}`
                }))}
              />
            )}

            {currentStep === 2 && (
              <StepConfigureScope
                sessionName={data.sessionName}
                onNameChange={(name) => setData(prev => ({ ...prev, sessionName: name }))}
                description={data.description}
                onDescriptionChange={(desc) => setData(prev => ({ ...prev, description: desc }))}
                selectedDepartments={data.selectedDepartments}
                onDepartmentsChange={(ids) => setData(prev => ({ ...prev, selectedDepartments: ids }))}
                scheduledAt={data.scheduledAt}
                onScheduledAtChange={(date) => setData(prev => ({ ...prev, scheduledAt: date }))}
                cycleId={data.cycleId}
                filterMode={data.filterMode}
                onFilterModeChange={(mode) => setData(prev => ({ ...prev, filterMode: mode }))}
                filterConfig={data.filterConfig}
                onFilterConfigChange={(config) => setData(prev => ({ ...prev, filterConfig: config }))}
              />
            )}

            {currentStep === 3 && (
              <StepInviteParticipants
                participants={data.participants}
                onParticipantsChange={(p) => setData(prev => ({ ...prev, participants: p }))}
              />
            )}

            {currentStep === 4 && (
              <StepReviewCreate
                cycleName={data.cycleName}
                sessionName={data.sessionName}
                description={data.description}
                scheduledAt={data.scheduledAt}
                selectedDepartments={data.selectedDepartments}
                departmentNames={data.departmentNames}
                filterMode={data.filterMode}
                filterConfig={data.filterConfig}
                participants={data.participants}
              />
            )}

            {currentStep === 5 && (
              <StepPublish
                sessionName={data.sessionName}
                cycleName={data.cycleName}
                description={data.description}
                scheduledAt={data.scheduledAt}
                filterMode={data.filterMode}
                filterConfig={data.filterConfig}
                selectedDepartments={data.selectedDepartments}
                departmentNames={data.departmentNames}
                participants={data.participants}
                isPublishing={isPublishing}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <GhostButton
            icon={ArrowLeft}
            onClick={handleBack}
            disabled={currentStep === 1 || currentStep === 5}
            size="md"
          >
            Anterior
          </GhostButton>

          {currentStep < 4 ? (
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNext}
              disabled={!canProceed()}
              size="md"
            >
              Siguiente
            </PrimaryButton>
          ) : currentStep === 4 ? (
            <PrimaryButton
              icon={isSubmitting ? Loader2 : Check}
              onClick={handleSubmit}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              size="md"
              glow={true}
            >
              {isSubmitting ? 'Creando...' : 'Crear Sesión'}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              icon={isPublishing ? Loader2 : Rocket}
              onClick={handlePublish}
              disabled={isPublishing}
              isLoading={isPublishing}
              size="md"
              glow={true}
            >
              {isPublishing ? 'Publicando...' : 'Publicar Sesión'}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  )
}
