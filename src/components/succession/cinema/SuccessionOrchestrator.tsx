'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Shield, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/ui/toast-system'
import { SuccessionMissionControl } from '@/components/succession/SuccessionMissionControl'
import { SuccessionRail, type FilterKey, getDefaultTab } from '@/components/succession/SuccessionRail'
import SuccessionWizard from '@/components/succession/SuccessionWizard'
import SuccessionCandidateModal from './SuccessionCandidateModal'
import SuccessionSpotlightCard from './SuccessionSpotlightCard'
import DominoResolutionModal from './DominoResolutionModal'
import EmployeeSearchInput from './EmployeeSearchInput'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface SuccessionDashboard {
  summary: {
    coverage: number
    coveredRoles: number
    totalRoles: number
    uncoveredRoles: Array<{
      role: string
      bestCandidate: { name: string; readiness: string; readinessLabel: string } | null
    }>
    bench: { readyNow: number; ready1to2Years: number; notReady: number }
    hasData: boolean
  }
  positions: {
    total: number
    byBenchStrength: Record<string, number>
  }
  cycleId: string
}

interface CriticalPosition {
  id: string
  positionTitle: string
  standardJobLevel: string
  benchStrength: string
  incumbentFlightRisk: string | null
  incumbentRetirementDate: string | null
  department: { displayName: string } | null
  incumbent: { id: string; fullName: string; position: string } | null
  _count: { candidates: number }
}

type View = 'LOBBY' | 'SPOTLIGHT'

interface SuccessionOrchestratorProps {
  initialPositions: CriticalPosition[]
  dashboardStats: SuccessionDashboard | null
  canManage: boolean
  onRefresh: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ════════════════════════════════════════════════════════════════════════════

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

// ════════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionOrchestrator({
  initialPositions,
  dashboardStats,
  canManage,
  onRefresh,
}: SuccessionOrchestratorProps) {
  // View states
  const [view, setView] = useState<View>('LOBBY')
  const [direction, setDirection] = useState(1) // 1=forward, -1=back
  const [selectedPosition, setSelectedPosition] = useState<CriticalPosition | null>(null)

  // Spotlight states
  const [positionDetail, setPositionDetail] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionsFilter, setSuggestionsFilter] = useState<'all' | 'area'>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [selectedCandidateMode, setSelectedCandidateMode] = useState<'suggestion' | 'nominated'>('suggestion')
  const [nominating, setNominating] = useState<string | null>(null)
  const [recentNomination, setRecentNomination] = useState<{ name: string } | null>(null)

  // Domino states
  const [showDominoModal, setShowDominoModal] = useState(false)
  const [dominoData, setDominoData] = useState<any>(null)
  const [dominoLoading, setDominoLoading] = useState(false)

  // Filter stats for intelligence story
  const [filterStats, setFilterStats] = useState<any>(null)

  // Wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [showNominateWizard, setShowNominateWizard] = useState(false)

  // Rail state
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [railTab, setRailTab] = useState<FilterKey>(() => getDefaultTab(initialPositions))

  const toast = useToast()
  const router = useRouter()
  const summary = dashboardStats?.summary
  const suggestionsAbortRef = useRef<AbortController | null>(null)

  // ── Navigate to Spotlight ──
  const handlePositionClick = useCallback((positionId: string) => {
    const pos = initialPositions.find(p => p.id === positionId)
    if (!pos) return
    setSelectedPosition(pos)
    setDirection(1)
    setView('SPOTLIGHT')
    setSuggestions([])
    setRecentNomination(null)
    setSelectedCandidate(null)
    setShowCandidateModal(false)
  }, [initialPositions])

  // ── Back to Lobby ──
  const handleBack = useCallback(() => {
    setDirection(-1)
    setView('LOBBY')
    setSelectedPosition(null)
    setPositionDetail(null)
  }, [])

  // ── Load position detail when entering Spotlight ──
  useEffect(() => {
    if (view !== 'SPOTLIGHT' || !selectedPosition) return
    const controller = new AbortController()
    async function load() {
      try {
        const res = await fetch(`/api/succession/critical-positions/${selectedPosition!.id}`, { signal: controller.signal })
        const data = await res.json()
        if (data.success) setPositionDetail(data.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('[Succession] Error loading position detail:', err)
      }
    }
    load()
    return () => controller.abort()
  }, [view, selectedPosition])

  // ── Load suggestions ──
  const loadSuggestions = useCallback(async (filterByArea = false) => {
    if (!selectedPosition) return
    // Cancel any previous suggestions fetch
    suggestionsAbortRef.current?.abort()
    const controller = new AbortController()
    suggestionsAbortRef.current = controller
    setLoadingSuggestions(true)
    try {
      const url = `/api/succession/critical-positions/${selectedPosition.id}/suggestions${filterByArea ? '?filterByArea=true' : ''}`
      const res = await fetch(url, { signal: controller.signal })
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.data)
        setFilterStats(data.filterStats ?? null)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err)
    }
    setLoadingSuggestions(false)
  }, [selectedPosition])

  // ── Nominate handler ──
  const handleNominate = useCallback(async (
    employeeId: string,
    overrideReadiness?: string,
    justification?: string,
  ) => {
    if (!selectedPosition || nominating) return
    setNominating(employeeId)
    const candidateName = suggestions.find(s => s.employeeId === employeeId)?.employeeName || ''
    try {
      const body: Record<string, unknown> = { employeeId }
      if (overrideReadiness) body.readinessOverride = overrideReadiness
      if (justification) body.overrideJustification = justification

      const res = await fetch(`/api/succession/critical-positions/${selectedPosition.id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setShowCandidateModal(false)
        setSelectedCandidate(null)
        setRecentNomination({ name: candidateName })
        // Reload position detail
        const posRes = await fetch(`/api/succession/critical-positions/${selectedPosition.id}`)
        const posData = await posRes.json()
        if (posData.success) setPositionDetail(posData.data)
        setSuggestions(prev => prev.filter(s => s.employeeId !== employeeId))

        // Post-nomination: detect domino effect
        const newCandidateId = data.data?.id || data.candidateId
        if (newCandidateId) {
          try {
            const dominoRes = await fetch(`/api/succession/candidates/${newCandidateId}/domino`)
            const dominoResult = await dominoRes.json()
            if (dominoResult.detected) {
              setDominoData({
                ...dominoResult,
                candidateId: newCandidateId,
                isMandatory: dominoResult.nivel2?.esCargoCritico ?? false,
              })
              setShowDominoModal(true)
              // Don't show toast yet — wait for modal resolution
            } else {
              toast.success(`"${candidateName}" nominado para ${selectedPosition.positionTitle}`)
              onRefresh()
            }
          } catch {
            // If domino check fails, still show success
            toast.success(`"${candidateName}" nominado para ${selectedPosition.positionTitle}`)
            onRefresh()
          }
        } else {
          toast.success(`"${candidateName}" nominado para ${selectedPosition.positionTitle}`)
          onRefresh()
        }
      } else {
        if (data.error?.includes('Ya nominado')) {
          toast.error(`"${candidateName}" ya esta en la terna`)
        } else {
          toast.error(data.error || 'Error al nominar')
        }
      }
    } catch {
      toast.error('Error al nominar')
    }
    setNominating(null)
  }, [selectedPosition, nominating, suggestions, toast, onRefresh])

  // ── Withdraw handler ──
  const handleWithdraw = useCallback(async (employeeId?: string) => {
    if (!employeeId || !selectedPosition) return
    setShowCandidateModal(false)
    // Refresh position detail
    try {
      const res = await fetch(`/api/succession/critical-positions/${selectedPosition.id}`)
      const data = await res.json()
      if (data.success) setPositionDetail(data.data)
    } catch { /* silent */ }
    onRefresh()
  }, [selectedPosition, onRefresh])

  // ── Backfill confirm handler ──
  const handleBackfillConfirm = useCallback(async (resolution: any) => {
    if (!dominoData?.candidateId) return
    setDominoLoading(true)
    try {
      await fetch(`/api/succession/candidates/${dominoData.candidateId}/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolution),
      })
      toast.success('Candidato nominado. Plan de backfill guardado.')
      setShowDominoModal(false)
      setDominoData(null)
      if (selectedPosition) {
        const posRes = await fetch(`/api/succession/critical-positions/${selectedPosition.id}`)
        const posData = await posRes.json()
        if (posData.success) setPositionDetail(posData.data)
      }
      onRefresh()
    } catch {
      toast.error('Error al guardar plan de backfill')
    }
    setDominoLoading(false)
  }, [dominoData, selectedPosition, toast, onRefresh])

  // ── Backfill skip handler (Omitir or close X) ──
  const handleBackfillSkip = useCallback(async () => {
    if (!dominoData?.candidateId) return
    try {
      await fetch(`/api/succession/candidates/${dominoData.candidateId}/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'PENDING' }),
      })
      toast.info('Resolucion pospuesta')
    } catch { /* silent */ }
    setShowDominoModal(false)
    setDominoData(null)
    onRefresh()
  }, [dominoData, toast, onRefresh])

  // ── Resume domino (re-open wizard for PENDING backfills) ──
  const handleResumeDomino = useCallback(async (candidateId: string) => {
    if (dominoLoading || showDominoModal) return
    setDominoLoading(true)
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/domino`)
      const result = await res.json()
      if (result.detected) {
        setDominoData({
          ...result,
          candidateId,
          isMandatory: result.nivel2?.esCargoCritico ?? false,
        })
        setShowDominoModal(true)
      } else {
        toast.info('No se detectó efecto dominó para este candidato')
      }
    } catch {
      toast.error('Error al cargar datos del efecto dominó')
    }
    setDominoLoading(false)
  }, [toast, dominoLoading, showDominoModal])

  // ── Rail stats ──
  const totalCandidates = initialPositions.reduce((sum, p) => sum + p._count.candidates, 0)

  return (
    <div className="h-full bg-[#0A0F1E] flex flex-col overflow-hidden">
      {/* ── MAIN CONTENT (fills above rail 50px) ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {view === 'LOBBY' ? (
            <motion.div
              key="lobby"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center justify-center pb-[50px]"
            >
              {/* MissionControl centered (evaluator pattern) */}
              {summary && (
                <SuccessionMissionControl
                  coverage={summary.coverage}
                  coveredRoles={summary.coveredRoles}
                  totalRoles={summary.totalRoles}
                  positions={initialPositions}
                  onPositionClick={handlePositionClick}
                />
              )}

            </motion.div>
          ) : (
            <motion.div
              key="spotlight"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex items-start justify-center pt-4 pb-[50px] overflow-y-auto"
            >
              {selectedPosition && (
                <SuccessionSpotlightCard
                  position={selectedPosition}
                  positionDetail={positionDetail}
                  suggestions={suggestions}
                  loadingSuggestions={loadingSuggestions}
                  suggestionsFilter={suggestionsFilter}
                  recentNomination={recentNomination}
                  nominating={nominating}
                  canManage={canManage}
                  onBack={handleBack}
                  onLoadSuggestions={loadSuggestions}
                  onFilterChange={(mode) => {
                    setSuggestionsFilter(mode)
                    loadSuggestions(mode === 'area')
                  }}
                  onCandidateClick={(candidate) => {
                    setSelectedCandidate(candidate)
                    setSelectedCandidateMode(candidate.isNominated ? 'nominated' : 'suggestion')
                    setShowCandidateModal(true)
                  }}
                  onResumeDomino={handleResumeDomino}
                  filterStats={filterStats}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RAIL (fixed bottom, evaluator pattern) ── */}
      {initialPositions.length > 0 && (
        <SuccessionRail
          positions={initialPositions}
          selectedPositionId={selectedPosition?.id || null}
          isExpanded={isRailExpanded}
          activeTab={railTab}
          totalCandidates={totalCandidates}
          onToggle={() => setIsRailExpanded(!isRailExpanded)}
          onPositionClick={handlePositionClick}
          onTabChange={setRailTab}
          onCreatePosition={canManage ? () => setShowWizard(true) : undefined}
        />
      )}

      {/* ── CANDIDATE MODAL (fixed inset-0, AvatarInfoModal pattern) ── */}
      <AnimatePresence>
        {showCandidateModal && selectedCandidate && (
          <SuccessionCandidateModal
            candidate={selectedCandidate}
            targetPosition={selectedPosition?.positionTitle || ''}
            targetJobLevel={selectedPosition?.standardJobLevel}
            filterStats={filterStats ? {
              ...filterStats,
              candidateRank: (suggestions.findIndex(s => s.employeeId === selectedCandidate.employeeId) + 1) || 1,
            } : undefined}
            mode={selectedCandidateMode}
            canManage={canManage}
            isNominating={nominating === selectedCandidate.employeeId}
            onNominate={(overrideReadiness, justification) => {
              handleNominate(selectedCandidate.employeeId, overrideReadiness, justification)
            }}
            onWithdraw={() => handleWithdraw(selectedCandidate?.employeeId)}
            onClose={() => setShowCandidateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── DOMINO RESOLUTION MODAL ── */}
      {showDominoModal && dominoData && (
        <DominoResolutionModal
          isOpen={showDominoModal}
          candidateId={dominoData.candidateId ?? ''}
          onClose={() => {
            setShowDominoModal(false)
            setDominoData(null)
          }}
          nivel1={dominoData.nivel1 ? {
            candidatoNombre: dominoData.nivel1.candidatoNombre,
            posicionAsume: dominoData.nivel1.posicionAsume,
            matchPercent: dominoData.nivel1.matchPercent ?? 0,
            readinessLevel: dominoData.nivel1.readinessLevel ?? '',
          } : { candidatoNombre: '', posicionAsume: '', matchPercent: 0, readinessLevel: '' }}
          nivel2={dominoData.nivel2 ? {
            posicionDejaId: dominoData.nivel2.posicionDejaId ?? null,
            posicionDejaTitulo: dominoData.nivel2.posicionDejaTitulo,
            posicionDejaDepartamento: dominoData.nivel2.posicionDejaDepartamento,
            posicionDejaJobLevel: dominoData.nivel2.posicionDejaJobLevel,
            esCargoCritico: dominoData.nivel2.esCargoCritico ?? false,
            benchStrength: dominoData.nivel2.benchStrength,
            benchStatus: dominoData.nivel2.benchStatus ?? 'NON_CRITICAL',
            benchCandidates: dominoData.nivel2.benchCandidates ?? [],
          } : {
            posicionDejaId: null, posicionDejaTitulo: '', posicionDejaDepartamento: null,
            posicionDejaJobLevel: null, esCargoCritico: false, benchStrength: null,
            benchStatus: 'NON_CRITICAL' as const, benchCandidates: [],
          }}
          isMandatory={dominoData.isMandatory ?? false}
          onConfirm={handleBackfillConfirm}
          onSkip={handleBackfillSkip}
          isLoading={dominoLoading}
          onNavigate={(url) => router.push(url)}
          renderEmployeeSearch={(props) => (
            <EmployeeSearchInput
              positionId={props.positionId || undefined}
              onSelect={props.onSelect}
              onClear={props.onClear}
            />
          )}
        />
      )}

      {/* ── CREATE POSITION WIZARD ── */}
      {showWizard && (
        <CreatePositionModal
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false)
            onRefresh()
          }}
        />
      )}

      {/* ── NOMINATE WIZARD ── */}
      {showNominateWizard && selectedPosition && (
        <SuccessionWizard
          positionId={selectedPosition.id}
          onClose={() => setShowNominateWizard(false)}
          onNominated={async () => {
            setShowNominateWizard(false)
            const res = await fetch(`/api/succession/critical-positions/${selectedPosition.id}`)
            const data = await res.json()
            if (data.success) setPositionDetail(data.data)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE POSITION MODAL (moved from page.tsx)
// ════════════════════════════════════════════════════════════════════════════

function CreatePositionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [showCover, setShowCover] = useState(true)
  const [gerenciaId, setGerenciaId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [jobLevel, setJobLevel] = useState('')
  const [incumbentId, setIncumbentId] = useState('')
  const [departments, setDepartments] = useState<Array<{ id: string; displayName: string; parentId: string | null; level: number }>>([])
  const [employees, setEmployees] = useState<Array<{ id: string; fullName: string; position: string | null; standardJobLevel: string | null }>>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const JOB_LEVELS = [
    { value: 'gerente_director', label: 'Gerente / Director' },
    { value: 'subgerente_subdirector', label: 'Subgerente / Subdirector' },
    { value: 'jefe', label: 'Jefe' },
    { value: 'supervisor_coordinador', label: 'Supervisor / Coordinador' },
    { value: 'profesional_analista', label: 'Profesional / Analista' },
    { value: 'asistente_otros', label: 'Asistente / Otros' },
    { value: 'operativo_auxiliar', label: 'Operativo / Auxiliar' },
  ]

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/succession/departments')
        const data = await res.json()
        if (data.success) setDepartments(data.data)
      } catch (err) {
        console.error(err)
      }
      setLoadingDepts(false)
    }
    load()
  }, [])

  const gerencias = departments.filter(d => d.parentId === null || d.level <= 2)
  const subDepartments = departments.filter(d => d.parentId === gerenciaId)

  useEffect(() => {
    const deptId = departmentId || gerenciaId
    if (!deptId || !jobLevel) {
      setEmployees([])
      return
    }
    setLoadingEmployees(true)
    const timer = setTimeout(() => {
      const controller = new AbortController()
      fetch(`/api/succession/employees?departmentId=${deptId}&jobLevel=${jobLevel}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => { if (data.success) setEmployees(data.data) })
        .catch(err => { if (err.name !== 'AbortError') console.error(err) })
        .finally(() => setLoadingEmployees(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [departmentId, gerenciaId, jobLevel])

  const selectedEmployee = employees.find(e => e.id === incumbentId)
  const positionTitle = selectedEmployee?.position || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!positionTitle || !jobLevel) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/succession/critical-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionTitle,
          standardJobLevel: jobLevel,
          departmentId: departmentId || gerenciaId || undefined,
          incumbentId: incumbentId || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Posicion "${positionTitle}" creada exitosamente`)
        onCreated()
      } else {
        setError(data.error || 'Error al crear')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setSaving(false)
    }
  }

  // ── Portada SmartRouter ──
  if (showCover) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="relative bg-[#0F172A]/95 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden w-full max-w-md mx-4"
        >
          {/* Tesla line cyan */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #22D3EE 70%, transparent 100%)',
            }}
          />

          <div className="p-8 flex flex-col items-center text-center space-y-6">

            {/* Icono */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>

            {/* Titulo */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Proteger un cargo clave
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Dinos quien ocupa un cargo que no puede quedar vacante. El sistema identificara automaticamente quienes en tu empresa estan mejor preparados para sucederlo.
              </p>
            </div>

            {/* Que pasara */}
            <div className="w-full space-y-2 text-left">
              {[
                'Seleccionas el cargo y quien lo ocupa hoy',
                'FocalizaHR analiza a toda tu empresa',
                'Te presenta los mejores candidatos listos para asumir',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-cyan-400">{i + 1}</span>
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowCover(false)}
              className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-slate-950
                         flex items-center justify-center gap-2 transition-all duration-200
                         bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98]
                         shadow-[0_4px_20px_rgba(34,211,238,0.30)]"
            >
              Comenzar registro
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Cancelar */}
            <button
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Cancelar
            </button>

          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#0F172A]/95 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden w-full max-w-lg mx-4">

        {/* Tesla line cyan */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #22D3EE 30%, #22D3EE 70%, transparent 100%)',
          }}
        />

        <div className="p-6">
        <h2 className="text-lg font-bold text-white tracking-tight mb-5">Nueva Posicion Critica</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="fhr-text-sm text-slate-400 block mb-1">Gerencia</label>
            {loadingDepts ? (
              <div className="fhr-input w-full text-slate-500 animate-pulse">Cargando...</div>
            ) : (
              <select
                className="fhr-input w-full"
                value={gerenciaId}
                onChange={e => { setGerenciaId(e.target.value); setDepartmentId(''); setIncumbentId('') }}
              >
                <option value="">Seleccionar gerencia...</option>
                {gerencias.map(g => (
                  <option key={g.id} value={g.id}>{g.displayName}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="fhr-text-sm text-slate-400 block mb-1">Departamento</label>
            <select
              className="fhr-input w-full"
              value={departmentId}
              onChange={e => { setDepartmentId(e.target.value); setIncumbentId('') }}
              disabled={!gerenciaId || subDepartments.length === 0}
            >
              <option value="">
                {!gerenciaId ? 'Selecciona gerencia primero' : subDepartments.length === 0 ? 'Sin sub-departamentos' : 'Seleccionar departamento...'}
              </option>
              {subDepartments.map(d => (
                <option key={d.id} value={d.id}>{d.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="fhr-text-sm text-slate-400 block mb-1">Nivel de Cargo</label>
            <select
              className="fhr-input w-full"
              value={jobLevel}
              onChange={e => { setJobLevel(e.target.value); setIncumbentId('') }}
            >
              <option value="">Seleccionar nivel...</option>
              {JOB_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          {(gerenciaId && jobLevel) && (
            <div>
              <label className="fhr-text-sm text-slate-400 block mb-1">
                Titular actual <span className="text-rose-400">*</span>
              </label>
              {loadingEmployees ? (
                <div className="fhr-input w-full text-slate-500 animate-pulse">Buscando...</div>
              ) : employees.length > 0 ? (
                <select
                  className="fhr-input w-full"
                  value={incumbentId}
                  onChange={e => setIncumbentId(e.target.value)}
                >
                  <option value="">— Seleccionar titular —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}{emp.position ? ` — ${emp.position}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-500">Sin empleados en este departamento y nivel</p>
              )}
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !incumbentId || !jobLevel}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                         bg-cyan-400 hover:bg-cyan-300 text-slate-950
                         shadow-[0_4px_20px_rgba(34,211,238,0.30)]
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                         active:scale-[0.98]"
            >
              {saving ? 'Creando...' : 'Crear cargo'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
