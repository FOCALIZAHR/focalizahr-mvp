// src/components/onboarding/AlertsCommandCenter.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Loader2, DollarSign } from 'lucide-react';
import { useOnboardingAlerts } from '@/hooks/useOnboardingAlerts';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { InsightAccionable } from '@/components/insights/InsightAccionable';
import { ResolutionModal } from './ResolutionModal';
import { AlertMetricsPanel } from './AlertMetricsPanel';
import { TopAlertsPanel } from './TopAlertsPanel';
import { AlertFilters } from './AlertFilters';
import { CyanButton } from '@/components/ui/MinimalistButton';

export const AlertsCommandCenter: React.FC = () => {
  // ========================================
  // STATE - Filtros
  // ========================================
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [slaStatus, setSlaStatus] = useState('');
  
  // ========================================
  // HOOK - Fetch alertas con filtros
  // ========================================
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
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  
  // ========================================
  // HANDLERS
  // ========================================
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Error al marcar alerta como accionada');
    }
  };

  const handleResolve = async (alertId: string, notes: string) => {
    try {
      const response = await fetch(`/api/onboarding/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve',
          notes 
        })
      });
      
      if (!response.ok) throw new Error('Error al resolver alerta');
      
      await refetch();
      setShowResolutionModal(false);
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Error al resolver alerta');
    }
  };
  
  // ========================================
  // RENDER STATES
  // ========================================
  
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando alertas...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fhr-card border-red-500/30">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-semibold">Error cargando alertas</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <CyanButton onClick={handleRefresh}>
          Reintentar
        </CyanButton>
      </div>
    );
  }
  
  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  
  return (
    <div>
      {/* HEADER - Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="fhr-title-gradient text-3xl font-bold mb-2">
            🎯 Radar Predictivo de Retención
          </h1>
          <p className="text-slate-400">
            Casos de Negocio Inteligentes • Intervención Temprana • ROI Cuantificado
          </p>
        </div>
        
        <CyanButton
          icon={RefreshCw}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </CyanButton>
      </div>
      
      {/* MÉTRICAS INTELIGENCIA */}
      {metrics && <AlertMetricsPanel metrics={metrics} />}
      
      {/* TOP ALERTAS MÁS FRECUENTES */}
      {metrics && metrics.topAlertTypes && (
        <TopAlertsPanel topAlertTypes={metrics.topAlertTypes} />
      )}
      
      {/* FILTROS */}
      <AlertFilters
        severity={severity}
        status={status}
        slaStatus={slaStatus}
        onSeverityChange={setSeverity}
        onStatusChange={setStatus}
        onSlaStatusChange={setSlaStatus}
      />
      
      {/* LISTA DE ALERTAS → CASOS DE NEGOCIO */}
      <div className="space-y-6">
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fhr-card text-center py-12"
          >
            <AlertTriangle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              No hay alertas activas
            </h3>
            <p className="text-sm text-slate-500">
              {severity || status || slaStatus 
                ? 'Intenta cambiar los filtros para ver más alertas'
                : '¡Excelente! Todos los colaboradores en proceso saludable'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                Mostrando <span className="font-semibold text-cyan-400">{alerts.length}</span> caso(s) de negocio
              </p>
            </div>
            
            {/* TRANSFORMACIÓN: Alerta → BusinessCase → InsightAccionable */}
            {alerts.map((alert) => {
              // ✅ CORRECCIÓN 1: Cast seguro para type compatibility
              // JourneyAlert de Prisma incluye campos opcionales que OnboardingAlertEngine necesita
              const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
                alert as any, // Cast necesario: alert incluye questionId?, responseValue?, threshold?, metadata?
                 alert.journey 
              );
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* ✅ CORRECCIÓN 2: onActionClick (NO onDismiss) */}
                  <InsightAccionable
                    businessCase={businessCase}
                    companyName="FocalizaHR"
                    onActionClick={(action) => {
                      // Manejar acciones del componente InsightAccionable
                      // Acciones posibles: 'schedule_meeting', 'generate_report'
                      console.log(`[AlertsCommandCenter] Acción ejecutada: ${action} para alerta ${alert.id}`);
                      
                      // Si la alerta está pendiente, marcarla como accionada cuando el usuario hace algo
                      if (alert.status === 'pending') {
                        handleAcknowledge(alert.id);
                      }
                    }}
                  />
                  
                  {/* METADATA ADICIONAL (SLA, Estado) */}
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      SLA: {alert.slaStatus === 'on_time' ? '🟢 A Tiempo' : 
                            alert.slaStatus === 'at_risk' ? '🟡 En Riesgo' : 
                            '🔴 Violado'}
                    </span>
                    <span>•</span>
                    <span>
                      Estado: {alert.status === 'pending' ? '⏳ Pendiente' :
                               alert.status === 'acknowledged' ? '✓ Accionada' :
                               '✅ Resuelta'}
                    </span>
                    <span>•</span>
                    <span>
                      Creada: {new Date(alert.createdAt).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};