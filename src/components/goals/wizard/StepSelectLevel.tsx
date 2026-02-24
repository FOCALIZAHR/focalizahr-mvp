// ════════════════════════════════════════════════════════════════════════════
// STEP SELECT LEVEL - Paso 1: Tipo/Nivel de meta
// src/components/goals/wizard/StepSelectLevel.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { Building2, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepSelectLevelProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

interface DepartmentOption {
  id: string
  displayName: string
}

interface EmployeeOption {
  id: string
  fullName: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const LEVELS = [
  {
    value: 'COMPANY' as const,
    label: 'Corporativa',
    description: 'Meta de toda la empresa',
    icon: Building2,
  },
  {
    value: 'AREA' as const,
    label: 'De Area',
    description: 'Meta de un departamento o gerencia',
    icon: Users,
  },
  {
    value: 'INDIVIDUAL' as const,
    label: 'Individual',
    description: 'Meta de un colaborador especifico',
    icon: User,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSelectLevel({
  data,
  updateData,
}: StepSelectLevelProps) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])

  // Cargar departamentos cuando se selecciona AREA
  useEffect(() => {
    if (data.level === 'AREA') {
      const token = localStorage.getItem('focalizahr_token')
      fetch('/api/departments', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          // API retorna { departments: [...], total }
          if (res.departments) {
            setDepartments(res.departments)
          }
        })
        .catch((err) => console.error('Error cargando departamentos:', err))
    }
  }, [data.level])

  // Cargar empleados cuando se selecciona INDIVIDUAL
  useEffect(() => {
    if (data.level === 'INDIVIDUAL') {
      const token = localStorage.getItem('focalizahr_token')
      fetch('/api/admin/employees?limit=500&status=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            setEmployees(
              res.data.map((emp: { id: string; fullName: string }) => ({
                id: emp.id,
                fullName: emp.fullName,
              }))
            )
          }
        })
        .catch(() => {})
    }
  }, [data.level])

  const handleSelect = useCallback(
    (value: string) => {
      updateData({
        level: value as GoalWizardData['level'],
        employeeId: undefined,
        departmentId: undefined,
      })
    },
    [updateData]
  )

  const handleDepartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateData({ departmentId: e.target.value || undefined })
    },
    [updateData]
  )

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateData({ employeeId: e.target.value || undefined })
    },
    [updateData]
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">
          Que tipo de meta quieres crear?
        </h2>
        <p className="text-slate-400 text-sm">
          Selecciona el nivel organizacional de la meta
        </p>
      </div>

      <div className="grid gap-4">
        {LEVELS.map((level) => {
          const Icon = level.icon
          const isSelected = data.level === level.value

          return (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden',
                'bg-slate-800/50',
                isSelected
                  ? 'border-cyan-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              )}
            >
              {/* Tesla line on selected */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                  }}
                />
              )}

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    isSelected ? 'bg-cyan-500/10' : 'bg-slate-700/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-cyan-400' : 'text-slate-400'
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-white' : 'text-slate-300'
                    )}
                  >
                    {level.label}
                  </h3>
                  <p className="text-sm text-slate-400">{level.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selector de area */}
      {data.level === 'AREA' && (
        <div className="space-y-2 pt-4 border-t border-slate-700/50">
          <label className="text-sm text-slate-300">Selecciona el area</label>
          <select
            value={data.departmentId || ''}
            onChange={handleDepartmentChange}
            className="fhr-input w-full"
          >
            <option value="">Seleccionar departamento...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de colaborador */}
      {data.level === 'INDIVIDUAL' && (
        <div className="space-y-2 pt-4 border-t border-slate-700/50">
          <label className="text-sm text-slate-300">
            Selecciona el colaborador
          </label>
          <select
            value={data.employeeId || ''}
            onChange={handleEmployeeChange}
            className="fhr-input w-full"
          >
            <option value="">Seleccionar colaborador...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
})
