// ════════════════════════════════════════════════════════════════════════════
// ConsistencyAlertModal - Alerta de incoherencia AAE en calibración
// src/components/calibration/cinema/ConsistencyAlertModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Muestra cuando un movimiento 9-Box contradice los datos AAE del empleado.
// Severidades: critical (rose), warning (amber), info (blue).
// Requiere justificación >= 10 chars para "Forzar Cambio".
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Info,
  ArrowRight,
  AlertOctagon,
  Lightbulb,
} from 'lucide-react'

import DiamondVisual from './DiamondVisual'
import type { ValidationResult, RuleSeverity } from '../hooks/useCalibrationRules'
import type { CinemaEmployee } from '../hooks/useCalibrationRoom'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ConsistencyAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (justification: string) => void
  employee: CinemaEmployee
  validation: ValidationResult
  fromQuadrant: string
  toQuadrant: string
  quadrantNames: Record<string, string>
}

// ════════════════════════════════════════════════════════════════════════════
// SEVERITY STYLES
// ════════════════════════════════════════════════════════════════════════════

const SEVERITY_STYLES: Record<RuleSeverity, {
  icon: typeof AlertTriangle
  bgHeader: string
  borderColor: string
  iconColor: string
  badgeBg: string
  badgeText: string
  buttonBg: string
  buttonHover: string
}> = {
  critical: {
    icon: AlertOctagon,
    bgHeader: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    buttonBg: 'bg-rose-600',
    buttonHover: 'hover:bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bgHeader: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    buttonBg: 'bg-amber-600',
    buttonHover: 'hover:bg-amber-500',
  },
  info: {
    icon: Info,
    bgHeader: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    buttonBg: 'bg-cyan-600',
    buttonHover: 'hover:bg-cyan-500',
  },
}

const SEVERITY_LABELS: Record<RuleSeverity, string> = {
  critical: 'Alerta Crítica',
  warning: 'Advertencia',
  info: 'Información',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ConsistencyAlertModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  validation,
  fromQuadrant,
  toQuadrant,
  quadrantNames,
}: ConsistencyAlertModalProps) {
  const [justification, setJustification] = useState('')
  const [error, setError] = useState('')

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setJustification('')
      setError('')
    }
  }, [isOpen])

  const severity = validation.severity || 'warning'
  const styles = SEVERITY_STYLES[severity]
  const SeverityIcon = styles.icon

  function handleConfirm() {
    if (justification.trim().length < 10) {
      setError('La justificación debe tener al menos 10 caracteres')
      return
    }
    setError('')
    onConfirm(justification.trim())
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[480px] bg-[#0B1120] border-slate-800 p-0 overflow-hidden max-h-[85vh] flex flex-col"
        showCloseButton={false}
      >

        {/* ═══ HEADER CON SEVERIDAD ═══ */}
        <div className={cn('px-6 py-4 border-b shrink-0', styles.bgHeader, styles.borderColor)}>
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg shrink-0', styles.badgeBg)}>
              <SeverityIcon size={20} className={styles.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Badge de severidad */}
              <span className={cn(
                'inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mb-2',
                styles.badgeBg, styles.badgeText
              )}>
                {SEVERITY_LABELS[severity]}
              </span>

              {/* Título */}
              <DialogTitle className="text-base font-bold text-white leading-tight">
                {validation.title}
              </DialogTitle>

              {/* Indicador de movimiento */}
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#111827] border border-slate-800 text-xs">
                <span className="text-slate-400">{quadrantNames[fromQuadrant]}</span>
                <ArrowRight size={14} className="text-cyan-400 shrink-0" />
                <span className="text-white font-bold">{quadrantNames[toQuadrant]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">

          {/* Empleado + DiamondVisual */}
          <div className="flex items-start gap-4">
            {/* Info del empleado */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#111827] border border-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {employee.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white truncate">{employee.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{employee.role}</p>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111827] p-2.5 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Desempeño</span>
                  <div className="text-lg font-mono font-bold text-white">
                    {employee.effectiveScore.toFixed(1)}
                  </div>
                </div>
                <div className="bg-[#111827] p-2.5 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Potencial</span>
                  <div className="text-lg font-mono font-bold text-cyan-400">
                    {employee.effectivePotentialScore?.toFixed(1) ?? '\u2014'}
                  </div>
                </div>
              </div>
            </div>

            {/* DiamondVisual */}
            <div className="shrink-0">
              <DiamondVisual
                aspiration={employee.aspiration}
                ability={employee.ability}
                engagement={employee.engagement}
                conflicts={validation.affectedFactors?.filter(f => f.isConflict).map(f => f.factor)}
                size="sm"
                showLegend
              />
            </div>
          </div>

          {/* Mensaje de la regla */}
          <div className={cn('p-3 rounded-lg border', styles.bgHeader, styles.borderColor)}>
            <p className="text-sm text-slate-300 leading-relaxed">{validation.message}</p>
          </div>

          {/* Recomendación */}
          {validation.recommendation && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <Lightbulb size={14} className="text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-cyan-300/90">{validation.recommendation}</p>
            </div>
          )}

          {/* Justificación OBLIGATORIA */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Justificación de la Excepción *
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explica por qué decides proceder a pesar de la alerta. Esta justificación quedará en el registro de auditoría..."
              className="w-full h-24 bg-[#111827] border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-slate-600">
                Mínimo 10 caracteres
              </p>
              <p className={cn(
                'text-[10px]',
                justification.length >= 10 ? 'text-emerald-400' : 'text-slate-600'
              )}>
                {justification.length}/10
              </p>
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <DialogFooter className="px-6 py-4 bg-[#111827] border-t border-slate-800 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-700 transition-all"
          >
            Cancelar Movimiento
          </button>
          <button
            onClick={handleConfirm}
            disabled={justification.trim().length < 10}
            className={cn(
              'flex-1 py-3 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg transition-all',
              justification.trim().length >= 10
                ? cn(styles.buttonBg, styles.buttonHover)
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            Forzar Cambio y Registrar
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
})
