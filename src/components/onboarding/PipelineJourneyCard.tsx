'use client';

// src/components/onboarding/PipelineJourneyCard.tsx
// ============================================================================
// JOURNEY CARD PREMIUM - DISEÑO FOCALIZAHR
// Glassmorphism + Hover effects + Mini timeline integrado
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Building2,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';

import type { Journey } from '@/hooks/useOnboardingJourneys';
import { getDaysSinceHire } from '@/hooks/useOnboardingJourneys';

// ============================================================================
// TIPOS
// ============================================================================

interface PipelineJourneyCardProps {
  journey: Journey;
  onClick: (journey: Journey) => void;
  stageColor?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRiskConfig(risk: string | null): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (risk) {
    case 'critical':
      return { 
        label: 'Crítico', 
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30'
      };
    case 'high':
      return { 
        label: 'Alto', 
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30'
      };
    case 'medium':
      return { 
        label: 'Medio', 
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
      };
    case 'low':
      return { 
        label: 'Bajo', 
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30'
      };
    default:
      return { 
        label: 'Pendiente', 
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30'
      };
  }
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-slate-500';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-cyan-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

// ============================================================================
// COMPONENTE: MINI PROGRESS BAR (4 etapas)
// ============================================================================

interface MiniProgressProps {
  currentStage: number;
  scores: {
    compliance: number | null;
    clarification: number | null;
    culture: number | null;
    connection: number | null;
  };
}

const MiniProgress = memo(function MiniProgress({ currentStage, scores }: MiniProgressProps) {
  const stages = [
    { key: 'compliance', score: scores.compliance, label: 'D1' },
    { key: 'clarification', score: scores.clarification, label: 'D7' },
    { key: 'culture', score: scores.culture, label: 'D30' },
    { key: 'connection', score: scores.connection, label: 'D90' }
  ];

  return (
    <div className="flex items-center gap-1 mt-3">
      {stages.map((stage, idx) => {
        const isCompleted = stage.score !== null;
        const isCurrent = currentStage === idx + 1;
        const isPending = currentStage < idx + 1;
        
        return (
          <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
            {/* Barra de progreso */}
            <div className={`
              h-1.5 w-full rounded-full transition-all duration-300
              ${isCompleted 
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' 
                : isCurrent 
                  ? 'bg-cyan-500/40 animate-pulse' 
                  : 'bg-slate-700/50'
              }
            `} />
            {/* Label */}
            <span className={`
              text-[10px] font-light
              ${isCompleted ? 'text-cyan-400' : isCurrent ? 'text-white' : 'text-slate-600'}
            `}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PipelineJourneyCard = memo(function PipelineJourneyCard({
  journey,
  onClick,
  stageColor = 'text-cyan-400'
}: PipelineJourneyCardProps) {
  
  const daysSinceHire = useMemo(() => getDaysSinceHire(journey.hireDate), [journey.hireDate]);
  const riskConfig = useMemo(() => getRiskConfig(journey.retentionRisk), [journey.retentionRisk]);
  const scoreColor = useMemo(() => getScoreColor(journey.exoScore), [journey.exoScore]);
  const hasAlerts = journey.alerts && journey.alerts.length > 0;

  return (
    <motion.button
      onClick={() => onClick(journey)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left
        relative overflow-hidden
        bg-slate-800/50 backdrop-blur-sm
        border border-slate-700/50
        rounded-xl p-4
        transition-all duration-300
        hover:bg-slate-800/70
        hover:border-slate-600/50
        hover:shadow-lg hover:shadow-black/20
        group
      `}
    >
      {/* Gradient overlay on hover */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-br from-cyan-500/5 to-purple-500/5
        transition-opacity duration-300
      " />

      {/* Indicador de alertas */}
      {hasAlerts && (
        <div className="absolute top-3 right-3">
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="relative space-y-3">
        
        {/* Header: Nombre y departamento */}
        <div>
          <h4 className="text-white font-medium text-sm truncate pr-6">
            {journey.fullName}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400 truncate">
              {journey.department?.displayName || 'Sin asignar'}
            </span>
          </div>
        </div>

        {/* Badge de riesgo + EXO Score */}
        <div className="flex items-center justify-between">
          <div className={`
            inline-flex items-center gap-1.5 px-2 py-1
            ${riskConfig.bg} ${riskConfig.border} border
            rounded-full
          `}>
            <span className={`text-xs font-light ${riskConfig.color}`}>
              {riskConfig.label}
            </span>
          </div>
          
          {journey.exoScore !== null && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`w-3 h-3 ${scoreColor}`} />
              <span className={`text-sm font-medium ${scoreColor}`}>
                {Math.round(journey.exoScore)}
              </span>
            </div>
          )}
        </div>

        {/* Metadata: Días y cargo */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Día {daysSinceHire}</span>
          </div>
          {journey.position && (
            <div className="flex items-center gap-1 truncate">
              <Briefcase className="w-3 h-3" />
              <span className="truncate">{journey.position}</span>
            </div>
          )}
        </div>

        {/* Mini timeline */}
        <MiniProgress 
          currentStage={journey.currentStage}
          scores={{
            compliance: journey.complianceScore,
            clarification: journey.clarificationScore,
            culture: journey.cultureScore,
            connection: journey.connectionScore
          }}
        />
      </div>
    </motion.button>
  );
});

export default PipelineJourneyCard;