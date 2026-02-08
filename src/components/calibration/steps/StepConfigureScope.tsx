// ════════════════════════════════════════════════════════════════════════════
// STEP 2: Configurar alcance de la calibración (Multi-Criterio v3.1)
// src/components/calibration/steps/StepConfigureScope.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Building2, Calendar, Users, Briefcase, Star,
  AlertCircle, Loader2, UserCheck, Search, X
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type FilterMode = 'jobLevel' | 'jobFamily' | 'directReports' | 'customPicks' | 'department'

interface StepConfigureScopeProps {
  sessionName: string
  onNameChange: (name: string) => void
  description: string
  onDescriptionChange: (desc: string) => void
  scheduledAt: string
  onScheduledAtChange: (date: string) => void
  // Legacy props (backward compat)
  selectedDepartments: string[]
  onDepartmentsChange: (ids: string[]) => void
  // Multi-criterio props
  cycleId?: string
  filterMode?: FilterMode
  onFilterModeChange?: (mode: FilterMode) => void
  filterConfig?: any
  onFilterConfigChange?: (config: any) => void
}

interface PreviewEmployee {
  id: string
  fullName: string
  position: string
  standardJobLevel: string | null
  departmentName: string
}

// ════════════════════════════════════════════════════════════════════════════
// JOB LEVEL OPTIONS (matches Employee.standardJobLevel values)
// ════════════════════════════════════════════════════════════════════════════

const JOB_LEVEL_OPTIONS = [
  { value: 'gerente_director', label: 'Gerente / Director' },
  { value: 'subgerente_subdirector', label: 'Subgerente / Subdirector' },
  { value: 'jefe', label: 'Jefe' },
  { value: 'supervisor_coordinador', label: 'Supervisor / Coordinador' },
  { value: 'profesional_analista', label: 'Profesional / Analista' },
  { value: 'asistente_otros', label: 'Asistente / Otros' },
  { value: 'operativo_auxiliar', label: 'Operativo / Auxiliar' },
]

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepConfigureScope({
  sessionName,
  onNameChange,
  description,
  onDescriptionChange,
  scheduledAt,
  onScheduledAtChange,
  selectedDepartments,
  onDepartmentsChange,
  cycleId,
  filterMode: externalFilterMode,
  onFilterModeChange,
  filterConfig: externalFilterConfig,
  onFilterConfigChange,
}: StepConfigureScopeProps) {

  // Internal state (used when external props not provided)
  const [internalFilterMode, setInternalFilterMode] = useState<FilterMode>(externalFilterMode || 'department')
  const [internalFilterConfig, setInternalFilterConfig] = useState<any>(externalFilterConfig || {})

  // Use external or internal
  const filterMode = externalFilterMode ?? internalFilterMode
  const filterConfig = externalFilterConfig ?? internalFilterConfig

  const setFilterMode = useCallback((mode: FilterMode) => {
    if (onFilterModeChange) onFilterModeChange(mode)
    else setInternalFilterMode(mode)
  }, [onFilterModeChange])

  const setFilterConfig = useCallback((config: any) => {
    if (onFilterConfigChange) onFilterConfigChange(config)
    else setInternalFilterConfig(config)
  }, [onFilterConfigChange])

  // Preview state
  const [preview, setPreview] = useState<PreviewEmployee[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Departments for department mode
  const [departments, setDepartments] = useState<Array<{ id: string; displayName: string }>>([])
  const [deptLoading, setDeptLoading] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD DEPARTMENTS (for department mode)
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (filterMode === 'department' && departments.length === 0) {
      setDeptLoading(true)
      fetch('/api/departments')
        .then(res => res.json())
        .then(json => {
          if (json.success) setDepartments(json.departments || [])
        })
        .catch(() => {})
        .finally(() => setDeptLoading(false))
    }
  }, [filterMode, departments.length])

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD PREVIEW (when criteria change)
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!cycleId) return

    // Check if there's meaningful config
    const hasConfig = (
      (filterMode === 'jobLevel' && filterConfig.levels?.length > 0) ||
      (filterMode === 'jobFamily' && filterConfig.jobTitles?.length > 0) ||
      (filterMode === 'directReports' && filterConfig.managerIds?.length > 0) ||
      (filterMode === 'customPicks' && filterConfig.employeeIds?.length > 0) ||
      (filterMode === 'department' && filterConfig.departmentIds?.length > 0)
    )

    if (!hasConfig) {
      setPreview([])
      setPreviewTotal(0)
      return
    }

    const timer = setTimeout(() => loadPreview(), 300) // debounce
    return () => clearTimeout(timer)
  }, [cycleId, filterMode, JSON.stringify(filterConfig)])

  async function loadPreview() {
    if (!cycleId) return
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/calibration/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, filterMode, filterConfig })
      })
      const data = await res.json()
      if (data.success) {
        setPreview(data.employees || [])
        setPreviewTotal(data.totalCount || data.employees?.length || 0)
      }
    } catch {
      setPreview([])
      setPreviewTotal(0)
    } finally {
      setPreviewLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SYNC department mode with legacy selectedDepartments
  // ══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (filterMode === 'department' && filterConfig.departmentIds) {
      onDepartmentsChange(filterConfig.departmentIds)
    }
  }, [filterMode, filterConfig.departmentIds])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  function handleFilterModeChange(mode: FilterMode) {
    setFilterMode(mode)
    setFilterConfig({})
    if (mode !== 'department') {
      onDepartmentsChange([])
    }
  }

  function toggleJobLevel(level: string) {
    const current: string[] = filterConfig.levels || []
    const updated = current.includes(level)
      ? current.filter((l: string) => l !== level)
      : [...current, level]
    setFilterConfig({ ...filterConfig, levels: updated })
  }

  function toggleDepartment(deptId: string) {
    const current: string[] = filterConfig.departmentIds || []
    const updated = current.includes(deptId)
      ? current.filter((d: string) => d !== deptId)
      : [...current, deptId]
    setFilterConfig({ ...filterConfig, departmentIds: updated })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Configura tu sesión de calibración
        </h2>
        <p className="text-sm text-slate-400">
          Define nombre, fecha y criterios de agrupación de empleados.
        </p>
      </div>

      {/* Nombre */}
      <div>
        <label className="fhr-label">Nombre de la sesión</label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Calibración Q4 2025 - Comercial"
          className="fhr-input"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="fhr-label">Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ej: Sesión para calibrar evaluaciones del equipo comercial..."
          rows={3}
          className="fhr-textarea"
        />
      </div>

      {/* Fecha */}
      <div>
        <label className="fhr-label">Fecha de la sesión</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className="fhr-input pl-10"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ESTRATEGIA DE AGRUPACIÓN (Multi-criterio v3.1) */}
      {/* Oculto hasta que el usuario ingrese fecha */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {scheduledAt && (<>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-base font-medium text-white mb-4">
          Estrategia de Agrupación
        </h3>

        <div className="space-y-3">
          {/* OPCIÓN 1: jobLevel - Recomendado */}
          <FilterModeRadio
            mode="jobLevel"
            currentMode={filterMode}
            onChange={handleFilterModeChange}
            icon={Users}
            iconColor="text-cyan-400"
            label="Por Nivel Jerárquico"
            description="Calibrar empleados del mismo nivel organizacional (ej: todos los Gerentes)"
            recommended
          />

          {/* OPCIÓN 2: jobFamily */}
          <FilterModeRadio
            mode="jobFamily"
            currentMode={filterMode}
            onChange={handleFilterModeChange}
            icon={Briefcase}
            iconColor="text-purple-400"
            label="Por Familia de Cargos"
            description="Calibrar por cargo cross-departamental (ej: todos los Analistas Senior)"
          />

          {/* OPCIÓN 3: directReports */}
          <FilterModeRadio
            mode="directReports"
            currentMode={filterMode}
            onChange={handleFilterModeChange}
            icon={UserCheck}
            iconColor="text-green-400"
            label="Por Reportes de Manager"
            description="Calibrar reportes directos de un líder (segunda línea organizacional)"
          />

          {/* OPCIÓN 4: customPicks */}
          <FilterModeRadio
            mode="customPicks"
            currentMode={filterMode}
            onChange={handleFilterModeChange}
            icon={Star}
            iconColor="text-amber-400"
            label="Selección Manual"
            description="Elegir empleados por nombre (promociones, succession planning)"
          />

          {/* OPCIÓN 4: department */}
          <FilterModeRadio
            mode="department"
            currentMode={filterMode}
            onChange={handleFilterModeChange}
            icon={Building2}
            iconColor="text-slate-400"
            label="Por Departamento"
            description="Calibrar departamento completo (mezcla diferentes niveles)"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CONFIGURACIÓN DINÁMICA */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-base font-medium text-white mb-4">
          Configuración de Filtros
        </h3>

        {/* JOB LEVEL SELECTOR */}
        {filterMode === 'jobLevel' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {JOB_LEVEL_OPTIONS.map(level => (
                <label
                  key={level.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                    filterConfig.levels?.includes(level.value)
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={filterConfig.levels?.includes(level.value) || false}
                    onChange={() => toggleJobLevel(level.value)}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-white">{level.label}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-700/50 transition-colors mt-3">
              <input
                type="checkbox"
                checked={filterConfig.includeOnlyManagers || false}
                onChange={(e) => setFilterConfig({ ...filterConfig, includeOnlyManagers: e.target.checked })}
                className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="text-sm font-medium text-white">Solo managers con reportes directos</span>
                <p className="text-xs text-slate-500 mt-0.5">Excluye personas sin equipo asignado</p>
              </div>
            </label>
          </div>
        )}

        {/* JOB FAMILY SELECTOR */}
        {filterMode === 'jobFamily' && (
          <JobFamilySelector
            cycleId={cycleId}
            selectedTitles={filterConfig.jobTitles || []}
            onToggle={(title: string) => {
              const current: string[] = filterConfig.jobTitles || []
              const updated = current.includes(title)
                ? current.filter((t: string) => t !== title)
                : [...current, title]
              setFilterConfig({ ...filterConfig, jobTitles: updated })
            }}
          />
        )}

        {/* DIRECT REPORTS SELECTOR */}
        {filterMode === 'directReports' && (
          <ManagerSelector
            cycleId={cycleId}
            selectedManagerIds={filterConfig.managerIds || []}
            onToggle={(managerId: string) => {
              const current: string[] = filterConfig.managerIds || []
              const updated = current.includes(managerId)
                ? current.filter((id: string) => id !== managerId)
                : [...current, managerId]
              setFilterConfig({ ...filterConfig, managerIds: updated })
            }}
          />
        )}

        {/* CUSTOM PICKS (Employee Picker) */}
        {filterMode === 'customPicks' && (
          <EmployeePickerSelector
            cycleId={cycleId}
            selectedIds={filterConfig.employeeIds || []}
            onToggle={(employeeId: string) => {
              const current: string[] = filterConfig.employeeIds || []
              const updated = current.includes(employeeId)
                ? current.filter((id: string) => id !== employeeId)
                : [...current, employeeId]
              setFilterConfig({ ...filterConfig, employeeIds: updated })
            }}
            onRemove={(employeeId: string) => {
              const updated = (filterConfig.employeeIds || []).filter((id: string) => id !== employeeId)
              setFilterConfig({ ...filterConfig, employeeIds: updated })
            }}
          />
        )}

        {/* DEPARTMENT SELECTOR */}
        {filterMode === 'department' && (
          <div>
            {filterMode === 'department' && (
              <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3 border border-amber-500/30 mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Considera usar &quot;Por Nivel Jerárquico&quot; para calibraciones más efectivas.
                  Calibrar departamentos mezcla diferentes niveles.
                </span>
              </div>
            )}

            {deptLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {departments.map(dept => (
                  <label
                    key={dept.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                      filterConfig.departmentIds?.includes(dept.id)
                        ? 'bg-purple-500/10 border border-purple-500/30'
                        : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={filterConfig.departmentIds?.includes(dept.id) || false}
                      onChange={() => toggleDepartment(dept.id)}
                      className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm text-white">{dept.displayName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PREVIEW */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {(previewLoading || previewTotal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-white">
              Preview de Empleados
            </h3>
            {!previewLoading && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                {previewTotal} coinciden
              </span>
            )}
          </div>

          {previewLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preview.slice(0, 10).map(emp => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{emp.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {emp.position} &middot; {emp.departmentName}
                    </p>
                  </div>
                  {emp.standardJobLevel && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-700 text-slate-400">
                      {emp.standardJobLevel.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              ))}

              {previewTotal > 10 && (
                <p className="text-center text-xs text-slate-500 pt-2">
                  + {previewTotal - 10} empleados más
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
      </>)}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function FilterModeRadio({
  mode,
  currentMode,
  onChange,
  icon: Icon,
  iconColor,
  label,
  description,
  recommended
}: {
  mode: FilterMode
  currentMode: FilterMode
  onChange: (mode: FilterMode) => void
  icon: any
  iconColor: string
  label: string
  description: string
  recommended?: boolean
}) {
  const isActive = currentMode === mode
  const colorMap: Record<FilterMode, string> = {
    jobLevel: 'bg-cyan-500/10 border-cyan-500/50',
    jobFamily: 'bg-purple-500/10 border-purple-500/50',
    directReports: 'bg-green-500/10 border-green-500/50',
    customPicks: 'bg-amber-500/10 border-amber-500/50',
    department: 'bg-slate-500/10 border-slate-500/50',
  }

  return (
    <label className={cn(
      'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
      isActive ? colorMap[mode] : 'bg-slate-800/50 border-slate-700/30 hover:border-slate-600'
    )}>
      <input
        type="radio"
        name="filterMode"
        checked={isActive}
        onChange={() => onChange(mode)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn('w-4 h-4', iconColor)} />
          <span className="text-sm font-medium text-white">{label}</span>
          {recommended && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              Recomendado
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </label>
  )
}

function JobFamilySelector({
  cycleId,
  selectedTitles,
  onToggle
}: {
  cycleId?: string
  selectedTitles: string[]
  onToggle: (title: string) => void
}) {
  const [titles, setTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cycleId) { setLoading(false); return }

    fetch(`/api/calibration/job-titles?cycleId=${cycleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTitles(data.jobTitles || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cycleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (titles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-600" />
        <p className="text-sm">No hay cargos estandarizados en este ciclo</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {titles.map(title => (
        <label
          key={title}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
            selectedTitles.includes(title)
              ? 'bg-purple-500/10 border border-purple-500/30'
              : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
          )}
        >
          <input
            type="checkbox"
            checked={selectedTitles.includes(title)}
            onChange={() => onToggle(title)}
            className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-sm text-white">{title}</span>
        </label>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MANAGER SELECTOR (for directReports mode)
// ════════════════════════════════════════════════════════════════════════════

function ManagerSelector({
  cycleId,
  selectedManagerIds,
  onToggle
}: {
  cycleId?: string
  selectedManagerIds: string[]
  onToggle: (managerId: string) => void
}) {
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cycleId) { setLoading(false); return }

    fetch(`/api/calibration/managers?cycleId=${cycleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setManagers(data.managers || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cycleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      </div>
    )
  }

  if (managers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
        <p className="text-sm">No hay managers con reportes directos evaluados en este ciclo</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {managers.map((manager: any) => (
        <label
          key={manager.id}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
            selectedManagerIds.includes(manager.id)
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
          )}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedManagerIds.includes(manager.id)}
              onChange={() => onToggle(manager.id)}
              className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500"
            />
            <div>
              <p className="text-sm font-medium text-white">{manager.fullName}</p>
              <p className="text-xs text-slate-500">
                {manager.position} &middot; {manager.departmentName}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-bold">
            {manager.directReportsCount} reportes
          </span>
        </label>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PICKER SELECTOR (for customPicks mode)
// ════════════════════════════════════════════════════════════════════════════

function EmployeePickerSelector({
  cycleId,
  selectedIds,
  onToggle,
  onRemove
}: {
  cycleId?: string
  selectedIds: string[]
  onToggle: (employeeId: string) => void
  onRemove: (employeeId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!cycleId || search.length < 2) {
      setEmployees([])
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ cycleId, search })

      fetch(`/api/calibration/employees?${params}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setEmployees(data.employees || [])
        })
        .catch(() => setEmployees([]))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [cycleId, search])

  const selectedInResults = employees.filter(e => selectedIds.includes(e.id))

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre (min. 2 caracteres)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Selected Chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <span className="text-xs text-amber-400 font-bold w-full mb-1">
            {selectedIds.length} seleccionado(s)
          </span>
          {selectedInResults.map(emp => (
            <div
              key={emp.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs"
            >
              <span>{emp.fullName}</span>
              <button
                onClick={() => onRemove(emp.id)}
                className="hover:text-amber-100 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {selectedIds.length > selectedInResults.length && (
            <span className="text-[10px] text-amber-500/70 italic">
              +{selectedIds.length - selectedInResults.length} no visibles en búsqueda actual
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : employees.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {employees.map(emp => (
            <label
              key={emp.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                selectedIds.includes(emp.id)
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(emp.id)}
                onChange={() => onToggle(emp.id)}
                className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{emp.fullName}</p>
                <p className="text-xs text-slate-500 truncate">
                  {emp.position} &middot; {emp.departmentName}
                </p>
              </div>
              {emp.standardJobLevel && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-700 text-slate-400 shrink-0">
                  {emp.standardJobLevel.replace(/_/g, ' ')}
                </span>
              )}
            </label>
          ))}
        </div>
      ) : search.length >= 2 ? (
        <div className="text-center py-8 text-slate-400">
          <Star className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">No se encontraron empleados para &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  )
}
