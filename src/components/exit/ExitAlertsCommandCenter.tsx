// src/components/exit/ExitAlertsCommandCenter.tsx
// ============================================================================
// COMMAND CENTER - EXIT INTELLIGENCE ALERTS
// ============================================================================
// COPIADO DE: src/components/onboarding/AlertsCommandCenter.tsx
// ADAPTADO PARA: Exit Intelligence
// 
// PROPÓSITO:
// Orquestador principal que compone:
// - ExitAlertsMoneyWall (hero financiero)
// - ExitAlertsGroupedFeed (feed agrupado por tipo)
// 
// Gestiona:
// - Estado de alertas via useExitAlerts hook
// - Cálculo de leyKarinCount
// - Refresh state
// - Tab state (active/managed/all)
// ============================================================================

'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

import { useExitAlerts } from '@/hooks/useExitAlerts';
import ExitAlertsMoneyWall from './ExitAlertsMoneyWall';
import ExitAlertsGroupedFeed from './ExitAlertsGroupedFeed';

// ============================================================================
// INTERFACE
// ============================================================================

interface ExitAlertsCommandCenterProps {
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExitAlertsCommandCenter = memo(function ExitAlertsCommandCenter({
  className = ''
}: ExitAlertsCommandCenterProps) {
  
  // ========================================
  // STATE
  // ========================================
  
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ========================================
  // HOOK: useExitAlerts
  // ========================================
  
  const {
    alerts,
    metrics,
    loading,
    error,
    refetch,
    acknowledgeAlert,
    resolveAlert
  } = useExitAlerts();
  
  // ========================================
  // CÁLCULOS DERIVADOS
  // ========================================
  
  const alertMetrics = useMemo(() => {
    if (!alerts || alerts.length === 0) {
      return {
        critical: 0,
        high: 0,
        pending: 0,
        resolved: 0,
        leyKarinCount: 0
      };
    }
    
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      pending: alerts.filter(a => a.status === 'pending').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      leyKarinCount: alerts.filter(a => a.alertType === 'ley_karin').length
    };
  }, [alerts]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      // Pequeño delay para feedback visual
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch]);
  
  const handleTabChange = useCallback((tab: 'active' | 'managed' | 'all') => {
    setActiveTab(tab);
  }, []);
  
  const handleAcknowledgeAlert = useCallback(async (id: string, notes?: string) => {
    await acknowledgeAlert(id, notes);
  }, [acknowledgeAlert]);
  
  const handleResolveAlert = useCallback(async (id: string, notes: string) => {
    await resolveAlert(id, notes);
  }, [resolveAlert]);
  
  // ========================================
  // ERROR STATE
  // ========================================
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-8 bg-red-500/10 border border-red-500/30 rounded-2xl ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1">
              Error al cargar alertas
            </h3>
            <p className="text-sm text-slate-400">
              {error}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      </motion.div>
    );
  }
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <div className={`space-y-10 ${className}`}>
      
      {/* ========================================
          SECCIÓN 1: MONEY WALL (Hero Financiero)
          ======================================== */}
      <ExitAlertsMoneyWall
        alertsCritical={alertMetrics.critical}
        alertsHigh={alertMetrics.high}
        alertsPending={alertMetrics.pending}
        alertsResolved={alertMetrics.resolved}
        leyKarinCount={alertMetrics.leyKarinCount}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      {/* ========================================
          SECCIÓN 2: GROUPED FEED (Lista Agrupada)
          ======================================== */}
      <div className="relative">
        {/* Header de sección */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Centro de Alertas
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestione las alertas por tipo y prioridad
            </p>
          </div>
          
          {/* Contador rápido */}
          {metrics && (
            <div className="flex items-center gap-4 text-sm">
              {metrics.critical > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-medium">
                    {metrics.critical} críticas
                  </span>
                </div>
              )}
              {metrics.pending > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
                  <span className="text-amber-400 font-medium">
                    {metrics.pending} pendientes
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Feed de alertas */}
        <ExitAlertsGroupedFeed
          alerts={alerts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onResolveAlert={handleResolveAlert}
          loading={loading}
        />
      </div>
      
      {/* Metadata footer */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-700/30 text-xs text-slate-600">
        <span>Exit Intelligence v1.0</span>
        <span>•</span>
        <span>Compliance Ley Karin</span>
        <span>•</span>
        <span>SLA 24h / 48h</span>
      </div>
    </div>
  );
});

export default ExitAlertsCommandCenter;