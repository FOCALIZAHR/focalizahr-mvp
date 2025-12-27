// src/components/shared/intelligence/AlertsCommandCenter.tsx
// ============================================================================
// COMPONENTE BIMODAL: Centro de Comando de Alertas
// ============================================================================
// ORQUESTADOR: Compone AlertsMoneyWall + AlertsGroupedFeed
// ARQUITECTURA: Type-safe props según productType
// SOPORTA: Onboarding Journey Intelligence + Exit Intelligence
// 
// Uso:
//   <AlertsCommandCenter productType="onboarding" />
//   <AlertsCommandCenter productType="exit" />
// ============================================================================

'use client';

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

// Hooks
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import { useExitAlerts } from '@/hooks/useExitAlerts';

// Componentes bimodales
import AlertsMoneyWall from './AlertsMoneyWall';
import AlertsGroupedFeed from './AlertsGroupedFeed';

// ============================================================================
// INTERFACE
// ============================================================================

interface AlertsCommandCenterProps {
  productType: 'onboarding' | 'exit';
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AlertsCommandCenter = memo(function AlertsCommandCenter({
  productType,
  className = ''
}: AlertsCommandCenterProps) {
  
  // ========================================
  // STATE
  // ========================================
  
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ========================================
  // HOOKS - Condicionales según productType
  // ========================================
  
  const onboardingData = useOnboardingAlerts();
  const exitData = useExitAlerts();
  
  // Seleccionar datos según productType
  const alertsData = productType === 'onboarding' ? onboardingData : exitData;
  
  const { 
    alerts, 
    metrics, 
    loading, 
    error, 
    refetch, 
    acknowledgeAlert,
    resolveAlert
  } = alertsData;
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error(`[AlertsCommandCenter:${productType}] Error refreshing:`, err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch, productType]);

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
  // LOADING STATE INICIAL
  // ========================================
  
  if (loading && !metrics) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin relative" />
        </div>
      </div>
    );
  }
  
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
  // RENDER - Type-safe según productType
  // ========================================
  
  return (
    <div className={`w-full max-w-7xl mx-auto space-y-10 ${className}`}>
      
      {/* COMPONENTE 1: THE MONEY WALL (Hero Financiero) */}
      <AlertsMoneyWall 
        alerts={alerts}
        metrics={metrics}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        productType={productType}
      />
      
      {/* COMPONENTE 2: FEED DE ALERTAS */}
      {/* Type-safe: Exit incluye onResolveAlert, Onboarding no */}
      {productType === 'exit' ? (
        <AlertsGroupedFeed
          alerts={alerts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onResolveAlert={handleResolveAlert}
          loading={loading}
          productType="exit"
        />
      ) : (
        <AlertsGroupedFeed
          alerts={alerts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          loading={loading}
          productType="onboarding"
        />
      )}
      
    </div>
  );
});

export default AlertsCommandCenter;