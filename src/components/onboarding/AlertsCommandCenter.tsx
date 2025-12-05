// src/components/onboarding/AlertsCommandCenter.tsx
// VERSIÓN PREMIUM 3 NIVELES + TABS ENTERPRISE - DEFINITIVA

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Loader2, Clock, Building2, TrendingDown, AlertCircle } from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';
import ResolutionModal from './ResolutionModal';
import AlertsTabsToggle from './AlertsTabsToggle'; // ✅ NUEVO

export const AlertsCommandCenter: React.FC = () => {
  
  // ========================================
  // HOOKS - NO TOCAR, FUNCIONAN
  // ========================================
  const { success, error: showError } = useToast();
  
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [slaStatus, setSlaStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'managed' | 'all'>('active'); // ✅ NUEVO
  
  const {
    alerts,
    metrics,
    loading,
    error,
    refetch,
    acknowledgeAlert
  } = useOnboardingAlerts(
    severity || undefined,
    status || undefined,
    slaStatus || undefined
  );
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<{
    alert: any;
    businessCase: any;
  } | null>(null);
  
  // ========================================
  // HANDLERS - NO TOCAR, FUNCIONAN
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
  
  const handleAcknowledge = async (id: string, employeeName: string, notes?: string) => {
    try {
      await acknowledgeAlert(id, notes);
      success(`Alerta de "${employeeName}" marcada como accionada`, '¡Registrado!');
    } catch (err) {
      showError('Error al marcar alerta', 'Error');
    }
  };
  
  // ========================================
  // COMPUTED - Calcular datos para diseño 3 niveles
  // ========================================
  
  // NIVEL 1: Total impacto financiero (suma de alerts)
  const totalFinancialImpact = useMemo(() => {
    return alerts.reduce((sum, alert) => {
      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
        alert as any,
        alert.journey
      );
      return sum + (businessCase?.financials?.potentialAnnualLoss || 0);
    }, 0);
  }, [alerts]);
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  
  // NIVEL 2: Top alertas y departamentos (usar metrics del hook)
  const topAlertTypes = metrics?.topAlertTypes || [];
  const topDepartments = metrics?.topDepartments || [];
  
  // ✅ NUEVO: Contadores para tabs
  const activeCounts = useMemo(() => ({
    active: alerts.filter(a => a.status === 'pending').length,
    managed: alerts.filter(a => a.status === 'acknowledged' || a.status === 'resolved').length,
    all: alerts.length
  }), [alerts]);

  // ✅ NUEVO: Filtrar alertas según tab activo
  const filteredAlerts = useMemo(() => {
    switch(activeTab) {
      case 'active': 
        return alerts.filter(a => a.status === 'pending');
      case 'managed': 
        return alerts.filter(a => a.status === 'acknowledged' || a.status === 'resolved');
      case 'all': 
        return alerts;
      default:
        return alerts;
    }
  }, [alerts, activeTab]);
  
  // ========================================
  // HELPER - Formatear moneda
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
  // HELPER - Obtener iniciales
  // ========================================
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // ========================================
  // HELPER - Config severity
  // ========================================
  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        badge: 'CRÍTICA'
      },
      high: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        badge: 'ALTA'
      },
      medium: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        badge: 'MEDIA'
      },
      low: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badge: 'BAJA'
      }
    };
    return configs[severity as keyof typeof configs] || configs.low;
  };
  
  // ========================================
  // RENDER STATES - Loading
  // ========================================
  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando alertas...</p>
        </div>
      </div>
    );
  }
  
  // ========================================
  // RENDER STATES - Error
  // ========================================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error cargando alertas</h3>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  // ========================================
  // RENDER PRINCIPAL - DISEÑO 3 NIVELES
  // ========================================
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-hidden">
      
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 2, delay: 0.2 }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full blur-3xl"
        />
      </div>

      {/* CONTAINER PRINCIPAL */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* MINI HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-sm text-slate-500 uppercase tracking-wider mb-1">Centro de Comando</h2>
            <p className="text-xs text-slate-600">
              Actualizado: {new Date().toLocaleTimeString('es-CL')}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:border-slate-600/50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* ========================================
            NIVEL 1: EL IMPACTO (Header Financiero)
            ======================================== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 blur-3xl -z-10" />
          
          <div className="text-center space-y-4">
            {/* Badge Urgencia */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-400/30 rounded-full"
            >
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-red-300">
                {criticalCount} Críticas • {highCount} Altas
              </span>
            </motion.div>

            {/* Monto Gigante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold leading-none tracking-tight">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-transparent bg-clip-text">
                  {formatCurrency(totalFinancialImpact)}
                </span>
              </h1>
            </motion.div>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl font-light text-slate-400"
            >
              Capital en Riesgo de Fuga Detectado
            </motion.p>

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-6 pt-4 text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span>Intervención Temprana</span>
              </div>
              <span>•</span>
              <span>ROI Cuantificado</span>
              <span>•</span>
              <span>Tiempo Real</span>
            </motion.div>
          </div>
        </motion.div>

        {/* ========================================
            NIVEL 2: EL CONTEXTO (Táctico)
            ======================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Card 1: Top Alerta */}
          {topAlertTypes.length > 0 && (
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">Alerta Más Frecuente</p>
                  <p className="text-base font-semibold text-white truncate">
                    {topAlertTypes[0]?.type || 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {topAlertTypes[0]?.count || 0} casos
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Departamento */}
          {topDepartments.length > 0 && (
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">Depto Más Afectado</p>
                  <p className="text-base font-semibold text-white truncate">
                    {topDepartments[0]?.name || 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {topDepartments[0]?.count || 0} alertas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Total */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Total Activas</p>
                <p className="text-base font-semibold text-white">
                  {alerts.length}
                </p>
                <p className="text-xs text-slate-400">
                  En seguimiento
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================
            NIVEL 3: LA JOYA (Feed de Alertas)
            ======================================== */}
        <div className="space-y-4">
          
          {/* ✅ NUEVO: TABS TOGGLE ENTERPRISE */}
          <AlertsTabsToggle
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={activeCounts}
            isTransitioning={loading}
          />

          {/* ✅ MODIFICADO: Header dinámico según tab */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-light text-slate-400">
              {activeTab === 'active' && 'Requieren Atención'}
              {activeTab === 'managed' && 'Historial Gestionadas'}
              {activeTab === 'all' && 'Todas las Alertas'}
              <span className="text-slate-600 ml-2">({filteredAlerts.length})</span>
            </h3>
          </div>

          {/* ✅ MODIFICADO: Empty state usa filteredAlerts */}
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center"
            >
              <p className="text-lg text-slate-400">
                {activeTab === 'active' && '✨ No hay alertas pendientes'}
                {activeTab === 'managed' && '📋 No hay alertas gestionadas aún'}
                {activeTab === 'all' && '✨ No hay alertas en el sistema'}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {activeTab === 'active' 
                  ? 'Todas las intervenciones han sido gestionadas' 
                  : 'Comienza gestionando alertas activas'}
              </p>
            </motion.div>
          ) : (
            /* ✅ MODIFICADO: Feed usa filteredAlerts */
            <div className="space-y-3">
              {filteredAlerts.map((alert, index) => {
                const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
                  alert as any,
                  alert.journey
                );
                const config = getSeverityConfig(alert.severity);
                const impacto = businessCase?.financials?.potentialAnnualLoss || 0;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className={`
                      group relative overflow-hidden
                      bg-slate-900/40 backdrop-blur-sm
                      border ${config.border}
                      rounded-xl p-4
                      hover:bg-slate-900/60 hover:border-slate-600/50
                      transition-all duration-300 cursor-pointer
                    `}
                    onClick={() => {
                      if (alert.status === 'pending') {
                        setSelectedAlert({
                          alert: alert,
                          businessCase: businessCase
                        });
                      }
                    }}
                  >
                    {/* Borde lateral severity */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '/50')}`} />

                    <div className="flex items-center gap-4 pl-2">
                      {/* Avatar */}
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-full ${config.bg} border ${config.border}
                        flex items-center justify-center font-semibold ${config.text}
                      `}>
                        {getInitials(alert.journey.fullName)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {config.badge}
                          </span>
                          {alert.status === 'acknowledged' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-400/30">
                              ⏳ GESTIONADA
                            </span>
                          )}
                          {alert.status === 'resolved' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-400/30">
                              ✓ RESUELTA
                            </span>
                          )}
                        </div>

                        {/* Narrativa */}
                        <p className="text-sm text-slate-300 leading-relaxed mb-2">
                          <strong>{alert.journey.fullName}</strong> en {alert.journey.department?.displayName || 'Sin departamento'} muestra señales de{' '}
                          <strong className={config.text}>{businessCase?.title || alert.alertType}</strong>.
                          {impacto > 0 && (
                            <> Impacto estimado: <strong className={config.text}>{formatCurrency(impacto)}</strong>.</>
                          )}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            SLA: {alert.slaHours}h
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(alert.createdAt).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          {/* ✅ NUEVO: Mostrar quién gestionó en vista "managed" */}
                          {activeTab === 'managed' && alert.acknowledgedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Gestionada: {new Date(alert.acknowledgedAt).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* ✅ NUEVO: Mostrar notes si existen (vista managed) */}
                        {activeTab === 'managed' && alert.resolutionNotes && (
                          <div className="mt-2 text-xs text-slate-400 italic border-l-2 border-cyan-500/30 pl-2">
                            "{alert.resolutionNotes.substring(0, 80)}{alert.resolutionNotes.length > 80 ? '...' : ''}"
                          </div>
                        )}
                      </div>

                      {/* Action Button - Solo en vista "active" */}
                      {alert.status === 'pending' && activeTab === 'active' && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert({
                                alert: alert,
                                businessCase: businessCase
                              });
                            }}
                            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors"
                          >
                            Resolver
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          MODAL: RESOLUCIÓN DE ALERTA
          ======================================== */}
      {selectedAlert && (
        <ResolutionModal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={async (notes: string) => {
            try {
              await handleAcknowledge(selectedAlert.alert.id, selectedAlert.alert.journey.fullName, notes);
              setSelectedAlert(null);
            } catch (err) {
              console.error('Error al resolver:', err);
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