// ════════════════════════════════════════════════════════════════════════════
// PÁGINA EMPLEADOS - VERSIÓN FINAL
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, BarChart3, ChevronDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmployeeDataTable from '@/components/admin/employees/EmployeeDataTable'
import EmployeeSyncWizard from '@/components/admin/employees/EmployeeSyncWizard'
import EmployeeProfile from '@/components/admin/employees/EmployeeProfile'
import EmployeeStatsCards from '@/components/dashboard/employees/EmployeeStatsCards'
import EmployeeAnalyticsModal from '@/components/dashboard/employees/EmployeeAnalyticsModal'
import { MinimalistButton } from '@/components/ui/MinimalistButton'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Employee {
  id: string
  nationalId: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  position: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'PENDING_REVIEW'
  hireDate: string
  department: { id: string; displayName: string } | null
  manager: { id: string; fullName: string; position: string | null } | null
  directReports: { id: string; fullName: string; position: string | null }[]
  history: {
    id: string
    changeType: string
    fieldName: string | null
    oldValue: string | null
    newValue: string | null
    effectiveDate: string
    changeReason: string | null
  }[]
  _count?: { directReports: number }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tesla Line
// ════════════════════════════════════════════════════════════════════════════

function TeslaLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/50 to-slate-700" />
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/50 to-slate-700" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showEmployeeList, setShowEmployeeList] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch('/api/admin/employees?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (data.success) {
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleViewEmployee = async (id: string) => {
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/admin/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (data.success) setSelectedEmployee(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleTerminate = async (id: string) => {
    if (!confirm('¿Desvincular colaborador?')) return
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'terminate', reason: 'Desvinculación manual' })
      })
      if (res.ok) fetchEmployees()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800/60 backdrop-blur border border-slate-700/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-lg md:text-xl font-medium text-white">
              Gestión de Colaboradores
            </h1>
          </div>

          {/* Botón PURPLE minimalista */}
          <MinimalistButton
            variant="purple"
            size="sm"
            icon={RefreshCw}
            onClick={() => setShowWizard(true)}
          >
            Sincronizar
          </MinimalistButton>
        </div>

        <TeslaLine className="my-6" />

        {/* ═══════════════════════════════════════════════════════════════════
            STATS
            ═══════════════════════════════════════════════════════════════════ */}
        <EmployeeStatsCards />

        {/* ═══════════════════════════════════════════════════════════════════
            CTA - Botón CYAN minimalista
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center mb-6">
          <MinimalistButton
            variant="cyan"
            size="md"
            icon={BarChart3}
            onClick={() => setShowAnalytics(true)}
          >
            Ver Analytics Profundo
          </MinimalistButton>
        </div>

        <TeslaLine className="my-6" />

        {/* ═══════════════════════════════════════════════════════════════════
            LISTA COLAPSABLE
            ═══════════════════════════════════════════════════════════════════ */}
        <div>
          <button
            onClick={() => setShowEmployeeList(!showEmployeeList)}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <motion.div
              animate={{ rotate: showEmployeeList ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <span className="text-xs uppercase tracking-wider">
              {showEmployeeList ? 'Ocultar' : 'Ver'} Lista ({employees.length})
            </span>
          </button>

          <AnimatePresence>
            {showEmployeeList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <EmployeeDataTable
                  employees={employees}
                  isLoading={isLoading}
                  onUploadClick={() => setShowWizard(true)}
                  onViewEmployee={handleViewEmployee}
                  onEditEmployee={(id) => console.log('Edit:', id)}
                  onTerminateEmployee={handleTerminate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MODALES
            ═══════════════════════════════════════════════════════════════════ */}
        
        {showWizard && (
          <EmployeeSyncWizard
            onComplete={async () => {
              await fetchEmployees()
              setShowWizard(false)
            }}
            onCancel={() => setShowWizard(false)}
          />
        )}

        {selectedEmployee && (
          <EmployeeProfile
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onEdit={() => console.log('Edit')}
          />
        )}

        <EmployeeAnalyticsModal
          open={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />

      </div>
    </div>
  )
}