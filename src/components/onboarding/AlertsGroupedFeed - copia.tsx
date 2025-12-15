// src/components/onboarding/AlertsGroupedFeed.tsx
// COMPONENTE SEPARADO: Feed de Alertas Agrupado por Gerencia
// Responsabilidad: Renderizar lista de alertas organizadas jerárquicamente

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronUp,
  ChevronDown,
  Building2
} from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';
import ResolutionModal from './ResolutionModal';
import AlertsTabsToggle from './AlertsTabsToggle';

interface AlertsGroupedFeedProps {
  alerts: any[];
  activeTab: 'active' | 'managed' | 'all';
  onTabChange: (tab: 'active' | 'managed' | 'all') => void;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
  loading: boolean;
}

export default function AlertsGroupedFeed({
  alerts,
  activeTab,
  onTabChange,
  onAcknowledgeAlert,
  loading
}: AlertsGroupedFeedProps) {
  
  const { success, error: showError } = useToast();
  const [expandedGerencias, setExpandedGerencias] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<{ alert: any; businessCase: any } | null>(null);
  const [expandedManagedAlert, setExpandedManagedAlert] = useState<string | null>(null);
  
  // ========================================
  // CÁLCULOS
  // ========================================
  
  const activeCount = alerts.filter(a => a.status === 'pending').length;
  const managedCount = alerts.filter(a => a.status !== 'pending').length;
  
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
  // AGRUPACIÓN POR GERENCIA
  // ========================================
  
  // Paso 1: Construir mapa de departamentos Y gerencias
  // ✅ FIX: Incluir gerencias parent para resolver "Gerencia Sin Nombre"
  const deptMap = useMemo(() => {
    const map = new Map<string, any>();
    alerts.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return;
      
      // Agregar el departamento al map
      map.set(dept.id, dept);
      
      // ✅ CRÍTICO: También agregar la gerencia padre si existe
      if (dept.parent) {
        map.set(dept.parent.id, dept.parent);
      }
    });
    return map;
  }, [alerts]);
  
  // Paso 2: Agrupar alertas por gerencia
  const alertsByGerencia = useMemo(() => {
    const grouped = new Map<string, { 
      gerenciaId: string;
      gerenciaName: string;
      alerts: typeof alerts;
      totalRisk: number;
      pendingRisk: number;
      managedRisk: number;
      activeCount: number;
      managedCount: number;
    }>();
    
    filteredAlerts.forEach(alert => {
      const dept = alert.journey?.department;
      if (!dept) return; // Skip si no tiene departamento
      
      // Si parentId es null, ES gerencia. Si no, buscar el padre.
      const gerenciaId = dept.parentId || dept.id;
      const gerenciaName = dept.parentId 
        ? (deptMap.get(dept.parentId)?.displayName || 'Gerencia Sin Nombre')
        : dept.displayName;
      
      // Inicializar grupo si no existe
      if (!grouped.has(gerenciaId)) {
        grouped.set(gerenciaId, { 
          gerenciaId,
          gerenciaName,
          alerts: [],
          totalRisk: 0,
          pendingRisk: 0,
          managedRisk: 0,
          activeCount: 0,
          managedCount: 0
        });
      }
      
      const group = grouped.get(gerenciaId)!;
      group.alerts.push(alert);
      
      // Contador de alertas (sí cuenta todas)
      if (alert.status === 'pending') {
        group.activeCount += 1;
      } else {
        group.managedCount += 1;
      }
    });
    
    // ========================================
    // ✅ FIX CRÍTICO: Calcular riesgo por PERSONA ÚNICA
    // ========================================
    // REGLA: 1 PERSONA = 1 RIESGO (sin importar cuántas alertas tenga)
    // Ejemplo: VICTOR Y con 4 alertas = $5.4M (NO $21.6M)
    // ========================================
    grouped.forEach(group => {
      // Mapa de riesgos únicos por journeyId
      const uniqueJourneyRisks = new Map<string, { total: number; pending: number; managed: number }>();
      
      group.alerts.forEach(alert => {
        const journeyId = alert.journeyId || alert.journey?.id;
        if (!journeyId) return;
        
        // Solo calcular riesgo si NO existe (primera alerta de esta persona)
        if (!uniqueJourneyRisks.has(journeyId)) {
          const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
          const risk = businessCase?.financials?.potentialAnnualLoss || 0;
          
          uniqueJourneyRisks.set(journeyId, {
            total: risk,
            pending: alert.status === 'pending' ? risk : 0,
            managed: alert.status !== 'pending' ? risk : 0
          });
        }
      });
      
      // Sumar riesgos únicos (1 por persona)
      group.totalRisk = Array.from(uniqueJourneyRisks.values())
        .reduce((sum, r) => sum + r.total, 0);
      group.pendingRisk = Array.from(uniqueJourneyRisks.values())
        .reduce((sum, r) => sum + r.pending, 0);
      group.managedRisk = Array.from(uniqueJourneyRisks.values())
        .reduce((sum, r) => sum + r.managed, 0);
    });
    
    // Convertir a array y ordenar por riesgo pendiente (mayor primero)
    return Array.from(grouped.values())
      .sort((a, b) => b.pendingRisk - a.pendingRisk);
  }, [filteredAlerts, deptMap]);
  
  // Toggle expansión de gerencia
  const toggleGerencia = (gerenciaId: string) => {
    setExpandedGerencias(prev => {
      const next = new Set(prev);
      if (next.has(gerenciaId)) {
        next.delete(gerenciaId);
      } else {
        next.add(gerenciaId);
      }
      return next;
    });
  };

  // ========================================
  // RENDER
  // ========================================
  
  return (
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
          onTabChange={onTabChange}
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
          /* Feed Agrupado por Gerencia */
          <div className="space-y-6">
            {alertsByGerencia.map((gerenciaGroup, groupIndex) => {
              const isExpanded = expandedGerencias.has(gerenciaGroup.gerenciaId);
              const pendingPercentage = gerenciaGroup.totalRisk > 0 
                ? Math.round((gerenciaGroup.pendingRisk / gerenciaGroup.totalRisk) * 100) 
                : 0;

              return (
                <motion.div
                  key={gerenciaGroup.gerenciaId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="space-y-2"
                >
                  {/* Header Gerencia */}
                  <div
                    onClick={() => toggleGerencia(gerenciaGroup.gerenciaId)}
                    className="
                      group relative overflow-hidden
                      bg-slate-900/50 hover:bg-slate-900/70
                      border border-slate-700/50 hover:border-slate-600/50
                      rounded-xl transition-all duration-300 cursor-pointer
                      p-5
                    "
                  >
                    <div className="flex items-center justify-between">
                      {/* Izquierda: Nombre + Totales */}
                      <div className="flex items-center gap-4">
                        {/* Icono Gerencia */}
                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-cyan-400" />
                        </div>
                        
                        {/* Nombre y stats */}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                              {gerenciaGroup.gerenciaName}
                            </h4>
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-800/50 border border-slate-700/30 text-slate-400 rounded">
                              {gerenciaGroup.alerts.length} alertas
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-400">
                              Riesgo Total: <span className="font-semibold text-white">{formatCurrency(gerenciaGroup.totalRisk)}</span>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`font-semibold ${
                              pendingPercentage >= 70 ? 'text-red-400' : 
                              pendingPercentage >= 40 ? 'text-amber-400' : 
                              'text-green-400'
                            }`}>
                              {pendingPercentage}% pendiente
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Derecha: Stats + Toggle */}
                      <div className="flex items-center gap-6">
                        {/* Mini stats */}
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                              Activas
                            </div>
                            <div className="text-lg font-semibold text-amber-400">
                              {gerenciaGroup.activeCount}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                              Gestionadas
                            </div>
                            <div className="text-lg font-semibold text-cyan-400">
                              {gerenciaGroup.managedCount}
                            </div>
                          </div>
                        </div>

                        {/* Botón expand/collapse */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="
                            w-10 h-10 rounded-full flex items-center justify-center
                            bg-slate-800/50 text-slate-400 border border-slate-700/50
                            group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:border-cyan-500/30
                            transition-all duration-300
                          "
                        >
                          <ChevronDown className="h-5 w-5" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Alertas de la Gerencia (colapsable) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 pl-4"
                      >
                        {gerenciaGroup.alerts.map((alert, index) => {
                          const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
                          const impacto = businessCase?.financials?.potentialAnnualLoss || 0;
                          const config = getSeverityConfig(alert.severity);
                          const isManaged = alert.status !== 'pending';
                          const isExpandedManaged = expandedManagedAlert === alert.id;

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
                                  setExpandedManagedAlert(isExpandedManaged ? null : alert.id);
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
                                      ${isExpandedManaged 
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                        : 'bg-green-500/10 text-green-400 border border-green-500/30'
                                      }
                                    `}>
                                      {isExpandedManaged ? (
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
                              {isManaged && isExpandedManaged && (
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal de Resolución */}
      {selectedAlert && (
        <ResolutionModal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={async (notes: string) => {
            try {
              await onAcknowledgeAlert(selectedAlert.alert.id, notes);
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
}