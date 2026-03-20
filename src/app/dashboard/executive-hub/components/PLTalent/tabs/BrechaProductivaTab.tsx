'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB 1: BRECHA PRODUCTIVA
// src/app/dashboard/executive-hub/components/PLTalent/tabs/BrechaProductivaTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Barras horizontales con divs + Flexbox (SIN recharts)
// Paleta Tesla: cyan→purple→indigo (sin rojo sólido)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import type { BrechaProductivaData, BrechaGerencia } from '../PLTalent.types'
import { formatCurrency, getRoleFitBarColor } from '../PLTalent.utils'

interface Props {
  data: BrechaProductivaData
}

export default memo(function BrechaProductivaTab({ data }: Props) {
  const [expandedGerencia, setExpandedGerencia] = useState<string | null>(null)

  if (data.totalPeople === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-sm font-light">Sin brecha productiva detectada.</p>
        <p className="text-xs text-slate-600 mt-1">Todos los evaluados superan el 75% de Role Fit.</p>
      </div>
    )
  }

  const maxGap = Math.max(...data.byGerencia.map(g => g.gapMonthly), 1)

  return (
    <div className="space-y-6">

      {/* ═══ HERO ═══ */}
      <div className="text-center space-y-1">
        <p className="text-3xl sm:text-4xl font-light text-white">
          {formatCurrency(data.totalGapMonthly)}
          <span className="text-lg text-slate-500 font-light">/mes</span>
        </p>
        <p className="text-xs text-slate-500">
          {data.totalPeople} de {data.totalEvaluated} personas con brecha
        </p>
      </div>

      {/* ═══ SALARY SOURCE WARNING ═══ */}
      {data.salarySource === 'default_chile' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-400/80">Salarios estimados. Configura tus datos reales para mayor precisión.</p>
        </div>
      )}

      {/* ═══ BARS BY GERENCIA ═══ */}
      <div className="space-y-2">
        {data.byGerencia.map((ger, idx) => {
          const isExpanded = expandedGerencia === ger.gerenciaId
          const isRisk = ger.avgRoleFit < 45
          const barWidth = Math.max((ger.gapMonthly / maxGap) * 100, 3)

          return (
            <div key={ger.gerenciaId}>
              {/* Gerencia row */}
              <button
                onClick={() => setExpandedGerencia(isExpanded ? null : ger.gerenciaId)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isRisk && (
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                    <p className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">
                      {ger.gerenciaName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 font-mono flex-shrink-0">
                    {formatCurrency(ger.gapMonthly)}
                  </p>
                  <p className="text-[9px] text-slate-600 flex-shrink-0">
                    {ger.headcount}p
                  </p>
                  <ChevronDown className={cn(
                    'w-3 h-3 text-slate-600 transition-transform flex-shrink-0',
                    isExpanded && 'rotate-180'
                  )} />
                </div>

                {/* Bar */}
                <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className={cn('h-full rounded-full', getRoleFitBarColor(ger.avgRoleFit))}
                  />
                </div>
              </button>

              {/* Expanded departments */}
              <AnimatePresence>
                {isExpanded && ger.departments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 pb-1 space-y-1.5 border-l border-slate-700/30 ml-2 mt-1">
                      {ger.departments.map(dept => {
                        const deptBarWidth = Math.max((dept.gapMonthly / ger.gapMonthly) * 100, 3)
                        const deptIsRisk = dept.avgRoleFit < 45
                        return (
                          <div key={dept.departmentId}>
                            <div className="flex items-center gap-2 mb-0.5">
                              {deptIsRisk && (
                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                </span>
                              )}
                              <p className="text-[10px] text-slate-500 truncate flex-1">{dept.departmentName}</p>
                              <p className="text-[10px] text-slate-500 font-mono flex-shrink-0">{formatCurrency(dept.gapMonthly)}</p>
                              <p className="text-[8px] text-slate-600 flex-shrink-0">{dept.headcount}p</p>
                            </div>
                            <div className="h-1 rounded-full bg-slate-800/30 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', getRoleFitBarColor(dept.avgRoleFit))}
                                style={{ width: `${deptBarWidth}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
})
