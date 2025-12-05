// src/hooks/useOnboardingAlerts.ts

import { useState, useEffect, useCallback } from 'react';

/**
 * INTERFACES
 */
interface Department {
  id: string;
  displayName: string;
  standardCategory: string | null;
}

interface Journey {
  id: string;
  fullName: string;
  departmentId: string;
  currentStage: number;
  exoScore: number | null;
  retentionRisk: string | null;
  department: Department | null;
}

interface JourneyAlert {
  id: string;
  journeyId: string;
  accountId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  dimension: string | null;
  score: number | null;
  stage: number | null;
  status: string;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  slaHours: number;
  dueDate: Date;
  slaStatus: string;
  createdAt: Date;
  updatedAt: Date;
  journey: Journey;
}

interface AlertMetrics {
  totalAlerts: number;
  totalJourneys: number;
  alertRate: number;
  topDepartments: Array<{ name: string; count: number }>;
  topAlertTypes: Array<{ type: string; count: number }>;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  slaDistribution: {
    on_time: number;
    at_risk: number;
    violated: number;
  };
}

interface UseOnboardingAlertsReturn {
  alerts: JourneyAlert[];
  metrics: AlertMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  acknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  resolveAlert: (id: string, notes?: string) => Promise<void>;
}

/**
 * HOOK: useOnboardingAlerts
 * 
 * Fetching y gestión de alertas onboarding con métricas inteligencia
 */
export function useOnboardingAlerts(
  severity?: string,
  status?: string,
  slaStatus?: string
): UseOnboardingAlertsReturn {
  
  const [alerts, setAlerts] = useState<JourneyAlert[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * FETCH ALERTS
   */
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (status) params.append('status', status);
      if (slaStatus) params.append('slaStatus', slaStatus);
      
      const queryString = params.toString();
      const url = `/api/onboarding/alerts${queryString ? `?${queryString}` : ''}`;
      
      console.log('[useOnboardingAlerts] Fetching:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error fetching alerts');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useOnboardingAlerts] Received:', {
        alertsCount: result.data.alerts.length,
        metrics: result.data.metrics
      });
      
      setAlerts(result.data.alerts);
      setMetrics(result.data.metrics);
      
    } catch (err: any) {
      console.error('[useOnboardingAlerts] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [severity, status, slaStatus]);
  
  /**
   * ACKNOWLEDGE ALERT
   */
  const acknowledgeAlert = useCallback(async (id: string, notes?: string) => {
    try {
      console.log('[useOnboardingAlerts] Acknowledging alert:', id, notes ? `with notes: ${notes.substring(0, 50)}...` : '(no notes)');

      const response = await fetch(`/api/onboarding/alerts/${id}`, {
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
      
      console.log('[useOnboardingAlerts] Alert acknowledged successfully');
      
      // Refrescar lista
      await fetchAlerts();
      
    } catch (err: any) {
      console.error('[useOnboardingAlerts] Acknowledge error:', err);
      throw err;
    }
  }, [fetchAlerts]);
  
  /**
   * RESOLVE ALERT
   */
  const resolveAlert = useCallback(async (id: string, notes?: string) => {
    try {
      console.log('[useOnboardingAlerts] Resolving alert:', id);
      
      const response = await fetch(`/api/onboarding/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve',
          notes: notes || 'Alerta resuelta'
        })
      });
      
      if (!response.ok) {
        throw new Error('Error resolving alert');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useOnboardingAlerts] Alert resolved successfully');
      
      // Refrescar lista
      await fetchAlerts();
      
    } catch (err: any) {
      console.error('[useOnboardingAlerts] Resolve error:', err);
      throw err;
    }
  }, [fetchAlerts]);
  
  /**
   * EFFECT: Fetch on mount and when filters change
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