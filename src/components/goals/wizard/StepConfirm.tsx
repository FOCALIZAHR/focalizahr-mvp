// ════════════════════════════════════════════════════════════════════════════
// STEP CONFIRM - Paso 6: Resumen y confirmacion
// src/components/goals/wizard/StepConfirm.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  Target,
  Calendar,
  BarChart3,
  Link2,
  Building2,
  Users,
  User,
} from 'lucide-react'
import GoalLevelBadge from '../GoalLevelBadge'
import GoalProgressBar from '../GoalProgressBar'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepConfirmProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_LABELS: Record<string, string> = {
  COMPANY: 'Corporativa',
  AREA: 'De Area',
  INDIVIDUAL: 'Individual',
}

const TYPE_LABELS: Record<string, string> = {
  KPI: 'KPI',
  PROJECT: 'Proyecto',
  OBJECTIVE: 'Objetivo (O)',
  KEY_RESULT: 'Key Result (KR)',
}

const METRIC_LABELS: Record<string, string> = {
  PERCENTAGE: 'Porcentaje',
  CURRENCY: 'Moneda',
  NUMBER: 'Cantidad',
  BINARY: 'Si/No',
}

const LEVEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  COMPANY: Building2,
  AREA: Users,
  INDIVIDUAL: User,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepConfirm({ data }: StepConfirmProps) {
  const formattedStartDate = useMemo(() => {
    if (!data.startDate) return '-'
    return new Date(data.startDate + 'T00:00:00').toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [data.startDate])

  const formattedDueDate = useMemo(() => {
    if (!data.dueDate) return '-'
    return new Date(data.dueDate + 'T00:00:00').toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [data.dueDate])

  const LevelIcon = data.level ? LEVEL_ICONS[data.level] : Target

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">Confirmar meta</h2>
        <p className="text-slate-400 text-sm">
          Revisa los datos antes de crear la meta
        </p>
      </div>

      {/* Card resumen */}
      <div className="space-y-4">
        {/* Titulo y nivel */}
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            {LevelIcon && (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <LevelIcon className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {data.level && (
                  <GoalLevelBadge
                    level={data.level as 'COMPANY' | 'AREA' | 'INDIVIDUAL'}
                  />
                )}
                <span className="fhr-text-sm text-slate-400">
                  {TYPE_LABELS[data.type] || data.type}
                </span>
              </div>
              <h3 className="text-white font-medium truncate">{data.title}</h3>
            </div>
          </div>
          {data.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>

        {/* Metrica */}
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Medicion
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-slate-500">Tipo</div>
              <div className="text-sm text-white">
                {METRIC_LABELS[data.metricType] || data.metricType}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Inicio</div>
              <div className="text-sm text-white tabular-nums">
                {data.startValue.toLocaleString()}
                {data.unit ? ` ${data.unit}` : ''}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Objetivo</div>
              <div className="text-sm text-cyan-400 tabular-nums">
                {data.targetValue.toLocaleString()}
                {data.unit ? ` ${data.unit}` : ''}
              </div>
            </div>
          </div>
          <GoalProgressBar progress={0} status="NOT_STARTED" size="sm" />
        </div>

        {/* Fechas */}
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" />
            Plazos
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500">Inicio</div>
              <div className="text-sm text-white">{formattedStartDate}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Limite</div>
              <div className="text-sm text-white">{formattedDueDate}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Periodo: {data.periodYear}
            {data.periodQuarter ? ` Q${data.periodQuarter}` : ''}
          </div>
        </div>

        {/* Cascada */}
        {data.parentTitle && (
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <Link2 className="w-4 h-4 text-slate-400" />
              Cascada
            </div>
            <p className="text-sm text-cyan-400">
              Deriva de: {data.parentTitle}
            </p>
          </div>
        )}

        {/* Peso */}
        {data.weight > 0 && (
          <div className="p-3 bg-slate-800/30 rounded-lg text-sm">
            <span className="text-slate-400">Peso en evaluacion: </span>
            <span className="text-white font-medium">{data.weight}%</span>
          </div>
        )}
      </div>
    </div>
  )
})
