'use client'

import { useState, useEffect } from 'react'
import { Users, Building2, Clock, UserX, AlertTriangle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface InclusionCriteria {
  minTenureMonths: number        // 0, 1, 3, 6, 12
  departments: string[] | 'all'  // IDs o 'all'
  excludeProbation: boolean      // Excluir periodo prueba
  excludeOnLeave: boolean        // Excluir licencia activa
  excludeWithoutManager: boolean // Excluir sin jefe asignado
}

export interface Department {
  id: string
  displayName: string
  employeeCount?: number
}

interface ParticipantCriteriaSelectorProps {
  departments: Department[]
  onCriteriaChange: (criteria: InclusionCriteria) => void
  initialCriteria?: InclusionCriteria
  eligibleCount?: number
  excludedCount?: number
}

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT CRITERIA
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CRITERIA: InclusionCriteria = {
  minTenureMonths: 3,
  departments: 'all',
  excludeProbation: true,
  excludeOnLeave: true,
  excludeWithoutManager: false
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ParticipantCriteriaSelector({
  departments,
  onCriteriaChange,
  initialCriteria = DEFAULT_CRITERIA,
  eligibleCount = 0,
  excludedCount = 0
}: ParticipantCriteriaSelectorProps) {
  const [criteria, setCriteria] = useState<InclusionCriteria>(initialCriteria)
  const [departmentMode, setDepartmentMode] = useState<'all' | 'select'>(
    initialCriteria.departments === 'all' ? 'all' : 'select'
  )

  // Notificar cambios al parent
  useEffect(() => {
    onCriteriaChange(criteria)
  }, [criteria, onCriteriaChange])

  const handleTenureChange = (months: number) => {
    setCriteria(prev => ({ ...prev, minTenureMonths: months }))
  }

  const handleDepartmentModeChange = (mode: 'all' | 'select') => {
    setDepartmentMode(mode)
    setCriteria(prev => ({
      ...prev,
      departments: mode === 'all' ? 'all' : []
    }))
  }

  const handleDepartmentToggle = (deptId: string) => {
    if (criteria.departments === 'all') return

    setCriteria(prev => {
      const currentDepts = prev.departments as string[]
      const newDepts = currentDepts.includes(deptId)
        ? currentDepts.filter(id => id !== deptId)
        : [...currentDepts, deptId]
      return { ...prev, departments: newDepts }
    })
  }

  const handleExclusionChange = (key: keyof InclusionCriteria, value: boolean) => {
    setCriteria(prev => ({ ...prev, [key]: value }))
  }

  const tenureOptions = [
    { value: 0, label: 'Sin mínimo' },
    { value: 1, label: '1 mes' },
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '12 meses' }
  ]

  return (
    <div className="space-y-6">
      {/* Preview en tiempo real */}
      <div className="grid grid-cols-2 gap-4">
        <div className="fhr-card-metric text-center p-4">
          <Users className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
          <p className="text-3xl font-light text-cyan-400">{eligibleCount}</p>
          <p className="text-sm text-slate-500">Elegibles</p>
        </div>
        <div className="fhr-card-metric text-center p-4">
          <UserX className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="text-3xl font-light text-amber-400">{excludedCount}</p>
          <p className="text-sm text-slate-500">Excluidos</p>
        </div>
      </div>

      {/* Antigüedad mínima */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium text-slate-200">Antigüedad Mínima</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tenureOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleTenureChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                criteria.minTenureMonths === option.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Solo se incluirán empleados con al menos {criteria.minTenureMonths} meses de antigüedad
        </p>
      </div>

      {/* Departamentos */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium text-slate-200">Departamentos</h3>
        </div>

        {/* Radio buttons */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="departmentMode"
              checked={departmentMode === 'all'}
              onChange={() => handleDepartmentModeChange('all')}
              className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500"
            />
            <span className="text-slate-300">Todos los departamentos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="departmentMode"
              checked={departmentMode === 'select'}
              onChange={() => handleDepartmentModeChange('select')}
              className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500"
            />
            <span className="text-slate-300">Seleccionar específicos</span>
          </label>
        </div>

        {/* Department selection grid */}
        {departmentMode === 'select' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
            {departments.map(dept => {
              const isSelected = (criteria.departments as string[]).includes(dept.id)
              return (
                <label
                  key={dept.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDepartmentToggle(dept.id)}
                    className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-300 truncate">{dept.displayName}</span>
                  {dept.employeeCount !== undefined && (
                    <span className="text-xs text-slate-500 ml-auto">({dept.employeeCount})</span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        {departmentMode === 'select' && (criteria.departments as string[]).length === 0 && (
          <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Selecciona al menos un departamento
          </div>
        )}
      </div>

      {/* Exclusiones automáticas */}
      <div className="fhr-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserX className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium text-slate-200">Exclusiones Automáticas</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
            <div>
              <span className="text-slate-300">Excluir período de prueba</span>
              <p className="text-xs text-slate-500">Empleados en período de prueba no participan</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.excludeProbation}
              onChange={(e) => handleExclusionChange('excludeProbation', e.target.checked)}
              className="w-5 h-5 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
            <div>
              <span className="text-slate-300">Excluir licencias activas</span>
              <p className="text-xs text-slate-500">Empleados con licencia no participan</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.excludeOnLeave}
              onChange={(e) => handleExclusionChange('excludeOnLeave', e.target.checked)}
              className="w-5 h-5 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
            <div>
              <span className="text-slate-300">Excluir sin jefe asignado</span>
              <p className="text-xs text-slate-500">Solo empleados con manager pueden participar</p>
            </div>
            <input
              type="checkbox"
              checked={criteria.excludeWithoutManager}
              onChange={(e) => handleExclusionChange('excludeWithoutManager', e.target.checked)}
              className="w-5 h-5 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
