'use client'

import { useState } from 'react'
import BackfillWizard from '@/components/succession/BackfillWizard'
import BenchHealthyWizard from '@/components/succession/BenchHealthyWizard'
import BenchEmptyWizard from '@/components/succession/BenchEmptyWizard'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BenchCandidate {
  id: string
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  readinessLevel: string
  matchPercent: number
}

export interface DominoResolution {
  resolution: 'COVERED' | 'EXTERNAL_SEARCH' | 'POSITION_ELIMINATED' | 'PENDING'
  backfillEmployeeId?: string
  backfillEmployeeName?: string
  manualEmployeeId?: string
  externalReason?: string
}

interface DominoResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  nivel1: {
    candidatoNombre: string
    posicionAsume: string
    matchPercent: number
    readinessLevel: string
  }
  nivel2: {
    posicionDejaId: string | null
    posicionDejaTitulo: string
    posicionDejaDepartamento: string | null
    posicionDejaJobLevel: string | null
    esCargoCritico: boolean
    benchStrength: string | null
    benchStatus: 'HEALTHY' | 'EMPTY' | 'NON_CRITICAL'
    benchCandidates: BenchCandidate[]
  }
  isMandatory: boolean
  onConfirm: (resolution: DominoResolution) => Promise<void>
  onSkip: () => void
  isLoading: boolean
  onNavigate?: (url: string) => void
  renderEmployeeSearch?: (props: {
    positionId: string
    onSelect: (employee: { id: string; fullName: string; roleFitScore: number; meetsThreshold: boolean }) => void
    onClear: () => void
  }) => React.ReactNode
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DominoResolutionModal({
  isOpen,
  onClose,
  candidateId,
  nivel1,
  nivel2,
  isMandatory,
  onConfirm,
  onSkip,
  isLoading,
  onNavigate,
  renderEmployeeSearch,
}: DominoResolutionModalProps) {
  const [wasResolved, setWasResolved] = useState(false)
  const benchStatus = nivel2.benchStatus

  if (!isOpen) return null

  // ── CASO C: delegado a BackfillWizard ──
  if (benchStatus === 'NON_CRITICAL') {
    function handleBackfillConfirm(resolution: string, data?: Record<string, string>) {
      const mapped: DominoResolution = {
        resolution: resolution as DominoResolution['resolution'],
        ...(data?.backfillEmployeeId && {
          backfillEmployeeId: data.backfillEmployeeId,
          backfillEmployeeName: data.backfillEmployeeName,
        }),
        ...(data?.externalReason && { externalReason: data.externalReason }),
      }
      onConfirm(mapped)
      onClose()
    }
    return (
      <BackfillWizard
        candidateId={candidateId}
        vacatedPositionTitle={nivel2.posicionDejaTitulo}
        onClose={() => { onSkip(); onClose() }}
        onConfirm={handleBackfillConfirm}
      />
    )
  }

  // ── CASO A: delegado a BenchHealthyWizard ──
  if (benchStatus === 'HEALTHY') {
    function handleHealthyWizardConfirm(
      resolution: 'COVERED' | 'PENDING',
      data?: { backfillEmployeeId: string; backfillEmployeeName: string }
    ) {
      const mapped: DominoResolution = {
        resolution,
        ...(data && {
          backfillEmployeeId: data.backfillEmployeeId,
          backfillEmployeeName: data.backfillEmployeeName,
        }),
      }
      onConfirm(mapped)
      setWasResolved(true)
      onClose()
    }
    return (
      <BenchHealthyWizard
        candidateName={nivel1.candidatoNombre}
        vacatedPositionTitle={nivel2.posicionDejaTitulo}
        benchCandidates={nivel2.benchCandidates.map(c => ({
          employeeId: c.employeeId,
          name: c.employeeName,
          position: c.position || '',
          readinessLevel: c.readinessLevel,
          matchPercent: c.matchPercent,
        }))}
        posicionDejaId={nivel2.posicionDejaId}
        onConfirm={handleHealthyWizardConfirm}
        onNavigate={onNavigate ?? (() => {})}
        onClose={() => { onSkip(); onClose() }}
      />
    )
  }

  // ── CASO B: delegado a BenchEmptyWizard ──
  function handleEmptyWizardConfirm(resolution: string, data?: Record<string, string>) {
    const mapped: DominoResolution = {
      resolution: resolution as DominoResolution['resolution'],
      ...(data?.backfillEmployeeId && {
        backfillEmployeeId: data.backfillEmployeeId,
        backfillEmployeeName: data.backfillEmployeeName,
      }),
      ...(data?.externalReason && { externalReason: data.externalReason }),
    }
    onConfirm(mapped)
    onClose()
  }
  return (
    <BenchEmptyWizard
      candidateId={candidateId}
      candidateName={nivel1.candidatoNombre}
      vacatedPositionTitle={nivel2.posicionDejaTitulo}
      posicionDejaId={nivel2.posicionDejaId}
      onConfirm={handleEmptyWizardConfirm}
      onNavigate={onNavigate ?? (() => {})}
      onClose={() => { onSkip(); onClose() }}
    />
  )
}

