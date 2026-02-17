'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN DETALLE - Welcome / Pre-Survey Page
// src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  ArrowLeftRight,
  Users,
  Bell
} from 'lucide-react'
import WelcomeScreenManager from '@/components/survey/WelcomeScreenManager'
import CinemaSummaryOrchestrator from './components/CinemaSummaryOrchestrator'
import { GapInsightCarousel } from '@/components/performance/gap-analysis'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import ManagementAlertsHUD from '@/components/performance/ManagementAlertsHUD'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface AssignmentDetail {
  id: string
  status: string
  evaluationType: string
  dueDate?: string
  cycleId: string
  evaluatee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string
  }
  surveyUrl: string | null
  participantToken: string | null
  cycle: {
    id: string
    name: string
    endDate: string
  }
}

interface SummaryData {
  assignmentId: string
  evaluateeId: string
  cycleId: string
  evaluationType: string
  completedAt: string
  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }
  cycle: {
    name: string
    endDate: string
  }
  averageScore: number | null
  totalQuestions: number
  categorizedResponses: Record<string, any[]>

  // Datos de competencias (del PerformanceResultsService)
  competencyScores: Array<{
    competencyCode: string
    competencyName: string
    overallAvgScore: number
    selfScore: number | null
    managerScore: number | null
    peerAvgScore: number | null
    upwardAvgScore: number | null
    selfVsOthersGap: number | null
  }> | null

  gapAnalysis: {
    strengths: Array<{
      competencyCode: string
      competencyName: string
      avgScore: number
      highlight: string
    }>
    developmentAreas: Array<{
      competencyCode: string
      competencyName: string
      avgScore: number
      priority: 'ALTA' | 'MEDIA' | 'BAJA'
    }>
  } | null

  overallScore: number | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EvaluacionDetallePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const assignmentId = params.assignmentId as string
  const viewMode = searchParams.get('view')

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar detalle de la asignación
  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const token = localStorage.getItem('focalizahr_token')
        if (!token) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        const response = await fetch(`/api/evaluator/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        if (response.status === 404) {
          setError('Evaluación no encontrada')
          return
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setAssignment(data.assignment)
        } else {
          throw new Error(data.error || 'Error cargando datos')
        }
      } catch (err: any) {
        console.error('Error loading assignment:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (assignmentId) {
      loadAssignment()
    }
  }, [assignmentId, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="fhr-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            {error || 'Evaluación no encontrada'}
          </h2>
          <p className="text-slate-400 mb-4">
            No se pudo cargar la información de esta evaluación.
          </p>
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="fhr-btn fhr-btn-secondary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal
          </button>
        </div>
      </div>
    )
  }

  // Vista de Resumen (completed) - Read-only con respuestas
  if (viewMode === 'summary' && assignment.status === 'completed') {
    return (
      <EvaluationSummaryView
        assignmentId={assignmentId}
        evaluatee={assignment.evaluatee}
      />
    )
  }

  // Vista Welcome (pending) - Usar WelcomeScreenManager
  // Verificar que tenemos token para la encuesta
  if (!assignment.participantToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="fhr-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            Encuesta no disponible
          </h2>
          <p className="text-slate-400 mb-4">
            El enlace de la encuesta aún no está listo. Contacta al administrador.
          </p>
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="fhr-btn fhr-btn-secondary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <WelcomeScreenManager
      evaluatee={{
        fullName: assignment.evaluatee.fullName,
        position: assignment.evaluatee.position,
        departmentName: assignment.evaluatee.departmentName,
        tenure: assignment.evaluatee.tenure
      }}
      estimatedMinutes={10}
      surveyToken={assignment.participantToken}
      onBack="/dashboard/evaluaciones"
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: Evaluation Summary - Cinema Mode View
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE DE 3 OPCIONES - Inline Component
// ════════════════════════════════════════════════════════════════════════════

type ViewMode = 'respuestas' | 'brechas' | 'calibracion' | 'alertas'

interface ToggleOption {
  value: ViewMode
  label: string
  icon: React.ElementType
}

function ThreeWayToggle({
  options,
  activeValue,
  onChange
}: {
  options: ToggleOption[]
  activeValue: ViewMode
  onChange: (value: ViewMode) => void
}) {
  return (
    <div
      className="inline-flex gap-2 p-1 rounded-2xl"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(71, 85, 105, 0.2)'
      }}
    >
      {options.map((option, index) => {
        const isActive = option.value === activeValue
        const Icon = option.icon

        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-250"
            style={{
              color: isActive
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(148, 163, 184, 0.8)',
              background: isActive
                ? (['#22D3EE', '#3B82F6', '#A78BFA', '#F59E0B'][index] ?? '#22D3EE')
                : 'transparent',
              boxShadow: isActive
                ? `0 2px 8px ${['rgba(34, 211, 238, 0.3)', 'rgba(59, 130, 246, 0.3)', 'rgba(167, 139, 250, 0.3)', 'rgba(245, 158, 11, 0.3)'][index] ?? 'rgba(34, 211, 238, 0.3)'}`
                : 'none'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={16} />
            <span>{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: Evaluation Summary - Cinema Mode View + Intelligence Panels
// ════════════════════════════════════════════════════════════════════════════

function EvaluationSummaryView({
  assignmentId,
  evaluatee
}: {
  assignmentId: string
  evaluatee: { fullName: string; position: string | null; departmentName: string }
}) {
  const router = useRouter()
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // Estado para toggle de vistas
  // ═══════════════════════════════════════════════════════════════════════════
  const [activeView, setActiveView] = useState<ViewMode>('respuestas')

  const toggleOptions: ToggleOption[] = [
    { value: 'respuestas', label: 'Respuestas', icon: FileText },
    { value: 'brechas', label: 'Brechas', icon: ArrowLeftRight },
    { value: 'calibracion', label: 'Calibración', icon: Users },
    { value: 'alertas', label: 'Alertas', icon: Bell }
  ]

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const token = localStorage.getItem('focalizahr_token')
        if (!token) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        const res = await fetch(`/api/evaluator/assignments/${assignmentId}/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.status === 401) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}: No se pudo cargar el resumen`)
        }

        const json = await res.json()

        if (json.success && json.summary) {
          setSummary(json.summary)
        } else {
          throw new Error(json.error || 'Error desconocido al cargar el resumen')
        }
      } catch (err) {
        console.error('[EvaluationSummaryView] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el resumen')
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [assignmentId, router])

  // ═══════════════════════════════════════════════════════════════════════════
  // Datos para ManagementAlertsHUD (competencias con scores)
  // Los datos están disponibles en summary.categorizedResponses
  // ═══════════════════════════════════════════════════════════════════════════
  const competencies = useMemo(() => {
    if (!summary?.categorizedResponses) return []

    return Object.entries(summary.categorizedResponses).map(([name, responses]) => {
      // Obtener ratings válidos (ya están en escala 1-5)
      const ratings = (responses as any[])
        .filter(r => r.rating !== null && r.rating !== undefined)
        .map(r => r.rating as number)

      // Calcular promedio
      const avgScore = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

      return { name, score: avgScore }
    })
  }, [summary?.categorizedResponses])

  // ═══════════════════════════════════════════════════════════════════════════
  // Datos para TeamCalibrationHUD
  // NOTA: Requiere fetch adicional para obtener otros evaluados del mismo ciclo
  // Por ahora, mostramos mensaje de "no disponible"
  // ═══════════════════════════════════════════════════════════════════════════
  const teamMembers: { id: string; name: string; score: number }[] = []

  // Loading state - Cinema style
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando resumen de evaluación...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error al cargar</p>
          <p className="text-slate-400 text-sm mb-6">
            {error || 'No se pudo cargar el resumen de la evaluación'}
          </p>
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    )
  }

  // Success - Vista con Toggle de Inteligencia
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* ═══════════════════════════════════════════════════════════════════════
          Toggle de Vistas - Posicionado en la parte superior
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-center">
          <ThreeWayToggle
            options={toggleOptions}
            activeValue={activeView}
            onChange={setActiveView}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Contenido según vista activa
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Vista 1: Respuestas - Cinema Summary Orchestrator */}
      {activeView === 'respuestas' && (
        <CinemaSummaryOrchestrator
          summary={{
            assignmentId: summary.assignmentId,
            evaluateeId: summary.evaluateeId,
            cycleId: summary.cycleId,
            evaluationType: summary.evaluationType,
            completedAt: summary.completedAt,
            evaluatee: {
              fullName: summary.evaluatee.fullName,
              position: summary.evaluatee.position,
              department: summary.evaluatee.department
            },
            cycle: summary.cycle,
            averageScore: summary.averageScore,
            totalQuestions: summary.totalQuestions,
            categorizedResponses: summary.categorizedResponses,
            competencyScores: summary.competencyScores,
            gapAnalysis: summary.gapAnalysis,
            overallScore: summary.overallScore
          }}
        />
      )}

      {/* Vista: Brechas - Análisis Self vs Manager */}
      {activeView === 'brechas' && summary.competencyScores && (
        <div className="max-w-2xl mx-auto p-6">
          <GapInsightCarousel
            competencyScores={summary.competencyScores}
            employeeName={summary.evaluatee.fullName}
          />
        </div>
      )}

      {/* Vista 2: Calibración - Ranking del equipo */}
      {activeView === 'calibracion' && (
        <div className="max-w-2xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {teamMembers.length > 1 ? (
              <TeamCalibrationHUD
                teamMembers={teamMembers}
                currentEvaluateeId={assignmentId}
                maxVisible={5}
              />
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Calibración de Equipo
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  La calibración de equipo no está disponible para esta evaluación.
                </p>
                <p className="text-slate-600 text-xs">
                  Se requieren múltiples evaluaciones completadas del mismo evaluador
                  para comparar el desempeño relativo en el equipo.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Vista 3: Alertas - Intelligence HUD */}
      {activeView === 'alertas' && (
        <div className="max-w-2xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {competencies.length > 0 ? (
              <ManagementAlertsHUD
                competencies={competencies}
                employeeName={evaluatee.fullName}
              />
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Alertas de Gestión
                </h3>
                <p className="text-slate-500 text-sm">
                  No hay datos de competencias disponibles para generar alertas.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  )
}
