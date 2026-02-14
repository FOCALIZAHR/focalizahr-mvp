// ════════════════════════════════════════════════════════════════════════════
// ConsistencyAlertModal - Alerta de incoherencia AAE en calibración
// src/components/calibration/cinema/ConsistencyAlertModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// REDISEÑO v2.0 - Filosofía Tesla/Apple FocalizaHR
// Muestra cuando un movimiento 9-Box contradice los datos AAE del empleado.
// Severidades comunicadas de forma sutil, elegante, no agresiva.
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
// SEVERITY STYLES - Minimalista Tesla/Apple
// Solo iconos y líneas sutiles, NO fondos coloreados agresivos
// ════════════════════════════════════════════════════════════════════════════

const SEVERITY_STYLES: Record<RuleSeverity, {
  icon: typeof AlertTriangle
  accentColor: string
  borderAccent: string
  iconColor: string
  lineGradient: string
}> = {
  critical: {
    icon: AlertOctagon,
    accentColor: 'rgba(244, 63, 94, 0.15)',
    borderAccent: 'border-rose-500/20',
    iconColor: 'text-rose-400',
    lineGradient: 'from-transparent via-rose-500/40 to-transparent',
  },
  warning: {
    icon: AlertTriangle,
    accentColor: 'rgba(251, 191, 36, 0.1)',
    borderAccent: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    lineGradient: 'from-transparent via-amber-500/40 to-transparent',
  },
  info: {
    icon: Info,
    accentColor: 'rgba(34, 211, 238, 0.08)',
    borderAccent: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
    lineGradient: 'from-transparent via-cyan-500/40 to-transparent',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
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
        className="max-w-[480px] bg-[#0B1120] border border-slate-800 p-0 overflow-hidden max-h-[85vh] flex flex-col"
        showCloseButton={false}
      >
        {/* ═══ LÍNEA TESLA SUPERIOR (indicador sutil de severidad) ═══ */}
        <div className={cn(
          'h-[1px] w-full bg-gradient-to-r',
          styles.lineGradient
        )} />

        {/* ═══ HEADER MINIMALISTA ═══ */}
        <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0f1523]">
          <div className="flex items-start gap-4">
            {/* Icono de severidad - sutil, no gritón */}
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              'bg-slate-800/60 border border-slate-700/50'
            )}>
              <SeverityIcon size={18} className={cn(styles.iconColor, 'opacity-80')} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Título - limpio, sin badge */}
              <DialogTitle className="text-[15px] font-semibold text-slate-100 leading-snug tracking-tight">
                {validation.title}
              </DialogTitle>

              {/* Indicador de movimiento - elegante como en JustificationDrawer */}
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-[#111827] border border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">
                  {quadrantNames[fromQuadrant]}
                </span>
                <ArrowRight size={12} className="text-cyan-400/70 shrink-0" />
                <span className="text-xs text-slate-200 font-semibold">
                  {quadrantNames[toQuadrant]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">

          {/* Empleado + DiamondVisual */}
          <div className="flex items-start gap-5">
            {/* Info del empleado */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#111827] border border-slate-700/70 flex items-center justify-center text-sm font-semibold text-slate-200 shrink-0">
                  {employee.avatar}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-100 truncate text-[14px]">
                    {employee.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{employee.role}</p>
                </div>
              </div>

              {/* Scores - estilo JustificationDrawer */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111827] p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Desempeño
                  </span>
                  <div className="text-lg font-mono font-semibold text-slate-100 mt-0.5">
                    {employee.effectiveScore.toFixed(1)}
                  </div>
                </div>
                <div className="bg-[#111827] p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Potencial
                  </span>
                  <div className="text-lg font-mono font-semibold text-cyan-400/90 mt-0.5">
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

          {/* Mensaje de la regla - elegante, no como error box */}
          <div className="pl-4 border-l-2 border-slate-700/50">
            <p className="text-sm text-slate-400 leading-relaxed">
              {validation.message}
            </p>
          </div>

          {/* Recomendación - sutil con icono pequeño */}
          {validation.recommendation && (
            <div className="flex items-start gap-2.5 py-3 px-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <Lightbulb size={14} className="text-cyan-400/70 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                {validation.recommendation}
              </p>
            </div>
          )}

          {/* Justificación OBLIGATORIA */}
          <div className="pt-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">
              Justificación de la Excepción
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explica por qué decides proceder a pesar de la alerta. Esta justificación quedará en el registro de auditoría..."
              className={cn(
                'w-full h-24 bg-[#111827] rounded-lg p-3.5',
                'text-sm text-slate-300 placeholder-slate-600',
                'border border-slate-700/70',
                'focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
                'outline-none resize-none transition-all duration-200'
              )}
            />
            <div className="flex justify-between mt-2">
              <p className="text-[10px] text-slate-600">
                Mínimo 10 caracteres
              </p>
              <p className={cn(
                'text-[10px] font-medium transition-colors',
                justification.length >= 10 ? 'text-emerald-500/80' : 'text-slate-600'
              )}>
                {justification.length}/10
              </p>
            </div>
            {error && (
              <p className="text-xs text-rose-400/90 mt-1.5">{error}</p>
            )}
          </div>
        </div>

        {/* ═══ FOOTER - Botones estilo FocalizaHR Premium ═══ */}
        <DialogFooter className="px-6 py-4 bg-[#0f1523] border-t border-slate-800/60 shrink-0 flex gap-3">
          {/* Ghost Button - Cancelar */}
          <button
            onClick={onClose}
            className={cn(
              'flex-1 py-3 rounded-lg',
              'bg-slate-800/60 border border-slate-700/50',
              'text-slate-400 text-xs font-semibold uppercase tracking-wider',
              'hover:bg-slate-800 hover:border-slate-600/50 hover:text-slate-300',
              'transition-all duration-200'
            )}
          >
            Cancelar
          </button>

          {/* Primary Button - Confirmar */}
          <button
            onClick={handleConfirm}
            disabled={justification.trim().length < 10}
            className={cn(
              'flex-1 py-3 rounded-lg',
              'text-xs font-semibold uppercase tracking-wider',
              'transition-all duration-200',
              justification.trim().length >= 10
                ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-900 shadow-lg shadow-cyan-900/20'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700/30'
            )}
          >
            Confirmar y Registrar
          </button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
})