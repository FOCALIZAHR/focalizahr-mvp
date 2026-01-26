// ============================================
// PAGINA: Gestion Empleados (Cliente)
// Ruta: /dashboard/employees
// Para: HR_ADMIN, HR_OPERATOR, ACCOUNT_OWNER
// Sin selector de empresa - usa accountId del JWT
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import EmployeeDataTable from '@/components/admin/employees/EmployeeDataTable'
import EmployeeSyncWizard from '@/components/admin/employees/EmployeeSyncWizard'
import EmployeeProfile from '@/components/admin/employees/EmployeeProfile'

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const fetchEmployees = async () => {
    console.log('[EmployeesPage] fetchEmployees() called')
    setIsLoading(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      console.log('[EmployeesPage] Token exists:', !!token)

      const res = await fetch('/api/admin/employees?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      console.log('[EmployeesPage] API Response:', { success: data.success, count: data.data?.length, total: data.pagination?.total })

      if (data.success) {
        setEmployees(data.data || [])
        console.log('[EmployeesPage] State updated with', data.data?.length, 'employees')
      } else {
        console.error('[EmployeesPage] API returned error:', data.error)
      }
    } catch (error) {
      console.error('[EmployeesPage] Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

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
      if (data.success) {
        setSelectedEmployee(data.data)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    }
  }

  const handleTerminate = async (id: string) => {
    if (!confirm('Estas seguro de desvincular a este colaborador?')) return

    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'terminate', reason: 'Desvinculacion manual' })
      })
      if (res.ok) {
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error terminating employee:', error)
    }
  }

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="fhr-content py-8">
        {/* Hero */}
        <div className="fhr-hero mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-cyan-400" />
            <h1 className="fhr-hero-title">
              Gestion de <span className="fhr-title-gradient">Colaboradores</span>
            </h1>
          </div>
          <p className="text-slate-400">
            Administra tu nomina de empleados y estructura organizacional
          </p>
        </div>

        {/* Divider */}
        <div className="fhr-divider mb-8" />

        {/* Table */}
        <EmployeeDataTable
          employees={employees}
          isLoading={isLoading}
          onUploadClick={() => setShowWizard(true)}
          onViewEmployee={handleViewEmployee}
          onEditEmployee={(id) => console.log('Edit:', id)}
          onTerminateEmployee={handleTerminate}
        />

        {/* Wizard Modal - sin accountId (usa JWT) */}
        {showWizard && (
          <EmployeeSyncWizard
            onComplete={async () => {
              console.log('[EmployeesPage] onComplete called')
              // PRIMERO fetch, DESPUÉS cerrar wizard
              await fetchEmployees()
              console.log('[EmployeesPage] Fetch complete, closing wizard')
              setShowWizard(false)
            }}
            onCancel={() => setShowWizard(false)}
          />
        )}

        {/* Profile Modal */}
        {selectedEmployee && (
          <EmployeeProfile
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onEdit={() => console.log('Edit employee')}
          />
        )}
      </div>
    </div>
  )
}
