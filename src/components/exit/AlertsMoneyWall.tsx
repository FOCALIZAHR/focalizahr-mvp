// src/components/shared/intelligence/AlertsMoneyWall.tsx
// ============================================================================
// COMPONENTE BIMODAL: Hero Financiero "The Money Wall"
// ============================================================================
// ARQUITECTURA: Discriminated Union Types para type-safety
// SOPORTA: Onboarding Journey Intelligence + Exit Intelligence
// 
// Uso:
//   <AlertsMoneyWall alerts={alerts} metrics={metrics} productType="onboarding" ... />
//   <AlertsMoneyWall alerts={alerts} metrics={metrics} productType="exit" ... />
// ============================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Target,
  Siren,
  Scale
} from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';

// ============================================================================
// DISCRIMINATED UNION TYPES
// ============================================================================

/**
 * Métricas calculadas para Onboarding
 * Discriminante: isExit = false
 */
interface OnboardingMetrics {
  readonly isExit: false;
  heroValue: string;
  totalRisk: number;
  protectedRisk: number;
  atRiskAmount: number;
  totalPersons: number;
  protectedPersons: number;
  atRiskPersons: number;
  totalAlerts: number;
  pendingAlerts: number;
  managedAlerts: number;
  riskMitigationRate: number;
  incidenceRate: number;
  operationalEffectiveness: number;
}

/**
 * Métricas calculadas para Exit Intelligence
 * Discriminante: isExit = true
 */
interface ExitMetrics {
  readonly isExit: true;
  heroValue: string;
  alertsCritical: number;
  alertsHigh: number;
  alertsPending: number;
  alertsResolved: number;
  leyKarinCount: number;
  costoLeyKarinTotal: number;
  operationalEffectiveness: number;
  totalAlerts: number;
}

/**
 * Union discriminada - TypeScript infiere el tipo correcto
 * basándose en el valor de isExit
 */
type CalculatedMetrics = OnboardingMetrics | ExitMetrics;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface AlertsMoneyWallProps {
  alerts: any[];
  metrics: any;
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  productType: 'onboarding' | 'exit';
}

// ============================================================================
// CONSTANTES POR PRODUCTO
// ============================================================================

const PRODUCT_CONFIG = {
  onboarding: {
    badge: 'MONITOREO ACTIVO',
    badgeIcon: Sparkles,
    badgeColor: 'purple' as const,
    heroLabel: 'Riesgo Total Detectado',
    heroGradient: 'from-purple-400 via-pink-400 to-purple-500',
    glowColor: 'rgba(168,85,247,0.3)',
    footerItems: ['Intervención Temprana', 'ROI Cuantificado', 'Análisis en Tiempo Real'],
    loadingText: 'Calculando impacto financiero...',
    loadingColor: 'text-purple-400'
  },
  exit: {
    badge: 'EXIT INTELLIGENCE',
    badgeIcon: Siren,
    badgeColor: 'red' as const,
    heroLabel: 'del valor empresa en riesgo potencial',
    heroGradient: 'from-red-400 via-orange-400 to-red-500',
    glowColor: 'rgba(239,68,68,0.3)',
    footerItems: ['Compliance Legal', 'Ley Karin 24h SLA', 'Detección Automática'],
    loadingText: 'Calculando métricas Exit Intelligence...',
    loadingColor: 'text-cyan-400'
  }
} as const;

// Costos de referencia Exit (Ley Karin Chile)
const EXIT_COSTS = {
  TUTELA_LABORAL_PROMEDIO: 35000000,
  MULTA_LEY_KARIN_POR_CASO: 4000000,
  RIESGO_POTENCIAL_EMPRESA: 30
} as const;

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AlertsMoneyWall = memo(function AlertsMoneyWall({ 
  alerts, 
  metrics,
  loading,
  isRefreshing,
  onRefresh,
  productType
}: AlertsMoneyWallProps) {
  
  const config = PRODUCT_CONFIG[productType];
  const BadgeIcon = config.badgeIcon;

  // ========================================
  // CÁLCULOS CON DISCRIMINATED UNION
  // ========================================
  
  const calculatedMetrics: CalculatedMetrics = useMemo(() => {
    if (productType === 'exit') {
      // ════════════════════════════════════════
      // EXIT METRICS
      // ════════════════════════════════════════
      const alertsCritical = alerts.filter(a => a.severity === 'critical').length;
      const alertsHigh = alerts.filter(a => a.severity === 'high').length;
      const alertsPending = alerts.filter(a => a.status === 'pending').length;
      const alertsResolved = alerts.filter(a => a.status === 'resolved').length;
      const leyKarinCount = alerts.filter(a => a.alertType === 'ley_karin').length;
      const totalAlerts = alertsPending + alertsResolved;
      const operationalEffectiveness = totalAlerts > 0 
        ? Math.round((alertsResolved / totalAlerts) * 100) 
        : 100;
      const costoLeyKarinTotal = leyKarinCount * (EXIT_COSTS.TUTELA_LABORAL_PROMEDIO + EXIT_COSTS.MULTA_LEY_KARIN_POR_CASO);

      return {
        isExit: true as const,  // ← CRÍTICO: discriminante
        heroValue: `${EXIT_COSTS.RIESGO_POTENCIAL_EMPRESA}%`,
        alertsCritical,
        alertsHigh,
        alertsPending,
        alertsResolved,
        leyKarinCount,
        costoLeyKarinTotal,
        operationalEffectiveness,
        totalAlerts
      };
    }

    // ════════════════════════════════════════
    // ONBOARDING METRICS
    // ════════════════════════════════════════
    const journeyMap = new Map<string, { 
      risk: number; 
      hasPending: boolean; 
      hasManaged: boolean 
    }>();
    
    alerts.forEach(alert => {
      const journeyId = alert.journeyId;
      if (!journeyId) return;
      
      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert, alert.journey);
      const riskAmount = businessCase?.financials?.potentialAnnualLoss || 0;
      const isPending = alert.status === 'pending';
      
      if (!journeyMap.has(journeyId)) {
        journeyMap.set(journeyId, {
          risk: riskAmount,
          hasPending: isPending,
          hasManaged: !isPending
        });
      } else {
        const current = journeyMap.get(journeyId)!;
        current.hasPending = current.hasPending || isPending;
        current.hasManaged = current.hasManaged || !isPending;
      }
    });
    
    let totalRisk = 0;
    let protectedRisk = 0;
    let atRiskAmount = 0;
    let protectedPersons = 0;
    let atRiskPersons = 0;
    
    journeyMap.forEach(({ risk, hasPending, hasManaged }) => {
      totalRisk += risk;
      if (!hasPending && hasManaged) {
        protectedRisk += risk;
        protectedPersons++;
      } else if (hasPending) {
        atRiskAmount += risk;
        atRiskPersons++;
      }
    });
    
    const totalPersons = journeyMap.size;
    const totalAlerts = alerts.length;
    const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
    const managedAlerts = alerts.filter(a => a.status !== 'pending').length;
    
    const riskMitigationRate = totalRisk > 0 
      ? Math.round((protectedRisk / totalRisk) * 100) 
      : 0;
    const incidenceRate = metrics?.totalJourneys 
      ? Math.round((totalPersons / metrics.totalJourneys) * 100) 
      : 0;
    const operationalEffectiveness = totalAlerts > 0
      ? Math.round((managedAlerts / totalAlerts) * 100)
      : 0;

    return {
      isExit: false as const,  // ← CRÍTICO: discriminante
      heroValue: formatCurrency(totalRisk),
      totalRisk,
      protectedRisk,
      atRiskAmount,
      totalPersons,
      protectedPersons,
      atRiskPersons,
      totalAlerts,
      pendingAlerts,
      managedAlerts,
      riskMitigationRate,
      incidenceRate,
      operationalEffectiveness
    };
  }, [alerts, metrics, productType]);

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
            <Sparkles className={`h-6 w-6 ${config.loadingColor}`} />
          </motion.div>
          <span className="text-slate-400">{config.loadingText}</span>
        </div>
      </motion.div>
    );
  }

  // ========================================
  // RENDER HELPERS (Type-safe)
  // ========================================

  const badgeBgClass = config.badgeColor === 'purple' 
    ? 'bg-purple-500/20 border-purple-500/30' 
    : 'bg-red-500/20 border-red-500/30';
  const badgeTextClass = config.badgeColor === 'purple' 
    ? 'text-purple-300' 
    : 'text-red-300';
  const badgeIconClass = config.badgeColor === 'purple'
    ? 'text-purple-400'
    : 'text-red-400';
  const glowFromClass = config.badgeColor === 'purple'
    ? 'from-purple-500/5'
    : 'from-red-500/5';

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
      <div className={`absolute inset-0 bg-gradient-to-r ${glowFromClass} via-transparent to-cyan-500/5 rounded-2xl pointer-events-none`} />

      {/* Header con badge y botón refresh */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              boxShadow: [`0 0 10px ${config.glowColor}`, `0 0 20px ${config.glowColor.replace('0.3', '0.5')}`, `0 0 10px ${config.glowColor}`]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`px-3 py-1.5 ${badgeBgClass} border rounded-full`}
          >
            <div className="flex items-center gap-2">
              <BadgeIcon className={`h-3.5 w-3.5 ${badgeIconClass}`} />
              <span className={`text-xs font-medium ${badgeTextClass} uppercase tracking-wider`}>
                {config.badge} • {calculatedMetrics.isExit ? 'Compliance Activo' : `${metrics?.totalJourneys || 0} Journeys`}
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
          
          {/* COLUMNA IZQUIERDA: HERO FINANCIERO */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${config.heroGradient}`}>
                {calculatedMetrics.heroValue}
              </span>
            </motion.div>
            
            <p className="text-slate-400 mt-3 text-lg">
              {config.heroLabel}
            </p>

            {/* Breakdown: Contenido según tipo */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-5 bg-slate-800/30 border border-slate-700/30 rounded-xl"
            >
              {calculatedMetrics.isExit ? (
                // ════════════════════════════════════════
                // EXIT: Costos Ley Karin
                // TypeScript SABE que es ExitMetrics aquí
                // ════════════════════════════════════════
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Scale className="h-5 w-5 text-red-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tutela Laboral</p>
                    <p className="text-lg font-semibold text-red-400">{formatCurrency(EXIT_COSTS.TUTELA_LABORAL_PROMEDIO)}</p>
                    <p className="text-xs text-slate-600">promedio por caso</p>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Multa Ley Karin</p>
                    <p className="text-lg font-semibold text-amber-400">{formatCurrency(EXIT_COSTS.MULTA_LEY_KARIN_POR_CASO)}</p>
                    <p className="text-xs text-slate-600">por infracción</p>
                  </div>
                  <div className="text-center">
                    <Siren className={`h-5 w-5 mx-auto mb-2 ${calculatedMetrics.leyKarinCount > 0 ? 'text-red-400' : 'text-slate-500'}`} />
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Casos Detectados</p>
                    <p className={`text-lg font-semibold ${calculatedMetrics.leyKarinCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {calculatedMetrics.leyKarinCount}
                    </p>
                    <p className={`text-xs ${calculatedMetrics.leyKarinCount > 0 ? 'text-red-400/70' : 'text-slate-600'}`}>
                      {calculatedMetrics.leyKarinCount > 0 
                        ? `Costo: ${formatCurrency(calculatedMetrics.costoLeyKarinTotal)}`
                        : 'Sin alertas'}
                    </p>
                  </div>
                </div>
              ) : (
                // ════════════════════════════════════════
                // ONBOARDING: Protegido vs En Riesgo
                // TypeScript SABE que es OnboardingMetrics aquí
                // ════════════════════════════════════════
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Protegido</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-semibold text-cyan-400 tabular-nums">
                        {formatCurrency(calculatedMetrics.protectedRisk)}
                      </span>
                      <span className="text-xs text-slate-500">CLP</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-medium text-cyan-400/70">
                        {calculatedMetrics.riskMitigationRate}%
                      </span>
                      <span className="text-xs text-slate-600">mitigado</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {calculatedMetrics.protectedPersons} persona{calculatedMetrics.protectedPersons !== 1 ? 's' : ''} 100% gestionada{calculatedMetrics.protectedPersons !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className={`w-4 h-4 ${
                        (100 - calculatedMetrics.riskMitigationRate) >= 70 ? 'text-red-400' : 'text-amber-400'
                      }`} />
                      <span className="text-xs text-slate-500 uppercase tracking-wide">En Riesgo</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-2xl font-semibold tabular-nums ${
                        (100 - calculatedMetrics.riskMitigationRate) >= 70 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {formatCurrency(calculatedMetrics.atRiskAmount)}
                      </span>
                      <span className="text-xs text-slate-500">CLP</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-medium ${
                        (100 - calculatedMetrics.riskMitigationRate) >= 70 ? 'text-red-400/70' : 'text-amber-400/70'
                      }`}>
                        {100 - calculatedMetrics.riskMitigationRate}%
                      </span>
                      <span className="text-xs text-slate-600">pendiente</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {calculatedMetrics.atRiskPersons} persona{calculatedMetrics.atRiskPersons !== 1 ? 's' : ''} requiere{calculatedMetrics.atRiskPersons === 1 ? '' : 'n'} acción
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Separador Vertical (solo desktop) */}
          <div className="hidden lg:block w-px h-48 bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />

          {/* COLUMNA DERECHA: CONTEXTO OPERATIVO */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {calculatedMetrics.isExit ? (
              // ════════════════════════════════════════
              // EXIT: Alertas Críticas
              // ════════════════════════════════════════
              <div className={`p-4 rounded-xl ${
                calculatedMetrics.alertsCritical > 0 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : 'bg-slate-800/20 border border-slate-700/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    calculatedMetrics.alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs uppercase tracking-wider font-medium ${
                    calculatedMetrics.alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    Alertas Críticas
                  </span>
                </div>
                
                <div className="flex items-baseline gap-3 mb-1">
                  <span className={`text-3xl font-semibold tabular-nums ${
                    calculatedMetrics.alertsCritical > 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {calculatedMetrics.alertsCritical}
                  </span>
                  {calculatedMetrics.alertsHigh > 0 && (
                    <span className="text-amber-400 text-sm">
                      +{calculatedMetrics.alertsHigh} altas
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-500">
                  {calculatedMetrics.alertsCritical > 0 
                    ? 'Requieren acción inmediata'
                    : 'Sin alertas críticas activas'}
                </p>
              </div>
            ) : (
              // ════════════════════════════════════════
              // ONBOARDING: Personas Afectadas
              // ════════════════════════════════════════
              <div className="p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                    Personas Afectadas
                  </span>
                </div>
                
                <div className="flex items-baseline gap-3 mb-1">
                  <span className={`text-3xl font-semibold tabular-nums ${
                    calculatedMetrics.incidenceRate >= 50 ? 'text-red-400' : 
                    calculatedMetrics.incidenceRate >= 30 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {calculatedMetrics.totalPersons}
                  </span>
                  <span className="text-slate-400 text-sm">
                    de {metrics?.totalJourneys || 0}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500">
                  Tasa de incidencia: {calculatedMetrics.incidenceRate}%
                </p>
              </div>
            )}

            {/* EFECTIVIDAD OPERATIVA (Común a ambos) */}
            <div className="p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Efectividad Operativa
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-semibold tabular-nums ${
                  calculatedMetrics.operationalEffectiveness >= 80 ? 'text-cyan-400' : 
                  calculatedMetrics.operationalEffectiveness >= 50 ? 'text-green-400' : 
                  calculatedMetrics.operationalEffectiveness >= 30 ? 'text-amber-400' : 
                  'text-red-400'
                }`}>
                  {calculatedMetrics.operationalEffectiveness}%
                </span>
                <span className="text-slate-600 text-sm">alertas resueltas</span>
              </div>
              
              {/* Barra de progreso */}
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatedMetrics.operationalEffectiveness}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    calculatedMetrics.operationalEffectiveness >= 80 ? 'bg-cyan-400' : 
                    calculatedMetrics.operationalEffectiveness >= 50 ? 'bg-green-400' : 
                    calculatedMetrics.operationalEffectiveness >= 30 ? 'bg-amber-400' : 
                    'bg-red-400'
                  }`}
                />
              </div>
              
              {/* Desglose alertas - Type-safe */}
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-amber-400/70">
                  {calculatedMetrics.isExit 
                    ? calculatedMetrics.alertsPending 
                    : calculatedMetrics.pendingAlerts} pendientes
                </span>
                <span className="text-cyan-400/70">
                  {calculatedMetrics.isExit 
                    ? calculatedMetrics.alertsResolved 
                    : calculatedMetrics.managedAlerts} resueltas
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
          {config.footerItems.map((item, index) => (
            <span key={item}>
              {index > 0 && <span className="mr-4">•</span>}
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
});

export default AlertsMoneyWall;