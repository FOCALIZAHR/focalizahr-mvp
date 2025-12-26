// src/hooks/useExitRecords.ts

import { useState, useEffect, useCallback } from 'react';
import { EISClassification, ExitReason } from '@/types/exit';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ExitRecordDepartment {
  id: string;
  displayName: string;
  standardCategory: string | null;
}

interface ExitRecordParticipant {
  id: string;
  name: string;
  email: string;
  hasResponded: boolean;
  responseDate: string | null;
}

interface ExitAlertSummary {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  createdAt: string;
}

/**
 * Estructura de un ExitRecord con relaciones
 */
export interface ExitRecord {
  id: string;
  accountId: string;
  departmentId: string;
  participantId: string;
  nationalId: string;
  exitDate: string;
  exitReason: ExitReason | null;
  
  // Intelligence Scores
  eis: number | null;
  eisClassification: EISClassification | null;
  
  // Factores de Salida
  exitFactors: string[];
  exitFactorsDetail: Record<string, number> | null;
  exitFactorsAvg: number | null;
  
  // Correlación Onboarding
  hadOnboarding: boolean;
  onboardingJourneyId: string | null;
  onboardingEXOScore: number | null;
  onboardingAlertsCount: number;
  onboardingIgnoredAlerts: number;
  onboardingManagedAlerts: number;
  tenureMonths: number | null;
  
  // Flags
  hasLeyKarinAlert: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  department: ExitRecordDepartment;
  participant: ExitRecordParticipant;
  alerts: ExitAlertSummary[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseExitRecordsOptions {
  page?: number;
  limit?: number;
  departmentId?: string;
  eisClassification?: EISClassification;
  exitReason?: ExitReason;
  hasLeyKarinAlert?: boolean;
  hadOnboarding?: boolean;
  hasResponded?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseExitRecordsReturn {
  records: ExitRecord[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK: useExitRecords
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fetching de registros de salida con paginación y filtros.
 * 
 * @param options - Opciones de filtrado y paginación
 * @returns { records, pagination, loading, error, refetch }
 * 
 * @example
 * ```tsx
 * const { records, pagination, loading, refetch } = useExitRecords({
 *   page: 1,
 *   limit: 20,
 *   eisClassification: 'toxic',
 *   hasLeyKarinAlert: true
 * });
 * ```
 */
export function useExitRecords(options?: UseExitRecordsOptions): UseExitRecordsReturn {
  const {
    page = 1,
    limit = 20,
    departmentId,
    eisClassification,
    exitReason,
    hasLeyKarinAlert,
    hadOnboarding,
    hasResponded,
    search,
    dateFrom,
    dateTo
  } = options || {};
  
  const [records, setRecords] = useState<ExitRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * FETCH RECORDS
   * ════════════════════════════════════════════════════════════════════════
   */
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (departmentId) params.append('departmentId', departmentId);
      if (eisClassification) params.append('eisClassification', eisClassification);
      if (exitReason) params.append('exitReason', exitReason);
      if (hasLeyKarinAlert !== undefined) params.append('hasLeyKarinAlert', hasLeyKarinAlert.toString());
      if (hadOnboarding !== undefined) params.append('hadOnboarding', hadOnboarding.toString());
      if (hasResponded !== undefined) params.append('hasResponded', hasResponded.toString());
      if (search) params.append('search', search);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const url = `/api/exit/records?${params.toString()}`;
      
      console.log('[useExitRecords] Fetching:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error fetching exit records');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitRecords] Received:', {
        recordsCount: result.data?.length || 0,
        pagination: result.pagination
      });
      
      setRecords(result.data || []);
      setPagination(result.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
      
    } catch (err: any) {
      console.error('[useExitRecords] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    page, 
    limit, 
    departmentId, 
    eisClassification, 
    exitReason,
    hasLeyKarinAlert,
    hadOnboarding,
    hasResponded,
    search,
    dateFrom,
    dateTo
  ]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * EFFECT: Fetch on mount and when options change
   * ════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);
  
  return {
    records,
    pagination,
    loading,
    error,
    refetch: fetchRecords
  };
}