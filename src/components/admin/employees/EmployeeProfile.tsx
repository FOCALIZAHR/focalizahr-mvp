'use client'

import { useState } from 'react'
import { X, Mail, Phone, Calendar, Building, UserPlus, ArrowRight,
         TrendingUp, UserMinus, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmployeeHistory {
  id: string
  changeType: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  effectiveDate: string
  changeReason: string | null
}

interface Employee {
  id: string
  nationalId: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  position: string | null
  status: string
  hireDate: string
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string; position: string | null } | null
  directReports: { id: string; fullName: string; position: string | null }[]
  history: EmployeeHistory[]
}

interface EmployeeProfileProps {
  employee: Employee
  onClose: () => void
  onEdit: () => void
}

export default function EmployeeProfile({ employee, onClose, onEdit }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'history' | 'evaluations'>('general')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'HIRE': return <UserPlus className="w-4 h-4 text-emerald-400" />
      case 'TRANSFER': return <ArrowRight className="w-4 h-4 text-cyan-400" />
      case 'PROMOTION': return <TrendingUp className="w-4 h-4 text-purple-400" />
      case 'TERMINATE': return <UserMinus className="w-4 h-4 text-rose-400" />
      case 'REHIRE': return <UserPlus className="w-4 h-4 text-emerald-400" />
      default: return <Briefcase className="w-4 h-4 text-slate-400" />
    }
  }

  const getChangeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'HIRE': 'Contratacion',
      'TRANSFER': 'Transferencia',
      'PROMOTION': 'Promocion',
      'TERMINATE': 'Desvinculacion',
      'REHIRE': 'Recontratacion',
      'UPDATE': 'Actualizacion',
      'MANAGER_CHANGE': 'Cambio de jefe'
    }
    return labels[type] || type
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-slate-800">
          <div className="fhr-top-line" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500
                            flex items-center justify-center text-white text-xl font-medium">
              {getInitials(employee.fullName)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-light text-slate-200">{employee.fullName}</h2>
              <p className="text-slate-500">{employee.position || 'Sin cargo'}</p>
              <div className="flex gap-2 mt-2">
                {employee.department && (
                  <span className="fhr-badge fhr-badge-active">{employee.department.displayName}</span>
                )}
                <span className={`fhr-badge ${employee.status === 'ACTIVE' ? 'fhr-badge-success' : 'fhr-badge-error'}`}>
                  {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {(['general', 'history', 'evaluations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-px'
                  : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab === 'general' && 'General'}
              {tab === 'history' && 'Historial'}
              {tab === 'evaluations' && 'Evaluaciones'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Info basica */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {employee.email || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Telefono</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    {employee.phoneNumber || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">RUT</p>
                  <p className="text-slate-300">{employee.nationalId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha Ingreso</p>
                  <p className="text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {formatDate(employee.hireDate)}
                  </p>
                </div>
              </div>

              {/* Manager */}
              {employee.manager && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Manager</p>
                  <div className="fhr-card-metric p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                      {getInitials(employee.manager.fullName)}
                    </div>
                    <div>
                      <p className="text-slate-200">{employee.manager.fullName}</p>
                      <p className="text-sm text-slate-500">{employee.manager.position || 'Sin cargo'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reportes directos */}
              {employee.directReports.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Reportes Directos ({employee.directReports.length})
                  </p>
                  <div className="space-y-2">
                    {employee.directReports.map(report => (
                      <div key={report.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                          {getInitials(report.fullName)}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">{report.fullName}</p>
                          <p className="text-xs text-slate-500">{report.position || 'Sin cargo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Historial */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {employee.history.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Sin historial registrado</p>
              ) : (
                <div className="relative pl-6 border-l border-slate-800">
                  {employee.history.map((item) => (
                    <div key={item.id} className="relative pb-6 last:pb-0">
                      {/* Nodo */}
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                        {getChangeIcon(item.changeType)}
                      </div>

                      {/* Contenido */}
                      <div className="ml-4">
                        <p className="text-sm text-slate-400">{formatDate(item.effectiveDate)}</p>
                        <p className="text-slate-200 font-medium">{getChangeLabel(item.changeType)}</p>
                        {item.fieldName && (
                          <p className="text-sm text-slate-500">
                            {item.fieldName}: {item.oldValue || '(vacio)'} → {item.newValue || '(vacio)'}
                          </p>
                        )}
                        {item.changeReason && (
                          <p className="text-xs text-slate-600 mt-1">{item.changeReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Evaluaciones */}
          {activeTab === 'evaluations' && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-500">Proximamente</p>
              <p className="text-sm text-slate-600">Las evaluaciones de desempeno apareceran aqui</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="fhr-btn fhr-btn-ghost">
            Cerrar
          </button>
          <button onClick={onEdit} className="fhr-btn fhr-btn-secondary">
            Editar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
