'use client'

import { useState, useMemo } from 'react'
import { Search, Upload, MoreHorizontal, UserPlus, Edit, UserMinus } from 'lucide-react'

interface Employee {
  id: string
  fullName: string
  email: string | null
  position: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'PENDING_REVIEW'
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string } | null
  _count?: { directReports: number }
}

interface EmployeeDataTableProps {
  employees: Employee[]
  isLoading: boolean
  onUploadClick: () => void
  onViewEmployee: (id: string) => void
  onEditEmployee: (id: string) => void
  onTerminateEmployee: (id: string) => void
}

export default function EmployeeDataTable({
  employees,
  isLoading,
  onUploadClick,
  onViewEmployee,
  onEditEmployee,
  onTerminateEmployee
}: EmployeeDataTableProps) {
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return employees
    const q = search.toLowerCase()
    return employees.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.displayName.toLowerCase().includes(q)
    )
  }, [employees, search])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500'
      case 'INACTIVE': return 'bg-rose-500'
      case 'ON_LEAVE': return 'bg-amber-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo'
      case 'INACTIVE': return 'Inactivo'
      case 'ON_LEAVE': return 'Licencia'
      case 'PENDING_REVIEW': return 'Revision'
      default: return status
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fhr-card p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="fhr-skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="fhr-skeleton h-4 w-1/3" />
                <div className="fhr-skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (employees.length === 0) {
    return (
      <div className="fhr-card">
        <div className="fhr-empty-state py-16">
          <UserPlus className="fhr-empty-state-icon" />
          <h3 className="fhr-empty-state-title">Sin colaboradores</h3>
          <p className="fhr-empty-state-text">
            Carga tu nomina para comenzar a gestionar colaboradores
          </p>
          <button onClick={onUploadClick} className="fhr-btn fhr-btn-primary mt-6">
            <Upload className="w-4 h-4 mr-2" />
            Cargar CSV
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fhr-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar colaborador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg
                       text-sm text-slate-200 placeholder-slate-500
                       focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                       transition-all duration-200"
          />
        </div>

        {/* Actions */}
        <button onClick={onUploadClick} className="fhr-btn fhr-btn-primary">
          <Upload className="w-4 h-4 mr-2" />
          Cargar CSV
        </button>
      </div>

      {/* Table */}
      <div className="fhr-table-container">
        <table className="fhr-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Departamento</th>
              <th>Manager</th>
              <th>Estado</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(employee => (
              <tr
                key={employee.id}
                onClick={() => onViewEmployee(employee.id)}
                className="cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                {/* Persona */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500
                                    flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(employee.fullName)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{employee.fullName}</p>
                      <p className="text-sm text-slate-500">{employee.email || '—'}</p>
                    </div>
                  </div>
                </td>

                {/* Departamento */}
                <td>
                  {employee.department ? (
                    <span className="fhr-badge fhr-badge-active">
                      {employee.department.displayName}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Manager */}
                <td>
                  {employee.manager ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center
                                      text-xs text-slate-300">
                        {getInitials(employee.manager.fullName)}
                      </div>
                      <span className="text-sm text-slate-400">{employee.manager.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Estado */}
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(employee.status)}`} />
                    <span className="text-sm text-slate-400">{getStatusText(employee.status)}</span>
                  </div>
                </td>

                {/* Acciones */}
                <td onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === employee.id ? null : employee.id)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-500" />
                    </button>

                    {openDropdown === employee.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenDropdown(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1
                                        bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
                          <button
                            onClick={() => { onEditEmployee(employee.id); setOpenDropdown(null) }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-300
                                       hover:bg-slate-700/50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          {employee.status === 'ACTIVE' && (
                            <button
                              onClick={() => { onTerminateEmployee(employee.id); setOpenDropdown(null) }}
                              className="w-full px-4 py-2 text-left text-sm text-rose-400
                                         hover:bg-slate-700/50 flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" /> Desvincular
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50 text-sm text-slate-500">
        {filtered.length} de {employees.length} colaboradores
      </div>
    </div>
  )
}
