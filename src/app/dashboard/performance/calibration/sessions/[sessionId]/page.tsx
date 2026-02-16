// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION CINEMA PAGE
// src/app/dashboard/performance/calibration/sessions/[sessionId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// DndContext principal + integración de todos los componentes Cinema
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { useCalibrationRoom, type CinemaEmployee } from '@/components/calibration/hooks/useCalibrationRoom'
import { useCalibrationRules, QUADRANT_NAMES, type ValidationResult } from '@/components/calibration/hooks/useCalibrationRules'
import CinemaHeader from '@/components/calibration/cinema/CinemaHeader'
import CinemaGrid from '@/components/calibration/cinema/CinemaGrid'
import { CinemaCardOverlay } from '@/components/calibration/cinema/CinemaCard'
import JustificationDrawer from '@/components/calibration/cinema/JustificationDrawer'
import ConsistencyAlertModal from '@/components/calibration/cinema/ConsistencyAlertModal'
import ClosingCeremonyModal from '@/components/calibration/closing/ClosingCeremonyModal'
import CalibrationLiveFeed from '@/components/calibration/cinema/CalibrationLiveFeed'

// ═══ COMPONENTES EXISTENTES (NO crear de nuevo) ═══
import DistributionGauge from '@/components/performance/DistributionGauge'
import DistributionModal from '@/components/performance/DistributionModal'

import { getBonusFactor } from '@/config/calibrationBonusFactors'
import { NineBoxPosition } from '@/config/performanceClassification'
import { Search, Lock, BarChart3, Loader2 } from 'lucide-react'

// NineBox → bonus status for original distribution calc
function getStatusFromNineBox(nineBox: string): string {
  switch (nineBox) {
    case NineBoxPosition.STAR: return 'STARS'
    case NineBoxPosition.HIGH_PERFORMER:
    case NineBoxPosition.GROWTH_POTENTIAL:
    case NineBoxPosition.POTENTIAL_GEM: return 'HIGH'
    case NineBoxPosition.CORE_PLAYER:
    case NineBoxPosition.TRUSTED_PROFESSIONAL: return 'CORE'
    case NineBoxPosition.UNDERPERFORMER: return 'RISK'
    default: return 'NEUTRAL'
  }
}

export default function CalibrationCinemaPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const {
    session,
    employeeList,
    stats,
    adjustments,
    participants,
    isLoading,
    isReadOnly,
    canEdit,
    userRole,
    moveEmployee,
    closeSession,
    startSession
  } = useCalibrationRoom({ sessionId })

  const { validateMove } = useCalibrationRules()

  const [selectedEmp, setSelectedEmp] = useState<CinemaEmployee | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    employee: CinemaEmployee
    newQuadrant: string
  } | null>(null)
  const [activeEmployee, setActiveEmployee] = useState<CinemaEmployee | null>(null)
  const [showDistModal, setShowDistModal] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [consistencyWarning, setConsistencyWarning] = useState<{
    employee: CinemaEmployee
    validation: ValidationResult
    fromQuadrant: string
    toQuadrant: string
  } | null>(null)

  // ═══════════════════════════════════════════════════════════
  // CLOSING CEREMONY DATA
  // ═══════════════════════════════════════════════════════════

  const ceremonyData = useMemo(() => {
    if (!employeeList.length) {
      return {
        originalDistribution: [0, 0, 0, 0, 0],
        calibratedDistribution: [0, 0, 0, 0, 0],
        originalBonusFactor: 0,
        calibratedBonusFactor: 0,
        totalAdjustments: 0
      }
    }

    // Score → bucket index (1-5 → 0-4)
    function scoreToBucket(score: number): number {
      if (score >= 4.5) return 4 // Excepcional
      if (score >= 3.5) return 3 // Alto
      if (score >= 2.5) return 2 // Sólido
      if (score >= 1.5) return 1 // Desarrollo
      return 0                    // Bajo
    }

    const total = employeeList.length
    const origBuckets = [0, 0, 0, 0, 0]
    const calBuckets = [0, 0, 0, 0, 0]
    let origBonusSum = 0
    let calBonusSum = 0
    let adjustments = 0

    for (const emp of employeeList) {
      origBuckets[scoreToBucket(emp.calculatedScore)]++
      calBuckets[scoreToBucket(emp.effectiveScore)]++

      // Original bonus: use calculated nineBox status (or fallback NEUTRAL)
      const origNineBox = emp.calculatedNineBox || 'core_player'
      const origStatus = getStatusFromNineBox(origNineBox)
      origBonusSum += getBonusFactor(origStatus)

      // Calibrated bonus: use effective status
      calBonusSum += getBonusFactor(emp.status)

      if (emp.hasChanged) adjustments++
    }

    return {
      originalDistribution: origBuckets.map(b => Math.round((b / total) * 100)),
      calibratedDistribution: calBuckets.map(b => Math.round((b / total) * 100)),
      originalBonusFactor: total > 0 ? origBonusSum / total : 0,
      calibratedBonusFactor: total > 0 ? calBonusSum / total : 0,
      totalAdjustments: adjustments
    }
  }, [employeeList])

  // ═══════════════════════════════════════════════════════════
  // @DND-KIT SENSORS (con soporte touch)
  // ═══════════════════════════════════════════════════════════

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">Cargando sesión de calibración...</span>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // FILTRADO
  // ═══════════════════════════════════════════════════════════

  const filteredEmployees = employeeList.filter(emp => {
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // ═══════════════════════════════════════════════════════════
  // HANDLERS (@dnd-kit)
  // ═══════════════════════════════════════════════════════════

  function handleDragStart(event: DragStartEvent) {
    const employee = event.active.data.current?.employee as CinemaEmployee | undefined
    setActiveEmployee(employee || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveEmployee(null)
    const { active, over } = event

    if (!over || isReadOnly) return

    const employeeId = active.id as string
    const newQuadrant = over.id as string

    const employee = employeeList.find(e => e.id === employeeId)
    if (!employee) return

    // Si cambió de cuadrante, validar AAE antes de pedir justificación
    if (employee.quadrant !== newQuadrant) {
      const validation = validateMove(employee, newQuadrant)

      if (validation.hasWarning) {
        // AAE incoherencia → ConsistencyAlertModal
        setConsistencyWarning({
          employee,
          validation,
          fromQuadrant: employee.quadrant,
          toQuadrant: newQuadrant,
        })
      } else {
        // Sin alertas → flujo normal (JustificationDrawer)
        setPendingMove({ employee, newQuadrant })
        setSelectedEmp(employee)
      }
    }
  }

  async function handleConfirmMove(justification: string) {
    if (!pendingMove) return

    await moveEmployee(
      pendingMove.employee.id,
      pendingMove.newQuadrant,
      justification
    )

    setPendingMove(null)
    setSelectedEmp(null)
  }

  function handleCancelMove() {
    setPendingMove(null)
    setSelectedEmp(null)
  }

  function handleCardClick(emp: CinemaEmployee) {
    // Solo abrir drawer si no estamos en un drag
    if (!pendingMove) {
      setSelectedEmp(emp)
    }
  }

  async function handleForceMove(justification: string) {
    if (!consistencyWarning) return

    const { employee, toQuadrant, validation } = consistencyWarning
    const fullJustification = `[EXCEPCIÓN: ${validation.ruleId}] ${justification}`

    await moveEmployee(employee.id, toQuadrant, fullJustification)
    setConsistencyWarning(null)
  }

  function handleDismissWarning() {
    setConsistencyWarning(null)
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen bg-[#0B1120] flex flex-col overflow-hidden">

        {/* HEADER */}
        <CinemaHeader
          session={session}
          stats={stats}
          onClose={() => router.push('/dashboard/performance/calibration')}
          onFinish={() => setShowCeremony(true)}
          onStart={startSession}
          isReadOnly={isReadOnly}
          userRole={userRole}
        />

        {/* TOOLBAR */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800 bg-[#0f1523] flex-shrink-0">

          {/* Left: Distribution Gauge (componente existente) */}
          <div
            onClick={() => setShowDistModal(true)}
            className="cursor-pointer hidden md:block"
          >
            <DistributionGauge
              variant="compact"
              assignedScores={stats.assignedScores}
              minToShow={1}
            />
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full h-10 pl-10 pr-4 bg-[#111827] border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDistModal(true)}
              className="h-10 px-4 bg-[#111827] border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition-all flex items-center gap-2"
            >
              <BarChart3 size={14} />
              Distribución
            </button>

            {isReadOnly && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
                <Lock size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  {session?.status === 'CLOSED' ? 'Sesión Cerrada' : 'Solo Lectura'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* GRID 9-BOX */}
        <main className="flex-1 overflow-auto p-6">
          <CinemaGrid
            employees={filteredEmployees}
            isReadOnly={isReadOnly}
            onCardClick={handleCardClick}
          />
        </main>

        {/* JUSTIFICATION DRAWER */}
        <JustificationDrawer
          employee={selectedEmp}
          targetQuadrant={pendingMove?.newQuadrant}
          isOpen={!!selectedEmp}
          onClose={handleCancelMove}
          onConfirm={handleConfirmMove}
        />

        {/* CONSISTENCY ALERT MODAL (Árbitro AAE) */}
        {consistencyWarning && (
          <ConsistencyAlertModal
            isOpen={!!consistencyWarning}
            onClose={handleDismissWarning}
            onConfirm={handleForceMove}
            employee={consistencyWarning.employee}
            validation={consistencyWarning.validation}
            fromQuadrant={consistencyWarning.fromQuadrant}
            toQuadrant={consistencyWarning.toQuadrant}
            quadrantNames={QUADRANT_NAMES}
          />
        )}

        {/* DISTRIBUTION MODAL (componente existente) */}
        <DistributionModal
          isOpen={showDistModal}
          onClose={() => setShowDistModal(false)}
          assignedScores={stats.assignedScores}
          totalEvaluated={stats.total}
        />

        {/* DRAG OVERLAY - Renderiza en portal, evita clipping por overflow */}
        <DragOverlay dropAnimation={null}>
          {activeEmployee ? <CinemaCardOverlay employee={activeEmployee} /> : null}
        </DragOverlay>

        {/* CLOSING CEREMONY MODAL */}
        <ClosingCeremonyModal
          isOpen={showCeremony}
          onClose={() => setShowCeremony(false)}
          sessionId={sessionId}
          originalDistribution={ceremonyData.originalDistribution}
          calibratedDistribution={ceremonyData.calibratedDistribution}
          originalBonusFactor={ceremonyData.originalBonusFactor}
          calibratedBonusFactor={ceremonyData.calibratedBonusFactor}
          totalEmployees={stats.total}
          totalAdjustments={ceremonyData.totalAdjustments}
        />

        {/* LIVE FEED (esquina inferior izquierda) */}
        <CalibrationLiveFeed
          adjustments={adjustments}
          participants={participants}
        />

      </div>
    </DndContext>
  )
}
