'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUACIÓN DETALLE - Welcome / Pre-Survey Page
// src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Star,
  MessageSquare,
  Home,
  ChevronRight,
  ClipboardList,
  Lock,
  Info
} from 'lucide-react'
import Link from 'next/link'
import WelcomeScreenManager from '@/components/survey/WelcomeScreenManager'

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
  categorizedResponses: Record<string, SummaryResponse[]>
}

interface SummaryResponse {
  questionId: string
  questionText: string
  questionOrder: number
  responseType: string
  rating: number | null
  textResponse: string | null
  choiceResponse: string | null
  normalizedScore: number | null
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
// SUBCOMPONENT: Evaluation Summary Read-Only View
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
        const token = localStorage.getItem('focalizahr_token')
        if (!token) return

        const response = await fetch(`/api/evaluator/assignments/${assignmentId}/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Error cargando resumen')
        }

        const data = await response.json()
        if (data.success) {
          setSummary(data.summary)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [assignmentId])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/dashboard/evaluaciones')}
          className="fhr-btn fhr-btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Portal
        </button>
        <div className="fhr-card p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">{error || 'No se pudo cargar el resumen'}</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const categories = Object.entries(summary.categorizedResponses)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link
          href="/dashboard/evaluaciones"
          className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Evaluaciones</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200">Resumen</span>
      </nav>

      {/* Banner No-Editable */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <Lock className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          Esta evaluación ya fue enviada. Vista de solo lectura.
        </p>
      </div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fhr-card p-6 bg-green-500/5 border-green-500/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-light text-green-400 mb-1">
              Evaluacion Completada
            </h1>
            <h2 className="text-lg font-medium text-slate-200">
              {evaluatee.fullName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {evaluatee.position || 'Sin cargo'} · {evaluatee.departmentName}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Completada el {formatDate(summary.completedAt)}
            </p>
          </div>

          {/* Score Promedio */}
          {summary.averageScore != null && (
            <div className="text-center flex-shrink-0">
              <div className="text-3xl font-bold text-cyan-400">
                {summary.averageScore.toFixed(0)}
              </div>
              <div className="text-xs text-slate-400">Score Promedio</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Respuestas por Categoría */}
      {categories.map(([category, responses], catIdx) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.1 }}
          className="fhr-card p-6"
        >
          <h3 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {category}
          </h3>

          <div className="space-y-4">
            {responses.map((r) => (
              <div
                key={r.questionId}
                className="border-b border-slate-700/50 last:border-0 pb-4 last:pb-0"
              >
                <p className="text-sm text-slate-300 mb-2">
                  {r.questionText}
                </p>

                {/* Rating response */}
                {(r.responseType === 'rating_scale' || r.responseType === 'nps_scale') && r.rating != null && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: r.responseType === 'nps_scale' ? 11 : 5 }).map((_, i) => {
                        const filled = r.responseType === 'nps_scale' ? i <= r.rating! : i < r.rating!
                        return (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              filled ? 'text-cyan-400 fill-cyan-400' : 'text-slate-600'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <span className="text-sm font-medium text-cyan-400 ml-1">
                      {r.rating}{r.responseType === 'nps_scale' ? '/10' : '/5'}
                    </span>
                  </div>
                )}

                {/* Text response */}
                {r.responseType === 'text_open' && r.textResponse && (
                  <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-3">
                    <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300 italic">
                      {r.textResponse}
                    </p>
                  </div>
                )}

                {/* Choice response */}
                {(r.responseType === 'single_choice' || r.responseType === 'multiple_choice') && r.choiceResponse && (
                  <div className="flex flex-wrap gap-2">
                    {(typeof r.choiceResponse === 'string'
                      ? JSON.parse(r.choiceResponse)
                      : r.choiceResponse
                    ).map((choice: string, idx: number) => (
                      <span
                        key={idx}
                        className="fhr-badge bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs"
                      >
                        {choice}
                      </span>
                    ))}
                  </div>
                )}

                {/* Normalized score bar */}
                {r.normalizedScore != null && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-gradient-to-r from-cyan-500 to-purple-500"
                        style={{ width: `${r.normalizedScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">
                      {r.normalizedScore.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Botón Volver */}
      <div className="flex justify-center pb-8">
        <button
          onClick={() => router.push('/dashboard/evaluaciones')}
          className="fhr-btn fhr-btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Evaluaciones
        </button>
      </div>
    </div>
  )
}
