// src/components/exit/ExitAlertsMoneyWall.tsx
// ============================================================================
// HERO FINANCIERO "THE MONEY WALL" - EXIT INTELLIGENCE
// ============================================================================
// DISEÑO: Copiado de src/components/onboarding/AlertsMoneyWall.tsx
// LÓGICA: Adaptada para Exit Intelligence
// 
// DIFERENCIAS VS ONBOARDING:
// - Número grande: "30%" (riesgo potencial Deloitte) vs "$45M" (riesgo futuro)
// - Métricas: Ley Karin + Alertas Críticas vs Personas Afectadas
// - Concepto: Riesgo de ESCALAR vs Riesgo FUTURO
// ============================================================================

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Target,
  Scale,
  Siren
} from 'lucide-react';

// ============================================================================
// INTERFACE
// ============================================================================

interface ExitAlertsMoneyWallProps {
  alerts: any[];
  metrics: any;
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

// ============================================================================
// CONSTANTES EXIT INTELLIGENCE
// ============================================================================

const EXIT_COSTS = {
  TUTELA_LABORAL_MAX: 35000000,     // $35M CLP máximo tutela
  MULTA_LEY_KARIN_MAX: 4000000,     // $4M CLP máximo multa
  RIESGO_REPUTACIONAL_PCT: 30       // 30% valor empresa (Deloitte 2023)
} as const;

// Formateo moneda CLP
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExitAlertsMoneyWall({ 
  alerts, 
  metrics,
  loading,
  isRefreshing,
  onRefresh 
}: ExitAlertsMoneyWallProps) {
  
  // ========================================
  // CÁLCULOS ESPECÍFICOS EXIT
  // ========================================
  
  const {
    totalAlerts,
    pendingAlerts,
    resolvedAlerts,
    criticalAlerts,
    highAlerts,
    leyKarinCount,
    costoLegalMaximo,
    operationalEffectiveness
  } = useMemo(() => {
    const pending = alerts.filter(a => a.status === 'pending').length;
    const resolved = alerts.filter(a => a.status === 'resolved' || a.status === 'acknowledged').length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const leyKarin = alerts.filter(a => a.alertType === 'ley_karin').length;
    
    // Costo legal máximo si todos los casos Ley Karin escalan
    const costoLegal = leyKarin * (EXIT_COSTS.TUTELA_LABORAL_MAX + EXIT_COSTS.MULTA_LEY_KARIN_MAX);
    
    const total = pending + resolved;
    const effectiveness = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    return {
      totalAlerts: total,
      pendingAlerts: pending,
      resolvedAlerts: resolved,
      criticalAlerts: critical,
      highAlerts: high,
      leyKarinCount: leyKarin,
      costoLegalMaximo: costoLegal,
      operationalEffectiveness: effectiveness
    };
  }, [alerts]);

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8"
      >
        <div className="flex items-center justify-center gap-3 py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-6 w-6 text-purple-400" />
          </motion.div>
          <span className="text-slate-400">Calculando indicadores Exit...</span>
        </div>
      </motion.div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 lg:p-8"
    >
      {/* Efecto glow sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 rounded-2xl pointer-events-none" />

      {/* Header con badge y botón refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              boxShadow: ['0 0 10px rgba(168,85,247,0.3)', '0 0 20px rgba(168,85,247,0.5)', '0 0 10px rgba(168,85,247,0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">
                Exit Intelligence • {metrics?.totalRecords || 0} Salidas
              </span>
            </div>
          </motion.div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw className={`h-4 w-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="relative">
        <div className="grid lg:grid-cols-[1fr,auto,280px] gap-8 items-start">
          
          {/* ========================================
              COLUMNA IZQUIERDA: HERO FINANCIERO
              El número grande de impacto - 30%
              ======================================== */}
          <div>
            {/* Riesgo Potencial - El número grande */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
                {EXIT_COSTS.RIESGO_REPUTACIONAL_PCT}%
              </span>
            </motion.div>
            
            <p className="text-slate-400 mt-3 text-lg">
              del valor empresa en riesgo potencial
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Fuente: Deloitte Human Capital Trends 2023
            </p>

            {/* Breakdown: Costo Legal Máximo */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-5 bg-slate-800/30 border border-slate-700/30 rounded-xl"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Columna 1: Tutela Laboral */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Tutela Laboral
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-semibold text-amber-400 tabular-nums">
                      {formatCurrency(EXIT_COSTS.TUTELA_LABORAL_MAX)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Máximo por caso (6-11 sueldos)
                  </p>
                </div>

                {/* Columna 2: Multas Ley Karin */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Siren className={`w-4 h-4 ${leyKarinCount > 0 ? 'text-red-400' : 'text-slate-500'}`} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Multas Ley Karin
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-semibold tabular-nums ${leyKarinCount > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {formatCurrency(EXIT_COSTS.MULTA_LEY_KARIN_MAX)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Máximo por caso (3-60 UTM)
                  </p>
                </div>
              </div>
              
              {/* Total si hay casos Ley Karin */}
              {leyKarinCount > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Riesgo legal total ({leyKarinCount} caso{leyKarinCount > 1 ? 's' : ''} Ley Karin):
                    </span>
                    <span className="text-lg font-semibold text-red-400">
                      {formatCurrency(costoLegalMaximo)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Separador Vertical (solo desktop) */}
          <div className="hidden lg:block w-px h-48 bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />

          {/* ========================================
              COLUMNA DERECHA: CONTEXTO OPERATIVO
              ======================================== */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            
            {/* ALERTAS CRÍTICAS */}
            <div className={`p-4 rounded-xl ${
              criticalAlerts > 0 
                ? 'bg-red-500/10 border border-red-500/30' 
                : 'bg-slate-800/20 border border-slate-700/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                <span className={`text-xs uppercase tracking-wider font-medium ${criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  Alertas Críticas
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-3xl font-semibold tabular-nums ${criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {criticalAlerts}
                </span>
                {highAlerts > 0 && (
                  <span className="text-amber-400 text-sm">
                    +{highAlerts} altas
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-500">
                {criticalAlerts > 0 
                  ? 'Requieren acción inmediata (24h SLA)'
                  : 'Sin alertas críticas activas'
                }
              </p>
            </div>
            
            {/* CASOS LEY KARIN */}
            <div className={`p-4 rounded-xl ${
              leyKarinCount > 0 
                ? 'bg-red-500/10 border border-red-500/30' 
                : 'bg-slate-800/20 border border-slate-700/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Siren className={`h-4 w-4 ${leyKarinCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                <span className={`text-xs uppercase tracking-wider font-medium ${leyKarinCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  Indicios Ley Karin
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-3xl font-semibold tabular-nums ${leyKarinCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {leyKarinCount}
                </span>
              </div>
              
              <p className="text-sm text-slate-500">
                {leyKarinCount > 0 
                  ? 'Oportunidad de anticipación'
                  : 'Sin indicios detectados'
                }
              </p>
            </div>

            {/* GESTIÓN DE ALERTAS */}
            <div className="p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Gestión de Alertas
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-2">
                <span className={`text-3xl font-semibold tabular-nums ${
                  operationalEffectiveness >= 70 ? 'text-cyan-400' : 
                  operationalEffectiveness >= 50 ? 'text-green-400' : 
                  operationalEffectiveness >= 30 ? 'text-amber-400' : 
                  'text-red-400'
                }`}>
                  {operationalEffectiveness}%
                </span>
                <span className="text-slate-500 text-sm">
                  resueltas
                </span>
              </div>
              
              <p className="text-sm text-slate-500 mb-3">
                <span className="text-slate-300 font-medium">{resolvedAlerts}</span> de {totalAlerts} alertas gestionadas
              </p>
              
              {/* Barra de progreso */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    operationalEffectiveness >= 70 ? 'bg-cyan-400' : 
                    operationalEffectiveness >= 50 ? 'bg-green-400' : 
                    operationalEffectiveness >= 30 ? 'bg-amber-400' : 
                    'bg-red-400'
                  }`}
                  style={{ width: `${operationalEffectiveness}%` }}
                />
              </div>
              
              {/* Desglose alertas */}
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-amber-400/70">
                  {pendingAlerts} pendientes
                </span>
                <span className="text-cyan-400/70">
                  {resolvedAlerts} resueltas
                </span>
              </div>
            </div>
            
          </motion.div>
        </div>

        {/* Línea de metadata */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center lg:justify-start gap-4 mt-8 text-xs text-slate-600"
        >
          <span>Compliance Legal</span>
          <span>•</span>
          <span>Ley Karin 24h SLA</span>
          <span>•</span>
          <span>Detección Automática</span>
        </motion.div>
      </div>
    </motion.div>
  );
}