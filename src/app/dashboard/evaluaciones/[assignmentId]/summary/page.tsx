'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION SUMMARY - Guided Experience (FASE 3)
// src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import GuidedSummaryOrchestrator from '@/components/performance/summary/GuidedSummaryOrchestrator'
import type { CinemaSummaryData } from '@/types/evaluator-cinema'

export default function EvaluationSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string

  const [summary, setSummary] = useState<CinemaSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // Team members para ranking de calibración
  // ═══════════════════════════════════════════════════════════════════════════
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    score: number
  }>>([])

  // ═══════════════════════════════════════════════════════════════════════════
  // Datos de potencial (desde assignments API)
  // ═══════════════════════════════════════════════════════════════════════════
  const [potentialData, setPotentialData] = useState<{
    potentialScore: number | null
    potentialLevel: string | null
    nineBoxPosition: string | null
  }>({ potentialScore: null, potentialLevel: null, nineBoxPosition: null })

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch summary data
  // ═══════════════════════════════════════════════════════════════════════════
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
          setSummary(json.summary)
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Fetch team data + potential data para calibración y 9-box
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    async function fetchTeamData() {
      try {
        const token = localStorage.getItem('focalizahr_token')
        if (!token) return

        const res = await fetch('/api/evaluator/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!res.ok) return

        const json = await res.json()
        if (json.success && json.assignments) {
          // Team members for ranking
          const members = json.assignments
            .filter((a: any) => {
              const isCompleted = a.status?.toLowerCase() === 'completed'
              const hasScore = a.avgScore !== null && a.avgScore !== undefined
              return isCompleted && hasScore
            })
            .map((a: any) => ({
              id: a.evaluatee?.id || a.id,
              name: a.evaluatee?.fullName || 'Sin nombre',
              score: a.avgScore
            }))
            .sort((a: any, b: any) => b.score - a.score)

          setTeamMembers(members)

          // Potential data for current assignment
          const currentAssignment = json.assignments.find((a: any) => a.id === assignmentId)
          if (currentAssignment) {
            setPotentialData({
              potentialScore: currentAssignment.potentialScore ?? null,
              potentialLevel: currentAssignment.potentialLevel ?? null,
              nineBoxPosition: currentAssignment.nineBoxPosition ?? null
            })
          }
        }
      } catch (err) {
        console.error('[Summary] Error fetching team data:', err)
      }
    }

    fetchTeamData()
  }, [assignmentId])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error al cargar</p>
          <p className="text-slate-400 text-sm mb-6">{error || 'No se pudo cargar el resumen'}</p>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER - Guided Experience
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <GuidedSummaryOrchestrator
      summary={summary}
      teamMembers={teamMembers}
      potentialScore={potentialData.potentialScore}
      potentialLevel={potentialData.potentialLevel}
      nineBoxPosition={potentialData.nineBoxPosition}
    />
  )
}
