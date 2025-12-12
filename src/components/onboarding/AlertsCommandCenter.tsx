// src/components/onboarding/AlertsCommandCenter.tsx
// DISEÑO: FocalizaHR Premium - "The Money Wall" v2.0
// Filosofía: Impacto por claridad, no por ruido visual

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  Users, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';
import ResolutionModal from './ResolutionModal';
import AlertsTabsToggle from './AlertsTabsToggle';

export const AlertsCommandCenter: React.FC = () => {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active');
  
  const { alerts, metrics, loading, error, refetch, acknowledgeAlert } = useOnboardingAlerts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<{ alert: any; businessCase: any } | null>(null);
  const [expandedManagedAlert, setExpandedManagedAlert] = useState<string | null>(null);

  // ========================================
  // CÁLCULOS FINANCIEROS
  // ========================================
  
  const activeCount = alerts.filter(a => a.status === 'pending').length;
  const managedCount = alerts.filter(a => a.status !== 'pending').length;
  
  // ========================================
  // NUEVAS MÉTRICAS BIMODALES
  // ========================================
  
  // Riesgo TOTAL (todas las alertas del período, gestionadas o no)
  const totalRisk = useMemo(() => {
    return alerts.reduce((sum, alert) => {
      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
      return sum + (businessCase?.financials?.potentialAnnualLoss || 0);
    }, 0);
  }, [alerts]);
  
  // Riesgo EVITADO (alertas gestionadas)
  const managedRisk = useMemo(() => {
    return alerts.reduce((sum, alert) => {
      if (alert.status === 'pending') return sum;
      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
      return sum + (businessCase?.financials?.potentialAnnualLoss || 0);
    }, 0);
  }, [alerts]);
  
  // Riesgo PENDIENTE (alertas activas)
  const pendingRisk = useMemo(() => {
    return alerts.reduce((sum, alert) => {
      if (alert.status !== 'pending') return sum;
      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
      return sum + (businessCase?.financials?.potentialAnnualLoss || 0);
    }, 0);
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

  // TODO: Conectar con OnboardingEffectivenessInsight para tendencia real
 // ✅ Conectado a backend real
  const trendValue = metrics?.trend?.value ?? 0;
  const trendDirection = metrics?.trend?.direction ?? 'stable';
  const trendPositive = trendDirection === 'up'; // Más alertas = tendencia negativa para el negocio
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // ✅ CORREGIDO: Usa currentStage (campo REAL del modelo JourneyOrchestration)
  const getStageLabel = (stage: number): string => {
    const stages: Record<number, string> = {
      0: 'Pre-inicio',
      1: 'Día 1',
      2: 'Día 7',
      3: 'Día 30',
      4: 'Día 90'
    };
    return stages[stage] || `Etapa ${stage}`;
  };

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { border: 'bg-red-500', label: 'CRÍTICA', labelBg: 'bg-red-500/10 border-red-500/30 text-red-400' },
      high: { border: 'bg-orange-500', label: 'ALTA', labelBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
      medium: { border: 'bg-yellow-500', label: 'MEDIA', labelBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
      low: { border: 'bg-blue-500', label: 'BAJA', labelBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400' }
    };
    return configs[severity as keyof typeof configs] || configs.low;
  };

  // ========================================
  // FILTRADO DE ALERTAS
  // ========================================
  
  const filteredAlerts = useMemo(() => {
    switch(activeTab) {
      case 'active': return alerts.filter(a => a.status === 'pending');
      case 'managed': return alerts.filter(a => a.status !== 'pending');
      default: return alerts;
    }
  }, [alerts, activeTab]);

  // ========================================
  // HANDLERS
  // ========================================
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      success('Alertas actualizadas', 'Actualización');
    } catch (err) {
      showError('Error al actualizar alertas', 'Error');
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
  // RENDER PRINCIPAL
  // ========================================
  
  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      
      {/* ==================================================================
          SECTION A: THE MONEY WALL (Hero Financiero)
          Diseño: Impacto visual premium. El número "grita" el riesgo.
          ================================================================== */}
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
              onClick={handleRefresh}
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

      {/* ==================================================================
          SECTION B: FEED DE ALERTAS (Diseño Linear/Stripe)
          Minimalista, limpio, el borde izquierdo indica severity
          ================================================================== */}
      
      <div className="space-y-6">
        
        {/* Header + Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-2xl font-light text-white">
              Alertas{' '}
              <span className="text-slate-500">
                Prioritarias
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Intervenciones recomendadas para retener talento clave
            </p>
          </div>
          
          <AlertsTabsToggle 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            counts={{ active: activeCount, managed: managedCount, all: alerts.length }}
            isTransitioning={loading}
          />
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-2">
          
          {/* Empty State */}
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20"
            >
              <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4">
                <ShieldCheck className="h-10 w-10 text-slate-600" />
              </div>
              <p className="text-lg text-slate-400 font-light">
                {activeTab === 'active' && 'Ecosistema saludable'}
                {activeTab === 'managed' && 'Sin alertas gestionadas aún'}
                {activeTab === 'all' && 'No hay alertas en el sistema'}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {activeTab === 'active' 
                  ? 'No hay riesgos de fuga detectados en este momento'
                  : 'Las alertas gestionadas aparecerán aquí'
                }
              </p>
            </motion.div>
          ) : (
            /* Feed de Alertas */
            <>
              {filteredAlerts.map((alert, index) => {
                const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
                const impacto = businessCase?.financials?.potentialAnnualLoss || 0;
                const config = getSeverityConfig(alert.severity);
                const isManaged = alert.status !== 'pending';
                const isExpanded = expandedManagedAlert === alert.id;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      if (alert.status === 'pending') {
                        setSelectedAlert({ alert, businessCase });
                      } else {
                        setExpandedManagedAlert(isExpanded ? null : alert.id);
                      }
                    }}
                    className={`
                      group relative overflow-hidden
                      bg-slate-900/30 hover:bg-slate-900/60
                      border border-transparent hover:border-slate-700/50
                      rounded-xl transition-all duration-300 cursor-pointer
                    `}
                  >
                    {/* Borde lateral - ÚNICO indicador de severity */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.border} rounded-l-xl`} />

                    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_2fr_auto_auto] gap-4 md:gap-6 items-center p-4 pl-5">
                      
                      {/* 1. Avatar NEUTRO */}
                      <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-300">
                          {getInitials(alert.journey.fullName)}
                        </span>
                      </div>

                      {/* 2. Info Principal */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-base font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                            {alert.journey.fullName}
                          </span>
                          {isManaged && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium uppercase bg-green-500/10 border border-green-500/30 text-green-400 rounded">
                              ✓ Gestionada
                            </span>
                          )}
                        </div>
                        {/* ✅ CORREGIDO: Usa getStageLabel con currentStage */}
                        <p className="text-xs text-slate-500">
                          {alert.journey.department?.displayName || 'Sin departamento'} • {getStageLabel(alert.journey.currentStage)}
                        </p>
                      </div>

                      {/* 3. Narrativa (Desktop) */}
                      <div className="hidden md:block min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border ${config.labelBg}`}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 font-light truncate">
                          {businessCase?.title || alert.alertType.replace(/_/g, ' ')}
                        </p>
                      </div>

                      {/* 4. Impacto Financiero */}
                      <div className="hidden md:block text-right">
                        <div className="text-base font-semibold text-white">
                          {formatCurrency(impacto)}
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wide">
                          Riesgo
                        </div>
                      </div>

                      {/* 5. Botón Acción */}
                      <div className="flex justify-end">
                        {!isManaged ? (
                          <div className="
                            w-10 h-10 rounded-full flex items-center justify-center
                            bg-slate-800/50 text-slate-500 border border-slate-700/50
                            group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:border-cyan-500/30
                            transition-all duration-300
                          ">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            transition-all duration-300
                            ${isExpanded 
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                              : 'bg-green-500/10 text-green-400 border border-green-500/30'
                            }
                          `}>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Mobile (visible solo en móvil) */}
                    <div className="md:hidden px-4 pb-4 pl-5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border ${config.labelBg}`}>
                          {config.label} • {businessCase?.title || alert.alertType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(impacto)}
                        </span>
                      </div>
                    </div>

                    {/* Panel expandido para alertas gestionadas */}
                    {isManaged && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-700/30 bg-slate-800/20 px-5 py-4 ml-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Fecha de gestión */}
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                              Fecha Gestión
                            </p>
                            <p className="text-sm text-white">
                              {alert.acknowledgedAt 
                                ? new Date(alert.acknowledgedAt).toLocaleDateString('es-CL', { 
                                    day: '2-digit', 
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'No registrada'
                              }
                            </p>
                          </div>

                          {/* Estado */}
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                              Estado
                            </p>
                            <p className="text-sm text-green-400">
                              {alert.status === 'resolved' ? 'Resuelta' : 'Gestionada'}
                            </p>
                          </div>

                          {/* Impacto evitado */}
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                              Impacto Evitado
                            </p>
                            <p className="text-sm text-cyan-400 font-semibold">
                              {formatCurrency(impacto)}
                            </p>
                          </div>
                        </div>

                        {/* Notas de resolución */}
                        {alert.resolutionNotes && (
                          <div className="mt-4 pt-4 border-t border-slate-700/30">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                              Plan de Acción Registrado
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              "{alert.resolutionNotes}"
                            </p>
                          </div>
                        )}

                        {!alert.resolutionNotes && (
                          <div className="mt-4 pt-4 border-t border-slate-700/30">
                            <p className="text-xs text-slate-500 italic">
                              No se registraron notas para esta gestión
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ==================================================================
          MODAL DE RESOLUCIÓN
          ================================================================== */}
      {selectedAlert && (
        <ResolutionModal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={async (notes: string) => {
            try {
              await acknowledgeAlert(selectedAlert.alert.id, notes);
              success(`Alerta de "${selectedAlert.alert.journey.fullName}" resuelta`, '¡Registrado!');
              setSelectedAlert(null);
            } catch (err) {
              showError('Error al resolver alerta', 'Error');
            }
          }}
          alertType={selectedAlert.alert.alertType}
          employeeName={selectedAlert.alert.journey.fullName}
          businessCase={selectedAlert.businessCase}
        />
      )}
    </div>
  );
};