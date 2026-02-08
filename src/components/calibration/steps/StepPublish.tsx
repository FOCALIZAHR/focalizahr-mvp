// ════════════════════════════════════════════════════════════════════════════
// STEP 5: Publicar Sesión
// src/components/calibration/steps/StepPublish.tsx
// Pattern E: Landing + Mission | Pattern F: Guided Journey
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  Rocket,
  Calendar,
  Users,
  Mail,
  Clock,
  Target,
  CheckCircle,
  Filter,
  Building2
} from 'lucide-react'

const FILTER_MODE_LABELS: Record<string, string> = {
  jobLevel: 'Por Nivel Jerárquico',
  jobFamily: 'Por Familia de Cargos',
  directReports: 'Por Reportes de Manager',
  customPicks: 'Selección Manual',
  department: 'Por Departamento'
}

interface StepPublishProps {
  sessionName: string
  cycleName: string
  description: string
  scheduledAt: string
  filterMode?: string
  filterConfig?: any
  selectedDepartments: string[]
  departmentNames: string[]
  participants: Array<{ email: string; name: string; role: string }>
  isPublishing: boolean
}

export default memo(function StepPublish({
  sessionName,
  cycleName,
  description,
  scheduledAt,
  filterMode,
  filterConfig,
  selectedDepartments,
  departmentNames,
  participants,
  isPublishing
}: StepPublishProps) {
  const facilitators = participants.filter(p => p.role === 'FACILITATOR')
  const reviewers = participants.filter(p => p.role === 'REVIEWER')
  const observers = participants.filter(p => p.role === 'OBSERVER')

  const scheduledDate = useMemo(() => {
    if (!scheduledAt) return null
    return new Date(scheduledAt)
  }, [scheduledAt])

  const isScheduledFuture = useMemo(() => {
    if (!scheduledDate) return false
    return scheduledDate > new Date()
  }, [scheduledDate])

  const formattedDate = useMemo(() => {
    if (!scheduledDate) return 'Sin programar'
    return scheduledDate.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [scheduledDate])

  const scopeLabel = filterMode
    ? FILTER_MODE_LABELS[filterMode] || filterMode
    : selectedDepartments.length === 0
      ? 'Toda la empresa'
      : `${selectedDepartments.length} departamento(s)`

  return (
    <div className="space-y-6">
      {/* Header Pattern E: Landing + Mission */}
      <div className="fhr-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Rocket className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Publicar Sesión</h2>
            <p className="text-sm text-slate-400">
              Confirma los detalles y publica para notificar a los panelistas.
            </p>
          </div>
        </div>

        <div className="fhr-divider my-4" />

        {/* Nombre sesión */}
        <div className="mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
            Sesión de calibración
          </div>
          <h3 className="text-2xl font-semibold text-white">{sessionName}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>

        {/* Métricas clave */}
        <div className="grid md:grid-cols-4 gap-3">
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
            <Filter className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-xs text-slate-500">Alcance</div>
            <div className="text-sm font-medium text-white">{scopeLabel}</div>
          </div>

          <div className="fhr-card-metric">
            <Users className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-xs text-slate-500">Panelistas</div>
            <div className="text-sm font-medium text-white">{participants.length}</div>
          </div>
        </div>
      </div>

      {/* Panelistas por rol */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-400">
            Panelistas ({participants.length})
          </span>
        </div>

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

      {/* Departamentos si aplica */}
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
              <span key={index} className="fhr-badge fhr-badge-active">
                {deptName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info Emails — diferencia entre programado y ahora */}
      <div className={`fhr-card p-4 ${
        isScheduledFuture
          ? 'bg-cyan-500/5 border-cyan-500/20'
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}>
        <div className="flex items-start gap-3">
          {isScheduledFuture ? (
            <>
              <Clock className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white mb-1">
                  Emails programados
                </div>
                <p className="text-xs text-slate-400">
                  {participants.length} invitaciones se enviarán el {formattedDate}.
                  Los panelistas recibirán un email con link directo a la sesión.
                </p>
              </div>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white mb-1">
                  Emails se enviarán al publicar
                </div>
                <p className="text-xs text-slate-400">
                  {participants.length} invitaciones se enviarán inmediatamente al publicar.
                  Los panelistas recibirán un email con link directo a la sesión.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmación final */}
      <div className="fhr-card p-4 bg-emerald-500/5 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-white mb-1">
              {isPublishing ? 'Publicando sesión...' : 'Listo para publicar'}
            </div>
            <p className="text-xs text-slate-400">
              Al publicar, la sesión pasará a estado activo y los panelistas
              serán notificados. Podrás gestionar la sesión desde el War Room.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
