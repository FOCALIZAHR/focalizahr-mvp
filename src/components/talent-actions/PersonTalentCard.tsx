'use client'

// ════════════════════════════════════════════════════════════════════════════
// PERSON TALENT CARD — Card individual con narrativa TalentNarrativeService
// src/components/talent-actions/PersonTalentCard.tsx
//
// Diferente de PersonRow (compacta, dentro de QuadrantDrilldown por gerencia).
// Esta card es enriquecida: narrativa completa, urgencia, accion sugerida.
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { Shield, Check } from 'lucide-react'
import { TalentNarrativeService } from '@/lib/services/TalentNarrativeService'
import { getTalentMapNarrative } from '@/config/TalentMapNarratives'
import TenureSegmentBadge from './TenureSegmentBadge'
import type { QuadrantPerson } from '@/lib/services/TalentActionService'

interface PersonTalentCardProps {
  person: QuadrantPerson
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (employeeId: string) => void
}

const ALERT_BADGE_COLORS: Record<string, string> = {
  RED: 'bg-red-500/20 text-red-400',
  ORANGE: 'bg-orange-500/20 text-orange-400',
  YELLOW: 'bg-yellow-500/20 text-yellow-400',
  GREEN: 'bg-emerald-500/20 text-emerald-400'
}

const URGENCY_DOT: Record<string, string> = {
  CRITICA: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MEDIA: 'bg-amber-500',
  BAJA: 'bg-slate-500'
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
  const badgeColor = ALERT_BADGE_COLORS[mapNarrative.alertLevel] || ''

  return (
    <div
      className={`bg-slate-800/50 rounded-xl p-4 border transition-colors ${
        selected ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700/50 hover:border-slate-600/50'
      }`}
      onClick={selectable ? () => onToggleSelect?.(person.employeeId) : undefined}
      role={selectable ? 'button' : undefined}
    >

      {/* Header: nombre + badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkbox */}
          {selectable && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(person.employeeId) }}
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected
                  ? 'bg-cyan-500 border-cyan-500'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{person.fullName}</p>
            {person.isSuccessor && (
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-slate-500 truncate">
              {person.position || 'Sin cargo'} · {person.departmentName}
            </p>
          </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2 shrink-0">
          <TenureSegmentBadge segment={person.tenureSegment} months={person.tenureMonths} />
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
            {mapNarrative.badge}
          </span>
          {person.tenureMonths > 60 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400">
              Veterano
            </span>
          )}
        </div>
      </div>

      {/* Narrativa */}
      {narrative && (
        <div className="mt-3 space-y-2">
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700">
            <div className="flex items-start gap-2">
              <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${URGENCY_DOT[narrative.urgencyLevel] || 'bg-slate-500'}`} />
              <div>
                <p className="text-sm font-medium text-white">{narrative.headline}</p>
                <p className="text-xs text-slate-400 mt-1">{narrative.recommendedAction}</p>
              </div>
            </div>
          </div>

          {narrative.conflictAlert && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400">{narrative.conflictAlert}</p>
            </div>
          )}
        </div>
      )}

      {/* RoleFit si existe */}
      {person.roleFitScore !== null && (
        <div className="mt-2 text-[10px] text-slate-500">
          Role Fit: <span className="text-cyan-400 font-medium">{Math.round(person.roleFitScore)}%</span>
        </div>
      )}
    </div>
  )
}
