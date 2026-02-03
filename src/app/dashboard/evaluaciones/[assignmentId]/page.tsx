'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN DETALLE - Welcome / Pre-Survey Page
// src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import WelcomeScreenManager from '@/components/survey/WelcomeScreenManager'
import CinemaSummaryOrchestrator from './components/CinemaSummaryOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface AssignmentDetail {
  id: string
  status: string
  evaluationType: string
  dueDate?: string
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
    name: string
    endDate: string
  }
}

interface SummaryData {
  assignmentId: string
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

  // Success - Cinema Summary Orchestrator
  return (
    <CinemaSummaryOrchestrator
      summary={{
        assignmentId: summary.assignmentId,
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
  )
}
