'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION SUMMARY - Cinema Mode Summary + Intelligence Sidekick Panel
// src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CinemaSummaryOrchestrator from '../components/CinemaSummaryOrchestrator'
import { GapInsightCarousel } from '@/components/performance/gap-analysis'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import InsightCarousel from '@/components/performance/summary/InsightCarousel'
import PerformanceScoreCard from '@/components/performance/PerformanceScoreCard'
import type { CinemaSummaryData } from '@/types/evaluator-cinema'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type IntelligenceView = 'calibracion' | 'brechas' | 'alertas'

export default function EvaluationSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string

  const [summary, setSummary] = useState<CinemaSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // Estado para toggle de vistas de inteligencia
  // ═══════════════════════════════════════════════════════════════════════════
  const [activeView, setActiveView] = useState<IntelligenceView>('calibracion')

  // ═══════════════════════════════════════════════════════════════════════════
  // Estado para team members (ranking de calibración)
  // ═══════════════════════════════════════════════════════════════════════════
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    score: number
  }>>([])

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
  // Fetch team data para calibración (todos los assignments del evaluador)
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
          // DEBUG: Ver qué retorna el API
          console.log('[Summary] Raw assignments:', json.assignments.map((a: any) => ({
            status: a.status,
            avgScore: a.avgScore,
            evaluatee: a.evaluatee?.fullName
          })))

          // Filtrar solo completados con score y transformar
          // NOTA: El API retorna status en minúsculas ('completed', no 'COMPLETED')
          const members = json.assignments
            .filter((a: any) => {
              const isCompleted = a.status?.toLowerCase() === 'completed'
              const hasScore = a.avgScore !== null && a.avgScore !== undefined
              return isCompleted && hasScore
            })
            .map((a: any) => ({
              id: a.evaluatee?.id || a.id,
              name: a.evaluatee?.fullName || 'Sin nombre',
              // avgScore del API /assignments está en escala 0-100, convertir a 1-5
              score: a.avgScore 
            }))
            .sort((a: any, b: any) => b.score - a.score)

          console.log('[Summary] Filtered teamMembers:', members)
          setTeamMembers(members)
        }
      } catch (err) {
        console.error('[Summary] Error fetching team data:', err)
      }
    }

    fetchTeamData()
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // Calcular competencias desde categorizedResponses para ManagementAlertsHUD
  // ═══════════════════════════════════════════════════════════════════════════
  const competencies = useMemo(() => {
    if (!summary?.categorizedResponses) return []

    return Object.entries(summary.categorizedResponses).map(([name, responses]) => {
      const ratings = (responses as any[])
        .filter((r: any) => r.rating !== null && r.rating !== undefined)
        .map((r: any) => r.rating as number)

      const avgScore = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

      return { name, score: avgScore }
    })
  }, [summary?.categorizedResponses])

  // ═══════════════════════════════════════════════════════════════════════════
  // Encontrar el ID del evaluatee actual en teamMembers (por nombre)
  // ═══════════════════════════════════════════════════════════════════════════
  const currentEvaluateeId = useMemo(() => {
    if (!summary?.evaluatee?.fullName || teamMembers.length === 0) return null

    const evaluateeName = summary.evaluatee.fullName.toLowerCase()
    const found = teamMembers.find(m =>
      m.name.toLowerCase().includes(evaluateeName) ||
      evaluateeName.includes(m.name.toLowerCase())
    )

    console.log('[Summary] Looking for evaluatee:', evaluateeName, 'Found:', found?.name, 'ID:', found?.id)

    return found?.id || null
  }, [summary?.evaluatee?.fullName, teamMembers])

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

  // Success - Renderizar con Panel de Inteligencia DENTRO del header
  const displayName = summary.evaluatee?.fullName || 'Colaborador'

  // DEBUG: Ver qué score retorna el API /summary
  console.log('[Summary] averageScore from API:', summary.averageScore, 'overallScore:', summary.overallScore)

  // El score del API /summary YA viene en escala 1-5 (NO convertir)
  const scoreOn5 = summary.averageScore ?? summary.overallScore ?? null

  console.log('[Summary] scoreOn5 for PerformanceScoreCard:', scoreOn5)

  // ═══════════════════════════════════════════════════════════════════════════
  // Contenido para la columna derecha del header (rightColumnSlot)
  // ═══════════════════════════════════════════════════════════════════════════
  const rightColumnContent = (
    <div className="space-y-4">
      {/* Toggle minimalista - Arriba a la derecha */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex bg-slate-800/50 rounded-md p-0.5 border border-slate-700/50">
          <button
            onClick={() => setActiveView('calibracion')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeView === 'calibracion'
                ? 'bg-cyan-500 text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evaluación
          </button>
          <button
            onClick={() => setActiveView('brechas')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeView === 'brechas'
                ? 'bg-blue-500 text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Brechas
          </button>
          <button
            onClick={() => setActiveView('alertas')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              activeView === 'alertas'
                ? 'bg-cyan-500 text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Coaching
          </button>
        </div>
      </div>

      {/* Contenido según vista activa */}
      {activeView === 'calibracion' && (
        <div className="space-y-3">
          {/* PerformanceScoreCard - Score en escala 1-5 */}
          {scoreOn5 !== null && (
            <PerformanceScoreCard
              score={scoreOn5}
              showProgressBar
              showTeslaLine
              size="sm"
              className="w-full"
            />
          )}

          {/* TeamCalibrationHUD - ranking del equipo */}
          {teamMembers.length > 0 ? (
            <TeamCalibrationHUD
              teamMembers={teamMembers}
              currentEvaluateeId={currentEvaluateeId || undefined}
              maxVisible={5}
              className="w-full"
            />
          ) : (
            <div className="w-full bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 text-center">
              <p className="text-xs text-slate-400">
                No hay suficientes evaluaciones completadas para mostrar el ranking.
              </p>
            </div>
          )}
        </div>
      )}

      {activeView === 'brechas' && summary?.competencyScores && (
        <div className="max-w-2xl mx-auto p-6">
          <GapInsightCarousel
            competencyScores={summary.competencyScores}
            employeeName={summary.evaluatee.fullName}
          />
        </div>
      )}

      {activeView === 'alertas' && (
        <div>
          {competencies.length > 0 ? (
            <InsightCarousel
              competencies={competencies}
              employeeName={displayName}
              className="w-full"
            />
          ) : (
            <div className="w-full p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 text-center">
              <p className="text-xs text-slate-400">
                No hay datos de competencias disponibles para generar alertas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <CinemaSummaryOrchestrator
      summary={summary}
      rightColumnSlot={rightColumnContent}
    />
  )
}
