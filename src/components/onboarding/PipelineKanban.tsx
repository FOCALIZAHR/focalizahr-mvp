'use client';

// src/components/onboarding/PipelineKanban.tsx
// ============================================================================
// KANBAN BOARD PREMIUM - DISEÑO FOCALIZAHR
// Iconos Lucide monocromáticos (estilo Apple/Tesla)
// ============================================================================

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox,
  AlertCircle,
  Loader2,
  FileText,
  Shield,
  Lightbulb,
  Users,
  Star
} from 'lucide-react';

import type { Journey } from '@/hooks/useOnboardingJourneys';
import { STAGE_CONFIG } from '@/hooks/useOnboardingJourneys';
import PipelineJourneyCard from './PipelineJourneyCard';

// ============================================================================
// ICONOS POR STAGE
// ============================================================================

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Shield,
  Lightbulb,
  Users,
  Star
};

// ============================================================================
// TIPOS
// ============================================================================

interface PipelineKanbanProps {
  journeysByStage: Map<number, Journey[]>;
  loading?: boolean;
  error?: string | null;
  onJourneyClick: (journey: Journey) => void;
}

interface KanbanColumnProps {
  stage: typeof STAGE_CONFIG[number];
  journeys: Journey[];
  onJourneyClick: (journey: Journey) => void;
  index: number;
}

// ============================================================================
// COLORES POR STAGE (gradientes corporativos)
// ============================================================================

const STAGE_COLORS: Record<number, {
  gradient: string;
  border: string;
  bg: string;
  text: string;
  glow: string;
}> = {
  0: {
    gradient: 'from-slate-500/20 to-slate-600/10',
    border: 'border-slate-600/30',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/10'
  },
  1: {
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20'
  },
  2: {
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  3: {
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  4: {
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20'
  }
};

// ============================================================================
// COMPONENTE: COLUMNA KANBAN
// ============================================================================

const KanbanColumn = memo(function KanbanColumn({
  stage,
  journeys,
  onJourneyClick,
  index
}: KanbanColumnProps) {
  const colors = STAGE_COLORS[stage.stage];
  const hasJourneys = journeys.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex flex-col h-full min-w-[300px] max-w-[320px]"
    >
      {/* Header de columna con glassmorphism */}
      <div className={`
        relative overflow-hidden
        bg-slate-900/60 backdrop-blur-xl
        border ${colors.border}
        rounded-2xl p-4 mb-4
        transition-all duration-300
      `}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`} />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icono Lucide en lugar de emoji */}
            <div className={`
              w-10 h-10 rounded-xl
              bg-gradient-to-br ${colors.gradient}
              flex items-center justify-center
            `}>
              {(() => {
                const IconComponent = STAGE_ICONS[stage.icon];
                return IconComponent ? (
                  <IconComponent className={`w-5 h-5 ${colors.text}`} />
                ) : null;
              })()}
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{stage.title}</h3>
              <p className="text-slate-500 text-xs font-light">{stage.description}</p>
            </div>
          </div>
          
          {/* Badge contador */}
          <div className={`
            min-w-[32px] h-8 px-2.5
            flex items-center justify-center
            ${colors.bg} ${colors.border} border
            rounded-full
          `}>
            <span className={`text-sm font-medium ${colors.text}`}>
              {journeys.length}
            </span>
          </div>
        </div>
      </div>

      {/* Área de cards con scroll */}
      <div className={`
        flex-1 
        bg-slate-900/30 backdrop-blur-sm
        border border-slate-800/50
        rounded-2xl p-3
        overflow-y-auto
        min-h-[400px] max-h-[calc(100vh-400px)]
        scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent
      `}>
        {hasJourneys ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {journeys.map((journey, idx) => (
                <motion.div
                  key={journey.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  layout
                >
                  <PipelineJourneyCard
                    journey={journey}
                    onClick={onJourneyClick}
                    stageColor={colors.text}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Estado vacío elegante */
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className={`
              w-16 h-16 rounded-2xl mb-4
              bg-gradient-to-br ${colors.gradient}
              flex items-center justify-center
            `}>
              <Inbox className={`w-8 h-8 ${colors.text} opacity-50`} />
            </div>
            <p className="text-slate-500 text-sm font-light">
              Sin journeys en esta etapa
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL: KANBAN BOARD
// ============================================================================

const PipelineKanban = memo(function PipelineKanban({
  journeysByStage,
  loading,
  error,
  onJourneyClick
}: PipelineKanbanProps) {
  
  // Estado de loading
  if (loading) {
    return (
      <div className="
        flex items-center justify-center 
        min-h-[500px]
        bg-slate-900/30 backdrop-blur-sm
        border border-slate-800/50
        rounded-2xl
      ">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-light">Cargando journeys...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="
        flex items-center justify-center 
        min-h-[500px]
        bg-red-500/5 backdrop-blur-sm
        border border-red-500/20
        rounded-2xl
      ">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-light mb-2">Error cargando datos</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="
      overflow-x-auto pb-4
      scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent
    ">
      <div className="flex gap-4 min-w-max">
        {STAGE_CONFIG.map((stage, index) => (
          <KanbanColumn
            key={stage.stage}
            stage={stage}
            journeys={journeysByStage.get(stage.stage) || []}
            onJourneyClick={onJourneyClick}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

export default PipelineKanban;