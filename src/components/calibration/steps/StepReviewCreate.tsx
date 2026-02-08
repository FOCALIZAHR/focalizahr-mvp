// ════════════════════════════════════════════════════════════════════════════
// STEP 4: Revisar y Crear
// src/components/calibration/steps/StepReviewCreate.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { CheckCircle, Calendar, Building2, Users, FileText, Clock, Filter } from 'lucide-react'

const FILTER_MODE_LABELS: Record<string, string> = {
  jobLevel: 'Por Nivel Jerárquico',
  jobFamily: 'Por Familia de Cargos',
  directReports: 'Por Reportes de Manager',
  customPicks: 'Selección Manual',
  department: 'Por Departamento'
}

interface StepReviewCreateProps {
  cycleName: string
  sessionName: string
  description: string
  scheduledAt: string
  selectedDepartments: string[]
  departmentNames?: string[]
  filterMode?: string
  filterConfig?: any
  participants: Array<{ email: string; name: string; role: string }>
}

export default memo(function StepReviewCreate({
  cycleName,
  sessionName,
  description,
  scheduledAt,
  selectedDepartments,
  departmentNames = [],
  filterMode,
  filterConfig,
  participants
}: StepReviewCreateProps) {
  const facilitators = participants.filter(p => p.role === 'FACILITATOR')
  const reviewers = participants.filter(p => p.role === 'REVIEWER')
  const observers = participants.filter(p => p.role === 'OBSERVER')

  const scopeLabel = filterMode
    ? FILTER_MODE_LABELS[filterMode] || filterMode
    : selectedDepartments.length === 0
      ? 'Toda la empresa'
      : `${selectedDepartments.length} departamento(s)`

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin programar'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="fhr-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Listo para crear</h2>
            <p className="text-sm text-slate-400">
              Revisa la configuración antes de confirmar la sesión.
            </p>
          </div>
        </div>

        {/* Divider decorativo */}
        <div className="fhr-divider my-4" />

        {/* Nombre sesión */}
        <div className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
            Sesión de calibración
          </div>
          <h3 className="text-2xl font-semibold text-white">{sessionName}</h3>
        </div>

        {/* Métricas */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="fhr-card-metric">
            <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-xs text-slate-500">Ciclo</div>
            <div className="text-sm font-medium text-white">{cycleName}</div>
          </div>

          <div className="fhr-card-metric">
            <Clock className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-xs text-slate-500">Programada</div>
            <div className="text-sm font-medium text-white">{formattedDate}</div>
          </div>

          <div className="fhr-card-metric">
            <Building2 className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xs text-slate-500">Alcance</div>
            <div className="text-sm font-medium text-white">{scopeLabel}</div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      {description && (
        <div className="fhr-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Descripción</span>
          </div>
          <p className="text-sm text-slate-300">{description}</p>
        </div>
      )}

      {/* Departamentos específicos */}
      {selectedDepartments.length > 0 && departmentNames.length > 0 && (
        <div className="fhr-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-400">
              Departamentos incluidos
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {departmentNames.map((deptName, index) => (
              <span
                key={index}
                className="fhr-badge fhr-badge-active"
              >
                {deptName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtro multi-criterio */}
      {filterMode && filterMode !== 'department' && filterConfig && (
        <div className="fhr-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-400">
              Criterio de filtrado
            </span>
          </div>
          <div className="text-sm text-white mb-1">
            {FILTER_MODE_LABELS[filterMode]}
          </div>
          {filterMode === 'jobLevel' && filterConfig.levels?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filterConfig.levels.map((level: string) => (
                <span key={level} className="fhr-badge fhr-badge-active">
                  {level.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
          {filterMode === 'jobFamily' && filterConfig.jobTitles?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filterConfig.jobTitles.map((title: string) => (
                <span key={title} className="fhr-badge fhr-badge-premium">
                  {title}
                </span>
              ))}
            </div>
          )}
          {filterMode === 'directReports' && filterConfig.managerIds?.length > 0 && (
            <div className="text-sm text-slate-400 mt-1">
              {filterConfig.managerIds.length} manager(s) seleccionado(s)
            </div>
          )}
          {filterMode === 'customPicks' && filterConfig.employeeIds?.length > 0 && (
            <div className="text-sm text-slate-400 mt-1">
              {filterConfig.employeeIds.length} empleado(s) seleccionado(s)
            </div>
          )}
        </div>
      )}

      {/* Participantes */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-400">
            Participantes ({participants.length})
          </span>
        </div>

        {/* Facilitadores */}
        {facilitators.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-cyan-400 mb-2">
              Facilitadores ({facilitators.length})
            </div>
            <div className="space-y-1">
              {facilitators.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revisores */}
        {reviewers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-emerald-400 mb-2">
              Revisores ({reviewers.length})
            </div>
            <div className="space-y-1">
              {reviewers.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observadores */}
        {observers.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">
              Observadores ({observers.length})
            </div>
            <div className="space-y-1">
              {observers.map((p) => (
                <div key={p.email} className="text-sm text-slate-300">
                  {p.name} <span className="text-slate-500">({p.email})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmación */}
      <div className="fhr-card p-4 bg-emerald-500/5 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white mb-1">
              Todo listo para crear
            </div>
            <p className="text-xs text-slate-400">
              Los participantes recibirán un email de invitación con acceso a la sesión.
              Podrás editar la configuración después de crearla.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
