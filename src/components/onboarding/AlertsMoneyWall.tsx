// src/components/onboarding/AlertsMoneyWall.tsx
// COMPONENTE CORREGIDO: Hero Financiero "The Money Wall"
// ============================================================================
// CORRECCIONES APLICADAS:
// ✅ FIX 1: Cálculo correcto de riesgo pendiente vs gestionado
// ✅ FIX 2: Métricas claras PERSONAS vs ALERTAS (sin mezclar)
// ✅ FIX 3: UX clarificada - terminología ejecutiva precisa
// ============================================================================

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Users, AlertTriangle, ShieldCheck, Target } from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';

interface AlertsMoneyWallProps {
  alerts: any[];
  metrics: any;
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

// Formateo moneda CLP
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

export default function AlertsMoneyWall({ 
  alerts, 
  metrics,
  loading,
  isRefreshing,
  onRefresh 
}: AlertsMoneyWallProps) {
  
  // ========================================
  // CÁLCULOS CORREGIDOS
  // ✅ FIX: Riesgo por PERSONA + manejo correcto de mixtos
  // ========================================
  
  /**
   * ESTRUCTURA DE DATOS MEJORADA
   * - Cada PERSONA tiene UN riesgo (no por alerta)
   * - Una persona puede tener alertas pendientes Y gestionadas
   * - Clasificación: 
   *   - "protegida" = TODAS sus alertas gestionadas
   *   - "en_riesgo" = AL MENOS una alerta pendiente
   */
  const {
    totalRisk,
    protectedRisk,      // Personas 100% gestionadas
    atRiskAmount,       // Personas con al menos 1 pendiente
    totalPersons,       // Journeys únicos con alertas
    protectedPersons,   // Personas 100% protegidas
    atRiskPersons,      // Personas con riesgo activo
    totalAlerts,        // Total alertas
    pendingAlerts,      // Alertas pendientes
    managedAlerts,      // Alertas gestionadas
  } = useMemo(() => {
    // Mapa: journeyId -> { risk, hasPending, hasManaged }
    const personMap = new Map<string, {
      risk: number;
      hasPending: boolean;
      hasManaged: boolean;
      alertCount: number;
      pendingCount: number;
      managedCount: number;
    }>();
    
    // Procesar cada alerta
    alerts.forEach(alert => {
      const journeyId = alert.journeyId || alert.journey?.id;
      if (!journeyId) return;
      
      // Inicializar persona si no existe
      if (!personMap.has(journeyId)) {
        const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
          alert as any, 
          alert.journey
        );
        const risk = businessCase?.financials?.potentialAnnualLoss || 0;
        
        personMap.set(journeyId, {
          risk,
          hasPending: false,
          hasManaged: false,
          alertCount: 0,
          pendingCount: 0,
          managedCount: 0
        });
      }
      
      const person = personMap.get(journeyId)!;
      person.alertCount++;
      
      if (alert.status === 'pending') {
        person.hasPending = true;
        person.pendingCount++;
      } else {
        person.hasManaged = true;
        person.managedCount++;
      }
    });
    
    // Calcular totales
    let totalRisk = 0;
    let protectedRisk = 0;
    let atRiskAmount = 0;
    let protectedPersons = 0;
    let atRiskPersons = 0;
    let pendingAlerts = 0;
    let managedAlerts = 0;
    
    personMap.forEach(person => {
      totalRisk += person.risk;
      pendingAlerts += person.pendingCount;
      managedAlerts += person.managedCount;
      
      // Clasificar persona
      if (person.hasPending) {
        // Tiene al menos 1 alerta pendiente = EN RIESGO
        atRiskAmount += person.risk;
        atRiskPersons++;
      } else if (person.hasManaged) {
        // Solo tiene alertas gestionadas = PROTEGIDA
        protectedRisk += person.risk;
        protectedPersons++;
      }
    });
    
    return {
      totalRisk,
      protectedRisk,
      atRiskAmount,
      totalPersons: personMap.size,
      protectedPersons,
      atRiskPersons,
      totalAlerts: alerts.length,
      pendingAlerts,
      managedAlerts,
    };
  }, [alerts]);
  
  // ========================================
  // MÉTRICAS DERIVADAS (CLARAS)
  // ========================================
  
  // % de personas protegidas (todas sus alertas gestionadas)
  const protectionRate = totalPersons > 0 
    ? Math.round((protectedPersons / totalPersons) * 100) 
    : 0;
  
  // % de riesgo mitigado (dinero protegido / total)
  const riskMitigationRate = totalRisk > 0 
    ? Math.round((protectedRisk / totalRisk) * 100) 
    : 0;
  
  // Tasa de incidencia: personas afectadas / total journeys
  const incidenceRate = useMemo(() => {
    if (!metrics?.totalJourneys) return 0;
    return Math.round((totalPersons / metrics.totalJourneys) * 100);
  }, [totalPersons, metrics]);
  
  // Efectividad operativa: alertas resueltas / total alertas
  const operationalEffectiveness = totalAlerts > 0
    ? Math.round((managedAlerts / totalAlerts) * 100)
    : 0;

  const trendValue = metrics?.trend?.value ?? 0;
  const trendDirection = metrics?.trend?.direction ?? 'stable';

  // ========================================
  // RENDER
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
          <span className="text-slate-400">Calculando impacto financiero...</span>
        </div>
      </motion.div>
    );
  }

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
                Monitoreo Activo • {metrics?.totalJourneys || 0} Journeys
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
              El número grande de impacto
              ======================================== */}
          <div>
            {/* Riesgo Total - El número grande */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-7xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
                {formatCurrency(totalRisk)}
              </span>
            </motion.div>
            
            <p className="text-slate-400 mt-3 text-lg">
              Riesgo Total Detectado
            </p>

            {/* Breakdown: Protegido vs En Riesgo */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-5 bg-slate-800/30 border border-slate-700/30 rounded-xl"
            >
              <div className="grid grid-cols-2 gap-6">
                {/* Columna 1: Protegido (Riesgo Mitigado) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Protegido
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-semibold text-cyan-400 tabular-nums">
                      {formatCurrency(protectedRisk)}
                    </span>
                    <span className="text-xs text-slate-500">CLP</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-medium text-cyan-400/70">
                      {riskMitigationRate}%
                    </span>
                    <span className="text-xs text-slate-600">mitigado</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {protectedPersons} persona{protectedPersons !== 1 ? 's' : ''} 100% gestionada{protectedPersons !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Columna 2: En Riesgo (Pendiente de Acción) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`w-4 h-4 ${
                      (100 - riskMitigationRate) >= 70 ? 'text-red-400' : 'text-amber-400'
                    }`} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      En Riesgo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-semibold tabular-nums ${
                      (100 - riskMitigationRate) >= 70 ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(atRiskAmount)}
                    </span>
                    <span className="text-xs text-slate-500">CLP</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-medium ${
                      (100 - riskMitigationRate) >= 70 ? 'text-red-400/70' : 'text-amber-400/70'
                    }`}>
                      {100 - riskMitigationRate}%
                    </span>
                    <span className="text-xs text-slate-600">pendiente</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {atRiskPersons} persona{atRiskPersons !== 1 ? 's' : ''} requiere{atRiskPersons === 1 ? '' : 'n'} acción
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Separador Vertical (solo desktop) */}
          <div className="hidden lg:block w-px h-48 bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />

          {/* ========================================
              COLUMNA DERECHA: CONTEXTO OPERATIVO
              Métricas claras: PERSONAS vs ALERTAS
              ======================================== */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            
            {/* TASA DE INCIDENCIA (PERSONAS) */}
            <div className="p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Personas Afectadas
                </span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-3xl font-semibold tabular-nums ${
                  incidenceRate >= 50 ? 'text-red-400' : 
                  incidenceRate >= 30 ? 'text-amber-400' : 
                  'text-green-400'
                }`}>
                  {incidenceRate}%
                </span>
                <span className="text-slate-500 text-sm">
                  de incidencia
                </span>
              </div>
              
              <p className="text-sm text-slate-500">
                <span className="text-slate-300 font-medium">{totalPersons}</span> de {metrics?.totalJourneys || 0} personas con alertas
              </p>
            </div>

            {/* EFECTIVIDAD OPERATIVA (ALERTAS) */}
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
                <span className="text-slate-300 font-medium">{managedAlerts}</span> de {totalAlerts} alertas gestionadas
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
                  {managedAlerts} resueltas
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
          <span>Intervención Temprana</span>
          <span>•</span>
          <span>ROI Cuantificado</span>
          <span>•</span>
          <span>Análisis en Tiempo Real</span>
        </motion.div>
      </div>
    </motion.div>
  );
}