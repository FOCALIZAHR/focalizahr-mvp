'use client'

import { useState } from 'react'
import { Users, ChevronDown, ChevronUp, AlertTriangle, FileText } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// CANDIDATE LIST COMPONENT
// Lista sorted por readiness con badges, progress bar y gaps expandible
// ════════════════════════════════════════════════════════════════════════════

interface Candidate {
  id: string
  matchPercent: number
  currentRoleFit: number
  readinessLevel: string
  readinessOverride: string | null
  flightRisk: string | null
  gapsCriticalCount: number
  gapsStrategicCount: number
  gapsLeadershipCount: number
  gapsJson: any[]
  estimatedMonths: number | null
  developmentPlan: { id: string; status: string } | null
  employee: {
    id: string
    fullName: string
    position: string | null
    department: { displayName: string } | null
  }
}

interface CandidateListProps {
  candidates: Candidate[]
  canManage: boolean
  onCreatePDI?: (candidateId: string) => void
}

const READINESS_CONFIG: Record<string, { badge: string; label: string; color: string }> = {
  READY_NOW: { badge: 'fhr-badge-success', label: 'Listo ahora', color: 'text-emerald-400' },
  READY_1_2_YEARS: { badge: 'fhr-badge-warning', label: '1-2 anos', color: 'text-amber-400' },
  READY_3_PLUS: { badge: 'fhr-badge-error', label: '3+ anos', color: 'text-red-400' },
  NOT_VIABLE: { badge: 'fhr-badge-draft', label: 'No viable', color: 'text-slate-400' },
}

export default function CandidateList({ candidates, canManage, onCreatePDI }: CandidateListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Sin candidatos nominados</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {candidates.map(c => {
        const effective = c.readinessOverride || c.readinessLevel
        const config = READINESS_CONFIG[effective] || READINESS_CONFIG.NOT_VIABLE
        const isExpanded = expandedId === c.id
        const gaps = Array.isArray(c.gapsJson) ? c.gapsJson : []

        return (
          <div key={c.id} className="rounded-lg bg-slate-800/40 border border-slate-700/30 overflow-hidden">
            {/* Main row */}
            <div
              className="p-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : c.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-200 font-medium">{c.employee.fullName}</span>
                    <span className={`fhr-badge ${config.badge}`}>{config.label}</span>
                    {c.flightRisk === 'HIGH' && (
                      <span className="fhr-badge fhr-badge-error flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Fuga
                      </span>
                    )}
                    {c.developmentPlan && (
                      <span className="fhr-badge fhr-badge-premium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        PDI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    {c.employee.position && <span>{c.employee.position}</span>}
                    {c.employee.department && <span>{c.employee.department.displayName}</span>}
                    {c.estimatedMonths !== null && c.estimatedMonths > 0 && (
                      <span>~{c.estimatedMonths} meses</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Match % */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${config.color}`}>
                      {Math.round(c.matchPercent)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Match</div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                  style={{ width: `${Math.min(c.matchPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Expanded gap details */}
            {isExpanded && gaps.length > 0 && (
              <div className="px-4 pb-4 border-t border-slate-700/30">
                <div className="mt-3 flex items-center gap-3 mb-2">
                  <span className="text-xs text-slate-400">
                    Gaps: <strong className="text-red-400">{c.gapsCriticalCount}</strong> criticos,{' '}
                    <strong className="text-amber-400">{c.gapsStrategicCount}</strong> estrategicos,{' '}
                    <strong className="text-blue-400">{c.gapsLeadershipCount}</strong> liderazgo
                  </span>
                </div>
                <div className="space-y-1.5">
                  {gaps
                    .filter((g: any) => g.rawGap < 0)
                    .slice(0, 8)
                    .map((g: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 truncate flex-1">{g.competencyName}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-slate-500">{g.actualScore?.toFixed(1)} / {g.targetScore?.toFixed(1)}</span>
                          <span className={g.rawGap <= -2 ? 'text-red-400 font-medium' : 'text-amber-400'}>
                            {g.rawGap > 0 ? '+' : ''}{g.rawGap?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Create PDI button */}
                {canManage && !c.developmentPlan && onCreatePDI && (
                  <button
                    className="fhr-btn fhr-btn-secondary text-xs mt-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreatePDI(c.id)
                    }}
                  >
                    <FileText className="w-3 h-3 mr-1 inline" />
                    Crear PDI desde Gaps
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
