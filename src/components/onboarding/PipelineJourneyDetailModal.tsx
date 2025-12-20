'use client';

// src/components/onboarding/PipelineJourneyDetailModal.tsx
// ============================================================================
// MODAL DETALLE JOURNEY - DISEÑO PREMIUM FOCALIZAHR
// Glassmorphism + Animaciones + Componentes reales del proyecto
// ============================================================================
// 
// FIXES APLICADOS v2.0:
// ✅ FIX 1 (Línea 139): Scores con 1 decimal → score.toFixed(1)
// ✅ FIX 2: Alertas clickeables que abren ResolutionModal
// ✅ FIX 3: Botón "Ver Historial" eliminado (redundante)
// ============================================================================

import { memo, useMemo, useState } from 'react';  // ✅ FIX 2: Agregado useState
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  User,
  Building2,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  Shield,
  Lightbulb,
  Users,
  Star,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import type { Journey } from '@/hooks/useOnboardingJourneys';
import { getDaysSinceHire, getRiskLabel, formatDate } from '@/hooks/useOnboardingJourneys';

// Componentes existentes del proyecto
import { CyanButton, NeutralButton } from '@/components/ui/MinimalistButton';
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline';
import type { TimelineStage } from '@/types/onboarding';

// ✅ FIX 2: Nuevos imports para ResolutionModal
import ResolutionModal from '@/components/onboarding/ResolutionModal';
import { OnboardingAlertEngine } from '@/engines/OnboardingAlertEngine';

// ============================================================================
// TIPOS
// ============================================================================

interface PipelineJourneyDetailModalProps {
  journey: Journey | null;
  onClose: () => void;
  onAlertResolved?: (alertId: string, notes: string) => Promise<void>;  // ✅ FIX 2: Callback opcional
}

// ============================================================================
// HELPERS
// ============================================================================

function getScoreColor(score: number | null): {
  text: string;
  bg: string;
  border: string;
  hex: string;
} {
  if (score === null) return { 
    text: 'text-slate-500', 
    bg: 'bg-slate-500/10', 
    border: 'border-slate-500/30',
    hex: '#64748B'
  };
  if (score >= 80) return { 
    text: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30',
    hex: '#10B981'
  };
  if (score >= 60) return { 
    text: 'text-cyan-400', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30',
    hex: '#22D3EE'
  };
  if (score >= 40) return { 
    text: 'text-yellow-400', 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/30',
    hex: '#F59E0B'
  };
  return { 
    text: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30',
    hex: '#EF4444'
  };
}

function getRiskConfig(risk: string | null): {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
} {
  switch (risk) {
    case 'critical':
      return { label: 'Riesgo Crítico', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' };
    case 'high':
      return { label: 'Riesgo Alto', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' };
    case 'medium':
      return { label: 'Riesgo Medio', icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    case 'low':
      return { label: 'Riesgo Bajo', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    default:
      return { label: 'Sin Evaluar', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
}

// ============================================================================
// COMPONENTE: SCORE CARD 4C
// ============================================================================

interface ScoreCardProps {
  label: string;
  score: number | null;
  icon: React.ReactNode;
  description: string;
}

const ScoreCard = memo(function ScoreCard({ label, score, icon, description }: ScoreCardProps) {
  const colors = getScoreColor(score);
  
  return (
    <div className={`
      relative overflow-hidden
      bg-slate-800/30 backdrop-blur-sm
      border ${colors.border}
      rounded-xl p-4
      transition-all duration-300
      hover:bg-slate-800/50
    `}>
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {icon}
        </div>
        <span className={`text-2xl font-light ${colors.text}`}>
          {/* ✅ FIX 1: Mostrar 1 decimal en lugar de Math.round */}
          {score !== null ? score.toFixed(1) : '—'}
        </span>
      </div>
      <h4 className="text-white text-sm font-medium">{label}</h4>
      <p className="text-slate-500 text-xs font-light mt-1">{description}</p>
    </div>
  );
});

// ============================================================================
// COMPONENTE: INFO ROW
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}

const InfoRow = memo(function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-slate-500">{icon}</div>
      <div className="flex-1">
        <span className="text-xs text-slate-500">{label}</span>
        <p className="text-sm text-white font-light">{value || '—'}</p>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE: ALERT ITEM (✅ FIX 2: Ahora clickeable)
// ============================================================================

interface AlertItemProps {
  alert: Journey['alerts'][number];
  onClick?: () => void;  // ✅ FIX 2: Agregado onClick
}

const AlertItem = memo(function AlertItem({ alert, onClick }: AlertItemProps) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-emerald-500/50 bg-emerald-500/10'
  };

  return (
    <div 
      onClick={onClick}
      className={`
        p-3 rounded-lg border
        ${onClick ? 'cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg' : ''}
        ${severityColors[alert.severity] || 'border-slate-700 bg-slate-800/30'}
      `}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-light">{alert.description}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(alert.createdAt).toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PipelineJourneyDetailModal = memo(function PipelineJourneyDetailModal({
  journey,
  onClose,
  onAlertResolved  // ✅ FIX 2: Nuevo prop
}: PipelineJourneyDetailModalProps) {
  
  // ✅ FIX 2: Estado para alerta seleccionada
  const [selectedAlert, setSelectedAlert] = useState<{ 
    alert: Journey['alerts'][number]; 
    businessCase: any 
  } | null>(null);
  
  if (!journey) return null;

  const daysSinceHire = getDaysSinceHire(journey.hireDate);
  const riskConfig = getRiskConfig(journey.retentionRisk);
  const RiskIcon = riskConfig.icon;

  // Construir stages para OnboardingTimeline
  const timelineStages: TimelineStage[] = useMemo(() => [
    { 
      day: 1, 
      label: 'Compliance', 
      score: journey.complianceScore, 
      alerts: journey.alerts?.filter(a => a.alertType?.includes('compliance')).length || 0,
      color: getScoreColor(journey.complianceScore).hex
    },
    { 
      day: 7, 
      label: 'Clarification', 
      score: journey.clarificationScore, 
      alerts: journey.alerts?.filter(a => a.alertType?.includes('clarification')).length || 0,
      color: getScoreColor(journey.clarificationScore).hex
    },
    { 
      day: 30, 
      label: 'Culture', 
      score: journey.cultureScore, 
      alerts: journey.alerts?.filter(a => a.alertType?.includes('culture')).length || 0,
      color: getScoreColor(journey.cultureScore).hex
    },
    { 
      day: 90, 
      label: 'Connection', 
      score: journey.connectionScore, 
      alerts: journey.alerts?.filter(a => a.alertType?.includes('connection')).length || 0,
      color: getScoreColor(journey.connectionScore).hex
    }
  ], [journey]);

  // ✅ FIX 2: Handler para click en alerta
  const handleAlertClick = (alert: Journey['alerts'][number]) => {
    const businessCase = OnboardingAlertEngine.generateBusinessCaseFromAlert(
      alert as any, 
      journey
    );
    setSelectedAlert({ alert, businessCase });
  };

  // ✅ FIX 2: Handler para resolver alerta
  const handleResolveAlert = async (notes: string) => {
    if (!selectedAlert) return;
    
    if (onAlertResolved) {
      await onAlertResolved(selectedAlert.alert.id, notes);
    } else {
      // Fallback: llamar API directamente
      try {
        await fetch(`/api/onboarding/alerts/${selectedAlert.alert.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', notes })
        });
      } catch (error) {
        console.error('Error resolviendo alerta:', error);
      }
    }
    
    setSelectedAlert(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="
            relative w-full max-w-4xl max-h-[90vh]
            bg-slate-900/95 backdrop-blur-xl
            border border-slate-700/50
            rounded-2xl shadow-2xl shadow-black/50
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="
            relative px-6 py-5
            border-b border-slate-800/50
            bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900
          ">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="
                  w-14 h-14 rounded-xl
                  bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                  border border-slate-700/50
                  flex items-center justify-center
                ">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                
                <div>
                  <h2 className="text-xl font-light text-white">
                    {journey.fullName}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-400">
                      {journey.department?.displayName || 'Sin departamento'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-sm text-slate-400">
                      {journey.position || 'Sin cargo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg
                  text-slate-400 hover:text-white
                  bg-slate-800/50 hover:bg-slate-700/50
                  transition-all duration-200
                "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Risk badge */}
            <div className={`
              absolute bottom-0 left-6 translate-y-1/2
              inline-flex items-center gap-2 px-4 py-2
              ${riskConfig.bg} border border-slate-700/50
              rounded-full
            `}>
              <RiskIcon className={`w-4 h-4 ${riskConfig.color}`} />
              <span className={`text-sm font-light ${riskConfig.color}`}>
                {riskConfig.label}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna izquierda: EXO Score */}
              <div className="lg:col-span-1 space-y-6">
                {/* EXO Score Gauge */}
                <div className="
                  bg-slate-800/30 backdrop-blur-sm
                  border border-slate-700/50
                  rounded-xl p-6
                  flex flex-col items-center
                ">
                  <EXOScoreGauge
                    score={journey.exoScore}
                    label="EXO Score"
                    size="lg"
                    standardCategory={journey.department?.standardCategory || undefined}
                  />
                </div>

                {/* Info básica */}
                <div className="
                  bg-slate-800/30 backdrop-blur-sm
                  border border-slate-700/50
                  rounded-xl p-4
                  space-y-1
                ">
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Fecha de ingreso"
                    value={formatDate(journey.hireDate)}
                  />
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label="Días en la empresa"
                    value={`${daysSinceHire} días`}
                  />
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={journey.participantEmail}
                  />
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Teléfono"
                    value={journey.phoneNumber}
                  />
                </div>
              </div>

              {/* Columna derecha: Timeline y Scores */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Timeline 4C */}
                <div className="
                  bg-slate-800/30 backdrop-blur-sm
                  border border-slate-700/50
                  rounded-xl p-6
                ">
                  <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Progreso Metodología 4C
                  </h3>
                  <OnboardingTimeline
                    stages={timelineStages}
                    avgScore={journey.exoScore || 0}
                    totalJourneys={1}
                  />
                </div>

                {/* Scores 4C Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard
                    label="Compliance"
                    score={journey.complianceScore}
                    icon={<Shield className="w-4 h-4 text-cyan-400" />}
                    description="Primera impresión y cumplimiento"
                  />
                  <ScoreCard
                    label="Clarification"
                    score={journey.clarificationScore}
                    icon={<Lightbulb className="w-4 h-4 text-blue-400" />}
                    description="Claridad del rol"
                  />
                  <ScoreCard
                    label="Culture"
                    score={journey.cultureScore}
                    icon={<Users className="w-4 h-4 text-purple-400" />}
                    description="Integración cultural"
                  />
                  <ScoreCard
                    label="Connection"
                    score={journey.connectionScore}
                    icon={<Star className="w-4 h-4 text-emerald-400" />}
                    description="Conexión organizacional"
                  />
                </div>

                {/* Alertas - ✅ FIX 2: Ahora clickeables */}
                {journey.alerts && journey.alerts.length > 0 && (
                  <div className="
                    bg-slate-800/30 backdrop-blur-sm
                    border border-slate-700/50
                    rounded-xl p-6
                  ">
                    <h3 className="text-white font-light text-lg mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Alertas Activas ({journey.alerts.length})
                      <span className="text-xs text-slate-500 ml-2">
                        Click para gestionar
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {journey.alerts.map((alert) => (
                        <AlertItem 
                          key={alert.id} 
                          alert={alert}
                          onClick={() => handleAlertClick(alert)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - ✅ FIX 3: Botón "Ver Historial" eliminado (redundante) */}
          <div className="
            px-6 py-4
            border-t border-slate-800/50
            bg-slate-900/50
            flex items-center justify-end gap-3
          ">
            <NeutralButton onClick={onClose}>
              Cerrar
            </NeutralButton>
          </div>
        </motion.div>
      </motion.div>

      {/* ✅ FIX 2: Modal de Resolución de Alertas */}
      {selectedAlert && (
        <ResolutionModal
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolveAlert}
          alertType={selectedAlert.alert.alertType}
          employeeName={journey.fullName}
          businessCase={selectedAlert.businessCase}
        />
      )}
    </AnimatePresence>
  );
});

export default PipelineJourneyDetailModal;