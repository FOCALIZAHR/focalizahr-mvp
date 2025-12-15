// src/components/onboarding/AlertsMoneyWall.tsx
// COMPONENTE SEPARADO: Hero Financiero "The Money Wall"
// Responsabilidad: Mostrar métricas financieras globales de alertas

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';

interface AlertsMoneyWallProps {
  alerts: any[];
  metrics: any;
  loading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function AlertsMoneyWall({ 
  alerts, 
  metrics,
  loading,
  isRefreshing,
  onRefresh 
}: AlertsMoneyWallProps) {
  
  // ========================================
  // CÁLCULOS FINANCIEROS
  // ✅ FIX: Riesgo por PERSONA ÚNICA (no por alerta)
  // REGLA: 1 PERSONA = 1 RIESGO
  // ========================================
  
  const activeCount = alerts.filter(a => a.status === 'pending').length;
  const managedCount = alerts.filter(a => a.status !== 'pending').length;
  
  // Riesgo TOTAL (todas las personas con alertas, únicas)
  const totalRisk = useMemo(() => {
    const uniqueJourneyRisks = new Map<string, number>();
    
    alerts.forEach(alert => {
      const journeyId = alert.journeyId || alert.journey?.id;
      if (!journeyId) return;
      
      // Solo calcular riesgo si NO existe (primera alerta de esta persona)
      if (!uniqueJourneyRisks.has(journeyId)) {
        const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
        const risk = businessCase?.financials?.potentialAnnualLoss || 0;
        uniqueJourneyRisks.set(journeyId, risk);
      }
    });
    
    return Array.from(uniqueJourneyRisks.values()).reduce((sum, risk) => sum + risk, 0);
  }, [alerts]);
  
  // Riesgo EVITADO (personas con alertas gestionadas, únicas)
  const managedRisk = useMemo(() => {
    const uniqueJourneyRisks = new Map<string, number>();
    
    alerts.forEach(alert => {
      if (alert.status === 'pending') return; // Solo gestionadas
      
      const journeyId = alert.journeyId || alert.journey?.id;
      if (!journeyId) return;
      
      // Solo calcular riesgo si NO existe (primera alerta gestionada de esta persona)
      if (!uniqueJourneyRisks.has(journeyId)) {
        const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
        const risk = businessCase?.financials?.potentialAnnualLoss || 0;
        uniqueJourneyRisks.set(journeyId, risk);
      }
    });
    
    return Array.from(uniqueJourneyRisks.values()).reduce((sum, risk) => sum + risk, 0);
  }, [alerts]);
  
  // Riesgo PENDIENTE (personas con alertas activas, únicas)
  const pendingRisk = useMemo(() => {
    const uniqueJourneyRisks = new Map<string, number>();
    
    alerts.forEach(alert => {
      if (alert.status !== 'pending') return; // Solo activas
      
      const journeyId = alert.journeyId || alert.journey?.id;
      if (!journeyId) return;
      
      // Solo calcular riesgo si NO existe (primera alerta activa de esta persona)
      if (!uniqueJourneyRisks.has(journeyId)) {
        const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
        const risk = businessCase?.financials?.potentialAnnualLoss || 0;
        uniqueJourneyRisks.set(journeyId, risk);
      }
    });
    
    return Array.from(uniqueJourneyRisks.values()).reduce((sum, risk) => sum + risk, 0);
  }, [alerts]);
  
  // Tasa de INCIDENCIA: journeys únicos con alertas / total journeys
  const incidenceRate = useMemo(() => {
    if (!metrics?.totalJourneys) return 0;
    const uniqueJourneysWithAlert = new Set(
      alerts.map(a => a.journeyId)
    ).size;
    return Math.round((uniqueJourneysWithAlert / metrics.totalJourneys) * 100);
  }, [alerts, metrics]);
  
  // EFECTIVIDAD OPERATIVA: alertas gestionadas / total alertas
  const operationalEffectiveness = useMemo(() => {
    if (alerts.length === 0) return 0;
    return Math.round((managedCount / alerts.length) * 100);
  }, [managedCount, alerts.length]);

  const trendValue = metrics?.trend?.value ?? 0;
  const trendDirection = metrics?.trend?.direction ?? 'stable';
  const trendPositive = trendDirection === 'up';
  
  // ========================================
  // HELPERS
  // ========================================

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50"
    >
      {/* Glow de fondo atmosférico - Cyan dominante, purple sutil */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-8 py-8 md:px-12 md:py-12">
        
        {/* Badge Superior - Estilo Portada FocalizaHR */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Monitoreo Activo • {metrics?.totalJourneys || 0} journeys
            </span>
          </div>
          
          {/* Botón Actualizar */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </motion.div>

        {/* Grid Principal: Storytelling 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-start">
          
          {/* ========================================
              COLUMNA IZQUIERDA: MAGNITUD + DISTRIBUCIÓN
              Historia del Riesgo
              ======================================== */}
          <div className="text-center lg:text-left space-y-8">
            {/* EL NÚMERO GIGANTE PROTAGONISTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-purple-400 leading-none tracking-tight mb-4">
                {formatCurrency(totalRisk)}
              </h1>
              
              <p className="text-xl text-slate-400 font-light">
                Riesgo Total Detectado
              </p>
            </motion.div>

            {/* Separador sutil */}
            <div className="h-px bg-slate-700/30 my-8" />

            {/* CARD DISTRIBUCIÓN HORIZONTAL */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="fhr-card p-6"
            >
              {/* GRID 2 COLUMNAS: Gestionado | Por Gestionar */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                
                {/* Columna 1: Gestionado */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Gestionado
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-semibold text-cyan-400 tabular-nums">
                      {formatCurrency(managedRisk)}
                    </span>
                    <span className="text-xs text-slate-500">CLP</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-medium text-cyan-400/70">
                      {totalRisk > 0 ? Math.round((managedRisk / totalRisk) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-600">protegido</span>
                  </div>
                </div>

                {/* Columna 2: Por Gestionar */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${
                      (totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0) >= 70 ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Por Gestionar
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-2xl font-semibold tabular-nums ${
                      (totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0) >= 70 ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {formatCurrency(pendingRisk)}
                    </span>
                    <span className="text-xs text-slate-500">CLP</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-medium ${
                      (totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0) >= 70 ? 'text-red-400/70' : 'text-amber-400/70'
                    }`}>
                      {totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-600">requiere acción</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ========================================
              COLUMNA DERECHA: CONTEXTO OPERATIVO
              Tasas y Urgencias
              ======================================== */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            
            {/* TASA DE INCIDENCIA */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Tasa de Incidencia
                </span>
              </div>
              
              <div className="flex items-baseline justify-center lg:justify-start gap-3 mb-2">
                <span className={`text-4xl font-semibold tabular-nums ${
                  incidenceRate >= 50 ? 'text-red-400' : 
                  incidenceRate >= 30 ? 'text-amber-400' : 
                  'text-green-400'
                }`}>
                  {incidenceRate}%
                </span>
              </div>
              
              <p className="text-sm text-slate-400 mb-1">
                {alerts.length} alertas de {metrics?.totalJourneys || 0} ingresos
              </p>
              
              <p className="text-xs text-slate-600">
                Calidad del proceso
              </p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-700/30" />

            {/* PENDIENTE DE ACCIÓN */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <AlertTriangle className={`h-4 w-4 ${
                  (totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0) >= 70 ? 'text-red-400' : 'text-amber-400'
                }`} />
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                  Pendiente de Acción
                </span>
              </div>
              
              <div className="flex items-baseline justify-center lg:justify-start gap-3 mb-2">
                <span className={`text-4xl font-semibold tabular-nums ${
                  (totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0) >= 70 ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {totalRisk > 0 ? Math.round((pendingRisk / totalRisk) * 100) : 0}%
                </span>
              </div>
              
              <p className="text-sm text-slate-400 mb-3">
                {activeCount} de {alerts.length} alertas urgentes
              </p>
              
              {/* Mini contexto efectividad */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-700/30 rounded-lg">
                <span className="text-xs text-slate-500">
                  Efectividad:
                </span>
                <span className={`text-sm font-semibold ${
                  operationalEffectiveness >= 70 ? 'text-cyan-400' : 
                  operationalEffectiveness >= 50 ? 'text-green-400' : 
                  operationalEffectiveness >= 30 ? 'text-amber-400' : 
                  'text-red-400'
                }`}>
                  {operationalEffectiveness}%
                </span>
                <div className="w-12 h-1 bg-slate-700/50 rounded-full overflow-hidden">
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