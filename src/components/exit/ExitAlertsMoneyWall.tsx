// src/components/exit/ExitAlertsMoneyWall.tsx
// ============================================================================
// HERO FINANCIERO "THE MONEY WALL" - EXIT INTELLIGENCE
// ============================================================================
// COPIADO DE: src/components/onboarding/AlertsMoneyWall.tsx
// ADAPTADO PARA: Exit Intelligence con énfasis en Ley Karin
// 
// CAMBIOS VS ONBOARDING:
// - Número hero: "30%" (riesgo potencial) vs "$45M" (riesgo futuro)
// - Fuente: Deloitte Human Capital Trends 2023 vs SHRM 2024
// - Cards secundarias: Tutela $35M / Multa $4M / Casos Ley Karin
// - NO necesita OnboardingAlertEngine (valores fijos de referencia)
// ============================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Target,
  Scale,
  Briefcase,
  Siren
} from 'lucide-react';

// ============================================================================
// INTERFACE
// ============================================================================

interface ExitAlertsMoneyWallProps {
  alertsCritical: number;
  alertsHigh: number;
  alertsPending: number;
  alertsResolved: number;
  leyKarinCount: number;
  loading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

// ============================================================================
// CONSTANTES EXIT INTELLIGENCE
// ============================================================================

/**
 * Costos de referencia Ley Karin Chile (valores en CLP)
 * Fuente: Legislación laboral chilena 2024
 */
const EXIT_COSTS = {
  TUTELA_LABORAL_PROMEDIO: 35000000,  // $35M CLP promedio tutela
  MULTA_LEY_KARIN_POR_CASO: 4000000,  // $4M CLP multa por caso
  RIESGO_POTENCIAL_EMPRESA: 30        // 30% valor empresa en riesgo según Deloitte
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

const ExitAlertsMoneyWall = memo(function ExitAlertsMoneyWall({
  alertsCritical,
  alertsHigh,
  alertsPending,
  alertsResolved,
  leyKarinCount,
  loading = false,
  isRefreshing = false,
  onRefresh
}: ExitAlertsMoneyWallProps) {
  
  // ========================================
  // CÁLCULOS DERIVADOS
  // ========================================
  
  const totalAlerts = alertsPending + alertsResolved;
  
  // Efectividad operativa: alertas resueltas / total
  const operationalEffectiveness = useMemo(() => {
    if (totalAlerts === 0) return 100;
    return Math.round((alertsResolved / totalAlerts) * 100);
  }, [alertsResolved, totalAlerts]);
  
  // Costo potencial total Ley Karin
  const costoLeyKarinTotal = useMemo(() => {
    return leyKarinCount * (EXIT_COSTS.TUTELA_LABORAL_PROMEDIO + EXIT_COSTS.MULTA_LEY_KARIN_POR_CASO);
  }, [leyKarinCount]);

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
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </motion.div>
          <span className="text-slate-400">Calculando métricas Exit Intelligence...</span>
        </div>
      </motion.div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 lg:p-8"
    >
      {/* Efecto glow sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-cyan-500/5 rounded-2xl pointer-events-none" />

      {/* Header con badge y botón refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              boxShadow: ['0 0 10px rgba(239,68,68,0.3)', '0 0 20px rgba(239,68,68,0.5)', '0 0 10px rgba(239,68,68,0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full"
          >
            <div className="flex items-center gap-2">
              <Siren className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-300 uppercase tracking-wider">
                Exit Intelligence • Compliance Activo
              </span>
            </div>
          </motion.div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="relative">
        <div className="grid lg:grid-cols-[1fr,auto,280px] gap-8 items-start">
          
          {/* ========================================
              COLUMNA IZQUIERDA: HERO FINANCIERO
              El número grande de impacto
              ======================================== */}
          <div>
            {/* Riesgo Potencial - El número grande */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500">
                {EXIT_COSTS.RIESGO_POTENCIAL_EMPRESA}%
              </span>
            </motion.div>
            
            <p className="text-slate-400 mt-3 text-lg">
              del valor empresa en riesgo potencial
            </p>
            
            <p className="text-slate-600 text-sm mt-1">
              (Deloitte Human Capital Trends 2023)
            </p>

            {/* Cards secundarias: Costos de referencia */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              {/* Card 1: Tutela Laboral */}
              <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Tutela Laboral
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-amber-400 tabular-nums">
                    {formatCurrency(EXIT_COSTS.TUTELA_LABORAL_PROMEDIO)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  CLP promedio
                </p>
              </div>

              {/* Card 2: Multa Ley Karin */}
              <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Multa Ley Karin
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-red-400 tabular-nums">
                    {formatCurrency(EXIT_COSTS.MULTA_LEY_KARIN_POR_CASO)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  CLP por caso
                </p>
              </div>

              {/* Card 3: Casos Ley Karin detectados */}
              <div className={`p-4 rounded-xl ${
                leyKarinCount > 0 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : 'bg-slate-800/30 border border-slate-700/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Siren className={`w-4 h-4 ${leyKarinCount > 0 ? 'text-red-400' : 'text-slate-500'}`} />
                  <span className={`text-xs uppercase tracking-wide ${
                    leyKarinCount > 0 ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    Casos Detectados
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-semibold tabular-nums ${
                    leyKarinCount > 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {leyKarinCount}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${
                  leyKarinCount > 0 ? 'text-red-400/70' : 'text-slate-600'
                }`}>
                  {leyKarinCount > 0 
                    ? `Costo potencial: ${formatCurrency(costoLeyKarinTotal)}`
                    : 'Sin alertas Ley Karin'
                  }
                </p>
              </div>
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
              alertsCritical > 0 
                ? 'bg-red-500/10 border border-red-500/30' 
                : 'bg-slate-800/20 border border-slate-700/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${
                  alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                }`} />
                <span className={`text-xs uppercase tracking-wider font-medium ${
                  alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  Alertas Críticas
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-3xl font-semibold tabular-nums ${
                  alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {alertsCritical}
                </span>
                {alertsHigh > 0 && (
                  <span className="text-amber-400 text-sm">
                    +{alertsHigh} altas
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-500">
                {alertsCritical > 0 
                  ? 'Requieren acción inmediata'
                  : 'Sin alertas críticas'
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
                <span className="text-slate-300 font-medium">{alertsResolved}</span> de {totalAlerts} alertas gestionadas
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
                  {alertsPending} pendientes
                </span>
                <span className="text-cyan-400/70">
                  {alertsResolved} resueltas
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
});

export default ExitAlertsMoneyWall;