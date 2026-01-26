// ============================================
// PAGINA: Gestion Empleados (Admin FocalizaHR)
// Ruta: /dashboard/admin/employees
// Patron: AccountSelector (mismo que department-metrics)
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { Users, Building2, Database } from 'lucide-react'
import AccountSelector from '@/components/admin/AccountSelector'
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

export default function AdminEmployeesPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedAccountName, setSelectedAccountName] = useState<string>('')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Fetch employees cuando cambia la cuenta seleccionada
  const fetchEmployees = async (accountId: string) => {
    if (!accountId) return

    console.log('[AdminEmployeesPage] fetchEmployees called for accountId:', accountId)
    setIsLoading(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/admin/employees?accountId=${accountId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      console.log('[AdminEmployeesPage] API Response:', { success: data.success, count: data.data?.length })

      if (data.success) {
        setEmployees(data.data || [])
      } else {
        console.error('[AdminEmployeesPage] API error:', data.error)
      }
    } catch (error) {
      console.error('[AdminEmployeesPage] Error fetching employees:', error)
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAccountId) {
      fetchEmployees(selectedAccountId)
    } else {
      setEmployees([])
    }
  }, [selectedAccountId])

  const handleAccountChange = (accountId: string, accountName: string) => {
    setSelectedAccountId(accountId)
    setSelectedAccountName(accountName)
  }

  const handleViewEmployee = async (id: string) => {
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/admin/employees/${id}?accountId=${selectedAccountId}`, {
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
        body: JSON.stringify({
          action: 'terminate',
          reason: 'Desvinculacion manual',
          accountId: selectedAccountId
        })
      })
      if (res.ok) {
        fetchEmployees(selectedAccountId)
      }
    } catch (error) {
      console.error('Error terminating employee:', error)
    }
  }

  const handleOpenSelector = () => {
    const input = document.querySelector<HTMLInputElement>('[placeholder*="Buscar empresa"]')
    if (input) {
      input.focus()
      input.click()
    }
  }

  return (
    <div className="fhr-bg-main min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="fhr-title-gradient text-3xl">
                Gestion de Colaboradores
              </h1>
              <p className="text-slate-400 mt-1">
                Servicio Concierge - Administra nomina de empleados para clientes
              </p>
            </div>
          </div>
        </div>

        {/* Account Selector */}
        <div className="fhr-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Seleccionar Empresa Cliente
            </h2>
          </div>

          <AccountSelector
            value={selectedAccountId}
            onChange={handleAccountChange}
            placeholder="Buscar empresa por nombre o email..."
            onOpenChange={setIsSelectorOpen}
          />

          {selectedAccountId && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                Gestionando empleados de: <span className="font-semibold">{selectedAccountName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Contenido principal - solo si hay empresa seleccionada */}
        {selectedAccountId ? (
          <>
            {/* Table */}
            <EmployeeDataTable
              employees={employees}
              isLoading={isLoading}
              onUploadClick={() => setShowWizard(true)}
              onViewEmployee={handleViewEmployee}
              onEditEmployee={(id) => console.log('Edit:', id)}
              onTerminateEmployee={handleTerminate}
            />

            {/* Wizard Modal - pasa accountId */}
            {showWizard && (
              <EmployeeSyncWizard
                accountId={selectedAccountId}
                onComplete={async () => {
                  console.log('[AdminEmployeesPage] onComplete called')
                  // PRIMERO fetch, DESPUÉS cerrar wizard
                  await fetchEmployees(selectedAccountId)
                  console.log('[AdminEmployeesPage] Fetch complete, closing wizard')
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
          </>
        ) : (
          // Empty State - solo si dropdown cerrado
          !isSelectorOpen && (
            <div
              className="fhr-card text-center py-16 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-200"
              onClick={handleOpenSelector}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOpenSelector()
                }
              }}
            >
              <Database className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2 font-semibold">
                Haz clic aqui para seleccionar una empresa
              </p>
              <p className="text-slate-500 text-sm">
                O usa el buscador de arriba
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm">
                  Servicio concierge: Gestiona empleados para tus clientes
                </span>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  )
}
