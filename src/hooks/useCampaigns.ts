// hooks/useCampaigns.ts - FIXED para API Chat 3A
import { useState, useEffect, useCallback } from 'react'

interface CampaignFilters {
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  search?: string
  campaignType?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'startDate' | 'participationRate' | 'status' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  campaignType: {
    id: string
    name: string
    slug: string
    estimatedDuration: number
    questionCount: number
  }
  totalInvited: number
  totalResponded: number
  participationRate: number
  startDate: string
  endDate: string
  createdAt: string
  daysRemaining?: number
  isOverdue: boolean
  riskLevel: 'low' | 'medium' | 'high'
  participantCount: number
  canActivate: boolean
  canViewResults: boolean
  canEdit: boolean
  canDelete: boolean
}

interface CampaignsResponse {
  success: boolean
  campaigns: Campaign[]
  error?: string  // ← AGREGAR ESTA LÍNEA
  pagination: {
    page: number
    limit: number
    offset: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    status: string | null
    search: string | null
    campaignType: string | null
    sortBy: string
    sortOrder: string
  }
  performance: {
    queryTime: number
    resultCount: number
  }
}

export function useCampaigns(initialFilters: CampaignFilters = {}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<CampaignFilters>(initialFilters)

  // Función para construir URL con parámetros válidos únicamente
  const buildQueryUrl = useCallback((baseUrl: string, params: CampaignFilters): string => {
    const url = new URL(baseUrl, window.location.origin)
    
    // Solo agregar parámetros que tengan valores válidos
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        // Convertir números a string para URLSearchParams
        url.searchParams.append(key, String(value))
      }
    })
    
    return url.toString()
  }, [])

  // Función principal para fetch campaigns con filtros
  const fetchCampaigns = useCallback(async (customFilters: CampaignFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      // Combinar filtros actuales con los nuevos
      const activeFilters = { ...filters, ...customFilters }

      // Construir URL solo con parámetros válidos
      const url = buildQueryUrl('/api/campaigns', activeFilters)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Manejo específico de errores
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        }
        if (response.status === 400) {
          const errorData = await response.json()
          throw new Error(`Error de validación: ${errorData.error}`)
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: CampaignsResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido')
      }

      setCampaigns(data.campaigns)
      setPagination(data.pagination)
      setFilters(activeFilters)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, buildQueryUrl])

  // Funciones de utilidad para filtros específicos
  const filterByStatus = useCallback((status?: CampaignFilters['status']) => {
    fetchCampaigns({ ...filters, status, offset: 0 }) // Reset offset al filtrar
  }, [fetchCampaigns, filters])

  const searchCampaigns = useCallback((search: string) => {
    // Solo buscar si el texto tiene al menos 2 caracteres o está vacío
    if (search.length >= 2 || search.length === 0) {
      fetchCampaigns({ ...filters, search: search || undefined, offset: 0 })
    }
  }, [fetchCampaigns, filters])

  const sortCampaigns = useCallback((sortBy: CampaignFilters['sortBy'], sortOrder: CampaignFilters['sortOrder'] = 'desc') => {
    fetchCampaigns({ ...filters, sortBy, sortOrder })
  }, [fetchCampaigns, filters])

  const changePage = useCallback((page: number) => {
    const newOffset = (page - 1) * (filters.limit || 10)
    fetchCampaigns({ ...filters, offset: newOffset })
  }, [fetchCampaigns, filters])

  const changePageSize = useCallback((limit: number) => {
    fetchCampaigns({ ...filters, limit, offset: 0 }) // Reset to first page
  }, [fetchCampaigns, filters])

  // Función para refrescar datos
  const refresh = useCallback(() => {
    fetchCampaigns(filters)
  }, [fetchCampaigns, filters])

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const defaultFilters: CampaignFilters = {
      limit: 10,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    setFilters(defaultFilters)
    fetchCampaigns(defaultFilters)
  }, [fetchCampaigns])

  // Cargar datos iniciales
  useEffect(() => {
    fetchCampaigns(initialFilters)
  }, []) // Solo ejecutar una vez al montar

  return {
    // Datos
    campaigns,
    loading,
    error,
    pagination,
    filters,

    // Acciones
    fetchCampaigns,
    filterByStatus,
    searchCampaigns,
    sortCampaigns,
    changePage,
    changePageSize,
    refresh,
    clearFilters,

    // Estados calculados
    isEmpty: campaigns.length === 0 && !loading,
    hasError: !!error,
    isFiltered: Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== '' && 
      !(typeof value === 'number' && value === 0)
    )
  }
}
// 🎯 AGREGAR AL FINAL de src/hooks/useCampaigns.ts
// DESPUÉS de la función useCampaigns, ANTES del final del archivo

// ========================================
// INTERFAZ PÚBLICA DEL HOOK (Solución Gemini)
// ========================================

// Interfaz para los parámetros que el hook recibe/podría recibir
export interface UseCampaignsParams {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: CampaignFilters;
}

// Tipo para el valor de retorno del hook
export type UseCampaignsReturn = ReturnType<typeof useCampaigns>;

// ========================================
// 🔍 JUSTIFICACIÓN ARQUITECTURAL:
// 
// 1. Define interfaz pública clara del hook
// 2. Permite que index.ts funcione como directorio centralizado
// 3. Facilita evolución futura del hook (nuevos parámetros)
// 4. Sigue principios de diseño de APIs internas
// 5. Arregla causa raíz vs síntoma
// ========================================