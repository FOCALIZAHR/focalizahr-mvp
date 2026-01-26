// ════════════════════════════════════════════════════════════════════════════
// HOOK: useInconsistencies - Human-in-the-Loop Resolution Logic
// src/hooks/useInconsistencies.ts
// ════════════════════════════════════════════════════════════════════════════
// Centraliza toda la lógica de datos para la revisión de inconsistencias
// - Separación por tipo de anomalía
// - Agrupamiento de cargos nuevos
// - Acciones individuales y masivas
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AnomalyEmployee {
  id: string
  fullName: string
  position: string | null
  performanceTrack: string | null
  standardJobLevel: string | null
  department: {
    displayName: string
  }
  companyName: string
  directReportsCount: number
}

export interface Summary {
  total: number
  byTrack: {
    colaborador: number
    manager: number
    ejecutivo: number
  }
  companiesAffected: number
}

export type AnomalyType = 'COLABORADOR_WITH_REPORTS' | 'CARGO_NUEVO' | 'OTHER'
export type ResolutionAction = 'PROMOTE' | 'CONFIRM'
export type SuggestedTrack = 'MANAGER' | 'COLABORADOR'

export interface CargoGroup {
  cargo: string
  empleados: AnomalyEmployee[]
  count: number
  suggestedTrack: SuggestedTrack
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Detecta el tipo de anomalía basado en los datos del empleado
 */
export function getAnomalyType(emp: AnomalyEmployee): AnomalyType {
  const isColaboradorWithReports =
    emp.performanceTrack === 'COLABORADOR' && emp.directReportsCount > 0
  const isCargoNuevo = !emp.standardJobLevel

  if (isColaboradorWithReports) return 'COLABORADOR_WITH_REPORTS'
  if (isCargoNuevo) return 'CARGO_NUEVO'
  return 'OTHER'
}

/**
 * Heurística para sugerir track basado en nombre del cargo
 */
export function suggestTrack(cargo: string): SuggestedTrack {
  const managerKeywords = [
    'CEO', 'Gerente', 'Director', 'Jefe', 'Coordinador',
    'Supervisor', 'Líder', 'Lead', 'Head', 'Chief', 'Manager',
    'Subgerente', 'VP', 'Presidente', 'CTO', 'CFO', 'COO', 'CMO',
    'Encargado', 'Responsable'
  ]

  const cargoNormalized = cargo.toLowerCase()
  const isLikelyManager = managerKeywords.some(k =>
    cargoNormalized.includes(k.toLowerCase())
  )

  return isLikelyManager ? 'MANAGER' : 'COLABORADOR'
}

/**
 * Agrupa empleados con cargos nuevos por nombre de cargo
 */
function groupByPosition(employees: AnomalyEmployee[]): CargoGroup[] {
  const grouped = employees.reduce((acc, emp) => {
    const cargo = (emp.position || 'Sin cargo').toUpperCase().trim()

    if (!acc[cargo]) {
      acc[cargo] = {
        cargo: emp.position || 'Sin cargo',
        empleados: [],
        count: 0,
        suggestedTrack: suggestTrack(emp.position || '')
      }
    }

    acc[cargo].empleados.push(emp)
    acc[cargo].count++
    return acc
  }, {} as Record<string, CargoGroup>)

  // Convertir a array ordenado por cantidad (DESC) y luego alfabéticamente
  return Object.values(grouped).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.cargo.localeCompare(b.cargo)
  })
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

interface UseInconsistenciesOptions {
  autoFetch?: boolean
}

interface UseInconsistenciesReturn {
  // Data
  employees: AnomalyEmployee[]
  summary: Summary | null
  liderazgoOculto: AnomalyEmployee[]
  cargosNuevos: AnomalyEmployee[]
  cargosAgrupados: CargoGroup[]

  // Counts
  counts: {
    total: number
    liderazgoOculto: number
    cargosNuevos: number
  }

  // State
  loading: boolean
  error: string | null
  resolving: string | null

  // Filter
  selectedAccountId: string
  selectedAccountName: string

  // Actions
  fetchAnomalies: (accountId?: string) => Promise<void>
  handleAccountChange: (accountId: string, accountName: string) => void
  handleClearFilter: () => void
  resolveAnomaly: (employeeId: string, action: ResolutionAction) => Promise<boolean>
  resolveMultiple: (employeeIds: string[], action: ResolutionAction) => Promise<boolean>
  resolveCargoGroup: (cargo: string, action: ResolutionAction) => Promise<boolean>
}

export function useInconsistencies(
  options: UseInconsistenciesOptions = {}
): UseInconsistenciesReturn {
  const { autoFetch = true } = options

  // State
  const [employees, setEmployees] = useState<AnomalyEmployee[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)

  // Filter state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedAccountName, setSelectedAccountName] = useState<string>('')

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Separar por tipo de anomalía
  // ═══════════════════════════════════════════════════════════════════════════

  const liderazgoOculto = useMemo(() =>
    employees
      .filter(e => getAnomalyType(e) === 'COLABORADOR_WITH_REPORTS')
      .sort((a, b) => b.directReportsCount - a.directReportsCount), // DESC por reportes
    [employees]
  )

  const cargosNuevos = useMemo(() =>
    employees.filter(e => getAnomalyType(e) === 'CARGO_NUEVO'),
    [employees]
  )

  const cargosAgrupados = useMemo(() =>
    groupByPosition(cargosNuevos),
    [cargosNuevos]
  )

  const counts = useMemo(() => ({
    total: employees.length,
    liderazgoOculto: liderazgoOculto.length,
    cargosNuevos: cargosNuevos.length
  }), [employees.length, liderazgoOculto.length, cargosNuevos.length])

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchAnomalies = useCallback(async (accountId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        setError('No autorizado')
        return
      }

      const url = new URL('/api/admin/employees/anomalies', window.location.origin)
      if (accountId) {
        url.searchParams.set('accountId', accountId)
      }

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const data = await res.json()

      if (data.success) {
        setEmployees(data.data)
        setSummary(data.summary)
      } else {
        throw new Error(data.error || 'Error cargando datos')
      }
    } catch (err: unknown) {
      console.error('Error fetching anomalies:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAnomalies()
    }
  }, [autoFetch, fetchAnomalies])

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAccountChange = useCallback((accountId: string, accountName: string) => {
    setSelectedAccountId(accountId)
    setSelectedAccountName(accountName)
    fetchAnomalies(accountId)
  }, [fetchAnomalies])

  const handleClearFilter = useCallback(() => {
    setSelectedAccountId('')
    setSelectedAccountName('')
    fetchAnomalies()
  }, [fetchAnomalies])

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOLVE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const resolveAnomaly = useCallback(async (
    employeeId: string,
    action: ResolutionAction
  ): Promise<boolean> => {
    setResolving(employeeId)

    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        setError('No autorizado')
        return false
      }

      const res = await fetch('/api/admin/employees/anomalies', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId, action })
      })

      const data = await res.json()

      if (data.success) {
        setEmployees(prev => prev.filter(e => e.id !== employeeId))
        if (summary) {
          setSummary({ ...summary, total: summary.total - 1 })
        }
        return true
      } else {
        setError(data.error || 'Error resolviendo anomalía')
        return false
      }
    } catch (err: unknown) {
      console.error('Error resolving anomaly:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setResolving(null)
    }
  }, [summary])

  const resolveMultiple = useCallback(async (
    employeeIds: string[],
    action: ResolutionAction
  ): Promise<boolean> => {
    setResolving('bulk')
    let successCount = 0

    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        setError('No autorizado')
        return false
      }

      // Resolver secuencialmente para evitar sobrecarga
      for (const employeeId of employeeIds) {
        const res = await fetch('/api/admin/employees/anomalies', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ employeeId, action })
        })

        const data = await res.json()
        if (data.success) {
          successCount++
        }
      }

      // Actualizar estado local
      setEmployees(prev => prev.filter(e => !employeeIds.includes(e.id)))
      if (summary) {
        setSummary({ ...summary, total: summary.total - successCount })
      }

      return successCount === employeeIds.length
    } catch (err: unknown) {
      console.error('Error resolving multiple anomalies:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setResolving(null)
    }
  }, [summary])

  const resolveCargoGroup = useCallback(async (
    cargo: string,
    action: ResolutionAction
  ): Promise<boolean> => {
    const group = cargosAgrupados.find(
      g => g.cargo.toUpperCase().trim() === cargo.toUpperCase().trim()
    )

    if (!group) {
      setError('Grupo de cargo no encontrado')
      return false
    }

    const employeeIds = group.empleados.map(e => e.id)
    return resolveMultiple(employeeIds, action)
  }, [cargosAgrupados, resolveMultiple])

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Data
    employees,
    summary,
    liderazgoOculto,
    cargosNuevos,
    cargosAgrupados,

    // Counts
    counts,

    // State
    loading,
    error,
    resolving,

    // Filter
    selectedAccountId,
    selectedAccountName,

    // Actions
    fetchAnomalies,
    handleAccountChange,
    handleClearFilter,
    resolveAnomaly,
    resolveMultiple,
    resolveCargoGroup
  }
}

export default useInconsistencies
