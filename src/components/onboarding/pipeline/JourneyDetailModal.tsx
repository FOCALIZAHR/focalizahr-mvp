// src/components/onboarding/pipeline/JourneyDetailModal.tsx
// ============================================================================
// JOURNEY DETAIL MODAL - Detalle Completo del Journey
// ============================================================================
//
// Modal que muestra información completa de un journey:
// - Datos personales (nombre, email, teléfono, posición)
// - EXO Score Gauge (reutiliza componente existente)
// - Timeline de Onboarding (reutiliza componente existente)
// - Scores 4C individuales
// - Alertas activas
//
// REUTILIZA COMPONENTES EXISTENTES (GUÍA):
// ✅ EXOScoreGauge - Para visualización del score
// ✅ OnboardingTimeline - Para visualización del progreso
// ✅ MinimalistButton - Para acciones
//
// ============================================================================

'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Mail, 
  Phone, 
  Briefcase,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  Clock
} from 'lucide-react';

// 🔄 REUTILIZAR COMPONENTES EXISTENTES (según GUÍA)
import { CyanButton, NeutralButton } from '@/components/ui/MinimalistButton';
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline';

import type { Journey } from '@/hooks/useOnboardingJourneys';
import { 
  getDaysSinceHire, 
  getRiskLabel, 
  formatDate 
} from '@/hooks/useOnboardingJourneys';

// ============================================================================
// TYPES
// ============================================================================

interface JourneyDetailModalProps {
  journey: Journey | null;
  onClose: () => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ScoreCardProps {
  label: string;
  score: number | null;
  color: string;
}

const ScoreCard = memo(function ScoreCard({ label, score, color }: ScoreCardProps) {
  if (score === null) return null;
  
  const colorClasses = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400'
  };
  
  return (
    <div className="text-center p-4 bg-slate-900/30 rounded-lg border border-slate-800/50">
      <div className={`text-3xl font-bold mb-1 ${colorClasses[color as keyof typeof colorClasses] || 'text-white'}`}>
        {Math.round(score)}
      </div>
      <div className="text-slate-400 text-xs uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
});

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}

const InfoRow = memo(function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value) return null;
  
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      <div>
        <span className="text-slate-500 text-xs block">{label}</span>
        <span className="text-sm">{value}</span>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const JourneyDetailModal = memo(function JourneyDetailModal({ 
  journey, 
  onClose 
}: JourneyDetailModalProps) {
  
  // No renderizar si no hay journey
  if (!journey) return null;
  
  // Calcular datos derivados
  const daysSinceHire = getDaysSinceHire(journey.hireDate);
  const riskLabel = getRiskLabel(journey.retentionRisk);
  
  // Handler para cerrar con Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);
  
  // Determinar color del badge de riesgo
  const getRiskBadgeClasses = (risk: string | null) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };
  
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* ================================================================
              HEADER
              ================================================================ */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {journey.fullName.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h2 className="text-2xl font-light text-white mb-1">
                  {journey.fullName}
                </h2>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400">
                    {journey.department?.displayName || 'Sin departamento'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getRiskBadgeClasses(journey.retentionRisk)}`}>
                    {riskLabel}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* ================================================================
              CONTENT - Scrollable
              ================================================================ */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Grid: Info Personal + EXO Score */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Información Personal */}
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6 space-y-4">
                <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Información Personal
                </h3>
                
                <div className="space-y-4">
                  <InfoRow 
                    icon={Mail} 
                    label="Email" 
                    value={journey.participantEmail} 
                  />
                  <InfoRow 
                    icon={Phone} 
                    label="Teléfono" 
                    value={journey.phoneNumber} 
                  />
                  <InfoRow 
                    icon={Briefcase} 
                    label="Cargo" 
                    value={journey.position} 
                  />
                  <InfoRow 
                    icon={Building2} 
                    label="Departamento" 
                    value={journey.department?.displayName} 
                  />
                  <InfoRow 
                    icon={Calendar} 
                    label="Fecha de Ingreso" 
                    value={formatDate(journey.hireDate)} 
                  />
                  <InfoRow 
                    icon={Clock} 
                    label="Días en la empresa" 
                    value={`${daysSinceHire} días`} 
                  />
                </div>
              </div>
              
              {/* EXO Score Gauge */}
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
                <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Predicción de Retención
                </h3>
                
                {journey.exoScore !== null ? (
                  <EXOScoreGauge 
                    score={journey.exoScore}
                    label="EXO Score"
                    size="md"
                    standardCategory={journey.department?.standardCategory || undefined}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-600 text-4xl mb-2">📊</div>
                    <p className="text-slate-400 text-sm">
                      EXO Score se calculará cuando complete más etapas
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Timeline de Onboarding */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
              <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Timeline de Onboarding
              </h3>
              
              <OnboardingTimeline 
                currentStage={journey.currentStage}
                stage1CompletedAt={journey.stage1CompletedAt}
                stage2CompletedAt={journey.stage2CompletedAt}
                stage3CompletedAt={journey.stage3CompletedAt}
                stage4CompletedAt={journey.stage4CompletedAt}
              />
            </div>
            
            {/* Scores 4C */}
            {(journey.complianceScore !== null || 
              journey.clarificationScore !== null || 
              journey.cultureScore !== null || 
              journey.connectionScore !== null) && (
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
                <h3 className="text-white font-light text-lg mb-4">
                  Scores por Dimensión (4C Bauer)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreCard 
                    label="Compliance"
                    score={journey.complianceScore}
                    color="cyan"
                  />
                  <ScoreCard 
                    label="Clarification"
                    score={journey.clarificationScore}
                    color="blue"
                  />
                  <ScoreCard 
                    label="Culture"
                    score={journey.cultureScore}
                    color="purple"
                  />
                  <ScoreCard 
                    label="Connection"
                    score={journey.connectionScore}
                    color="green"
                  />
                </div>
              </div>
            )}
            
            {/* Alertas Activas */}
            {journey.alerts && journey.alerts.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
                <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Alertas Activas ({journey.alerts.length})
                </h3>
                
                <div className="space-y-3">
                  {journey.alerts.map(alert => (
                    <div 
                      key={alert.id}
                      className={`
                        p-4 rounded-lg border
                        ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                          alert.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                          'bg-yellow-500/10 border-yellow-500/30'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`
                            font-medium text-sm mb-1
                            ${alert.severity === 'critical' ? 'text-red-400' :
                              alert.severity === 'high' ? 'text-orange-400' :
                              'text-yellow-400'}
                          `}>
                            {alert.alertType.replace(/_/g, ' ')}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {alert.description}
                          </div>
                        </div>
                        <span className={`
                          text-xs px-2 py-0.5 rounded
                          ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'}
                        `}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* ================================================================
              FOOTER - Actions
              ================================================================ */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-4 flex justify-end gap-3">
            <NeutralButton onClick={onClose}>
              Cerrar
            </NeutralButton>
            <CyanButton onClick={() => {
              // TODO: Navegar a página de detalle completo
              console.log('Ver detalle completo:', journey.id);
            }}>
              Ver Detalle Completo
            </CyanButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default JourneyDetailModal;