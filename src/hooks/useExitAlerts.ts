// src/hooks/useExitAlerts.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  ExitAlertWithRelations, 
  ExitAlertSeverity, 
  ExitAlertStatus,
  ExitAlertType 
} from '@/types/exit';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface ExitAlertMetrics {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  byType: Record<string, number>;
  bySLA: {
    on_track: number;
    at_risk: number;
    breached: number;
  };
}

interface UseExitAlertsOptions {
  severity?: ExitAlertSeverity;
  status?: ExitAlertStatus;
  alertType?: ExitAlertType;
  departmentId?: string;
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
}

interface UseExitAlertsReturn {
  alerts: ExitAlertWithRelations[];
  metrics: ExitAlertMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  acknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  resolveAlert: (id: string, notes: string) => Promise<void>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK: useExitAlerts
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fetching y gestión de alertas Exit Intelligence con métricas.
 * Replica el patrón exacto de useOnboardingAlerts para consistencia.
 * 
 * @param options - Filtros opcionales (severity, status, alertType, departmentId)
 * @returns { alerts, metrics, loading, error, refetch, acknowledgeAlert, resolveAlert }
 * 
 * @example
 * ```tsx
 * const { 
 *   alerts, 
 *   metrics, 
 *   loading, 
 *   acknowledgeAlert, 
 *   resolveAlert 
 * } = useExitAlerts({ severity: 'critical', status: 'pending' });
 * ```
 */
export function useExitAlerts(options?: UseExitAlertsOptions): UseExitAlertsReturn {
  const { severity, status, alertType, departmentId, slaStatus } = options || {};
  
  const [alerts, setAlerts] = useState<ExitAlertWithRelations[]>([]);
  const [metrics, setMetrics] = useState<ExitAlertMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * FETCH ALERTS
   * ════════════════════════════════════════════════════════════════════════
   */
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);
      if (alertType) params.append('alertType', alertType);
      if (departmentId) params.append('departmentId', departmentId);
      if (slaStatus) params.append('slaStatus', slaStatus);
      
      const queryString = params.toString();
      const url = `/api/exit/alerts${queryString ? `?${queryString}` : ''}`;
      
      console.log('[useExitAlerts] Fetching:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error fetching exit alerts');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitAlerts] Received:', {
        alertsCount: result.data?.length || 0,
        metrics: result.metrics
      });
      
      setAlerts(result.data || []);
      setMetrics(result.metrics || null);
      
    } catch (err: any) {
      console.error('[useExitAlerts] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [severity, status, alertType, departmentId, slaStatus]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * ACKNOWLEDGE ALERT
   * ════════════════════════════════════════════════════════════════════════
   * Marca una alerta como "accionada" (HR vio la alerta y está trabajando en ello)
   */
  const acknowledgeAlert = useCallback(async (id: string, notes?: string) => {
    try {
      console.log('[useExitAlerts] Acknowledging alert:', id, notes ? `with notes: ${notes.substring(0, 50)}...` : '(no notes)');

      const response = await fetch(`/api/exit/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge',
          ...(notes && { notes })
        })
      });
      
      if (!response.ok) {
        throw new Error('Error acknowledging alert');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitAlerts] Alert acknowledged successfully');
      
      // Refrescar lista
      await fetchAlerts();
      
    } catch (err: any) {
      console.error('[useExitAlerts] Acknowledge error:', err);
      throw err;
    }
  }, [fetchAlerts]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * RESOLVE ALERT
   * ════════════════════════════════════════════════════════════════════════
   * Marca una alerta como "resuelta" con notas de resolución obligatorias
   */
  const resolveAlert = useCallback(async (id: string, notes: string) => {
    try {
      console.log('[useExitAlerts] Resolving alert:', id);
      
      if (!notes || notes.trim().length === 0) {
        throw new Error('Las notas de resolución son obligatorias');
      }
      
      const response = await fetch(`/api/exit/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve',
          notes: notes.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('Error resolving alert');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitAlerts] Alert resolved successfully');
      
      // Refrescar lista
      await fetchAlerts();
      
    } catch (err: any) {
      console.error('[useExitAlerts] Resolve error:', err);
      throw err;
    }
  }, [fetchAlerts]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * EFFECT: Fetch on mount and when filters change
   * ════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);
  
  return {
    alerts,
    metrics,
    loading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
    resolveAlert
  };
}