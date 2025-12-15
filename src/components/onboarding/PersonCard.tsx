// src/components/onboarding/PersonCard.tsx
// COMPONENTE: Card de Persona (Nivel 3)
// Agrupa alertas de una persona con expand/collapse

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';
import { useToast } from '@/components/ui/toast-system';
import ResolutionModal from './ResolutionModal';

interface PersonCardProps {
  person: {
    journeyId: string;
    journey: any;
    alerts: any[];
    risk: number;
    activeCount: number;
    managedCount: number;
  };
  index: number;
  onAcknowledgeAlert: (id: string, notes: string) => Promise<void>;
}

export default function PersonCard({ 
  person, 
  index,
  onAcknowledgeAlert 
}: PersonCardProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<{ alert: any; businessCase: any } | null>(null);
  const [expandedManagedAlert, setExpandedManagedAlert] = useState<string | null>(null);
  
  const { success, error: showError } = useToast();
  
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
  
  // Calcular severidad máxima
  const maxSeverity = person.alerts.reduce((max, alert) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const currentLevel = severityOrder[alert.severity as keyof typeof severityOrder] || 0;
    const maxLevel = severityOrder[max as keyof typeof severityOrder] || 0;
    return currentLevel > maxLevel ? alert.severity : max;
  }, 'low');
  
  const severityConfig = getSeverityConfig(maxSeverity);
  const totalAlerts = person.alerts.length;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="space-y-2"
      >
        {/* Header Persona */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            group relative overflow-hidden
            bg-slate-900/40 hover:bg-slate-900/60
            border border-slate-700/20 hover:border-slate-600/40
            rounded-lg transition-all duration-300 cursor-pointer
            p-3
          "
        >
          <div className="flex items-center justify-between">
            {/* Izquierda: Avatar + Info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-600/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {getInitials(person.journey.fullName)}
                </span>
              </div>
              
              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {person.journey.fullName}
                  </span>
                  {totalAlerts > 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400">
                      <AlertTriangle className="h-3 w-3" />
                      {totalAlerts} alertas
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{person.journey.department?.displayName || 'Sin departamento'}</span>
                  <span>•</span>
                  <span>{getStageLabel(person.journey.currentStage)}</span>
                  <span>•</span>
                  <span className={severityConfig.labelBg.includes('red') ? 'text-red-400' : 
                                   severityConfig.labelBg.includes('orange') ? 'text-orange-400' :
                                   severityConfig.labelBg.includes('yellow') ? 'text-yellow-400' : 'text-blue-400'}>
                    Riesgo {severityConfig.label.toLowerCase()}
                  </span>
                </div>
                
                {person.activeCount > 0 && person.managedCount > 0 && (
                  <div className="mt-1 text-[10px] text-slate-600">
                    {person.activeCount} {person.activeCount === 1 ? 'activa' : 'activas'} • {person.managedCount} {person.managedCount === 1 ? 'gestionada' : 'gestionadas'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Derecha: Riesgo + Toggle */}
            <div className="flex items-center gap-3">
              {/* Riesgo */}
              <div className="text-right">
                <div className="text-base font-semibold text-white">
                  {formatCurrency(person.risk)}
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wide">
                  Riesgo
                </div>
              </div>
              
              {/* Toggle Icon */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isExpanded 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'bg-slate-700/20 text-slate-500 border border-slate-600/20'
                }
              `}>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Lista de Alertas (colapsable) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5 pl-8"
            >
              {/* Sección: Alertas Activas */}
              {person.activeCount > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-2 py-1">
                    Alertas Activas ({person.activeCount})
                  </div>
                  {person.alerts
                    .filter((alert: any) => alert.status === 'pending')
                    .map((alert: any, alertIndex: number) => {
                      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
                      const config = getSeverityConfig(alert.severity);
                      
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: alertIndex * 0.02 }}
                          onClick={() => setSelectedAlert({ alert, businessCase })}
                          className="
                            group relative overflow-hidden
                            bg-slate-900/20 hover:bg-slate-900/40
                            border border-transparent hover:border-slate-700/30
                            rounded-lg transition-all duration-200 cursor-pointer
                            p-2.5
                          "
                        >
                          {/* Borde lateral severidad */}
                          <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${config.border} rounded-l-lg`} />
                          
                          <div className="flex items-center justify-between pl-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border ${config.labelBg}`}>
                                  {config.label}
                                </span>
                                <span className="text-[9px] text-slate-600 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(alert.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-light truncate">
                                {businessCase?.title || alert.alertType.replace(/_/g, ' ')}
                              </p>
                            </div>
                            
                            <div className="
                              w-7 h-7 rounded-full flex items-center justify-center
                              bg-slate-800/30 text-slate-500 border border-slate-700/30
                              group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:border-cyan-500/30
                              transition-all duration-300
                            ">
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
              
              {/* Sección: Alertas Gestionadas */}
              {person.managedCount > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-2 py-1">
                    Alertas Gestionadas ({person.managedCount})
                  </div>
                  {person.alerts
                    .filter((alert: any) => alert.status !== 'pending')
                    .map((alert: any, alertIndex: number) => {
                      const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(alert as any, alert.journey);
                      const config = getSeverityConfig(alert.severity);
                      const isExpandedManaged = expandedManagedAlert === alert.id;
                      
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: alertIndex * 0.02 }}
                          className="space-y-2"
                        >
                          <div
                            onClick={() => setExpandedManagedAlert(isExpandedManaged ? null : alert.id)}
                            className="
                              group relative overflow-hidden
                              bg-green-500/5 hover:bg-green-500/10
                              border border-green-500/10 hover:border-green-500/20
                              rounded-lg transition-all duration-200 cursor-pointer
                              p-2.5
                            "
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="px-1.5 py-0.5 text-[9px] font-medium uppercase bg-green-500/10 border border-green-500/30 text-green-400 rounded">
                                    ✓ Gestionada
                                  </span>
                                  <span className={`text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border ${config.labelBg}`}>
                                    {config.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-light truncate">
                                  {businessCase?.title || alert.alertType.replace(/_/g, ' ')}
                                </p>
                              </div>
                              
                              <div className={`
                                w-7 h-7 rounded-full flex items-center justify-center
                                transition-all duration-300
                                ${isExpandedManaged 
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                  : 'bg-green-500/10 text-green-400 border border-green-500/30'
                                }
                              `}>
                                {isExpandedManaged ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Detalle expandido */}
                          <AnimatePresence>
                            {isExpandedManaged && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-900/20 border border-slate-700/20 rounded-lg p-3 ml-2"
                              >
                                <div className="space-y-2 text-xs">
                                  {alert.resolvedAt && (
                                    <div>
                                      <span className="text-slate-600">Resuelta:</span>{' '}
                                      <span className="text-slate-400">
                                        {new Date(alert.resolvedAt).toLocaleDateString('es-CL')}
                                      </span>
                                    </div>
                                  )}
                                  {alert.resolutionNotes && (
                                    <div>
                                      <span className="text-slate-600">Notas:</span>{' '}
                                      <span className="text-slate-400">{alert.resolutionNotes}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Modal Resolución */}
      {selectedAlert && (
        <ResolutionModal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={async (notes: string) => {
            try {
              await onAcknowledgeAlert(selectedAlert.alert.id, notes);
              success('Alerta gestionada exitosamente');
              setSelectedAlert(null);
            } catch (err) {
              showError('Error al gestionar alerta');
            }
          }}
          alertType={selectedAlert.alert.alertType}
          employeeName={selectedAlert.alert.journey?.fullName || 'Colaborador'}
          businessCase={selectedAlert.businessCase}
        />
      )}
    </>
  );
}