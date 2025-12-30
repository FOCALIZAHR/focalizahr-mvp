// src/components/onboarding/OnboardingResolvedAlertModal.tsx
// ============================================================================
// MODAL: Detalle de Alerta Gestionada - Onboarding Journey Intelligence
// ============================================================================
// FILOSOFÍA: Mostrar información de gestión de alertas de forma clara
// DISEÑO: Glassmorphism, línea Tesla, mobile-first
// ============================================================================

'use client';

import { memo, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText,
  Clock,
  ExternalLink,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// INTERFACES
// ============================================================================

interface OnboardingResolvedAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: {
    id: string;
    alertType: string;
    severity: string;
    status: string;
    resolutionNotes?: string | null;
    acknowledgedAt?: Date | string | null;
    acknowledgedBy?: string | null;
    createdAt?: Date | string | null;
    journey?: {
      id: string;
      participant?: {
        name?: string | null;
        email?: string | null;
      };
      currentStage?: string;
      department?: {
        displayName?: string;
      };
    };
  } | null;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'No disponible';
  const d = new Date(date);
  return d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getAlertTypeLabel = (alertType: string): string => {
  const labels: Record<string, string> = {
    first_week_critical: 'Riesgo Primera Semana',
    month_one_dropout: 'Riesgo Abandono Mes 1',
    integration_failure: 'Falla de Integración',
    manager_disconnect: 'Desconexión con Líder',
    cultural_misfit: 'Desajuste Cultural',
    training_gap: 'Brecha de Capacitación',
    social_isolation: 'Aislamiento Social',
    expectation_mismatch: 'Desajuste de Expectativas'
  };
  return labels[alertType] || 'Alerta de Onboarding';
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical':
      return { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    case 'high':
      return { label: 'Alto', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'medium':
      return { label: 'Medio', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    default:
      return { label: 'Bajo', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  }
};

const getStageLabel = (stage: string | undefined): string => {
  if (!stage) return 'Sin etapa';
  const stages: Record<string, string> = {
    stage_1: 'Etapa 1 - Primera Semana',
    stage_2: 'Etapa 2 - Primer Mes',
    stage_3: 'Etapa 3 - Tres Meses',
    stage_4: 'Etapa 4 - Seis Meses'
  };
  return stages[stage] || stage;
};

// ============================================================================
// COMPONENT
// ============================================================================

const OnboardingResolvedAlertModal = memo(function OnboardingResolvedAlertModal({
  isOpen,
  onClose,
  alert
}: OnboardingResolvedAlertModalProps) {
  
  const router = useRouter();
  
  const severityConfig = useMemo(() => 
    alert ? getSeverityConfig(alert.severity) : getSeverityConfig('low'),
    [alert?.severity]
  );
  
  // ════════════════════════════════════════════════════════════════════════
  // BLOQUEAR SCROLL DEL BODY CUANDO MODAL ESTÁ ABIERTO
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // ════════════════════════════════════════════════════════════════════════
  // CERRAR CON ESCAPE
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  const handleViewJourney = () => {
    if (alert?.journey?.id) {
      router.push(`/dashboard/onboarding/journeys/${alert.journey.id}`);
      onClose();
    }
  };

  // No renderizar si no está abierto o no hay alert
  if (!isOpen || !alert) return null;
  
  const participantName = alert.journey?.participant?.name || 'Colaborador';
  const departmentName = alert.journey?.department?.displayName || 'Sin departamento';
  
  // ════════════════════════════════════════════════════════════════════════
  // USAR PORTAL PARA RENDERIZAR FUERA DEL ÁRBOL DOM
  // ════════════════════════════════════════════════════════════════════════
  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* MODAL CONTAINER */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-md my-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="
            relative overflow-hidden
            bg-slate-800 
            border border-slate-700/50 
            rounded-2xl 
            shadow-2xl shadow-black/50
          ">
            
            {/* LÍNEA TESLA - Top accent (cyan para onboarding) */}
            <div className="fhr-top-line" />
            
            {/* HEADER */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-700/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Alerta Gestionada
                    </h2>
                    <p className="text-sm text-slate-400">
                      {participantName}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 -m-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            
            {/* CONTENT */}
            <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">
              
              {/* Info del colaborador */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
                <Users className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{participantName}</p>
                  <p className="text-xs text-slate-500">{departmentName}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${severityConfig.bg} ${severityConfig.color} ${severityConfig.border} border`}>
                  {severityConfig.label}
                </div>
              </div>
              
              {/* Tipo de alerta */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipo de Alerta
                </p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                  <p className="text-sm sm:text-base text-slate-200">
                    {getAlertTypeLabel(alert.alertType)}
                  </p>
                </div>
              </div>
              
              {/* Etapa del journey */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                  Etapa del Journey
                </p>
                <p className="text-sm text-slate-300">
                  {getStageLabel(alert.journey?.currentStage)}
                </p>
              </div>
              
              {/* Notas de gestión */}
              {alert.resolutionNotes && (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Acción Registrada
                    </p>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {alert.resolutionNotes}
                  </p>
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {alert.acknowledgedAt && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="text-slate-500 text-xs">Gestionada</p>
                      <p className="text-slate-300">{formatDate(alert.acknowledgedAt)}</p>
                    </div>
                  </div>
                )}
                
                {alert.acknowledgedBy && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="text-slate-500 text-xs">Por</p>
                      <p className="text-slate-300">Usuario #{alert.acknowledgedBy.slice(-6)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* FOOTER */}
            <div className="px-5 py-4 sm:px-6 border-t border-slate-700/50 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors order-2 sm:order-1"
              >
                Cerrar
              </button>
              
              {alert.journey?.id && (
                <button
                  onClick={handleViewJourney}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <span>Ver Journey Completo</span>
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
});

export default OnboardingResolvedAlertModal;