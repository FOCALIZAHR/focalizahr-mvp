// ════════════════════════════════════════════════════════════════════════════
// STEP CHOOSE FLOW — Paso 1: bifurcación Meta Libre / Meta Definida (Gate C)
// src/components/goals/wizard/StepChooseFlow.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reemplaza al antiguo "Paso 1 · Alcance" como primera pantalla del wizard.
//
// NIVEL 1 — la decisión de fondo:
//   · Meta Libre    → el jefe escribe su propia meta (Camino D): wizard completo.
//   · Meta Definida → el jefe ASIGNA una meta ya creada por el Estratega, del banco
//                     (Caminos B/C). El KPI viene congelado del origen: lo único que
//                     el jefe decide es el peso.
//
// NIVEL 2 (solo si eligió Meta Definida) — de qué banco:
//   · Corporativa → banco level:COMPANY
//   · De Área     → banco level:AREA (el servidor ya filtra por el departamento del
//                   jefe para AREA_MANAGER — no se re-filtra acá).
//
// VISUAL: cero tokens nuevos. Las tarjetas son las mismas de StepSelectLevel
// (p-4 rounded-xl border-2 bg-slate-800/50 + Tesla line sobre la seleccionada) y el
// check de confirmación es el mismo círculo cyan de WizardProgress.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Library, Building2, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalWizardData } from './CreateGoalWizard'

interface StepChooseFlowProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

const FLOWS = [
  {
    value: 'LIBRE' as const,
    label: 'Meta Libre',
    description: 'Escribís tu propia meta: título, indicador y objetivo.',
    icon: PenLine,
  },
  {
    value: 'DEFINIDA' as const,
    label: 'Meta Definida',
    description: 'Asignás una meta ya creada. El indicador viene consolidado: solo definís el peso.',
    icon: Library,
  },
]

const BANKS = [
  {
    value: 'COMPANY' as const,
    label: 'Corporativa',
    description: 'Metas de toda la empresa',
    icon: Building2,
  },
  {
    value: 'AREA' as const,
    label: 'De Área',
    description: 'Metas de tu departamento',
    icon: Users,
  },
]

export default memo(function StepChooseFlow({ data, updateData }: StepChooseFlowProps) {
  const handleSelectFlow = useCallback(
    (flow: 'LIBRE' | 'DEFINIDA') => {
      // Cambiar de rama limpia la elección de banco: quedaría huérfana en Meta Libre.
      updateData({ flow, bankLevel: undefined })
    },
    [updateData]
  )

  const handleSelectBank = useCallback(
    (bankLevel: 'COMPANY' | 'AREA') => {
      updateData({ bankLevel })
    },
    [updateData]
  )

  return (
    <div className="space-y-6">
      {/* ── NIVEL 1 ── */}
      <div className="grid gap-4">
        {FLOWS.map((flow) => {
          const Icon = flow.icon
          const isSelected = data.flow === flow.value

          return (
            <button
              key={flow.value}
              onClick={() => handleSelectFlow(flow.value)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden',
                'bg-slate-800/50',
                isSelected ? 'border-cyan-500/50' : 'border-slate-700 hover:border-slate-600'
              )}
            >
              {/* Tesla line sobre la seleccionada (mismo patrón que StepSelectLevel) */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                  }}
                />
              )}

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'bg-cyan-500/20' : 'bg-slate-700/50'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isSelected ? 'text-cyan-400' : 'text-slate-400')} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn('font-medium', isSelected ? 'text-white' : 'text-slate-300')}>
                    {flow.label}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{flow.description}</p>
                </div>

                {/* Check de selección — mismo círculo cyan de WizardProgress */}
                {isSelected && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── NIVEL 2 — solo si eligió Meta Definida ── */}
      <AnimatePresence>
        {data.flow === 'DEFINIDA' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 pt-2 overflow-hidden"
          >
            <p className="text-sm text-slate-300">¿De qué banco la tomás?</p>

            <div className="grid gap-3 md:grid-cols-2">
              {BANKS.map((bank) => {
                const Icon = bank.icon
                const isSelected = data.bankLevel === bank.value

                return (
                  <button
                    key={bank.value}
                    onClick={() => handleSelectBank(bank.value)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden',
                      'bg-slate-800/50',
                      isSelected ? 'border-cyan-500/50' : 'border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                        }}
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn('w-5 h-5 shrink-0', isSelected ? 'text-cyan-400' : 'text-slate-400')}
                      />
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium', isSelected ? 'text-white' : 'text-slate-300')}>
                          {bank.label}
                        </p>
                        <p className="text-xs text-slate-500">{bank.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
