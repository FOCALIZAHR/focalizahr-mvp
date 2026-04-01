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
import { getTenureTrend } from '@/config/narratives/TenureRoleFitDictionary'
import { SEMAFORO_NARRATIVE_DICTIONARY } from '@/config/narratives/SemaforoNarrativeDictionary'

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

          // Semáforo Narrative — narrativa CEO por antigüedad (BAJO_RENDIMIENTO)
          const trend = getTenureTrend(person.tenureMonths)
          const semaforoNarrative = SEMAFORO_NARRATIVE_DICTIONARY[trend]

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
                {/* Row 1: Semaphore + Diagnosis badge + Name + Position */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', sem.dot)} />
                      <span className={cn('text-[9px] font-bold uppercase tracking-wider', sem.text)}>
                        {sem.label}
                      </span>
                    </div>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500 block pl-4">
                      {semaforoNarrative.headline}
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

                {/* Semáforo Narrative — Por qué debe salir */}
                <div className="border-l-2 border-amber-500/30 pl-3 space-y-1">
                  <p className="text-[11px] font-medium text-slate-300">
                    {semaforoNarrative.headline}
                  </p>
                  <p className="text-[10px] font-light text-slate-500 leading-relaxed">
                    {semaforoNarrative.context}
                  </p>
                  <p className="text-[10px] font-light text-slate-400 leading-relaxed">
                    {semaforoNarrative.action}
                  </p>
                </div>

                {/* Breakeven + Próxima anualidad */}
                <div className="space-y-1.5">
                  {person.breakevenMonths && (
                    <div className="group/breakeven relative">
                      <p className="text-[10px] text-amber-400/70 font-light italic cursor-help">
                        En <span className="font-medium">{person.breakevenMonths} meses</span> sin actuar, lo que pierdes en productividad superará el costo de desvincular.
                      </p>
                      {/* Tooltip — explica la base de cálculo */}
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover/breakeven:opacity-100 transition-opacity pointer-events-none z-10 w-72">
                        <p className="text-[10px] text-slate-300 mb-1.5">¿Cómo se calcula?</p>
                        <p className="text-[9px] text-slate-500 leading-relaxed">
                          Su cargo exige un mínimo de 75% de RoleFit. Esta persona opera al {person.roleFitScore}%. Esos {75 - person.roleFitScore} puntos de brecha equivalen al {75 - person.roleFitScore}% de su salario mensual: {formatCurrency(person.monthlyImproductivity)} que se pagan cada mes sin retorno.
                        </p>
                        <p className="text-[9px] text-slate-400 leading-relaxed mt-1.5">
                          {formatCurrency(person.monthlyImproductivity)} × {person.breakevenMonths} meses = {formatCurrency(person.monthlyImproductivity * person.breakevenMonths)}. Eso supera el finiquito de hoy ({formatCurrency(person.finiquitoToday)}).
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Acaba de sumar anualidad — el costo de no haber actuado */}
                  {person.recentlyAddedYear && (
                    <p className="text-[10px] text-red-400/80 font-light italic">
                      Acaba de sumar un nuevo año de servicio. De haber actuado antes, el finiquito hoy sería <span className="font-medium">{formatCurrency(person.estimatedSalary)}</span> menor.
                    </p>
                  )}
                  {/* Va a sumar anualidad pronto — urgencia para actuar */}
                  {person.tenureMonths >= 12 && person.monthsUntilNextYear !== null && person.monthsUntilNextYear <= 6 && (
                    <p className="text-[10px] text-red-400/80 font-light italic">
                      En <span className="font-medium">{person.monthsUntilNextYear} {person.monthsUntilNextYear === 1 ? 'mes' : 'meses'}</span> cumple un nuevo año de servicio. El finiquito sube un sueldo completo.
                    </p>
                  )}
                </div>

                {/* Row 2: Financial pills */}
                <div className="group/pills relative">
                  <div className="grid grid-cols-4 gap-1.5">
                    <FinancialPill
                      label="Sin tope"
                      value={formatCurrency(person.finiquitoToday)}
                      color="text-white"
                    />
                    <FinancialPill
                      label="Con tope 90UF"
                      value={formatCurrency(person.finiquitoTodayConTope)}
                      color="text-cyan-400"
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
                  {/* Tooltip — valores aproximados */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover/pills:opacity-100 transition-opacity pointer-events-none z-10 w-64">
                    <p className="text-[10px] text-slate-300 mb-1">Valores aproximados</p>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      Calculados con salarios promedio de la familia de cargo. Sin tope usa salario completo. Con tope aplica Art. 172 (base imponible máxima 90 UF). Ambos incluyen tope legal de 11 años de servicio (Art. 163) y 1 mes de preaviso (Art. 161).
                    </p>
                  </div>
                </div>

                {/* Row 3: Legal Review button */}
                <div className="group/cta relative">
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
                  {/* Tooltip — qué hace el CTA */}
                  {!isReviewed && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover/cta:opacity-100 transition-opacity pointer-events-none z-10 w-72">
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Registra que este caso fue revisado por el CEO. RRHH y Legal reciben la señal de que la decisión está en curso. Queda como trazabilidad ejecutiva para el próximo ciclo.
                      </p>
                    </div>
                  )}
                </div>
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
