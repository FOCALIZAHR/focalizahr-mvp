// src/components/exit/ExitAlertsCommandCenter.tsx
// ============================================================================
// ORQUESTADOR: Centro de Comando de Alertas Exit
// ============================================================================
// DISEÑO: Copiado de src/components/onboarding/AlertsCommandCenter.tsx
// LÓGICA: Usa useExitAlerts en vez de useOnboardingAlerts
// ============================================================================

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useExitAlerts } from '@/hooks/useExitAlerts';
import ExitAlertsMoneyWall from './ExitAlertsMoneyWall';
import ExitAlertsGroupedFeed from './ExitAlertsGroupedFeed';

export const ExitAlertsCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { alerts, metrics, loading, error, refetch, acknowledgeAlert, resolveAlert } = useExitAlerts();

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing exit alerts:', err);
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
  // ERROR STATE
  // ========================================
  
  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Reintentar
          </button>
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
          COMPONENTE 1: THE MONEY WALL (Hero Financiero Exit)
          30% + Ley Karin + Costos Legales
          ================================================================== */}
      <ExitAlertsMoneyWall 
        alerts={alerts}
        metrics={metrics}
        loading={loading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      {/* ==================================================================
          COMPONENTE 2: FEED DE ALERTAS (Listado Agrupado)
          Ley Karin, Toxic, Factores Concentrados, etc.
          ================================================================== */}
      <ExitAlertsGroupedFeed
        alerts={alerts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAcknowledgeAlert={acknowledgeAlert}
        onResolveAlert={resolveAlert}
        loading={loading}
      />
      
    </div>
  );
};

export default ExitAlertsCommandCenter;