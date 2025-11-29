// src/components/onboarding/pipeline/JourneyCard.tsx
// ============================================================================
// JOURNEY CARD - Pipeline Kanban Proactivo
// ============================================================================
//
// Card individual para cada journey en el Kanban
// Muestra: nombre, departamento, EXO Score, badge riesgo, días desde hire
//
// DISEÑO:
// ✅ Glassmorphism premium (bg-slate-900/50 backdrop-blur-lg)
// ✅ Animaciones Framer Motion suaves
// ✅ Badge riesgo predictivo con colores semánticos
// ✅ Click abre modal con detalle completo
//
// ============================================================================

'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Briefcase,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Journey } from '@/hooks/useOnboardingJourneys';
import { getDaysSinceHire, getRiskLabel, getExoScoreColor } from '@/hooks/useOnboardingJourneys';

// ============================================================================
// TYPES
// ============================================================================

interface JourneyCardProps {
  journey: Journey;
  onClick: (journey: Journey) => void;
}

// ============================================================================
// RISK BADGE CONFIG
// ============================================================================

const RISK_CONFIG = {
  critical: { 
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    icon: AlertTriangle,
    label: '🔥 Crítico'
  },
  high: { 
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    icon: AlertTriangle,
    label: '⚠️ Alto'
  },
  medium: { 
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    icon: TrendingDown,
    label: '📊 Medio'
  },
  low: { 
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    icon: TrendingUp,
    label: '✅ Bajo'
  },
  pending: { 
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    icon: Clock,
    label: '⏳ Sin Evaluar'
  }
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const JourneyCard = memo(function JourneyCard({ 
  journey, 
  onClick 
}: JourneyCardProps) {
  
  // Handler click
  const handleClick = useCallback(() => {
    onClick(journey);
  }, [journey, onClick]);
  
  // Calcular días desde contratación
  const daysSinceHire = getDaysSinceHire(journey.hireDate);
  
  // Obtener configuración de riesgo
  const riskKey = (journey.retentionRisk || 'pending') as keyof typeof RISK_CONFIG;
  const riskConfig = RISK_CONFIG[riskKey] || RISK_CONFIG.pending;
  const RiskIcon = riskConfig.icon;
  
  // Obtener color EXO Score
  const exoScoreColor = getExoScoreColor(journey.exoScore);
  
  // Contar alertas activas
  const activeAlerts = journey.alerts?.length || 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={handleClick}
      className={`
        bg-slate-900/50 backdrop-blur-lg 
        border border-slate-800/50 
        rounded-lg p-4 
        cursor-pointer 
        hover:border-cyan-500/30 
        hover:shadow-lg hover:shadow-cyan-500/5
        transition-colors duration-200
      `}
    >
      {/* ================================================================
          HEADER: Nombre + EXO Score
          ================================================================ */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-white font-medium truncate text-sm">
            {journey.fullName}
          </h4>
          <p className="text-slate-400 text-xs truncate mt-0.5">
            {journey.department?.displayName || 'Sin departamento'}
          </p>
        </div>
        
        {/* EXO Score Badge */}
        {journey.exoScore !== null && (
          <div className="flex-shrink-0">
            <div className={`
              px-2 py-1 rounded-md text-xs font-bold
              ${exoScoreColor === 'green' ? 'bg-green-500/10 text-green-400' :
                exoScoreColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' :
                exoScoreColor === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'}
            `}>
              {Math.round(journey.exoScore)}
            </div>
          </div>
        )}
      </div>
      
      {/* ================================================================
          BADGE RIESGO PREDICTIVO
          ================================================================ */}
      <div className="mb-3">
        <Badge 
          variant="outline"
          className={`
            ${riskConfig.bgColor} 
            ${riskConfig.textColor} 
            ${riskConfig.borderColor}
            text-xs 
            flex items-center gap-1 
            w-full justify-center 
            border py-1
          `}
        >
          <RiskIcon className="w-3 h-3" />
          <span>{riskConfig.label}</span>
        </Badge>
      </div>
      
      {/* ================================================================
          METADATA
          ================================================================ */}
      <div className="space-y-1.5">
        {/* Días desde contratación */}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>Día {daysSinceHire} desde ingreso</span>
        </div>
        
        {/* Alertas activas */}
        {activeAlerts > 0 && (
          <div className="flex items-center gap-2 text-orange-400 text-xs">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{activeAlerts} {activeAlerts === 1 ? 'alerta activa' : 'alertas activas'}</span>
          </div>
        )}
        
        {/* Posición (si existe) */}
        {journey.position && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{journey.position}</span>
          </div>
        )}
      </div>
      
      {/* ================================================================
          INDICADOR DE PROGRESO (mini)
          ================================================================ */}
      <div className="mt-3 pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((stage) => {
            const isCompleted = journey.currentStage > stage || 
              (journey.currentStage === stage && 
               journey[`stage${stage}CompletedAt` as keyof Journey]);
            const isCurrent = journey.currentStage === stage;
            
            return (
              <div 
                key={stage}
                className={`
                  h-1 flex-1 rounded-full
                  ${isCompleted ? 'bg-cyan-500' : 
                    isCurrent ? 'bg-cyan-500/50' : 
                    'bg-slate-700'}
                `}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-500">D1</span>
          <span className="text-[10px] text-slate-500">D7</span>
          <span className="text-[10px] text-slate-500">D30</span>
          <span className="text-[10px] text-slate-500">D90</span>
        </div>
      </div>
    </motion.div>
  );
});

export default JourneyCard;