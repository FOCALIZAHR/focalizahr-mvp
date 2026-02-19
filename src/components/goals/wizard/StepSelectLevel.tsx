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
    color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  },
  {
    value: 'AREA' as const,
    label: 'De Area',
    description: 'Meta de un departamento o gerencia',
    icon: Users,
    color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  },
  {
    value: 'INDIVIDUAL' as const,
    label: 'Individual',
    description: 'Meta de un colaborador especifico',
    icon: User,
    color: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
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
          if (res.success) setDepartments(res.data || [])
        })
        .catch(() => {})
    }
  }, [data.level])

  // Cargar empleados cuando se selecciona INDIVIDUAL
  useEffect(() => {
    if (data.level === 'INDIVIDUAL') {
      const token = localStorage.getItem('focalizahr_token')
      fetch('/api/admin/participants?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data?.participants) {
            setEmployees(
              res.data.participants.map((p: { id: string; fullName: string }) => ({
                id: p.id,
                fullName: p.fullName,
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
                'p-4 rounded-xl border-2 text-left transition-all',
                'bg-gradient-to-r',
                isSelected
                  ? level.color
                  : 'from-slate-800/50 to-slate-800/50 border-slate-700',
                isSelected ? 'scale-[1.02]' : 'hover:border-slate-600'
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    isSelected ? 'bg-white/10' : 'bg-slate-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-white' : 'text-slate-400'
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
