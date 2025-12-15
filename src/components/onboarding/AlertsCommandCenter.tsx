// src/components/onboarding/AlertsCommandCenter.tsx
// ORQUESTADOR: Centro de Comando de Alertas
// Arquitectura: Composición de componentes separados

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import AlertsMoneyWall from './AlertsMoneyWall';
import AlertsGroupedFeed from './AlertsGroupedFeed';

export const AlertsCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { alerts, metrics, loading, error, refetch, acknowledgeAlert } = useOnboardingAlerts();

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing alerts:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ========================================
  // LOADING STATE
  // ========================================
  
  if (loading && !metrics) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin relative" />
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL - COMPOSICIÓN
  // ========================================
  
  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      
      {/* ==================================================================
          COMPONENTE 1: THE MONEY WALL (Hero Financiero)
          ================================================================== */}
      <AlertsMoneyWall 
        alerts={alerts}
        metrics={metrics}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      {/* ==================================================================
          COMPONENTE 2: FEED DE ALERTAS (Listado Agrupado por Gerencia)
          ================================================================== */}
      <AlertsGroupedFeed
        alerts={alerts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAcknowledgeAlert={acknowledgeAlert}
        loading={loading}
      />
      
    </div>
  );
};