// src/components/onboarding/PersonCard.tsx
// COMPONENTE: Card de Persona (Nivel 3)
// ✅ v4.3 FILOSOFÍA FOCALIZAHR: Sobrio, sin saturación, Apple/Tesla

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Clock } from 'lucide-react';
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
  onManagedAlertClick?: (alert: any) => void;
}

export default function PersonCard({
  person,
  index,
  onAcknowledgeAlert,
  onManagedAlertClick
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
  
  // Severidad - MÁS SUTIL, solo dot indica nivel
  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { 
        border: 'bg-red-500/60', 
        label: 'Crítica', 
        dot: 'bg-red-400'
      },
      high: { 
        border: 'bg-orange-500/60', 
        label: 'Alta', 
        dot: 'bg-orange-400'
      },
      medium: { 
        border: 'bg-yellow-500/60', 
        label: 'Media', 
        dot: 'bg-yellow-400'
      },
      low: { 
        border: 'bg-slate-500/60', 
        label: 'Baja', 
        dot: 'bg-slate-400'
      }
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
  
  // Limpiar título de emojis
  const cleanTitle = (title: string) => {
    return title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="space-y-2"
      >
        {/* Header Persona - SOBRIO */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            group relative overflow-hidden
            bg-slate-900/25 hover:bg-slate-900/40
            border border-slate-700/15 hover:border-slate-600/25
            rounded-lg transition-all duration-300 cursor-pointer
            p-2.5 md:p-3
          "
        >
          <div className="flex items-center justify-between gap-2">
            
            {/* Izquierda: Avatar + Info */}
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              {/* Avatar - NEUTRO */}
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800/50 border border-slate-700/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs md:text-sm font-medium text-slate-400">
                  {getInitials(person.journey.fullName)}
                </span>
              </div>
              
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white truncate">
                    {person.journey.fullName}
                  </span>
                  {totalAlerts > 1 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-800/50 border border-slate-700/30 rounded text-[10px] text-slate-400">
                      {totalAlerts} alertas
                    </span>
                  )}
                </div>
                
                {/* Meta info - Solo dot de color */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] md:text-xs text-slate-500">
                  <span className="truncate max-w-[120px] md:max-w-none">{person.journey.department?.displayName || 'Sin departamento'}</span>
                  <span className="text-slate-700">•</span>
                  <span>{getStageLabel(person.journey.currentStage)}</span>
                  <span className="text-slate-700">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${severityConfig.dot}`}></span>
                    {severityConfig.label}
                  </span>
                </div>
                
                {person.activeCount > 0 && person.managedCount > 0 && (
                  <div className="mt-1 text-[9px] md:text-[10px] text-slate-600">
                    {person.activeCount} activa{person.activeCount !== 1 ? 's' : ''} • {person.managedCount} gestionada{person.managedCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            
            {/* Derecha: Riesgo + Toggle */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="text-sm md:text-base font-medium text-white">
                  {formatCurrency(person.risk)}
                </div>
                <div className="text-[8px] md:text-[9px] text-slate-600 uppercase tracking-wide">
                  Riesgo
                </div>
              </div>
              
              <motion.div 
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center
                  transition-all duration-300
                  ${isExpanded 
                    ? 'bg-slate-700/50 text-white border border-slate-600/30' 
                    : 'bg-slate-800/30 text-slate-500 border border-slate-700/20'
                  }
                `}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Lista de Alertas */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5 pl-4 md:pl-8"
            >
              {/* Alertas Activas */}
              {person.activeCount > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-600 font-medium py-1">
                    Activas ({person.activeCount})
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
                            bg-slate-900/20 hover:bg-slate-900/35
                            border border-slate-700/10 hover:border-slate-600/20
                            rounded-lg transition-all duration-200 cursor-pointer
                            p-2 md:p-2.5
                          "
                        >
                          {/* Borde lateral sutil */}
                          <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${config.border} rounded-l-lg`} />
                          
                          <div className="flex items-center justify-between pl-2 gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-0.5">
                                {/* Dot + label en lugar de badge colorido */}
                                <span className="inline-flex items-center gap-1 text-[8px] md:text-[9px] uppercase font-medium text-slate-400">
                                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                                  {config.label}
                                </span>
                                <span className="text-[8px] md:text-[9px] text-slate-600 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(alert.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              {/* Título limpio SIN EMOJIS */}
                              <p className="text-[11px] md:text-xs text-slate-400 font-light truncate">
                                {cleanTitle(businessCase?.title || alert.alertType.replace(/_/g, ' '))}
                              </p>
                            </div>
                            
                            <div className="
                              w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0
                              bg-slate-800/30 text-slate-500 border border-slate-700/20
                              group-hover:bg-slate-700/40 group-hover:text-white
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
              
              {/* Alertas Gestionadas */}
              {person.managedCount > 0 && (
                <div className="space-y-1 pt-2">
                  <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-600 font-medium py-1">
                    Gestionadas ({person.managedCount})
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
                          className="space-y-1"
                        >
                          <div
                            onClick={() => onManagedAlertClick ? onManagedAlertClick(alert) : setExpandedManagedAlert(isExpandedManaged ? null : alert.id)}
                            className="
                              group relative overflow-hidden
                              bg-emerald-500/5 hover:bg-emerald-500/10
                              border border-emerald-500/10 hover:border-emerald-500/15
                              rounded-lg transition-all duration-200 cursor-pointer
                              p-2 md:p-2.5
                            "
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-0.5">
                                  <span className="text-[8px] md:text-[9px] font-medium text-emerald-400/70">
                                    ✓ Gestionada
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[8px] md:text-[9px] text-slate-500">
                                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot} opacity-50`}></span>
                                    {config.label}
                                  </span>
                                </div>
                                <p className="text-[11px] md:text-xs text-slate-500 font-light truncate">
                                  {cleanTitle(businessCase?.title || alert.alertType.replace(/_/g, ' '))}
                                </p>
                              </div>
                              
                              <motion.div 
                                animate={{ rotate: isExpandedManaged ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className={`
                                  w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0
                                  transition-all duration-300
                                  ${isExpandedManaged 
                                    ? 'bg-slate-700/50 text-white border border-slate-600/30' 
                                    : 'bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/15'
                                  }
                                `}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </motion.div>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {isExpandedManaged && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-900/15 border border-slate-700/15 rounded-lg p-2.5 ml-2"
                              >
                                <div className="space-y-1 text-[10px] md:text-xs">
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
      
      {/* Modal */}
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