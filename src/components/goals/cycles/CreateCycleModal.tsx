// src/components/goals/cycles/CreateCycleModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Modal de creación de ciclo de metas — Gate D.3 (SPEC_GOALCYCLE_v4).
//
// Fricción MÍNIMA: crear es reversible (el ciclo nace en PLANNING, sin efectos
// sobre metas ni sobre el ciclo activo). La confirmación pesada se reserva para
// Activar (D.4). Crear ≠ activar: se puede crear con otro ciclo ya ACTIVE.
//
// Consume POST /api/goals/cycles (Gate C). El servidor pone status=PLANNING,
// inyecta accountId/createdBy del contexto (NUNCA del body) y valida el período
// (unique) + closureWindow > assignmentWindow. Este modal espeja esas reglas
// client-side solo para feedback inline; la API sigue siendo la autoridad.
//
// Tokens .fhr-* calcados de la página hermana D.2 (consistencia, Mandamiento 7).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import CycleWindowsFields from './CycleWindowsFields'
import { validateCycleWindows, type CycleWindowValues } from './cycleWindows'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalPeriodType = 'ANNUAL' | 'SEMESTER' | 'QUARTERLY'

interface CreateCycleModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void // la página pasa () => mutate() para revalidar la lista
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES (calcadas de StepSetDates.tsx para consistencia con el wizard)
// ════════════════════════════════════════════════════════════════════════════

const PERIOD_TYPES: { value: GoalPeriodType; label: string }[] = [
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'SEMESTER', label: 'Semestral' },
  { value: 'QUARTERLY', label: 'Trimestral' },
]

const QUARTERS = [
  { value: 1, label: 'Q1 (Ene-Mar)' },
  { value: 2, label: 'Q2 (Abr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dic)' },
]

const SEMESTERS = [
  { value: 1, label: 'S1 (Ene-Jun)' },
  { value: 2, label: 'S2 (Jul-Dic)' },
]

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

// Nombre sugerido según período (editable — solo autocompleta si no lo tocaron)
function suggestName(
  periodType: GoalPeriodType,
  year: number,
  quarter: number,
  semester: number
): string {
  if (periodType === 'QUARTERLY') return quarter ? `Q${quarter} ${year}` : `${year}`
  if (periodType === 'SEMESTER') return semester ? `S${semester} ${year}` : `${year}`
  return `Año ${year}`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function CreateCycleModal({
  open,
  onClose,
  onCreated,
}: CreateCycleModalProps) {
  const { success, error } = useToast()

  const [name, setName] = useState(`Año ${currentYear}`)
  const [nameTouched, setNameTouched] = useState(false)
  const [periodType, setPeriodType] = useState<GoalPeriodType>('ANNUAL')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState(0)
  const [semester, setSemester] = useState(0)
  const [assignmentWindow, setAssignmentWindow] = useState('')
  const [trackingWindow, setTrackingWindow] = useState('')
  const [closureWindow, setClosureWindow] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Autocompletar nombre mientras el usuario no lo edite manualmente
  useEffect(() => {
    if (!nameTouched) {
      setName(suggestName(periodType, year, quarter, semester))
    }
  }, [nameTouched, periodType, year, quarter, semester])

  function resetForm() {
    setName(`Año ${currentYear}`)
    setNameTouched(false)
    setPeriodType('ANNUAL')
    setYear(currentYear)
    setQuarter(0)
    setSemester(0)
    setAssignmentWindow('')
    setTrackingWindow('')
    setClosureWindow('')
  }

  function handleClose() {
    if (submitting) return
    resetForm()
    onClose()
  }

  function handlePeriodTypeChange(next: GoalPeriodType) {
    setPeriodType(next)
    // Limpiar el campo condicional que no aplica al nuevo tipo
    if (next !== 'QUARTERLY') setQuarter(0)
    if (next !== 'SEMESTER') setSemester(0)
  }

  function handleWindowChange(field: keyof CycleWindowValues, value: string) {
    if (field === 'assignmentWindow') setAssignmentWindow(value)
    else if (field === 'trackingWindow') setTrackingWindow(value)
    else setClosureWindow(value)
  }

  // ── Validación client-side de ventanas (fuente única: cycleWindows.ts) ──
  // Feedback inmediato; el server (validateWindowOrder) es la barrera real.
  const windowsV = validateCycleWindows(year, {
    assignmentWindow,
    trackingWindow,
    closureWindow,
  })

  const nameValid = name.trim().length > 0
  const periodValid =
    periodType === 'QUARTERLY'
      ? quarter >= 1 && quarter <= 4
      : periodType === 'SEMESTER'
      ? semester >= 1 && semester <= 2
      : true

  const isValid = nameValid && periodValid && windowsV.isValid

  async function handleSubmit() {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null

      const res = await fetch('/api/goals/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          periodType,
          year,
          quarter: periodType === 'QUARTERLY' ? quarter : 0,
          semester: periodType === 'SEMESTER' ? semester : 0,
          assignmentWindow: new Date(assignmentWindow).toISOString(),
          trackingWindow: new Date(trackingWindow).toISOString(),
          closureWindow: new Date(closureWindow).toISOString(),
        }),
      })

      const body = await res.json().catch(() => null)

      if (res.ok) {
        success(
          'El ciclo quedó en planificación. Actívalo cuando quieras abrir el período.',
          'Ciclo creado'
        )
        onCreated()
        resetForm()
        onClose()
        return
      }

      if (body?.code === 'GOAL_CYCLE_PERIOD_EXISTS') {
        error(
          'Ya existe un ciclo para ese período. Revisá el año, el tipo y el trimestre/semestre.',
          'Período duplicado'
        )
      } else {
        error(body?.error ?? 'No pudimos crear el ciclo. Intentá de nuevo.', 'Error')
      }
    } catch {
      error('No pudimos conectar con el servidor. Intentá de nuevo.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="fhr-card-static relative overflow-hidden w-full max-w-lg max-h-[90vh] overflow-y-auto p-0"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Línea Tesla (idéntica a la card de lista D.2) */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] z-10"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                opacity: 0.7,
              }}
            />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
                    Crear{' '}
                    <span className="fhr-title-gradient">ciclo</span>
                  </h2>
                  <p className="text-sm font-light text-slate-400 mt-1">
                    Quedará en planificación. Podés activarlo cuando abras el período.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="text-slate-400 hover:text-white transition-colors disabled:opacity-40 shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <div className="space-y-6">
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Nombre del ciclo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setNameTouched(true)
                      setName(e.target.value)
                    }}
                    placeholder="Ej: Año 2026"
                    className="fhr-input w-full"
                  />
                </div>

                {/* Tipo de período */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Tipo de período</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERIOD_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => handlePeriodTypeChange(pt.value)}
                        className={cn(
                          'p-2.5 rounded-lg border text-sm text-center transition-all',
                          periodType === pt.value
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Año + campo condicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">Año</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="fhr-input w-full"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {periodType === 'QUARTERLY' && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Trimestre</label>
                      <div className="grid grid-cols-2 gap-2">
                        {QUARTERS.map((q) => (
                          <button
                            key={q.value}
                            type="button"
                            onClick={() => setQuarter(q.value)}
                            className={cn(
                              'p-2 rounded-lg border text-xs text-center transition-all',
                              quarter === q.value
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                            )}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {periodType === 'SEMESTER' && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Semestre</label>
                      <div className="grid grid-cols-2 gap-2">
                        {SEMESTERS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSemester(s.value)}
                            className={cn(
                              'p-2 rounded-lg border text-xs text-center transition-all',
                              semester === s.value
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ventanas del ciclo (componente compartido con edición D.8) */}
                <div className="space-y-4 pt-4 border-t border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300">
                    Ventanas del ciclo
                  </h3>
                  <CycleWindowsFields
                    year={year}
                    values={{ assignmentWindow, trackingWindow, closureWindow }}
                    onChange={handleWindowChange}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                <GhostButton onClick={handleClose} disabled={submitting} fullWidth>
                  Cancelar
                </GhostButton>
                <PrimaryButton
                  onClick={handleSubmit}
                  isLoading={submitting}
                  disabled={!isValid}
                  fullWidth
                >
                  Crear ciclo
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
