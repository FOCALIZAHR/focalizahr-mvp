'use client'

// ════════════════════════════════════════════════════════════════════════════
// PERSON TALENT CARD — Card individual con narrativa TalentNarrativeService
// Usa clases .fhr-* de focalizahr-unified.css
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { Shield, Check } from 'lucide-react'
import { TalentNarrativeService } from '@/lib/services/TalentNarrativeService'
import { formatDisplayName } from '@/lib/utils/formatName'
import { getTalentMapNarrative } from '@/config/TalentMapNarratives'
import TenureSegmentBadge from './TenureSegmentBadge'
import type { QuadrantPerson } from '@/lib/services/TalentActionService'

interface PersonTalentCardProps {
  person: QuadrantPerson
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (employeeId: string) => void
}

const URGENCY_DOT: Record<string, string> = {
  CRITICA: 'var(--fhr-error)',
  ALTA: '#F97316',
  MEDIA: 'var(--fhr-warning)',
  BAJA: 'var(--fhr-text-muted)'
}

export default function PersonTalentCard({ person, selectable, selected, onToggleSelect }: PersonTalentCardProps) {
  const narrative = useMemo(() => {
    if (!person.riskQuadrant && !person.mobilityQuadrant) return null
    return TalentNarrativeService.getIndividualNarrative(
      person.riskQuadrant,
      person.mobilityQuadrant,
      person.roleFitScore,
      person.fullName
    )
  }, [person.riskQuadrant, person.mobilityQuadrant, person.roleFitScore, person.fullName])

  const mapNarrative = getTalentMapNarrative(person.riskQuadrant, person.tenureSegment)

  return (
    <div
      className={`fhr-card relative ${selected ? 'ring-1 ring-cyan-500/30' : ''}`}
      onClick={selectable ? () => onToggleSelect?.(person.employeeId) : undefined}
      role={selectable ? 'button' : undefined}
      style={{ cursor: selectable ? 'pointer' : undefined }}
    >

      {/* Header: nombre + badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {selectable && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(person.employeeId) }}
              className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
              style={{
                background: selected ? 'var(--fhr-cyan)' : 'transparent',
                borderColor: selected ? 'var(--fhr-cyan)' : 'var(--fhr-border-default)'
              }}
            >
              {selected && <Check className="w-3 h-3 text-white" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--fhr-text-primary)' }}>
                {formatDisplayName(person.fullName, 'full')}
              </p>
              {person.isSuccessor && (
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--fhr-cyan)' }} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] truncate" style={{ color: 'var(--fhr-text-muted)' }}>
                {person.position
                  ?.replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, c => c.toUpperCase())
                  || 'Sin cargo'} · {person.departmentName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2 shrink-0">
          <TenureSegmentBadge segment={person.tenureSegment} months={person.tenureMonths} />
          {/* Badge fhr-badge */}
          <span className="fhr-badge fhr-badge-warning" style={{ fontSize: '0.625rem' }}>
            {mapNarrative.badge}
          </span>
        </div>
      </div>

      {/* Narrativa */}
      {narrative && (
        <div className="mt-3 space-y-2">
          <div className="fhr-card-glass">
            <div className="flex items-start gap-2">
              <span
                className="shrink-0 w-2 h-2 rounded-full mt-1.5"
                style={{ background: URGENCY_DOT[narrative.urgencyLevel] || 'var(--fhr-text-muted)' }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--fhr-text-primary)' }}>
                  {narrative.headline}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--fhr-text-tertiary)' }}>
                  {narrative.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {narrative.conflictAlert && (
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'var(--fhr-warning-muted)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}
            >
              <p className="text-xs" style={{ color: 'var(--fhr-warning)' }}>{narrative.conflictAlert}</p>
            </div>
          )}
        </div>
      )}

      {/* RoleFit */}
      {person.roleFitScore !== null && (
        <div className="mt-2 text-[10px]" style={{ color: 'var(--fhr-text-muted)' }}>
          Role Fit: <span className="font-medium" style={{ color: 'var(--fhr-cyan)' }}>{Math.round(person.roleFitScore)}%</span>
        </div>
      )}
    </div>
  )
}
