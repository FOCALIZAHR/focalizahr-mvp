'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB 2: SEMÁFORO LEGAL
// src/app/dashboard/executive-hub/components/PLTalent/tabs/SemaforoLegalTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cards por persona con semáforo + botón Legal Review (IntelligenceInsight)
// Tono empático: "brecha de desempeño", NO "underperformer"
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Scale, CheckCircle2 } from 'lucide-react'
import type { SemaforoLegalData, SemaforoPersona } from '../PLTalent.types'
import { formatCurrency } from '../PLTalent.utils'
import { SEMAPHORE_CONFIG } from '../PLTalent.constants'
import { formatDisplayName } from '@/lib/utils/formatName'

interface Props {
  data: SemaforoLegalData
}

export default memo(function SemaforoLegalTab({ data }: Props) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleLegalReview = useCallback(async (person: SemaforoPersona) => {
    if (reviewedIds.has(person.employeeId) || loadingId) return

    setLoadingId(person.employeeId)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch('/api/executive-hub/pl-talent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: person.employeeId,
          employeeName: person.fullName,
          yearsOfService: person.yearsOfService,
        }),
      })

      if (res.ok || res.status === 409) {
        // 409 = already exists → also mark as reviewed
        setReviewedIds(prev => new Set(prev).add(person.employeeId))
      }
    } catch (err) {
      console.error('[SemaforoLegal] Error creating legal review:', err)
    } finally {
      setLoadingId(null)
    }
  }, [reviewedIds, loadingId])

  if (data.totalPeople === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Scale className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm font-light">Sin personas en zona legal.</p>
        <p className="text-xs text-slate-600 mt-1">Ningún colaborador tiene clasificación de bajo rendimiento activa.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ═══ SUMMARY HEADER ═══ */}
      <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
        <span>{data.totalPeople} persona{data.totalPeople > 1 ? 's' : ''}</span>
        <span className="text-slate-700">|</span>
        <span>{formatCurrency(data.totalLiability)} acumulado</span>
        <span className="text-slate-700">|</span>
        <span>+{formatCurrency(data.monthlyGrowth)}/mes</span>
      </div>

      {/* ═══ PERSON CARDS ═══ */}
      <div className="space-y-2">
        {data.people.map((person, idx) => {
          const sem = SEMAPHORE_CONFIG[person.semaphore]
          const isReviewed = reviewedIds.has(person.employeeId)
          const isLoading = loadingId === person.employeeId

          return (
            <motion.div
              key={person.employeeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: idx * 0.04 }}
              className={cn(
                'rounded-xl border overflow-hidden',
                'bg-slate-800/30 backdrop-blur-xl',
                'border-slate-700/30'
              )}
            >
              <div className="p-4 space-y-3">
                {/* Row 1: Semaphore + Name + Position */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <div className={cn('w-2 h-2 rounded-full', sem.dot)} />
                    <span className={cn('text-[9px] font-bold uppercase tracking-wider', sem.text)}>
                      {sem.label}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {formatDisplayName(person.fullName)}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {person.position} · {person.departmentName} · {person.yearsOfService} años
                    </p>
                  </div>
                </div>

                {/* Row 2: Financial pills */}
                <div className="grid grid-cols-3 gap-2">
                  <FinancialPill
                    label="Finiquito hoy"
                    value={formatCurrency(person.finiquitoToday)}
                    color="text-white"
                  />
                  <FinancialPill
                    label="+3 meses"
                    value={formatCurrency(person.finiquitoIn3Months)}
                    color="text-slate-300"
                  />
                  <FinancialPill
                    label="Brecha/mes"
                    value={person.monthlyImproductivity > 0 ? formatCurrency(person.monthlyImproductivity) : '—'}
                    color="text-purple-400"
                  />
                </div>

                {/* Row 3: Legal Review button */}
                <button
                  onClick={() => handleLegalReview(person)}
                  disabled={isReviewed || isLoading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px]',
                    isReviewed
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-slate-700/30 border border-slate-600/30 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400'
                  )}
                >
                  {isReviewed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Consulta registrada
                    </>
                  ) : isLoading ? (
                    <span className="text-slate-500">Registrando...</span>
                  ) : (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      Solicitar Revisión Legal/HR
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ═══ COACHING TIP ═══ */}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed max-w-sm mx-auto">
        La inacción tiene este costo. La decisión es tuya. Cada consulta registrada queda como trazabilidad para RRHH y Legal.
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// FINANCIAL PILL
// ════════════════════════════════════════════════════════════════════════════

function FinancialPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center px-2 py-2 rounded-lg bg-slate-900/40 border border-slate-800/40">
      <p className={cn('text-sm font-medium font-mono', color)}>{value}</p>
      <p className="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
