'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION SUMMARY - Read-only view of a completed evaluation
// src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { formatDisplayNameFull } from '@/lib/utils/formatName'

interface CategorizedResponse {
  questionId: string
  questionText: string
  questionOrder: number
  responseType: string
  rating: number | null
  textResponse: string | null
  choiceResponse: string | null
  normalizedScore: number | null
}

interface SummaryData {
  success: boolean
  summary: {
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
    categorizedResponses: Record<string, CategorizedResponse[]>
  }
}

export default function EvaluationSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string

  const [data, setData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
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

        if (!res.ok) throw new Error(`Error ${res.status}`)

        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          throw new Error(json.error || 'Error cargando resumen')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [assignmentId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Clock className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !data?.summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-sm text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">Error al cargar resumen</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'No se encontraron datos'}</p>
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mis Evaluaciones
          </button>
        </div>
      </div>
    )
  }

  const { summary } = data
  const displayName = formatDisplayNameFull(summary.evaluatee.fullName)

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard/evaluaciones')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Evaluaciones
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-1">
            Resumen de Evaluacion
          </h1>
          <p className="text-slate-400">
            {displayName} · {summary.evaluatee.position || 'Sin cargo'}
          </p>
        </motion.div>

        {/* Completed banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-medium text-sm">Evaluacion Completada</p>
            {summary.completedAt && (
              <p className="text-emerald-400/70 text-xs">
                Completada el {new Date(summary.completedAt).toLocaleDateString('es-CL')}
              </p>
            )}
          </div>
        </div>

        {/* Average score - convert from 0-100 to 1-5 scale */}
        {summary.averageScore !== null && summary.averageScore !== undefined && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6 text-center">
            <p className="text-slate-400 text-sm mb-2">Score Promedio</p>
            <p className="text-4xl font-bold text-cyan-400">
              {(summary.averageScore / 20).toFixed(1)}<span className="text-xl text-slate-500">/5</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {summary.averageScore / 20 >= 4.5 ? 'Excepcional' :
               summary.averageScore / 20 >= 4.0 ? 'Excelente' :
               summary.averageScore / 20 >= 3.5 ? 'Competente' :
               summary.averageScore / 20 >= 3.0 ? 'En Desarrollo' : 'Necesita Apoyo'}
            </p>
          </div>
        )}

        {/* Responses by category */}
        {Object.entries(summary.categorizedResponses).map(([category, responses]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">{category}</h3>
            <div className="space-y-3">
              {responses.map((r) => (
                <div key={r.questionId} className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-2">{r.questionText}</p>
                  {r.rating !== null && (
                    <p className="text-cyan-400 font-medium">{r.rating}/5</p>
                  )}
                  {r.textResponse && (
                    <p className="text-slate-400 text-sm italic mt-1">&ldquo;{r.textResponse}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
