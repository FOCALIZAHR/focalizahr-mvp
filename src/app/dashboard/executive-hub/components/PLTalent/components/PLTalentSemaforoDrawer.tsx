'use client'

// ════════════════════════════════════════════════════════════════════════════
// SEMÁFORO DRAWER — Barra inferior colapsable con personas en zona legal
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { ChevronUp, ChevronDown, Skull } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../PLTalent.utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { SemaforoPersona } from '../PLTalent.types'

interface PLTalentSemaforoDrawerProps {
  summary: {
    totalPeople: number
    totalLiability: number
    monthlyGrowth: number
  }
  people: SemaforoPersona[]
  onPersonClick?: (person: SemaforoPersona) => void
}

const SEMAPHORE_DOT: Record<string, string> = {
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
}

export default memo(function PLTalentSemaforoDrawer({
  summary,
  people,
  onPersonClick,
}: PLTalentSemaforoDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (summary.totalPeople === 0) return null

  return (
    <div className="mt-4">

      {/* Barra colapsada */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 md:p-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
            <Skull className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-white font-medium text-sm">
              Semáforo: <strong>{summary.totalPeople}</strong> personas
            </p>
            <p className="text-slate-400 text-xs">
              Pasivo: {formatCurrency(summary.totalLiability)} ·
              <span className="text-red-400"> +{formatCurrency(summary.monthlyGrowth)}/mes</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-slate-400 text-xs hidden md:inline">Ver detalle</span>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronUp className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="mt-2 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl max-h-[50vh] overflow-y-auto">
          <div className="p-3 md:p-4 space-y-2">
            {people.map(person => (
              <button
                key={person.employeeId}
                onClick={() => onPersonClick?.(person)}
                className="w-full p-3 md:p-4 bg-slate-800/50 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', SEMAPHORE_DOT[person.semaphore])} />
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{formatDisplayName(person.fullName)}</p>
                    <p className="text-slate-400 text-xs truncate">
                      {person.position} · {person.yearsOfService} años
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-red-400 font-mono text-sm">{formatCurrency(person.finiquitoToday)}</p>
                  <p className="text-slate-500 text-[10px]">+{formatCurrency(person.monthlyImproductivity)}/mes</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
